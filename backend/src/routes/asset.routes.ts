import { Router } from 'express'
import { z } from 'zod'
import cloudinary from '../config/cloudinary'
import { upload } from '../middleware/upload'
import { successResponse, paginatedResponse } from '../utils/response'
import { AuthRequest } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { ApiError } from '../middleware/errorHandler'
import * as assetService from '../services/asset.service'

const router = Router()

// ─── Validation Schemas ──────────────────────────────────────

const updateTagsSchema = z.object({
  tags: z.array(z.string().min(1)).max(20),
})

const linkCampaignSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required'),
})

// ─── Helper: Upload to Cloudinary ────────────────────────────

function uploadToCloudinary(
  buffer: Buffer,
  options: Record<string, unknown>
): Promise<{ secure_url: string; public_id: string; bytes: number }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload failed'))
        } else {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            bytes: result.bytes,
          })
        }
      }
    )
    stream.end(buffer)
  })
}

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

      // Upload to Cloudinary
      const cloudinaryType = assetType === 'VIDEO' ? 'video' : 'image'
      const result = await uploadToCloudinary(file.buffer, {
        folder: `nhyqr/assets/${userId}`,
        resource_type: cloudinaryType,
      })

      // Parse dimensions for images
      let dimensions: string | null = null
      if (assetType === 'IMAGE' && result.secure_url) {
        // Cloudinary includes width/height in result
        const cldResult = result as unknown as Record<string, unknown>
        if (cldResult.width && cldResult.height) {
          dimensions = `${cldResult.width}x${cldResult.height}`
        }
      }

      // Create database record
      const asset = await assetService.createAsset(userId, {
        name: req.body.name || file.originalname || 'Untitled',
        type: assetType,
        url: result.secure_url,
        platform,
        size: result.bytes,
        dimensions,
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

    // Delete from Cloudinary
    try {
      const resourceType = asset.type === 'VIDEO' ? 'video' : 'image'
      // Extract public_id from Cloudinary URL
      const urlParts = asset.url.split('/')
      const uploadIndex = urlParts.indexOf('upload')
      if (uploadIndex !== -1) {
        const publicIdWithVersion = urlParts.slice(uploadIndex + 1).join('/')
        const publicId = publicIdWithVersion.replace(/^v\d+\//, '').split('.')[0]
        await cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
        })
      }
    } catch (cloudinaryErr) {
      // Log but don't fail if Cloudinary deletion fails
      console.error('Failed to delete from Cloudinary:', cloudinaryErr)
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
