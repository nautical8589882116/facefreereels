// ─── OAuth Configuration ─────────────────────────────────────

// Meta guarantees each Graph API version for ~2 years after release, then
// sunsets it. v18.0 shipped Sept 2023, so it is long past end-of-life: calls
// against it fail with an opaque 400, and — critically — so does the
// https://www.facebook.com/<version>/dialog/oauth login screen itself, which
// is why connecting Facebook/Instagram silently never completed.
// Keep this current; override with META_GRAPH_VERSION if Meta moves again.
export const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v23.0'
export const META_GRAPH = `https://graph.facebook.com/${META_GRAPH_VERSION}`

export const OAUTH_PROVIDERS = {
  instagram: {
    clientID: process.env.INSTAGRAM_CLIENT_ID!,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET!,
    callbackURL: process.env.INSTAGRAM_CALLBACK_URL || '/api/oauth/instagram/callback',
    // business_management is required for Pages managed under a Meta Business
    // Portfolio: without it, /me/accounts silently returns an empty list even
    // though pages_show_list itself shows as "granted" (a well-documented Graph
    // API gotcha, not specific to this app).
    scope: ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement', 'pages_show_list', 'business_management'],
    authURL: `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth`,
    tokenURL: `${META_GRAPH}/oauth/access_token`,
  },
  facebook: {
    clientID: process.env.FACEBOOK_CLIENT_ID!,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || '/api/oauth/facebook/callback',
    scope: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list', 'business_management'],
    authURL: `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth`,
    tokenURL: `${META_GRAPH}/oauth/access_token`,
  },
  youtube: {
    clientID: process.env.YOUTUBE_CLIENT_ID! || process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET! || process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: process.env.YOUTUBE_CALLBACK_URL || '/api/oauth/youtube/callback',
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
  // Google (YouTube) requires space-separated scopes; Meta (FB/IG) uses commas.
  const scopeSeparator = provider === 'youtube' ? ' ' : ','
  const params = new URLSearchParams({
    client_id: cfg.clientID,
    redirect_uri: `${process.env.BACKEND_URL}${cfg.callbackURL}`,
    scope: cfg.scope.join(scopeSeparator),
    response_type: 'code',
    state,
  })

  if (provider === 'youtube') {
    params.set('access_type', 'offline')
    params.set('prompt', 'consent')
  }

  return `${cfg.authURL}?${params.toString()}`
}
