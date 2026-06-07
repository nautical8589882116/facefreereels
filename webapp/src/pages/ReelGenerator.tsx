import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Mic,
  Palette,
  Play,
  Check,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  Circle,
  Volume2,
  Pause,
  Film,
  Images,
  Square,
  Bold,
  Type,
  AlignVerticalSpaceAround,
  Download,
  CalendarDays,
  RotateCcw,
  
  Clock,
  Tag,
  
  TypeOutline,
  MousePointerClick,
  MousePointer2,
  Frame,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────
interface Voice {
  id: string
  name: string
  style: string
  gender: string
  accent: string
  bestFor: string
  gradient: string
}

interface ScriptTemplate {
  id: string
  title: string
  description: string
  objective: string
}

interface RecentReel {
  id: string
  title: string
  thumbnail: string
  duration: string
  date: string
}

interface GradientOption {
  id: string
  name: string
  gradient: string
}

// ─── Data Constants ───────────────────────────────────
const WORKFLOW_STEPS = [
  { id: 1, label: 'Write Script', icon: FileText },
  { id: 2, label: 'Choose Voice', icon: Mic },
  { id: 3, label: 'Pick Style', icon: Palette },
  { id: 4, label: 'Generate', icon: Play },
] as const

const VOICES: Voice[] = [
  { id: 'ava', name: 'Ava', style: 'Warm & Friendly', gender: 'Female', accent: 'US', bestFor: 'Cafe promos, emotional stories', gradient: 'from-rose-400 to-orange-300' },
  { id: 'james', name: 'James', style: 'Professional', gender: 'Male', accent: 'US', bestFor: 'Hotel showcases, B2B content', gradient: 'from-slate-500 to-slate-700' },
  { id: 'sofia', name: 'Sofia', style: 'Warm & Friendly', gender: 'Female', accent: 'UK', bestFor: 'Restaurant features, testimonials', gradient: 'from-amber-400 to-yellow-300' },
  { id: 'marcus', name: 'Marcus', style: 'Energetic', gender: 'Male', accent: 'US', bestFor: 'Product launches, promotions', gradient: 'from-red-500 to-orange-500' },
  { id: 'luna', name: 'Luna', style: 'Calm', gender: 'Female', accent: 'US', bestFor: 'Tutorial content, how-to guides', gradient: 'from-teal-400 to-cyan-300' },
  { id: 'david', name: 'David', style: 'Professional', gender: 'Male', accent: 'UK', bestFor: 'Corporate, hotel content', gradient: 'from-blue-500 to-indigo-600' },
  { id: 'maya', name: 'Maya', style: 'Upbeat', gender: 'Female', accent: 'US', bestFor: 'Engagement posts, fun content', gradient: 'from-pink-400 to-rose-300' },
  { id: 'ryan', name: 'Ryan', style: 'Energetic', gender: 'Male', accent: 'Australian', bestFor: 'Bold promos, awareness', gradient: 'from-green-400 to-emerald-600' },
  { id: 'elena', name: 'Elena', style: 'Calm', gender: 'Female', accent: 'Soft US', bestFor: 'Relaxing, wellness-themed', gradient: 'from-violet-400 to-purple-300' },
  { id: 'omar', name: 'Omar', style: 'Professional', gender: 'Male', accent: 'US', bestFor: 'Premium, luxury positioning', gradient: 'from-amber-600 to-yellow-500' },
  { id: 'chloe', name: 'Chloe', style: 'Upbeat', gender: 'Female', accent: 'UK', bestFor: 'Casual, friendly cafe content', gradient: 'from-fuchsia-400 to-pink-400' },
  { id: 'leo', name: 'Leo', style: 'Warm & Friendly', gender: 'Male', accent: 'US', bestFor: 'Storytelling, customer journeys', gradient: 'from-orange-400 to-amber-300' },
]

const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  { id: 'pas', title: 'Problem-Agitate-Solve', description: 'Highlight a pain point → Amplify the frustration → Present NHY-QR as the solution. Best for conversions.', objective: 'Conversion' },
  { id: 'howto', title: 'How-To / Tutorial', description: 'Walk through the setup process step by step. Show how easy NHY-QR is to use. Best for awareness.', objective: 'Awareness' },
  { id: 'testimonial', title: 'Social Proof / Testimonial', description: "Share a customer's success story. Use quotes and results. Best for engagement.", objective: 'Engagement' },
  { id: 'beforeafter', title: 'Before & After', description: 'Show the old way vs. the NHY-QR way. Visual contrast drives interest. Best for awareness.', objective: 'Awareness' },
]

const AI_SUGGESTIONS = [
  { id: 1, title: 'The 30-Second Menu Makeover', objective: 'Awareness', preview: 'Tired of printing menus every time you change a dish? With NHY-QR, update your digital menu in seconds...', duration: '~45s' },
  { id: 2, title: 'What Your Customers Really Want', objective: 'Engagement', preview: '73% of diners prefer scanning a QR code to handling a physical menu. Here\'s why smart restaurants are switching...', duration: '~40s' },
  { id: 3, title: 'From Paper to Digital in 5 Minutes', objective: 'Conversions', preview: 'Meet Raj. He runs a busy cafe and was spending hours designing menus. Then he discovered NHY-QR. Watch how he transformed his menu in under 5 minutes...', duration: '~50s' },
]

const GRADIENTS: GradientOption[] = [
  { id: 'warm-sunset', name: 'Warm Sunset', gradient: 'linear-gradient(135deg, #FF8C42, #FF6B6B, #FFB997)' },
  { id: 'deep-espresso', name: 'Deep Espresso', gradient: 'linear-gradient(135deg, #2C1810, #C4814B, #F5F0EB)' },
  { id: 'ocean-breeze', name: 'Ocean Breeze', gradient: 'linear-gradient(135deg, #4ECDC4, #A8E6CF, #F7FFF7)' },
  { id: 'golden-hour', name: 'Golden Hour', gradient: 'linear-gradient(135deg, #D4942A, #F5C842, #FFF8E1)' },
  { id: 'modern-minimal', name: 'Modern Minimal', gradient: 'linear-gradient(135deg, #2C2C2C, #8C8C8C, #E8E8E8)' },
  { id: 'fresh-green', name: 'Fresh Green', gradient: 'linear-gradient(135deg, #6B8E23, #98D8C8, #F5F5DC)' },
  { id: 'blush-rose', name: 'Blush Rose', gradient: 'linear-gradient(135deg, #FFB6C1, #DDA0DD, #FFF0F5)' },
  { id: 'midnight', name: 'Midnight', gradient: 'linear-gradient(135deg, #191970, #4169E1, #87CEFA)' },
]

