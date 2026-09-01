import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { generateScriptImages } from './reel.images'
import { synthesizeVoiceover } from './reel.tts'

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg'
const FFPROBE = process.env.FFPROBE_PATH || 'ffprobe'
const KEN_BURNS = process.env.REEL_KENBURNS === 'true'

/** Mirror of the frontend GRADIENTS palette (id -> [c0, c1] hex, no '#'). */
const GRADIENT_MAP: Record<string, [string, string]> = {
  'warm-sunset': ['FF8C42', 'FF6B6B'],
  'deep-espresso': ['2C1810', 'C4814B'],
  'ocean-breeze': ['4ECDC4', 'A8E6CF'],
  'golden-hour': ['D4942A', 'F5C842'],
  'modern-minimal': ['2C2C2C', '8C8C8C'],
  'fresh-green': ['6B8E23', '98D8C8'],
  'blush-rose': ['FFB6C1', 'DDA0DD'],
  midnight: ['191970', '4169E1'],
}

interface ReelLike {
  bgStyle?: string | null
  bgValue?: string | null
  script: string
  voice?: string | null
  duration?: number | null
}

function resolveColors(reel: ReelLike): [string, string] {
  const v = reel.bgValue || ''
  const hexes = (v.match(/#([0-9a-fA-F]{6})/g) || []).map((h) => h.slice(1).toUpperCase())
  if (hexes.length >= 2) return [hexes[0], hexes[1]]
  if (GRADIENT_MAP[v]) return GRADIENT_MAP[v]
  if (reel.bgStyle === 'solid' && hexes.length === 1) return [hexes[0], hexes[0]]
  return ['7C3AED', '2563EB'] // brand violet -> blue
}

/** Copy the first available system font into tmpDir as font.ttf (relative path
 * avoids Windows drive-colon escaping problems in the ffmpeg filtergraph). */
async function copyFont(tmpDir: string): Promise<boolean> {
  const candidates = [
    process.env.REEL_FONT_PATH,
    process.platform === 'win32' ? 'C:/Windows/Fonts/arial.ttf' : '',
    process.platform === 'win32' ? 'C:/Windows/Fonts/segoeui.ttf' : '',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/System/Library/Fonts/Supplemental/Arial.ttf',
  ].filter(Boolean) as string[]

  for (const f of candidates) {
    try {
      await fs.access(f)
      await fs.copyFile(f, path.join(tmpDir, 'font.ttf'))
      return true
    } catch {
      /* try next */
    }
  }
  return false
}

/** Split the script into time-sequenced caption chunks (~38 chars each). */
function chunkScript(script: string): string[] {
  const words = script.trim().split(/\s+/).filter(Boolean)
  const chunks: string[] = []
  let cur: string[] = []
  for (const w of words) {
    cur.push(w)
    if (cur.join(' ').length >= 38) {
      chunks.push(cur.join(' '))
      cur = []
    }
  }
  if (cur.length) chunks.push(cur.join(' '))
  return chunks
}

/** Hard-wrap a caption chunk into lines (~22 chars) for the 1080px frame. */
function wrap(text: string, max = 22): string {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) {
      if (line) lines.push(line.trim())
      line = w
    } else {
      line += ' ' + w
    }
  }
  if (line.trim()) lines.push(line.trim())
  return lines.join('\n')
}

function run(args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG, args, { windowsHide: true, cwd })
    let stderr = ''
    proc.stderr.on('data', (d) => {
      stderr += d.toString()
      if (stderr.length > 8000) stderr = stderr.slice(-8000)
    })
    proc.on('error', (err) => reject(new Error(`ffmpeg spawn failed: ${err.message}`)))
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`ffmpeg exited ${code}\n${stderr.slice(-1200)}`))
    })
  })
}

/** Probe media duration (seconds) with ffprobe. Returns null on any failure. */
function probeDuration(file: string, cwd: string): Promise<number | null> {
  return new Promise((resolve) => {
    const args = ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]
    const proc = spawn(FFPROBE, args, { windowsHide: true, cwd })
    let out = ''
    proc.stdout.on('data', (d) => (out += d.toString()))
    proc.on('error', () => resolve(null))
    proc.on('close', () => {
      const n = parseFloat(out.trim())
      resolve(Number.isFinite(n) && n > 0 ? n : null)
    })
  })
}

/** Build the time-sequenced drawtext filter chain for burned captions. */
async function buildCaptionFilters(
  tmpDir: string,
  script: string,
  duration: number
): Promise<string[]> {
  const hasFont = await copyFont(tmpDir)
  const chunks = chunkScript(script)
  if (!hasFont || !chunks.length) return []

  const filters: string[] = []
  const per = duration / chunks.length
  for (let i = 0; i < chunks.length; i++) {
    const start = (i * per).toFixed(2)
    const end = ((i + 1) * per).toFixed(2)
    await fs.writeFile(path.join(tmpDir, `seg${i}.txt`), wrap(chunks[i]), 'utf8')
    filters.push(
      `drawtext=fontfile=font.ttf:textfile=seg${i}.txt` +
        `:fontcolor=white:fontsize=58:line_spacing=14:text_align=C` +
        `:box=1:boxcolor=black@0.40:boxborderw=28` +
        `:x=(w-text_w)/2:y=h*0.66-text_h/2` +
        `:enable='between(t,${start},${end})'`
    )
  }
  return filters
}

