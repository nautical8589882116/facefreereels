import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Package,
  Palette,
  Share2,
  Sparkles,
  GripVertical,
  X,
  Plus,
  Check,
  Upload,
  Trash2,
  RefreshCw,
  Instagram,
  Facebook,
  Youtube,
  
  Star,
  AlertCircle,
} from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import PlatformConnect from '@/components/PlatformConnect'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Feature {
  id: string
  name: string
  description: string
}

interface PricingTier {
  id: string
  name: string
  price: string
  features: string[]
  highlighted: boolean
}

interface PlatformAccount {
  id: string
  platform: 'instagram' | 'facebook' | 'youtube'
  accountName: string
  accountType: string
  connected: boolean
  connectedDate: string
  permissions: { name: string; granted: boolean }[]
  followers?: string
}

interface BrandVoice {
  professionalCasual: number
  formalFriendly: number
  technicalSimple: number
  seriousPlayful: number
}

type SettingsTab = 'product' | 'brand' | 'platforms' | 'ai'

const navItems: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'product', label: 'Product Information', icon: Package },
  { id: 'brand', label: 'Brand Settings', icon: Palette },
  { id: 'platforms', label: 'Platform Accounts', icon: Share2 },
  { id: 'ai', label: 'AI Preferences', icon: Sparkles },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let _id = 0
function uid() {
  return `uid-${++_id}-${Date.now().toString(36)}`
}

function platformColor(p: PlatformAccount['platform']) {
  switch (p) {
    case 'instagram':
      return { bg: 'bg-[#E4405F]', text: 'text-[#E4405F]', light: 'bg-[#E4405F]/10' }
    case 'facebook':
      return { bg: 'bg-[#1877F2]', text: 'text-[#1877F2]', light: 'bg-[#1877F2]/10' }
    case 'youtube':
      return { bg: 'bg-[#FF0000]', text: 'text-[#FF0000]', light: 'bg-[#FF0000]/10' }
  }
}

function platformIcon(p: PlatformAccount['platform']) {
  switch (p) {
    case 'instagram':
      return Instagram
    case 'facebook':
      return Facebook
    case 'youtube':
      return Youtube
  }
}

/* ------------------------------------------------------------------ */
/*  Feature List (reorderable)                                         */
/* ------------------------------------------------------------------ */

