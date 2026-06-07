import axios from 'axios';
import { OAUTH_PROVIDERS } from '../config/oauth';
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
        'https://graph.facebook.com/v18.0/oauth/access_token',
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
 * Fetch Facebook page info from Graph API
 */
async function fetchFacebookAccountInfo(accessToken: string): Promise<AccountInfo> {
  // Get user's pages
  const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
    params: {
      access_token: accessToken,
      fields: 'id,name,picture,followers_count,fan_count,link',
    },
  });

  const pages = pagesResponse.data.data;

  if (!pages || pages.length === 0) {
    throw new ApiError(400, 'No Facebook pages found for this account');
  }

  // Use the first page
  const page = pages[0];

  return {
    accountName: page.name,
    accountId: page.id,
    profileUrl: page.link || `https://facebook.com/${page.id}`,
    followerCount: page.fan_count || page.followers_count || 0,
  };
}

/**
 * Fetch Instagram Business account info via Facebook Graph API
 */
async function fetchInstagramAccountInfo(accessToken: string): Promise<AccountInfo> {
  // Step 1: Get user's Facebook pages
  const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
    params: {
      access_token: accessToken,
      fields: 'id,name,instagram_business_account{id,username,profile_picture_url,followers_count}',
    },
  });

  const pages = pagesResponse.data.data;

  if (!pages || pages.length === 0) {
    throw new ApiError(400, 'No Facebook pages found. Instagram requires a connected Facebook page.');
  }

  // Find a page with an Instagram Business account connected
  const pageWithIG = pages.find(
    (p: any) => p.instagram_business_account
  );

  if (!pageWithIG) {
    throw new ApiError(
      400,
      'No Instagram Business account connected to any Facebook page. Please connect your Instagram Business account to a Facebook page first.'
    );
  }

  const igAccount = pageWithIG.instagram_business_account;

  return {
    accountName: igAccount.username,
    accountId: igAccount.id,
    profileUrl: `https://instagram.com/${igAccount.username}`,
    followerCount: igAccount.followers_count || 0,
  };
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
