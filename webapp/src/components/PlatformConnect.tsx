import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Instagram,
  Facebook,
  Youtube,
  Check,
  X,
  Plus,
  Star,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Loader2,
  UserCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  usePlatformAccounts,
  useConnectPlatform,
  useDisconnectPlatform,
  useSetPrimaryAccount,
  useToggleAccountActive,
} from '@/hooks/useApi'
import { cn } from '@/lib/utils'

/* ────────────────────── types ────────────────────── */

type Platform = 'instagram' | 'facebook' | 'youtube'

interface PlatformConfig {
  id: Platform
  name: string
  icon: React.ElementType
  color: string
  bgColor: string
  lightColor: string
  oauthUrl: string
}

const platforms: PlatformConfig[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: '#E4405F',
    bgColor: 'bg-[#E4405F]',
    lightColor: 'bg-[#E4405F]/10',
    oauthUrl: '/api/platforms/instagram/connect',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: '#1877F2',
    bgColor: 'bg-[#1877F2]',
    lightColor: 'bg-[#1877F2]/10',
    oauthUrl: '/api/platforms/facebook/connect',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: '#FF0000',
    bgColor: 'bg-[#FF0000]',
    lightColor: 'bg-[#FF0000]/10',
    oauthUrl: '/api/platforms/youtube/connect',
  },
]

/* ────────────────────── account card ────────────────────── */

