/**
 * Grok (xAI) image generation for face-free reels.
 *
 * Generates one scene image per script segment via the xAI image API and returns
 * the raw image buffers. The reel premise is "face-free", so every prompt is
 * constrained to scenery / product / ambience with no people, faces, or text.
 *
 * Returns an empty array (never throws) when XAI_API_KEY is missing or the API
 * fails — the render pipeline then falls back to its animated gradient so reel
 * generation keeps working without the key.
 */

const XAI_API_KEY = process.env.XAI_API_KEY
// xAI's current image model. Override via env if xAI renames it.
const XAI_IMAGE_MODEL = process.env.XAI_IMAGE_MODEL || 'grok-2-image-1212'
const XAI_IMAGE_URL = 'https://api.x.ai/v1/images/generations'

// xAI caps images-per-request at 10; we cap lower to bound latency + cost.
const MAX_IMAGES = 6

export function imagesEnabled(): boolean {
  return Boolean(XAI_API_KEY)
}

/** Turn a script segment into a safe, face-free image prompt. */
function buildPrompt(segment: string): string {
  const scene = segment.replace(/\s+/g, ' ').trim().slice(0, 300)
  return (
    `Cinematic vertical advertising photograph for a hospitality / restaurant ` +
    `brand. Scene inspired by: "${scene}". ` +
    `Warm, appetizing, professional lighting; shallow depth of field; ` +
    `vibrant but tasteful colors. ` +
    `Absolutely no people, no faces, no hands, no readable text, no logos, ` +
    `no watermarks. Focus on food, drinks, interiors, tabletops, ambience.`
  )
}

interface XaiImageResponse {
  data?: Array<{ b64_json?: string; url?: string }>
  error?: { message?: string } | string
}

async function generateOne(prompt: string): Promise<Buffer | null> {
  const res = await fetch(XAI_IMAGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    // NB: xAI's image endpoint rejects size/quality/style params — do not add them.
    body: JSON.stringify({
      model: XAI_IMAGE_MODEL,
      prompt,
      n: 1,
      response_format: 'b64_json',
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`xAI image API ${res.status}: ${text.slice(0, 300)}`)
  }

  const json = (await res.json()) as XaiImageResponse
  const item = json.data?.[0]
  if (item?.b64_json) return Buffer.from(item.b64_json, 'base64')
  if (item?.url) {
    const img = await fetch(item.url)
    if (!img.ok) throw new Error(`xAI image fetch ${img.status}`)
    return Buffer.from(await img.arrayBuffer())
  }
  return null
}

/**
 * Generate up to `count` scene images for the given script segments.
 * `segments` should already be chunked (one prompt per visual beat).
 */
export async function generateScriptImages(segments: string[]): Promise<Buffer[]> {
  if (!imagesEnabled() || segments.length === 0) return []

  const slice = segments.slice(0, MAX_IMAGES)
  try {
    const buffers = await Promise.all(slice.map((s) => generateOne(buildPrompt(s))))
    return buffers.filter((b): b is Buffer => Buffer.isBuffer(b) && b.length > 0)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[reel.images] generation failed, falling back to gradient:', err instanceof Error ? err.message : err)
    return []
  }
}
