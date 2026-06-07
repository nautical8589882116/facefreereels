import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getOAuthURL } from '../config/oauth';
import { successResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import * as OAuthService from '../services/oauth.service';

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET!;

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

// ── Routes ────────────────────────────────────────────────────────────

/**
 * GET /api/oauth/:platform/auth
 * Initiate OAuth flow for a platform (instagram, facebook, youtube)
 * Query: ?redirectUrl (optional) - frontend URL to redirect after callback
 */
router.get('/:platform/auth', async (req: AuthRequest, res, next) => {
  try {
    const { platform } = req.params;
    const userId = req.user?.userId;

    if (!OAuthService.isValidOAuthPlatform(platform)) {
      throw new ApiError(400, 'Invalid platform. Must be instagram, facebook, or youtube.');
    }

    if (!userId) {
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
router.get('/:platform/callback', async (req, res, next) => {
  try {
    const { platform } = req.params;
    const { code, state, error, error_description } = req.query as Record<string, string>;

    const frontendUrl = process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173';

    // Handle OAuth errors from platform
    if (error) {
      console.error(`OAuth error for ${platform}:`, error, error_description);
      return res.redirect(
        `${frontendUrl}/settings/connections?error=${encodeURIComponent(error_description || error)}`
      );
    }

    if (!code) {
      return res.redirect(
        `${frontendUrl}/settings/connections?error=${encodeURIComponent('Authorization code missing')}`
      );
    }

    if (!OAuthService.isValidOAuthPlatform(platform)) {
      return res.redirect(
        `${frontendUrl}/settings/connections?error=${encodeURIComponent('Invalid platform')}`
      );
    }

    // Verify state token
    let userId: string;
    try {
      const decoded = verifyStateToken(state);
      userId = decoded.userId;

      if (decoded.platform !== platform) {
        throw new Error('Platform mismatch in state token');
      }
    } catch {
      return res.redirect(
        `${frontendUrl}/settings/connections?error=${encodeURIComponent('Invalid or expired state token')}`
      );
    }

    // Step 1: Exchange code for access token
    const tokenData = await OAuthService.exchangeCodeForToken(platform, code);

    // Step 2: Fetch account info from the platform
    const accountInfo = await OAuthService.fetchAccountInfo(platform, tokenData.accessToken);

    // Step 3: Store/update connected account
    await OAuthService.storeConnectedAccount(userId, platform, tokenData, accountInfo);

    // Step 4: Redirect to frontend settings page with success
    res.redirect(`${frontendUrl}/settings/connections?success=${encodeURIComponent(`${platform} connected successfully`)}`);
  } catch (error) {
    const frontendUrl = process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173';

    if (error instanceof ApiError) {
      return res.redirect(
        `${frontendUrl}/settings/connections?error=${encodeURIComponent(error.message)}`
      );
    }

    console.error('OAuth callback error:', error);
    res.redirect(
      `${frontendUrl}/settings/connections?error=${encodeURIComponent('Failed to connect account')}`
    );
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

    const { getConnectionStatus } = await import('../services/platform.service');
    const status = await getConnectionStatus(userId);

    successResponse(res, status);
  } catch (error) {
    next(error);
  }
});

export default router;
