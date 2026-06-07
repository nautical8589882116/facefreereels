import { prisma } from '../config/database'
import { ApiError } from '../middleware/errorHandler'
import { Platform, Prisma } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────
export interface AdCopyFilters {
  campaignId?: string
  platform?: Platform
}

export interface CreateAdCopyInput {
  campaignId: string
  platform: Platform
  headline: string
  body: string
  cta: string
  hashtags?: string[]
  variations?: Prisma.InputJsonValue
  isPrimary?: boolean
}

export interface UpdateAdCopyInput {
  platform?: Platform
  headline?: string
  body?: string
  cta?: string
  hashtags?: string[]
  variations?: Prisma.InputJsonValue
  isPrimary?: boolean
}

// ─── Helper: Verify campaign ownership ────────────────────────
async function verifyCampaignOwnership(userId: string, campaignId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
  })
  if (!campaign) {
    throw new ApiError(404, 'Campaign not found')
  }
  return campaign
}

// ─── List Ad Copies ───────────────────────────────────────────
export async function listAdCopies(
  userId: string,
  filters: AdCopyFilters,
  page: number,
  limit: number
) {
  const where: Prisma.AdCopyWhereInput = {}

  // If campaignId is provided, verify ownership and filter
  if (filters.campaignId) {
    await verifyCampaignOwnership(userId, filters.campaignId)
    where.campaignId = filters.campaignId
  } else {
    // Otherwise only show ad copies from campaigns owned by this user
    where.campaign = { userId }
  }

  if (filters.platform) {
    where.platform = filters.platform
  }

  const [adCopies, total] = await Promise.all([
    prisma.adCopy.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
      },
    }),
    prisma.adCopy.count({ where }),
  ])

  return { adCopies, total }
}

// ─── Get Single Ad Copy ───────────────────────────────────────
export async function getAdCopyById(userId: string, adCopyId: string) {
  const adCopy = await prisma.adCopy.findFirst({
    where: {
      id: adCopyId,
      campaign: { userId },
    },
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
          objective: true,
          platforms: true,
          status: true,
          userId: true,
        },
      },
    },
  })

  if (!adCopy) {
    throw new ApiError(404, 'Ad copy not found')
  }

  return adCopy
}

// ─── Create Ad Copy ───────────────────────────────────────────
export async function createAdCopy(userId: string, input: CreateAdCopyInput) {
  // Verify the campaign belongs to the user
  await verifyCampaignOwnership(userId, input.campaignId)

  // If setting as primary, unset any existing primary for this campaign+platform
  if (input.isPrimary) {
    await prisma.adCopy.updateMany({
      where: {
        campaignId: input.campaignId,
        platform: input.platform,
        isPrimary: true,
      },
      data: { isPrimary: false },
    })
  }

  const adCopy = await prisma.adCopy.create({
    data: {
      campaignId: input.campaignId,
      platform: input.platform,
      headline: input.headline,
      body: input.body,
      cta: input.cta,
      hashtags: input.hashtags || [],
      variations: input.variations ?? Prisma.JsonNull,
      isPrimary: input.isPrimary || false,
    },
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
          userId: true,
        },
      },
    },
  })

  return adCopy
}

// ─── Create Multiple Ad Copies (AI-generated batch) ───────────
export async function createAdCopyBatch(
  userId: string,
  campaignId: string,
  copies: Omit<CreateAdCopyInput, 'campaignId'>[]
) {
  await verifyCampaignOwnership(userId, campaignId)

  const created = await prisma.$transaction(async (tx) => {
    // Handle primary flags within the batch
    const platformPrimaryMap = new Map<Platform, boolean>()

    for (const copy of copies) {
      if (copy.isPrimary && !platformPrimaryMap.get(copy.platform)) {
        platformPrimaryMap.set(copy.platform, true)
      } else if (copy.isPrimary && platformPrimaryMap.get(copy.platform)) {
        copy.isPrimary = false
      }
    }

    // Unset existing primary ad copies for affected platforms
    const platformsWithPrimary = copies.filter((c) => c.isPrimary).map((c) => c.platform)
    if (platformsWithPrimary.length > 0) {
      await tx.adCopy.updateMany({
        where: {
          campaignId,
          platform: { in: platformsWithPrimary },
          isPrimary: true,
        },
        data: { isPrimary: false },
      })
    }

    // Create all ad copies
    const results = await Promise.all(
      copies.map((copy) =>
        tx.adCopy.create({
          data: {
            campaignId,
            platform: copy.platform,
            headline: copy.headline,
            body: copy.body,
            cta: copy.cta,
            hashtags: copy.hashtags || [],
            variations: copy.variations ?? Prisma.JsonNull,
            isPrimary: copy.isPrimary || false,
          },
        })
      )
    )

    return results
  })

  return created
}

