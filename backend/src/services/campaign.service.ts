import { prisma } from '../config/database'
import { ApiError } from '../middleware/errorHandler'
import { CampaignStatus, CampaignObjective, Prisma } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────
export interface CampaignFilters {
  status?: CampaignStatus
  platform?: string
  search?: string
}

export interface CreateCampaignInput {
  name: string
  objective: CampaignObjective
  platforms: string[]
  status?: CampaignStatus
  budget?: number
  startDate?: string | Date
  endDate?: string | Date
  targetAudience?: string
  description?: string
}

export interface UpdateCampaignInput {
  name?: string
  objective?: CampaignObjective
  platforms?: string[]
  budget?: number
  startDate?: string | Date
  endDate?: string | Date
  targetAudience?: string
  description?: string
}

// ─── Helper: Build Where Clause ───────────────────────────────
function buildWhereClause(userId: string, filters?: CampaignFilters): Prisma.CampaignWhereInput {
  const where: Prisma.CampaignWhereInput = { userId }

  if (filters?.status) {
    where.status = filters.status
  }

  if (filters?.platform) {
    where.platforms = { has: filters.platform }
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  return where
}

// ─── List Campaigns ───────────────────────────────────────────
export async function listCampaigns(
  userId: string,
  filters: CampaignFilters,
  page: number,
  limit: number
) {
  const where = buildWhereClause(userId, filters)

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            adCopies: true,
            assets: true,
            scheduledPosts: true,
          },
        },
      },
    }),
    prisma.campaign.count({ where }),
  ])

  return { campaigns, total }
}

// ─── Get Single Campaign ──────────────────────────────────────
export async function getCampaignById(userId: string, campaignId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
    include: {
      adCopies: {
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      },
      assets: {
        include: {
          asset: true,
        },
      },
      analytics: {
        orderBy: { date: 'desc' },
        take: 30,
      },
      scheduledPosts: {
        orderBy: { scheduledAt: 'desc' },
        take: 20,
      },
      _count: {
        select: {
          adCopies: true,
          assets: true,
          analytics: true,
          scheduledPosts: true,
        },
      },
    },
  })

  if (!campaign) {
    throw new ApiError(404, 'Campaign not found')
  }

  return campaign
}

// ─── Create Campaign ──────────────────────────────────────────
export async function createCampaign(userId: string, input: CreateCampaignInput) {
  const data: Prisma.CampaignCreateInput = {
    user: { connect: { id: userId } },
    name: input.name,
    objective: input.objective,
    platforms: input.platforms,
    status: input.status || CampaignStatus.DRAFT,
    budget: input.budget ?? null,
    startDate: input.startDate ? new Date(input.startDate) : null,
    endDate: input.endDate ? new Date(input.endDate) : null,
    targetAudience: input.targetAudience ?? null,
    description: input.description ?? null,
  }

  const campaign = await prisma.campaign.create({
    data,
    include: {
      _count: {
        select: {
          adCopies: true,
          assets: true,
          scheduledPosts: true,
        },
      },
    },
  })

  return campaign
}

// ─── Update Campaign ──────────────────────────────────────────
export async function updateCampaign(
  userId: string,
  campaignId: string,
  input: UpdateCampaignInput
) {
  const existing = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
  })

  if (!existing) {
    throw new ApiError(404, 'Campaign not found')
  }

  const data: Prisma.CampaignUpdateInput = {}

  if (input.name !== undefined) data.name = input.name
  if (input.objective !== undefined) data.objective = input.objective
  if (input.platforms !== undefined) data.platforms = input.platforms
  if (input.budget !== undefined) data.budget = input.budget ?? null
  if (input.startDate !== undefined) {
    data.startDate = input.startDate ? new Date(input.startDate) : null
  }
  if (input.endDate !== undefined) {
    data.endDate = input.endDate ? new Date(input.endDate) : null
  }
  if (input.targetAudience !== undefined) data.targetAudience = input.targetAudience ?? null
  if (input.description !== undefined) data.description = input.description ?? null

  const campaign = await prisma.campaign.update({
    where: { id: campaignId },
    data,
    include: {
      _count: {
        select: {
          adCopies: true,
          assets: true,
          scheduledPosts: true,
        },
      },
    },
  })

  return campaign
}

