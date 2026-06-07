import { useState, useEffect, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Image,
  Video,
  Monitor,
  QrCode,
  Upload,
  Search,
  X,
  Grid3X3,
  List,
  Eye,
  Pencil,
  Download,
  Trash2,
  ChevronDown,
  FileImage,
  FileVideo,
  Check,
  Link as LinkIcon,
  Replace,
  ChevronLeft,
  ChevronRight,
  Play,
  
  
  Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AssetType = 'image' | 'video' | 'screenshot' | 'qr-mockup'
type Platform = 'instagram' | 'facebook' | 'youtube'
type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'size' | 'most-used'
type ViewMode = 'grid' | 'list'

interface Asset {
  id: string
  filename: string
  name: string
  type: AssetType
  size: string
  sizeMB: number
  date: string
  dateObj: Date
  tags: string[]
  platforms: Platform[]
  dimensions: string
  duration?: string
  thumbnail: string
  usedIn: { campaign: string; platform: Platform }[]
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const easeOut = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
const spring = [0.34, 1.56, 0.64, 1] as [number, number, number, number]

function typeLabel(type: AssetType): string {
  switch (type) {
    case 'image': return 'Image'
    case 'video': return 'Video'
    case 'screenshot': return 'Screenshot'
    case 'qr-mockup': return 'QR Mockup'
  }
}

function typeIcon(type: AssetType) {
  switch (type) {
    case 'image': return FileImage
    case 'video': return FileVideo
    case 'screenshot': return Monitor
    case 'qr-mockup': return QrCode
  }
}

function platformColor(p: Platform): string {
  switch (p) {
    case 'instagram': return 'bg-[#E4405F]/15 text-[#E4405F]'
    case 'facebook': return 'bg-[#1877F2]/15 text-[#1877F2]'
    case 'youtube': return 'bg-[#FF0000]/15 text-[#FF0000]'
  }
}

function platformLabel(p: Platform): string {
  switch (p) {
    case 'instagram': return 'IG'
    case 'facebook': return 'FB'
    case 'youtube': return 'YT'
  }
}


/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_ASSETS: Asset[] = [
  /* Images (12) */
  {
    id: '1', filename: 'nhyqr-app-mockup-1.jpg', name: 'App Main Screen',
    type: 'image', size: '2.4 MB', sizeMB: 2.4,
    date: 'Jun 14, 2024', dateObj: new Date(2024, 5, 14),
    tags: ['app', 'product', 'menu'], platforms: ['instagram', 'facebook'],
    dimensions: '800 x 600', thumbnail: '/nhyqr-app-mockup-1.jpg',
    usedIn: [{ campaign: 'Summer Menu Launch', platform: 'instagram' }, { campaign: 'Product Showcase', platform: 'facebook' }],
  },
  {
    id: '2', filename: 'nhyqr-qr-placemat.jpg', name: 'QR Table Setup',
    type: 'image', size: '1.8 MB', sizeMB: 1.8,
    date: 'Jun 13, 2024', dateObj: new Date(2024, 5, 13),
    tags: ['qr', 'restaurant', 'demo'], platforms: ['instagram', 'youtube'],
    dimensions: '800 x 600', thumbnail: '/nhyqr-qr-placemat.jpg',
    usedIn: [{ campaign: 'QR Demo Reel', platform: 'youtube' }],
  },
  {
    id: '3', filename: 'nhyqr-dashboard-preview.jpg', name: 'Admin Dashboard',
    type: 'image', size: '3.1 MB', sizeMB: 3.1,
    date: 'Jun 12, 2024', dateObj: new Date(2024, 5, 12),
    tags: ['dashboard', 'product', 'admin'], platforms: ['facebook'],
    dimensions: '800 x 600', thumbnail: '/nhyqr-dashboard-preview.jpg',
    usedIn: [{ campaign: 'Admin Features Ad', platform: 'facebook' }],
  },
  {
    id: '4', filename: 'nhyqr-restaurant-scene.jpg', name: 'Restaurant Interior',
    type: 'image', size: '2.2 MB', sizeMB: 2.2,
    date: 'Jun 10, 2024', dateObj: new Date(2024, 5, 10),
    tags: ['background', 'restaurant'], platforms: ['instagram', 'facebook', 'youtube'],
    dimensions: '1080 x 1920', thumbnail: '/nhyqr-restaurant-scene.jpg',
    usedIn: [{ campaign: 'Restaurant Ambiance', platform: 'instagram' }, { campaign: 'Welcome Reel', platform: 'youtube' }],
  },
  {
    id: '5', filename: 'nhyqr-cafe-scene.jpg', name: 'Cafe Morning Scene',
    type: 'image', size: '1.9 MB', sizeMB: 1.9,
    date: 'Jun 9, 2024', dateObj: new Date(2024, 5, 9),
    tags: ['background', 'cafe'], platforms: ['instagram'],
    dimensions: '1080 x 1920', thumbnail: '/nhyqr-cafe-scene.jpg',
    usedIn: [{ campaign: 'Cafe Promo', platform: 'instagram' }],
  },
  {
    id: '6', filename: 'nhyqr-hotel-scene.jpg', name: 'Hotel Dining Setup',
    type: 'image', size: '2.5 MB', sizeMB: 2.5,
    date: 'Jun 8, 2024', dateObj: new Date(2024, 5, 8),
    tags: ['background', 'hotel'], platforms: ['facebook', 'youtube'],
    dimensions: '1080 x 1920', thumbnail: '/nhyqr-hotel-scene.jpg',
    usedIn: [{ campaign: 'Hotel Showcase', platform: 'youtube' }],
  },
  {
    id: '7', filename: 'menu-items-grid.jpg', name: 'Menu Items Grid',
    type: 'image', size: '1.6 MB', sizeMB: 1.6,
    date: 'Jun 7, 2024', dateObj: new Date(2024, 5, 7),
    tags: ['menu', 'food', 'product'], platforms: ['instagram', 'facebook'],
    dimensions: '1200 x 900', thumbnail: '/nhyqr-app-mockup-1.jpg',
    usedIn: [{ campaign: 'Summer Menu Launch', platform: 'instagram' }],
  },
  {
    id: '8', filename: 'qr-code-closeup.jpg', name: 'QR Code Closeup',
    type: 'qr-mockup', size: '0.8 MB', sizeMB: 0.8,
    date: 'Jun 6, 2024', dateObj: new Date(2024, 5, 6),
    tags: ['qr', 'closeup'], platforms: ['instagram', 'facebook', 'youtube'],
    dimensions: '600 x 600', thumbnail: '/nhyqr-qr-placemat.jpg',
    usedIn: [{ campaign: 'QR Awareness', platform: 'facebook' }, { campaign: 'Setup Tutorial', platform: 'youtube' }],
  },
  {
    id: '9', filename: 'chef-hands-plating.jpg', name: 'Chef Plating',
    type: 'image', size: '2.1 MB', sizeMB: 2.1,
    date: 'Jun 5, 2024', dateObj: new Date(2024, 5, 5),
    tags: ['food', 'kitchen', 'background'], platforms: ['instagram', 'youtube'],
    dimensions: '1080 x 1350', thumbnail: '/nhyqr-restaurant-scene.jpg',
    usedIn: [{ campaign: 'Behind the Scenes', platform: 'instagram' }],
  },
  {
    id: '10', filename: 'happy-customer-scanning.jpg', name: 'Customer Scanning QR',
    type: 'image', size: '1.7 MB', sizeMB: 1.7,
    date: 'Jun 4, 2024', dateObj: new Date(2024, 5, 4),
    tags: ['customer', 'qr', 'lifestyle'], platforms: ['instagram', 'facebook'],
    dimensions: '800 x 1000', thumbnail: '/nhyqr-cafe-scene.jpg',
    usedIn: [{ campaign: 'Customer Stories', platform: 'instagram' }, { campaign: 'Trust Builder', platform: 'facebook' }],
  },
  {
    id: '11', filename: 'app-on-ipad.jpg', name: 'App on iPad',
    type: 'image', size: '2.3 MB', sizeMB: 2.3,
    date: 'Jun 3, 2024', dateObj: new Date(2024, 5, 3),
    tags: ['app', 'product', 'ipad'], platforms: ['facebook'],
    dimensions: '1200 x 900', thumbnail: '/nhyqr-dashboard-preview.jpg',
    usedIn: [{ campaign: 'iPad Showcase', platform: 'facebook' }],
  },
  {
    id: '12', filename: 'restaurant-exterior.jpg', name: 'Restaurant Exterior',
    type: 'image', size: '2.8 MB', sizeMB: 2.8,
    date: 'Jun 2, 2024', dateObj: new Date(2024, 5, 2),
    tags: ['restaurant', 'exterior'], platforms: ['instagram', 'youtube'],
    dimensions: '1080 x 1350', thumbnail: '/nhyqr-hotel-scene.jpg',
    usedIn: [{ campaign: 'Venue Tour', platform: 'youtube' }],
  },
  /* Videos (8) */
  {
    id: '13', filename: 'demo-walkthrough.mp4', name: 'App Demo Walkthrough',
    type: 'video', size: '12.4 MB', sizeMB: 12.4, duration: '0:45',
    date: 'Jun 14, 2024', dateObj: new Date(2024, 5, 14),
    tags: ['demo', 'video', 'product'], platforms: ['youtube', 'facebook'],
    dimensions: '1920 x 1080', thumbnail: '/nhyqr-app-mockup-1.jpg',
    usedIn: [{ campaign: 'Product Demo', platform: 'youtube' }],
  },
  {
    id: '14', filename: 'qr-menu-demo.mp4', name: 'QR Menu in Action',
    type: 'video', size: '8.7 MB', sizeMB: 8.7, duration: '0:32',
    date: 'Jun 13, 2024', dateObj: new Date(2024, 5, 13),
    tags: ['qr', 'demo', 'video'], platforms: ['instagram', 'youtube'],
    dimensions: '1080 x 1920', thumbnail: '/nhyqr-qr-placemat.jpg',
    usedIn: [{ campaign: 'QR Demo Reel', platform: 'instagram' }, { campaign: 'Setup Guide', platform: 'youtube' }],
  },
  {
    id: '15', filename: 'restaurant-owner-review.mp4', name: 'Owner Testimonial',
    type: 'video', size: '15.2 MB', sizeMB: 15.2, duration: '0:58',
    date: 'Jun 11, 2024', dateObj: new Date(2024, 5, 11),
    tags: ['testimonial', 'review'], platforms: ['facebook', 'youtube'],
    dimensions: '1920 x 1080', thumbnail: '/nhyqr-restaurant-scene.jpg',
    usedIn: [{ campaign: 'Social Proof', platform: 'facebook' }],
  },
  {
    id: '16', filename: 'setup-tutorial.mp4', name: 'Setup Tutorial',
    type: 'video', size: '28.4 MB', sizeMB: 28.4, duration: '2:15',
    date: 'Jun 10, 2024', dateObj: new Date(2024, 5, 10),
    tags: ['tutorial', 'how-to'], platforms: ['youtube'],
    dimensions: '1920 x 1080', thumbnail: '/nhyqr-dashboard-preview.jpg',
    usedIn: [{ campaign: 'Onboarding', platform: 'youtube' }],
  },
  {
    id: '17', filename: 'cafe-promo-reel.mp4', name: 'Cafe Promo Reel',
    type: 'video', size: '7.1 MB', sizeMB: 7.1, duration: '0:28',
    date: 'Jun 9, 2024', dateObj: new Date(2024, 5, 9),
    tags: ['reel', 'cafe', 'promo'], platforms: ['instagram'],
    dimensions: '1080 x 1920', thumbnail: '/nhyqr-cafe-scene.jpg',
    usedIn: [{ campaign: 'Cafe Stories', platform: 'instagram' }],
  },
  {
    id: '18', filename: 'hotel-showcase.mp4', name: 'Hotel Showcase',
    type: 'video', size: '11.3 MB', sizeMB: 11.3, duration: '0:41',
    date: 'Jun 8, 2024', dateObj: new Date(2024, 5, 8),
    tags: ['hotel', 'showcase'], platforms: ['instagram', 'youtube'],
    dimensions: '1080 x 1920', thumbnail: '/nhyqr-hotel-scene.jpg',
    usedIn: [{ campaign: 'Luxury Promo', platform: 'youtube' }],
  },
  {
    id: '19', filename: 'features-overview.mp4', name: 'Features Overview',
    type: 'video', size: '19.8 MB', sizeMB: 19.8, duration: '1:30',
    date: 'Jun 7, 2024', dateObj: new Date(2024, 5, 7),
    tags: ['features', 'product'], platforms: ['youtube', 'facebook'],
    dimensions: '1920 x 1080', thumbnail: '/nhyqr-app-mockup-1.jpg',
    usedIn: [{ campaign: 'Feature Launch', platform: 'youtube' }],
  },
  {
    id: '20', filename: 'customer-reaction.mp4', name: 'Customer Reactions',
    type: 'video', size: '5.9 MB', sizeMB: 5.9, duration: '0:22',
    date: 'Jun 6, 2024', dateObj: new Date(2024, 5, 6),
    tags: ['customer', 'reaction'], platforms: ['instagram', 'facebook'],
    dimensions: '1080 x 1920', thumbnail: '/nhyqr-cafe-scene.jpg',
    usedIn: [{ campaign: 'User Generated', platform: 'instagram' }],
  },
  /* Screenshots (4) */
  {
    id: '21', filename: 'screenshot-menu-editor.png', name: 'Menu Editor UI',
    type: 'screenshot', size: '0.4 MB', sizeMB: 0.4,
    date: 'Jun 14, 2024', dateObj: new Date(2024, 5, 14),
    tags: ['screenshot', 'ui', 'editor'], platforms: ['facebook'],
    dimensions: '1440 x 900', thumbnail: '/nhyqr-dashboard-preview.jpg',
    usedIn: [{ campaign: 'Feature Highlight', platform: 'facebook' }],
  },
  {
    id: '22', filename: 'screenshot-analytics.png', name: 'Analytics Screen',
    type: 'screenshot', size: '0.3 MB', sizeMB: 0.3,
    date: 'Jun 13, 2024', dateObj: new Date(2024, 5, 13),
    tags: ['screenshot', 'analytics'], platforms: ['instagram', 'facebook'],
    dimensions: '1440 x 900', thumbnail: '/nhyqr-app-mockup-1.jpg',
    usedIn: [{ campaign: 'Data Story', platform: 'instagram' }],
  },
  {
    id: '23', filename: 'screenshot-qr-generator.png', name: 'QR Generator UI',
    type: 'screenshot', size: '0.4 MB', sizeMB: 0.4,
    date: 'Jun 12, 2024', dateObj: new Date(2024, 5, 12),
    tags: ['screenshot', 'qr', 'ui'], platforms: ['youtube', 'facebook'],
    dimensions: '1440 x 900', thumbnail: '/nhyqr-qr-placemat.jpg',
    usedIn: [{ campaign: 'Tool Showcase', platform: 'youtube' }],
  },
  {
    id: '24', filename: 'screenshot-menu-live.png', name: 'Live Menu View',
    type: 'screenshot', size: '0.3 MB', sizeMB: 0.3,
    date: 'Jun 11, 2024', dateObj: new Date(2024, 5, 11),
    tags: ['screenshot', 'menu', 'live'], platforms: ['instagram'],
    dimensions: '1440 x 900', thumbnail: '/nhyqr-restaurant-scene.jpg',
    usedIn: [{ campaign: 'Live Demo', platform: 'instagram' }],
  },
]

const ALL_TAGS = Array.from(new Set(MOCK_ASSETS.flatMap((a) => a.tags)))

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  delay,
}: {
  icon: React.ElementType
  label: string
  value: number
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay, ease: easeOut }}
      className="flex items-center gap-3 bg-cream rounded-lg px-4 py-2.5"
    >
      <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center shrink-0">
        <Icon size={16} className="text-caramel" />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-data-sm text-warm-black">{value}</span>
        <span className="text-caption text-stone">{label}</span>
      </div>
    </motion.div>
  )
}