const STOCK_VIDEOS = [
  { id: 'restaurant', name: 'Warm Restaurant', image: '/nhyqr-restaurant-scene.jpg', category: 'Restaurant' },
  { id: 'cafe', name: 'Hipster Cafe', image: '/nhyqr-cafe-scene.jpg', category: 'Cafe' },
  { id: 'hotel', name: 'Upscale Hotel', image: '/nhyqr-hotel-scene.jpg', category: 'Hotel' },
  { id: 'food-prep', name: 'Food Preparation', image: '/nhyqr-restaurant-scene.jpg', category: 'Food' },
  { id: 'coffee-art', name: 'Coffee Art', image: '/nhyqr-cafe-scene.jpg', category: 'Cafe' },
  { id: 'dining', name: 'Dining Experience', image: '/nhyqr-hotel-scene.jpg', category: 'Dining' },
  { id: 'kitchen', name: 'Modern Kitchen', image: '/nhyqr-restaurant-scene.jpg', category: 'Kitchen' },
  { id: 'patio', name: 'Outdoor Patio', image: '/nhyqr-cafe-scene.jpg', category: 'Outdoor' },
  { id: 'qr-scan', name: 'QR Code Scan', image: '/nhyqr-hotel-scene.jpg', category: 'Tech' },
]

const CAPTION_FONTS = ['Inter', 'Montserrat', 'Poppins', 'Roboto', 'Open Sans', 'Bebas Neue', 'Oswald']
const CAPTION_ANIMATIONS = ['Typewriter', 'Fade In', 'Slide Up', 'Bounce In', 'None']

const RECENT_REELS: RecentReel[] = [
  { id: '1', title: 'Summer Menu Promo', thumbnail: '/nhyqr-cafe-scene.jpg', duration: '0:32', date: 'Jun 4, 2025' },
  { id: '2', title: 'QR Menu Tutorial', thumbnail: '/nhyqr-restaurant-scene.jpg', duration: '0:45', date: 'Jun 3, 2025' },
  { id: '3', title: 'Hotel Dining Ad', thumbnail: '/nhyqr-hotel-scene.jpg', duration: '0:38', date: 'Jun 2, 2025' },
  { id: '4', title: 'Cafe Morning Special', thumbnail: '/nhyqr-cafe-scene.jpg', duration: '0:28', date: 'Jun 1, 2025' },
  { id: '5', title: 'Restaurant Week', thumbnail: '/nhyqr-restaurant-scene.jpg', duration: '0:41', date: 'May 30, 2025' },
]

const FONT_MAP: Record<string, string> = {
  'Inter': 'Inter, sans-serif',
  'Montserrat': 'Montserrat, sans-serif',
  'Poppins': 'Poppins, sans-serif',
  'Roboto': 'Roboto, sans-serif',
  'Open Sans': 'Open Sans, sans-serif',
  'Bebas Neue': 'Bebas Neue, sans-serif',
  'Oswald': 'Oswald, sans-serif',
}

// ─── Helper Components ────────────────────────────────

