import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../config/database'
import { successResponse } from '../utils/response'
import { AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { ApiError } from '../middleware/errorHandler'
import { Platform } from '@prisma/client'
import * as analyticsServiceRaw from '../services/analytics.service'
import { instrumentServiceModule } from '../utils/logger'

const router = Router()
const analyticsService = instrumentServiceModule('AnalyticsService', analyticsServiceRaw)

// ─── Validation Schemas ──────────────────────────────────────

const trackEventSchema = z.object({
  campaignId: z.string().min(1),
  platform: z.nativeEnum(Platform),
  eventType: z.enum([
    'impression',
    'click',
    'lead',
    'engagement',
    'like',
    'comment',
    'share',
    'save',
  ]),
  value: z.number().int().min(1).optional(),
  date: z.string().datetime().optional(),
})

// ─── Dashboard KPIs ──────────────────────────────────────────

router.get('/dashboard', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId

    const kpis = await analyticsService.getDashboardKPIs(userId)

    return successResponse(res, kpis)
  } catch (err) {
    next(err)
  }
})

// ─── Performance Trend ───────────────────────────────────────

router.get('/performance', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const days = req.query.days ? parseInt(req.query.days as string) : 30
    const campaignId = (req.query.campaignId as string) || undefined
    const platform = (req.query.platform as Platform) || undefined

    const trend = await analyticsService.getPerformanceTrend(userId, {
      days,
      campaignId,
      platform,
    })

    return successResponse(res, trend)
  } catch (err) {
    next(err)
  }
})

// ─── Campaign Performance Table ──────────────────────────────

router.get('/campaigns', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const sortBy = (req.query.sortBy as string) || undefined
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || undefined

    const campaigns = await analyticsService.getCampaignPerformance(userId, sortBy, sortOrder)

    return successResponse(res, campaigns)
  } catch (err) {
    next(err)
  }
})

// ─── Platform Comparison ─────────────────────────────────────

router.get('/platforms', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const campaignId = (req.query.campaignId as string) || undefined

    const platforms = await analyticsService.getPlatformComparison(userId, campaignId)

    return successResponse(res, platforms)
  } catch (err) {
    next(err)
  }
})

// ─── Engagement Breakdown ────────────────────────────────────

router.get('/engagement', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const campaignId = (req.query.campaignId as string) || undefined

    const engagement = await analyticsService.getEngagementBreakdown(userId, campaignId)

    return successResponse(res, engagement)
  } catch (err) {
    next(err)
  }
})

// ─── Audience Demographics ───────────────────────────────────

router.get('/audience', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const campaignId = (req.query.campaignId as string) || undefined

    const audience = await analyticsService.getAudienceDemographics(userId, campaignId)

    return successResponse(res, audience)
  } catch (err) {
    next(err)
  }
})

// ─── Record Analytics Event ──────────────────────────────────

router.post('/track', validate(trackEventSchema), async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId
    const body = req.body as z.infer<typeof trackEventSchema>

    const record = await analyticsService.recordAnalyticsEvent(userId, {
      ...body,
      date: body.date ? new Date(body.date) : undefined,
    })

    return successResponse(res, record, 'Event recorded', 201)
  } catch (err) {
    if (err instanceof Error) {
      return next(new ApiError(400, err.message))
    }
    next(err)
  }
})

export default router