/** Render an animated gradient background clip to base.mp4 (fallback visual). */
async function renderGradientBase(tmpDir: string, colors: [string, string], duration: number) {
  const [c0, c1] = colors
  await run(
    [
      '-y',
      '-f', 'lavfi',
      '-i', `gradients=s=1080x1920:c0=0x${c0}:c1=0x${c1}:duration=${duration}:speed=0.008`,
      '-t', String(duration),
      '-r', '30',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'veryfast',
      'base.mp4',
    ],
    tmpDir
  )
}

/** Render a slideshow of the given image buffers to base.mp4. */
async function renderImageBase(tmpDir: string, images: Buffer[], duration: number) {
  const per = duration / images.length
  const perFrames = Math.max(1, Math.round(per * 30))
  const listLines: string[] = []

  for (let i = 0; i < images.length; i++) {
    const imgName = `img${i}.jpg`
    const segName = `clip${i}.mp4`
    await fs.writeFile(path.join(tmpDir, imgName), images[i])

    const cover = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1'
    const vf = KEN_BURNS
      ? `${cover},zoompan=z='min(zoom+0.0012,1.12)':d=${perFrames}:s=1080x1920:fps=30,format=yuv420p`
      : `${cover},format=yuv420p`

    await run(
      [
        '-y',
        '-loop', '1',
        '-i', imgName,
        '-vf', vf,
        '-t', per.toFixed(3),
        '-r', '30',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'veryfast',
        segName,
      ],
      tmpDir
    )
    listLines.push(`file '${segName}'`)
  }

  await fs.writeFile(path.join(tmpDir, 'concat.txt'), listLines.join('\n'), 'utf8')
  await run(['-y', '-f', 'concat', '-safe', '0', '-i', 'concat.txt', '-c', 'copy', 'base.mp4'], tmpDir)
}

export interface RenderedReel {
  videoBuffer: Buffer
  thumbBuffer: Buffer
  duration: number
}

/**
 * Render a face-free reel:
 *   1. Generate scene images via Grok (xAI) — falls back to animated gradient.
 *   2. Generate voiceover via Azure TTS — falls back to silent.
 *   3. Compose 1080x1920 H.264 MP4 with time-sequenced burned captions and,
 *      when available, the voiceover audio; also extract a JPG thumbnail.
 *
 * Each AI step degrades gracefully when its API key is absent, so reels keep
 * generating (gradient + silent) without XAI_API_KEY / AZURE_SPEECH_KEY.
 */
export async function renderReel(reel: ReelLike): Promise<RenderedReel> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reel-'))
  const outName = `${randomUUID()}.mp4`
  const thumbName = `${randomUUID()}.jpg`

  try {
    // 1. Visuals + 2. audio in parallel (independent network calls).
    const [images, audio] = await Promise.all([
      generateScriptImages(chunkScript(reel.script)),
      synthesizeVoiceover(reel.script, reel.voice),
    ])

    // 3. Decide duration: prefer the actual voiceover length so captions/images
    //    track the narration; otherwise use the requested estimate.
    let duration = Math.min(60, Math.max(3, reel.duration ?? 15))
    if (audio) {
      await fs.writeFile(path.join(tmpDir, 'audio.mp3'), audio.buffer)
      const audioDur = audio.duration ?? (await probeDuration('audio.mp3', tmpDir))
      if (audioDur) duration = Math.min(60, Math.max(3, audioDur + 0.4))
    }

    // 4. Base visual track.
    if (images.length) {
      await renderImageBase(tmpDir, images, duration)
    } else {
      await renderGradientBase(tmpDir, resolveColors(reel), duration)
    }

    // 5. Burn captions + mux audio into the final MP4.
    const captionFilters = await buildCaptionFilters(tmpDir, reel.script, duration)
    const finalArgs = ['-y', '-i', 'base.mp4']
    if (audio) finalArgs.push('-i', 'audio.mp3')

    if (captionFilters.length) {
      finalArgs.push('-vf', captionFilters.join(','), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'veryfast')
    } else {
      finalArgs.push('-c:v', 'copy')
    }

    finalArgs.push('-map', '0:v:0')
    if (audio) {
      finalArgs.push('-map', '1:a:0', '-c:a', 'aac', '-b:a', '128k', '-shortest')
    }
    finalArgs.push('-movflags', '+faststart', outName)

    await run(finalArgs, tmpDir)
    await run(['-y', '-ss', String(duration / 2), '-i', outName, '-frames:v', '1', '-q:v', '3', thumbName], tmpDir)

    const [videoBuffer, thumbBuffer] = await Promise.all([
      fs.readFile(path.join(tmpDir, outName)),
      fs.readFile(path.join(tmpDir, thumbName)),
    ])
    return { videoBuffer, thumbBuffer, duration }
  } finally {
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}
