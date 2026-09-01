import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Crown,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  User,
  Video,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { appConfig, appInitials } from '@/lib/env'
import { cn } from '@/lib/utils'
import { springSoft, springIso, slideRightItem, staggerContainer } from '@/lib/motion'
import PaymentModal from './PaymentModal'

interface NavItem {
  label: string
  path: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Ad Generator', path: '/ads/generate', icon: Sparkles },
  { label: 'Reel Generator', path: '/reels/generate', icon: Video },
  { label: 'Asset Hub', path: '/assets', icon: ImagePlus },
  { label: 'Scheduler', path: '/schedule', icon: CalendarDays },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
]

const bottomNavItems: NavItem[] = [{ label: 'Settings', path: '/settings', icon: Settings }]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true')
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed))
    document.documentElement.style.setProperty('--sidebar-width', collapsed ? '88px' : '272px')
  }, [collapsed])

  const isActivePath = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname === path || location.pathname.startsWith(path.replace('/generate', ''))
  }

  const initials = (() => {
    if (user?.name) return user.name.charAt(0).toUpperCase()
    if (user?.phone) return user.phone.slice(-10, -9).toUpperCase()
    return 'U'
  })()

  const displayName = user?.name || user?.phone || 'Guest'
  const displayRole = user?.subscription?.plan
    ? `${user.subscription.plan.charAt(0).toUpperCase()}${user.subscription.plan.slice(1)} plan`
    : user?.role === 'admin'
      ? 'Admin'
      : 'Workspace user'

  const NavButton = ({ item, pillId }: { item: NavItem; pillId: string }) => {
    const Icon = item.icon
    const isActive = isActivePath(item.path)
    return (
      <motion.button
        variants={slideRightItem}
        onClick={() => navigate(item.path)}
        whileHover={{ x: collapsed ? 0 : 3 }}
        whileTap={{ scale: 0.97 }}
        transition={springIso}
        className={cn(
          'group relative flex h-11 w-full cursor-pointer items-center gap-3 rounded-button px-3 text-sm font-medium',
          collapsed && 'justify-center px-0',
          isActive ? 'text-warm-black' : 'text-stone hover:text-warm-black',
        )}
        title={collapsed ? item.label : undefined}
      >
        {isActive && (
          <motion.span
            layoutId={pillId}
            transition={springSoft}
            className="absolute inset-0 -z-0 rounded-button bg-peach shadow-[inset_0_0_0_1px_rgba(124,58,237,0.14)]"
          />
        )}
        <Icon
          size={19}
          className={cn('relative z-10 shrink-0 transition-colors', isActive ? 'text-[var(--app-accent)]' : 'group-hover:text-warm-black')}
        />
        {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}
      </motion.button>
    )
  }

  return (
    <>
      {/* ── Desktop glass sidebar ───────────────────────────────────── */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-white/50 glass-panel transition-[width] duration-300 md:flex',
          collapsed ? 'w-[88px]' : 'w-[272px]',
        )}
      >
        <div className="flex h-20 items-center gap-3 px-5">
          <motion.div
            whileHover={{ rotate: -6, scale: 1.06 }}
            transition={springIso}
            className="flex size-10 shrink-0 items-center justify-center rounded-2xl gradient-violet text-sm font-bold text-white shadow-accent-glow"
          >
            {appInitials()}
          </motion.div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-warm-black">{appConfig.appName}</p>
              <p className="text-caption text-stone">Creative workspace</p>
            </div>
          )}
        </div>

        <motion.nav
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex-1 space-y-1 overflow-y-auto px-3 py-2 scrollbar-thin"
        >
          {navItems.map((item) => (
            <NavButton key={item.path} item={item} pillId="navPillTop" />
          ))}
        </motion.nav>

        <div className="space-y-2 border-t border-linen p-3">
          {bottomNavItems.map((item) => (
            <NavButton key={item.path} item={item} pillId="navPillBottom" />
          ))}

          {isAuthenticated && !user?.subscription && !collapsed && (
            <motion.button
              onClick={() => setShowPaymentModal(true)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={springIso}
              className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-button bg-warm-black px-3 text-sm font-semibold text-white shadow-lift transition-colors hover:bg-graphite"
            >
              <Crown size={16} className="text-amber-300" />
              Upgrade plan
            </motion.button>
          )}

          <div className={cn('flex items-center gap-3 rounded-card bg-white/60 p-2 shadow-xs', collapsed && 'justify-center')}>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-warm-black shadow-xs">
              {isAuthenticated ? initials : <User size={16} />}
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-warm-black">{displayName}</p>
                  <p className="truncate text-caption text-stone">{isAuthenticated ? displayRole : 'Not logged in'}</p>
                </div>
                {isAuthenticated && (
                  <button
                    onClick={logout}
                    className="cursor-pointer rounded-lg p-2 text-stone transition-colors hover:bg-danger-light hover:text-danger"
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                )}
              </>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-button text-stone transition-colors hover:bg-cream hover:text-warm-black"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed && <span className="text-caption font-medium">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* ── Mobile floating glass dock ──────────────────────────────── */}
      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-6 gap-1 rounded-2xl glass-strong px-2 py-2 shadow-glass md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = isActivePath(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'relative flex cursor-pointer flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] transition-colors',
                isActive ? 'text-[var(--app-accent)]' : 'text-stone',
              )}
            >
              {isActive && (
                <motion.span layoutId="dockPill" transition={springSoft} className="absolute inset-0 -z-0 rounded-xl bg-peach" />
              )}
              <Icon size={18} className="relative z-10" />
              <span className="relative z-10 max-w-full truncate">{item.label.split(' ')[0]}</span>
            </button>
          )
        })}
      </nav>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => window.location.reload()}
      />
    </>
  )
}
