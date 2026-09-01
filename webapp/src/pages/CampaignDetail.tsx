import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Pencil,
  Copy,
  Pause,
  Play,
  Trash2,
  Camera as Instagram,
  MessagesSquare as Facebook,
  PlaySquare as Youtube,
  Target,
  CalendarDays,
  LayoutTemplate,
  CheckCheck,
  Copy as CopyIcon,
  Sparkles,
  PencilLine,
  Plus,
  PlayCircle,
  ImagePlus,
  Eye,
  MousePointerClick,
  Users,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine } from 'recharts'
import { toast } from 'sonner'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TimelineEvent {
  id: string
  date: string
  time: string
  title: string
  detail: string
  color: string
}

interface CampaignAsset {
  id: string
  name: string
  type: 'image' | 'video'
  src: string
}

interface AdCopyVariation {
  platform: string
  headline: string
  body: string
  cta: string
  hashtags: string[]
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const DAILY_DATA = [
  { date: 'Jun 14', impressions: 3200, clicks: 180, spend: 45 },
  { date: 'Jun 15', impressions: 3800, clicks: 210, spend: 52 },
  { date: 'Jun 16', impressions: 4200, clicks: 245, spend: 68 },
  { date: 'Jun 17', impressions: 4500, clicks: 270, spend: 72 },
  { date: 'Jun 18', impressions: 5100, clicks: 310, spend: 85 },
  { date: 'Jun 19', impressions: 4800, clicks: 290, spend: 78 },
  { date: 'Jun 20', impressions: 5400, clicks: 340, spend: 91 },
  { date: 'Jun 21', impressions: 5200, clicks: 325, spend: 88 },
  { date: 'Jun 22', impressions: 4100, clicks: 250, spend: 65 },
  { date: 'Jun 23', impressions: 3900, clicks: 230, spend: 58 },
  { date: 'Jun 24', impressions: 3100, clicks: 185, spend: 42 },
  { date: 'Jun 25', impressions: 3500, clicks: 200, spend: 50 },
  { date: 'Jun 26', impressions: 3700, clicks: 215, spend: 55 },
  { date: 'Jun 27', impressions: 3300, clicks: 195, spend: 43 },
]

const SPARKLINE_DATA = [42, 38, 45, 52, 48, 55, 60, 58, 62, 65, 70, 68, 72, 75]

const TIMELINE: TimelineEvent[] = [
  { id: '1', date: 'Jun 14, 2024', time: '9:30 AM', title: 'Campaign published to Instagram and Facebook', detail: 'Scheduled publish executed successfully', color: 'bg-success' },
  { id: '2', date: 'Jun 14, 2024', time: '9:00 AM', title: 'Campaign status changed to Scheduled', detail: 'Publish time set for 9:30 AM', color: 'bg-info' },
  { id: '3', date: 'Jun 13, 2024', time: '3:15 PM', title: 'Ad copy regenerated for Instagram', detail: 'New variation generated using Problem-Solution template', color: 'bg-warning' },
  { id: '4', date: 'Jun 13, 2024', time: '2:45 PM', title: 'Assets added to campaign', detail: '5 assets linked from Asset Hub', color: 'bg-info' },
  { id: '5', date: 'Jun 13, 2024', time: '11:20 AM', title: 'Campaign created', detail: 'Objective: Conversions | Budget: $1,000 | Duration: 14 days', color: 'bg-stone' },
]

const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect width=%22400%22 height=%22300%22 fill=%22%23f5f0e8%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2214%22 fill=%22%23999%22%3EPreview%3C/text%3E%3C/svg%3E'

const ASSETS: CampaignAsset[] = [
  { id: '1', name: 'nhyqr-app-mockup-1.jpg', type: 'image', src: PLACEHOLDER_IMG },
  { id: '2', name: 'nhyqr-qr-placemat.jpg', type: 'image', src: PLACEHOLDER_IMG },
  { id: '3', name: 'menu-items-grid.jpg', type: 'image', src: PLACEHOLDER_IMG },
  { id: '4', name: 'happy-customer-scanning.jpg', type: 'image', src: PLACEHOLDER_IMG },
  { id: '5', name: 'nhyqr-restaurant-scene.jpg', type: 'video', src: PLACEHOLDER_IMG },
]

const AD_COPY_DATA: AdCopyVariation[] = [
  {
    platform: 'Instagram',
    headline: 'Transform Your Restaurant Menu in Minutes',
    body: 'Stop reprinting menus every time you update a dish. With NHY-QR, create a stunning digital menu your customers can access with a simple scan. Update prices, add specials, and change layouts in seconds \u2014 from any device. Join 500+ restaurants already using NHY-QR.',
    cta: 'Get Started Free \u2192',
    hashtags: ['#QRMenu', '#DigitalMenu', '#RestaurantTech', '#NHYQR', '#SmartDining', '#MenuDesign', '#RestaurantOwner'],
  },
  {
    platform: 'Facebook',
    headline: 'The Easiest Way to Create a Digital Menu for Your Restaurant',
    body: 'Paper menus are a thing of the past. With NHY-QR, you can create a beautiful, interactive digital menu in under 10 minutes. Your customers simply scan a QR code to see your latest offerings \u2014 no app download required. Perfect for restaurants, cafes, and hotels. Join 500+ happy businesses!',
    cta: 'Book a Demo',
    hashtags: ['#RestaurantMarketing', '#DigitalTransformation', '#QRMenus', '#NHYQR', '#HospitalityTech'],
  },
]

/* ------------------------------------------------------------------ */
/*  Helper Components                                                  */
/* ------------------------------------------------------------------ */

function PlatformBadge({ platform }: { platform: string }) {
  const configs: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
    Instagram: { color: 'text-[#E4405F]', bg: 'bg-[#E4405F]/10', icon: Instagram },
    Facebook: { color: 'text-[#1877F2]', bg: 'bg-[#1877F2]/10', icon: Facebook },
    YouTube: { color: 'text-[#FF0000]', bg: 'bg-[#FF0000]/10', icon: Youtube },
  }
  const cfg = configs[platform] || configs.Instagram
  const Icon = cfg.icon
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-tag text-caption font-medium', cfg.bg, cfg.color)}>
      <Icon size={12} />
      {platform}
    </span>
  )
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success(`${label || 'Text'} copied to clipboard`)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md text-stone hover:text-caramel hover:bg-peach/30 transition-colors"
      title="Copy"
    >
      {copied ? <CheckCheck size={14} className="text-success" /> : <CopyIcon size={14} />}
    </button>
  )
}

