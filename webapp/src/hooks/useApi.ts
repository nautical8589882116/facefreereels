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

export function useConnectPlatform() {
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

      return new Promise<void>((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed)
            resolve()
          }
        }, 500)

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed)
          popup.close()
          reject(new Error('Connection timeout'))
        }, 5 * 60 * 1000)
      })
    },
    onSuccess: () => {
      toast.success('Platform connected successfully')
    },
    onError: (err: any) => {
      if (err.message !== 'Popup blocked') {
        toast.error('Failed to connect platform', {
          description: err.response?.data?.message || 'Please try again.',
        })
      }
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
