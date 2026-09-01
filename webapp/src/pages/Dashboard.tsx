import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Sparkles, Video, ImagePlus,
  CalendarDays, ArrowRight, Rocket, Upload, Calendar, Trash2,
  Pencil, Copy, Camera as Instagram, MessagesSquare as Facebook, PlaySquare as Youtube,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Stage, TiltCard, Reveal, Stagger } from '@/components/motion'
import { scaleItem, riseItem, slideRightItem } from '@/lib/motion'

/* ─────────────────────────── design constants ──────────────────────────── */

const ACCENT = { violet: '#7C3AED', blue: '#2563EB', emerald: '#059669', amber: '#F59E0B' }
const GRID_STROKE = '#ECEEF2'
const AXIS_FILL = '#5B6472'
const surface = 'card-surface'
const tooltipStyle = {
  backgroundColor: '#0B0F1A',
  border: 'none',
  borderRadius: '12px',
  color: '#FFFFFF',
  fontSize: '13px',
  padding: '10px 14px',
  boxShadow: '0 24px 60px -24px rgba(0,0,0,0.55)',
} as const

/* ─────────────────────────── mock data ─────────────────────────── */

const performanceData = [
  { date: 'May 1', spend: 120, views: 4200, leads: 8 },
  { date: 'May 3', spend: 180, views: 6800, leads: 12 },
  { date: 'May 5', spend: 95, views: 3100, leads: 6 },
  { date: 'May 7', spend: 220, views: 8900, leads: 15 },
  { date: 'May 9', spend: 310, views: 11200, leads: 22 },
  { date: 'May 11', spend: 175, views: 6500, leads: 11 },
  { date: 'May 13', spend: 250, views: 9800, leads: 18 },
  { date: 'May 15', spend: 340, views: 12400, leads: 26 },
  { date: 'May 17', spend: 200, views: 7600, leads: 14 },
  { date: 'May 19', spend: 280, views: 10200, leads: 20 },
  { date: 'May 21', spend: 150, views: 5400, leads: 10 },
  { date: 'May 23', spend: 195, views: 7200, leads: 13 },
  { date: 'May 25', spend: 260, views: 9500, leads: 19 },
  { date: 'May 27', spend: 220, views: 8100, leads: 16 },
  { date: 'May 29', spend: 310, views: 11800, leads: 24 },
  { date: 'May 31', spend: 400, views: 15200, leads: 32 },
  { date: 'Jun 2', spend: 290, views: 10600, leads: 21 },
  { date: 'Jun 4', spend: 210, views: 7800, leads: 15 },
  { date: 'Jun 6', spend: 350, views: 13400, leads: 28 },
  { date: 'Jun 8', spend: 280, views: 10200, leads: 20 },
]

const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect width=%22400%22 height=%22300%22 fill=%22%23F3EEFF%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2214%22 fill=%22%237C3AED%22%3EPreview%3C/text%3E%3C/svg%3E'

const campaigns = [
  { id: 1, name: 'Summer Menu Launch — Restaurants', platforms: ['instagram', 'facebook'], objective: 'Conversions', status: 'Published', spend: 892.00, views: 12400, ctr: 3.2, image: PLACEHOLDER_IMG },
  { id: 2, name: 'QR Menu Demo Reel', platforms: ['instagram', 'youtube'], objective: 'Awareness', status: 'Published', spend: 1200.00, views: 28100, ctr: 1.8, image: PLACEHOLDER_IMG },
  { id: 3, name: 'Cafe Owner Testimonial', platforms: ['facebook'], objective: 'Engagement', status: 'Scheduled', spend: 450.00, views: null, ctr: null, image: PLACEHOLDER_IMG },
  { id: 4, name: 'Hotel Digital Menu Showcase', platforms: ['youtube'], objective: 'Awareness', status: 'Draft', spend: 0.00, views: null, ctr: null, image: PLACEHOLDER_IMG },
  { id: 5, name: 'Weekend Special Promo', platforms: ['instagram'], objective: 'Conversions', status: 'Published', spend: 680.50, views: 8700, ctr: 4.1, image: PLACEHOLDER_IMG },
  { id: 6, name: 'Restaurant Owner Guide', platforms: ['facebook', 'youtube'], objective: 'Engagement', status: 'Published', spend: 525.00, views: 5200, ctr: 2.5, image: PLACEHOLDER_IMG },
  { id: 7, name: 'Fast Setup Promise', platforms: ['instagram'], objective: 'Conversions', status: 'Scheduled', spend: 300.00, views: null, ctr: null, image: PLACEHOLDER_IMG },
  { id: 8, name: '5-Star Review Feature', platforms: ['instagram', 'facebook'], objective: 'Awareness', status: 'Paused', spend: 200.00, views: 3100, ctr: 1.2, image: PLACEHOLDER_IMG },
]

