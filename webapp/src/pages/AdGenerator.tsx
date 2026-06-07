import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye,
  MessageCircle,
  Target,
  Check,
  Sparkles,
  Copy,
  CheckCheck,
  Instagram,
  Facebook,
  Youtube,
  ChevronDown,
  Search,
  Filter,
  Play,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Download,
  FileText,
  CalendarDays,
  Pencil,
  Trash2,
  Pause,
  X,
  HeartHandshake,
  Zap,
  Users,
  Lightbulb,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Objective = 'awareness' | 'engagement' | 'conversions'

interface PlatformConfig {
  enabled: boolean
  formats: string[]
}

interface GeneratedVariation {
  id: number
  headline: string
  body: string
  cta: string
  hashtags: string[]
  score: number
  recommended?: boolean
}

interface GeneratedResult {
  platform: string
  format: string
  variations: GeneratedVariation[]
}

interface HistoryItem {
  id: string
  campaign: string
  platforms: string[]
  objective: string
  preview: string
  date: string
}

interface Campaign {
  id: string
  name: string
  platforms: string[]
  objective: string
  status: string
  created: string
  budget: string
  spent: string
  impressions: string
  clicks: string
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const OBJECTIVES: { id: Objective; label: string; description: string; icon: React.ElementType; color: string }[] = [
  { id: 'awareness', label: 'Brand Awareness', description: 'Reach new restaurant and cafe owners. Introduce NHY-QR to your target audience.', icon: Eye, color: 'text-info' },
  { id: 'engagement', label: 'Engagement', description: 'Drive comments, shares, and interactions. Build a community around your product.', icon: MessageCircle, color: 'text-warning' },
  { id: 'conversions', label: 'Conversions', description: 'Drive sign-ups, demo requests, and purchases. Turn viewers into customers.', icon: Target, color: 'text-success' },
]

const AUDIENCE_OPTIONS = ['Restaurant Owners', 'Cafe Managers', 'Hotel Managers', 'Food Truck Owners', 'Bar Owners', 'Catering Services']

const CTA_OPTIONS = ['Get Started Free', 'Book a Demo', 'Learn More', 'Download App', 'Sign Up Now', 'Start Free Trial', 'Contact Sales']

const TONES = ['Professional', 'Friendly', 'Bold', 'Casual', 'Luxurious']

const TEMPLATES = [
  { id: 1, name: 'Problem-Solution', bestFor: 'Awareness', icon: Lightbulb },
  { id: 2, name: 'Behind the Scenes', bestFor: 'Engagement', icon: Eye },
  { id: 3, name: 'Customer Story', bestFor: 'Conversions', icon: Users },
  { id: 4, name: 'How It Works', bestFor: 'Awareness', icon: Zap },
  { id: 5, name: 'Limited Offer', bestFor: 'Conversions', icon: Target },
  { id: 6, name: 'Social Proof', bestFor: 'Engagement', icon: HeartHandshake },
  { id: 7, name: 'Comparison', bestFor: 'Awareness', icon: Filter },
  { id: 8, name: 'FAQ Style', bestFor: 'Engagement', icon: MessageSquare },
]

const MOCK_HISTORY: HistoryItem[] = [
  { id: '1', campaign: 'Summer Menu Launch', platforms: ['Instagram', 'Facebook'], objective: 'Conversions', preview: 'Transform Your Menu in Minutes...', date: 'Jun 14, 2024' },
  { id: '2', campaign: 'QR Demo Reel', platforms: ['Instagram', 'YouTube'], objective: 'Awareness', preview: 'See How Easy QR Menus Can Be...', date: 'Jun 13, 2024' },
  { id: '3', campaign: 'Cafe Testimonial', platforms: ['Facebook'], objective: 'Engagement', preview: 'What Cafe Owners Are Saying...', date: 'Jun 12, 2024' },
  { id: '4', campaign: 'Hotel Showcase', platforms: ['YouTube'], objective: 'Awareness', preview: 'Elevate Your Hotel Dining...', date: 'Jun 10, 2024' },
  { id: '5', campaign: 'Weekend Promo', platforms: ['Instagram'], objective: 'Conversions', preview: 'This Weekend Only: Free Setup...', date: 'Jun 8, 2024' },
]

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'Summer Menu Launch', platforms: ['Instagram', 'Facebook'], objective: 'Conversions', status: 'Published', created: 'Jun 14, 2024', budget: '$1,000', spent: '$892', impressions: '45.2K', clicks: '2,847' },
  { id: '2', name: 'QR Demo Reel', platforms: ['Instagram', 'YouTube'], objective: 'Awareness', status: 'Scheduled', created: 'Jun 13, 2024', budget: '$500', spent: '$0', impressions: '0', clicks: '0' },
  { id: '3', name: 'Cafe Testimonial', platforms: ['Facebook'], objective: 'Engagement', status: 'Draft', created: 'Jun 12, 2024', budget: '$750', spent: '$0', impressions: '0', clicks: '0' },
  { id: '4', name: 'Hotel Showcase', platforms: ['YouTube'], objective: 'Awareness', status: 'Published', created: 'Jun 10, 2024', budget: '$2,000', spent: '$1,534', impressions: '78.1K', clicks: '4,203' },
  { id: '5', name: 'Weekend Promo', platforms: ['Instagram'], objective: 'Conversions', status: 'Paused', created: 'Jun 8, 2024', budget: '$300', spent: '$189', impressions: '12.3K', clicks: '876' },
  { id: '6', name: 'Restaurant Owners Guide', platforms: ['Facebook', 'YouTube'], objective: 'Engagement', status: 'Published', created: 'Jun 5, 2024', budget: '$1,500', spent: '$1,210', impressions: '56.7K', clicks: '3,412' },
  { id: '7', name: 'Free Trial Push', platforms: ['Instagram', 'Facebook', 'YouTube'], objective: 'Conversions', status: 'Scheduled', created: 'Jun 3, 2024', budget: '$3,000', spent: '$0', impressions: '0', clicks: '0' },
  { id: '8', name: 'Menu Design Tips', platforms: ['Instagram'], objective: 'Awareness', status: 'Draft', created: 'Jun 1, 2024', budget: '$400', spent: '$0', impressions: '0', clicks: '0' },
]

