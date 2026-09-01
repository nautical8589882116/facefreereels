import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  Eye, MousePointerClick, Percent, Users, DollarSign, CreditCard,
  Download, Search, ChevronDown, ChevronUp, TrendingUp, TrendingDown,
  Camera as Instagram, MessagesSquare as Facebook, PlaySquare as Youtube, Clock, CheckCircle, PauseCircle,
  
} from 'lucide-react'

/* ─────────────────────── mock data ─────────────────────── */

// 30-day performance trend data
type TrendPoint = {
  date: string
  impressions: number
  clicks: number
  leads: number
  spend: number
  engagementRate: number
}

function generateTrendData(days: number): TrendPoint[] {
  const data: TrendPoint[] = []
  const baseDate = new Date()
  baseDate.setDate(baseDate.getDate() - days)
  for (let i = 0; i < days; i++) {
    const d = new Date(baseDate)
    d.setDate(d.getDate() + i)
    const dayOfWeek = d.getDay()
    const weekendBoost = dayOfWeek === 0 || dayOfWeek === 6 ? 1.15 : 1
    const trend = 1 + (i / days) * 0.3
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      impressions: Math.round((3800 + Math.random() * 2400) * weekendBoost * trend),
      clicks: Math.round((220 + Math.random() * 160) * weekendBoost * trend),
      leads: Math.round((7 + Math.random() * 9) * weekendBoost * trend),
      spend: Math.round((105 + Math.random() * 95) * weekendBoost * trend * 100) / 100,
      engagementRate: Math.round((5.5 + Math.random() * 3.2) * 10) / 10,
    })
  }
  return data
}

const TREND_7 = generateTrendData(7)
const TREND_30 = generateTrendData(30)
const TREND_90 = generateTrendData(90)

function getTrendData(range: string): TrendPoint[] {
  if (range === '7') return TREND_7
  if (range === '90') return TREND_90
  return TREND_30
}

type Campaign = {
  id: number
  name: string
  platforms: ('IG' | 'FB' | 'YT')[]
  status: 'Published' | 'Paused' | 'Scheduled' | 'Draft'
  impressions: number | null
  clicks: number | null
  ctr: number | null
  leads: number | null
  spend: number
  cpl: number | null
  trend: number[]
}

const CAMPAIGNS: Campaign[] = [
  { id: 1, name: 'Summer Menu Launch', platforms: ['IG', 'FB'], status: 'Published', impressions: 45200, clicks: 2847, ctr: 6.3, leads: 89, spend: 892.00, cpl: 10.02, trend: [3.2, 4.1, 5.8, 6.3, 5.9, 6.1, 6.3] },
  { id: 2, name: 'QR Menu Demo Reel', platforms: ['IG', 'YT'], status: 'Published', impressions: 82100, clicks: 1478, ctr: 1.8, leads: 34, spend: 1200.00, cpl: 35.29, trend: [1.2, 1.5, 1.8, 2.1, 1.9, 1.8, 1.8] },
  { id: 3, name: 'Weekend Special Promo', platforms: ['IG'], status: 'Published', impressions: 28300, clicks: 1162, ctr: 4.1, leads: 52, spend: 680.50, cpl: 13.09, trend: [2.5, 3.1, 3.8, 4.1, 3.9, 4.0, 4.1] },
  { id: 4, name: 'Restaurant Owner Guide', platforms: ['FB', 'YT'], status: 'Published', impressions: 15700, clicks: 393, ctr: 2.5, leads: 28, spend: 525.00, cpl: 18.75, trend: [1.8, 2.0, 2.3, 2.5, 2.4, 2.5, 2.5] },
  { id: 5, name: '5-Star Review Feature', platforms: ['IG', 'FB'], status: 'Paused', impressions: 12400, clicks: 149, ctr: 1.2, leads: 8, spend: 200.00, cpl: 25.00, trend: [0.8, 1.0, 1.2, 1.1, 1.2, 1.0, 1.2] },
  { id: 6, name: 'Cafe Owner Testimonial', platforms: ['FB'], status: 'Scheduled', impressions: null, clicks: null, ctr: null, leads: null, spend: 450.00, cpl: null, trend: [0, 0, 0, 0, 0, 0, 0] },
  { id: 7, name: 'Hotel Digital Menu', platforms: ['YT'], status: 'Draft', impressions: null, clicks: null, ctr: null, leads: null, spend: 0.00, cpl: null, trend: [0, 0, 0, 0, 0, 0, 0] },
  { id: 8, name: 'Fast Setup Promise', platforms: ['IG'], status: 'Scheduled', impressions: null, clicks: null, ctr: null, leads: null, spend: 300.00, cpl: null, trend: [0, 0, 0, 0, 0, 0, 0] },
  { id: 9, name: 'Behind the Scenes', platforms: ['IG'], status: 'Draft', impressions: null, clicks: null, ctr: null, leads: null, spend: 0.00, cpl: null, trend: [0, 0, 0, 0, 0, 0, 0] },
  { id: 10, name: 'Features Overview', platforms: ['FB', 'YT'], status: 'Draft', impressions: null, clicks: null, ctr: null, leads: null, spend: 0.00, cpl: null, trend: [0, 0, 0, 0, 0, 0, 0] },
]

