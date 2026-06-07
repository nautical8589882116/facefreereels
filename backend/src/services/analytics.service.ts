import { prisma } from '../config/database'
import { Prisma, Platform } from '@prisma/client'

// ─── Types ───────────────────────────────────────────────────

export interface DashboardKPIs {
  impressions: { value: number; trend: number }
  clicks: { value: number; trend: number }
  leads: { value: number; trend: number }
  spend: { value: number; trend: number }
  ctr: { value: number; trend: number }
  cpl: { value: number; trend: number }
}

export interface PerformanceFilters {
  days?: number
  campaignId?: string
  platform?: Platform
}

export interface CampaignPerformance {
  id: string
  name: string
  status: string
  platforms: string[]
  impressions: number
  clicks: number
  leads: number
  spend: number
  engagements: number
  ctr: number
  cpl: number
}

export interface PlatformBreakdown {
  platform: Platform
  impressions: number
  clicks: number
  leads: number
  spend: number
  engagements: number
  likes: number
  comments: number
  shares: number
  saves: number
  ctr: number
  cpl: number
}

export interface EngagementBreakdown {
  likes: number
  comments: number
  shares: number
  saves: number
  total: number
}

export interface AudienceDemo {
  ageGroups: Record<string, number>
  gender: Record<string, number>
  geography: Record<string, number>
  devices: Record<string, number>
}

// ─── Helpers ─────────────────────────────────────────────────

function getPeriodBounds(days: number): { currentStart: Date; currentEnd: Date; previousStart: Date; previousEnd: Date } {
  const now = new Date()
  const currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  const currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1, 0, 0, 0, 0)

  const msInPeriod = currentEnd.getTime() - currentStart.getTime()
  const previousEnd = new Date(currentStart.getTime() - 1)
  const previousStart = new Date(previousEnd.getTime() - msInPeriod)

  return { currentStart, currentEnd, previousStart, previousEnd }
}

function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return parseFloat((((current - previous) / previous) * 100).toFixed(2))
}

function aggregateMetrics(rows: Array<{ impressions: number; clicks: number; leads: number; spend: number; ctr: number; cpl: number }>) {
  return rows.reduce(
    (acc, row) => {
      acc.impressions += row.impressions
      acc.clicks += row.clicks
      acc.leads += row.leads
      acc.spend += row.spend
      return acc
    },
    { impressions: 0, clicks: 0, leads: 0, spend: 0 }
  )
}

function buildWhereClause(userId: string, campaignId?: string, platform?: Platform): Prisma.CampaignAnalyticsWhereInput {
  const where: Prisma.CampaignAnalyticsWhereInput = {}

  if (campaignId) {
    where.campaignId = campaignId
  } else {
    // Scope to user's campaigns if no campaignId specified
    where.campaign = { userId }
  }

  if (platform) {
    where.platform = platform
  }

  return where
}

// ─── Dashboard KPIs ──────────────────────────────────────────

export async function getDashboardKPIs(userId: string): Promise<DashboardKPIs> {
  const { currentStart, currentEnd, previousStart, previousEnd } = getPeriodBounds(30)

  const whereBase = buildWhereClause(userId)

  const [currentData, previousData] = await Promise.all([
    prisma.campaignAnalytics.findMany({
      where: {
        ...whereBase,
        date: { gte: currentStart, lte: currentEnd },
      },
      select: { impressions: true, clicks: true, leads: true, spend: true, ctr: true, cpl: true },
    }),
    prisma.campaignAnalytics.findMany({
      where: {
        ...whereBase,
        date: { gte: previousStart, lte: previousEnd },
      },
      select: { impressions: true, clicks: true, leads: true, spend: true, ctr: true, cpl: true },
    }),
  ])

  const curr = aggregateMetrics(currentData)
  const prev = aggregateMetrics(previousData)

  const currCtr = curr.impressions > 0 ? (curr.clicks / curr.impressions) * 100 : 0
  const prevCtr = prev.impressions > 0 ? (prev.clicks / prev.impressions) * 100 : 0

  const currCpl = curr.leads > 0 ? curr.spend / curr.leads : 0
  const prevCpl = prev.leads > 0 ? prev.spend / prev.leads : 0

  return {
    impressions: { value: curr.impressions, trend: calcTrend(curr.impressions, prev.impressions) },
    clicks: { value: curr.clicks, trend: calcTrend(curr.clicks, prev.clicks) },
    leads: { value: curr.leads, trend: calcTrend(curr.leads, prev.leads) },
    spend: { value: parseFloat(curr.spend.toFixed(2)), trend: calcTrend(curr.spend, prev.spend) },
    ctr: { value: parseFloat(currCtr.toFixed(2)), trend: calcTrend(currCtr, prevCtr) },
    cpl: { value: parseFloat(currCpl.toFixed(2)), trend: calcTrend(currCpl, prevCpl) },
  }
}

// ─── Performance Trend ───────────────────────────────────────

