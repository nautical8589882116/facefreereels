import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

/* ────────────────────── types ────────────────────── */

export interface User {
  id: string
  phone: string
  name: string | null
  email: string | null
  role: 'user' | 'admin'
  isNewUser: boolean
  subscription: Subscription | null
  createdAt: string
}

export interface Subscription {
  id: string
  plan: 'starter' | 'professional' | 'enterprise'
  status: 'active' | 'cancelled' | 'expired'
  expiresAt: string
  razorpaySubscriptionId: string | null
}

export interface Campaign {
  id: string
  name: string
  platforms: string[]
  objective: string
  status: 'draft' | 'scheduled' | 'published' | 'paused' | 'cancelled'
  spend: number
  views: number | null
  ctr: number | null
  image: string | null
  createdAt: string
  updatedAt: string
}

export interface AnalyticsData {
  dates: string[]
  spend: number[]
  views: number[]
  leads: number[]
  ctr: number[]
  platformBreakdown: {
    instagram: number
    facebook: number
    youtube: number
  }
  kpi: {
    totalSpend: number
    totalViews: number
    totalLeads: number
    avgCtr: number
    spendTrend: string
    viewsTrend: string
    leadsTrend: string
    ctrTrend: string
  }
}

export interface PlatformAccount {
  id: string
  platform: 'instagram' | 'facebook' | 'youtube'
  accountName: string
  accountType: string
  connected: boolean
  connectedDate: string
  followers: string
  isPrimary: boolean
  isActive: boolean
  permissions: { name: string; granted: boolean }[]
}

export interface Settings {
  productName: string
  productTagline: string
  productDescription: string
  features: { id: string; name: string; description: string }[]
  pricingTiers: {
    id: string
    name: string
    price: string
    features: string[]
    highlighted: boolean
  }[]
  audienceTags: string[]
  competitorTags: string[]
  uvp: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  brandVoice: {
    professionalCasual: number
    formalFriendly: number
    technicalSimple: number
    seriousPlayful: number
  }
  forbiddenWords: string[]
  adObjective: string
  creativityLevel: number
  defaultPlatforms: { instagram: boolean; facebook: boolean; youtube: boolean }
  hashtagCount: number
  alwaysInclude: string
  avoidText: string
  useEmojis: boolean
  ctaPreference: string
  language: string
  copyLength: string
}

/* ────────────────────── axios instance ────────────────────── */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

/* ─────────── request interceptor: attach auth token ─────────── */

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/* ─────────── response interceptor: handle 401 + refresh ─────────── */

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken')

      // No refresh token — redirect to login
      if (!refreshToken) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/#/login'
        return Promise.reject(error)
      }

      // Already refreshing — queue this request
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            resolve(api(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        })

        const { accessToken, refreshToken: newRefreshToken } = response.data.tokens

        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
        }

        onRefreshed(accessToken)
        isRefreshing = false

        return api(originalRequest)
      } catch (refreshError) {
        isRefreshing = false
        refreshSubscribers = []
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/#/login'
        return Promise.reject(refreshError)
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error — is the backend running?', error)
    }

    return Promise.reject(error)
  }
)

/* ────────────────────── auth API ────────────────────── */

export async function sendOtp(phone: string) {
  const response = await api.post('/auth/send-otp', { phone })
  return response.data
}

export async function verifyOtp(phone: string, code: string, name?: string) {
  const response = await api.post('/auth/verify-otp', { phone, code, name })
  return response.data as {
    tokens: { accessToken: string; refreshToken: string }
    user: User
  }
}

export async function refreshToken(refreshToken: string) {
  const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
  return response.data as {
    tokens: { accessToken: string; refreshToken: string }
  }
}

export async function fetchMe() {
  const response = await api.get('/auth/me')
  return response.data.user as User
}

/* ────────────────────── campaigns API ────────────────────── */

export async function fetchCampaigns(params?: { status?: string; platform?: string; search?: string }) {
  const response = await api.get('/campaigns', { params })
  return response.data as { campaigns: Campaign[]; total: number }
}

export async function fetchCampaign(id: string) {
  const response = await api.get(`/campaigns/${id}`)
  return response.data as { campaign: Campaign }
}

export async function createCampaign(data: Partial<Campaign>) {
  const response = await api.post('/campaigns', data)
  return response.data
}

export async function updateCampaign(id: string, data: Partial<Campaign>) {
  const response = await api.patch(`/campaigns/${id}`, data)
  return response.data
}

export async function deleteCampaign(id: string) {
  const response = await api.delete(`/campaigns/${id}`)
  return response.data
}

/* ────────────────────── analytics API ────────────────────── */

export async function fetchAnalytics(days = 30) {
  const response = await api.get('/analytics', { params: { days } })
  return response.data as AnalyticsData
}

/* ────────────────────── settings API ────────────────────── */

export async function fetchSettings() {
  const response = await api.get('/settings')
  return response.data as { settings: Settings }
}

export async function updateSettings(data: Partial<Settings>) {
  const response = await api.patch('/settings', data)
  return response.data
}

/* ────────────────────── platform accounts API ────────────────────── */

export async function fetchPlatformAccounts() {
  const response = await api.get('/platforms/accounts')
  return response.data as { accounts: PlatformAccount[] }
}

export async function connectPlatform(platform: string) {
  const response = await api.get(`/platforms/${platform}/connect`)
  return response.data as { authUrl: string }
}

export async function disconnectPlatform(accountId: string) {
  const response = await api.delete(`/platforms/accounts/${accountId}`)
  return response.data
}

export async function setPrimaryAccount(accountId: string) {
  const response = await api.patch(`/platforms/accounts/${accountId}/primary`)
  return response.data
}

export async function toggleAccountActive(accountId: string, isActive: boolean) {
  const response = await api.patch(`/platforms/accounts/${accountId}/active`, { isActive })
  return response.data
}

/* ────────────────────── payments API ────────────────────── */

export interface Plan {
  id: string
  name: string
  price: number
  priceFormatted: string
  features: string[]
  highlighted: boolean
  razorpayPlanId: string
}

export async function fetchPlans() {
  const response = await api.get('/payments/plans')
  return response.data as { plans: Plan[] }
}

export async function fetchSubscription() {
  const response = await api.get('/payments/subscription')
  return response.data as { subscription: Subscription | null }
}

export async function createOrder(planId: string) {
  const response = await api.post('/payments/create-order', { planId })
  return response.data as {
    order: {
      id: string
      amount: number
      currency: string
    }
  }
}

export async function verifyPayment(data: {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
  planId: string
}) {
  const response = await api.post('/payments/verify', data)
  return response.data
}

export default api
