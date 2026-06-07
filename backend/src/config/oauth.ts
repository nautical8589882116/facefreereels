// ─── OAuth Configuration ─────────────────────────────────────

export const OAUTH_PROVIDERS = {
  instagram: {
    clientID: process.env.INSTAGRAM_CLIENT_ID!,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET!,
    callbackURL: process.env.INSTAGRAM_CALLBACK_URL || '/api/auth/instagram/callback',
    scope: ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement'],
    authURL: 'https://api.instagram.com/oauth/authorize',
    tokenURL: 'https://api.instagram.com/oauth/access_token',
  },
  facebook: {
    clientID: process.env.FACEBOOK_CLIENT_ID!,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || '/api/auth/facebook/callback',
    scope: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list', 'instagram_basic'],
    authURL: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenURL: 'https://graph.facebook.com/v18.0/oauth/access_token',
  },
  youtube: {
    clientID: process.env.YOUTUBE_CLIENT_ID! || process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET! || process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: process.env.YOUTUBE_CALLBACK_URL || '/api/auth/youtube/callback',
    scope: [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
    ],
    authURL: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenURL: 'https://oauth2.googleapis.com/token',
  },
}

export function getOAuthURL(provider: 'instagram' | 'facebook' | 'youtube', state: string): string {
  const cfg = OAUTH_PROVIDERS[provider]
  const params = new URLSearchParams({
    client_id: cfg.clientID,
    redirect_uri: `${process.env.BACKEND_URL}${cfg.callbackURL}`,
    scope: cfg.scope.join(','),
    response_type: 'code',
    state,
  })

  if (provider === 'youtube') {
    params.set('access_type', 'offline')
    params.set('prompt', 'consent')
  }

  return `${cfg.authURL}?${params.toString()}`
}