const PLATFORM_DATA = [
  { platform: 'Impressions', Instagram: 78.5, Facebook: 42.3, YouTube: 22.0 },
  { platform: 'Clicks', Instagram: 3891, Facebook: 1847, YouTube: 694 },
  { platform: 'Leads', Instagram: 198, Facebook: 98, YouTube: 30 },
  { platform: 'Spend', Instagram: 2100, Facebook: 1350, YouTube: 797.5 },
]

const PLATFORM_CARDS = [
  {
    name: 'Instagram', color: '#E4405F', bg: '#FDF2F4',
    metrics: { Impressions: '78.5K', CTR: '4.95%', Leads: '198', CPL: '$10.61', Engagement: '3.2%', Reach: '62.1K' },
    trend: '+18%',
  },
  {
    name: 'Facebook', color: '#1877F2', bg: '#EFF6FF',
    metrics: { Impressions: '42.3K', CTR: '4.37%', Leads: '98', CPL: '$13.78', Engagement: '2.8%', Reach: '35.4K' },
    trend: '+12%',
  },
  {
    name: 'YouTube', color: '#FF0000', bg: '#FEF2F2',
    metrics: { Impressions: '22.0K', CTR: '3.15%', Leads: '30', CPL: '$26.58', Engagement: '2.1%', Reach: '18.6K' },
    trend: '+8%',
  },
]

const ENGAGEMENT_DATA = [
  { name: 'Likes', value: 45, color: '#C4814B', count: 5820 },
  { name: 'Comments', value: 18, color: '#4A7FB5', count: 2328 },
  { name: 'Shares', value: 12, color: '#2D8F5A', count: 1552 },
  { name: 'Saves', value: 15, color: '#D4942A', count: 1940 },
  { name: 'Clicks', value: 10, color: '#8C8178', count: 1293 },
]

const TOP_CONTENT = [
  { rank: 1, title: 'Summer Menu Launch', platform: 'IG' as const, metric: '6.3% CTR', value: 89, label: 'leads' },
  { rank: 2, title: 'Weekend Special Promo', platform: 'IG' as const, metric: '4.1% CTR', value: 52, label: 'leads' },
  { rank: 3, title: 'QR Menu Demo Reel', platform: 'YT' as const, metric: '28.1K views', value: 34, label: 'leads' },
  { rank: 4, title: 'Restaurant Owner Guide', platform: 'FB' as const, metric: '2.5% CTR', value: 28, label: 'leads' },
  { rank: 5, title: '5-Star Review Feature', platform: 'IG' as const, metric: '1.2% CTR', value: 8, label: 'leads' },
]

