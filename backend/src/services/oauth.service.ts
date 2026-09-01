import axios from 'axios';
import { OAUTH_PROVIDERS, META_GRAPH, META_GRAPH_VERSION } from '../config/oauth';
import { ApiError } from '../middleware/errorHandler';
import * as PlatformService from './platform.service';

// ── Types ─────────────────────────────────────────────────────────────

export type OAuthPlatform = 'instagram' | 'facebook' | 'youtube';

export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface AccountInfo {
  accountName: string;
  accountId: string;
  profileUrl?: string;
  followerCount?: number;
}

// ── Platform Validation ───────────────────────────────────────────────

const VALID_PLATFORMS: OAuthPlatform[] = ['instagram', 'facebook', 'youtube'];

export function isValidOAuthPlatform(value: string): value is OAuthPlatform {
  return VALID_PLATFORMS.includes(value as OAuthPlatform);
}

// ── Token Exchange ────────────────────────────────────────────────────

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  platform: OAuthPlatform,
  code: string
): Promise<OAuthTokenResponse> {
  const config = OAUTH_PROVIDERS[platform];
  const redirectUri = `${process.env.BACKEND_URL}${config.callbackURL}`;

  if (platform === 'youtube') {
    // Google OAuth token exchange
    const response = await axios.post(
      config.tokenURL,
      new URLSearchParams({
        code,
        client_id: config.clientID,
        client_secret: config.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token, expires_in } = response.data;
    const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : undefined;

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt,
    };
  }

  // Facebook/Instagram token exchange
  const response = await axios.get(config.tokenURL, {
    params: {
      code,
      client_id: config.clientID,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri,
    },
  });

  const { access_token, expires_in } = response.data;

  // Exchange for long-lived token (Facebook/Instagram)
  let longLivedToken = access_token;
  let expiresAt: Date | undefined;

  if (platform === 'facebook' || platform === 'instagram') {
    try {
      const llResponse = await axios.get(
        `${META_GRAPH}/oauth/access_token`,
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: config.clientID,
            client_secret: config.clientSecret,
            fb_exchange_token: access_token,
          },
        }
      );
      longLivedToken = llResponse.data.access_token;
      if (llResponse.data.expires_in) {
        expiresAt = new Date(Date.now() + llResponse.data.expires_in * 1000);
      }
    } catch (err) {
      // Fall back to short-lived token
      console.warn('Failed to exchange for long-lived token, using short-lived token');
      if (expires_in) {
        expiresAt = new Date(Date.now() + expires_in * 1000);
      }
    }
  }

  return {
    accessToken: longLivedToken,
    expiresAt,
  };
}

// ── Account Info Fetching ─────────────────────────────────────────────

/**
 * Fetch Facebook page info from Graph API.
 * Falls back to the user's personal profile if they have no managed Pages.
 */
async function fetchFacebookAccountInfo(accessToken: string): Promise<AccountInfo> {
  let pages: any[] = [];

  try {
    const pagesResponse = await axios.get(`${META_GRAPH}/me/accounts`, {
      params: {
        access_token: accessToken,
        // Keep this list to documented Page fields only. Graph rejects the
        // ENTIRE request if any single field is unknown, which would look
        // identical to "user has no Pages".
        fields: 'id,name,fan_count,link',
      },
    });
    pages = pagesResponse.data?.data ?? [];
    console.log('[OAuth:FB] Pages returned:', pages.map((p: any) => `${p.name} (${p.id})`));
  } catch (err: any) {
    // Distinguish "the call failed" from "there are no Pages" — previously both
    // produced the same misleading "no Page" message.
    const graphError = err?.response?.data?.error;
    console.error('[OAuth:FB] /me/accounts failed:', graphError || err?.message);
    throw new ApiError(
      400,
      `Facebook rejected the Pages lookup: ${graphError?.message || err?.message}. ` +
        'This usually means the pages_show_list / pages_manage_posts permissions were not granted. ' +
        'Click Connect again and make sure you tick your Page on the "What Pages do you want to use?" screen.'
    );
  }

  if (pages.length > 0) {
    const page = pages[0];
    return {
      accountName: page.name,
      accountId: page.id,
      profileUrl: page.link || `https://facebook.com/${page.id}`,
      followerCount: page.fan_count || 0,
    };
  }

  // No Page → refuse to connect. Storing the personal profile here would create
  // an account that always fails at publish time, because the Graph API only
  // allows publishing to Pages.
  throw new ApiError(
    400,
    'No Facebook Page available on this account. Facebook only allows publishing to a Page, not a personal profile. ' +
      'If you have a Page, click Connect again and tick it on the "What Pages do you want to use?" screen. ' +
      'If you do not have one, create it at facebook.com/pages/create first.'
  );
}