function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-button border border-sand bg-white text-sm text-warm-black hover:bg-cream transition-colors min-w-[120px]"
      >
        <span className="text-stone text-xs">{label}:</span>
        <span className="font-medium text-sm">{selected?.label}</span>
        <ChevronDown size={14} className={cn('text-stone ml-auto transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-1 bg-white border border-linen rounded-lg shadow-card z-50 min-w-[160px] py-1 overflow-hidden"
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm transition-colors hover:bg-cream',
                    opt.value === value ? 'text-caramel font-medium' : 'text-warm-black'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="flex items-center bg-cream rounded-lg p-0.5">
      <button
        onClick={() => onChange('grid')}
        className={cn(
          'p-2 rounded-md transition-all duration-200',
          mode === 'grid' ? 'bg-caramel text-white' : 'text-stone hover:text-warm-black'
        )}
        title="Grid view"
      >
        <Grid3X3 size={16} />
      </button>
      <button
        onClick={() => onChange('list')}
        className={cn(
          'p-2 rounded-md transition-all duration-200',
          mode === 'list' ? 'bg-caramel text-white' : 'text-stone hover:text-warm-black'
        )}
        title="List view"
      >
        <List size={16} />
      </button>
    </div>
  )
}

function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-tag text-caption font-medium', platformColor(platform))}>
      {platformLabel(platform)}
    </span>
  )
}