const DEMOGRAPHICS = [
  { range: '18-24', pct: 12 },
  { range: '25-34', pct: 38 },
  { range: '35-44', pct: 28 },
  { range: '45-54', pct: 15 },
  { range: '55+', pct: 7 },
]

const GEOGRAPHY = [
  { country: 'United States', pct: 42 },
  { country: 'United Kingdom', pct: 18 },
  { country: 'Canada', pct: 12 },
  { country: 'Australia', pct: 9 },
  { country: 'India', pct: 7 },
  { country: 'Germany', pct: 5 },
  { country: 'Others', pct: 7 },
]

const DEVICES = [
  { name: 'Mobile', value: 72, color: '#C4814B' },
  { name: 'Desktop', value: 22, color: '#4A7FB5' },
  { name: 'Tablet', value: 6, color: '#8C8178' },
]

const GENDER_DATA = [
  { name: 'Male', value: 54, color: '#C4814B' },
  { name: 'Female', value: 44, color: '#4A7FB5' },
  { name: 'Other', value: 2, color: '#8C8178' },
]

const PEAK_HOURS = [
  { hour: '6-8AM', pct: 5 },
  { hour: '8-10AM', pct: 10 },
  { hour: '10-12PM', pct: 16 },
  { hour: '12-2PM', pct: 18 },
  { hour: '2-4PM', pct: 12 },
  { hour: '4-6PM', pct: 8 },
  { hour: '6-8PM', pct: 10 },
  { hour: '8-10PM', pct: 15 },
  { hour: '10-12AM', pct: 6 },
]

/* ─────────────────────── helpers ─────────────────────── */

function formatNum(n: number | null): string {
  if (n === null || n === undefined) return '—'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K'
  return n.toLocaleString()
}

function formatCurrency(n: number | null): string {
  if (n === null || n === undefined) return '—'
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function StatusBadge({ status }: { status: Campaign['status'] }) {
  const config = {
    Published: { bg: 'bg-success/10', text: 'text-success', icon: CheckCircle },
    Scheduled: { bg: 'bg-warning/10', text: 'text-warning', icon: Clock },
    Draft: { bg: 'bg-info/10', text: 'text-info', icon: PauseCircle },
    Paused: { bg: 'bg-stone/10', text: 'text-stone', icon: PauseCircle },
  }
  const c = config[status]
  const Icon = c.icon
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-tag text-caption font-medium', c.bg, c.text)}>
      <Icon size={12} />
      {status}
    </span>
  )
}

