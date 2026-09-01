import axios from 'axios'
import type { PlatformAccount } from '@prisma/client'
import { Platform } from '@prisma/client'
import { prisma } from '../config/database'
import { OAUTH_PROVIDERS, META_GRAPH } from '../config/oauth'
import { ApiError } from '../middleware/errorHandler'

// Real platform publishing using the OAuth tokens stored on PlatformAccount.
// Each platform throws a readable Error on failure; the caller marks the post
// FAILED and surfaces the message.

// Graph base URL comes from config so the API version is set in exactly one place.
const GRAPH = META_GRAPH

export interface PublishInput {
  content: string
  mediaUrls: string[]
}

export interface PublishResult {
  externalId: string
  url?: string
}

// ── Helpers ───────────────────────────────────────────────────────────

async function getPrimaryAccount(userId: string, platform: Platform): Promise<PlatformAccount | null> {
  // Prefer the primary active account; fall back to the oldest active one.
  return (
    (await prisma.platformAccount.findFirst({
      where: { userId, platform, isActive: true, isPrimary: true },
    })) ||
    (await prisma.platformAccount.findFirst({
      where: { userId, platform, isActive: true },
      orderBy: { createdAt: 'asc' },
    }))
  )
}

function firstImage(urls: string[]): string | undefined {
  return urls.find((u) => /\.(jpe?g|png|gif|webp)(\?|$)/i.test(u))
}

function firstVideo(urls: string[]): string | undefined {
  return urls.find((u) => /\.(mp4|mov|webm|m4v)(\?|$)/i.test(u))
}

/** Pull a human-readable message out of a Graph/Google/axios error. */
export function extractPlatformError(err: unknown): string {
  const e = err as {
    response?: { data?: { error?: { message?: string }; error_description?: string } }
    message?: string
  }
  const graph = e?.response?.data?.error
  if (graph?.message) return graph.message
  if (e?.response?.data?.error_description) return e.response.data.error_description
  if (e?.message) return e.message
  return 'Unknown platform error'
}

// ── Facebook ──────────────────────────────────────────────────────────

/** Posting as a Page requires the Page access token, derived from the user token. */
async function getPageToken(pageId: string, userToken: string): Promise<string> {
  try {
    const { data } = await axios.get(`${GRAPH}/${pageId}`, {
      params: { fields: 'access_token', access_token: userToken },
    })
    if (!data?.access_token) {
      throw new Error(
        'Could not get a Facebook Page token. Reconnect the Page with publishing permissions.'
      )
    }
    return data.access_token
  } catch (err) {
    // (#100) on the access_token field means this id is a personal profile, not
    // a Page — Facebook only allows publishing to Pages.
    const msg = extractPlatformError(err)
    if (msg.includes('nonexisting field') || msg.includes('access_token')) {
      throw new Error(
        'This Facebook connection points at a personal profile, not a Page. ' +
          'Facebook only allows publishing to Pages: create a Facebook Page, then disconnect and reconnect this account, granting access to that Page.'
      )
    }
    throw err
  }
}

async function publishFacebook(account: PlatformAccount, input: PublishInput): Promise<PublishResult> {
  const pageId = account.accountId
  const pageToken = await getPageToken(pageId, account.accessToken)
  const message = input.content
  const video = firstVideo(input.mediaUrls)
  const image = firstImage(input.mediaUrls)

  if (video) {
    const { data } = await axios.post(`${GRAPH}/${pageId}/videos`, null, {
      params: { file_url: video, description: message, access_token: pageToken },
    })
    return { externalId: data.id, url: `https://facebook.com/${data.id}` }
  }
  if (image) {
    const { data } = await axios.post(`${GRAPH}/${pageId}/photos`, null, {
      params: { url: image, caption: message, access_token: pageToken },
    })
    const id = data.post_id || data.id
    return { externalId: id, url: `https://facebook.com/${id}` }
  }
  const { data } = await axios.post(`${GRAPH}/${pageId}/feed`, null, {
    params: { message, access_token: pageToken },
  })
  return { externalId: data.id, url: `https://facebook.com/${data.id}` }
}

// ── Instagram ─────────────────────────────────────────────────────────

/** IG publishing uses the Page token that owns the IG business/creator account. */
async function getInstagramToken(igId: string, userToken: string): Promise<string> {
  // Query one IG edge per request. Graph validates a field list atomically, so
  // asking for instagram_business_account AND connected_instagram_account
  // together makes the whole call 400 if either is unknown for this API
  // version — silently falling back to the user token, which cannot publish.
  for (const edge of ['instagram_business_account', 'connected_instagram_account'] as const) {
    try {
      const { data } = await axios.get(`${GRAPH}/me/accounts`, {
        params: { access_token: userToken, fields: `access_token,${edge}` },
      })
      const pages: Array<Record<string, any>> = data?.data || []
      const match = pages.find((p) => p[edge]?.id === igId)
      if (match?.access_token) return match.access_token
    } catch (err) {
      console.warn(`[Publish:IG] Page-token lookup via ${edge} failed:`, extractPlatformError(err))
    }
  }

  throw new Error(
    'Could not find the Facebook Page that owns this Instagram account, so no Page token is available. ' +
      'Instagram publishing requires a Page token — disconnect and reconnect Instagram, granting access to the Page your Instagram account is linked to.'
  )
}