const platformDonutData = [
  { name: 'Instagram', value: 2100, color: '#E4405F' },
  { name: 'Facebook', value: 1350, color: '#1877F2' },
  { name: 'YouTube', value: 797, color: '#FF0000' },
]

const platformComparisonData = [
  { metric: 'CTR', instagram: 3.2, facebook: 2.8, youtube: 1.9 },
  { metric: 'Eng. Rate', instagram: 5.4, facebook: 4.1, youtube: 3.2 },
  { metric: 'Cost/Lead', instagram: 12.5, facebook: 14.2, youtube: 11.8 },
]

const activityFeed = [
  { id: 1, type: 'sparkles', text: "Generated 3 ad variations for 'Summer Menu Launch'", detail: 'Instagram, Facebook', time: '25 min ago' },
  { id: 2, type: 'rocket', text: "Published 'QR Menu Demo Reel' to Instagram and YouTube", detail: '28.1K estimated reach', time: '1 hour ago' },
  { id: 3, type: 'upload', text: 'Uploaded 4 new product screenshots', detail: 'Asset Hub', time: '3 hours ago' },
  { id: 4, type: 'calendar', text: "Scheduled 'Cafe Owner Testimonial' for June 15, 2024", detail: 'Facebook Feed', time: '5 hours ago' },
  { id: 5, type: 'rocket', text: "Published 'Weekend Special Promo' to Instagram", detail: '8.7K views so far', time: '8 hours ago' },
  { id: 6, type: 'sparkles', text: "Generated voiceover script for 'Hotel Showcase Reel'", detail: 'Voice: Warm Professional', time: 'Yesterday' },
  { id: 7, type: 'upload', text: "Uploaded 'Restaurant QR Scan' demo video", detail: 'Asset Hub', time: 'Yesterday' },
  { id: 8, type: 'calendar', text: "Scheduled 'Fast Setup Promise' for June 18, 2024", detail: 'Instagram Reels', time: '2 days ago' },
  { id: 9, type: 'rocket', text: "Published '5-Star Review Feature' to Facebook", detail: '3.1K views', time: '3 days ago' },
  { id: 10, type: 'trash', text: "Deleted draft 'Old Menu Design'", detail: 'Campaign removed', time: '3 days ago' },
]

const sparkData1 = [80, 95, 70, 110, 140, 85, 120]
const sparkData2 = [2000, 3500, 1800, 4200, 5100, 3200, 4500]
const sparkData3 = [5, 8, 4, 10, 14, 7, 12]
const sparkData4 = [18, 16, 19, 14, 12, 15, 13]

/* ──────────────────── component helpers ────────────────────────── */

const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
}

const platformColors: Record<string, string> = {
  instagram: '#E4405F',
  facebook: '#1877F2',
  youtube: '#FF0000',
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot?: string }> = {
    Published: { bg: 'bg-success-light', text: 'text-success', dot: 'bg-success' },
    Scheduled: { bg: 'bg-warning-light', text: 'text-warning', dot: 'bg-warning' },
    Draft: { bg: 'bg-info-light', text: 'text-info', dot: 'bg-info' },
    Paused: { bg: 'bg-sand/40', text: 'text-stone', dot: 'bg-stone' },
    Cancelled: { bg: 'bg-danger-light', text: 'text-danger', dot: 'bg-danger' },
  }
  const c = config[status] || config.Draft
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-tag text-caption font-medium', c.bg, c.text)}>
      {c.dot && <span className={cn('w-1.5 h-1.5 rounded-full', c.dot, status === 'Scheduled' || status === 'Draft' ? 'animate-pulse-subtle' : '')} />}
      {status}
    </span>
  )
}

function MiniSparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 100
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = height - ((v - min) / range) * (height - 8) - 4
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="block h-full w-full" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w
        const y = height - ((v - min) / range) * (height - 8) - 4
        return <circle key={i} cx={x} cy={y} r="2" fill={color} opacity="0.5" />
      })}
    </svg>
  )
}

function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 900
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(eased * value)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value])

  const formatted = decimals > 0
    ? count.toFixed(decimals)
    : Math.round(count).toLocaleString()

  return <span>{prefix}{formatted}{suffix}</span>
}