function PlatformBadge({ platform }: { platform: 'IG' | 'FB' | 'YT' }) {
  const config = {
    IG: { bg: 'bg-instagram/10', text: 'text-instagram', label: 'IG' },
    FB: { bg: 'bg-facebook/10', text: 'text-facebook', label: 'FB' },
    YT: { bg: 'bg-youtube/10', text: 'text-youtube', label: 'YT' },
  }
  const c = config[platform]
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-tag text-caption font-semibold', c.bg, c.text)}>
      {c.label}
    </span>
  )
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 80 - 10}`).join(' ')
  return (
    <svg viewBox="0 0 100 100" className="w-full h-[40px]" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {data.map((v, i) => (
        <circle key={i} cx={(i / (data.length - 1)) * 100} cy={100 - ((v - min) / range) * 80 - 10} r="2.5" fill={color} />
      ))}
    </svg>
  )
}

/* ─────────────────────── KPI Card ─────────────────────── */

const KPI_ICONS = [Eye, MousePointerClick, Percent, Users, DollarSign, CreditCard]
const KPI_COLORS = ['#4A7FB5', '#C4814B', '#2D8F5A', '#2D8F5A', '#D4942A', '#C4453A']

function KPICard({
  label, value, trend, trendLabel, data, color, iconIdx, index,
}: {
  label: string
  value: string
  trend: string
  trendLabel: string
  data: number[]
  color: string
  iconIdx: number
  index: number
}) {
  const Icon = KPI_ICONS[iconIdx]
  const isPositive = trend.startsWith('+')
  const isNegative = trend.startsWith('-')
  const isGood = label === 'Cost Per Lead' ? isNegative : isPositive || !isNegative
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
      className="bg-white rounded-card border border-linen p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '18' }}>
            <Icon size={16} style={{ color }} />
          </div>
          <span className="text-caption text-stone uppercase tracking-wider">{label}</span>
        </div>
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.1, duration: 0.2, ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number] }}
          className={cn(
            'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-caption font-semibold',
            isGood ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          )}
        >
          <TrendIcon size={12} />
          {trend}
        </motion.span>
      </div>
      <div className="text-data-lg text-warm-black mb-2">{value}</div>
      <p className="text-caption text-stone mb-3">{trendLabel}</p>
      <MiniSparkline data={data} color={color} />
    </motion.div>
  )
}

/* ─────────────────────── Custom Tooltip ─────────────────────── */

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-graphite text-white rounded-card p-3 shadow-lg border border-warm-black/20">
      <p className="text-caption text-stone mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-body-sm text-white">{p.name}:</span>
            <span className="text-body-sm font-semibold text-white ml-auto pl-4">
              {p.name === 'Spend' ? '$' + p.value.toLocaleString() : p.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────── Performance Trend Chart ─────────────────────── */

function PerformanceTrendChart({ data }: { data: TrendPoint[] }) {
  const [visibleSeries, setVisibleSeries] = useState({
    Impressions: true,
    Clicks: true,
    Leads: true,
    Spend: false,
  })

  const toggleSeries = (key: string) => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
  }

  const seriesConfig = [
    { key: 'Impressions', color: '#4A7FB5', dataKey: 'impressions' as const },
    { key: 'Clicks', color: '#C4814B', dataKey: 'clicks' as const },
    { key: 'Leads', color: '#2D8F5A', dataKey: 'leads' as const },
    { key: 'Spend', color: '#C4453A', dataKey: 'spend' as const },
  ]

  // Thin the data for display - pick every Nth point
  const displayData = useMemo(() => {
    const len = data.length
    if (len <= 30) return data
    const step = Math.ceil(len / 30)
    return data.filter((_, i) => i % step === 0 || i === len - 1)
  }, [data])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
      className="bg-white rounded-card border border-linen p-6 shadow-card"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-h2 text-warm-black">Performance Over Time</h2>
        <div className="flex flex-wrap items-center gap-2">
          {seriesConfig.map((s) => (
            <button
              key={s.key}
              onClick={() => toggleSeries(s.key)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-caption font-medium transition-all duration-200',
                visibleSeries[s.key as keyof typeof visibleSeries]
                  ? 'text-warm-black'
                  : 'text-stone bg-cream'
              )}
              style={visibleSeries[s.key as keyof typeof visibleSeries] ? { backgroundColor: s.color + '18' } : {}}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: visibleSeries[s.key as keyof typeof visibleSeries] ? s.color : '#D4C9BF' }} />
              {s.key}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={displayData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            {seriesConfig.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.12} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.01} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="#E8E0D8" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8C8178' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#8C8178' }} axisLine={false} tickLine={false} width={60} />
          <Tooltip content={<CustomTooltip />} />
          {seriesConfig.map(
            (s) =>
              visibleSeries[s.key as keyof typeof visibleSeries] && (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.key}
                  stroke={s.color}
                  fill={`url(#grad-${s.key})`}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                  animationDuration={800}
                  animationBegin={seriesConfig.indexOf(s) * 100}
                />
              )
          )}
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}

/* ─────────────────────── Campaign Table ─────────────────────── */

type SortKey = keyof Campaign

