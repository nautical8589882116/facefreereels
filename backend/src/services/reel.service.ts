import { prisma } from '../config/database'
import { Prisma } from '@prisma/client'

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
      captionStyle: data.captionStyle
        ? (data.captionStyle as Prisma.InputJsonValue)
        : Prisma.JsonNull,
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
  if (data.captionStyle !== undefined) {
    updateData.captionStyle =
      data.captionStyle === null
        ? Prisma.JsonNull
        : (data.captionStyle as Prisma.InputJsonValue)
  }
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

  // Mock: just update status to PROCESSING
  // In production, this would queue a background job
  return prisma.reel.update({
    where: { id },
    data: {
      status: 'PROCESSING',
      videoUrl: null,
      thumbnailUrl: null,
    },
  })
}
