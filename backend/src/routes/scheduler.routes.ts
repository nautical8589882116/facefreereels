import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../config/database'
import { successResponse, paginatedResponse } from '../utils/response'
import { AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { ApiError } from '../middleware/errorHandler'
import * as schedulerService from '../services/scheduler.service'
import { Platform, PostStatus } from '@prisma/client'

const router = Router()

// ─── Validation Schemas ──────────────────────────────────────

const createPostSchema = z.object({
  campaignId: z.string().optional(),
  platform: z.nativeEnum(Platform),
  content: z.string().min(1, 'Content is required').max(5000),
  mediaUrls: z.array(z.string().url()).optional(),
  scheduledAt: z.string().datetime({ message: 'Invalid datetime format' }),
  status: z.nativeEnum(PostStatus).optional(),
})

const updatePostSchema = z.object({
  campaignId: z.string().nullable().optional(),
  platform: z.nativeEnum(Platform).optional(),
  content: z.string().min(1).max(5000).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  scheduledAt: z.string().datetime().optional(),
  status: z.nativeEnum(PostStatus).optional(),
})

const updateStatusSchema = z.object({
  status: z.nativeEnum(PostStatus),
})

// ─── List Posts ───────────────────────────────────────────────

router.get('/posts', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const page = req.query.page ? parseInt(req.query.page as string) : 1
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20
    const platform = req.query.platform as Platform | undefined
    const status = req.query.status as PostStatus | undefined
    const month = req.query.month ? parseInt(req.query.month as string) : undefined
    const year = req.query.year ? parseInt(req.query.year as string) : undefined

    const { posts, total, page: p, limit: l } = await schedulerService.listScheduledPosts(
      userId,
      { page, limit, platform, status, month, year }
    )

    return paginatedResponse(res, posts, total, p, l)
  } catch (err) {
    next(err)
  }
})

// ─── Get Single Post ─────────────────────────────────────────

router.get('/posts/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const postId = req.params.id

    const post = await schedulerService.getScheduledPost(userId, postId)
    if (!post) throw new ApiError(404, 'Scheduled post not found')

    return successResponse(res, post)
  } catch (err) {
    next(err)
  }
})

// ─── Create Post ─────────────────────────────────────────────

router.post('/posts', validate(createPostSchema), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const body = req.body as z.infer<typeof createPostSchema>

    // Validate campaign exists if provided
    if (body.campaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: { id: body.campaignId, userId },
      })
      if (!campaign) throw new ApiError(404, 'Campaign not found')
    }

    const post = await schedulerService.createScheduledPost(userId, {
      ...body,
      scheduledAt: new Date(body.scheduledAt),
    })

    return successResponse(res, post, 'Scheduled post created', 201)
  } catch (err) {
    next(err)
  }
})

// ─── Update Post ─────────────────────────────────────────────

router.put('/posts/:id', validate(updatePostSchema), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const postId = req.params.id
    const body = req.body as z.infer<typeof updatePostSchema>

    // Validate campaign exists if provided
    if (body.campaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: { id: body.campaignId, userId },
      })
      if (!campaign) throw new ApiError(404, 'Campaign not found')
    }

    const input = {
      ...body,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    }

    const post = await schedulerService.updateScheduledPost(userId, postId, input)
    if (!post) throw new ApiError(404, 'Scheduled post not found')

    return successResponse(res, post, 'Scheduled post updated')
  } catch (err) {
    next(err)
  }
})

// ─── Update Status ───────────────────────────────────────────

router.patch('/posts/:id/status', validate(updateStatusSchema), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const postId = req.params.id
    const { status } = req.body as z.infer<typeof updateStatusSchema>

    const post = await schedulerService.updatePostStatus(userId, postId, status)
    if (!post) throw new ApiError(404, 'Scheduled post not found')

    return successResponse(res, post, `Post status updated to ${status}`)
  } catch (err) {
    next(err)
  }
})

// ─── Delete Post ─────────────────────────────────────────────

router.delete('/posts/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const postId = req.params.id

    const deleted = await schedulerService.deleteScheduledPost(userId, postId)
    if (!deleted) throw new ApiError(404, 'Scheduled post not found')

    return successResponse(res, { id: deleted.id }, 'Scheduled post deleted')
  } catch (err) {
    next(err)
  }
})

// ─── Publish Post (Mock) ─────────────────────────────────────

router.post('/posts/:id/publish', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const postId = req.params.id

    const result = await schedulerService.publishPost(userId, postId)
    if (!result) throw new ApiError(404, 'Scheduled post not found')

    return successResponse(res, result, 'Post published successfully')
  } catch (err) {
    next(err)
  }
})

// ─── Calendar View ───────────────────────────────────────────

router.get('/calendar', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const now = new Date()
    const month = req.query.month ? parseInt(req.query.month as string) : now.getMonth() + 1
    const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear()

    if (month < 1 || month > 12) throw new ApiError(400, 'Month must be between 1 and 12')
    if (year < 2000 || year > 2100) throw new ApiError(400, 'Year out of range')

    const calendar = await schedulerService.getCalendarPosts(userId, { month, year })

    return successResponse(res, calendar)
  } catch (err) {
    next(err)
  }
})

export default router