async function publishInstagram(account: PlatformAccount, input: PublishInput): Promise<PublishResult> {
  const igId = account.accountId
  const token = await getInstagramToken(igId, account.accessToken)
  const image = firstImage(input.mediaUrls)
  const video = firstVideo(input.mediaUrls)

  if (!image && !video) {
    throw new Error('Instagram requires an image or video to publish.')
  }

  // Step 1 — create a media container.
  const createParams: Record<string, string> = { caption: input.content, access_token: token }
  if (video) {
    createParams.media_type = 'REELS'
    createParams.video_url = video
  } else if (image) {
    createParams.image_url = image
  }

  const { data: container } = await axios.post(`${GRAPH}/${igId}/media`, null, { params: createParams })
  const creationId = container.id as string

  // Step 2 — video containers must finish processing before publishing.
  if (video) {
    let ready = false
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 3000))
      const { data: st } = await axios.get(`${GRAPH}/${creationId}`, {
        params: { fields: 'status_code', access_token: token },
      })
      if (st.status_code === 'FINISHED') {
        ready = true
        break
      }
      if (st.status_code === 'ERROR') {
        throw new Error('Instagram failed to process the video.')
      }
    }
    if (!ready) throw new Error('Instagram video processing timed out. Try again.')
  }

  // Step 3 — publish the container.
  const { data: pub } = await axios.post(`${GRAPH}/${igId}/media_publish`, null, {
    params: { creation_id: creationId, access_token: token },
  })
  return { externalId: pub.id }
}

// ── YouTube ───────────────────────────────────────────────────────────

/** Google access tokens live ~1h; refresh with the stored refresh token when expired. */
async function ensureGoogleToken(account: PlatformAccount): Promise<string> {
  const nearExpiry = account.expiresAt
    ? new Date(account.expiresAt).getTime() < Date.now() + 60_000
    : false
  if (!nearExpiry || !account.refreshToken) return account.accessToken

  const cfg = OAUTH_PROVIDERS.youtube
  const { data } = await axios.post(
    cfg.tokenURL,
    new URLSearchParams({
      client_id: cfg.clientID,
      client_secret: cfg.clientSecret,
      refresh_token: account.refreshToken,
      grant_type: 'refresh_token',
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  )

  const newToken = data.access_token as string
  const expiresAt = data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null
  await prisma.platformAccount.update({
    where: { id: account.id },
    data: { accessToken: newToken, expiresAt },
  })
  return newToken
}

async function publishYouTube(account: PlatformAccount, input: PublishInput): Promise<PublishResult> {
  const video = firstVideo(input.mediaUrls)
  if (!video) throw new Error('YouTube requires a video file to publish.')

  const token = await ensureGoogleToken(account)

  // Download the video bytes (from Supabase Storage) then multipart-upload them.
  const vid = await axios.get<ArrayBuffer>(video, {
    responseType: 'arraybuffer',
    maxContentLength: Infinity,
  })
  const buffer = Buffer.from(vid.data)

  const lines = input.content.split('\n')
  const title = (lines[0] || 'Untitled').slice(0, 100)
  const description = lines.slice(1).join('\n') || title

  const metadata = {
    snippet: { title, description },
    status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
  }

  const boundary = `ffr_${Date.now()}`
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`),
    Buffer.from(JSON.stringify(metadata)),
    Buffer.from(`\r\n--${boundary}\r\nContent-Type: video/*\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ])

  const { data } = await axios.post(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status',
    body,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    }
  )
  return { externalId: data.id, url: `https://youtube.com/watch?v=${data.id}` }
}

// ── Entry point ───────────────────────────────────────────────────────

export interface VerifyResult {
  ok: boolean
  platform: Platform
  detail?: string
  error?: string
}

/**
 * Ping the platform's identity endpoint with the stored token to confirm the
 * connection still works (token valid + required permissions present).
 */
export async function verifyConnection(userId: string, accountId: string): Promise<VerifyResult> {
  const account = await prisma.platformAccount.findFirst({ where: { id: accountId, userId } })
  if (!account) throw new ApiError(404, 'Platform account not found')

  try {
    switch (account.platform) {
      case Platform.FACEBOOK: {
        const pageToken = await getPageToken(account.accountId, account.accessToken)
        const { data } = await axios.get(`${GRAPH}/${account.accountId}`, {
          params: { fields: 'name', access_token: pageToken },
        })
        return { ok: true, platform: account.platform, detail: data.name }
      }
      case Platform.INSTAGRAM: {
        const token = await getInstagramToken(account.accountId, account.accessToken)
        const { data } = await axios.get(`${GRAPH}/${account.accountId}`, {
          params: { fields: 'username', access_token: token },
        })
        return { ok: true, platform: account.platform, detail: data.username ? `@${data.username}` : undefined }
      }
      case Platform.YOUTUBE: {
        const token = await ensureGoogleToken(account)
        const { data } = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
          params: { part: 'snippet', mine: 'true' },
          headers: { Authorization: `Bearer ${token}` },
        })
        const channel = data.items?.[0]
        if (!channel) throw new Error('No YouTube channel found for this account.')
        return { ok: true, platform: account.platform, detail: channel.snippet?.title }
      }
      default:
        return { ok: false, platform: account.platform, error: 'Unsupported platform' }
    }
  } catch (err) {
    return { ok: false, platform: account.platform, error: extractPlatformError(err) }
  }
}

export async function publishToRealPlatform(
  userId: string,
  platform: Platform,
  input: PublishInput
): Promise<PublishResult> {
  const account = await getPrimaryAccount(userId, platform)
  if (!account) {
    throw new ApiError(
      400,
      `No connected ${platform} account. Connect one in Settings → Connections first.`
    )
  }

  switch (platform) {
    case Platform.FACEBOOK:
      return publishFacebook(account, input)
    case Platform.INSTAGRAM:
      return publishInstagram(account, input)
    case Platform.YOUTUBE:
      return publishYouTube(account, input)
    default:
      throw new ApiError(400, 'Unsupported platform')
  }
}