// ─── Update Ad Copy ───────────────────────────────────────────
export async function updateAdCopy(
  userId: string,
  adCopyId: string,
  input: UpdateAdCopyInput
) {
  const existing = await prisma.adCopy.findFirst({
    where: {
      id: adCopyId,
      campaign: { userId },
    },
  })

  if (!existing) {
    throw new ApiError(404, 'Ad copy not found')
  }

  const data: Prisma.AdCopyUpdateInput = {}

  if (input.platform !== undefined) data.platform = input.platform
  if (input.headline !== undefined) data.headline = input.headline
  if (input.body !== undefined) data.body = input.body
  if (input.cta !== undefined) data.cta = input.cta
  if (input.hashtags !== undefined) data.hashtags = input.hashtags
  if (input.variations !== undefined) data.variations = input.variations ?? Prisma.JsonNull

  // Handle isPrimary flag
  if (input.isPrimary !== undefined && input.isPrimary && !existing.isPrimary) {
    // Unset existing primary for this campaign + platform
    await prisma.adCopy.updateMany({
      where: {
        campaignId: existing.campaignId,
        platform: input.platform || existing.platform,
        isPrimary: true,
        NOT: { id: adCopyId },
      },
      data: { isPrimary: false },
    })
    data.isPrimary = true
  } else if (input.isPrimary !== undefined) {
    data.isPrimary = input.isPrimary
  }

  const adCopy = await prisma.adCopy.update({
    where: { id: adCopyId },
    data,
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
          userId: true,
        },
      },
    },
  })

  return adCopy
}

// ─── Delete Ad Copy ───────────────────────────────────────────
export async function deleteAdCopy(userId: string, adCopyId: string) {
  const existing = await prisma.adCopy.findFirst({
    where: {
      id: adCopyId,
      campaign: { userId },
    },
  })

  if (!existing) {
    throw new ApiError(404, 'Ad copy not found')
  }

  await prisma.adCopy.delete({
    where: { id: adCopyId },
  })

  return { deleted: true }
}

// ─── Set Ad Copy as Primary ───────────────────────────────────
export async function setAdCopyPrimary(userId: string, adCopyId: string) {
  const existing = await prisma.adCopy.findFirst({
    where: {
      id: adCopyId,
      campaign: { userId },
    },
  })

  if (!existing) {
    throw new ApiError(404, 'Ad copy not found')
  }

  // Use transaction to unset existing primary and set new one
  const adCopy = await prisma.$transaction(async (tx) => {
    // Unset existing primary for this campaign + platform
    await tx.adCopy.updateMany({
      where: {
        campaignId: existing.campaignId,
        platform: existing.platform,
        isPrimary: true,
        NOT: { id: adCopyId },
      },
      data: { isPrimary: false },
    })

    // Set this one as primary
    const updated = await tx.adCopy.update({
      where: { id: adCopyId },
      data: { isPrimary: true },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
      },
    })

    return updated
  })

  return adCopy
}

// ─── Get Ad Copies for a Specific Campaign ────────────────────
export async function getAdCopiesByCampaign(
  userId: string,
  campaignId: string,
  page: number,
  limit: number
) {
  await verifyCampaignOwnership(userId, campaignId)

  const [adCopies, total] = await Promise.all([
    prisma.adCopy.findMany({
      where: { campaignId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.adCopy.count({ where: { campaignId } }),
  ])

  return { adCopies, total }
}