/**
 * Fetch Instagram account info via the Facebook Graph API.
 *
 * Instagram publishing always goes through the Facebook Page that the IG
 * Professional account is linked to, so every lookup here is Page-based:
 *  1. /me/accounts expanding instagram_business_account   (Business accounts)
 *  2. /me/accounts expanding connected_instagram_account  (Business + Creator)
 *  3. each Page node queried directly, one edge at a time
 * Each attempt is isolated so one rejected field cannot mask a real account.
 */
async function fetchInstagramAccountInfo(accessToken: string): Promise<AccountInfo> {
  const IG_SUBFIELDS = 'id,username,profile_picture_url,followers_count';
  const seenPages: string[] = [];
  const attemptErrors: string[] = [];

  /**
   * Ask /me/accounts for ONE Instagram edge at a time.
   *
   * This is the core fix: the previous code requested
   *   instagram_business_account{...},connected_instagram_account{...}
   * in a single field list. Graph validates field lists atomically, so if
   * either edge is unknown for this API version or permission set, the whole
   * request 400s with "nonexisting field" — and a perfectly well-linked
   * Instagram Professional account looks like it does not exist at all.
   */
  async function tryPagesEdge(edge: 'instagram_business_account' | 'connected_instagram_account') {
    const { data } = await axios.get(`${META_GRAPH}/me/accounts`, {
      params: { access_token: accessToken, fields: `id,name,${edge}{${IG_SUBFIELDS}}` },
    });
    const pages: any[] = data?.data ?? [];
    for (const page of pages) {
      if (!seenPages.includes(page.name)) seenPages.push(page.name);
      const ig = page[edge];
      if (ig?.id) {
        console.log(`[OAuth:IG] Found @${ig.username} via ${edge} on page "${page.name}"`);
        return {
          accountName: ig.username,
          accountId: ig.id,
          profileUrl: `https://instagram.com/${ig.username}`,
          followerCount: ig.followers_count || 0,
        } as AccountInfo;
      }
    }
    return null;
  }

  for (const edge of ['instagram_business_account', 'connected_instagram_account'] as const) {
    try {
      const found = await tryPagesEdge(edge);
      if (found) return found;
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message;
      console.warn(`[OAuth:IG] /me/accounts ${edge} lookup failed:`, msg);
      attemptErrors.push(`${edge}: ${msg}`);
    }
  }

  // Fallback: query each Page node directly. Some permission sets expose the
  // IG link on the Page node but not through the /me/accounts edge expansion.
  try {
    const { data } = await axios.get(`${META_GRAPH}/me/accounts`, {
      params: { access_token: accessToken, fields: 'id,name' },
    });
    for (const page of (data?.data ?? []) as any[]) {
      if (!seenPages.includes(page.name)) seenPages.push(page.name);
      for (const edge of ['instagram_business_account', 'connected_instagram_account']) {
        try {
          const { data: node } = await axios.get(`${META_GRAPH}/${page.id}`, {
            params: { access_token: accessToken, fields: `${edge}{${IG_SUBFIELDS}}` },
          });
          const ig = node?.[edge];
          if (ig?.id) {
            console.log(`[OAuth:IG] Found @${ig.username} on page node "${page.name}" via ${edge}`);
            return {
              accountName: ig.username,
              accountId: ig.id,
              profileUrl: `https://instagram.com/${ig.username}`,
              followerCount: ig.followers_count || 0,
            };
          }
        } catch {
          /* try the next edge */
        }
      }
    }
  } catch (err: any) {
    const msg = err?.response?.data?.error?.message || err?.message;
    console.warn('[OAuth:IG] Per-page node lookup failed:', msg);
    attemptErrors.push(`page-node: ${msg}`);
  }

  // ── Nothing found — say exactly what we saw, not just "not found". ────
  const sawPages = seenPages.length
    ? `Facebook Pages visible to this app: ${seenPages.join(', ')}.`
    : 'This app could not see ANY Facebook Page for your account — grant Page access on the "What Pages do you want to use?" screen when connecting.';

  throw new ApiError(
    400,
    `No Instagram Professional account is linked to your Facebook Pages. ${sawPages} ` +
      'Fix: Instagram app → Settings → Account type and tools → Switch to Professional account, ' +
      'then Instagram → Edit profile → Page → link your Facebook Page. Then connect again.' +
      (attemptErrors.length ? ` (Graph reported: ${attemptErrors.join(' | ')})` : '')
  );
}

/**
 * Fetch YouTube channel info
 */
