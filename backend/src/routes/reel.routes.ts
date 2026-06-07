import { Router } from 'express'
import { z } from 'zod'
import { successResponse, paginatedResponse } from '../utils/response'
import { AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { ApiError } from '../middleware/errorHandler'
import * as reelService from '../services/reel.service'

const router = Router()

// ─── Validation Schemas ──────────────────────────────────────

const createReelSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  script: z.string().min(1, 'Script is required'),
  voice: z.string().optional(),
  bgStyle: z.string().optional(),
  bgValue: z.string().nullable().optional(),
  captionStyle: z.record(z.unknown()).nullable().optional(),
  duration: z.number().int().min(5).max(60).optional(),
})

const updateReelSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  script: z.string().optional(),
  voice: z.string().optional(),
  bgStyle: z.string().optional(),
  bgValue: z.string().nullable().optional(),
  captionStyle: z.record(z.unknown()).nullable().optional(),
  duration: z.number().int().min(5).max(60).optional(),
})

const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PROCESSING', 'READY', 'FAILED']),
})

// ─── GET /api/reels ──────────────────────────────────────────

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(50, parseInt(req.query.limit as string) || 10)
    const status = (req.query.status as string) || undefined
    const search = (req.query.search as string) || undefined

    const result = await reelService.listReels(req.user!.userId, {
      page,
      limit,
      status,
      search,
    })

    paginatedResponse(res, result.data, result.total, result.page, result.limit)
  } catch (err) {
    next(err)
  }
})

// ─── GET /api/reels/:id ──────────────────────────────────────

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const reel = await reelService.getReelById(req.params.id, req.user!.userId)

    if (!reel) {
      throw new ApiError(404, 'Reel not found')
    }

    successResponse(res, reel)
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/reels ─────────────────────────────────────────

router.post('/', validate(createReelSchema), async (req: AuthRequest, res, next) => {
  try {
    const reel = await reelService.createReel(req.user!.userId, req.body)

    successResponse(res, reel, 'Reel created successfully', 201)
  } catch (err) {
    next(err)
  }
})

// ─── PUT /api/reels/:id ──────────────────────────────────────

router.put('/:id', validate(updateReelSchema), async (req: AuthRequest, res, next) => {
  try {
    const reel = await reelService.updateReel(
      req.params.id,
      req.user!.userId,
      req.body
    )

    if (!reel) {
      throw new ApiError(404, 'Reel not found')
    }

    successResponse(res, reel, 'Reel updated successfully')
  } catch (err) {
    next(err)
  }
})

// ─── PATCH /api/reels/:id/status ─────────────────────────────

router.patch('/:id/status', validate(updateStatusSchema), async (req: AuthRequest, res, next) => {
  try {
    const reel = await reelService.updateReelStatus(
      req.params.id,
      req.user!.userId,
      req.body.status
    )

    if (!reel) {
      throw new ApiError(404, 'Reel not found')
    }

    successResponse(res, reel, 'Status updated successfully')
  } catch (err) {
    next(err)
  }
})

// ─── DELETE /api/reels/:id ───────────────────────────────────

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const reel = await reelService.deleteReel(req.params.id, req.user!.userId)

    if (!reel) {
      throw new ApiError(404, 'Reel not found')
    }

    successResponse(res, { id: reel.id }, 'Reel deleted successfully')
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/reels/:id/generate ────────────────────────────

router.post('/:id/generate', async (req: AuthRequest, res, next) => {
  try {
    const reel = await reelService.triggerGeneration(
      req.params.id,
      req.user!.userId
    )

    if (!reel) {
      throw new ApiError(404, 'Reel not found')
    }

    successResponse(res, reel, 'Reel generation started')
  } catch (err) {
    next(err)
  }
})

export default router