function AccountCard({
  account,
  platformColor,
  onToggleActive,
  onSetPrimary,
  onDisconnect,
  isToggling,
  isSettingPrimary,
  isDisconnecting,
}: {
  account: {
    id: string
    accountName: string
    accountType: string
    connectedDate: string
    followers: string
    isPrimary: boolean
    isActive: boolean
    permissions: { name: string; granted: boolean }[]
  }
  platformColor: string
  onToggleActive: () => void
  onSetPrimary: () => void
  onDisconnect: () => void
  isToggling: boolean
  isSettingPrimary: boolean
  isDisconnecting: boolean
}) {
  const [showPermissions, setShowPermissions] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      className={cn(
        'rounded-xl border p-4 transition-all',
        account.isActive ? 'border-linen bg-white' : 'border-sand/50 bg-cream/30 opacity-70'
      )}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${platformColor}15` }}
        >
          {account.accountName ? (
            <span
              className="text-sm font-bold"
              style={{ color: platformColor }}
            >
              {account.accountName.charAt(0).toUpperCase()}
            </span>
          ) : (
            <UserCircle size={22} style={{ color: platformColor }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-warm-black truncate">
              {account.accountName}
            </p>
            {account.isPrimary && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-caramel/15 text-caramel text-[10px] font-semibold shrink-0">
                <Star size={8} /> Primary
              </span>
            )}
          </div>
          <p className="text-xs text-stone mt-0.5">
            {account.accountType} · {account.followers} followers
          </p>
          <p className="text-xs text-stone">
            Connected {account.connectedDate}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Toggle */}
          <button
            onClick={onToggleActive}
            disabled={isToggling}
            className="transition-opacity disabled:opacity-50"
            title={account.isActive ? 'Deactivate' : 'Activate'}
          >
            {account.isActive ? (
              <ToggleRight size={28} style={{ color: platformColor }} />
            ) : (
              <ToggleLeft size={28} className="text-sand" />
            )}
          </button>

          {/* Set Primary */}
          {!account.isPrimary && account.isActive && (
            <button
              onClick={onSetPrimary}
              disabled={isSettingPrimary}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-sand text-stone hover:text-caramel hover:border-caramel transition-colors disabled:opacity-50"
              title="Set as primary"
            >
              {isSettingPrimary ? <Loader2 size={12} className="animate-spin" /> : 'Primary'}
            </button>
          )}

          {/* Disconnect */}
          <button
            onClick={onDisconnect}
            disabled={isDisconnecting}
            className="p-1.5 rounded-lg text-stone hover:text-danger hover:bg-danger-light transition-colors disabled:opacity-50"
            title="Disconnect"
          >
            {isDisconnecting ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
          </button>
        </div>
      </div>

      {/* Permissions Toggle */}
      <button
        onClick={() => setShowPermissions(!showPermissions)}
        className="mt-3 text-xs text-stone hover:text-warm-black transition-colors"
      >
        {showPermissions ? 'Hide' : 'Show'} permissions ({account.permissions.filter(p => p.granted).length}/{account.permissions.length})
      </button>

      <AnimatePresence>
        {showPermissions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-linen">
              {account.permissions.map((perm) => (
                <span
                  key={perm.name}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
                    perm.granted
                      ? 'bg-success-light text-success'
                      : 'bg-sand/40 text-stone'
                  )}
                >
                  <Check size={10} />
                  {perm.name}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ────────────────────── platform section ────────────────────── */

function PlatformSection({ config }: { config: PlatformConfig }) {
  const { data: accountsData, isLoading } = usePlatformAccounts()
  const accounts = accountsData?.accounts.filter((a) => a.platform === config.id) || []
  const connectedCount = accounts.filter((a) => a.connected).length

  const connectMutation = useConnectPlatform()
  const disconnectMutation = useDisconnectPlatform()
  const setPrimaryMutation = useSetPrimaryAccount()
  const toggleActiveMutation = useToggleAccountActive()

  const Icon = config.icon

  const handleConnect = () => {
    connectMutation.mutate(config.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-linen p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn('w-11 h-11 rounded-full flex items-center justify-center', config.lightColor)}
          >
            <Icon size={22} style={{ color: config.color }} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-warm-black">{config.name}</h3>
            <p className="text-xs text-stone">
              {connectedCount > 0 ? `${connectedCount} account${connectedCount > 1 ? 's' : ''} connected` : 'No accounts connected'}
            </p>
          </div>
        </div>

        <button
          onClick={handleConnect}
          disabled={connectMutation.isPending}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            connectMutation.isPending
              ? 'bg-sand text-stone cursor-wait'
              : 'text-white hover:opacity-90 active:scale-[0.98] shadow-sm'
          )}
          style={{ backgroundColor: connectMutation.isPending ? undefined : config.color }}
        >
          {connectMutation.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
          Connect{connectedCount > 0 ? ' Another' : ''}
        </button>
      </div>

      {/* Connected Accounts List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-cream/50 animate-pulse" />
          ))}
        </div>
      ) : connectedCount > 0 ? (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {accounts
              .filter((a) => a.connected)
              .map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  platformColor={config.color}
                  onToggleActive={() =>
                    toggleActiveMutation.mutate({
                      accountId: account.id,
                      isActive: !account.isActive,
                    })
                  }
                  onSetPrimary={() => setPrimaryMutation.mutate(account.id)}
                  onDisconnect={() => {
                    if (window.confirm(`Disconnect ${account.accountName}?`)) {
                      disconnectMutation.mutate(account.id)
                    }
                  }}
                  isToggling={
                    toggleActiveMutation.isPending && toggleActiveMutation.variables?.accountId === account.id
                  }
                  isSettingPrimary={
                    setPrimaryMutation.isPending && setPrimaryMutation.variables === account.id
                  }
                  isDisconnecting={
                    disconnectMutation.isPending && disconnectMutation.variables === account.id
                  }
                />
              ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-8 bg-cream/30 rounded-xl border border-dashed border-sand">
          <Icon size={32} className="text-sand mx-auto mb-2" />
          <p className="text-sm text-stone mb-1">No {config.name} accounts connected</p>
          <p className="text-xs text-stone">
            Connect your {config.name} account to start publishing
          </p>
        </div>
      )}
    </motion.div>
  )
}

/* ────────────────────── main component ────────────────────── */

export default function PlatformConnect() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-warm-black">Connected Platforms</h3>
          <p className="text-sm text-stone mt-0.5">
            Manage your social media accounts and publishing permissions
          </p>
        </div>
      </div>

      {platforms.map((platform) => (
        <PlatformSection key={platform.id} config={platform} />
      ))}

      {/* Info Card */}
      <div className="bg-info-light rounded-xl border border-info/20 p-4 flex items-start gap-3">
        <ExternalLink size={16} className="text-info shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-info">How connection works</p>
          <p className="text-xs text-info/80 mt-1 leading-relaxed">
            Clicking "Connect" will open a secure OAuth popup where you authorize this app to publish content on your behalf. You can revoke access at any time from your platform settings or by clicking "Disconnect" here.
          </p>
        </div>
      </div>
    </div>
  )
}