const DEFAULT_SELLING_POINTS = ['Easy Setup', 'No Design Skills', 'QR Code Menu', 'Digital Catalogue', 'Analytics', 'Multi-language']

/* ------------------------------------------------------------------ */
/*  Mock Generated Data Builder                                        */
/* ------------------------------------------------------------------ */

function buildMockResults(platforms: Record<string, PlatformConfig>, objective: Objective): GeneratedResult[] {
  const results: GeneratedResult[] = []
  const headlines: Record<Objective, string[]> = {
    awareness: [
      'Discover the Future of Restaurant Menus',
      'Say Goodbye to Paper Menus Forever',
      '500+ Restaurants Already Transformed',
    ],
    engagement: [
      'What Do Your Customers Really Think?',
      'Join the QR Menu Revolution',
      'See How Easy Digital Menus Can Be',
    ],
    conversions: [
      'Transform Your Menu in Minutes',
      'Get Your First 100 Customers Free',
      'Start Your Free Trial Today',
    ],
  }
  const bodies: Record<Objective, string[]> = {
    awareness: [
      'NHY-QR helps restaurants, cafes, and hotels create stunning digital menus that customers access with a simple scan. No design skills needed — just upload your items and go live in minutes.',
      'Paper menus are outdated. Digital menus are the future. Give your customers a modern dining experience with NHY-QR\'s beautiful, easy-to-update digital menus.',
      'Join hundreds of restaurant owners who have already made the switch. NHY-QR makes it incredibly simple to create and manage digital menus.',
    ],
    engagement: [
      'We asked 100 restaurant owners about their biggest menu challenge. Their answer? Keeping them updated. Here\'s how NHY-QR solves that problem.',
      'The restaurant industry is changing fast. Stay ahead of the curve with digital menus that impress your customers and save you time.',
      'Curious about QR code menus? Watch this quick demo to see how NHY-QR works and why 500+ restaurants love it.',
    ],
    conversions: [
      'Stop reprinting menus every time you update a dish. With NHY-QR, create a stunning digital menu your customers can access with a simple scan. Update prices, add specials, and change layouts in seconds.',
      'Ready to modernize your restaurant? Get started free with NHY-QR and join 500+ restaurants already using our digital menu platform. No credit card required.',
      'Try NHY-QR free for 14 days. Create your digital menu, share it with customers, and watch your efficiency soar. Cancel anytime.',
    ],
  }
  const ctas = ['Get Started Free', 'Book a Demo', 'Start Free Trial', 'Learn More', 'Sign Up Now']
  const allHashtags = ['#QRMenu', '#DigitalMenu', '#RestaurantTech', '#NHYQR', '#SmartDining', '#MenuDesign', '#RestaurantOwner', '#CafeLife', '#HotelTech', '#FoodService']

  const entries = Object.entries(platforms).filter(([, p]) => p.enabled)
  for (const [platform, config] of entries) {
    for (const format of config.formats) {
      const variations: GeneratedVariation[] = Array.from({ length: 3 }, (_, i) => ({
        id: i + 1,
        headline: headlines[objective][i],
        body: bodies[objective][i],
        cta: ctas[i],
        hashtags: allHashtags.slice(i * 3, i * 3 + 4),
        score: 85 + i * 4,
        recommended: i === 0,
      }))
      results.push({ platform, format, variations })
    }
  }
  return results
}