function Sparkline({ data, color = '#C4814B', height = 40 }: { data: number[]; color?: string; height?: number }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 120
  const h = height
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h * 0.8 - h * 0.1}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        opacity="0.6"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Chart Tooltip                                                      */
/* ------------------------------------------------------------------ */

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="bg-white rounded-lg border border-linen shadow-card p-3">
      <p className="text-caption text-stone mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.dataKey === 'spend' ? `$${entry.value}` : entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function CampaignDetail() {
  const { id: _id } = useParams<{ id: string }>()
  void _id
  const navigate = useNavigate()
  const [status, setStatus] = useState<'Published' | 'Paused'>('Published')
  const avgDailySpend = DAILY_DATA.reduce((a, b) => a + b.spend, 0) / DAILY_DATA.length

  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: (d: number) => ({ opacity: 1, y: 0, transition: { duration: 0.3, delay: d } }),
  }

  return (
    <div className="space-y-8">
      {/* ============================================================ */}
      {/* SECTION 1 — Campaign Header + Action Bar                    */}
      {/* ============================================================ */}
      <motion.div initial="hidden" animate="visible">
        {/* Breadcrumb */}
        <motion.div variants={fadeUp} custom={0} className="flex items-center gap-2 mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-1.5 rounded-md text-stone hover:text-warm-black hover:bg-cream transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-caption text-stone">
            <button onClick={() => navigate('/dashboard')} className="hover:text-caramel transition-colors">Dashboard</button>
            {' / '}
            <button onClick={() => navigate('/dashboard')} className="hover:text-caramel transition-colors">Campaigns</button>
            {' / '}
            <span className="text-warm-black">Summer Menu Launch</span>
          </span>
        </motion.div>

        {/* Title Row */}
        <motion.div variants={fadeUp} custom={0.05} className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-display text-warm-black">Summer Menu Launch — Restaurants</h1>
              <div className="flex gap-1">
                <PlatformBadge platform="Instagram" />
                <PlatformBadge platform="Facebook" />
              </div>
              <motion.span
                key={status}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-caption font-medium',
                  status === 'Published' ? 'bg-success-light text-success' : 'bg-warning-light text-warning'
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', status === 'Published' ? 'bg-success' : 'bg-warning')} />
                {status}
              </motion.span>
            </div>
            <p className="text-caption text-stone">Created on Jun 10, 2024 by Alex</p>
          </div>

          {/* Action Buttons */}
          <motion.div variants={fadeUp} custom={0.1} className="flex items-center gap-2 flex-wrap">
            <button className="flex items-center gap-1.5 h-9 px-3 rounded-button border border-linen text-sm text-warm-black hover:bg-cream transition-colors">
              <Pencil size={14} />
              Edit Campaign
            </button>
            <button
              onClick={() => toast.success('Campaign duplicated!')}
              className="flex items-center gap-1.5 h-9 px-3 rounded-button border border-linen text-sm text-warm-black hover:bg-cream transition-colors"
            >
              <Copy size={14} />
              Duplicate
            </button>
            {status === 'Published' ? (
              <button
                onClick={() => { setStatus('Paused'); toast.success('Campaign paused') }}
                className="flex items-center gap-1.5 h-9 px-3 rounded-button border border-warning text-warning text-sm hover:bg-warning-light transition-colors"
              >
                <Pause size={14} />
                Pause
              </button>
            ) : (
              <button
                onClick={() => { setStatus('Published'); toast.success('Campaign resumed') }}
                className="flex items-center gap-1.5 h-9 px-3 rounded-button border border-success text-success text-sm hover:bg-success-light transition-colors"
              >
                <Play size={14} />
                Resume
              </button>
            )}
            <button
              onClick={() => { toast.success('Campaign deleted'); navigate('/dashboard') }}
              className="flex items-center gap-1.5 h-9 px-3 rounded-button border border-danger text-danger text-sm hover:bg-danger-light transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ============================================================ */}
      {/* SECTION 2 — Campaign Overview Cards                         */}
      {/* ============================================================ */}
      <div className="space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Impressions', value: '45.2K', trend: '+18.2%', trendUp: true, icon: Eye, data: SPARKLINE_DATA },
            { label: 'Clicks', value: '2,847', trend: '+15.7%', trendUp: true, icon: MousePointerClick, data: SPARKLINE_DATA.map((v, i) => v * 0.4 + i * 2) },
            { label: 'CTR', value: '6.3%', trend: '+0.4%', trendUp: true, icon: TrendingUp, extra: 'Platform avg: 3.8%', data: SPARKLINE_DATA.map((v) => v * 0.1 + 4) },
            { label: 'Leads', value: '89', trend: '+32.1%', trendUp: true, icon: Users, extra: '$10.02 per lead', data: SPARKLINE_DATA.map((v, i) => v * 0.15 + i) },
          ].map((kpi, i) => {
            const KpiIcon = kpi.icon
            return (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * (i + 1) }}
                className="bg-white rounded-card border border-linen p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 border-t-2 border-t-caramel"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-caption text-stone uppercase tracking-wider flex items-center gap-1.5">
                    <KpiIcon size={14} />
                    {kpi.label}
                  </span>
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-medium',
                    kpi.trendUp ? 'bg-success-light text-success' : 'bg-danger-light text-danger'
                  )}>
                    {kpi.trendUp ? <TrendingUp size={10} /> : <TrendingUp size={10} className="rotate-180" />}
                    {kpi.trend}
                  </span>
                </div>
                <p className="text-data-lg text-warm-black mb-2">{kpi.value}</p>
                <div className="flex items-center justify-between">
                  <Sparkline data={kpi.data} color="#C4814B" />
                  {kpi.extra && <span className="text-caption text-info bg-info-light px-2 py-0.5 rounded-tag">{kpi.extra}</span>}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white rounded-card border border-linen p-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Objective */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-light flex items-center justify-center shrink-0">
                <Target size={20} className="text-success" />
              </div>
              <div>
                <p className="text-caption text-stone uppercase tracking-wider">Objective</p>
                <p className="text-h4 text-warm-black mt-0.5">Conversions</p>
              </div>
            </div>

            {/* Budget */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-caramel/10 flex items-center justify-center shrink-0">
                <span className="text-caramel text-lg font-bold">$</span>
              </div>
              <div className="flex-1">
                <p className="text-caption text-stone uppercase tracking-wider">Budget</p>
                <p className="text-h4 text-warm-black mt-0.5">$1,000.00</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-2 bg-linen rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '89%' }}
                      transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                      className="h-full bg-caramel rounded-full"
                    />
                  </div>
                  <span className="text-caption text-stone">89%</span>
                </div>
                <p className="text-caption text-stone mt-1">$892.00 spent</p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-info-light flex items-center justify-center shrink-0">
                <CalendarDays size={20} className="text-info" />
              </div>
              <div>
                <p className="text-caption text-stone uppercase tracking-wider">Duration</p>
                <p className="text-h4 text-warm-black mt-0.5">14 days</p>
                <p className="text-caption text-stone mt-1">Jun 14 – Jun 28, 2024</p>
              </div>
            </div>

            {/* Platforms */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning-light flex items-center justify-center shrink-0">
                <Instagram size={20} className="text-warning" />
              </div>
              <div>
                <p className="text-caption text-stone uppercase tracking-wider">Platforms</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <PlatformBadge platform="Instagram" />
                  <PlatformBadge platform="Facebook" />
                </div>
                <p className="text-caption text-stone mt-1">Reels, Feed, Stories</p>
              </div>
            </div>

            {/* Template */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-peach flex items-center justify-center shrink-0">
                <LayoutTemplate size={20} className="text-caramel" />
              </div>
              <div>
                <p className="text-caption text-stone uppercase tracking-wider">Template</p>
                <p className="text-h4 text-warm-black mt-0.5">Problem-Solution</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 3 — Performance Charts                              */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Impressions & Clicks Area Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-card border border-linen p-6"
        >
          <h2 className="text-h2 text-warm-black mb-4">Impressions & Clicks</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={DAILY_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4A7FB5" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#4A7FB5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorClk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C4814B" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#C4814B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D8" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8C8178' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#8C8178' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="impressions" stroke="#4A7FB5" strokeWidth={2} fill="url(#colorImp)" name="Impressions" />
              <Area type="monotone" dataKey="clicks" stroke="#C4814B" strokeWidth={2} fill="url(#colorClk)" name="Clicks" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Daily Spend Bar Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-card border border-linen p-6"
        >
          <h2 className="text-h2 text-warm-black mb-4">Daily Ad Spend</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={DAILY_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D8" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8C8178' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#8C8178' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={avgDailySpend} stroke="#8C8178" strokeDasharray="6 4" strokeWidth={1} />
              <Bar dataKey="spend" fill="#C4814B" radius={[4, 4, 0, 0]} name="spend" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 4 — Ad Copy Used                                    */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white rounded-card border border-linen p-6"
      >
        <h2 className="text-h2 text-warm-black mb-4">Ad Copy Used</h2>
        <Tabs defaultValue="Instagram">
          <TabsList className="mb-4 bg-cream">
            {AD_COPY_DATA.map((ad) => (
              <TabsTrigger key={ad.platform} value={ad.platform} className="data-[state=active]:bg-white data-[state=active]:text-caramel">
                {ad.platform === 'Instagram' && <Instagram size={14} className="mr-1" />}
                {ad.platform === 'Facebook' && <Facebook size={14} className="mr-1" />}
                {ad.platform === 'YouTube' && <Youtube size={14} className="mr-1" />}
                {ad.platform}
              </TabsTrigger>
            ))}
          </TabsList>
          {AD_COPY_DATA.map((ad) => (
            <TabsContent key={ad.platform} value={ad.platform}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-cream/40 rounded-card p-5 space-y-4"
              >
                {/* Headline */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-h4 text-stone">Headline</span>
                    <div className="flex gap-1">
                      <CopyButton text={ad.headline} label="Headline" />
                    </div>
                  </div>
                  <p className="text-h3 text-warm-black">{ad.headline}</p>
                </div>

                {/* Body */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-h4 text-stone">Body Text</span>
                    <CopyButton text={ad.body} label="Body" />
                  </div>
                  <p className="text-body-sm text-warm-black leading-relaxed">{ad.body}</p>
                </div>

                {/* CTA */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-h4 text-stone">Call-to-Action</span>
                    <CopyButton text={ad.cta} label="CTA" />
                  </div>
                  <p className="text-h4 text-caramel">{ad.cta}</p>
                </div>

                {/* Hashtags */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-h4 text-stone">Hashtags</span>
                    <CopyButton text={ad.hashtags.join(' ')} label="Hashtags" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ad.hashtags.map((h) => (
                      <span key={h} className="px-2.5 py-1 rounded-tag bg-peach text-caramel text-sm font-medium">{h}</span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-linen/50">
                  <button
                    onClick={() => toast.success('Copy regenerated!')}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-button bg-caramel text-white text-sm font-medium hover:bg-caramel/90 transition-colors"
                  >
                    <Sparkles size={14} />
                    Regenerate
                  </button>
                  <button className="flex items-center gap-1.5 h-8 px-3 rounded-button border border-linen text-sm text-warm-black hover:bg-cream transition-colors">
                    <PencilLine size={14} />
                    Edit
                  </button>
                </div>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      {/* ============================================================ */}
      {/* SECTION 5 — Campaign Assets                                 */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="bg-white rounded-card border border-linen p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-h2 text-warm-black">Campaign Assets</h2>
            <span className="px-2 py-0.5 rounded-tag bg-cream text-stone text-caption font-medium">{ASSETS.length}</span>
          </div>
          <button className="flex items-center gap-1.5 h-9 px-3 rounded-button border border-linen text-sm text-warm-black hover:bg-cream transition-colors">
            <ImagePlus size={14} />
            Add Assets
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {ASSETS.map((asset, i) => (
            <motion.button
              key={asset.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.06 * i, duration: 0.25 }}
              className="flex-shrink-0 group relative"
            >
              <div className="w-[140px] h-[100px] rounded-lg overflow-hidden border border-linen group-hover:shadow-card-hover group-hover:scale-105 transition-all duration-200">
                <img src={asset.src} alt={asset.name} className="w-full h-full object-cover" />
                {asset.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                      <PlayCircle size={18} className="text-white" />
                    </div>
                  </div>
                )}
              </div>
              <p className="text-caption text-stone mt-1.5 truncate w-[140px] text-left">{asset.name}</p>
            </motion.button>
          ))}
          {/* Add button */}
          <button className="flex-shrink-0 w-[140px] h-[100px] rounded-lg border-2 border-dashed border-sand flex flex-col items-center justify-center gap-1 text-stone hover:border-caramel hover:text-caramel hover:bg-peach/20 transition-all">
            <Plus size={20} />
            <span className="text-caption">Add</span>
          </button>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* SECTION 6 — Activity & History                              */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-white rounded-card border border-linen p-6"
      >
        <h2 className="text-h2 text-warm-black mb-6">Campaign History</h2>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-linen" />

          <div className="space-y-6">
            {TIMELINE.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.08 * i }}
                className="relative flex items-start gap-4"
              >
                {/* Dot */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.08 * i + 0.1 }}
                  className={cn('relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0', event.color)}
                >
                  <div className="w-3 h-3 rounded-full bg-white" />
                </motion.div>

                {/* Content */}
                <div className="pt-1.5">
                  <p className="text-caption text-stone">
                    {event.date} · {event.time}
                  </p>
                  <p className="text-body-sm text-warm-black font-medium mt-0.5">{event.title}</p>
                  <p className="text-body-sm text-stone mt-0.5">{event.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