function TypeBadge({ type }: { type: AssetType }) {
  const styles: Record<AssetType, string> = {
    image: 'bg-info/15 text-info',
    video: 'bg-warning/15 text-warning',
    screenshot: 'bg-success/15 text-success',
    'qr-mockup': 'bg-[#8B5CF6]/15 text-[#8B5CF6]',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-tag text-caption font-medium', styles[type])}>
      {typeLabel(type)}
    </span>
  )
}

function TagPill({ tag, onRemove, removable }: { tag: string; onRemove?: () => void; removable?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-tag bg-peach text-caramel text-caption font-medium">
      {tag}
      {removable && (
        <button onClick={onRemove} className="hover:text-warm-black transition-colors">
          <X size={10} />
        </button>
      )}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Upload Dialog                                                      */
/* ------------------------------------------------------------------ */

function UploadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-white border border-linen">
        <DialogHeader>
          <DialogTitle className="text-h3 text-warm-black">Upload Assets</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="border-2 border-dashed border-sand rounded-card p-8 text-center hover:border-caramel hover:bg-cream/50 transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-caramel/15 flex items-center justify-center mx-auto mb-3">
              <Upload size={20} className="text-caramel" />
            </div>
            <p className="text-h4 text-warm-black mb-1">Drop files here</p>
            <p className="text-body-sm text-stone">or click to browse from your computer</p>
            <p className="text-caption text-stone mt-2">Supports JPG, PNG, MP4, MOV up to 100MB</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                toast.success('Import dialog would open here')
                onClose()
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-button border border-linen text-sm font-medium text-warm-black hover:bg-cream transition-colors"
            >
              <LinkIcon size={14} />
              Import from URL
            </button>
            <button
              onClick={() => {
                toast.success('AI Generation would open here')
                onClose()
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-button border border-linen text-sm font-medium text-warm-black hover:bg-cream transition-colors"
            >
              <SparklesIcon size={14} />
              Generate with AI
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SparklesIcon({ size, className }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size ?? 16} height={size ?? 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Asset Detail Drawer                                                */
/* ------------------------------------------------------------------ */

function AssetDetailDrawer({
  asset,
  onClose,
}: {
  asset: Asset | null
  onClose: () => void
}) {
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (asset) setTags(asset.tags)
  }, [asset])

  if (!asset) return null


  return (
    <AnimatePresence>
      {asset && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-graphite/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: spring }}
            className="fixed top-0 right-0 h-full w-full max-w-[520px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-linen shrink-0">
              <h3 className="text-h3 text-warm-black">Asset Details</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-stone hover:text-warm-black hover:bg-cream transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Preview */}
              <div className="relative w-full h-[300px] bg-warm-black group">
                <img
                  src={asset.thumbnail}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                />
                {asset.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center">
                      <Play size={24} className="text-warm-black ml-1" fill="currentColor" />
                    </div>
                  </div>
                )}
                {/* Nav arrows */}
                <button className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-warm-black hover:bg-white transition-colors opacity-0 group-hover:opacity-100">
                  <ChevronLeft size={16} />
                </button>
                <button className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-warm-black hover:bg-white transition-colors opacity-0 group-hover:opacity-100">
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Metadata */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-h2 text-warm-black">{asset.name}</h2>
                    <TypeBadge type={asset.type} />
                  </div>
                  <p className="text-body-sm text-stone font-mono">{asset.filename}</p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-cream rounded-lg p-3">
                      <p className="text-caption text-stone mb-1">Size</p>
                      <p className="text-data-sm text-warm-black">{asset.size}</p>
                    </div>
                    <div className="bg-cream rounded-lg p-3">
                      <p className="text-caption text-stone mb-1">Dimensions</p>
                      <p className="text-data-sm text-warm-black">{asset.dimensions}</p>
                    </div>
                    <div className="bg-cream rounded-lg p-3">
                      <p className="text-caption text-stone mb-1">Uploaded</p>
                      <p className="text-data-sm text-warm-black">{asset.date}</p>
                    </div>
                    <div className="bg-cream rounded-lg p-3">
                      <p className="text-caption text-stone mb-1">By</p>
                      <p className="text-data-sm text-warm-black">Alex Johnson</p>
                    </div>
                  </div>
                  {asset.duration && (
                    <div className="flex items-center gap-2 text-body-sm text-stone">
                      <Video size={14} />
                      Duration: {asset.duration}
                    </div>
                  )}
                </div>

                {/* Platforms */}
                <div>
                  <p className="text-caption text-stone uppercase tracking-wider mb-2">Used For</p>
                  <div className="flex flex-wrap gap-2">
                    {asset.platforms.map((p) => (
                      <PlatformBadge key={p} platform={p} />
                    ))}
                  </div>
                </div>

                {/* Tags Editor */}
                <div>
                  <p className="text-caption text-stone uppercase tracking-wider mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <AnimatePresence>
                      {tags.map((tag) => (
                        <motion.span
                          key={tag}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <TagPill tag={tag} removable onRemove={() => setTags(tags.filter((t) => t !== tag))} />
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                  <div className="relative">
                    <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && tagInput.trim()) {
                          if (!tags.includes(tagInput.trim())) {
                            setTags([...tags, tagInput.trim()])
                            toast.success(`Tag "${tagInput.trim()}" added`)
                          }
                          setTagInput('')
                        }
                      }}
                      placeholder="Add a tag..."
                      className="w-full pl-9 pr-3 py-2 rounded-button border border-sand text-sm text-warm-black placeholder:text-stone/60 focus:outline-none focus:border-caramel focus:shadow-input-focus transition-all"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {ALL_TAGS.filter((t) => !tags.includes(t)).slice(0, 6).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setTags([...tags, tag])
                          toast.success(`Tag "${tag}" added`)
                        }}
                        className="px-2 py-0.5 rounded-tag bg-cream text-stone text-caption hover:bg-peach hover:text-caramel transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Usage */}
                <div>
                  <p className="text-caption text-stone uppercase tracking-wider mb-2">Used In</p>
                  {asset.usedIn.length > 0 ? (
                    <div className="space-y-2">
                      {asset.usedIn.map((u, i) => (
                        <div key={i} className="flex items-center justify-between bg-cream rounded-lg px-3 py-2.5">
                          <span className="text-body-sm text-warm-black font-medium">{u.campaign}</span>
                          <PlatformBadge platform={u.platform} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-cream rounded-lg">
                      <p className="text-body-sm text-stone mb-2">Not used in any campaigns yet</p>
                      <button className="text-caramel text-sm font-medium hover:underline">
                        Create Campaign
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="border-t border-linen p-4 space-y-2 shrink-0 bg-white">
              <button
                onClick={() => toast.success(`Downloading ${asset.filename}...`)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-button border border-linen text-sm font-medium text-warm-black hover:bg-cream transition-colors"
              >
                <Download size={14} />
                Download
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast.success('Replace dialog would open')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-button text-sm font-medium text-stone hover:bg-cream transition-colors"
                >
                  <Replace size={14} />
                  Replace
                </button>
                <button
                  onClick={() => {
                    toast.success('URL copied to clipboard')
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-button text-sm font-medium text-stone hover:bg-cream transition-colors"
                >
                  <LinkIcon size={14} />
                  Copy URL
                </button>
                <button
                  onClick={() => {
                    toast.error(`${asset.name} deleted`)
                    onClose()
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-button text-sm font-medium text-danger hover:bg-danger-light transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/*  Asset Grid Card                                                    */
/* ------------------------------------------------------------------ */

function AssetGridCard({
  asset,
  index,
  selected,
  onSelect,
  onOpen,
}: {
  asset: Asset
  index: number
  selected: boolean
  onSelect: () => void
  onOpen: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, delay: index * 0.03, ease: easeOut }}
      className="group bg-white rounded-card border border-linen overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
    >
      {/* Thumbnail */}
      <div className="relative w-full h-[200px] overflow-hidden">
        <img
          src={asset.thumbnail}
          alt={asset.name}
          className={cn(
            'w-full h-full object-cover transition-transform duration-300',
            hovered && 'scale-105'
          )}
        />

        {/* Platform badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {asset.platforms.map((p) => (
            <span key={p} className="px-1.5 py-0.5 rounded bg-white/90 text-[10px] font-semibold text-warm-black shadow-sm">
              {platformLabel(p)}
            </span>
          ))}
        </div>

        {/* Video indicator */}
        {asset.type === 'video' && (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center opacity-80 group-hover:opacity-0 transition-opacity">
                <Play size={16} className="text-warm-black ml-0.5" fill="currentColor" />
              </div>
            </div>
            {asset.duration && (
              <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-warm-black/80 text-white text-[10px] font-mono">
                {asset.duration}
              </span>
            )}
          </>
        )}

        {/* Hover overlay */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-graphite/60 backdrop-blur-sm flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              <div className="flex items-center gap-2">
                {[{
                  icon: Eye,
                  label: 'Preview',
                  action: onOpen,
                }, {
                  icon: Pencil,
                  label: 'Edit',
                  action: () => toast.success(`Editing ${asset.name}`),
                }, {
                  icon: Download,
                  label: 'Download',
                  action: () => toast.success(`Downloading ${asset.filename}`),
                }].map((btn, i) => (
                  <motion.button
                    key={btn.label}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: i * 0.05 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      btn.action()
                    }}
                    title={btn.label}
                    className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-warm-black hover:bg-white hover:scale-105 transition-all"
                  >
                    <btn.icon size={16} />
                  </motion.button>
                ))}
              </div>
              {/* Select checkbox */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect()
                }}
                className={cn(
                  'absolute top-2 right-2 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors',
                  selected
                    ? 'bg-caramel border-caramel text-white'
                    : 'border-white/70 bg-white/30 hover:bg-white/60'
                )}
              >
                {selected && <Check size={12} />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Metadata */}
      <div className="px-4 py-3">
        <h4 className="text-h4 text-warm-black truncate" title={asset.name}>{asset.name}</h4>
        <div className="flex items-center gap-2 mt-1.5 text-caption text-stone">
          {(() => { const Icon = typeIcon(asset.type); return <Icon size={12} />; })()}
          <span>{typeLabel(asset.type)}</span>
          <span>·</span>
          <span>{asset.size}</span>
          <span>·</span>
          <span>{asset.date}</span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {asset.tags.slice(0, 3).map((t) => (
            <TagPill key={t} tag={t} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Asset List Row                                                     */
/* ------------------------------------------------------------------ */

function AssetListRow({
  asset,
  index,
  selected,
  onSelect,
  onOpen,
}: {
  asset: Asset
  index: number
  selected: boolean
  onSelect: () => void
  onOpen: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02, ease: easeOut }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
      className={cn(
        'border-b border-linen transition-colors cursor-pointer',
        hovered ? 'bg-peach/30' : 'bg-white'
      )}
    >
      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="w-4 h-4 rounded border-sand text-caramel focus:ring-caramel"
        />
      </td>
      <td className="py-3 px-2">
        <div className="w-12 h-9 rounded overflow-hidden bg-cream">
          <img src={asset.thumbnail} alt="" className="w-full h-full object-cover" />
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {(() => {
            const T = typeIcon(asset.type)
            return <T size={14} className="text-stone shrink-0" />
          })()}
          <div>
            <p className="text-body-sm font-medium text-warm-black">{asset.name}</p>
            <p className="text-caption text-stone font-mono truncate max-w-[160px]">{asset.filename}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <TypeBadge type={asset.type} />
      </td>
      <td className="py-3 px-4 text-body-sm text-warm-black font-mono">{asset.size}</td>
      <td className="py-3 px-4">
        <div className="flex gap-1">
          {asset.platforms.map((p) => (
            <PlatformBadge key={p} platform={p} />
          ))}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex flex-wrap gap-1">
          {asset.tags.slice(0, 3).map((t) => (
            <TagPill key={t} tag={t} />
          ))}
        </div>
      </td>
      <td className="py-3 px-4 text-caption text-stone">{asset.date}</td>
      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpen}
            className="p-1.5 rounded-md text-stone hover:text-warm-black hover:bg-cream transition-colors"
            title="Preview"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => toast.success(`Editing ${asset.name}`)}
            className="p-1.5 rounded-md text-stone hover:text-warm-black hover:bg-cream transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => toast.success(`Downloading ${asset.filename}`)}
            className="p-1.5 rounded-md text-stone hover:text-warm-black hover:bg-cream transition-colors"
            title="Download"
          >
            <Download size={14} />
          </button>
        </div>
      </td>
    </motion.tr>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function AssetHub() {
  /* --- State --- */
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [sort, setSort] = useState<SortOption>('newest')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)

  /* --- Derived data --- */
  const stats = useMemo(() => {
    const images = MOCK_ASSETS.filter((a) => a.type === 'image').length
    const videos = MOCK_ASSETS.filter((a) => a.type === 'video').length
    const screenshots = MOCK_ASSETS.filter((a) => a.type === 'screenshot').length
    const qrMockups = MOCK_ASSETS.filter((a) => a.type === 'qr-mockup').length
    return { images, videos, screenshots, qrMockups, total: MOCK_ASSETS.length }
  }, [])

  const filteredAssets = useMemo(() => {
    let result = [...MOCK_ASSETS]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.filename.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)) ||
          typeLabel(a.type).toLowerCase().includes(q)
      )
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((a) => a.type === typeFilter)
    }

    // Platform filter
    if (platformFilter !== 'all') {
      result = result.filter((a) => a.platforms.includes(platformFilter as Platform))
    }

    // Sort
    switch (sort) {
      case 'newest':
        result.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())
        break
      case 'oldest':
        result.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
        break
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'size':
        result.sort((a, b) => b.sizeMB - a.sizeMB)
        break
      case 'most-used':
        result.sort((a, b) => b.usedIn.length - a.usedIn.length)
        break
    }

    return result
  }, [search, typeFilter, platformFilter, sort])

  const selectAll = useCallback(() => {
    if (selectedIds.size === filteredAssets.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredAssets.map((a) => a.id)))
    }
  }, [selectedIds.size, filteredAssets])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  /* --- Render --- */
  return (
    <div className="space-y-6">
      {/* ---- Section 1: Page Header + Stats ---- */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-display text-warm-black">Asset Hub</h1>
          <p className="text-body text-stone mt-1">
            Organize and manage all your creative assets in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <StatCard icon={Image} label="Images" value={stats.images} delay={0} />
            <StatCard icon={Video} label="Videos" value={stats.videos} delay={0.06} />
            <StatCard icon={Monitor} label="Screenshots" value={stats.screenshots} delay={0.12} />
            <StatCard icon={QrCode} label="QR Mockups" value={stats.qrMockups} delay={0.18} />
          </div>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.24 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 bg-caramel hover:bg-caramel/90 text-white text-sm font-medium px-5 py-2.5 rounded-button shadow-xs transition-colors"
          >
            <Upload size={16} />
            Upload Assets
          </motion.button>
        </div>
      </div>

      {/* ---- Section 2: Filter & Search Bar ---- */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1, ease: easeOut }}
        className="bg-white rounded-card border border-linen p-4 space-y-4"
      >
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative w-[320px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets by name, tag, or type..."
              className="w-full pl-9 pr-9 py-2 rounded-button border border-sand bg-white text-sm text-warm-black placeholder:text-stone/60 focus:outline-none focus:border-caramel focus:shadow-input-focus transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-warm-black"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters */}
          <Dropdown
            label="Type"
            value={typeFilter}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'image', label: 'Images' },
              { value: 'video', label: 'Videos' },
              { value: 'screenshot', label: 'Screenshots' },
              { value: 'qr-mockup', label: 'QR Mockups' },
            ]}
            onChange={setTypeFilter}
          />
          <Dropdown
            label="Platform"
            value={platformFilter}
            options={[
              { value: 'all', label: 'All Platforms' },
              { value: 'instagram', label: 'Instagram' },
              { value: 'facebook', label: 'Facebook' },
              { value: 'youtube', label: 'YouTube' },
            ]}
            onChange={setPlatformFilter}
          />
          <Dropdown
            label="Sort"
            value={sort}
            options={[
              { value: 'newest', label: 'Newest First' },
              { value: 'oldest', label: 'Oldest First' },
              { value: 'name-asc', label: 'Name A-Z' },
              { value: 'name-desc', label: 'Name Z-A' },
              { value: 'size', label: 'Size' },
              { value: 'most-used', label: 'Most Used' },
            ]}
            onChange={(v) => setSort(v as SortOption)}
          />

          <div className="ml-auto">
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {/* Bulk actions bar */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 pt-3 border-t border-linen">
                <label className="flex items-center gap-2 text-sm text-warm-black cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredAssets.length && filteredAssets.length > 0}
                    onChange={selectAll}
                    className="w-4 h-4 rounded border-sand text-caramel focus:ring-caramel"
                  />
                  <span className="font-medium">{selectedIds.size} selected</span>
                </label>
                <button
                  onClick={() => {
                    toast.success(`Downloading ${selectedIds.size} assets...`)
                    clearSelection()
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-button border border-linen text-sm font-medium text-warm-black hover:bg-cream transition-colors"
                >
                  <Download size={14} />
                  Download
                </button>
                <button
                  onClick={() => {
                    toast.error(`Deleted ${selectedIds.size} assets`)
                    clearSelection()
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-danger text-white text-sm font-medium hover:bg-danger/90 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
                <button
                  onClick={clearSelection}
                  className="ml-auto text-sm text-stone hover:text-warm-black transition-colors"
                >
                  Clear selection
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ---- Section 3/4: Grid or List View ---- */}
      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredAssets.map((asset, i) => (
              <AssetGridCard
                key={asset.id}
                asset={asset}
                index={i}
                selected={selectedIds.has(asset.id)}
                onSelect={() => toggleSelect(asset.id)}
                onOpen={() => setDetailAsset(asset)}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-card border border-linen overflow-hidden"
          >
            <table className="w-full">
              <thead>
                <tr className="bg-cream border-b border-linen">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredAssets.length && filteredAssets.length > 0}
                      onChange={selectAll}
                      className="w-4 h-4 rounded border-sand text-caramel focus:ring-caramel"
                    />
                  </th>
                  <th className="py-3 px-2 text-left text-caption text-stone uppercase tracking-wider font-medium">Preview</th>
                  <th className="py-3 px-4 text-left text-caption text-stone uppercase tracking-wider font-medium">Name</th>
                  <th className="py-3 px-4 text-left text-caption text-stone uppercase tracking-wider font-medium">Type</th>
                  <th className="py-3 px-4 text-left text-caption text-stone uppercase tracking-wider font-medium">Size</th>
                  <th className="py-3 px-4 text-left text-caption text-stone uppercase tracking-wider font-medium">Platforms</th>
                  <th className="py-3 px-4 text-left text-caption text-stone uppercase tracking-wider font-medium">Tags</th>
                  <th className="py-3 px-4 text-left text-caption text-stone uppercase tracking-wider font-medium">Date</th>
                  <th className="py-3 px-4 text-left text-caption text-stone uppercase tracking-wider font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset, i) => (
                  <AssetListRow
                    key={asset.id}
                    asset={asset}
                    index={i}
                    selected={selectedIds.has(asset.id)}
                    onSelect={() => toggleSelect(asset.id)}
                    onOpen={() => setDetailAsset(asset)}
                  />
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {filteredAssets.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center mx-auto mb-4">
            <Search size={24} className="text-stone" />
          </div>
          <h3 className="text-h3 text-warm-black mb-2">No assets found</h3>
          <p className="text-body-sm text-stone mb-4">Try adjusting your filters or search terms.</p>
          <button
            onClick={() => {
              setSearch('')
              setTypeFilter('all')
              setPlatformFilter('all')
            }}
            className="text-caramel text-sm font-medium hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* ---- Section 5: Asset Detail Drawer ---- */}
      <AnimatePresence>
        {detailAsset && (
          <AssetDetailDrawer
            asset={detailAsset}
            onClose={() => setDetailAsset(null)}
          />
        )}
      </AnimatePresence>

      {/* Upload Dialog */}
      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  )
}