/* ------------------------------------------------------------------ */
/*  Small Helper Components                                            */
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

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { bg: string; text: string; dot?: string }> = {
    Published: { bg: 'bg-success-light', text: 'text-success', dot: 'bg-success' },
    Scheduled: { bg: 'bg-warning-light', text: 'text-warning', dot: 'bg-warning' },
    Draft: { bg: 'bg-info-light', text: 'text-info', dot: 'bg-info' },
    Paused: { bg: 'bg-linen', text: 'text-stone', dot: 'bg-stone' },
  }
  const cfg = configs[status] || configs.Draft
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-caption font-medium', cfg.bg, cfg.text)}>
      {cfg.dot && <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />}
      {status}
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
      {copied ? <CheckCheck size={14} className="text-success" /> : <Copy size={14} />}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function AdGenerator() {
  const navigate = useNavigate()

  /* -- State -- */
  const [objective, setObjective] = useState<Objective>('conversions')
  const [campaignName, setCampaignName] = useState('')
  const [productDesc, setProductDesc] = useState('NHY-QR is a digital menu and catalogue app that lets restaurants, cafes, and hotels create beautiful QR code menus in minutes. No design skills needed.')
  const [audience, setAudience] = useState<string[]>(['Restaurant Owners'])
  const [sellingPoints, setSellingPoints] = useState(DEFAULT_SELLING_POINTS)
  const [newPoint, setNewPoint] = useState('')
  const [cta, setCta] = useState('Get Started Free')
  const [tone, setTone] = useState('Professional')
  const [platforms, setPlatforms] = useState<Record<string, PlatformConfig>>({
    Instagram: { enabled: true, formats: ['Reels'] },
    Facebook: { enabled: true, formats: ['Feed Post'] },
    YouTube: { enabled: false, formats: ['Shorts'] },
  })
  const [selectedTemplate, setSelectedTemplate] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [results, setResults] = useState<GeneratedResult[]>([])
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [campaignSearch, setCampaignSearch] = useState('')
  const [campaignFilter, setCampaignFilter] = useState('All')
  const [showExportBar, setShowExportBar] = useState(false)

  /* -- Toggle platform -- */
  const togglePlatform = (name: string) => {
    setPlatforms((prev) => ({
      ...prev,
      [name]: { ...prev[name], enabled: !prev[name].enabled },
    }))
  }

  const toggleFormat = (platform: string, format: string) => {
    setPlatforms((prev) => {
      const p = prev[platform]
      const has = p.formats.includes(format)
      return {
        ...prev,
        [platform]: {
          ...p,
          formats: has ? p.formats.filter((f) => f !== format) : [...p.formats, format],
        },
      }
    })
  }

  /* -- Add / remove selling point -- */
  const addPoint = () => {
    if (newPoint.trim() && !sellingPoints.includes(newPoint.trim())) {
      setSellingPoints([...sellingPoints, newPoint.trim()])
      setNewPoint('')
    }
  }

  const removePoint = (p: string) => setSellingPoints(sellingPoints.filter((sp) => sp !== p))

  /* -- Generate -- */
  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      const res = buildMockResults(platforms, objective)
      setResults(res)
      setGenerated(true)
      setGenerating(false)
      setShowExportBar(true)
      toast.success('Ad copy generated successfully!')
    }, 2000)
  }

  /* -- Copy all -- */
  const handleCopyAll = () => {
    const text = results.map((r) => {
      return `## ${r.platform} - ${r.format}\n\n` +
        r.variations.map((v) =>
          `Variation ${v.id}${v.recommended ? ' (Recommended)' : ''}\nHeadline: ${v.headline}\nBody: ${v.body}\nCTA: ${v.cta}\nHashtags: ${v.hashtags.join(' ')}\n`
        ).join('\n')
    }).join('\n---\n')
    navigator.clipboard.writeText(text)
    toast.success('All copy copied to clipboard')
  }

  const handleExportCSV = () => {
    toast.success('CSV export downloaded')
  }

  const handleExportJSON = () => {
    toast.success('JSON export downloaded')
  }

  /* -- Audience toggle -- */
  const toggleAudience = (a: string) => {
    setAudience((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))
  }

  /* -- Filtered campaigns -- */
  const filteredCampaigns = MOCK_CAMPAIGNS.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(campaignSearch.toLowerCase())
    const matchFilter = campaignFilter === 'All' || c.platforms.includes(campaignFilter)
    return matchSearch && matchFilter
  })

  /* -- Animation variants -- */
  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: (d: number) => ({ opacity: 1, y: 0, transition: { duration: 0.3, delay: d } }),
  }

  return (
    <div className="space-y-8 pb-24">
      {/* ============================================================ */}
      {/* SECTION 1 — Page Header + Objective Selector                */}
      {/* ============================================================ */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <h1 className="text-display text-warm-black">Ad Generator</h1>
        <p className="text-body-sm text-stone mt-1">Create AI-powered ad copy optimized for your goals and platforms.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {OBJECTIVES.map((obj, i) => {
          const Icon = obj.icon
          const isSelected = objective === obj.id
          return (
            <motion.button
              key={obj.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 * (i + 1) }}
              onClick={() => setObjective(obj.id)}
              className={cn(
                'relative text-left p-5 rounded-card border-2 transition-all duration-200',
                isSelected
                  ? 'border-caramel bg-peach/40 shadow-card-hover'
                  : 'border-linen bg-white hover:border-sand'
              )}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-3 right-3 w-5 h-5 rounded-full bg-caramel flex items-center justify-center"
                >
                  <Check size={12} className="text-white" />
                </motion.div>
              )}
              <Icon size={32} className={cn('mb-3', obj.color)} />
              <h3 className="text-h3 text-warm-black">{obj.label}</h3>
              <p className="text-body-sm text-stone mt-1">{obj.description}</p>
            </motion.button>
          )
        })}
      </div>

      {/* ============================================================ */}
      {/* SECTION 2 — Configuration Panel                             */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-6">
        {/* Left: Campaign Details */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-card border border-linen p-6 space-y-5"
        >
          <h2 className="text-h2 text-warm-black">Campaign Details</h2>

          {/* Campaign Name */}
          <div>
            <label className="text-h4 text-warm-black block mb-1.5">Campaign Name</label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g., Summer Menu Launch for Restaurants"
              className="w-full h-10 px-3 rounded-button border border-sand text-sm text-warm-black placeholder:text-stone/60 outline-none focus:border-caramel focus:shadow-input-focus transition-all"
            />
            <p className="text-caption text-stone mt-1">This name helps you identify the campaign in your dashboard.</p>
          </div>

          {/* Product Description */}
          <div>
            <label className="text-h4 text-warm-black block mb-1.5">Product Description</label>
            <textarea
              value={productDesc}
              onChange={(e) => setProductDesc(e.target.value)}
              rows={4}
              placeholder="Describe what NHY-QR does and your unique selling points..."
              className="w-full px-3 py-2 rounded-button border border-sand text-sm text-warm-black placeholder:text-stone/60 outline-none focus:border-caramel focus:shadow-input-focus transition-all resize-none"
            />
            <div className="flex justify-between mt-1">
              <p className="text-caption text-stone">Describe your product for better copy generation.</p>
              <span className="text-caption text-stone">{productDesc.length}/500</span>
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="text-h4 text-warm-black block mb-1.5">Target Audience</label>
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_OPTIONS.map((a) => (
                <button
                  key={a}
                  onClick={() => toggleAudience(a)}
                  className={cn(
                    'px-3 py-1.5 rounded-tag text-sm font-medium transition-colors',
                    audience.includes(a)
                      ? 'bg-caramel text-white'
                      : 'bg-cream text-stone hover:bg-peach/50'
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Key Selling Points */}
          <div>
            <label className="text-h4 text-warm-black block mb-1.5">Key Selling Points</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {sellingPoints.map((sp) => (
                <span key={sp} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-tag bg-peach text-caramel text-sm font-medium">
                  {sp}
                  <button onClick={() => removePoint(sp)} className="hover:text-danger transition-colors">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPoint}
                onChange={(e) => setNewPoint(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPoint()}
                placeholder="Add a selling point..."
                className="flex-1 h-9 px-3 rounded-button border border-sand text-sm text-warm-black placeholder:text-stone/60 outline-none focus:border-caramel focus:shadow-input-focus transition-all"
              />
              <button
                onClick={addPoint}
                className="h-9 px-4 rounded-button bg-cream text-warm-black text-sm font-medium hover:bg-peach/50 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* CTA */}
          <div>
            <label className="text-h4 text-warm-black block mb-1.5">Primary CTA</label>
            <select
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              className="w-full h-10 px-3 rounded-button border border-sand text-sm text-warm-black outline-none focus:border-caramel focus:shadow-input-focus transition-all bg-white"
            >
              {CTA_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* Tone */}
          <div>
            <label className="text-h4 text-warm-black block mb-1.5">Tone of Voice</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                    tone === t
                      ? 'bg-caramel text-white'
                      : 'bg-cream text-stone hover:bg-peach/50'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right: Platforms & Templates */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-6"
        >
          <div className="bg-white rounded-card border border-linen p-6 space-y-5">
            <h2 className="text-h2 text-warm-black">Platforms & Templates</h2>

            {/* Platform Selector */}
            <div>
              <label className="text-h4 text-warm-black block mb-3">Select Platforms</label>
              <div className="space-y-3">
                {/* Instagram */}
                <div className={cn(
                  'rounded-card border transition-all',
                  platforms.Instagram.enabled ? 'border-linen bg-white' : 'border-linen/50 bg-cream/50'
                )}>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <PlatformBadge platform="Instagram" />
                    </div>
                    <button
                      onClick={() => togglePlatform('Instagram')}
                      className={cn(
                        'w-11 h-6 rounded-full transition-colors relative',
                        platforms.Instagram.enabled ? 'bg-[#E4405F]' : 'bg-sand'
                      )}
                    >
                      <div className={cn(
                        'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                        platforms.Instagram.enabled ? 'left-6' : 'left-1'
                      )} />
                    </button>
                  </div>
                  <AnimatePresence>
                    {platforms.Instagram.enabled && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 flex flex-wrap gap-3">
                          {['Reels', 'Stories', 'Feed Post', 'Carousel'].map((f) => (
                            <label key={f} className="flex items-center gap-2 cursor-pointer">
                              <div
                                onClick={() => toggleFormat('Instagram', f)}
                                className={cn(
                                  'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                                  platforms.Instagram.formats.includes(f)
                                    ? 'bg-[#E4405F] border-[#E4405F]'
                                    : 'border-sand'
                                )}
                              >
                                {platforms.Instagram.formats.includes(f) && <Check size={10} className="text-white" />}
                              </div>
                              <span className="text-sm text-warm-black">{f}</span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Facebook */}
                <div className={cn(
                  'rounded-card border transition-all',
                  platforms.Facebook.enabled ? 'border-linen bg-white' : 'border-linen/50 bg-cream/50'
                )}>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <PlatformBadge platform="Facebook" />
                    </div>
                    <button
                      onClick={() => togglePlatform('Facebook')}
                      className={cn(
                        'w-11 h-6 rounded-full transition-colors relative',
                        platforms.Facebook.enabled ? 'bg-[#1877F2]' : 'bg-sand'
                      )}
                    >
                      <div className={cn(
                        'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                        platforms.Facebook.enabled ? 'left-6' : 'left-1'
                      )} />
                    </button>
                  </div>
                  <AnimatePresence>
                    {platforms.Facebook.enabled && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 flex flex-wrap gap-3">
                          {['Feed Post', 'Story', 'Carousel'].map((f) => (
                            <label key={f} className="flex items-center gap-2 cursor-pointer">
                              <div
                                onClick={() => toggleFormat('Facebook', f)}
                                className={cn(
                                  'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                                  platforms.Facebook.formats.includes(f)
                                    ? 'bg-[#1877F2] border-[#1877F2]'
                                    : 'border-sand'
                                )}
                              >
                                {platforms.Facebook.formats.includes(f) && <Check size={10} className="text-white" />}
                              </div>
                              <span className="text-sm text-warm-black">{f}</span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* YouTube */}
                <div className={cn(
                  'rounded-card border transition-all',
                  platforms.YouTube.enabled ? 'border-linen bg-white' : 'border-linen/50 bg-cream/50'
                )}>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <PlatformBadge platform="YouTube" />
                    </div>
                    <button
                      onClick={() => togglePlatform('YouTube')}
                      className={cn(
                        'w-11 h-6 rounded-full transition-colors relative',
                        platforms.YouTube.enabled ? 'bg-[#FF0000]' : 'bg-sand'
                      )}
                    >
                      <div className={cn(
                        'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                        platforms.YouTube.enabled ? 'left-6' : 'left-1'
                      )} />
                    </button>
                  </div>
                  <AnimatePresence>
                    {platforms.YouTube.enabled && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 flex flex-wrap gap-3">
                          {['Shorts', 'In-Feed', 'Discovery'].map((f) => (
                            <label key={f} className="flex items-center gap-2 cursor-pointer">
                              <div
                                onClick={() => toggleFormat('YouTube', f)}
                                className={cn(
                                  'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                                  platforms.YouTube.formats.includes(f)
                                    ? 'bg-[#FF0000] border-[#FF0000]'
                                    : 'border-sand'
                                )}
                              >
                                {platforms.YouTube.formats.includes(f) && <Check size={10} className="text-white" />}
                              </div>
                              <span className="text-sm text-warm-black">{f}</span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Template Selector */}
            <div>
              <label className="text-h4 text-warm-black block mb-3">Choose a Template</label>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
                {TEMPLATES.map((t) => {
                  const TIcon = t.icon
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={cn(
                        'flex-shrink-0 w-[180px] p-4 rounded-card border-2 text-left transition-all snap-start',
                        selectedTemplate === t.id
                          ? 'border-caramel bg-peach/30 shadow-card-hover'
                          : 'border-linen bg-white hover:border-sand'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
                        selectedTemplate === t.id ? 'bg-caramel/20' : 'bg-cream'
                      )}>
                        <TIcon size={20} className="text-caramel" />
                      </div>
                      <h4 className="text-h4 text-warm-black">{t.name}</h4>
                      <span className="text-caption text-stone mt-1 block">Best for: {t.bestFor}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={cn(
                'w-full h-12 rounded-button bg-caramel text-white font-medium flex items-center justify-center gap-2 transition-all',
                'hover:bg-caramel/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed',
                !generating && 'shadow-[0_0_0_0_rgba(196,129,75,0)] animate-pulse-subtle'
              )}
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Ad Copy
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 3 — Generated Ad Copy Results                       */}
      {/* ============================================================ */}
      <AnimatePresence>
        {generated && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-card border border-linen p-6"
          >
            <h2 className="text-h2 text-warm-black mb-4">Generated Ad Copy</h2>
            <Tabs defaultValue={results[0]?.platform + '-' + results[0]?.format}>
              <TabsList className="mb-4 bg-cream">
                {results.map((r) => (
                  <TabsTrigger key={`${r.platform}-${r.format}`} value={`${r.platform}-${r.format}`} className="data-[state=active]:bg-white data-[state=active]:text-caramel">
                    <span className="flex items-center gap-1.5">
                      {r.platform === 'Instagram' && <Instagram size={14} />}
                      {r.platform === 'Facebook' && <Facebook size={14} />}
                      {r.platform === 'YouTube' && <Youtube size={14} />}
                      {r.platform} {r.format}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {results.map((r) => (
                <TabsContent key={`${r.platform}-${r.format}`} value={`${r.platform}-${r.format}`} className="space-y-4">
                  {r.variations.map((v, vi) => (
                    <motion.div
                      key={v.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: vi * 0.1 }}
                      className="rounded-card border border-linen p-5 space-y-4"
                    >
                      {/* Variation Header */}
                      <div className="flex items-center gap-3">
                        <span className="text-h4 text-warm-black">Variation {v.id}</span>
                        {v.recommended && (
                          <span className="px-2 py-0.5 rounded-tag bg-success-light text-success text-caption font-medium">
                            Recommended
                          </span>
                        )}
                        <span className="text-caption text-stone ml-auto">Engagement Score: {v.score}/100</span>
                      </div>

                      {/* Headline */}
                      <div className="bg-cream/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-h4 text-stone">Headline</span>
                          <CopyButton text={v.headline} label="Headline" />
                        </div>
                        <p className="text-h3 text-warm-black">{v.headline}</p>
                      </div>

                      {/* Body */}
                      <div className="bg-cream/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-h4 text-stone">Body Text</span>
                          <CopyButton text={v.body} label="Body" />
                        </div>
                        <p className="text-body-sm text-warm-black leading-relaxed">{v.body}</p>
                      </div>

                      {/* CTA */}
                      <div className="bg-cream/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-h4 text-stone">Call-to-Action</span>
                          <CopyButton text={v.cta} label="CTA" />
                        </div>
                        <p className="text-h4 text-caramel">{v.cta}</p>
                      </div>

                      {/* Hashtags */}
                      <div className="bg-cream/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-h4 text-stone">Hashtags</span>
                          <CopyButton text={v.hashtags.join(' ')} label="Hashtags" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {v.hashtags.map((h) => (
                            <span key={h} className="px-2.5 py-1 rounded-tag bg-peach text-caramel text-sm font-medium">{h}</span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* SECTION 4 — Platform-Specific Ad Previews                   */}
      {/* ============================================================ */}
      <AnimatePresence>
        {generated && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white rounded-card border border-linen p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-h2 text-warm-black">Ad Previews</h2>
              <AdPreviewPlatformToggle results={results} />
            </div>
            <AdPreview results={results} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* SECTION 5 — Generation History                              */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-white rounded-card border border-linen overflow-hidden"
      >
        <button
          onClick={() => setHistoryExpanded(!historyExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-cream/30 transition-colors"
        >
          <h2 className="text-h2 text-warm-black">Generation History</h2>
          <motion.div animate={{ rotate: historyExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown size={20} className="text-stone" />
          </motion.div>
        </button>
        <AnimatePresence>
          {historyExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-cream text-left">
                        <th className="px-4 py-3 text-caption text-stone uppercase tracking-wider font-semibold">Campaign</th>
                        <th className="px-4 py-3 text-caption text-stone uppercase tracking-wider font-semibold">Platform</th>
                        <th className="px-4 py-3 text-caption text-stone uppercase tracking-wider font-semibold">Objective</th>
                        <th className="px-4 py-3 text-caption text-stone uppercase tracking-wider font-semibold">Preview</th>
                        <th className="px-4 py-3 text-caption text-stone uppercase tracking-wider font-semibold">Date</th>
                        <th className="px-4 py-3 text-caption text-stone uppercase tracking-wider font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_HISTORY.map((h, i) => (
                        <motion.tr
                          key={h.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-linen hover:bg-peach/20 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-warm-black font-medium">{h.campaign}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {h.platforms.map((p) => <PlatformBadge key={p} platform={p} />)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'px-2 py-0.5 rounded-tag text-caption font-medium',
                              h.objective === 'Conversions' && 'bg-success-light text-success',
                              h.objective === 'Awareness' && 'bg-info-light text-info',
                              h.objective === 'Engagement' && 'bg-warning-light text-warning',
                            )}>
                              {h.objective}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-stone truncate max-w-[200px]">{h.preview}</td>
                          <td className="px-4 py-3 text-sm text-stone">{h.date}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button className="p-1.5 rounded-md text-stone hover:text-caramel hover:bg-peach/30 transition-colors" title="View">
                                <Eye size={14} />
                              </button>
                              <button className="p-1.5 rounded-md text-stone hover:text-caramel hover:bg-peach/30 transition-colors" title="Copy">
                                <Copy size={14} />
                              </button>
                              <button className="p-1.5 rounded-md text-stone hover:text-danger hover:bg-danger-light transition-colors" title="Delete">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ============================================================ */}
      {/* SECTION 6 — Campaign Manager                                */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        className="bg-white rounded-card border border-linen p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <h2 className="text-h2 text-warm-black">All Campaigns</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
              <input
                type="text"
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
                placeholder="Search campaigns..."
                className="h-9 pl-9 pr-3 rounded-button border border-sand text-sm text-warm-black placeholder:text-stone/60 outline-none focus:border-caramel focus:shadow-input-focus transition-all w-[240px]"
              />
            </div>
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="h-9 px-3 rounded-button border border-sand text-sm text-warm-black outline-none focus:border-caramel bg-white"
            >
              <option value="All">All Platforms</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="YouTube">YouTube</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-cream text-left">
                <th className="px-4 py-3 text-caption text-stone uppercase tracking-wider font-semibold">Campaign</th>
                <th className="px-4 py-3 text-caption text-stone uppercase tracking-wider font-semibold">Platforms</th>
                <th className="px-4 py-3 text-caption text-stone uppercase tracking-wider font-semibold">Objective</th>
                <th className="px-4 py-3 text-caption text-stone uppercase tracking-wider font-semibold">Status</th>
                <th className="px-4 py-3 text-caption text-stone uppercase tracking-wider font-semibold">Budget</th>
                <th className="px-4 py-3 text-caption text-stone uppercase tracking-wider font-semibold">Performance</th>
                <th className="px-4 py-3 text-caption text-stone uppercase tracking-wider font-semibold">Created</th>
                <th className="px-4 py-3 text-caption text-stone uppercase tracking-wider font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-linen hover:bg-peach/20 transition-colors cursor-pointer"
                  onClick={() => navigate(`/campaigns/${c.id}`)}
                >
                  <td className="px-4 py-3 text-sm text-warm-black font-medium">{c.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {c.platforms.map((p) => <PlatformBadge key={p} platform={p} />)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'px-2 py-0.5 rounded-tag text-caption font-medium',
                      c.objective === 'Conversions' && 'bg-success-light text-success',
                      c.objective === 'Awareness' && 'bg-info-light text-info',
                      c.objective === 'Engagement' && 'bg-warning-light text-warning',
                    )}>
                      {c.objective}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-sm text-warm-black">
                    <div className="flex items-center gap-2">
                      <span>{c.spent} / {c.budget}</span>
                      <div className="w-16 h-1.5 bg-linen rounded-full overflow-hidden">
                        <div
                          className="h-full bg-caramel rounded-full"
                          style={{ width: `${c.spent === '$0' ? 0 : Math.min(100, parseInt(c.spent.replace(/[^0-9]/g, '')) / parseInt(c.budget.replace(/[^0-9]/g, '')) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-stone">
                    {c.impressions !== '0' ? `${c.impressions} imp · ${c.clicks} clicks` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-stone">{c.created}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/campaigns/${c.id}`) }}
                        className="p-1.5 rounded-md text-stone hover:text-caramel hover:bg-peach/30 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-md text-stone hover:text-warning hover:bg-warning-light transition-colors"
                        title={c.status === 'Paused' ? 'Resume' : 'Pause'}
                      >
                        {c.status === 'Paused' ? <Play size={14} /> : <Pause size={14} />}
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-md text-stone hover:text-danger hover:bg-danger-light transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* SECTION 7 — Export & Share Actions (Sticky Bar)             */}
      {/* ============================================================ */}
      <AnimatePresence>
        {showExportBar && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-[260px] right-0 z-30 bg-white border-t border-linen shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <p className="text-sm text-stone">
              {results.reduce((a, r) => a + r.variations.length, 0)} variations for{' '}
              {results.map((r) => r.platform).filter((v, i, a) => a.indexOf(v) === i).join(' + ')}
            </p>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 h-9 px-3 rounded-button border border-linen text-sm text-warm-black hover:bg-cream transition-colors"
              >
                <Copy size={14} />
                Copy All Text
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 h-9 px-3 rounded-button border border-linen text-sm text-warm-black hover:bg-cream transition-colors"
              >
                <Download size={14} />
                Export as CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 h-9 px-3 rounded-button border border-linen text-sm text-warm-black hover:bg-cream transition-colors"
              >
                <FileText size={14} />
                Export as JSON
              </button>
              <button
                onClick={() => toast.success('Saved to campaign!')}
                className="flex items-center gap-1.5 h-9 px-4 rounded-button bg-caramel text-white text-sm font-medium hover:bg-caramel/90 transition-colors"
              >
                <Check size={14} />
                Save to Campaign
              </button>
              <button
                onClick={() => navigate('/schedule')}
                className="flex items-center gap-1.5 h-9 px-4 rounded-button border-2 border-caramel text-caramel text-sm font-medium hover:bg-caramel/5 transition-colors"
              >
                <CalendarDays size={14} />
                Schedule Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Ad Preview Sub-Components                                          */
/* ------------------------------------------------------------------ */

function AdPreviewPlatformToggle({ results }: { results: GeneratedResult[] }) {
  const [activePlatform, setActivePlatform] = useState(results[0]?.platform || 'Instagram')
  const platforms = results.map((r) => r.platform).filter((v, i, a) => a.indexOf(v) === i)

  const colors: Record<string, string> = {
    Instagram: 'bg-[#E4405F]/10 text-[#E4405F] border-[#E4405F]/30',
    Facebook: 'bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/30',
    YouTube: 'bg-[#FF0000]/10 text-[#FF0000] border-[#FF0000]/30',
  }

  return (
    <div className="flex gap-2">
      {platforms.map((p) => (
        <button
          key={p}
          onClick={() => setActivePlatform(p)}
          className={cn(
            'px-3 py-1.5 rounded-button text-sm font-medium border transition-colors',
            activePlatform === p ? colors[p] : 'bg-cream text-stone border-transparent hover:bg-peach/50'
          )}
        >
          {p}
        </button>
      ))}
    </div>
  )
}

function AdPreview({ results }: { results: GeneratedResult[] }) {
  const [activePlatform, setActivePlatform] = useState(results[0]?.platform || 'Instagram')
  const platformResults = results.filter((r) => r.platform === activePlatform)
  const variation = platformResults[0]?.variations[0]

  if (!variation) return null

  return (
    <div className="flex justify-center">
      <AnimatePresence mode="wait">
        {activePlatform === 'Instagram' && (
          <InstagramPreview key="ig" variation={variation} onPlatformChange={setActivePlatform} results={results} />
        )}
        {activePlatform === 'Facebook' && (
          <FacebookPreview key="fb" variation={variation} onPlatformChange={setActivePlatform} results={results} />
        )}
        {activePlatform === 'YouTube' && (
          <YouTubePreview key="yt" variation={variation} onPlatformChange={setActivePlatform} results={results} />
        )}
      </AnimatePresence>
    </div>
  )
}

function InstagramPreview({ variation, onPlatformChange, results }: { variation: GeneratedVariation; onPlatformChange: (p: string) => void; results: GeneratedResult[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-[320px]"
    >
      <AdPreviewPlatformToggle results={results} />
      <div className="mt-4 bg-black rounded-[32px] overflow-hidden border-4 border-graphite/20 shadow-xl">
        {/* IG Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black">
          <div className="flex items-center gap-2">
            <button onClick={() => onPlatformChange('Instagram')} className="text-white"><Instagram size={18} /></button>
            <span className="text-white text-sm font-semibold">Reels</span>
          </div>
          <Search size={18} className="text-white" />
        </div>
        {/* Video Area */}
        <div className="relative bg-gradient-to-br from-caramel/40 via-espresso to-warm-black aspect-[9/16] flex items-center justify-center">
          <img src="/nhyqr-qr-placemat.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
          <button className="relative z-10 w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <Play size={28} className="text-white ml-1" />
          </button>
          {/* Headline overlay */}
          <div className="absolute top-1/3 left-4 right-4 z-10">
            <p className="text-white text-lg font-bold text-center drop-shadow-lg">{variation.headline}</p>
          </div>
          {/* Right actions */}
          <div className="absolute right-3 bottom-24 flex flex-col items-center gap-4 z-10">
            <div className="flex flex-col items-center gap-1"><Heart size={24} className="text-white" /><span className="text-white text-xs">1.2K</span></div>
            <div className="flex flex-col items-center gap-1"><MessageSquare size={24} className="text-white" /><span className="text-white text-xs">86</span></div>
            <div className="flex flex-col items-center gap-1"><Share2 size={24} className="text-white" /><span className="text-white text-xs">42</span></div>
            <Bookmark size={24} className="text-white" />
          </div>
          {/* Bottom info */}
          <div className="absolute bottom-4 left-4 right-16 z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-caramel flex items-center justify-center text-white text-xs font-bold">N</div>
              <span className="text-white text-sm font-semibold">nhyqr.app</span>
            </div>
            <p className="text-white/90 text-xs leading-relaxed mb-2">{variation.body.slice(0, 100)}...</p>
            <div className="flex items-center gap-1.5">
              <span className="px-3 py-1.5 bg-white/20 backdrop-blur rounded-lg text-white text-xs font-medium">{variation.cta}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function FacebookPreview({ variation, onPlatformChange, results }: { variation: GeneratedVariation; onPlatformChange: (p: string) => void; results: GeneratedResult[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-[500px]"
    >
      <AdPreviewPlatformToggle results={results} />
      <div className="mt-4 bg-white rounded-lg border border-linen shadow-xl overflow-hidden">
        {/* FB Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-caramel flex items-center justify-center text-white font-bold text-sm">N</div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-warm-black">NHY-QR</span>
                <Check size={12} className="text-[#1877F2]" />
              </div>
              <span className="text-xs text-stone">Sponsored</span>
            </div>
          </div>
          <button onClick={() => onPlatformChange('Facebook')}><Facebook size={18} className="text-[#1877F2]" /></button>
        </div>
        {/* Body */}
        <div className="px-4 pb-3">
          <p className="text-warm-black font-semibold text-sm mb-1">{variation.headline}</p>
          <p className="text-stone text-sm leading-relaxed">{variation.body}</p>
        </div>
        {/* Image */}
        <div className="relative aspect-video bg-cream">
          <img src="/nhyqr-app-mockup-1.jpg" alt="" className="w-full h-full object-cover" />
        </div>
        {/* CTA */}
        <div className="px-4 py-3 border-t border-linen flex items-center justify-between">
          <span className="text-sm text-stone">nhyqr.com</span>
          <button className="px-4 py-2 bg-[#1877F2] text-white text-sm font-medium rounded-button hover:bg-[#1877F2]/90 transition-colors">
            {variation.cta}
          </button>
        </div>
        {/* Engagement */}
        <div className="px-4 py-2 border-t border-linen flex items-center justify-between text-sm text-stone">
          <div className="flex items-center gap-1"><ThumbsUp size={14} className="text-[#1877F2]" /> 234</div>
          <div className="flex gap-3">
            <span>45 Comments</span>
            <span>12 Shares</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function YouTubePreview({ variation, onPlatformChange, results }: { variation: GeneratedVariation; onPlatformChange: (p: string) => void; results: GeneratedResult[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-[320px]"
    >
      <AdPreviewPlatformToggle results={results} />
      <div className="mt-4 bg-black rounded-[24px] overflow-hidden border-4 border-graphite/20 shadow-xl">
        {/* YT Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black">
          <Share2 size={18} className="text-white -scale-x-100" />
          <div className="flex items-center gap-2">
            <button onClick={() => onPlatformChange('YouTube')}><Youtube size={18} className="text-[#FF0000]" /></button>
            <span className="text-white text-sm font-semibold">Shorts</span>
          </div>
          <Search size={18} className="text-white" />
        </div>
        {/* Video Area */}
        <div className="relative bg-gradient-to-br from-warm-black via-espresso to-graphite aspect-[9/14] flex items-center justify-center">
          <img src="/nhyqr-restaurant-scene.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
          <button className="relative z-10 w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <Play size={24} className="text-white ml-0.5" />
          </button>
          {/* Right actions */}
          <div className="absolute right-3 bottom-32 flex flex-col items-center gap-4 z-10">
            <div className="flex flex-col items-center gap-1"><ThumbsUp size={22} className="text-white" /><span className="text-white text-xs">3.4K</span></div>
            <div className="flex flex-col items-center gap-1"><ThumbsDown size={22} className="text-white" /><span className="text-white text-xs">24</span></div>
            <div className="flex flex-col items-center gap-1"><MessageSquare size={22} className="text-white" /><span className="text-white text-xs">156</span></div>
            <div className="flex flex-col items-center gap-1"><Share2 size={22} className="text-white" /><span className="text-white text-xs">Share</span></div>
          </div>
          {/* Bottom info */}
          <div className="absolute bottom-4 left-4 right-16 z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#FF0000] flex items-center justify-center text-white text-xs font-bold">N</div>
              <div>
                <span className="text-white text-sm font-semibold block">NHY-QR</span>
                <button className="px-2 py-0.5 bg-[#FF0000] text-white text-[10px] font-medium rounded">SUBSCRIBE</button>
              </div>
            </div>
            <p className="text-white text-sm font-semibold mb-1">{variation.headline}</p>
            <p className="text-white/70 text-xs">{variation.body.slice(0, 80)}...</p>
            <span className="inline-block mt-2 px-3 py-1 bg-white/20 backdrop-blur rounded text-white text-xs">{variation.cta}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
