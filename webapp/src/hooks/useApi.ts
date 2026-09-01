import {
  useQuery,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import {
  fetchMe,
  fetchCampaigns,
  fetchCampaign,
  fetchAnalytics,
  fetchSettings,
  updateSettings,
  fetchPlatformAccounts,
  connectPlatform,
  disconnectPlatform,
  setPrimaryAccount,
  toggleAccountActive,
  testPlatformConnection,
  fetchSubscription,
  fetchPlans,
  createOrder,
  verifyPayment,
  type Campaign,
  type AnalyticsData,
  type Settings,
  type PlatformAccount,
  type Subscription,
  type Plan,
} from '@/lib/api'

/* ────────────────────── auth ────────────────────── */

export { useAuth }

/* ────────────────────── campaigns ────────────────────── */

const campaignsKey = ['campaigns'] as const

export function useCampaigns(params?: { status?: string; platform?: string; search?: string }) {
  return useQuery({
    queryKey: [...campaignsKey, params],
    queryFn: () => fetchCampaigns(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['campaigns', id],
    queryFn: () => fetchCampaign(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  })
}

/* ────────────────────── analytics ────────────────────── */

export function useAnalytics(days = 30) {
  return useQuery({
    queryKey: ['analytics', days],
    queryFn: () => fetchAnalytics(days),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/* ────────────────────── settings ────────────────────── */

const settingsKey = ['settings'] as const

export function useSettings() {
  return useQuery({
    queryKey: settingsKey,
    queryFn: fetchSettings,
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKey })
      toast.success('Settings saved successfully')
    },
    onError: (err: any) => {
      toast.error('Failed to save settings', {
        description: err.response?.data?.message || 'Please try again.',
      })
    },
  })
}

/* ────────────────────── platform accounts ────────────────────── */

const platformAccountsKey = ['platformAccounts'] as const

export function usePlatformAccounts() {
  return useQuery({
    queryKey: platformAccountsKey,
    queryFn: fetchPlatformAccounts,
    staleTime: 1000 * 60 * 2,
  })
}

// Sentinel: the OAuth popup was dismissed without reporting a result, so we
// genuinely do not know whether the connection succeeded.
const OAUTH_WINDOW_CLOSED = '__oauth_window_closed__'

export function useConnectPlatform() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (platform: string) => {
      const { authUrl } = await connectPlatform(platform)
      // Open OAuth popup
      const width = 600
      const height = 700
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2

      const popup = window.open(
        authUrl,
        `connect_${platform}`,
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
      )

      if (!popup) {
        toast.error('Popup blocked', {
          description: 'Please allow popups for this site.',
        })
        throw new Error('Popup blocked')
      }

      // The callback popup posts back { type:'oauth', ok, message }. Resolve or
      // reject on that; fall back to popup-closed (manual close) as a safety net.
      return new Promise<void>((resolve, reject) => {
        let settled = false
        const cleanup = () => {
          settled = true
          window.removeEventListener('message', onMessage)
          clearInterval(checkClosed)
          clearTimeout(timeout)
        }
        const onMessage = (e: MessageEvent) => {
          const data = e.data as { type?: string; ok?: boolean; message?: string }
          if (data?.type !== 'oauth') return
          cleanup()
          try { popup.close() } catch { /* ignore */ }
          if (data.ok) resolve()
          else reject(new Error(data.message || 'Connection failed'))
        }
        window.addEventListener('message', onMessage)

        const checkClosed = setInterval(() => {
          if (popup.closed && !settled) {
            cleanup()
            // Do NOT resolve here. The callback page always postMessages its
            // result before closing, so reaching this branch means we never got
            // one — the window was dismissed, or the callback errored out. The
            // old code resolved, which fired the "Platform connected" toast for
            // connections that were never stored (the Facebook symptom).
            reject(new Error(OAUTH_WINDOW_CLOSED))
          }
        }, 500)

        const timeout = setTimeout(() => {
          if (!settled) {
            cleanup()
            try { popup.close() } catch { /* ignore */ }
            reject(new Error('Connection timed out'))
          }
        }, 5 * 60 * 1000)
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformAccountsKey })
      toast.success('Platform connected')
    },
    onError: (err: any) => {
      // Refetch regardless — a partial connect may still have stored the account.
      queryClient.invalidateQueries({ queryKey: platformAccountsKey })
      if (err.message === 'Popup blocked') return
      if (err.message === OAUTH_WINDOW_CLOSED) {
        toast.warning('Connection not confirmed', {
          description:
            'The authorization window closed before the platform confirmed it. Check the list below — if the account is not there, try connecting again.',
        })
        return
      }
      toast.error('Failed to connect platform', {
        description: err.message || err.response?.data?.message || 'Please try again.',
      })
    },
  })
}

export function useDisconnectPlatform() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: disconnectPlatform,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformAccountsKey })
      toast.success('Account disconnected')
    },
    onError: (err: any) => {
      toast.error('Failed to disconnect', {
        description: err.response?.data?.message || 'Please try again.',
      })
    },
  })
}

export function useSetPrimaryAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: setPrimaryAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformAccountsKey })
      toast.success('Primary account updated')
    },
    onError: (err: any) => {
      toast.error('Failed to update', {
        description: err.response?.data?.message || 'Please try again.',
      })
    },
  })
}

export function useToggleAccountActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ accountId, isActive }: { accountId: string; isActive: boolean }) =>
      toggleAccountActive(accountId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformAccountsKey })
    },
    onError: (err: any) => {
      toast.error('Failed to toggle account', {
        description: err.response?.data?.message || 'Please try again.',
      })
    },
  })
}

export function useTestConnection() {
  return useMutation({
    mutationFn: testPlatformConnection,
    onSuccess: (result) => {
      if (result.ok) {
        toast.success('Connection works', {
          description: result.detail ? `Reached ${result.detail}` : undefined,
        })
      } else {
        toast.error('Connection failed', {
          description: result.error || 'Token invalid or missing permissions.',
        })
      }
    },
    onError: (err: any) => {
      toast.error('Could not test connection', {
        description: err.response?.data?.message || 'Please try again.',
      })
    },
  })
}

/* ────────────────────── subscription ────────────────────── */

const subscriptionKey = ['subscription'] as const

export function useSubscription() {
  return useQuery({
    queryKey: subscriptionKey,
    queryFn: fetchSubscription,
    staleTime: 1000 * 60 * 5,
  })
}

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: fetchPlans,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: createOrder,
    onError: (err: any) => {
      toast.error('Failed to create order', {
        description: err.response?.data?.message || 'Please try again.',
      })
    },
  })
}

export function useVerifyPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: verifyPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKey })
      toast.success('Payment verified successfully')
    },
    onError: (err: any) => {
      toast.error('Payment verification failed', {
        description: err.response?.data?.message || 'Please contact support.',
      })
    },
  })
}

/* ────────────────────── user profile ────────────────────── */

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    staleTime: 1000 * 60 * 5,
    retry: false,
  })
}
