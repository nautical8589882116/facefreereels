/**
 * Grok (xAI) Text-to-Speech for reel voiceovers.
 *
 * Maps the frontend's friendly voice ids (ava, james, ...) to Grok's built-in
 * voices and synthesizes the script to an MP3 buffer via POST /v1/tts. Returns
 * null (never throws) when XAI_API_KEY is missing or synthesis fails, so reels
 * still render silently without the key.
 */

const XAI_API_KEY = process.env.XAI_API_KEY
const XAI_TTS_URL = 'https://api.x.ai/v1/tts'
// Grok's realtime/voice model. Override via env if xAI renames it.
const XAI_TTS_MODEL = process.env.XAI_TTS_MODEL || 'grok-voice-latest'

// Grok built-in voices: ara, eve, leo, rex, sal.
const FEMALE: readonly string[] = ['eve', 'ara']
const MALE: readonly string[] = ['rex', 'sal', 'leo']

/** Frontend voice id -> Grok voice_id (balanced across genders/tones). */
const VOICE_MAP: Record<string, string> = {
  ava: 'eve',
  james: 'rex',
  sofia: 'ara',
  marcus: 'sal',
  luna: 'eve',
  david: 'leo',
  maya: 'ara',
  ryan: 'rex',
  elena: 'eve',
  omar: 'sal',
  chloe: 'ara',
  leo: 'leo',
}
const DEFAULT_VOICE = process.env.XAI_TTS_VOICE || 'eve'

export function ttsEnabled(): boolean {
  return Boolean(XAI_API_KEY)
}

function resolveVoice(voiceId?: string | null): string {
  if (!voiceId) return DEFAULT_VOICE
  const v = voiceId.toLowerCase()
  // Accept an already-valid Grok voice id (built-in or 8-char custom) verbatim.
  if (FEMALE.includes(v) || MALE.includes(v) || /^[a-z0-9]{8}$/.test(v)) return v
  return VOICE_MAP[v] || DEFAULT_VOICE
}

export interface Voiceover {
  buffer: Buffer
  /** Audio length in seconds (reported by the API). */
  duration: number | null
}

interface XaiTtsResponse {
  audio?: string // base64
  content_type?: string
  duration?: number
}

/**
 * Synthesize `script` with the chosen voice. Returns the MP3 buffer + duration,
 * or null when disabled / on failure.
 */
export async function synthesizeVoiceover(
  script: string,
  voiceId?: string | null
): Promise<Voiceover | null> {
  if (!ttsEnabled()) return null

  // The REST endpoint caps input at 15,000 characters.
  const text = script.trim().slice(0, 15000)
  if (!text) return null

  try {
    const res = await fetch(XAI_TTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: XAI_TTS_MODEL,
        text,
        language: 'auto',
        voice_id: resolveVoice(voiceId),
        output_format: { codec: 'mp3', sample_rate: 24000, bit_rate: 128000 },
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`xAI TTS ${res.status}: ${detail.slice(0, 300)}`)
    }

    const json = (await res.json()) as XaiTtsResponse
    if (!json.audio) return null

    const buffer = Buffer.from(json.audio, 'base64')
    if (buffer.length === 0) return null

    return { buffer, duration: typeof json.duration === 'number' ? json.duration : null }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[reel.tts] synthesis failed, rendering silent:', err instanceof Error ? err.message : err)
    return null
  }
}