function WaveformVisualizer({ isPlaying }: { isPlaying: boolean }) {
  const bars = Array.from({ length: 40 }, (_, i) => i)
  const [heights, setHeights] = useState<number[]>(() =>
    bars.map(() => Math.random() * 20 + 8)
  )

  useEffect(() => {
    if (!isPlaying) {
      setHeights(bars.map(() => Math.random() * 8 + 4))
      return
    }
    const interval = setInterval(() => {
      setHeights(bars.map(() => Math.random() * 28 + 6))
    }, 120)
    return () => clearInterval(interval)
  }, [isPlaying])

  return (
    <div className="flex items-center gap-[2px] h-10 overflow-hidden">
      {bars.map((i) => (
        <motion.div
          key={i}
          className="w-[3px] bg-caramel rounded-full flex-shrink-0"
          animate={{ height: heights[i] || 8 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

function PhonePreview({
  background,
  captionText,
  captionStyle,
}: {
  background: string
  captionText: string
  captionStyle: CaptionSettings
}) {
  const getBackground = () => {
    if (background.startsWith('linear-gradient')) return background
    return `url(${background})`
  }

  const isGradient = background.startsWith('linear-gradient')

  const fontFamily = FONT_MAP[captionStyle.font] || 'Inter, sans-serif'

  const getPositionClass = () => {
    switch (captionStyle.position) {
      case 'top': return 'top-[15%]'
      case 'center': return 'top-1/2 -translate-y-1/2'
      default: return 'bottom-[15%]'
    }
  }

  return (
    <div className="relative mx-auto" style={{ width: 280, height: 500 }}>
      <div
        className="w-full h-full rounded-[24px] overflow-hidden border-8 border-graphite relative"
        style={{
          background: isGradient ? getBackground() : undefined,
          backgroundImage: isGradient ? undefined : getBackground(),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-graphite rounded-b-xl z-10" />

        {/* Caption Text */}
        <div className={cn('absolute left-4 right-4', getPositionClass())}>
          <p
            className="text-center text-white leading-snug break-words"
            style={{
              fontFamily,
              fontSize: `${Math.min(captionStyle.fontSize * 0.6, 22)}px`,
              fontWeight: captionStyle.bold ? '700' : '400',
              textTransform: captionStyle.uppercase ? 'uppercase' : 'none',
              textShadow: captionStyle.textShadow ? '0 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.4)' : undefined,
              WebkitTextStroke: captionStyle.textOutline ? '1px rgba(0,0,0,0.6)' : undefined,
              backgroundColor: captionStyle.backgroundBox ? 'rgba(0,0,0,0.5)' : undefined,
              padding: captionStyle.backgroundBox ? '8px 12px' : undefined,
              borderRadius: captionStyle.backgroundBox ? '8px' : undefined,
            }}
          >
            {captionText || 'Your captions will appear here'}
          </p>
        </div>
      </div>

      {/* 9:16 Badge */}
      <div className="absolute -bottom-6 right-0 text-caption text-stone bg-white px-2 py-0.5 rounded border border-linen">
        9:16
      </div>
    </div>
  )
}

// ─── Types ────────────────────────────────────────────
interface CaptionSettings {
  font: string
  fontSize: number
  bold: boolean
  uppercase: boolean
  textShadow: boolean
  textOutline: boolean
  backgroundBox: boolean
  wordDuration: number
  highlightWord: boolean
  position: 'top' | 'center' | 'bottom'
  animation: string
  color: string
}

// ─── Main Component ───────────────────────────────────
export default function ReelGenerator() {
  // ── Workflow State ──
  const [currentStep, setCurrentStep] = useState(1)

  // ── Script State ──
  const [script, setScript] = useState('')
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)
  const [typingEffect, setTypingEffect] = useState(false)

  // ── Voice State ──
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null)
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const [voiceCategory, setVoiceCategory] = useState('All')

  // ── Background State ──
  const [selectedBgStyle, setSelectedBgStyle] = useState<'stock' | 'gradient' | 'slideshow' | 'solid'>('stock')
  const [selectedStockVideo, setSelectedStockVideo] = useState('restaurant')
  const [selectedGradient, setSelectedGradient] = useState('warm-sunset')
  const [slideshowTransition, setSlideshowTransition] = useState('Fade')
  const [slideshowSpeed, setSlideshowSpeed] = useState(5)
  const [solidColor, setSolidColor] = useState('#C4814B')
  const [solidPattern, setSolidPattern] = useState('None')

  // ── Caption State ──
  const [captionSettings, setCaptionSettings] = useState<CaptionSettings>({
    font: 'Inter',
    fontSize: 24,
    bold: true,
    uppercase: false,
    textShadow: true,
    textOutline: false,
    backgroundBox: false,
    wordDuration: 0.5,
    highlightWord: true,
    position: 'bottom',
    animation: 'Typewriter',
    color: '#FFFFFF',
  })

  // ── Generation State ──
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStep, setGenerationStep] = useState(0)
  const [showOutput, setShowOutput] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [showSettingsSummary, setShowSettingsSummary] = useState(false)

  // ── Refs ──
  const outputRef = useRef<HTMLDivElement>(null)

  const charCount = script.length
  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0
  const estimatedSeconds = Math.ceil(wordCount * 0.35)

  const filteredVoices = voiceCategory === 'All'
    ? VOICES
    : VOICES.filter((v) => v.style === voiceCategory)

  const selectedVoiceData = VOICES.find((v) => v.id === selectedVoice)

  const getActiveBackground = useCallback(() => {
    switch (selectedBgStyle) {
      case 'stock':
        const sv = STOCK_VIDEOS.find((v) => v.id === selectedStockVideo)
        return sv?.image || '/nhyqr-restaurant-scene.jpg'
      case 'gradient':
        const g = GRADIENTS.find((gr) => gr.id === selectedGradient)
        return g?.gradient || GRADIENTS[0].gradient
      case 'solid':
        return solidColor
      case 'slideshow':
        return '/nhyqr-restaurant-scene.jpg'
      default:
        return '/nhyqr-restaurant-scene.jpg'
    }
  }, [selectedBgStyle, selectedStockVideo, selectedGradient, solidColor])

  // ── Handlers ──
  const handleUseSuggestion = (text: string) => {
    setTypingEffect(true)
    let i = 0
    setScript('')
    const interval = setInterval(() => {
      i++
      setScript(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        setTypingEffect(false)
      }
    }, 15)
  }

  const handlePlayVoice = (voiceId: string) => {
    if (playingVoice === voiceId) {
      setPlayingVoice(null)
    } else {
      setPlayingVoice(voiceId)
      setTimeout(() => setPlayingVoice(null), 3000)
    }
  }

  const handleGenerate = () => {
    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationStep(0)
    setShowOutput(false)

    const steps = [
      { delay: 800, step: 1 },
      { delay: 2500, step: 2 },
      { delay: 4500, step: 3 },
      { delay: 6000, step: 4 },
    ]

    steps.forEach(({ delay, step }) => {
      setTimeout(() => {
        setGenerationStep(step)
        setGenerationProgress(step * 25)
        if (step === 4) {
          setTimeout(() => {
            setIsGenerating(false)
            setShowOutput(true)
            setIsVideoPlaying(true)
            setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
          }, 600)
        }
      }, delay)
    })
  }

  const handleReset = () => {
    setScript('')
    setSelectedVoice(null)
    setSelectedBgStyle('stock')
    setSelectedStockVideo('restaurant')
    setSelectedGradient('warm-sunset')
    setCaptionSettings({
      font: 'Inter',
      fontSize: 24,
      bold: true,
      uppercase: false,
      textShadow: true,
      textOutline: false,
      backgroundBox: false,
      wordDuration: 0.5,
      highlightWord: true,
      position: 'bottom',
      animation: 'Typewriter',
      color: '#FFFFFF',
    })
    setCurrentStep(1)
    setShowOutput(false)
    setIsVideoPlaying(false)
  }

  const updateCaption = (updates: Partial<CaptionSettings>) => {
    setCaptionSettings((prev) => ({ ...prev, ...updates }))
  }

  // ── Step Indicator ──
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-0 mb-10">
      {WORKFLOW_STEPS.map((step, index) => {
        const Icon = step.icon
        const isCompleted = currentStep > step.id
        const isActive = currentStep === step.id
        const isLast = index === WORKFLOW_STEPS.length - 1

        return (
          <div key={step.id} className="flex items-center">
            <motion.div
              className="flex flex-col items-center gap-2 cursor-pointer"
              onClick={() => { if (isCompleted || isActive) setCurrentStep(step.id) }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3, type: 'spring' }}
            >
              <motion.div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300',
                  isCompleted && 'bg-success',
                  isActive && 'bg-caramel',
                  !isCompleted && !isActive && 'bg-cream border-2 border-linen'
                )}
                animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                transition={isActive ? { duration: 2, repeat: Infinity } : {}}
              >
                {isCompleted ? (
                  <Check size={22} className="text-white" />
                ) : (
                  <Icon
                    size={20}
                    className={cn(
                      isActive ? 'text-white' : 'text-stone'
                    )}
                  />
                )}
              </motion.div>
              <span
                className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-caramel' : isCompleted ? 'text-success' : 'text-stone'
                )}
              >
                {step.label}
              </span>
            </motion.div>

            {!isLast && (
              <div className="flex items-center mx-3 mb-6">
                <div className={cn(
                  'w-16 h-[2px] transition-colors duration-300',
                  isCompleted ? 'bg-success' : 'bg-linen'
                )} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  // ── Section 2: Script Input ──
  const ScriptSection = () => (
    <motion.div
      id="step-script"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 lg:grid-cols-5 gap-6"
    >
      {/* Left: Script Editor */}
      <div className="lg:col-span-3 bg-white rounded-card border border-linen p-6">
        <label className="text-h2 text-warm-black block mb-3">Your Script</label>
        <textarea
          value={script}
          onChange={(e) => { if (!typingEffect) setScript(e.target.value) }}
          placeholder="Enter your video script here. Keep it under 150 words for a 30-45 second reel..."
          rows={8}
          className={cn(
            'w-full text-sm text-warm-black placeholder:text-stone/60 border border-sand rounded-lg p-4 resize-none outline-none transition-all duration-200',
            'focus:border-caramel focus:shadow-input-focus',
            typingEffect && 'border-success shadow-[0_0_0_3px_rgba(45,143,90,0.15)]'
          )}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-body-sm text-stone">
            ~{wordCount} words (est. {estimatedSeconds}s)
          </span>
          <span className={cn(
            'text-body-sm font-medium',
            charCount >= 800 ? 'text-danger' : charCount >= 700 ? 'text-warning' : 'text-stone'
          )}>
            {charCount}/800 characters
          </span>
        </div>

        {/* AI Assistant */}
        <div className="mt-6">
          <h4 className="text-h4 text-warm-black mb-3">Need inspiration?</h4>
          <button
            onClick={() => setShowAiSuggestions(!showAiSuggestions)}
            className="flex items-center gap-2 text-sm text-stone hover:text-caramel transition-colors px-3 py-2 rounded-lg hover:bg-cream"
          >
            <Sparkles size={16} />
            <span>Generate Script Idea</span>
            <ChevronDown
              size={14}
              className={cn('transition-transform duration-200', showAiSuggestions && 'rotate-180')}
            />
          </button>

          <AnimatePresence>
            {showAiSuggestions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3">
                  {AI_SUGGESTIONS.map((sugg, i) => (
                    <motion.div
                      key={sugg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.25 }}
                      className="bg-cream rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-h4 text-warm-black truncate">{sugg.title}</h4>
                            <span className="text-caption text-caramel bg-caramel/10 px-2 py-0.5 rounded-full shrink-0">
                              {sugg.objective}
                            </span>
                          </div>
                          <p className="text-body-sm text-stone line-clamp-2">{sugg.preview}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-caption text-stone flex items-center gap-1">
                          <Clock size={12} />
                          {sugg.duration}
                        </span>
                        <button
                          onClick={() => handleUseSuggestion(sugg.preview)}
                          className="text-xs font-medium bg-caramel hover:bg-caramel/90 text-white px-3 py-1.5 rounded-button transition-colors"
                        >
                          Use This
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Tips & Templates */}
      <div className="lg:col-span-2 space-y-6">
        {/* Best Practices */}
        <div className="bg-cream rounded-card p-6">
          <h3 className="text-h3 text-warm-black mb-4">Script Best Practices</h3>
          <ul className="space-y-3">
            {[
              'Hook in the first 3 seconds',
              'Keep it under 150 words',
              'Use simple, conversational language',
              'Include a clear CTA at the end',
              'Mention your product name 2-3 times',
            ].map((tip) => (
              <li key={tip} className="flex items-center gap-2 text-sm text-warm-black">
                <CheckCircle2 size={16} className="text-success shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Templates */}
        <div className="bg-white rounded-card border border-linen p-6">
          <h3 className="text-h3 text-warm-black mb-4">Quick Templates</h3>
          <div className="space-y-2">
            {SCRIPT_TEMPLATES.map((template) => (
              <div key={template.id} className="border border-linen rounded-lg overflow-hidden">
                <button
                  onClick={(e) => {
                    const el = e.currentTarget.nextElementSibling as HTMLElement
                    if (el) {
                      el.style.display = el.style.display === 'block' ? 'none' : 'block'
                    }
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-cream transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-warm-black">{template.title}</span>
                    <span className="text-[10px] text-caramel bg-caramel/10 px-1.5 py-0.5 rounded-full">
                      {template.objective}
                    </span>
                  </div>
                  <ChevronDown size={14} className="text-stone" />
                </button>
                <div className="hidden px-4 pb-3">
                  <p className="text-body-sm text-stone">{template.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )

  // ── Section 3: Voice Selection ──
  const VoiceSection = () => {
    const categories = ['All', ...Array.from(new Set(VOICES.map((v) => v.style)))]

    return (
      <motion.div
        id="step-voice"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white rounded-card border border-linen p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-h2 text-warm-black">Choose a Voice</h2>
            {/* Category Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setVoiceCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap',
                    voiceCategory === cat
                      ? 'bg-caramel text-white'
                      : 'text-stone hover:text-warm-black hover:bg-cream'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVoices.map((voice, i) => {
              const isSelected = selectedVoice === voice.id
              const isPlaying = playingVoice === voice.id

              return (
                <motion.div
                  key={voice.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  className={cn(
                    'border rounded-xl p-4 transition-all duration-200',
                    isSelected
                      ? 'border-caramel bg-peach/30 shadow-card-hover'
                      : 'border-linen bg-white hover:shadow-card-hover hover:-translate-y-0.5'
                  )}
                >
                  {/* Top: Avatar + Name */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br flex-shrink-0', voice.gradient)} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-h4 text-warm-black truncate">{voice.name}</h4>
                      <span className="text-caption text-stone">{voice.style}</span>
                    </div>
                  </div>

                  {/* Waveform */}
                  <div className="mb-3">
                    <WaveformVisualizer isPlaying={isPlaying} />
                  </div>

                  {/* Details */}
                  <div className="flex items-center gap-2 mb-3 text-caption text-stone">
                    <span className="bg-cream px-2 py-0.5 rounded">{voice.gender}</span>
                    <span className="bg-cream px-2 py-0.5 rounded">{voice.accent}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePlayVoice(voice.id)}
                      className="flex items-center gap-1.5 text-sm text-stone hover:text-caramel px-3 py-1.5 rounded-lg hover:bg-cream transition-colors"
                    >
                      {isPlaying ? <Pause size={14} /> : <Volume2 size={14} />}
                      {isPlaying ? 'Playing' : 'Preview'}
                    </button>
                    <button
                      onClick={() => setSelectedVoice(isSelected ? null : voice.id)}
                      className={cn(
                        'flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all ml-auto',
                        isSelected
                          ? 'bg-success text-white'
                          : 'border border-linen text-warm-black hover:bg-cream'
                      )}
                    >
                      {isSelected ? <Check size={14} /> : null}
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Selected Voice Summary */}
          <AnimatePresence>
            {selectedVoiceData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 flex items-center gap-3 bg-cream rounded-lg px-4 py-3 overflow-hidden"
              >
                <div className={cn('w-8 h-8 rounded-full bg-gradient-to-br', selectedVoiceData.gradient)} />
                <span className="text-sm text-warm-black flex-1">
                  Selected: <strong>{selectedVoiceData.name}</strong> ({selectedVoiceData.style}, {selectedVoiceData.accent} {selectedVoiceData.gender})
                </span>
                <button
                  onClick={() => setSelectedVoice(null)}
                  className="text-caption text-stone hover:text-caramel transition-colors"
                >
                  Change
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    )
  }

  // ── Section 4: Background Style ──
  const StyleSection = () => (
    <motion.div
      id="step-style"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white rounded-card border border-linen p-6">
        <h2 className="text-h2 text-warm-black mb-6">Choose Background Style</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Style Options */}
          <div className="space-y-4">
            {/* Stock Video */}
            <div
              className={cn(
                'border rounded-xl p-4 cursor-pointer transition-all',
                selectedBgStyle === 'stock' ? 'border-caramel bg-peach/20' : 'border-linen hover:border-sand'
              )}
              onClick={() => setSelectedBgStyle('stock')}
            >
              <div className="flex items-center gap-3 mb-3">
                <Film size={20} className={selectedBgStyle === 'stock' ? 'text-caramel' : 'text-stone'} />
                <div>
                  <h4 className="text-h4 text-warm-black">Stock Video Backgrounds</h4>
                  <p className="text-body-sm text-stone">Pre-recorded restaurant and hospitality video clips</p>
                </div>
              </div>
              {selectedBgStyle === 'stock' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-3 gap-2 mt-3"
                >
                  {STOCK_VIDEOS.map((video) => (
                    <button
                      key={video.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedStockVideo(video.id) }}
                      className={cn(
                        'relative rounded-lg overflow-hidden aspect-[9/16] transition-all hover:scale-105',
                        selectedStockVideo === video.id ? 'ring-2 ring-caramel' : 'ring-1 ring-linen'
                      )}
                    >
                      <img src={video.image} alt={video.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30" />
                      <span className="absolute bottom-1 left-1 right-1 text-[10px] text-white font-medium truncate">
                        {video.name}
                      </span>
                      {selectedStockVideo === video.id && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-caramel rounded-full flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Gradient */}
            <div
              className={cn(
                'border rounded-xl p-4 cursor-pointer transition-all',
                selectedBgStyle === 'gradient' ? 'border-caramel bg-peach/20' : 'border-linen hover:border-sand'
              )}
              onClick={() => setSelectedBgStyle('gradient')}
            >
              <div className="flex items-center gap-3 mb-3">
                <Palette size={20} className={selectedBgStyle === 'gradient' ? 'text-caramel' : 'text-stone'} />
                <div>
                  <h4 className="text-h4 text-warm-black">Gradient Backgrounds</h4>
                  <p className="text-body-sm text-stone">Animated gradient backgrounds with no video</p>
                </div>
              </div>
              {selectedBgStyle === 'gradient' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-4 gap-2 mt-3"
                >
                  {GRADIENTS.map((g) => (
                    <button
                      key={g.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedGradient(g.id) }}
                      className={cn(
                        'rounded-lg h-16 transition-all hover:scale-105',
                        selectedGradient === g.id ? 'ring-2 ring-caramel' : 'ring-1 ring-linen'
                      )}
                      style={{ background: g.gradient }}
                      title={g.name}
                    >
                      {selectedGradient === g.id && (
                        <div className="w-full h-full flex items-center justify-center">
                          <Check size={16} className="text-white drop-shadow-lg" />
                        </div>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Slideshow */}
            <div
              className={cn(
                'border rounded-xl p-4 cursor-pointer transition-all',
                selectedBgStyle === 'slideshow' ? 'border-caramel bg-peach/20' : 'border-linen hover:border-sand'
              )}
              onClick={() => setSelectedBgStyle('slideshow')}
            >
              <div className="flex items-center gap-3 mb-3">
                <Images size={20} className={selectedBgStyle === 'slideshow' ? 'text-caramel' : 'text-stone'} />
                <div>
                  <h4 className="text-h4 text-warm-black">Image Slideshow</h4>
                  <p className="text-body-sm text-stone">Cycle through your uploaded product images</p>
                </div>
              </div>
              {selectedBgStyle === 'slideshow' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-3">
                  <div>
                    <label className="text-caption text-stone mb-1 block">Transition</label>
                    <div className="flex gap-2">
                      {['Fade', 'Slide', 'Zoom'].map((t) => (
                        <button
                          key={t}
                          onClick={(e) => { e.stopPropagation(); setSlideshowTransition(t) }}
                          className={cn(
                            'px-3 py-1.5 text-sm rounded-lg transition-colors',
                            slideshowTransition === t ? 'bg-caramel text-white' : 'bg-cream text-stone hover:text-warm-black'
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-caption text-stone mb-1 block">Speed: {slideshowSpeed}s per image</label>
                    <input
                      type="range"
                      min={3}
                      max={10}
                      value={slideshowSpeed}
                      onChange={(e) => setSlideshowSpeed(Number(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full accent-caramel"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Solid Color */}
            <div
              className={cn(
                'border rounded-xl p-4 cursor-pointer transition-all',
                selectedBgStyle === 'solid' ? 'border-caramel bg-peach/20' : 'border-linen hover:border-sand'
              )}
              onClick={() => setSelectedBgStyle('solid')}
            >
              <div className="flex items-center gap-3 mb-3">
                <Square size={20} className={selectedBgStyle === 'solid' ? 'text-caramel' : 'text-stone'} />
                <div>
                  <h4 className="text-h4 text-warm-black">Solid Color + Pattern</h4>
                  <p className="text-body-sm text-stone">Clean solid color with subtle animated pattern</p>
                </div>
              </div>
              {selectedBgStyle === 'solid' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-caption text-stone">Color</label>
                    <input
                      type="color"
                      value={solidColor}
                      onChange={(e) => setSolidColor(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-10 h-10 rounded-full border-2 border-linen cursor-pointer"
                    />
                    <span className="text-sm text-warm-black font-mono">{solidColor}</span>
                  </div>
                  <div>
                    <label className="text-caption text-stone mb-1 block">Pattern</label>
                    <div className="flex gap-2">
                      {['None', 'Dots', 'Lines', 'Waves'].map((p) => (
                        <button
                          key={p}
                          onClick={(e) => { e.stopPropagation(); setSolidPattern(p) }}
                          className={cn(
                            'px-3 py-1.5 text-sm rounded-lg transition-colors',
                            solidPattern === p ? 'bg-caramel text-white' : 'bg-cream text-stone hover:text-warm-black'
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <PhonePreview
                background={getActiveBackground()}
                captionText={script ? script.split('.')[0] + '.' : ''}
                captionStyle={captionSettings}
              />
            </div>

            {/* Customization Controls */}
            <div className="w-full max-w-[280px] space-y-3 mt-4">
              <div>
                <label className="text-caption text-stone mb-1 block">Caption Position</label>
                <div className="flex gap-1">
                  {(['top', 'center', 'bottom'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => updateCaption({ position: pos })}
                      className={cn(
                        'flex-1 px-2 py-1.5 text-xs rounded-lg transition-colors capitalize',
                        captionSettings.position === pos ? 'bg-caramel text-white' : 'bg-cream text-stone hover:text-warm-black'
                      )}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-caption text-stone mb-1 block">Caption Animation</label>
                <select
                  value={captionSettings.animation}
                  onChange={(e) => updateCaption({ animation: e.target.value })}
                  className="w-full text-sm border border-sand rounded-lg px-3 py-2 outline-none focus:border-caramel"
                >
                  {CAPTION_ANIMATIONS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )

  // ── Section 5: Caption Customization ──
  const CaptionSection = () => (
    <motion.div
      id="step-captions"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white rounded-card border border-linen p-6">
        <h2 className="text-h2 text-warm-black mb-6">Caption Customization</h2>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Settings */}
          <div className="lg:col-span-3 space-y-5">
            {/* Font */}
            <div>
              <label className="text-h4 text-warm-black mb-2 block">Caption Font</label>
              <select
                value={captionSettings.font}
                onChange={(e) => updateCaption({ font: e.target.value })}
                className="w-full text-sm border border-sand rounded-lg px-3 py-2.5 outline-none focus:border-caramel focus:shadow-input-focus transition-all"
              >
                {CAPTION_FONTS.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: FONT_MAP[f] }}>{f}</option>
                ))}
              </select>
            </div>

            {/* Font Size */}
            <div>
              <label className="text-h4 text-warm-black mb-2 block">Font Size</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={16}
                  max={48}
                  value={captionSettings.fontSize}
                  onChange={(e) => updateCaption({ fontSize: Number(e.target.value) })}
                  className="flex-1 accent-caramel"
                />
                <span className="text-sm text-warm-black font-mono w-12 text-right">{captionSettings.fontSize}px</span>
              </div>
            </div>

            {/* Toggles */}
            <div>
              <label className="text-h4 text-warm-black mb-2 block">Text Styling</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'bold' as const, label: 'Bold', icon: Bold },
                  { key: 'uppercase' as const, label: 'Uppercase', icon: Type },
                  { key: 'textShadow' as const, label: 'Shadow', icon: MousePointerClick },
                  { key: 'textOutline' as const, label: 'Outline', icon: TypeOutline },
                  { key: 'backgroundBox' as const, label: 'Background', icon: Frame },
                ].map(({ key, label, icon: ToggleIcon }) => (
                  <button
                    key={key}
                    onClick={() => updateCaption({ [key]: !captionSettings[key] })}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-all border',
                      captionSettings[key]
                        ? 'border-caramel bg-caramel/10 text-caramel'
                        : 'border-linen text-stone hover:text-warm-black hover:bg-cream'
                    )}
                  >
                    <ToggleIcon size={14} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Timing */}
            <div>
              <label className="text-h4 text-warm-black mb-2 block">Word Display Duration</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0.3}
                  max={1.0}
                  step={0.1}
                  value={captionSettings.wordDuration}
                  onChange={(e) => updateCaption({ wordDuration: Number(e.target.value) })}
                  className="flex-1 accent-caramel"
                />
                <div className="text-right">
                  <span className="text-sm text-warm-black font-mono">{captionSettings.wordDuration}s</span>
                  <span className="text-caption text-stone block">~{Math.ceil(wordCount * captionSettings.wordDuration)}s total</span>
                </div>
              </div>
            </div>

            {/* Position */}
            <div>
              <label className="text-h4 text-warm-black mb-2 block">Position</label>
              <div className="flex gap-2">
                {[
                  { key: 'top' as const, label: 'Top', icon: AlignVerticalSpaceAround },
                  { key: 'center' as const, label: 'Center', icon: MousePointer2 },
                  { key: 'bottom' as const, label: 'Bottom', icon: AlignVerticalSpaceAround },
                ].map(({ key, label, icon: PosIcon }) => (
                  <button
                    key={key}
                    onClick={() => updateCaption({ position: key })}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-all border flex-1 justify-center',
                      captionSettings.position === key
                        ? 'border-caramel bg-caramel/10 text-caramel'
                        : 'border-linen text-stone hover:text-warm-black hover:bg-cream'
                    )}
                  >
                    <PosIcon size={14} className={key === 'center' ? '' : key === 'top' ? '-rotate-180' : ''} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-2 flex flex-col items-center">
            <p className="text-caption text-stone mb-3">Live Preview</p>
            <PhonePreview
              background={getActiveBackground()}
              captionText={script ? script.split(/[.!?]/).filter(Boolean).slice(0, 3).join('. ') + '.' : ''}
              captionStyle={captionSettings}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )

  // ── Section 6: Generation & Output ──
  const GenerationSection = () => (
    <motion.div
      id="step-generate"
      ref={outputRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {!showOutput ? (
        <div className="bg-white rounded-card border border-linen p-8 text-center">
          {/* Generate Button */}
          <motion.button
            onClick={handleGenerate}
            disabled={isGenerating || !script.trim()}
            className={cn(
              'flex items-center justify-center gap-3 mx-auto w-[200px] h-12 rounded-button text-white font-medium transition-all duration-200',
              script.trim() && !isGenerating
                ? 'bg-caramel hover:bg-caramel/90 active:scale-[0.97]'
                : 'bg-sand cursor-not-allowed'
            )}
            whileTap={script.trim() && !isGenerating ? { scale: 0.95 } : {}}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play size={20} />
                Generate Reel
              </>
            )}
          </motion.button>

          {/* Summary */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="bg-cream rounded-lg px-4 py-3">
                <span className="text-caption text-stone block">Script</span>
                <span className="text-sm text-warm-black">~{wordCount} words (~{estimatedSeconds}s)</span>
              </div>
              <div className="bg-cream rounded-lg px-4 py-3">
                <span className="text-caption text-stone block">Voice</span>
                <span className="text-sm text-warm-black">{selectedVoiceData?.name || 'Not selected'} ({selectedVoiceData?.style || '-'})</span>
              </div>
              <div className="bg-cream rounded-lg px-4 py-3">
                <span className="text-caption text-stone block">Background</span>
                <span className="text-sm text-warm-black">
                  {selectedBgStyle === 'stock' && 'Stock Video'}
                  {selectedBgStyle === 'gradient' && 'Gradient'}
                  {selectedBgStyle === 'slideshow' && 'Slideshow'}
                  {selectedBgStyle === 'solid' && 'Solid Color'}
                </span>
              </div>
              <div className="bg-cream rounded-lg px-4 py-3">
                <span className="text-caption text-stone block">Captions</span>
                <span className="text-sm text-warm-black">{captionSettings.bold ? 'Bold, ' : ''}{captionSettings.position} pos, {captionSettings.animation}</span>
              </div>
            </div>
            <p className="text-caption text-stone mt-4">Generation takes ~2-3 minutes</p>
          </div>

          {/* Progress */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8 max-w-lg mx-auto overflow-hidden"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-warm-black font-medium">Overall Progress</span>
                  <span className="text-sm text-caramel font-mono">{generationProgress}%</span>
                </div>
                <div className="w-full h-2 bg-linen rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-caramel rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${generationProgress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    { id: 1, label: 'Preparing assets' },
                    { id: 2, label: 'Generating voiceover' },
                    { id: 3, label: 'Rendering video with captions' },
                    { id: 4, label: 'Finalizing' },
                  ].map((step) => (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className="w-5 h-5 flex-shrink-0">
                        {generationStep > step.id ? (
                          <CheckCircle2 size={20} className="text-success" />
                        ) : generationStep === step.id ? (
                          <div className="w-5 h-5 border-2 border-caramel border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Circle size={20} className="text-linen" />
                        )}
                      </div>
                      <span className={cn(
                        'text-sm',
                        generationStep >= step.id ? 'text-warm-black' : 'text-stone'
                      )}>
                        {step.label}
                      </span>
                      {generationStep === step.id && (
                        <div className="flex-1 h-1.5 bg-linen rounded-full overflow-hidden ml-2">
                          <motion.div
                            className="h-full bg-caramel rounded-full"
                            animate={{ width: ['0%', '100%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="space-y-6"
        >
          {/* Video Player */}
          <div className="bg-white rounded-card border border-linen p-6 text-center">
            <h3 className="text-h2 text-warm-black mb-4">Your Reel is Ready!</h3>

            <div className="relative mx-auto" style={{ width: 360, height: 640 }}>
              <div
                className="w-full h-full rounded-2xl overflow-hidden relative"
                style={{
                  background: getActiveBackground().startsWith('linear-gradient')
                    ? getActiveBackground()
                    : undefined,
                  backgroundImage: getActiveBackground().startsWith('linear-gradient')
                    ? undefined
                    : getActiveBackground().startsWith('#')
                      ? undefined
                      : `url(${getActiveBackground()})`,
                  backgroundColor: getActiveBackground().startsWith('#') ? getActiveBackground() : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Play/Pause Overlay */}
                <AnimatePresence>
                  {!isVideoPlaying && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 cursor-pointer"
                      onClick={() => setIsVideoPlaying(true)}
                    >
                      <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                        <Play size={28} className="text-caramel ml-1" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isVideoPlaying && (
                  <div
                    className="absolute inset-0 z-10 cursor-pointer"
                    onClick={() => setIsVideoPlaying(false)}
                  />
                )}

                {/* Simulated captions */}
                <div className="absolute bottom-16 left-4 right-4 z-10">
                  <p
                    className="text-center text-white font-bold text-lg leading-snug"
                    style={{
                      fontFamily: FONT_MAP[captionSettings.font] || 'Inter',
                      textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                    }}
                  >
                    {script ? script.split(/[.!?]/).filter(Boolean)[0] + '.' : 'Your caption text appears here'}
                  </p>
                </div>

                {/* Fake progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30 z-10">
                  <motion.div
                    className="h-full bg-caramel"
                    animate={{ width: isVideoPlaying ? ['0%', '100%'] : '0%' }}
                    transition={{ duration: estimatedSeconds || 30, ease: 'linear', repeat: Infinity }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button className="flex items-center gap-2 bg-caramel hover:bg-caramel/90 text-white text-sm font-medium px-5 py-2.5 rounded-button transition-all active:scale-[0.98]">
                <Download size={16} />
                Download Video
              </button>
              <button className="flex items-center gap-2 bg-white border border-linen text-warm-black text-sm font-medium px-5 py-2.5 rounded-button hover:bg-cream transition-colors">
                <Tag size={16} />
                Save to Assets
              </button>
              <button className="flex items-center gap-2 bg-white border border-linen text-warm-black text-sm font-medium px-5 py-2.5 rounded-button hover:bg-cream transition-colors">
                <CalendarDays size={16} />
                Schedule This Reel
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 text-sm text-stone hover:text-caramel px-5 py-2.5 rounded-button hover:bg-cream transition-colors"
              >
                <RotateCcw size={16} />
                Generate Another
              </button>
            </div>

            {/* Settings Summary Toggle */}
            <div className="mt-6 text-left max-w-lg mx-auto">
              <button
                onClick={() => setShowSettingsSummary(!showSettingsSummary)}
                className="flex items-center gap-2 text-sm text-stone hover:text-caramel transition-colors"
              >
                <ChevronDown
                  size={14}
                  className={cn('transition-transform', showSettingsSummary && 'rotate-180')}
                />
                {showSettingsSummary ? 'Hide' : 'Show'} Generation Settings
              </button>
              <AnimatePresence>
                {showSettingsSummary && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-cream rounded-lg p-4 mt-2 space-y-2 text-sm">
                      <p><strong className="text-warm-black">Script:</strong> <span className="text-stone">{script || 'N/A'}</span></p>
                      <p><strong className="text-warm-black">Voice:</strong> <span className="text-stone">{selectedVoiceData?.name || 'N/A'}</span></p>
                      <p><strong className="text-warm-black">Background:</strong> <span className="text-stone">{selectedBgStyle}</span></p>
                      <p><strong className="text-warm-black">Captions:</strong> <span className="text-stone">{captionSettings.font}, {captionSettings.fontSize}px, {captionSettings.animation}</span></p>
                      <button
                        onClick={() => {
                          setShowOutput(false)
                          setCurrentStep(1)
                        }}
                        className="text-caramel text-sm hover:underline mt-1"
                      >
                        Duplicate Settings
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Recent Generations */}
          <div className="bg-white rounded-card border border-linen p-6">
            <h3 className="text-h2 text-warm-black mb-4">Recent Generations</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {RECENT_REELS.map((reel, i) => (
                <motion.button
                  key={reel.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  className="flex-shrink-0 group text-left"
                >
                  <div className="relative w-[120px] h-[213px] rounded-xl overflow-hidden">
                    <img
                      src={reel.thumbnail}
                      alt={reel.title}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                      {reel.duration}
                    </div>
                  </div>
                  <p className="text-xs text-warm-black font-medium mt-1.5 truncate w-[120px]">{reel.title}</p>
                  <p className="text-[10px] text-stone">{reel.date}</p>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )

  // ─── Render ───────────────────────────────────────────
  return (
    <div className="space-y-8 pb-8">
      {/* Page Header */}
      <div>
        <h1 className="text-display text-warm-black">Reel Generator</h1>
        <p className="text-body-sm text-stone mt-1 max-w-2xl">
          Create face-free vertical video ads with AI voiceover and burned-in captions. Perfect for restaurant and hospitality marketing.
        </p>
      </div>

      {/* Workflow Steps */}
      <StepIndicator />

      {/* Section 2: Script */}
      {currentStep >= 1 && <ScriptSection />}

      {/* Navigation between steps */}
      {currentStep === 1 && (
        <div className="flex justify-end">
          <button
            onClick={() => setCurrentStep(2)}
            disabled={!script.trim()}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-button text-sm font-medium transition-all',
              script.trim()
                ? 'bg-caramel text-white hover:bg-caramel/90 active:scale-[0.98]'
                : 'bg-sand text-white/60 cursor-not-allowed'
            )}
          >
            Next: Choose Voice
            <ChevronDown size={16} className="-rotate-90" />
          </button>
        </div>
      )}

      {/* Section 3: Voice */}
      {currentStep >= 2 && <VoiceSection />}

      {currentStep === 2 && (
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-button text-sm text-stone hover:text-warm-black hover:bg-cream border border-linen transition-all"
          >
            <ChevronDown size={16} className="rotate-90" />
            Back: Script
          </button>
          <button
            onClick={() => setCurrentStep(3)}
            disabled={!selectedVoice}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-button text-sm font-medium transition-all',
              selectedVoice
                ? 'bg-caramel text-white hover:bg-caramel/90 active:scale-[0.98]'
                : 'bg-sand text-white/60 cursor-not-allowed'
            )}
          >
            Next: Pick Style
            <ChevronDown size={16} className="-rotate-90" />
          </button>
        </div>
      )}

      {/* Section 4: Background Style */}
      {currentStep >= 3 && <StyleSection />}

      {/* Section 5: Caption Customization (shown with step 3) */}
      {currentStep >= 3 && <CaptionSection />}

      {currentStep === 3 && (
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(2)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-button text-sm text-stone hover:text-warm-black hover:bg-cream border border-linen transition-all"
          >
            <ChevronDown size={16} className="rotate-90" />
            Back: Voice
          </button>
          <button
            onClick={() => setCurrentStep(4)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-button text-sm font-medium bg-caramel text-white hover:bg-caramel/90 active:scale-[0.98] transition-all"
          >
            Next: Generate
            <ChevronDown size={16} className="-rotate-90" />
          </button>
        </div>
      )}

      {/* Section 6: Generation */}
      {currentStep >= 4 && <GenerationSection />}

      {currentStep === 4 && !showOutput && (
        <div className="flex justify-start">
          <button
            onClick={() => setCurrentStep(3)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-button text-sm text-stone hover:text-warm-black hover:bg-cream border border-linen transition-all"
          >
            <ChevronDown size={16} className="rotate-90" />
            Back: Style & Captions
          </button>
        </div>
      )}
    </div>
  )
}
