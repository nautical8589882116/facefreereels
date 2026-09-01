import { prisma } from '../config/database'
import { Prisma } from '@prisma/client'
import { renderReel } from './reel.render'
import { uploadBuffer } from '../config/supabase'

export interface ReelFilters {
  status?: string
  search?: string
  page?: number
  limit?: number
}

export async function listReels(userId: string, filters: ReelFilters) {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 10
  const skip = (page - 1) * limit

  const where: Prisma.ReelWhereInput = { userId }

  if (filters.status) {
    where.status = filters.status as Prisma.EnumReelStatusFilter
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { script: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.reel.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.reel.count({ where }),
  ])

  return { data, total, page, limit }
}

export async function getReelById(id: string, userId: string) {
  return prisma.reel.findFirst({
    where: { id, userId },
  })
}

export async function createReel(
  userId: string,
  data: {
    title: string
    script: string
    voice?: string
    bgStyle?: string
    bgValue?: string | null
    captionStyle?: Record<string, unknown> | null
    duration?: number
  }
) {
  return prisma.reel.create({
    data: {
      userId,
      title: data.title,
      script: data.script,
      voice: data.voice ?? 'en-US-JennyNeural',
      bgStyle: data.bgStyle ?? 'gradient',
      bgValue: data.bgValue ?? null,
      captionStyle:
        data.captionStyle == null
          ? Prisma.JsonNull
          : (data.captionStyle as Prisma.InputJsonValue),
      duration: data.duration ?? 15,
    },
  })
}

export async function updateReel(
  id: string,
  userId: string,
  data: {
    title?: string
    script?: string
    voice?: string
    bgStyle?: string
    bgValue?: string | null
    captionStyle?: Record<string, unknown> | null
    duration?: number
  }
) {
  const reel = await prisma.reel.findFirst({ where: { id, userId } })
  if (!reel) return null

  const updateData: Prisma.ReelUpdateInput = {}

  if (data.title !== undefined) updateData.title = data.title
  if (data.script !== undefined) updateData.script = data.script
  if (data.voice !== undefined) updateData.voice = data.voice
  if (data.bgStyle !== undefined) updateData.bgStyle = data.bgStyle
  if (data.bgValue !== undefined) updateData.bgValue = data.bgValue
  if (data.captionStyle !== undefined)
    updateData.captionStyle =
      data.captionStyle === null
        ? Prisma.JsonNull
        : (data.captionStyle as Prisma.InputJsonValue)
  if (data.duration !== undefined) updateData.duration = data.duration

  return prisma.reel.update({
    where: { id },
    data: updateData,
  })
}

export async function updateReelStatus(
  id: string,
  userId: string,
  status: string
) {
  const reel = await prisma.reel.findFirst({ where: { id, userId } })
  if (!reel) return null

  return prisma.reel.update({
    where: { id },
    data: { status: status as Prisma.ReelUpdateInput['status'] },
  })
}

export async function deleteReel(id: string, userId: string) {
  const reel = await prisma.reel.findFirst({ where: { id, userId } })
  if (!reel) return null

  await prisma.reel.delete({ where: { id } })
  return reel
}

export async function triggerGeneration(id: string, userId: string) {
  const reel = await prisma.reel.findFirst({ where: { id, userId } })
  if (!reel) return null

  const processing = await prisma.reel.update({
    where: { id },
    data: {
      status: 'PROCESSING',
      videoUrl: null,
      thumbnailUrl: null,
    },
  })

  // Fire-and-forget render + store. Frontend polls GET /reels/:id for READY/FAILED.
  void generateAndStoreReel(id, userId)

  return processing
}

/**
 * Render the reel to an MP4 (ffmpeg), upload it + a thumbnail to Supabase
 * Storage, and flip the reel to READY with the public URLs. On any failure the
 * reel is marked FAILED so the UI can surface it.
 */
export async function generateAndStoreReel(id: string, userId: string) {
  try {
    const reel = await prisma.reel.findFirst({ where: { id, userId } })
    if (!reel) return

    const { videoBuffer, thumbBuffer } = await renderReel(reel)
    const base = `reels/${userId}/${id}-${Date.now()}`

    const video = await uploadBuffer(`${base}.mp4`, videoBuffer, 'video/mp4')
    const thumb = await uploadBuffer(`${base}.jpg`, thumbBuffer, 'image/jpeg')

    await prisma.reel.update({
      where: { id },
      data: { status: 'READY', videoUrl: video.publicUrl, thumbnailUrl: thumb.publicUrl },
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[reel.generate] failed for ${id}:`, err instanceof Error ? err.message : err)
    await prisma.reel.update({ where: { id }, data: { status: 'FAILED' } }).catch(() => {})
  }
}
