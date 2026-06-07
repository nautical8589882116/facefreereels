import { prisma } from '../config/database'
import { Prisma } from '@prisma/client'

export interface AssetFilters {
  type?: string
  platform?: string
  search?: string
  sort?: string
  page?: number
  limit?: number
}

export async function listAssets(userId: string, filters: AssetFilters) {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 12
  const skip = (page - 1) * limit

  const where: Prisma.AssetWhereInput = { userId }

  if (filters.type) {
    where.type = filters.type as Prisma.EnumAssetTypeFilter
  }

  if (filters.platform) {
    where.platform = filters.platform as Prisma.EnumPlatformFilter
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { tags: { has: filters.search } },
    ]
  }

  const orderBy = parseSortOrder(filters.sort)

  const [data, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.asset.count({ where }),
  ])

  return { data, total, page, limit }
}

export async function getAssetById(id: string, userId: string) {
  const asset = await prisma.asset.findFirst({
    where: { id, userId },
    include: {
      campaigns: {
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      },
    },
  })

  return asset
}

export async function createAsset(
  userId: string,
  data: {
    name: string
    type: string
    url: string
    platform?: string | null
    size: number
    dimensions?: string | null
    mimeType?: string | null
    isPublic?: boolean
    tags?: string[]
  }
) {
  return prisma.asset.create({
    data: {
      userId,
      name: data.name,
      type: data.type as Prisma.AssetCreateInput['type'],
      url: data.url,
      platform: data.platform as Prisma.AssetCreateInput['platform'] ?? null,
      size: data.size,
      dimensions: data.dimensions ?? null,
      mimeType: data.mimeType ?? null,
      isPublic: data.isPublic ?? false,
      tags: data.tags ?? [],
    },
  })
}

export async function deleteAsset(id: string, userId: string) {
  const asset = await prisma.asset.findFirst({ where: { id, userId } })
  if (!asset) return null

  await prisma.asset.delete({ where: { id } })
  return asset
}

export async function updateAssetTags(
  id: string,
  userId: string,
  tags: string[]
) {
  const asset = await prisma.asset.findFirst({ where: { id, userId } })
  if (!asset) return null

  return prisma.asset.update({
    where: { id },
    data: { tags },
  })
}

export async function linkAssetToCampaign(
  assetId: string,
  userId: string,
  campaignId: string
) {
  // Verify asset belongs to user
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, userId },
  })
  if (!asset) return null

  // Verify campaign belongs to user
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
  })
  if (!campaign) return null

  return prisma.campaignAsset.upsert({
    where: {
      campaignId_assetId: {
        campaignId,
        assetId,
      },
    },
    create: {
      campaignId,
      assetId,
    },
    update: {},
  })
}

// ─── Helpers ───────────────────────────────────────────────────

function parseSortOrder(
  sort?: string
): Prisma.AssetOrderByWithRelationInput | Prisma.AssetOrderByWithRelationInput[] {
  switch (sort) {
    case 'name_asc':
      return { name: 'asc' }
    case 'name_desc':
      return { name: 'desc' }
    case 'size_asc':
      return { size: 'asc' }
    case 'size_desc':
      return { size: 'desc' }
    case 'oldest':
      return { createdAt: 'asc' }
    case 'newest':
    default:
      return { createdAt: 'desc' }
  }
}