function TrendBadge({ value, invert = false }: { value: string; invert?: boolean }) {
  const isPositive = value.startsWith('+')
  const isGood = invert ? !isPositive : isPositive
  const Icon = isGood ? TrendingUp : TrendingDown

  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-caption font-medium',
      isGood ? 'bg-success-light text-success' : 'bg-danger-light text-danger',
    )}>
      <Icon size={12} />
      {value}
    </span>
  )
}

/* ─────────────────────── KPI Card ─────────────────────────────── */

interface KPICardProps {
  label: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  trend: string
  trendInvert?: boolean
  sparkData: number[]
  accent: string
}

function KPICard({ label, value, prefix, suffix, decimals, trend, trendInvert, sparkData, accent }: KPICardProps) {
  return (
    <TiltCard variants={scaleItem} intensity={7} className={cn(surface, 'card-surface-hover relative overflow-hidden p-6')}>
      <span
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}00)` }}
      />
      <div className="mb-3 flex items-start justify-between">
        <span className="text-caption uppercase tracking-wide text-stone">{label}</span>
        <TrendBadge value={trend} invert={trendInvert} />
      </div>
      <div className="mb-3 text-data-lg text-warm-black">
        <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </div>
      <div className="h-10 overflow-hidden">
        <MiniSparkline data={sparkData} color={accent} />
      </div>
    </TiltCard>
  )
}

/* ──────────────────────── main page ────────────────────────────── */

export default function Dashboard() {
  const navigate = useNavigate()
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
  const [activityFilter, setActivityFilter] = useState('All')

  const quickActions = [
    { icon: Sparkles, title: 'Generate Ad Copy', description: 'Use AI to create headlines, body text, and CTAs for any platform.', link: 'Start Writing', path: '/ads/generate' },
    { icon: Video, title: 'Create Video Reel', description: 'Generate face-free vertical videos with AI voiceover and captions.', link: 'Make a Reel', path: '/reels/generate' },
    { icon: ImagePlus, title: 'Upload Assets', description: 'Add screenshots, demos, and product images to your library.', link: 'Open Asset Hub', path: '/assets' },
    { icon: CalendarDays, title: 'Schedule Content', description: 'Plan and schedule posts across all platforms.', link: 'Open Calendar', path: '/schedule' },
  ]

  const activityIcons: Record<string, { icon: React.ElementType; bg: string }> = {
    rocket: { icon: Rocket, bg: 'bg-success-light text-success' },
    sparkles: { icon: Sparkles, bg: 'bg-peach text-[var(--app-accent)]' },
    upload: { icon: Upload, bg: 'bg-info-light text-info' },
    calendar: { icon: Calendar, bg: 'bg-warning-light text-warning' },
    trash: { icon: Trash2, bg: 'bg-danger-light text-danger' },
  }

  const filteredActivity = activityFilter === 'All'
    ? activityFeed
    : activityFeed.filter(a => {
      if (activityFilter === 'Campaigns') return a.type === 'rocket' || a.type === 'trash'
      if (activityFilter === 'Assets') return a.type === 'upload'
      if (activityFilter === 'Schedules') return a.type === 'calendar'
      return true
    })

  return (
    <div className="space-y-6">
      {/* ─────────── Section 1: KPI Cards (isometric stage) ─────────── */}
      <Stage tilt={2} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard label="Total Ad Spend" value={4247.50} prefix="$" decimals={2} trend="+12.5%" sparkData={sparkData1} accent={ACCENT.violet} />
        <KPICard label="Total Views" value={48.2} suffix="K" decimals={1} trend="+8.3%" sparkData={sparkData2} accent={ACCENT.blue} />
        <KPICard label="Leads Generated" value={326} trend="+24.1%" sparkData={sparkData3} accent={ACCENT.emerald} />
        <KPICard label="Avg. Cost Per Lead" value={13.03} prefix="$" decimals={2} trend="-5.2%" trendInvert sparkData={sparkData4} accent={ACCENT.amber} />
      </Stage>

      {/* ─────────── Section 2: Performance Chart ─────────── */}
      <Reveal className={cn(surface, 'p-6')}>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="text-h2 text-warm-black">Campaign Performance</h2>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg bg-cream p-0.5">
              {['7 days', '30 days', 'This Month'].map((range, i) => (
                <button
                  key={range}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 cursor-pointer',
                    i === 1 ? 'bg-[var(--app-accent)] text-white shadow-xs' : 'text-stone hover:text-warm-black',
                  )}
                >
                  {range}
                </button>
              ))}
            </div>
            <button className="cursor-pointer rounded-lg p-2 text-stone transition-colors hover:bg-cream hover:text-warm-black">
              <Upload size={18} />
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={performanceData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={ACCENT.violet} stopOpacity={0.22} />
                <stop offset="95%" stopColor={ACCENT.violet} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={ACCENT.blue} stopOpacity={0.16} />
                <stop offset="95%" stopColor={ACCENT.blue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: AXIS_FILL }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fontSize: 12, fill: AXIS_FILL }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={50} />
            <Tooltip
              contentStyle={tooltipStyle}
              itemStyle={{ color: '#FFFFFF' }}
              cursor={{ stroke: ACCENT.violet, strokeWidth: 1, strokeDasharray: '4 4' }}
              formatter={(value, name) => {
                const numericValue = Number(value)
                const label = String(name)
                if (label === 'Views') return [`${(numericValue / 1000).toFixed(1)}K`, label]
                return [label === 'Ad Spend' ? `$${numericValue}` : numericValue, label]
              }}
              labelStyle={{ color: '#C7CBD6', marginBottom: '4px' }}
            />
            <Area type="monotone" dataKey="spend" name="Ad Spend" stroke={ACCENT.violet} strokeWidth={2.5} fill="url(#gradSpend)" dot={false} activeDot={{ r: 4, fill: ACCENT.violet }} />
            <Area type="monotone" dataKey="views" name="Views" stroke={ACCENT.blue} strokeWidth={2.5} fill="url(#gradViews)" dot={false} activeDot={{ r: 4, fill: ACCENT.blue }} />
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-4 flex items-center justify-center gap-6 border-t border-linen pt-4">
          {[
            { label: 'Ad Spend', color: ACCENT.violet },
            { label: 'Views', color: ACCENT.blue },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-body-sm text-stone">{item.label}</span>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ─────────── Section 3: Recent Campaigns Table ─────────── */}
      <Reveal className={cn(surface, 'overflow-hidden')}>
        <div className="flex items-center justify-between border-b border-linen px-6 py-4">
          <h2 className="text-h2 text-warm-black">Recent Campaigns</h2>
          <button
            onClick={() => navigate('/analytics')}
            className="cursor-pointer text-sm font-medium text-[var(--app-accent)] hover:underline"
          >
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-cream/70">
                {['Campaign', 'Platform', 'Objective', 'Status', 'Spend', 'Performance', ''].map((h) => (
                  <th key={h} className="whitespace-nowrap px-5 py-3 text-left text-caption font-semibold uppercase tracking-wider text-stone">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="group border-b border-linen transition-colors duration-150 hover:bg-peach/40"
                  onMouseEnter={() => setHoveredRow(campaign.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <img src={campaign.image} alt={campaign.name} className="h-9 w-12 shrink-0 rounded object-cover ring-1 ring-black/5" />
                      <p className="max-w-[200px] truncate text-sm font-medium text-warm-black">{campaign.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {campaign.platforms.map((p) => {
                        const PIcon = platformIcons[p]
                        return (
                          <span key={p} className="inline-flex items-center gap-1 rounded-tag px-2 py-0.5 text-caption font-medium text-white" style={{ backgroundColor: platformColors[p] }}>
                            <PIcon size={10} />
                            <span className="capitalize">{p === 'youtube' ? 'YT' : p.slice(0, 2).toUpperCase()}</span>
                          </span>
                        )
                      })}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-tag bg-peach/60 px-2.5 py-1 text-body-sm text-warm-black">{campaign.objective}</span>
                  </td>
                  <td className="px-5 py-3.5"><StatusBadge status={campaign.status} /></td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="font-mono text-data-sm text-warm-black">${campaign.spend.toFixed(2)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {campaign.views !== null ? (
                      <div className="space-y-1">
                        <span className="text-body-sm text-warm-black">{(campaign.views / 1000).toFixed(1)}K views</span>
                        <div className="h-1.5 w-full rounded-full bg-linen">
                          <div className="h-1.5 rounded-full bg-[var(--app-accent)] transition-all duration-500" style={{ width: `${Math.min((campaign.ctr || 0) * 15, 100)}%` }} />
                        </div>
                        <span className="text-caption text-stone">{campaign.ctr}% CTR</span>
                      </div>
                    ) : (
                      <span className="text-body-sm text-stone">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className={cn('flex items-center gap-1 transition-opacity duration-150', hoveredRow === campaign.id ? 'opacity-100' : 'opacity-0')}>
                      <button onClick={() => navigate(`/campaigns/${campaign.id}`)} className="cursor-pointer rounded-md p-1.5 text-stone transition-colors hover:bg-peach hover:text-[var(--app-accent)]" title="Edit">
                        <Pencil size={15} />
                      </button>
                      <button className="cursor-pointer rounded-md p-1.5 text-stone transition-colors hover:bg-info-light hover:text-info" title="Duplicate">
                        <Copy size={15} />
                      </button>
                      <button className="cursor-pointer rounded-md p-1.5 text-stone transition-colors hover:bg-danger-light hover:text-danger" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>

      {/* ─────────── Section 4: Quick Actions (isometric stage) ─────────── */}
      <Stage tilt={1.5} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <TiltCard
              key={action.title}
              variants={scaleItem}
              intensity={8}
              onClick={() => navigate(action.path)}
              className={cn(surface, 'card-surface-hover group/qa cursor-pointer p-6 text-left')}
            >
              <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-peach text-[var(--app-accent)] transition-transform duration-200 group-hover/qa:scale-110">
                <Icon size={22} />
              </div>
              <h3 className="mb-1.5 text-h3 text-warm-black">{action.title}</h3>
              <p className="mb-4 text-body-sm text-stone">{action.description}</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--app-accent)] transition-all duration-200 group-hover/qa:gap-2">
                {action.link} <ArrowRight size={14} />
              </span>
            </TiltCard>
          )
        })}
      </Stage>

      {/* ─────────── Section 5: Platform Breakdown ─────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal className={cn(surface, 'p-6')}>
          <h3 className="mb-6 text-h2 text-warm-black">Spend by Platform</h3>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={platformDonutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                  {platformDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Spend']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="-mt-2 mb-4 text-center">
              <p className="text-data-md text-warm-black">$4,247</p>
              <p className="text-caption text-stone">Total Spend</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {platformDonutData.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-body-sm text-warm-black">{p.name}</span>
                  <span className="text-caption text-stone">${p.value.toLocaleString()}</span>
                  <span className="text-caption text-stone">({((p.value / 4247) * 100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal className={cn(surface, 'p-6')}>
          <h3 className="mb-6 text-h2 text-warm-black">Platform Comparison</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={platformComparisonData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: AXIS_FILL }} tickLine={false} axisLine={false} />
              <YAxis dataKey="metric" type="category" tick={{ fontSize: 12, fill: AXIS_FILL }} tickLine={false} axisLine={false} width={70} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(124,58,237,0.06)' }} />
              <Bar dataKey="instagram" name="Instagram" fill="#E4405F" radius={[0, 4, 4, 0]} barSize={12} />
              <Bar dataKey="facebook" name="Facebook" fill="#1877F2" radius={[0, 4, 4, 0]} barSize={12} />
              <Bar dataKey="youtube" name="YouTube" fill="#FF0000" radius={[0, 4, 4, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </Reveal>
      </div>

      {/* ─────────── Section 6: Activity Feed ─────────── */}
      <Reveal className={cn(surface, 'overflow-hidden')}>
        <div className="flex items-center justify-between border-b border-linen px-6 py-4">
          <h2 className="text-h2 text-warm-black">Recent Activity</h2>
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            aria-label="Filter activity"
            className="cursor-pointer rounded-button border border-linen bg-white/70 px-3 py-1.5 text-sm text-stone outline-none focus:ring-accent-soft"
          >
            {['All', 'Campaigns', 'Assets', 'Schedules'].map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <Stagger key={activityFilter} fast className="max-h-[400px] divide-y divide-linen overflow-y-auto scrollbar-thin">
          {filteredActivity.map((item) => {
            const { icon: AIcon, bg } = activityIcons[item.type]
            return (
              <motion.div
                key={item.id}
                variants={slideRightItem}
                className="flex items-start gap-4 px-6 py-4 transition-colors duration-150 hover:bg-cream/60"
              >
                <div className={cn('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full', bg)}>
                  <AIcon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-warm-black">{item.text}</p>
                  <p className="mt-0.5 text-body-sm text-stone">{item.detail}</p>
                </div>
                <span className="shrink-0 text-caption text-stone">{item.time}</span>
              </motion.div>
            )
          })}
        </Stagger>
      </Reveal>
    </div>
  )
}
