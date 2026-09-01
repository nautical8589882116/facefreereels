import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getOAuthURL } from '../config/oauth';
import { verifyAccessToken } from '../config/auth';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import * as OAuthServiceRaw from '../services/oauth.service';
import * as PlatformServiceRaw from '../services/platform.service';
import { extractPlatformError } from '../services/publisher.service';
import { instrumentServiceModule } from '../utils/logger';

const router = Router();
const OAuthService = instrumentServiceModule('OAuthService', OAuthServiceRaw);
const PlatformService = instrumentServiceModule('PlatformService', PlatformServiceRaw);

// ── Helpers ───────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET!;

// Most recent Meta user token, kept in memory only so a failed callback can
// report what Meta actually returned. Never persisted, never sent to a client.
let lastMetaToken: string | undefined;

/**
 * Generate a state token (JWT) containing userId and platform
 * for secure OAuth callback validation
 */
function generateStateToken(userId: string, platform: string): string {
  return jwt.sign({ userId, platform, type: 'oauth_state' }, JWT_SECRET, {
    expiresIn: '10m',
  });
}

/**
 * Verify and decode the state token from OAuth callback
 */
function verifyStateToken(token: string): { userId: string; platform: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string; platform: string };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render a self-closing popup page. On success it auto-closes (the opener then
 * refetches accounts); on failure it shows the real reason so it isn't silent.
 * Either way it postMessages the result back to the opener window.
 */
function sendPopup(res: Response, ok: boolean, platform: string, message: string) {
  const safeMsg = escapeHtml(message);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${
    ok ? 'Connected' : 'Connection failed'
  }</title></head>
<body style="font-family:system-ui,Segoe UI,Arial;background:#0f0f12;color:#fff;display:grid;place-items:center;height:100vh;margin:0">
  <div style="max-width:440px;text-align:center;padding:24px">
    <div style="font-size:44px;margin-bottom:12px">${ok ? '&#9989;' : '&#9888;&#65039;'}</div>
    <h2 style="margin:0 0 8px">${ok ? `${escapeHtml(platform)} connected` : 'Connection failed'}</h2>
    <p style="opacity:.8;line-height:1.5;word-break:break-word">${safeMsg}</p>
    ${
      ok
        ? '<p style="opacity:.6;margin-top:16px">Closing&hellip;</p>'
        : '<button onclick="window.close()" style="margin-top:18px;padding:10px 22px;border:0;border-radius:8px;background:#6d5efc;color:#fff;font-size:14px;cursor:pointer">Close</button>'
    }
  </div>
  <script>
    try { window.opener && window.opener.postMessage({ type: 'oauth', ok: ${ok}, platform: ${JSON.stringify(
      platform
    )}, message: ${JSON.stringify(message)} }, '*'); } catch (e) {}
    ${ok ? 'setTimeout(function(){ window.close(); }, 1000);' : ''}
  </script>
</body></html>`;
  res.status(ok ? 200 : 400).send(html);
}

// ── Routes ────────────────────────────────────────────────────────────

/**
 * GET /api/oauth/:platform/auth
 * Initiate OAuth flow for a platform (instagram, facebook, youtube)
 * Query: ?redirectUrl (optional) - frontend URL to redirect after callback
 */
router.get('/:platform/auth', async (req: AuthRequest, res, next) => {
  try {
    const { platform } = req.params;

    if (!OAuthService.isValidOAuthPlatform(platform)) {
      throw new ApiError(400, 'Invalid platform. Must be instagram, facebook, or youtube.');
    }

    // Opened in a popup, so no Authorization header is available. Accept the
    // access token via ?token= (with a Bearer header fallback) and verify it.
    const headerToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : undefined;
    const token = (req.query.token as string) || headerToken;

    let userId: string;
    try {
      if (!token) throw new Error('missing token');
      userId = verifyAccessToken(token).userId;
    } catch {
      throw new ApiError(401, 'Authentication required to connect a platform account');
    }

    // Generate state token
    const state = generateStateToken(userId, platform);

    // Build authorization URL
    const authUrl = getOAuthURL(platform as 'instagram' | 'facebook' | 'youtube', state);

    // Redirect user to platform's OAuth page
    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/oauth/:platform/callback
 * OAuth callback handler — exchanges code for token, fetches account info,
 * stores in PlatformAccount table, and redirects to frontend
 */
router.get('/:platform/callback', async (req, res) => {
  const { platform } = req.params;
  const { code, state, error, error_description } = req.query as Record<string, string>;

  try {
    // Errors handed back by the platform itself (user denied, etc.)
    if (error) {
      console.error(`OAuth error for ${platform}:`, error, error_description);
      return sendPopup(res, false, platform, error_description || error);
    }
    if (!code) {
      return sendPopup(res, false, platform, 'Authorization code missing.');
    }
    if (!OAuthService.isValidOAuthPlatform(platform)) {
      return sendPopup(res, false, platform, 'Invalid platform.');
    }

    // Verify state token → resolve which user initiated this.
    let userId: string;
    try {
      const decoded = verifyStateToken(state);
      userId = decoded.userId;
      if (decoded.platform !== platform) {
        throw new Error('Platform mismatch in state token');
      }
    } catch {
      return sendPopup(res, false, platform, 'Invalid or expired session. Click Connect again.');
    }

    // 1. code → token, 2. fetch account, 3. store.
    const tokenData = await OAuthService.exchangeCodeForToken(platform, code);
    lastMetaToken = tokenData.accessToken;
    const accountInfo = await OAuthService.fetchAccountInfo(platform, tokenData.accessToken);
    await OAuthService.storeConnectedAccount(userId, platform, tokenData, accountInfo);

    return sendPopup(res, true, platform, `${accountInfo.accountName} connected.`);
  } catch (err) {
    console.error('OAuth callback error:', err);

    // If we got as far as a token, ask Meta directly what it will and won't
    // tell us. Without this the failure is indistinguishable from a dozen
    // different causes (dead API version, ungranted scope, no Page, no linked
    // Instagram) and every one of them looks like "connection failed".
    if ((platform === 'facebook' || platform === 'instagram') && lastMetaToken) {
      try {
        const diag = await OAuthService.metaDiagnostics(lastMetaToken);
        console.error(
          `\n────── META CONNECT DIAGNOSTICS (${platform}) ──────\n` +
            JSON.stringify(diag, null, 2) +
            '\n────────────────────────────────────────────────\n'
        );
      } catch (diagErr) {
        console.error('Failed to collect Meta diagnostics:', diagErr);
      }
    }

    const message = err instanceof ApiError ? err.message : extractPlatformError(err);
    return sendPopup(res, false, platform, message);
  }
});

/**
 * GET /api/oauth/status
 * Get OAuth connection status for all platforms (requires auth)
 */
router.get('/status', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(401, 'Authentication required');
    }

    const status = await PlatformService.getConnectionStatus(userId);

    successResponse(res, status);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/oauth/meta/probe
 * Report which Facebook Graph API versions Meta still serves, and which one
 * this backend is configured to use. Purely diagnostic; exposes no user data.
 */
router.get('/meta/probe', async (_req, res, next) => {
  try {
    const versions = await OAuthService.probeGraphVersions();
    successResponse(res, { configured: process.env.META_GRAPH_VERSION || 'v23.0', versions });
  } catch (error) {
    next(error);
  }
});

export default router;