const defaultFeatures: Feature[] = [
  { id: uid(), name: 'QR Code Menu Generation', description: 'Instantly create scannable QR menus' },
  { id: uid(), name: 'Multi-language Support', description: 'Serve customers in their language' },
  { id: uid(), name: 'Real-time Menu Updates', description: 'Change prices and items on the fly' },
  { id: uid(), name: 'Beautiful Templates', description: 'Professionally designed menu layouts' },
  { id: uid(), name: 'Analytics Dashboard', description: 'Track scans, views, and engagement' },
  { id: uid(), name: 'No Design Skills Needed', description: 'Drag-and-drop simplicity' },
  { id: uid(), name: 'Works Offline', description: 'Menus work even without internet' },
  { id: uid(), name: 'Custom Branding', description: 'Add your logo and colors' },
]

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  /* ---- active tab ---- */
  const [activeTab, setActiveTab] = useState<SettingsTab>('product')
  const [hasChanges, setHasChanges] = useState(false)

  /* ---- Product Info state ---- */
  const [productName, setProductName] = useState('NHY-QR Digital Menu/Catalogue')
  const [productTagline, setProductTagline] = useState('The easiest way for restaurants to go digital.')
  const [productDescription, setProductDescription] = useState(
    'NHY-QR is a powerful digital menu and catalogue app designed for restaurants, cafes, hotels, and hospitality businesses. Create beautiful, interactive QR code menus in minutes — no design skills needed.'
  )
  const [features, setFeatures] = useState<Feature[]>(defaultFeatures)
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([
    { id: uid(), name: 'Starter', price: '$19/month', features: ['Up to 3 menus', 'Basic templates', 'QR code generation'], highlighted: false },
    { id: uid(), name: 'Professional', price: '$49/month', features: ['Unlimited menus', 'Premium templates', 'Analytics', 'Custom branding'], highlighted: true },
    { id: uid(), name: 'Enterprise', price: '$99/month', features: ['Everything in Pro', 'Multi-location', 'API access', 'Priority support'], highlighted: false },
  ])
  const [audienceTags, setAudienceTags] = useState(['Restaurant Owners', 'Cafe Managers', 'Hotel Managers', 'Food Truck Owners', 'Bar Owners', 'Catering Services'])
  const [competitorTags, setCompetitorTags] = useState(['MenuDrive', 'Toast', 'Square for Restaurants'])
  const [uvp, setUvp] = useState('The easiest way for restaurants to go digital. Setup in under 5 minutes, update menus in seconds, and impress customers with a modern dining experience.')

  /* ---- Brand Settings state ---- */
  const [primaryColor, setPrimaryColor] = useState('#C4814B')
  const [secondaryColor, setSecondaryColor] = useState('#2C2420')
  const [accentColor, setAccentColor] = useState('#4A7FB5')
  const [headingFont, setHeadingFont] = useState('Inter')
  const [bodyFont, setBodyFont] = useState('Inter')
  const [brandVoice, setBrandVoice] = useState<BrandVoice>({
    professionalCasual: 65,
    formalFriendly: 75,
    technicalSimple: 80,
    seriousPlayful: 40,
  })
  const [forbiddenWords, setForbiddenWords] = useState(['cheap', 'complicated', 'difficult', 'old-fashioned'])

  /* ---- Platform Accounts state ---- */
  const [accounts, setAccounts] = useState<PlatformAccount[]>([
    {
      id: uid(), platform: 'instagram', accountName: '@nhyqr.app', accountType: 'Business Account',
      connected: true, connectedDate: 'Jun 1, 2024',
      permissions: [{ name: 'Content Publish', granted: true }, { name: 'Insights', granted: true }, { name: 'Instagram Basic Display', granted: true }],
      followers: '12.4K',
    },
    {
      id: uid(), platform: 'facebook', accountName: 'NHY-QR Digital Menu', accountType: 'Page',
      connected: true, connectedDate: 'Jun 1, 2024',
      permissions: [{ name: 'Page Content', granted: true }, { name: 'Page Insights', granted: true }, { name: 'Ads Management', granted: true }],
      followers: '8.2K',
    },
    {
      id: uid(), platform: 'youtube', accountName: 'NHY-QR', accountType: 'Channel',
      connected: false, connectedDate: '',
      permissions: [{ name: 'YouTube Data API', granted: false }, { name: 'Upload', granted: false }, { name: 'Read Analytics', granted: false }],
      followers: '0',
    },
  ])

  /* ---- AI Preferences state ---- */
  const [adObjective, setAdObjective] = useState('conversions')
  const [creativityLevel, setCreativityLevel] = useState([65])
  const [defaultPlatforms, setDefaultPlatforms] = useState({ instagram: true, facebook: true, youtube: false })
  const [hashtagCount, setHashtagCount] = useState([8])
  const [alwaysInclude, setAlwaysInclude] = useState('NHY-QR — Digital Menu & Catalogue App')
  const [avoidText, setAvoidText] = useState('')
  const [useEmojis, setUseEmojis] = useState(true)
  const [ctaPreference, setCtaPreference] = useState('Get Started Free')
  const [language, setLanguage] = useState('en-US')
  const [copyLength, setCopyLength] = useState('medium')

  /* ---- Tag input helpers ---- */
  const [tagInput, setTagInput] = useState('')
  const [competitorInput, setCompetitorInput] = useState('')
  const [forbiddenInput, setForbiddenInput] = useState('')

  /* ---- Drag state ---- */
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const dragOverIndex = useRef<number | null>(null)


  const markChanged = useCallback(() => setHasChanges(true), [])

  /* ---- Feature list drag handlers ---- */
  const handleFeatureDragStart = (index: number) => setDragIndex(index)
  const handleFeatureDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    dragOverIndex.current = index
  }
  const handleFeatureDrop = () => {
    if (dragIndex === null || dragOverIndex.current === null) return
    const newFeatures = [...features]
    const [removed] = newFeatures.splice(dragIndex, 1)
    newFeatures.splice(dragOverIndex.current, 0, removed)
    setFeatures(newFeatures)
    setDragIndex(null)
    dragOverIndex.current = null
    markChanged()
  }
  const addFeature = () => {
    setFeatures([...features, { id: uid(), name: '', description: '' }])
    markChanged()
  }
  const updateFeature = (id: string, field: keyof Feature, value: string) => {
    setFeatures(features.map(f => f.id === id ? { ...f, [field]: value } : f))
    markChanged()
  }
  const removeFeature = (id: string) => {
    setFeatures(features.filter(f => f.id !== id))
    markChanged()
  }

  /* ---- Pricing tier helpers ---- */
  const updatePricing = (id: string, field: keyof PricingTier, value: string | boolean | string[]) => {
    setPricingTiers(pricingTiers.map(t => t.id === id ? { ...t, [field]: value } : t))
    markChanged()
  }

  /* ---- Account connection helpers ---- */
  const toggleConnection = (id: string) => {
    setAccounts(accounts.map(a => {
      if (a.id === id) {
        const next = { ...a, connected: !a.connected }
        if (next.connected) {
          next.connectedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          next.permissions = next.permissions.map(p => ({ ...p, granted: true }))
          toast.success(`Connected ${a.platform} account`, { description: `${a.accountName} is now connected.` })
        } else {
          toast.info(`Disconnected ${a.platform} account`, { description: `${a.accountName} has been disconnected.` })
        }
        return next
      }
      return a
    }))
  }

  /* ---- Tab change ---- */
  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab)
  }

  /* ---- Save success state ---- */
  const [saveSuccess, setSaveSuccess] = useState(false)
  const triggerSave = () => {
    setHasChanges(false)
    setSaveSuccess(true)
    toast.success('Settings saved successfully')
    setTimeout(() => setSaveSuccess(false), 1500)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-[2.25rem] font-bold text-warm-black tracking-[-0.02em] leading-[1.1]">Settings</h1>
        <p className="text-[0.875rem] text-stone mt-1 leading-relaxed">Manage your product, brand, and platform connections.</p>
      </motion.div>

      {/* Settings Layout: sub-nav + panel */}
      <div className="flex gap-6 items-start">
        {/* Left Sub-Navigation */}
        <motion.nav
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="w-[240px] shrink-0 bg-white rounded-xl border border-linen p-2 sticky top-[88px]"
        >
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left relative mb-0.5',
                  isActive
                    ? 'bg-peach/60 text-warm-black'
                    : 'text-stone hover:bg-cream hover:text-warm-black'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-caramel rounded-r-full" />
                )}
                <Icon size={18} className={cn('shrink-0', isActive ? 'text-caramel' : 'text-stone')} />
                <span className={cn('text-sm', isActive ? 'font-semibold' : 'font-medium')}>{item.label}</span>
              </button>
            )
          })}
        </motion.nav>

        {/* Right Panel */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'product' && (
              <ProductInfoPanel
                key="product"
                productName={productName} setProductName={setProductName}
                productTagline={productTagline} setProductTagline={setProductTagline}
                productDescription={productDescription} setProductDescription={setProductDescription}
                features={features}
                dragIndex={dragIndex}
                handleFeatureDragStart={handleFeatureDragStart}
                handleFeatureDragOver={handleFeatureDragOver}
                handleFeatureDrop={handleFeatureDrop}
                updateFeature={updateFeature}
                removeFeature={removeFeature}
                addFeature={addFeature}
                pricingTiers={pricingTiers}
                updatePricing={updatePricing}
                audienceTags={audienceTags} setAudienceTags={setAudienceTags}
                tagInput={tagInput} setTagInput={setTagInput}
                competitorTags={competitorTags} setCompetitorTags={setCompetitorTags}
                competitorInput={competitorInput} setCompetitorInput={setCompetitorInput}
                uvp={uvp} setUvp={setUvp}
                markChanged={markChanged}
                saveSuccess={saveSuccess}
                triggerSave={triggerSave}
                hasChanges={hasChanges}
              />
            )}
            {activeTab === 'brand' && (
              <BrandSettingsPanel
                key="brand"
                primaryColor={primaryColor} setPrimaryColor={setPrimaryColor}
                secondaryColor={secondaryColor} setSecondaryColor={setSecondaryColor}
                accentColor={accentColor} setAccentColor={setAccentColor}
                headingFont={headingFont} setHeadingFont={setHeadingFont}
                bodyFont={bodyFont} setBodyFont={setBodyFont}
                brandVoice={brandVoice} setBrandVoice={setBrandVoice}
                forbiddenWords={forbiddenWords} setForbiddenWords={setForbiddenWords}
                forbiddenInput={forbiddenInput} setForbiddenInput={setForbiddenInput}
                markChanged={markChanged}
                saveSuccess={saveSuccess}
                triggerSave={triggerSave}
                hasChanges={hasChanges}
              />
            )}
            {activeTab === 'platforms' && (
              <PlatformConnect key="platforms" />
            )}
            {activeTab === 'ai' && (
              <AIPreferencesPanel
                key="ai"
                adObjective={adObjective} setAdObjective={setAdObjective}
                creativityLevel={creativityLevel} setCreativityLevel={setCreativityLevel}
                defaultPlatforms={defaultPlatforms} setDefaultPlatforms={setDefaultPlatforms}
                hashtagCount={hashtagCount} setHashtagCount={setHashtagCount}
                alwaysInclude={alwaysInclude} setAlwaysInclude={setAlwaysInclude}
                avoidText={avoidText} setAvoidText={setAvoidText}
                useEmojis={useEmojis} setUseEmojis={setUseEmojis}
                ctaPreference={ctaPreference} setCtaPreference={setCtaPreference}
                language={language} setLanguage={setLanguage}
                copyLength={copyLength} setCopyLength={setCopyLength}
                markChanged={markChanged}
                saveSuccess={saveSuccess}
                triggerSave={triggerSave}
                hasChanges={hasChanges}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  PRODUCT INFO PANEL                                                  */
/* ================================================================== */

interface ProductInfoProps {
  productName: string; setProductName: (v: string) => void
  productTagline: string; setProductTagline: (v: string) => void
  productDescription: string; setProductDescription: (v: string) => void
  features: Feature[]
  dragIndex: number | null
  handleFeatureDragStart: (i: number) => void
  handleFeatureDragOver: (e: React.DragEvent, i: number) => void
  handleFeatureDrop: () => void
  updateFeature: (id: string, f: keyof Feature, v: string) => void
  removeFeature: (id: string) => void
  addFeature: () => void
  pricingTiers: PricingTier[]
  updatePricing: (id: string, f: keyof PricingTier, v: string | boolean | string[]) => void
  audienceTags: string[]; setAudienceTags: (v: string[]) => void
  tagInput: string; setTagInput: (v: string) => void
  competitorTags: string[]; setCompetitorTags: (v: string[]) => void
  competitorInput: string; setCompetitorInput: (v: string) => void
  uvp: string; setUvp: (v: string) => void
  markChanged: () => void
  saveSuccess: boolean
  triggerSave: () => void
  hasChanges: boolean
}

function ProductInfoPanel({
  productName, setProductName, productTagline, setProductTagline,
  productDescription, setProductDescription, features, dragIndex,
  handleFeatureDragStart, handleFeatureDragOver, handleFeatureDrop,
  updateFeature, removeFeature, addFeature, pricingTiers, updatePricing,
  audienceTags, setAudienceTags, tagInput, setTagInput,
  competitorTags, setCompetitorTags, competitorInput, setCompetitorInput,
  uvp, setUvp, markChanged, saveSuccess, triggerSave, hasChanges,
}: ProductInfoProps) {

  const addTag = (val: string, list: string[], setList: (v: string[]) => void, setInput: (v: string) => void) => {
    const t = val.trim()
    if (t && !list.includes(t)) { setList([...list, t]); setInput(''); markChanged() }
  }
  const removeTag = (tag: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.filter(t => t !== tag)); markChanged()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl border border-linen p-6 space-y-8"
    >
      {/* Product Name */}
      <div>
        <label className="block text-[0.9375rem] font-semibold text-warm-black mb-2">Product Name</label>
        <input
          type="text"
          value={productName}
          onChange={(e) => { setProductName(e.target.value); markChanged() }}
          className="w-full h-10 px-3 rounded-lg border border-sand text-sm text-warm-black placeholder:text-stone/60 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel/30 transition-all"
        />
        <p className="text-xs text-stone mt-1.5">The name used in all generated ad copy.</p>
      </div>

      {/* Product Tagline */}
      <div>
        <label className="block text-[0.9375rem] font-semibold text-warm-black mb-2">Product Tagline</label>
        <input
          type="text"
          value={productTagline}
          onChange={(e) => { setProductTagline(e.target.value); markChanged() }}
          className="w-full h-10 px-3 rounded-lg border border-sand text-sm text-warm-black placeholder:text-stone/60 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel/30 transition-all"
        />
        <p className="text-xs text-stone mt-1.5">A short tagline for headlines and hero copy.</p>
      </div>

      {/* Product Description */}
      <div>
        <label className="block text-[0.9375rem] font-semibold text-warm-black mb-2">Product Description</label>
        <textarea
          rows={4}
          maxLength={500}
          value={productDescription}
          onChange={(e) => { setProductDescription(e.target.value); markChanged() }}
          className="w-full px-3 py-2.5 rounded-lg border border-sand text-sm text-warm-black placeholder:text-stone/60 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel/30 transition-all resize-none"
        />
        <div className="flex justify-between mt-1.5">
          <p className="text-xs text-stone">Detailed description used for AI context.</p>
          <span className="text-xs text-stone">{productDescription.length}/500</span>
        </div>
      </div>

      {/* Key Features */}
      <div>
        <label className="block text-[0.9375rem] font-semibold text-warm-black mb-1">Key Features</label>
        <p className="text-xs text-stone mb-3">These features are highlighted in ad copy. Reorder by dragging.</p>

        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {features.map((f, i) => (
              <motion.div
                key={f.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                draggable
                onDragStart={() => handleFeatureDragStart(i)}
                onDragOver={(e) => handleFeatureDragOver(e, i)}
                onDrop={handleFeatureDrop}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg border bg-cream/40 transition-all',
                  dragIndex === i ? 'border-caramel shadow-md scale-[1.02]' : 'border-linen'
                )}
              >
                <button className="p-1 rounded text-stone hover:text-warm-black cursor-grab active:cursor-grabbing shrink-0">
                  <GripVertical size={16} />
                </button>
                <input
                  type="text"
                  value={f.name}
                  onChange={(e) => updateFeature(f.id, 'name', e.target.value)}
                  placeholder="Feature name"
                  className="flex-1 min-w-0 h-8 px-2.5 rounded-md border border-sand text-sm text-warm-black placeholder:text-stone/60 focus:outline-none focus:border-caramel transition-all bg-white"
                />
                <input
                  type="text"
                  value={f.description}
                  onChange={(e) => updateFeature(f.id, 'description', e.target.value)}
                  placeholder="Short description"
                  className="flex-[1.5] min-w-0 h-8 px-2.5 rounded-md border border-sand text-sm text-warm-black placeholder:text-stone/60 focus:outline-none focus:border-caramel transition-all bg-white"
                />
                <button
                  onClick={() => removeFeature(f.id)}
                  className="p-1.5 rounded-md text-stone hover:text-danger hover:bg-danger-light transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <button
          onClick={addFeature}
          className="mt-3 flex items-center gap-1.5 text-sm font-medium text-caramel hover:text-caramel/80 transition-colors"
        >
          <Plus size={16} /> Add Feature
        </button>
      </div>

      {/* Pricing Tiers */}
      <div>
        <label className="block text-[0.9375rem] font-semibold text-warm-black mb-1">Pricing Information</label>
        <p className="text-xs text-stone mb-4">Used in conversion-focused ads.</p>

        <div className="grid grid-cols-3 gap-4">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                'rounded-xl border p-4 transition-all',
                tier.highlighted
                  ? 'border-caramel bg-caramel/[0.04] ring-1 ring-caramel/20'
                  : 'border-linen bg-white'
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  value={tier.name}
                  onChange={(e) => updatePricing(tier.id, 'name', e.target.value)}
                  className="flex-1 min-w-0 h-8 px-2.5 rounded-md border border-sand text-sm font-semibold text-warm-black focus:outline-none focus:border-caramel transition-all bg-white"
                />
                {tier.highlighted && (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-caramel text-white text-[10px] font-semibold">POPULAR</span>
                )}
              </div>
              <input
                type="text"
                value={tier.price}
                onChange={(e) => updatePricing(tier.id, 'price', e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-sand text-sm text-warm-black focus:outline-none focus:border-caramel transition-all bg-white mb-3"
              />
              <div className="space-y-1.5">
                {tier.features.map((feat, fi) => (
                  <div key={fi} className="flex items-center gap-1.5 text-xs text-warm-black">
                    <Check size={12} className="text-success shrink-0" />
                    <input
                      type="text"
                      value={feat}
                      onChange={(e) => {
                        const next = [...tier.features]; next[fi] = e.target.value
                        updatePricing(tier.id, 'features', next)
                      }}
                      className="flex-1 min-w-0 bg-transparent border-b border-transparent focus:border-sand focus:outline-none transition-all"
                    />
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 mt-3 text-xs text-stone cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={tier.highlighted}
                  onChange={(e) => updatePricing(tier.id, 'highlighted', e.target.checked)}
                  className="rounded border-sand text-caramel focus:ring-caramel"
                />
                Highlight this tier
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Target Audience */}
      <div>
        <label className="block text-[0.9375rem] font-semibold text-warm-black mb-2">Target Audience Segments</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {audienceTags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-peach/60 text-warm-black text-xs font-medium">
              {tag}
              <button onClick={() => removeTag(tag, audienceTags, setAudienceTags)} className="hover:text-danger transition-colors">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput, audienceTags, setAudienceTags, setTagInput) } }}
          placeholder="Type and press Enter to add..."
          className="w-full h-10 px-3 rounded-lg border border-sand text-sm text-warm-black placeholder:text-stone/60 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel/30 transition-all"
        />
      </div>

      {/* Competitors */}
      <div>
        <label className="block text-[0.9375rem] font-semibold text-warm-black mb-1">Key Competitors</label>
        <p className="text-xs text-stone mb-2">Mentioned in comparison-style ads.</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {competitorTags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-info-light text-warm-black text-xs font-medium">
              {tag}
              <button onClick={() => removeTag(tag, competitorTags, setCompetitorTags)} className="hover:text-danger transition-colors">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={competitorInput}
          onChange={(e) => setCompetitorInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(competitorInput, competitorTags, setCompetitorTags, setCompetitorInput) } }}
          placeholder="Add competitor..."
          className="w-full h-10 px-3 rounded-lg border border-sand text-sm text-warm-black placeholder:text-stone/60 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel/30 transition-all"
        />
      </div>

      {/* UVP */}
      <div>
        <label className="block text-[0.9375rem] font-semibold text-warm-black mb-2">Unique Value Proposition</label>
        <textarea
          rows={2}
          value={uvp}
          onChange={(e) => { setUvp(e.target.value); markChanged() }}
          className="w-full px-3 py-2.5 rounded-lg border border-sand text-sm text-warm-black placeholder:text-stone/60 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel/30 transition-all resize-none"
        />
      </div>

      {/* Save */}
      <div className="flex justify-end pt-4 border-t border-linen">
        <button
          onClick={triggerSave}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98]',
            saveSuccess
              ? 'bg-success text-white'
              : 'bg-caramel text-white hover:bg-caramel/90 shadow-sm'
          )}
        >
          {saveSuccess ? <Check size={16} /> : hasChanges && <span className="w-2 h-2 rounded-full bg-white" />}
          {saveSuccess ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </motion.div>
  )
}

/* ================================================================== */
/*  BRAND SETTINGS PANEL                                               */
/* ================================================================== */

interface BrandSettingsProps {
  primaryColor: string; setPrimaryColor: (v: string) => void
  secondaryColor: string; setSecondaryColor: (v: string) => void
  accentColor: string; setAccentColor: (v: string) => void
  headingFont: string; setHeadingFont: (v: string) => void
  bodyFont: string; setBodyFont: (v: string) => void
  brandVoice: BrandVoice; setBrandVoice: (v: BrandVoice) => void
  forbiddenWords: string[]; setForbiddenWords: (v: string[]) => void
  forbiddenInput: string; setForbiddenInput: (v: string) => void
  markChanged: () => void
  saveSuccess: boolean
  triggerSave: () => void
  hasChanges: boolean
}

const headingFonts = ['Inter', 'Montserrat', 'Poppins', 'Playfair Display', 'Oswald']
const bodyFonts = ['Inter', 'Open Sans', 'Roboto', 'Lato', 'Source Sans Pro']

function BrandSettingsPanel({
  primaryColor, setPrimaryColor, secondaryColor, setSecondaryColor,
  accentColor, setAccentColor, headingFont, setHeadingFont, bodyFont, setBodyFont,
  brandVoice, setBrandVoice, forbiddenWords, setForbiddenWords,
  forbiddenInput, setForbiddenInput, markChanged, saveSuccess, triggerSave, hasChanges,
}: BrandSettingsProps) {

  const voiceLabels: { key: keyof BrandVoice; left: string; right: string }[] = [
    { key: 'professionalCasual', left: 'Professional', right: 'Casual' },
    { key: 'formalFriendly', left: 'Formal', right: 'Friendly' },
    { key: 'technicalSimple', left: 'Technical', right: 'Simple' },
    { key: 'seriousPlayful', left: 'Serious', right: 'Playful' },
  ]

  const addForbidden = (val: string) => {
    const w = val.trim().toLowerCase()
    if (w && !forbiddenWords.includes(w)) { setForbiddenWords([...forbiddenWords, w]); setForbiddenInput(''); markChanged() }
  }
  const removeForbidden = (w: string) => { setForbiddenWords(forbiddenWords.filter(x => x !== w)); markChanged() }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl border border-linen p-6 space-y-8"
    >
      <div className="grid grid-cols-2 gap-8">
        {/* Left: Logo + Colors */}
        <div className="space-y-8">
          {/* Brand Logo */}
          <div>
            <label className="block text-[0.9375rem] font-semibold text-warm-black mb-3">Brand Logo</label>
            <div className="flex items-start gap-4">
              <div className="w-[120px] h-[120px] rounded-xl bg-cream border-2 border-dashed border-sand flex items-center justify-center shrink-0 overflow-hidden">
                <img src="/nhyqr-logo.svg" alt="NHY-QR Logo" className="w-20 h-20 object-contain" />
              </div>
              <div className="space-y-2">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-caramel text-white text-sm font-medium hover:bg-caramel/90 transition-colors">
                  <Upload size={14} /> Upload New
                </button>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-stone hover:bg-cream transition-colors">
                  <Trash2 size={14} /> Remove
                </button>
                <p className="text-xs text-stone leading-relaxed">Recommended: 400x400px, PNG or SVG, transparent background</p>
              </div>
            </div>
          </div>

          {/* Brand Colors */}
          <div>
            <label className="block text-[0.9375rem] font-semibold text-warm-black mb-3">Brand Colors</label>
            <div className="space-y-4">
              <ColorPickerRow label="Primary" color={primaryColor} onChange={(c) => { setPrimaryColor(c); markChanged() }} />
              <ColorPickerRow label="Secondary" color={secondaryColor} onChange={(c) => { setSecondaryColor(c); markChanged() }} />
              <ColorPickerRow label="Accent" color={accentColor} onChange={(c) => { setAccentColor(c); markChanged() }} />
            </div>
          </div>

          {/* Color Preview */}
          <div>
            <label className="block text-xs font-medium text-stone mb-2">Preview</label>
            <div className="rounded-lg border border-linen p-3 space-y-2">
              <div className="h-8 rounded-md text-white text-xs font-medium flex items-center px-3" style={{ backgroundColor: primaryColor }}>
                Primary CTA Button
              </div>
              <div className="h-8 rounded-md text-white text-xs font-medium flex items-center px-3" style={{ backgroundColor: secondaryColor }}>
                Secondary Element
              </div>
              <div className="h-8 rounded-md text-white text-xs font-medium flex items-center px-3" style={{ backgroundColor: accentColor }}>
                Accent / Link
              </div>
            </div>
          </div>
        </div>

        {/* Right: Typography + Voice */}
        <div className="space-y-8">
          {/* Typography */}
          <div>
            <label className="block text-[0.9375rem] font-semibold text-warm-black mb-3">Preferred Fonts</label>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-stone mb-1.5">Heading Font</label>
                <Select value={headingFont} onValueChange={(v) => { setHeadingFont(v); markChanged() }}>
                  <SelectTrigger className="w-full h-10 border-sand text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {headingFonts.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="mt-2 text-[1.375rem] font-semibold text-warm-black" style={{ fontFamily: headingFont }}>
                  NHY-QR Digital Menu
                </p>
              </div>
              <div>
                <label className="block text-xs text-stone mb-1.5">Body Font</label>
                <Select value={bodyFont} onValueChange={(v) => { setBodyFont(v); markChanged() }}>
                  <SelectTrigger className="w-full h-10 border-sand text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bodyFonts.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="mt-2 text-sm text-warm-black leading-relaxed" style={{ fontFamily: bodyFont }}>
                  Create beautiful QR menus that your customers will love. Update items in real-time.
                </p>
              </div>
            </div>
          </div>

          {/* Brand Voice */}
          <div>
            <label className="block text-[0.9375rem] font-semibold text-warm-black mb-3">Brand Voice</label>
            <div className="space-y-5">
              {voiceLabels.map(({ key, left, right }) => (
                <div key={key}>
                  <div className="flex justify-between text-xs text-stone mb-1.5">
                    <span>{left}</span>
                    <span>{right}</span>
                  </div>
                  <Slider
                    value={[brandVoice[key]]}
                    onValueChange={([v]) => { setBrandVoice({ ...brandVoice, [key]: v }); markChanged() }}
                    min={0} max={100} step={1}
                    className="cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tone Preview */}
          <div>
            <label className="block text-xs font-medium text-stone mb-2">Example Ad Copy</label>
            <div className="rounded-lg border border-linen bg-cream/40 p-4">
              <p className="text-sm text-warm-black leading-relaxed">
                Transform your restaurant menu in minutes with NHY-QR — the easiest digital menu app for busy hospitality professionals.
              </p>
            </div>
          </div>

          {/* Forbidden Words */}
          <div>
            <label className="block text-[0.9375rem] font-semibold text-warm-black mb-1">Words to Avoid</label>
            <p className="text-xs text-stone mb-2">The AI will avoid these words in generated copy.</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {forbiddenWords.map((w) => (
                <span key={w} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-danger-light text-danger text-xs font-medium">
                  {w}
                  <button onClick={() => removeForbidden(w)} className="hover:text-danger/70 transition-colors">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={forbiddenInput}
              onChange={(e) => setForbiddenInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addForbidden(forbiddenInput) } }}
              placeholder="Add a word to avoid..."
              className="w-full h-10 px-3 rounded-lg border border-sand text-sm text-warm-black placeholder:text-stone/60 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel/30 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end pt-4 border-t border-linen">
        <button
          onClick={triggerSave}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98]',
            saveSuccess ? 'bg-success text-white' : 'bg-caramel text-white hover:bg-caramel/90 shadow-sm'
          )}
        >
          {saveSuccess ? <Check size={16} /> : hasChanges && <span className="w-2 h-2 rounded-full bg-white" />}
          {saveSuccess ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </motion.div>
  )
}

/* ---- Color Picker Row ---- */
function ColorPickerRow({ label, color, onChange }: { label: string; color: string; onChange: (c: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => inputRef.current?.click()}
        className="w-12 h-12 rounded-full border-2 border-linen shrink-0 transition-transform hover:scale-105"
        style={{ backgroundColor: color }}
      />
      <input
        ref={inputRef}
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
      <div className="flex-1 min-w-0">
        <label className="block text-xs text-stone">{label}</label>
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-8 px-2.5 rounded-md border border-sand text-sm font-mono text-warm-black focus:outline-none focus:border-caramel transition-all uppercase"
        />
      </div>
    </div>
  )
}

/* ================================================================== */
/*  PLATFORM ACCOUNTS PANEL                                            */
/* ================================================================== */

interface PlatformAccountsProps {
  accounts: PlatformAccount[]
  toggleConnection: (id: string) => void
}

function PlatformAccountsPanel({ accounts, toggleConnection }: PlatformAccountsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {accounts.map((account, i) => {
        const colors = platformColor(account.platform)
        const Icon = platformIcon(account.platform)
        return (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="bg-white rounded-xl border border-linen p-5"
          >
            <div className="flex items-center gap-4">
              {/* Platform Icon */}
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center shrink-0', colors.light)}>
                <Icon size={24} className={colors.text} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[1.125rem] font-semibold text-warm-black capitalize">{account.platform}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={cn('text-sm', account.connected ? 'text-success' : 'text-stone')}>
                    {account.connected ? account.accountName : 'Not connected'}
                  </span>
                </div>
                <p className="text-xs text-stone mt-0.5">
                  {account.connected
                    ? `${account.accountType} · Connected on ${account.connectedDate}`
                    : `${account.accountType} · Click Connect to link your account`
                  }
                </p>
                {account.connected && account.followers && (
                  <p className="text-xs text-stone mt-0.5">{account.followers} followers</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {account.connected ? (
                  <>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success-light text-success text-xs font-medium">
                      <Check size={12} /> Connected
                    </span>
                    <button
                      onClick={() => toggleConnection(account.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone hover:text-danger hover:bg-danger-light transition-colors"
                    >
                      Disconnect
                    </button>
                    <button className="p-2 rounded-lg text-stone hover:bg-cream transition-colors" title="Refresh token">
                      <RefreshCw size={14} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => toggleConnection(account.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-caramel text-white text-sm font-medium hover:bg-caramel/90 transition-colors"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>

            {/* Permissions (expandable) */}
            {account.connected && (
              <div className="mt-4 pt-4 border-t border-linen">
                <p className="text-xs font-medium text-stone uppercase tracking-wider mb-2">Permissions</p>
                <div className="flex flex-wrap gap-2">
                  {account.permissions.map((perm) => (
                    <span
                      key={perm.name}
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium',
                        perm.granted ? 'bg-success-light text-success' : 'bg-sand/40 text-stone'
                      )}
                    >
                      {perm.granted ? <Check size={10} /> : <AlertCircle size={10} />}
                      {perm.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )
      })}

      {/* Add Account */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="w-full flex items-center justify-center gap-2 py-5 rounded-xl border-2 border-dashed border-sand text-stone hover:text-caramel hover:border-caramel hover:bg-cream/50 transition-all"
      >
        <Plus size={18} />
        <span className="text-sm font-medium">Connect Another Account</span>
      </motion.button>
    </motion.div>
  )
}

/* ================================================================== */
/*  AI PREFERENCES PANEL                                               */
/* ================================================================== */

interface AIPreferencesProps {
  adObjective: string; setAdObjective: (v: string) => void
  creativityLevel: number[]; setCreativityLevel: (v: number[]) => void
  defaultPlatforms: { instagram: boolean; facebook: boolean; youtube: boolean }
  setDefaultPlatforms: (v: { instagram: boolean; facebook: boolean; youtube: boolean }) => void
  hashtagCount: number[]; setHashtagCount: (v: number[]) => void
  alwaysInclude: string; setAlwaysInclude: (v: string) => void
  avoidText: string; setAvoidText: (v: string) => void
  useEmojis: boolean; setUseEmojis: (v: boolean) => void
  ctaPreference: string; setCtaPreference: (v: string) => void
  language: string; setLanguage: (v: string) => void
  copyLength: string; setCopyLength: (v: string) => void
  markChanged: () => void
  saveSuccess: boolean
  triggerSave: () => void
  hasChanges: boolean
}

function AIPreferencesPanel({
  adObjective, setAdObjective, creativityLevel, setCreativityLevel,
  defaultPlatforms, setDefaultPlatforms, hashtagCount, setHashtagCount,
  alwaysInclude, setAlwaysInclude, avoidText, setAvoidText,
  useEmojis, setUseEmojis, ctaPreference, setCtaPreference,
  language, setLanguage, copyLength, setCopyLength,
  markChanged, saveSuccess, triggerSave, hasChanges,
}: AIPreferencesProps) {

  const objectives = [
    { id: 'awareness', label: 'Awareness', desc: 'Reach the most people' },
    { id: 'engagement', label: 'Engagement', desc: 'Drive interactions' },
    { id: 'conversions', label: 'Conversions', desc: 'Get sign-ups & sales' },
  ]

  const ctaOptions = ['Get Started Free', 'Learn More', 'Sign Up', 'Book a Demo', 'Download Now', 'Start Free Trial']
  const languages = [
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl border border-linen p-6 space-y-8"
    >
      {/* Default Generation Settings */}
      <div>
        <h3 className="text-[1.125rem] font-semibold text-warm-black mb-4">Default Generation Settings</h3>

        {/* Campaign Objective */}
        <div className="mb-6">
          <label className="block text-[0.9375rem] font-semibold text-warm-black mb-3">Default Campaign Objective</label>
          <div className="grid grid-cols-3 gap-3">
            {objectives.map((obj) => (
              <button
                key={obj.id}
                onClick={() => { setAdObjective(obj.id); markChanged() }}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-200 text-center',
                  adObjective === obj.id
                    ? 'border-caramel bg-caramel/[0.06]'
                    : 'border-linen hover:border-sand bg-white'
                )}
              >
                <Star size={18} className={adObjective === obj.id ? 'text-caramel' : 'text-stone'} />
                <span className={cn('text-sm font-semibold', adObjective === obj.id ? 'text-caramel' : 'text-warm-black')}>{obj.label}</span>
                <span className="text-xs text-stone">{obj.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Default Platforms */}
        <div className="mb-6">
          <label className="block text-[0.9375rem] font-semibold text-warm-black mb-3">Default Platforms</label>
          <div className="flex gap-4">
            {([
              { key: 'instagram' as const, label: 'Instagram', color: 'text-[#E4405F]' },
              { key: 'facebook' as const, label: 'Facebook', color: 'text-[#1877F2]' },
              { key: 'youtube' as const, label: 'YouTube', color: 'text-[#FF0000]' },
            ]).map((p) => (
              <label key={p.key} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={defaultPlatforms[p.key]}
                  onChange={(e) => { setDefaultPlatforms({ ...defaultPlatforms, [p.key]: e.target.checked }); markChanged() }}
                  className="rounded border-sand text-caramel focus:ring-caramel w-4 h-4"
                />
                <span className={cn('text-sm font-medium', p.color)}>{p.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Copy Length */}
        <div className="mb-6">
          <label className="block text-[0.9375rem] font-semibold text-warm-black mb-3">Default Copy Length</label>
          <div className="flex gap-3">
            {([
              { id: 'short', label: 'Short', desc: '1-2 sentences' },
              { id: 'medium', label: 'Medium', desc: '3-5 sentences' },
              { id: 'long', label: 'Long', desc: 'Full paragraph' },
            ]).map((opt) => (
              <button
                key={opt.id}
                onClick={() => { setCopyLength(opt.id); markChanged() }}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all',
                  copyLength === opt.id ? 'border-caramel bg-caramel/[0.06]' : 'border-linen hover:border-sand'
                )}
              >
                <span className={cn('text-sm font-medium', copyLength === opt.id ? 'text-caramel' : 'text-warm-black')}>{opt.label}</span>
                <span className="text-xs text-stone">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-linen" />

      {/* Generation Quality */}
      <div>
        <h3 className="text-[1.125rem] font-semibold text-warm-black mb-4">Generation Quality</h3>

        {/* Creativity */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[0.9375rem] font-semibold text-warm-black">AI Creativity</label>
            <span className="text-xs text-stone font-mono">{creativityLevel[0]}%</span>
          </div>
          <Slider
            value={creativityLevel}
            onValueChange={(v) => { setCreativityLevel(v); markChanged() }}
            min={0} max={100} step={1}
            className="cursor-pointer"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-stone">Conservative</span>
            <span className="text-xs text-stone">Creative</span>
          </div>
        </div>

        {/* Hashtag Count */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[0.9375rem] font-semibold text-warm-black">Hashtags per Post</label>
            <span className="text-xs text-stone font-mono">{hashtagCount[0]}</span>
          </div>
          <Slider
            value={hashtagCount}
            onValueChange={(v) => { setHashtagCount(v); markChanged() }}
            min={3} max={15} step={1}
            className="cursor-pointer"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-stone">3</span>
            <span className="text-xs text-stone">15</span>
          </div>
        </div>
      </div>

      <div className="border-t border-linen" />

      {/* Content Rules */}
      <div>
        <h3 className="text-[1.125rem] font-semibold text-warm-black mb-4">Content Rules</h3>

        {/* Always Include */}
        <div className="mb-5">
          <label className="block text-[0.9375rem] font-semibold text-warm-black mb-2">Always Include</label>
          <textarea
            rows={2}
            value={alwaysInclude}
            onChange={(e) => { setAlwaysInclude(e.target.value); markChanged() }}
            className="w-full px-3 py-2.5 rounded-lg border border-sand text-sm text-warm-black placeholder:text-stone/60 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel/30 transition-all resize-none"
          />
          <p className="text-xs text-stone mt-1.5">This text appears in every generated ad.</p>
        </div>

        {/* Avoid */}
        <div className="mb-5">
          <label className="block text-[0.9375rem] font-semibold text-warm-black mb-2">Always Avoid</label>
          <textarea
            rows={2}
            value={avoidText}
            onChange={(e) => { setAvoidText(e.target.value); markChanged() }}
            placeholder="e.g. jargon, overly technical terms, negative language..."
            className="w-full px-3 py-2.5 rounded-lg border border-sand text-sm text-warm-black placeholder:text-stone/60 focus:outline-none focus:border-caramel focus:ring-1 focus:ring-caramel/30 transition-all resize-none"
          />
        </div>

        {/* Emojis Toggle */}
        <div className="mb-5">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-[0.9375rem] font-semibold text-warm-black">Use Emojis in Copy</label>
              <p className="text-xs text-stone mt-0.5">Add expressive emoji to generated copy.</p>
            </div>
            <Switch checked={useEmojis} onCheckedChange={(v) => { setUseEmojis(v); markChanged() }} />
          </div>
        </div>

        {/* CTA Preference */}
        <div className="mb-5">
          <label className="block text-[0.9375rem] font-semibold text-warm-black mb-2">Preferred CTA</label>
          <Select value={ctaPreference} onValueChange={(v) => { setCtaPreference(v); markChanged() }}>
            <SelectTrigger className="w-full h-10 border-sand text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ctaOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div>
          <label className="block text-[0.9375rem] font-semibold text-warm-black mb-2">Primary Language</label>
          <Select value={language} onValueChange={(v) => { setLanguage(v); markChanged() }}>
            <SelectTrigger className="w-full h-10 border-sand text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end pt-4 border-t border-linen">
        <button
          onClick={triggerSave}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98]',
            saveSuccess ? 'bg-success text-white' : 'bg-caramel text-white hover:bg-caramel/90 shadow-sm'
          )}
        >
          {saveSuccess ? <Check size={16} /> : hasChanges && <span className="w-2 h-2 rounded-full bg-white" />}
          {saveSuccess ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </motion.div>
  )
}
