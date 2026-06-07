import { Router } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { successResponse, paginatedResponse } from '../utils/response'
import * as campaignService from '../services/campaign.service'
import { CampaignStatus, CampaignObjective } from '@prisma/client'

const router = Router()

// ─── Validation Schemas ───────────────────────────────────────
const campaignStatusSchema = z.nativeEnum(CampaignStatus)
const campaignObjectiveSchema = z.nativeEnum(CampaignObjective)

const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(200),
  objective: campaignObjectiveSchema,
  platforms: z.array(z.string()).min(1, 'At least one platform is required'),
  status: campaignStatusSchema.optional(),
  budget: z.number().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  targetAudience: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
})

const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  objective: campaignObjectiveSchema.optional(),
  platforms: z.array(z.string()).min(1).optional(),
  budget: z.number().positive().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  targetAudience: z.string().max(500).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
})

const updateStatusSchema = z.object({
  status: campaignStatusSchema,
})

// ─── Helper: Parse pagination ─────────────────────────────────
function getPagination(req: AuthRequest) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
  return { page, limit }
}

// ═══════════════════════════════════════════════════════════════
//  GET /api/campaigns — List campaigns
// ═══════════════════════════════════════════════════════════════
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const { page, limit } = getPagination(req)

    const filters = {
      status: req.query.status as CampaignStatus | undefined,
      platform: req.query.platform as string | undefined,
      search: req.query.search as string | undefined,
    }

    const { campaigns, total } = await campaignService.listCampaigns(
      userId,
      filters,
      page,
      limit
    )

    return paginatedResponse(res, campaigns, total, page, limit)
  } catch (err) {
    next(err)
  }
})

// ═══════════════════════════════════════════════════════════════
//  GET /api/campaigns/stats — Campaign statistics
// ═══════════════════════════════════════════════════════════════
router.get('/stats', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const stats = await campaignService.getCampaignStats(userId)
    return successResponse(res, stats)
  } catch (err) {
    next(err)
  }
})

// ═══════════════════════════════════════════════════════════════
//  GET /api/campaigns/:id — Get single campaign
// ═══════════════════════════════════════════════════════════════
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    const campaign = await campaignService.getCampaignById(userId, id)
    return successResponse(res, campaign)
  } catch (err) {
    next(err)
  }
})

// ═══════════════════════════════════════════════════════════════
//  POST /api/campaigns — Create campaign
// ═══════════════════════════════════════════════════════════════
router.post('/', validate(createCampaignSchema), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const campaign = await campaignService.createCampaign(userId, req.body)
    return successResponse(res, campaign, 'Campaign created successfully', 201)
  } catch (err) {
    next(err)
  }
})

// ═══════════════════════════════════════════════════════════════
//  PUT /api/campaigns/:id — Update campaign
// ═══════════════════════════════════════════════════════════════
router.put('/:id', validate(updateCampaignSchema), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    const campaign = await campaignService.updateCampaign(userId, id, req.body)
    return successResponse(res, campaign, 'Campaign updated successfully')
  } catch (err) {
    next(err)
  }
})

// ═══════════════════════════════════════════════════════════════
//  PATCH /api/campaigns/:id/status — Update status only
// ═══════════════════════════════════════════════════════════════
router.patch(
  '/:id/status',
  validate(updateStatusSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user!.userId
      const { id } = req.params
      const { status } = req.body

      const campaign = await campaignService.updateCampaignStatus(userId, id, status)
      return successResponse(res, campaign, 'Campaign status updated successfully')
    } catch (err) {
      next(err)
    }
  }
)

// ═══════════════════════════════════════════════════════════════
//  DELETE /api/campaigns/:id — Delete campaign
// ═══════════════════════════════════════════════════════════════
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    const result = await campaignService.deleteCampaign(userId, id)
    return successResponse(res, result, 'Campaign deleted successfully')
  } catch (err) {
    next(err)
  }
})

// ═══════════════════════════════════════════════════════════════
//  POST /api/campaigns/:id/duplicate — Duplicate campaign
// ═══════════════════════════════════════════════════════════════
router.post('/:id/duplicate', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    const campaign = await campaignService.duplicateCampaign(userId, id)
    return successResponse(res, campaign, 'Campaign duplicated successfully', 201)
  } catch (err) {
    next(err)
  }
})

export default router
