import { Router } from 'express'
import { randomUUID } from 'crypto'
import path from 'path'
import { z } from 'zod'
import {
  uploadBuffer,
  removeObject,
  objectPathFromPublicUrl,
} from '../config/supabase'
import { upload } from '../middleware/upload'
import { successResponse, paginatedResponse } from '../utils/response'
import { AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { ApiError } from '../middleware/errorHandler'
import * as assetServiceRaw from '../services/asset.service'
import { instrumentServiceModule } from '../utils/logger'

const router = Router()
const assetService = instrumentServiceModule('AssetService', assetServiceRaw)

// ─── Validation Schemas ──────────────────────────────────────

const updateTagsSchema = z.object({
  tags: z.array(z.string().min(1)).max(20),
})

const linkCampaignSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required'),
})

// ─── GET /api/assets ─────────────────────────────────────────

router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(50, parseInt(req.query.limit as string) || 12)
    const type = (req.query.type as string) || undefined
    const platform = (req.query.platform as string) || undefined
    const search = (req.query.search as string) || undefined
    const sort = (req.query.sort as string) || 'newest'

    const result = await assetService.listAssets(req.user!.userId, {
      page,
      limit,
      type,
      platform,
      search,
      sort,
    })

    paginatedResponse(res, result.data, result.total, result.page, result.limit)
  } catch (err) {
    next(err)
  }
})

// ─── GET /api/assets/:id ─────────────────────────────────────

router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const asset = await assetService.getAssetById(
      req.params.id,
      req.user!.userId
    )

    if (!asset) {
      throw new ApiError(404, 'Asset not found')
    }

    // Build usage summary
    const usage = {
      campaignCount: asset.campaigns.length,
      campaigns: asset.campaigns.map((ca) => ({
        id: ca.campaign.id,
        name: ca.campaign.name,
        status: ca.campaign.status,
      })),
    }

    successResponse(res, { ...asset, usage })
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/assets/upload ─────────────────────────────────

router.post(
  '/upload',
  upload.single('file'),
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.file) {
        throw new ApiError(400, 'No file provided')
      }

      const userId = req.user!.userId
      const file = req.file

      // Determine asset type from mimetype
      const mimeType = file.mimetype
      let assetType: string
      if (mimeType.startsWith('video/')) {
        assetType = 'VIDEO'
      } else if (mimeType.startsWith('audio/')) {
        assetType = 'AUDIO'
      } else if (mimeType.startsWith('image/')) {
        assetType = 'IMAGE'
      } else {
        throw new ApiError(400, `Unsupported file type: ${mimeType}`)
      }

      const platform = (req.body.platform as string) || null

      // Upload to Supabase Storage under a per-user folder
      const ext = path.extname(file.originalname || '').toLowerCase()
      const objectPath = `${userId}/${randomUUID()}${ext}`
      const result = await uploadBuffer(objectPath, file.buffer, mimeType)

      // Create database record
      const asset = await assetService.createAsset(userId, {
        name: req.body.name || file.originalname || 'Untitled',
        type: assetType,
        url: result.publicUrl,
        platform,
        size: result.size,
        dimensions: null,
        mimeType,
        isPublic: req.body.isPublic === 'true',
        tags: req.body.tags
          ? (req.body.tags as string).split(',').map((t: string) => t.trim())
          : [],
      })

      successResponse(res, asset, 'Asset uploaded successfully', 201)
    } catch (err) {
      next(err)
    }
  }
)

// ─── DELETE /api/assets/:id ──────────────────────────────────

router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const asset = await assetService.deleteAsset(
      req.params.id,
      req.user!.userId
    )

    if (!asset) {
      throw new ApiError(404, 'Asset not found')
    }

    // Delete from Supabase Storage
    try {
      const objectPath = objectPathFromPublicUrl(asset.url)
      if (objectPath) {
        await removeObject(objectPath)
      }
    } catch (storageErr) {
      // Log but don't fail if storage deletion fails
      console.error('Failed to delete from Supabase Storage:', storageErr)
    }

    successResponse(res, { id: asset.id }, 'Asset deleted successfully')
  } catch (err) {
    next(err)
  }
})

// ─── PATCH /api/assets/:id/tags ──────────────────────────────

router.patch(
  '/:id/tags',
  validate(updateTagsSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const asset = await assetService.updateAssetTags(
        req.params.id,
        req.user!.userId,
        req.body.tags
      )

      if (!asset) {
        throw new ApiError(404, 'Asset not found')
      }

      successResponse(res, asset, 'Tags updated successfully')
    } catch (err) {
      next(err)
    }
  }
)

// ─── POST /api/assets/:id/link-campaign ──────────────────────

router.post(
  '/:id/link-campaign',
  validate(linkCampaignSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const link = await assetService.linkAssetToCampaign(
        req.params.id,
        req.user!.userId,
        req.body.campaignId
      )

      if (!link) {
        throw new ApiError(404, 'Asset or campaign not found')
      }

      successResponse(res, link, 'Asset linked to campaign')
    } catch (err) {
      if (err instanceof ApiError) {
        next(err)
      } else {
        next(new ApiError(500, 'Failed to link asset to campaign'))
      }
    }
  }
)

export default router
