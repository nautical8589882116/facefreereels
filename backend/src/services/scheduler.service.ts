import { prisma } from '../config/database'
import { Prisma, Platform, PostStatus } from '@prisma/client'

export interface ListPostsFilters {
  page?: number
  limit?: number
  platform?: Platform
  status?: PostStatus
  month?: number
  year?: number
}

export interface CreatePostInput {
  campaignId?: string
  platform: Platform
  content: string
  mediaUrls?: string[]
  scheduledAt: Date
  status?: PostStatus
}

export interface UpdatePostInput {
  campaignId?: string | null
  platform?: Platform
  content?: string
  mediaUrls?: string[]
  scheduledAt?: Date
  status?: PostStatus
}

export interface CalendarFilters {
  month: number
  year: number
}

function buildWhereClause(userId: string, filters: ListPostsFilters): Prisma.ScheduledPostWhereInput {
  const where: Prisma.ScheduledPostWhereInput = { userId }

  if (filters.platform) {
    where.platform = filters.platform
  }

  if (filters.status) {
    where.status = filters.status
  }

  if (filters.month !== undefined && filters.year !== undefined) {
    const start = new Date(filters.year, filters.month - 1, 1, 0, 0, 0, 0)
    const end = new Date(filters.year, filters.month, 0, 23, 59, 59, 999)
    where.scheduledAt = { gte: start, lte: end }
  }

  return where
}

export async function listScheduledPosts(userId: string, filters: ListPostsFilters) {
  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.max(1, Math.min(100, filters.limit ?? 20))
  const skip = (page - 1) * limit

  const where = buildWhereClause(userId, filters)

  const [posts, total] = await Promise.all([
    prisma.scheduledPost.findMany({
      where,
      include: {
        campaign: {
          select: { id: true, name: true },
        },
      },
      orderBy: { scheduledAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.scheduledPost.count({ where }),
  ])

  return { posts, total, page, limit }
}

export async function getScheduledPost(userId: string, postId: string) {
  const post = await prisma.scheduledPost.findFirst({
    where: { id: postId, userId },
    include: {
      campaign: {
        select: { id: true, name: true },
      },
    },
  })
  return post
}

export async function createScheduledPost(userId: string, input: CreatePostInput) {
  const post = await prisma.scheduledPost.create({
    data: {
      userId,
      campaignId: input.campaignId ?? null,
      platform: input.platform,
      content: input.content,
      mediaUrls: input.mediaUrls ?? [],
      scheduledAt: input.scheduledAt,
      status: input.status ?? PostStatus.SCHEDULED,
    },
    include: {
      campaign: {
        select: { id: true, name: true },
      },
    },
  })
  return post
}

export async function updateScheduledPost(userId: string, postId: string, input: UpdatePostInput) {
  const existing = await prisma.scheduledPost.findFirst({
    where: { id: postId, userId },
  })
  if (!existing) return null

  const data: Prisma.ScheduledPostUpdateInput = {}

  if (input.campaignId !== undefined) {
    data.campaignId = input.campaignId ?? null
  }
  if (input.platform !== undefined) data.platform = input.platform
  if (input.content !== undefined) data.content = input.content
  if (input.mediaUrls !== undefined) data.mediaUrls = input.mediaUrls
  if (input.scheduledAt !== undefined) data.scheduledAt = input.scheduledAt
  if (input.status !== undefined) data.status = input.status

  const post = await prisma.scheduledPost.update({
    where: { id: postId },
    data,
    include: {
      campaign: {
        select: { id: true, name: true },
      },
    },
  })
  return post
}

export async function updatePostStatus(userId: string, postId: string, status: PostStatus) {
  const existing = await prisma.scheduledPost.findFirst({
    where: { id: postId, userId },
  })
  if (!existing) return null

  const data: Prisma.ScheduledPostUpdateInput = { status }
  if (status === PostStatus.PUBLISHED) {
    data.publishedAt = new Date()
  }

  const post = await prisma.scheduledPost.update({
    where: { id: postId },
    data,
    include: {
      campaign: {
        select: { id: true, name: true },
      },
    },
  })
  return post
}

export async function deleteScheduledPost(userId: string, postId: string) {
  const existing = await prisma.scheduledPost.findFirst({
    where: { id: postId, userId },
  })
  if (!existing) return null

  await prisma.scheduledPost.delete({
    where: { id: postId },
  })
  return existing
}

export async function publishPost(userId: string, postId: string) {
  const existing = await prisma.scheduledPost.findFirst({
    where: { id: postId, userId },
  })
  if (!existing) return null

  // Mock publish - in production this would call platform APIs
  const mockEngagement = {
    likes: Math.floor(Math.random() * 500),
    comments: Math.floor(Math.random() * 100),
    shares: Math.floor(Math.random() * 50),
    saves: Math.floor(Math.random() * 30),
    reach: Math.floor(Math.random() * 5000) + 500,
  }

  const post = await prisma.scheduledPost.update({
    where: { id: postId },
    data: {
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      engagement: mockEngagement,
    },
    include: {
      campaign: {
        select: { id: true, name: true },
      },
    },
  })

  return { post, mockEngagement }
}

export async function getCalendarPosts(userId: string, filters: CalendarFilters) {
  const { month, year } = filters

  const start = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const end = new Date(year, month, 0, 23, 59, 59, 999)

  const posts = await prisma.scheduledPost.findMany({
    where: {
      userId,
      scheduledAt: { gte: start, lte: end },
    },
    include: {
      campaign: {
        select: { id: true, name: true },
      },
    },
    orderBy: { scheduledAt: 'asc' },
  })

  // Group posts by day of month
  const grouped: Record<string, typeof posts> = {}
  for (const post of posts) {
    const day = post.scheduledAt.getDate().toString()
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(post)
  }

  // Build full calendar days
  const daysInMonth = new Date(year, month, 0).getDate()
  const calendar: Record<string, { date: string; posts: typeof posts }> = {}

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = d.toString()
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    calendar[dayStr] = {
      date: dateStr,
      posts: grouped[dayStr] ?? [],
    }
  }

  return { month, year, daysInMonth, calendar }
}
