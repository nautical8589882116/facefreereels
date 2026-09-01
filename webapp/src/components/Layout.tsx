import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Plus, Search } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { appConfig } from '@/lib/env'
import { pageVariants, springSoft, springIso } from '@/lib/motion'
import Navbar from './Navbar'
import Footer from './Footer'

interface PageInfo {
  title: string
  subtitle: string
  ctaLabel: string
}

function getPageInfo(pathname: string): PageInfo {
  switch (true) {
    case pathname === '/dashboard':
      return { title: 'Dashboard', subtitle: 'A clear view of campaign momentum.', ctaLabel: 'New campaign' }
    case pathname.startsWith('/ads'):
      return { title: 'Ad Generator', subtitle: 'Compose platform-ready ad copy with a focused brief.', ctaLabel: 'Generate ad' }
    case pathname.startsWith('/reels'):
      return { title: 'Reel Generator', subtitle: 'Build face-free short videos from reusable assets.', ctaLabel: 'Create reel' }
    case pathname === '/assets':
      return { title: 'Asset Hub', subtitle: 'Organize reusable visuals and campaign media.', ctaLabel: 'Upload asset' }
    case pathname === '/schedule':
      return { title: 'Scheduler', subtitle: 'Plan posts across every connected channel.', ctaLabel: 'Schedule post' }
    case pathname === '/analytics':
      return { title: 'Analytics', subtitle: 'Track spend, reach, and conversion signals.', ctaLabel: 'Export report' }
    case pathname === '/settings':
      return { title: 'Settings', subtitle: 'Tune brand, product, and platform defaults.', ctaLabel: 'Save changes' }
    case pathname.startsWith('/campaigns/'):
      return { title: 'Campaign Detail', subtitle: 'Review copy, schedule, and performance.', ctaLabel: 'Edit campaign' }
    default:
      return { title: appConfig.appName, subtitle: 'Welcome back.', ctaLabel: 'Create' }
  }
}

function Greeting() {
  const { user } = useAuth()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const hour = time.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const displayName = user?.name || user?.phone || 'User'

  return (
    <div className="min-w-0">
      <p className="text-caption font-medium uppercase tracking-[0.14em] text-stone">Today</p>
      <h1 className="truncate text-h2 text-warm-black">
        {greeting}, {displayName}
      </h1>
    </div>
  )
}

/* Faint, fixed ambient depth layer — gives the white canvas air without clutter */
function AmbientCanvas() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.10),transparent_62%)] blur-2xl" />
      <div className="absolute -bottom-32 -right-24 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.08),transparent_62%)] blur-2xl" />
      <div
        className="absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(15,23,42,0.035) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(ellipse at 50% 0%, black, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black, transparent 75%)',
        }}
      />
    </div>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const pageInfo = getPageInfo(location.pathname)
  const isDashboard = location.pathname === '/dashboard'

  return (
    <div className="relative min-h-[100dvh] text-warm-black">
      <AmbientCanvas />
      <Navbar />

      <div className="min-h-[100dvh] transition-[margin] duration-300 md:ml-[var(--sidebar-width)]">
        {/* Floating glass header */}
        <div className="sticky top-0 z-30 px-3 pt-3 md:px-6 md:pt-4">
          <motion.header
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSoft}
            className="mx-auto flex h-16 w-full max-w-content items-center justify-between gap-3 rounded-2xl glass-strong px-3 shadow-glass md:h-[68px] md:px-5"
          >
            {isDashboard ? (
              <Greeting />
            ) : (
              <div className="min-w-0">
                <p className="text-caption font-medium uppercase tracking-[0.14em] text-stone">{appConfig.appName}</p>
                <h1 className="truncate text-h2 text-warm-black">{pageInfo.title}</h1>
                <p className="hidden text-body-sm text-stone sm:block">{pageInfo.subtitle}</p>
              </div>
            )}

            <div className="hidden min-w-[220px] max-w-sm flex-1 items-center gap-2 rounded-button border border-white/60 bg-white/60 px-3 py-2 shadow-xs transition focus-within:ring-accent-soft lg:flex">
              <Search size={16} className="shrink-0 text-stone" />
              <input
                type="text"
                placeholder="Search campaigns"
                aria-label="Search campaigns"
                className="w-full bg-transparent text-sm text-warm-black outline-none placeholder:text-stone/60"
              />
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.94 }}
                aria-label="Notifications"
                className="relative rounded-button border border-white/60 bg-white/70 p-2 text-stone shadow-xs transition-colors hover:text-warm-black"
              >
                <Bell size={19} />
                <span className="absolute right-2 top-2 size-2 rounded-full bg-[var(--app-accent)] ring-2 ring-white" />
              </motion.button>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={springIso}
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-button bg-[var(--app-accent)] px-3.5 text-sm font-semibold text-white shadow-accent-glow"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">{pageInfo.ctaLabel}</span>
              </motion.button>
            </div>
          </motion.header>
        </div>

        <main className="mx-auto w-full max-w-content px-4 py-6 pb-28 md:px-8 md:py-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer />
      </div>
    </div>
  )
}