async function fetchYouTubeAccountInfo(accessToken: string): Promise<AccountInfo> {
  const response = await axios.get(
    'https://www.googleapis.com/youtube/v3/channels',
    {
      params: {
        part: 'snippet,statistics',
        mine: 'true',
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const channels = response.data.items;

  if (!channels || channels.length === 0) {
    throw new ApiError(400, 'No YouTube channel found for this account');
  }

  const channel = channels[0];

  return {
    accountName: channel.snippet.title,
    accountId: channel.id,
    profileUrl: `https://youtube.com/channel/${channel.id}`,
    followerCount: parseInt(channel.statistics?.subscriberCount || '0', 10),
  };
}

/**
 * Fetch account info based on platform
 */
export async function fetchAccountInfo(
  platform: OAuthPlatform,
  accessToken: string
): Promise<AccountInfo> {
  switch (platform) {
    case 'instagram':
      return fetchInstagramAccountInfo(accessToken);
    case 'facebook':
      return fetchFacebookAccountInfo(accessToken);
    case 'youtube':
      return fetchYouTubeAccountInfo(accessToken);
    default:
      throw new ApiError(400, 'Unsupported platform');
  }
}


// ── Diagnostics ───────────────────────────────────────────────────────

/**
 * Probe which Graph API versions Meta still serves.
 *
 * Meta sunsets each version ~2 years after release, and a dead version fails
 * with an opaque error that is easy to mistake for a permissions problem. We
 * deliberately send a junk token: a LIVE version rejects it with OAuthException
 * code 190 ("Invalid OAuth access token"), while a DEAD version complains about
 * the version itself before ever looking at the token.
 */
export async function probeGraphVersions(): Promise<Record<string, string>> {
  const versions = ['v18.0', 'v19.0', 'v20.0', 'v21.0', 'v22.0', 'v23.0', 'v24.0', 'v25.0', 'v26.0'];
  const out: Record<string, string> = {};

  await Promise.all(
    versions.map(async (v) => {
      try {
        await axios.get(`https://graph.facebook.com/${v}/me`, {
          params: { access_token: 'probe_invalid_token' },
          timeout: 15000,
        });
        out[v] = 'ALIVE (unexpected success)';
      } catch (err: any) {
        const e = err?.response?.data?.error;
        if (!e) {
          out[v] = `UNKNOWN (${err?.message})`;
        } else if (e.code === 190) {
          // Reached token validation → the version itself is served.
          out[v] = 'ALIVE';
        } else {
          out[v] = `DEAD/UNSUPPORTED (code ${e.code}: ${e.message})`;
        }
      }
    })
  );

  return out;
}

/**
 * Dump everything Meta will tell us about a freshly-issued user token:
 * which permissions were actually granted, which Pages are visible, and
 * whether an Instagram account hangs off either Page edge.
 *
 * Each sub-call is isolated so one failure cannot hide the other answers.
 */
export async function metaDiagnostics(accessToken: string): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = { graphVersion: META_GRAPH_VERSION };

  const call = async (label: string, url: string, params: Record<string, string>) => {
    try {
      const { data } = await axios.get(url, { params: { access_token: accessToken, ...params } });
      out[label] = data;
    } catch (err: any) {
      out[label] = { ERROR: err?.response?.data?.error || err?.message };
    }
  };

  await call('grantedPermissions', `${META_GRAPH}/me/permissions`, {});
  await call('user', `${META_GRAPH}/me`, { fields: 'id,name' });
  await call('pages', `${META_GRAPH}/me/accounts`, { fields: 'id,name,fan_count' });
  await call('pages_instagram_business_account', `${META_GRAPH}/me/accounts`, {
    fields: 'id,name,instagram_business_account{id,username}',
  });
  await call('pages_connected_instagram_account', `${META_GRAPH}/me/accounts`, {
    fields: 'id,name,connected_instagram_account{id,username}',
  });

  return out;
}

// ── Account Storage ───────────────────────────────────────────────────

/**
 * Store or update connected platform account
 */
export async function storeConnectedAccount(
  userId: string,
  platform: OAuthPlatform,
  tokenData: OAuthTokenResponse,
  accountInfo: AccountInfo
): Promise<void> {
  const platformUpper = platform.toUpperCase() as PlatformService.Platform;

  await PlatformService.connectAccount(userId, platformUpper, {
    accountName: accountInfo.accountName,
    accountId: accountInfo.accountId,
    profileUrl: accountInfo.profileUrl,
    followerCount: accountInfo.followerCount,
    accessToken: tokenData.accessToken,
    refreshToken: tokenData.refreshToken,
    expiresAt: tokenData.expiresAt,
  });
}