export async function getPerformanceTrend(userId: string, filters: PerformanceFilters) {
  const days = Math.min(365, Math.max(1, filters.days ?? 30))
  const { currentStart, currentEnd } = getPeriodBounds(days)

  const where = buildWhereClause(userId, filters.campaignId, filters.platform)

  const rows = await prisma.campaignAnalytics.findMany({
    where: {
      ...where,
      date: { gte: currentStart, lte: currentEnd },
    },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      impressions: true,
      clicks: true,
      leads: true,
      spend: true,
      engagements: true,
      platform: true,
      campaignId: true,
    },
  })

  // Group by date string
  const grouped: Record<
    string,
    { date: string; impressions: number; clicks: number; leads: number; spend: number; engagements: number }
  > = {}

  for (const row of rows) {
    const dateStr = row.date.toISOString().split('T')[0]
    if (!grouped[dateStr]) {
      grouped[dateStr] = { date: dateStr, impressions: 0, clicks: 0, leads: 0, spend: 0, engagements: 0 }
    }
    grouped[dateStr].impressions += row.impressions
    grouped[dateStr].clicks += row.clicks
    grouped[dateStr].leads += row.leads
    grouped[dateStr].spend += row.spend
    grouped[dateStr].engagements += row.engagements
  }

  // Fill gaps with zeros
  const result = []
  for (let d = new Date(currentStart); d <= currentEnd; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const entry = grouped[dateStr] ?? { date: dateStr, impressions: 0, clicks: 0, leads: 0, spend: 0, engagements: 0 }
    result.push({
      ...entry,
      spend: parseFloat(entry.spend.toFixed(2)),
    })
  }

  return result
}

// ─── Campaign Performance Table ──────────────────────────────

export async function getCampaignPerformance(userId: string, sortBy?: string, sortOrder?: 'asc' | 'desc') {
  const campaigns = await prisma.campaign.findMany({
    where: { userId },
    include: {
      analytics: {
        select: {
          impressions: true,
          clicks: true,
          leads: true,
          spend: true,
          engagements: true,
          ctr: true,
          cpl: true,
        },
      },
    },
  })

  const mapped: CampaignPerformance[] = campaigns.map((c) => {
    const totals = c.analytics.reduce(
      (acc, a) => {
        acc.impressions += a.impressions
        acc.clicks += a.clicks
        acc.leads += a.leads
        acc.spend += a.spend
        acc.engagements += a.engagements
        return acc
      },
      { impressions: 0, clicks: 0, leads: 0, spend: 0, engagements: 0 }
    )

    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
    const cpl = totals.leads > 0 ? totals.spend / totals.leads : 0

    return {
      id: c.id,
      name: c.name,
      status: c.status,
      platforms: c.platforms,
      impressions: totals.impressions,
      clicks: totals.clicks,
      leads: totals.leads,
      spend: parseFloat(totals.spend.toFixed(2)),
      engagements: totals.engagements,
      ctr: parseFloat(ctr.toFixed(2)),
      cpl: parseFloat(cpl.toFixed(2)),
    }
  })

  // Sort if requested
  if (sortBy && mapped.length > 0) {
    const key = sortBy as keyof CampaignPerformance
    const order = sortOrder === 'desc' ? -1 : 1
    mapped.sort((a, b) => {
      const av = a[key]
      const bv = b[key]
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * order
      return String(av).localeCompare(String(bv)) * order
    })
  }

  return mapped
}

// ─── Platform Comparison ─────────────────────────────────────

export async function getPlatformComparison(userId: string, campaignId?: string) {
  const where = buildWhereClause(userId, campaignId)

  const rows = await prisma.campaignAnalytics.groupBy({
    by: ['platform'],
    where,
    _sum: {
      impressions: true,
      clicks: true,
      leads: true,
      spend: true,
      engagements: true,
      likes: true,
      comments: true,
      shares: true,
      saves: true,
    },
    _avg: {
      ctr: true,
      cpl: true,
    },
  })

  const breakdown: PlatformBreakdown[] = rows.map((row) => {
    const s = row._sum
    const a = row._avg
    const ctr = s.impressions && s.clicks !== null ? (s.clicks / s.impressions) * 100 : 0
    const cpl = s.leads && s.spend !== null && s.leads > 0 ? (s.spend ?? 0) / s.leads : 0

    return {
      platform: row.platform,
      impressions: s.impressions ?? 0,
      clicks: s.clicks ?? 0,
      leads: s.leads ?? 0,
      spend: parseFloat((s.spend ?? 0).toFixed(2)),
      engagements: s.engagements ?? 0,
      likes: s.likes ?? 0,
      comments: s.comments ?? 0,
      shares: s.shares ?? 0,
      saves: s.saves ?? 0,
      ctr: parseFloat((a.ctr ?? ctr).toFixed(2)),
      cpl: parseFloat((a.cpl ?? cpl).toFixed(2)),
    }
  })

  // Ensure all platforms are represented
  const allPlatforms = [Platform.INSTAGRAM, Platform.FACEBOOK, Platform.YOUTUBE]
  for (const platform of allPlatforms) {
    if (!breakdown.find((b) => b.platform === platform)) {
      breakdown.push({
        platform,
        impressions: 0,
        clicks: 0,
        leads: 0,
        spend: 0,
        engagements: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        ctr: 0,
        cpl: 0,
      })
    }
  }

  return breakdown.sort((a, b) => a.platform.localeCompare(b.platform))
}

