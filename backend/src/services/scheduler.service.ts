import { prisma } from '../config/database'
import { Prisma, Platform, PostStatus } from '@prisma/client'
import { ApiError } from '../middleware/errorHandler'
import { publishToRealPlatform, extractPlatformError } from './publisher.service'
import { logger } from '../utils/logger'

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

export interface PublishDuePostsOptions {
  dryRun?: boolean
  limit?: number
  notBefore?: Date
  now?: Date
}

export interface PublishDuePostSummary {
  id: string
  platform: Platform
  scheduledAt: string
  status?: PostStatus
  error?: string
  externalId?: string
  url?: string
}

export interface PublishDuePostsResult {
  dryRun: boolean
  checkedAt: string
  dueCount: number
  published: PublishDuePostSummary[]
  failed: PublishDuePostSummary[]
  skipped: PublishDuePostSummary[]
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
    data.campaign = input.campaignId
      ? { connect: { id: input.campaignId } }
      : { disconnect: true }
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

  try {
    // Push to the real platform using the user's connected account token.
    const result = await publishToRealPlatform(userId, existing.platform, {
      content: existing.content,
      mediaUrls: existing.mediaUrls,
    })

    const post = await prisma.scheduledPost.update({
      where: { id: postId },
      data: {
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
        engagement: { externalId: result.externalId, url: result.url ?? null },
      },
      include: {
        campaign: {
          select: { id: true, name: true },
        },
      },
    })

    return { post, result }
  } catch (err) {
    // Record the failure so the post can be retried, then surface the reason.
    await prisma.scheduledPost.update({
      where: { id: postId },
      data: { status: PostStatus.FAILED },
    })
    if (err instanceof ApiError) throw err
    throw new ApiError(502, `Publish failed: ${extractPlatformError(err)}`)
  }
}

export async function publishDueScheduledPosts(
  options: PublishDuePostsOptions = {}
): Promise<PublishDuePostsResult> {
  const now = options.now ?? new Date()
  const scheduledAtFilter: Prisma.DateTimeFilter = { lte: now }
  if (options.notBefore) {
    scheduledAtFilter.gte = options.notBefore
  }
  const limit = Math.max(1, Math.min(100, options.limit ?? 10))
  const dryRun = options.dryRun === true

  const duePosts = await prisma.scheduledPost.findMany({
    where: {
      status: PostStatus.SCHEDULED,
      scheduledAt: scheduledAtFilter,
    },
    orderBy: { scheduledAt: 'asc' },
    take: limit,
    select: {
      id: true,
      userId: true,
      platform: true,
      scheduledAt: true,
    },
  })

  const result: PublishDuePostsResult = {
    dryRun,
    checkedAt: now.toISOString(),
    dueCount: duePosts.length,
    published: [],
    failed: [],
    skipped: [],
  }

  if (dryRun) {
    result.skipped = duePosts.map((post) => ({
      id: post.id,
      platform: post.platform,
      scheduledAt: post.scheduledAt.toISOString(),
      status: PostStatus.SCHEDULED,
    }))
    return result
  }

  for (const duePost of duePosts) {
    const summaryBase = {
      id: duePost.id,
      platform: duePost.platform,
      scheduledAt: duePost.scheduledAt.toISOString(),
    }

    try {
      // Re-check status immediately before publishing. This avoids publishing
      // a post that was manually published, deleted, or edited after the scan.
      const latest = await prisma.scheduledPost.findUnique({
        where: { id: duePost.id },
        select: { status: true, scheduledAt: true },
      })

      if (!latest || latest.status !== PostStatus.SCHEDULED || latest.scheduledAt > now) {
        result.skipped.push({
          ...summaryBase,
          status: latest?.status,
        })
        continue
      }

      const publishResult = await publishPost(duePost.userId, duePost.id)
      if (!publishResult) {
        result.failed.push({
          ...summaryBase,
          error: 'Scheduled post was not found at publish time.',
        })
        continue
      }

      result.published.push({
        ...summaryBase,
        status: publishResult.post.status,
        externalId: publishResult.result.externalId,
        url: publishResult.result.url,
      })
    } catch (err) {
      const error = err instanceof ApiError ? err.message : extractPlatformError(err)
      logger.error('scheduler.publish_due.failed', {
        postId: duePost.id,
        platform: duePost.platform,
        scheduledAt: duePost.scheduledAt,
        error,
      })
      result.failed.push({
        ...summaryBase,
        error,
      })
    }
  }

  return result
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