// ─── Update Campaign Status ───────────────────────────────────
export async function updateCampaignStatus(
  userId: string,
  campaignId: string,
  status: CampaignStatus
) {
  const existing = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
  })

  if (!existing) {
    throw new ApiError(404, 'Campaign not found')
  }

  // Validate status transitions
  const validTransitions: Record<CampaignStatus, CampaignStatus[]> = {
    [CampaignStatus.DRAFT]: [CampaignStatus.SCHEDULED, CampaignStatus.ACTIVE, CampaignStatus.CANCELLED],
    [CampaignStatus.SCHEDULED]: [CampaignStatus.ACTIVE, CampaignStatus.PAUSED, CampaignStatus.CANCELLED],
    [CampaignStatus.ACTIVE]: [CampaignStatus.PAUSED, CampaignStatus.COMPLETED, CampaignStatus.CANCELLED],
    [CampaignStatus.PAUSED]: [CampaignStatus.ACTIVE, CampaignStatus.CANCELLED],
    [CampaignStatus.COMPLETED]: [],
    [CampaignStatus.CANCELLED]: [CampaignStatus.DRAFT],
  }

  const allowedNextStatuses = validTransitions[existing.status] || []
  if (!allowedNextStatuses.includes(status)) {
    throw new ApiError(
      400,
      `Invalid status transition from ${existing.status} to ${status}`
    )
  }

  const campaign = await prisma.campaign.update({
    where: { id: campaignId },
    data: { status },
    include: {
      _count: {
        select: {
          adCopies: true,
          assets: true,
          scheduledPosts: true,
        },
      },
    },
  })

  return campaign
}

// ─── Delete Campaign ──────────────────────────────────────────
export async function deleteCampaign(userId: string, campaignId: string) {
  const existing = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
  })

  if (!existing) {
    throw new ApiError(404, 'Campaign not found')
  }

  await prisma.campaign.delete({
    where: { id: campaignId },
  })

  return { deleted: true }
}

// ─── Duplicate Campaign ───────────────────────────────────────
export async function duplicateCampaign(userId: string, campaignId: string) {
  const existing = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
    include: {
      adCopies: true,
      assets: true,
    },
  })

  if (!existing) {
    throw new ApiError(404, 'Campaign not found')
  }

  const newName = `${existing.name} (Copy)`

  // Use a transaction to duplicate campaign + ad copies + asset links
  const newCampaign = await prisma.$transaction(async (tx) => {
    // 1. Create the duplicated campaign
    const duplicated = await tx.campaign.create({
      data: {
        userId,
        name: newName,
        objective: existing.objective,
        platforms: existing.platforms,
        status: CampaignStatus.DRAFT,
        budget: existing.budget,
        startDate: existing.startDate,
        endDate: existing.endDate,
        targetAudience: existing.targetAudience,
        description: existing.description,
      },
    })

    // 2. Duplicate ad copies
    if (existing.adCopies.length > 0) {
      await tx.adCopy.createMany({
        data: existing.adCopies.map((adCopy) => ({
          campaignId: duplicated.id,
          platform: adCopy.platform,
          headline: adCopy.headline,
          body: adCopy.body,
          cta: adCopy.cta,
          hashtags: adCopy.hashtags,
          variations: adCopy.variations ?? Prisma.JsonNull,
          isPrimary: adCopy.isPrimary,
        })),
      })
    }

    // 3. Duplicate campaign asset links
    if (existing.assets.length > 0) {
      await tx.campaignAsset.createMany({
        data: existing.assets.map((assetLink) => ({
          campaignId: duplicated.id,
          assetId: assetLink.assetId,
        })),
      })
    }

    return duplicated
  })

  // Fetch the full duplicated campaign with counts
  const result = await prisma.campaign.findUnique({
    where: { id: newCampaign.id },
    include: {
      adCopies: {
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      },
      assets: {
        include: { asset: true },
      },
      _count: {
        select: {
          adCopies: true,
          assets: true,
          scheduledPosts: true,
        },
      },
    },
  })

  return result
}

// ─── Campaign Stats ───────────────────────────────────────────
export async function getCampaignStats(userId: string) {
  const [total, byStatus, activeSpent] = await Promise.all([
    prisma.campaign.count({ where: { userId } }),
    prisma.campaign.groupBy({
      by: ['status'],
      where: { userId },
      _count: { status: true },
    }),
    prisma.campaign.aggregate({
      where: { userId, status: CampaignStatus.ACTIVE },
      _sum: { spent: true },
    }),
  ])

  const statusCounts = byStatus.reduce(
    (acc, curr) => {
      acc[curr.status] = curr._count.status
      return acc
    },
    {} as Record<string, number>
  )

  return {
    total,
    byStatus: statusCounts,
    activeSpent: activeSpent._sum.spent || 0,
  }
}