function CampaignTable() {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('impressions')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(() => {
    let rows = CAMPAIGNS.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    )
    rows = [...rows].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
    return rows
  }, [search, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown size={14} className="text-stone opacity-40" />
    return sortDir === 'asc' ? <ChevronUp size={14} className="text-caramel" /> : <ChevronDown size={14} className="text-caramel" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
      className="bg-white rounded-card border border-linen shadow-card"
    >
      <div className="p-6 border-b border-linen flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-h2 text-warm-black">Campaign Performance</h2>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9 pr-4 rounded-button border border-sand bg-white text-sm text-warm-black placeholder:text-stone/60 focus:border-caramel focus:shadow-input-focus focus:outline-none transition-all w-full sm:w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-cream">
              {[
                { key: 'name' as SortKey, label: 'Campaign', align: 'left' },
                { key: 'platforms' as SortKey, label: 'Platform', align: 'left' },
                { key: 'status' as SortKey, label: 'Status', align: 'left' },
                { key: 'impressions' as SortKey, label: 'Impressions', align: 'right' },
                { key: 'clicks' as SortKey, label: 'Clicks', align: 'right' },
                { key: 'ctr' as SortKey, label: 'CTR', align: 'right' },
                { key: 'leads' as SortKey, label: 'Leads', align: 'right' },
                { key: 'cpl' as SortKey, label: 'CPL', align: 'right' },
                { key: 'spend' as SortKey, label: 'Spend', align: 'right' },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={cn(
                    'px-5 py-3 text-caption font-semibold text-stone uppercase tracking-wider cursor-pointer hover:text-warm-black transition-colors select-none',
                    col.align === 'right' ? 'text-right' : 'text-left'
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <SortIcon col={col.key} />
                  </span>
                </th>
              ))}
              <th className="px-5 py-3 text-caption font-semibold text-stone uppercase tracking-wider text-right">Trend</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((campaign, idx) => (
                <motion.tr
                  key={campaign.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.025, duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
                  className="border-b border-linen last:border-b-0 hover:bg-peach/30 transition-colors duration-150"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cream flex items-center justify-center shrink-0">
                        <span className="text-h4 text-caramel">{campaign.name.charAt(0)}</span>
                      </div>
                      <span className="text-body-sm font-semibold text-warm-black">{campaign.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1">
                      {campaign.platforms.map((p) => (
                        <PlatformBadge key={p} platform={p} />
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={campaign.status} /></td>
                  <td className="px-5 py-4 text-right text-data-sm text-warm-black">{formatNum(campaign.impressions)}</td>
                  <td className="px-5 py-4 text-right text-data-sm text-warm-black">{formatNum(campaign.clicks)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-data-sm text-warm-black">{campaign.ctr !== null ? campaign.ctr + '%' : '—'}</span>
                      {campaign.ctr !== null && (
                        <div className="w-16 h-1.5 bg-linen rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-caramel" style={{ width: `${Math.min(campaign.ctr * 10, 100)}%` }} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right text-data-sm text-warm-black">{formatNum(campaign.leads)}</td>
                  <td className="px-5 py-4 text-right text-data-sm text-warm-black">{formatCurrency(campaign.cpl)}</td>
                  <td className="px-5 py-4 text-right text-data-sm text-warm-black">{formatCurrency(campaign.spend)}</td>
                  <td className="px-5 py-4">
                    <div className="w-20 ml-auto">
                      {campaign.trend.some((v) => v > 0) ? (
                        <MiniSparkline data={campaign.trend} color="#C4814B" />
                      ) : (
                        <span className="text-caption text-stone">No data</span>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

/* ─────────────────────── Platform Comparison ─────────────────────── */

function PlatformComparison() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-6">
      {/* Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        className="bg-white rounded-card border border-linen p-6 shadow-card"
      >
        <h2 className="text-h2 text-warm-black mb-6">Platform Comparison</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={PLATFORM_DATA} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#E8E0D8" vertical={false} />
            <XAxis dataKey="platform" tick={{ fontSize: 12, fill: '#8C8178' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#8C8178' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
              formatter={(value: string) => <span className="text-body-sm text-warm-black">{value}</span>}
            />
            <Bar dataKey="Instagram" fill="#E4405F" radius={[4, 4, 0, 0]} animationDuration={400} animationBegin={0} />
            <Bar dataKey="Facebook" fill="#1877F2" radius={[4, 4, 0, 0]} animationDuration={400} animationBegin={50} />
            <Bar dataKey="YouTube" fill="#FF0000" radius={[4, 4, 0, 0]} animationDuration={400} animationBegin={100} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Platform Cards */}
      <div className="space-y-4">
        {PLATFORM_CARDS.map((platform, idx) => (
          <motion.div
            key={platform.name}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + idx * 0.1, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
            className="rounded-card border p-5 hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200"
            style={{ backgroundColor: platform.bg, borderColor: platform.color + '25' }}
          >
            <div className="flex items-center gap-3 mb-4">
              {platform.name === 'Instagram' && <Instagram size={20} style={{ color: platform.color }} />}
              {platform.name === 'Facebook' && <Facebook size={20} style={{ color: platform.color }} />}
              {platform.name === 'YouTube' && <Youtube size={20} style={{ color: platform.color }} />}
              <h3 className="text-h3 text-warm-black">{platform.name}</h3>
              <span className="ml-auto inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-caption font-semibold bg-success/10 text-success">
                <TrendingUp size={12} />
                {platform.trend}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(platform.metrics).map(([key, val]) => (
                <div key={key} className="text-center">
                  <div className="text-data-sm text-warm-black">{val}</div>
                  <div className="text-caption text-stone mt-0.5">{key}</div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────── Engagement Breakdown ─────────────────────── */

function EngagementBreakdown() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Donut Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        className="bg-white rounded-card border border-linen p-6 shadow-card"
      >
        <h2 className="text-h2 text-warm-black mb-4">Engagement Distribution</h2>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-[200px] h-[200px] shrink-0">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={ENGAGEMENT_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  animationDuration={600}
                  animationBegin={0}
                >
                  {ENGAGEMENT_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-data-lg text-warm-black">8.4%</span>
                  <span className="text-caption text-stone">Avg. Rate</span>
            </div>
          </div>
          <div className="flex-1 space-y-2.5 w-full">
            {ENGAGEMENT_DATA.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-body-sm text-warm-black flex-1">{item.name}</span>
                <span className="text-data-sm text-warm-black">{item.value}%</span>
                <span className="text-caption text-stone w-12 text-right">{item.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement Trend */}
        <div className="mt-6 pt-5 border-t border-linen">
          <h4 className="text-h4 text-warm-black mb-3">Engagement Rate Trend</h4>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={TREND_30.filter((_, i) => i % 3 === 0 || i === 29)} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#E8E0D8" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8C8178' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 12]} tick={{ fontSize: 11, fill: '#8C8178' }} axisLine={false} tickLine={false} tickFormatter={(v) => v + '%'} />
              <Tooltip
                formatter={(value) => [`${Number(value)}%`, 'Engagement Rate']}
                contentStyle={{ backgroundColor: '#3D3832', border: 'none', borderRadius: '12px', color: '#fff' }}
                labelStyle={{ color: '#8C8178', fontSize: 12 }}
              />
              <Line type="monotone" dataKey="engagementRate" stroke="#C4814B" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} animationDuration={800} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Top Performing Content */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        className="bg-white rounded-card border border-linen p-6 shadow-card"
      >
        <h2 className="text-h2 text-warm-black mb-5">Top Performing Content</h2>
        <div className="space-y-4">
          {TOP_CONTENT.map((item, idx) => (
            <motion.div
              key={item.rank}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + idx * 0.08, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
              className="flex items-center gap-4"
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-caption font-bold shrink-0',
                  item.rank === 1 ? 'bg-caramel text-white' : 'bg-linen text-stone'
                )}
              >
                {item.rank}
              </div>
              <div className="w-12 h-9 rounded-md bg-cream flex items-center justify-center shrink-0">
                <span className="text-h4 text-caramel text-xs">{item.title.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-semibold text-warm-black truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <PlatformBadge platform={item.platform} />
                  <span className="text-caption text-stone">{item.metric}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-data-sm text-warm-black">{item.value}</div>
                <div className="text-caption text-stone">{item.label}</div>
              </div>
              <div className="w-16 h-1.5 bg-linen rounded-full overflow-hidden shrink-0">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / TOP_CONTENT[0].value) * 100}%` }}
                  transition={{ delay: 0.45 + idx * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
                  className="h-full rounded-full bg-caramel"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

/* ─────────────────────── Audience Insights ─────────────────────── */

function AudienceInsights() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
      className="bg-white rounded-card border border-linen p-6 shadow-card"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Demographics */}
        <div>
          <h3 className="text-h3 text-warm-black mb-5">Audience Demographics</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-h4 text-stone mb-3">Age Distribution</h4>
              <div className="space-y-2.5">
                {DEMOGRAPHICS.map((d) => (
                  <div key={d.range}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-body-sm text-warm-black">{d.range}</span>
                      <span className="text-data-sm text-warm-black">{d.pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-linen rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${d.pct}%` }}
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
                        className="h-full rounded-full bg-caramel"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-linen">
              <h4 className="text-h4 text-stone mb-3">Gender Split</h4>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={80} height={80}>
                  <PieChart>
                    <Pie data={GENDER_DATA} cx="50%" cy="50%" outerRadius={35} dataKey="value" animationDuration={500}>
                      {GENDER_DATA.map((e, i) => (
                        <Cell key={i} fill={e.color} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5">
                  {GENDER_DATA.map((g) => (
                    <div key={g.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                      <span className="text-body-sm text-warm-black">{g.name}</span>
                      <span className="text-data-sm text-warm-black ml-1">{g.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Geography */}
        <div>
          <h3 className="text-h3 text-warm-black mb-5">Top Locations</h3>
          <div className="space-y-3">
            {GEOGRAPHY.map((g) => (
              <div key={g.country} className="flex items-center gap-3">
                <span className="text-body-sm text-warm-black w-28 shrink-0">{g.country}</span>
                <div className="flex-1 h-2 bg-linen rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${g.pct}%` }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
                    className="h-full rounded-full bg-info"
                  />
                </div>
                <span className="text-data-sm text-warm-black w-10 text-right">{g.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Device & Behavior */}
        <div>
          <h3 className="text-h3 text-warm-black mb-5">Device &amp; Behavior</h3>
          <div className="space-y-5">
            <div>
              <h4 className="text-h4 text-stone mb-3">Device Split</h4>
              <div className="flex items-center gap-4 mb-4">
                <ResponsiveContainer width={80} height={80}>
                  <PieChart>
                    <Pie data={DEVICES} cx="50%" cy="50%" outerRadius={35} innerRadius={20} dataKey="value" animationDuration={500}>
                      {DEVICES.map((e, i) => (
                        <Cell key={i} fill={e.color} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5">
                  {DEVICES.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-body-sm text-warm-black">{d.name}</span>
                      <span className="text-data-sm text-warm-black ml-1">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-linen">
              <h4 className="text-h4 text-stone mb-3">Peak Activity Hours</h4>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={PEAK_HOURS} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#E8E0D8" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#8C8178' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#8C8178' }} axisLine={false} tickLine={false} tickFormatter={(v) => v + '%'} />
                  <Tooltip
                    formatter={(value) => [`${Number(value)}%`, 'Activity']}
                    contentStyle={{ backgroundColor: '#3D3832', border: 'none', borderRadius: '12px', color: '#fff' }}
                    labelStyle={{ color: '#8C8178', fontSize: 12 }}
                  />
                  <Bar dataKey="pct" fill="#C4814B" radius={[3, 3, 0, 0]} animationDuration={400} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ─────────────────────── Main Analytics Page ─────────────────────── */

export default function Analytics() {
  const [dateRange, setDateRange] = useState('30')
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const trendData = useMemo(() => getTrendData(dateRange), [dateRange])

  const kpiSparklines = useMemo(() => {
    return {
      impressions: trendData.map((d) => d.impressions),
      clicks: trendData.map((d) => d.clicks),
      ctr: trendData.map((d) => d.clicks / d.impressions * 100),
      leads: trendData.map((d) => d.leads),
      cpl: trendData.map((d) => d.leads > 0 ? d.spend / d.leads : 0),
      spend: trendData.map((d) => d.spend),
    }
  }, [trendData])

  const kpis = [
    { label: 'Total Impressions', value: '142.8K', trend: '+15.3%', trendLabel: 'vs previous period', sparkline: kpiSparklines.impressions, color: KPI_COLORS[0] },
    { label: 'Total Clicks', value: '8,432', trend: '+22.1%', trendLabel: 'vs previous period', sparkline: kpiSparklines.clicks, color: KPI_COLORS[1] },
    { label: 'Click-Through Rate', value: '5.9%', trend: '+0.8%', trendLabel: 'vs previous period', sparkline: kpiSparklines.ctr, color: KPI_COLORS[2] },
    { label: 'Total Leads', value: '326', trend: '+24.1%', trendLabel: 'vs previous period', sparkline: kpiSparklines.leads, color: KPI_COLORS[3] },
    { label: 'Cost Per Lead', value: '$13.03', trend: '-5.2%', trendLabel: 'lower is better', sparkline: kpiSparklines.cpl, color: KPI_COLORS[4] },
    { label: 'Total Spend', value: '$4,247.50', trend: '+12.5%', trendLabel: 'budget utilization', sparkline: kpiSparklines.spend, color: KPI_COLORS[5] },
  ]

  const datePresets = [
    { label: 'Last 7 Days', value: '7' },
    { label: 'Last 30 Days', value: '30' },
    { label: 'Last 90 Days', value: '90' },
  ]

  return (
    <div className="space-y-6">
      {/* Section 1: Page Header + Date Range */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <h1 className="text-display text-warm-black">Analytics</h1>
          <p className="text-body text-stone mt-1">Track performance across all campaigns and platforms.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {datePresets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => { setDateRange(preset.value); setShowCustomDate(false) }}
              className={cn(
                'px-4 py-2 rounded-button text-sm font-medium transition-all duration-200',
                dateRange === preset.value
                  ? 'bg-caramel text-white shadow-sm'
                  : 'bg-white text-warm-black border border-linen hover:bg-cream'
              )}
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={() => setShowCustomDate(!showCustomDate)}
            className={cn(
              'px-4 py-2 rounded-button text-sm font-medium transition-all duration-200',
              showCustomDate
                ? 'bg-caramel text-white shadow-sm'
                : 'bg-white text-warm-black border border-linen hover:bg-cream'
            )}
          >
            Custom
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium bg-white text-warm-black border border-linen hover:bg-cream transition-all duration-200 ml-1">
            <Download size={16} />
            Export
          </button>

          <AnimatePresence>
            {showCustomDate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full flex items-center gap-2 mt-2"
              >
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-9 px-3 rounded-button border border-sand text-sm text-warm-black focus:border-caramel focus:outline-none"
                />
                <span className="text-stone text-sm">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-9 px-3 rounded-button border border-sand text-sm text-warm-black focus:border-caramel focus:outline-none"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Section 2: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <KPICard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            trend={kpi.trend}
            trendLabel={kpi.trendLabel}
            data={kpi.sparkline}
            color={kpi.color}
            iconIdx={i}
            index={i}
          />
        ))}
      </div>

      {/* Section 3: Performance Trend Chart */}
      <PerformanceTrendChart data={trendData} />

      {/* Section 4: Campaign Table */}
      <CampaignTable />

      {/* Section 5: Platform Comparison */}
      <PlatformComparison />

      {/* Section 6: Engagement Breakdown */}
      <EngagementBreakdown />

      {/* Section 7: Audience Insights */}
      <AudienceInsights />
    </div>
  )
}
