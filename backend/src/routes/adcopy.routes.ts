import { Router } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { successResponse, paginatedResponse } from '../utils/response'
import * as adCopyService from '../services/adcopy.service'
import { Platform } from '@prisma/client'

const router = Router()

// ─── Validation Schemas ───────────────────────────────────────
const platformSchema = z.nativeEnum(Platform)

const createAdCopySchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required'),
  platform: platformSchema,
  headline: z.string().min(1, 'Headline is required').max(200),
  body: z.string().min(1, 'Body is required').max(2000),
  cta: z.string().min(1, 'CTA is required').max(100),
  hashtags: z.array(z.string().max(50)).max(30).optional(),
  variations: z.record(z.unknown()).optional(),
  isPrimary: z.boolean().optional(),
})

const updateAdCopySchema = z.object({
  platform: platformSchema.optional(),
  headline: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(2000).optional(),
  cta: z.string().min(1).max(100).optional(),
  hashtags: z.array(z.string().max(50)).max(30).optional(),
  variations: z.record(z.unknown()).optional(),
  isPrimary: z.boolean().optional(),
})

const batchCreateSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required'),
  copies: z.array(createAdCopySchema.omit({ campaignId: true })).min(1).max(50),
})

// ─── Helper: Parse pagination ─────────────────────────────────
function getPagination(req: AuthRequest) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
  return { page, limit }
}

// ═══════════════════════════════════════════════════════════════
//  GET /api/ad-copies — List ad copies
// ═══════════════════════════════════════════════════════════════
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const { page, limit } = getPagination(req)

    const filters = {
      campaignId: req.query.campaignId as string | undefined,
      platform: req.query.platform as Platform | undefined,
    }

    const { adCopies, total } = await adCopyService.listAdCopies(
      userId,
      filters,
      page,
      limit
    )

    return paginatedResponse(res, adCopies, total, page, limit)
  } catch (err) {
    next(err)
  }
})

// ═══════════════════════════════════════════════════════════════
//  GET /api/ad-copies/:id — Get single ad copy
// ═══════════════════════════════════════════════════════════════
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    const adCopy = await adCopyService.getAdCopyById(userId, id)
    return successResponse(res, adCopy)
  } catch (err) {
    next(err)
  }
})

// ═══════════════════════════════════════════════════════════════
//  POST /api/ad-copies — Create ad copy (single)
// ═══════════════════════════════════════════════════════════════
router.post('/', validate(createAdCopySchema), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const adCopy = await adCopyService.createAdCopy(userId, req.body)
    return successResponse(res, adCopy, 'Ad copy created successfully', 201)
  } catch (err) {
    next(err)
  }
})

// ═══════════════════════════════════════════════════════════════
//  POST /api/ad-copies/batch — Create multiple ad copies (AI batch)
// ═══════════════════════════════════════════════════════════════
router.post('/batch', validate(batchCreateSchema), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const { campaignId, copies } = req.body

    const created = await adCopyService.createAdCopyBatch(userId, campaignId, copies)
    return successResponse(res, created, `${created.length} ad copies created successfully`, 201)
  } catch (err) {
    next(err)
  }
})

// ═══════════════════════════════════════════════════════════════
//  PUT /api/ad-copies/:id — Update ad copy
// ═══════════════════════════════════════════════════════════════
router.put('/:id', validate(updateAdCopySchema), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    const adCopy = await adCopyService.updateAdCopy(userId, id, req.body)
    return successResponse(res, adCopy, 'Ad copy updated successfully')
  } catch (err) {
    next(err)
  }
})

// ═══════════════════════════════════════════════════════════════
//  DELETE /api/ad-copies/:id — Delete ad copy
// ═══════════════════════════════════════════════════════════════
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    const result = await adCopyService.deleteAdCopy(userId, id)
    return successResponse(res, result, 'Ad copy deleted successfully')
  } catch (err) {
    next(err)
  }
})

// ═══════════════════════════════════════════════════════════════
//  POST /api/ad-copies/:id/set-primary — Set as primary
// ═══════════════════════════════════════════════════════════════
router.post('/:id/set-primary', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    const adCopy = await adCopyService.setAdCopyPrimary(userId, id)
    return successResponse(res, adCopy, 'Ad copy set as primary successfully')
  } catch (err) {
    next(err)
  }
})

export default router
