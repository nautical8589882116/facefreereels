import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Sparkles,
  Video,
  ImagePlus,
  CalendarDays,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Crown,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import PaymentModal from './PaymentModal'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  path: string
  icon: React.ElementType
  children?: { label: string; path: string }[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Ad Generator',
    path: '/ads',
    icon: Sparkles,
    children: [{ label: 'Generate Ad', path: '/ads/generate' }],
  },
  {
    label: 'Reel Generator',
    path: '/reels',
    icon: Video,
    children: [{ label: 'Generate Reel', path: '/reels/generate' }],
  },
  { label: 'Asset Hub', path: '/assets', icon: ImagePlus },
  { label: 'Scheduler', path: '/schedule', icon: CalendarDays },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
]

const bottomNavItems: NavItem[] = [
  { label: 'Settings', path: '/settings', icon: Settings },
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    return saved === 'true'
  })
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed))
  }, [collapsed])

  const isActivePath = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  const toggleSubmenu = (path: string) => {
    setExpandedMenus((prev) => ({ ...prev, [path]: !prev[path] }))
  }

  const handleNavClick = (item: NavItem) => {
    if (item.children && !collapsed) {
      toggleSubmenu(item.path)
    } else if (item.children) {
      navigate(item.children[0].path)
    } else {
      navigate(item.path)
    }
  }

  // Get user initials for avatar
  const getInitials = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase()
    }
    if (user?.phone) {
      return user.phone.slice(-10, -9).toUpperCase()
    }
    return 'U'
  }

  // Get display name
  const getDisplayName = () => {
    if (user?.name) return user.name
    if (user?.phone) return user.phone
    return 'User'
  }

  // Get display role/subtitle
  const getDisplayRole = () => {
    if (user?.subscription?.plan) {
      return `${user.subscription.plan.charAt(0).toUpperCase() + user.subscription.plan.slice(1)} Plan`
    }
    return user?.role === 'admin' ? 'Admin' : 'User'
  }

  return (
    <>
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen z-40 flex flex-col gradient-dark transition-all duration-300 ease-out',
          collapsed ? 'w-[72px]' : 'w-[260px]'
        )}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-warm-black/30 shrink-0">
          <img
            src="/nhyqr-logo.svg"
            alt="NHY-QR"
            className="w-9 h-9 shrink-0"
          />
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="text-caramel font-semibold text-sm truncate block">
                NHY-QR Ad Manager
              </span>
            </div>
          )}
        </div>

        {/* Main Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = isActivePath(item.path)
            const isExpanded = expandedMenus[item.path]

            return (
              <div key={item.path}>
                <button
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                    isActive
                      ? 'bg-caramel/15 text-caramel'
                      : 'text-linen hover:bg-espresso hover:text-white'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-caramel rounded-r-full" />
                  )}
                  <Icon
                    size={20}
                    className={cn(
                      'shrink-0',
                      isActive ? 'text-caramel' : 'text-stone group-hover:text-white'
                    )}
                  />
                  {!collapsed && (
                    <>
                      <span
                        className={cn(
                          'text-sm truncate flex-1 text-left',
                          isActive ? 'font-semibold' : 'font-medium'
                        )}
                      >
                        {item.label}
                      </span>
                      {item.children && (
                        <ChevronLeft
                          size={14}
                          className={cn(
                            'text-stone transition-transform duration-200 shrink-0',
                            isExpanded && '-rotate-90'
                          )}
                        />
                      )}
                    </>
                  )}
                </button>

                {/* Submenu */}
                {!collapsed && item.children && isExpanded && (
                  <div className="ml-8 mt-1 space-y-0.5">
                    {item.children.map((child) => {
                      const childActive = location.pathname === child.path
                      return (
                        <button
                          key={child.path}
                          onClick={() => navigate(child.path)}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                            childActive
                              ? 'text-caramel font-medium bg-caramel/10'
                              : 'text-stone hover:text-linen hover:bg-espresso'
                          )}
                        >
                          {child.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="px-3 pb-3 space-y-1 shrink-0">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const isActive = isActivePath(item.path)
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                  isActive
                    ? 'bg-caramel/15 text-caramel'
                    : 'text-linen hover:bg-espresso hover:text-white'
                )}
                title={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-caramel rounded-r-full" />
                )}
                <Icon
                  size={20}
                  className={cn(
                    'shrink-0',
                    isActive ? 'text-caramel' : 'text-stone group-hover:text-white'
                  )}
                />
                {!collapsed && (
                  <span
                    className={cn(
                      'text-sm',
                      isActive ? 'font-semibold' : 'font-medium'
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </button>
            )
          })}

          {/* Divider */}
          <div className="border-t border-warm-black/30 my-2" />

          {/* Upgrade Button (if no subscription) */}
          {isAuthenticated && !collapsed && !user?.subscription && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-caramel/20 text-caramel hover:bg-caramel/30 transition-all duration-200 mb-2"
            >
              <Crown size={16} className="shrink-0" />
              <span className="text-xs font-semibold">Upgrade Plan</span>
            </button>
          )}

          {/* User Profile */}
          <div
            className={cn(
              'flex items-center gap-3 px-2 py-2',
              collapsed && 'justify-center'
            )}
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-caramel/30 flex items-center justify-center shrink-0 ring-2 ring-caramel/30">
              {isAuthenticated ? (
                <span className="text-xs font-bold text-caramel">{getInitials()}</span>
              ) : (
                <User size={14} className="text-caramel" />
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {isAuthenticated ? getDisplayName() : 'Guest'}
                </p>
                <p className="text-xs text-stone truncate">
                  {isAuthenticated ? getDisplayRole() : 'Not logged in'}
                </p>
              </div>
            )}
            {!collapsed && isAuthenticated && (
              <button
                onClick={logout}
                className="p-1.5 rounded-md text-stone hover:text-white hover:bg-espresso transition-colors shrink-0"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-stone hover:text-linen hover:bg-espresso transition-all duration-200 mt-1"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          // Refresh user data after successful subscription
          window.location.reload()
        }}
      />
    </>
  )
}
