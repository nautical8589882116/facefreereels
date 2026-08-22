import { getAnthropicClient } from '../config/anthropic'
import { prisma } from '../config/database'
import { ApiError } from '../middleware/errorHandler'

// ─── Generate a social post caption from a spoken/typed instruction ───

export async function generatePostCaption(
  userId: string,
  instruction: string,
  platforms: string[]
): Promise<string> {
  const settings = await prisma.userSettings.findUnique({ where: { userId } })

  const brandLines = settings
    ? [
        `Product: ${settings.productName} — ${settings.productTagline}`,
        settings.uvp ? `Unique value proposition: ${settings.uvp}` : null,
        `Preferred call to action: ${settings.aiCTA}`,
        `Hashtags: include about ${settings.aiHashtagCount} relevant hashtags`,
        `Emojis: ${settings.aiEmojiEnabled ? 'use tastefully' : 'do not use any emojis'}`,
        `Caption length: ${settings.aiCopyLength}`,
        `Write in language: ${settings.aiLanguage}`,
        settings.aiInclude ? `Always include: ${settings.aiInclude}` : null,
        settings.aiAvoid ? `Avoid mentioning: ${settings.aiAvoid}` : null,
        settings.forbiddenWords.length
          ? `Never use these words: ${settings.forbiddenWords.join(', ')}`
          : null,
      ]
        .filter(Boolean)
        .join('\n')
    : ''

  const system = `You write social media captions for ${settings?.productName ?? 'a brand'}, a QR-powered digital menu product for restaurants and cafes.
Write ONE ready-to-post caption for these platform(s): ${platforms.length ? platforms.join(', ') : 'social media'}.
${brandLines}
Output ONLY the caption text (hashtags inline if requested) — no preamble, no quotation marks, no markdown, no explanation.`

  let client
  try {
    client = getAnthropicClient()
  } catch {
    throw new ApiError(503, 'AI caption generation is not configured on this server')
  }

  const response = await client.messages.create({
    model: 'claude-opus-5',
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: instruction }],
  })

  if (response.stop_reason === 'refusal') {
    throw new ApiError(422, 'AI declined to generate this caption. Try rephrasing your instruction.')
  }

  const textBlock = response.content.find(
    (block): block is Extract<typeof response.content[number], { type: 'text' }> =>
      block.type === 'text'
  )

  if (!textBlock || !textBlock.text.trim()) {
    throw new ApiError(502, 'AI did not return any caption text')
  }

  return textBlock.text.trim()
}