// ─── Engagement Breakdown ────────────────────────────────────

export async function getEngagementBreakdown(userId: string, campaignId?: string) {
  const where = buildWhereClause(userId, campaignId)

  const result = await prisma.campaignAnalytics.aggregate({
    where,
    _sum: {
      likes: true,
      comments: true,
      shares: true,
      saves: true,
      engagements: true,
    },
  })

  const s = result._sum
  const likes = s.likes ?? 0
  const comments = s.comments ?? 0
  const shares = s.shares ?? 0
  const saves = s.saves ?? 0

  return {
    likes,
    comments,
    shares,
    saves,
    total: likes + comments + shares + saves,
  }
}

// ─── Audience Demographics ───────────────────────────────────

export async function getAudienceDemographics(userId: string, _campaignId?: string): Promise<AudienceDemo> {
  const where = buildWhereClause(userId, _campaignId)

  const rows = await prisma.campaignAnalytics.findMany({
    where,
    select: { impressions: true },
  })

  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0)

  // Generate realistic mock demographic distributions weighted by impressions
  // In production, this would come from platform APIs or a dedicated Audience table
  const baseWeight = totalImpressions > 0 ? totalImpressions : 1000

  return {
    ageGroups: {
      '13-17': Math.round(baseWeight * 0.05),
      '18-24': Math.round(baseWeight * 0.22),
      '25-34': Math.round(baseWeight * 0.30),
      '35-44': Math.round(baseWeight * 0.20),
      '45-54': Math.round(baseWeight * 0.13),
      '55-64': Math.round(baseWeight * 0.07),
      '65+': Math.round(baseWeight * 0.03),
    },
    gender: {
      male: Math.round(baseWeight * 0.48),
      female: Math.round(baseWeight * 0.48),
      other: Math.round(baseWeight * 0.04),
    },
    geography: {
      'Maharashtra': Math.round(baseWeight * 0.18),
      'Karnataka': Math.round(baseWeight * 0.15),
      'Delhi NCR': Math.round(baseWeight * 0.14),
      'Tamil Nadu': Math.round(baseWeight * 0.12),
      'Telangana': Math.round(baseWeight * 0.10),
      'Gujarat': Math.round(baseWeight * 0.09),
      'West Bengal': Math.round(baseWeight * 0.08),
      'Rajasthan': Math.round(baseWeight * 0.06),
      'Kerala': Math.round(baseWeight * 0.05),
      'Others': Math.round(baseWeight * 0.03),
    },
    devices: {
      mobile: Math.round(baseWeight * 0.72),
      desktop: Math.round(baseWeight * 0.18),
      tablet: Math.round(baseWeight * 0.10),
    },
  }
}

// ─── Record Analytics Event ──────────────────────────────────

export interface TrackEventInput {
  campaignId: string
  platform: Platform
  eventType: 'impression' | 'click' | 'lead' | 'engagement' | 'like' | 'comment' | 'share' | 'save'
  value?: number
  date?: Date
}

const eventFieldMap: Record<string, string> = {
  impression: 'impressions',
  click: 'clicks',
  lead: 'leads',
  engagement: 'engagements',
  like: 'likes',
  comment: 'comments',
  share: 'shares',
  save: 'saves',
}

export async function recordAnalyticsEvent(userId: string, input: TrackEventInput) {
  const { campaignId, platform, eventType, value, date } = input

  // Verify campaign ownership
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
  })
  if (!campaign) throw new Error('Campaign not found or access denied')

  const eventDate = date ? new Date(date) : new Date()
  // Normalize to start of day
  eventDate.setHours(0, 0, 0, 0)

  const fieldName = eventFieldMap[eventType]
  if (!fieldName) throw new Error(`Unknown event type: ${eventType}`)

  const incrementValue = value ?? 1

  // Upsert analytics row (unique on campaignId + platform + date)
  const upsertData: Prisma.CampaignAnalyticsUpsertArgs = {
    where: {
      campaignId_platform_date: {
        campaignId,
        platform,
        date: eventDate,
      },
    },
    update: {
      [fieldName]: { increment: incrementValue },
    },
    create: {
      campaignId,
      platform,
      date: eventDate,
      [fieldName]: incrementValue,
    },
  }

  const record = await prisma.campaignAnalytics.upsert(upsertData)

  // Recalculate derived metrics
  const updated = await prisma.campaignAnalytics.findUnique({
    where: { id: record.id },
  })

  if (updated) {
    const ctr = updated.impressions > 0 ? (updated.clicks / updated.impressions) * 100 : 0
    const cpl = updated.leads > 0 ? updated.spend / updated.leads : 0
    await prisma.campaignAnalytics.update({
      where: { id: record.id },
      data: { ctr, cpl },
    })
  }

  return record
}
