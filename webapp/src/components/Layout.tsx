import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Plus, Search } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from './Navbar'
import Footer from './Footer'

interface PageInfo {
  title: string
  subtitle: string
  ctaLabel: string
  ctaAction?: () => void
}

function getPageInfo(pathname: string): PageInfo {
  switch (true) {
    case pathname === '/dashboard':
      return {
        title: 'Dashboard',
        subtitle: "Here's what's happening with your campaigns today.",
        ctaLabel: 'New Campaign',
      }
    case pathname.startsWith('/ads'):
      return {
        title: 'Ad Generator',
        subtitle: 'Create AI-powered ad copy for any platform.',
        ctaLabel: 'Generate Ad',
      }
    case pathname.startsWith('/reels'):
      return {
        title: 'Reel Generator',
        subtitle: 'Generate face-free video reels with AI voiceover.',
        ctaLabel: 'Create Reel',
      }
    case pathname === '/assets':
      return {
        title: 'Asset Hub',
        subtitle: 'Manage your media library.',
        ctaLabel: 'Upload Asset',
      }
    case pathname === '/schedule':
      return {
        title: 'Scheduler',
        subtitle: 'Plan and schedule posts across platforms.',
        ctaLabel: 'Schedule Post',
      }
    case pathname === '/analytics':
      return {
        title: 'Analytics',
        subtitle: 'Track performance and optimize campaigns.',
        ctaLabel: 'Export Report',
      }
    case pathname === '/settings':
      return {
        title: 'Settings',
        subtitle: 'Configure your product and brand.',
        ctaLabel: 'Save Changes',
      }
    case pathname.startsWith('/campaigns/'):
      return {
        title: 'Campaign Detail',
        subtitle: 'View and manage campaign details.',
        ctaLabel: 'Edit Campaign',
      }
    default:
      return {
        title: 'Dashboard',
        subtitle: 'Welcome back.',
        ctaLabel: 'New Campaign',
      }
  }
}

function Greeting() {
  const { user } = useAuth()
  const hour = new Date().getHours()
  let greeting = 'Good evening'
  if (hour < 12) greeting = 'Good morning'
  else if (hour < 17) greeting = 'Good afternoon'

  const displayName = user?.name || user?.phone || 'User'

  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div>
      <h1 className="font-display text-warm-black">
        {greeting}, {displayName}
      </h1>
      <p className="text-body-sm text-stone mt-1">{formattedDate}</p>
    </div>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const pageInfo = getPageInfo(location.pathname)
  const isDashboard = location.pathname === '/dashboard'

  return (
    <div className="min-h-[100dvh]">
      <Navbar />
      <div className="ml-[260px] min-h-[100dvh] flex flex-col">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-linen h-16 px-8 flex items-center justify-between shrink-0">
          {/* Left: Breadcrumb */}
          <div>
            {isDashboard ? (
              <Greeting />
            ) : (
              <div>
                <h1 className="text-h2 text-warm-black">{pageInfo.title}</h1>
                <p className="text-body-sm text-stone mt-0.5">{pageInfo.subtitle}</p>
              </div>
            )}
          </div>

          {/* Center: Search */}
          <div className="hidden lg:flex items-center gap-2 bg-cream rounded-lg px-3 py-2 w-[280px]">
            <Search size={16} className="text-stone shrink-0" />
            <input
              type="text"
              placeholder="Search campaigns, assets..."
              className="bg-transparent text-sm text-warm-black placeholder:text-stone/60 outline-none w-full"
            />
            <kbd className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-stone bg-white rounded border border-sand">
              CMD+K
            </kbd>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-stone hover:text-warm-black hover:bg-cream transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-caramel rounded-full" />
            </button>
            <button
              onClick={pageInfo.ctaAction || (() => {})}
              className="flex items-center gap-2 bg-caramel hover:bg-caramel/90 text-white text-sm font-medium px-4 py-2 rounded-button transition-all duration-150 active:scale-[0.98] shadow-xs"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">{pageInfo.ctaLabel}</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8 max-w-content mx-auto w-full">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  )
}
