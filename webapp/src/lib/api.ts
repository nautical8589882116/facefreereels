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

// Same-origin by default: in production the Express server serves this SPA,
// so '/api' resolves to the same App Service. Dev uses the Vite proxy.
const API_URL = import.meta.env.VITE_API_URL || '/api'

function isUsableToken(token: string | null | undefined): token is string {
  return Boolean(token && token !== 'undefined' && token !== 'null')
}

function unwrapResponseData<T = Record<string, unknown>>(body: unknown): T {
  const responseBody = body as { data?: unknown }
  return (responseBody?.data || body) as T
}

function extractTokens(
  body: unknown,
  fallbackRefreshToken?: string
): { accessToken: string; refreshToken: string } {
  const data = unwrapResponseData<{
    accessToken?: string
    refreshToken?: string
    tokens?: {
      accessToken?: string
      refreshToken?: string
    }
  }>(body)

  const accessToken = data.tokens?.accessToken || data.accessToken
  const refreshToken = data.tokens?.refreshToken || data.refreshToken || fallbackRefreshToken

  if (!isUsableToken(accessToken) || !isUsableToken(refreshToken)) {
    throw new Error('Auth response did not include valid tokens')
  }

  return { accessToken, refreshToken }
}

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
    if (isUsableToken(token) && config.headers) {
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
      if (!isUsableToken(refreshToken)) {
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

        const { accessToken, refreshToken: newRefreshToken } = extractTokens(response.data, refreshToken)

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
  return unwrapResponseData(response.data)
}

export async function verifyOtp(phone: string, code: string, name?: string) {
  const response = await api.post('/auth/verify-otp', { phone, code, name })
  const data = unwrapResponseData<{
    user: User
    accessToken?: string
    refreshToken?: string
    tokens?: {
      accessToken?: string
      refreshToken?: string
    }
  }>(response.data)
  const tokens = extractTokens(response.data)

  return {
    tokens,
    user: data.user,
  } as {
    tokens: { accessToken: string; refreshToken: string }
    user: User
  }
}

export async function refreshToken(refreshToken: string) {
  const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
  return {
    tokens: extractTokens(response.data, refreshToken),
  } as {
    tokens: { accessToken: string; refreshToken: string }
  }
}

export async function fetchMe() {
  const response = await api.get('/auth/me')
  const data = unwrapResponseData<{ user: User }>(response.data)
  return data.user as User
}

export async function updateUserProfile(data: { name?: string; email?: string }) {
  const response = await api.put('/user/profile', data)
  const result = unwrapResponseData<{ user: User }>(response.data)
  return result.user
}

/* ────────────────────── assets API ────────────────────── */

export interface Asset {
  id: string
  name: string
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'SCREENSHOT' | 'QR_MOCKUP'
  url: string
  platform: 'INSTAGRAM' | 'FACEBOOK' | 'YOUTUBE' | null
  tags: string[]
  size: number
  dimensions: string | null
  mimeType: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

function normalizePaginatedResponse<T>(body: Record<string, unknown>): {
  data: T[]
  total: number
  page: number
  limit: number
} {
  const pagination = body.pagination as Record<string, number> | undefined
  return {
    data: (Array.isArray(body.data) ? body.data : []) as T[],
    total: Number(body.total ?? pagination?.total ?? 0),
    page: Number(body.page ?? pagination?.page ?? 1),
    limit: Number(body.limit ?? pagination?.limit ?? 10),
  }
}

export async function fetchAssets(params?: {
  page?: number
  limit?: number
  type?: string
  platform?: string
  search?: string
  sort?: string
}) {
  const response = await api.get('/assets', { params })
  return normalizePaginatedResponse<Asset>(response.data)
}

export async function uploadAsset(file: File, name?: string, platform?: string) {
  const formData = new FormData()
  formData.append('file', file)
  if (name) formData.append('name', name)
  if (platform) formData.append('platform', platform)
  const response = await api.post('/assets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data?.data || response.data
}

export async function deleteAsset(id: string) {
  const response = await api.delete(`/assets/${id}`)
  return response.data
}

/* ────────────────────── reels API ────────────────────── */

export interface Reel {
  id: string
  title: string
  script: string
  voice: string
  bgStyle: string
  bgValue: string | null
  captionStyle: Record<string, unknown> | null
  duration: number
  videoUrl: string | null
  thumbnailUrl: string | null
  status: 'DRAFT' | 'PROCESSING' | 'READY' | 'FAILED'
  createdAt: string
  updatedAt: string
}

export async function fetchReels(params?: {
  page?: number
  limit?: number
  status?: string
  search?: string
}) {
  const response = await api.get('/reels', { params })
  return normalizePaginatedResponse<Reel>(response.data)
}

export async function getReel(id: string) {
  const response = await api.get(`/reels/${id}`)
  return (response.data?.data || response.data) as Reel
}

export async function createReel(data: {
  title: string
  script: string
  voice?: string
  bgStyle?: string
  bgValue?: string | null
  captionStyle?: Record<string, unknown> | null
  duration?: number
}) {
  const response = await api.post('/reels', data)
  return (response.data?.data || response.data) as Reel
}

export async function updateReel(
  id: string,
  data: Partial<{
    title: string
    script: string
    voice: string
    bgStyle: string
    bgValue: string | null
    captionStyle: Record<string, unknown> | null
    duration: number
  }>
) {
  const response = await api.put(`/reels/${id}`, data)
  return (response.data?.data || response.data) as Reel
}

export async function generateReel(id: string) {
  const response = await api.post(`/reels/${id}/generate`)
  return (response.data?.data || response.data) as Reel
}

export async function deleteReel(id: string) {
  const response = await api.delete(`/reels/${id}`)
  return response.data
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

// Backend (DB) account shape — differs from the UI PlatformAccount shape below.
interface RawPlatformAccount {
  id: string
  platform: 'INSTAGRAM' | 'FACEBOOK' | 'YOUTUBE'
  accountName: string
  accountId: string
  profileUrl: string | null
  followerCount: number
  isActive: boolean
  isPrimary: boolean
  createdAt: string
}

export async function fetchPlatformAccounts() {
  const response = await api.get('/platforms')
  const raw = ((response.data?.data ?? response.data) as RawPlatformAccount[]) || []
  const accounts: PlatformAccount[] = (Array.isArray(raw) ? raw : []).map((a) => ({
    id: a.id,
    platform: a.platform.toLowerCase() as PlatformAccount['platform'],
    accountName: a.accountName,
    accountType: 'Business',
    connected: true,
    connectedDate: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '',
    followers: (a.followerCount ?? 0).toLocaleString(),
    isPrimary: a.isPrimary,
    isActive: a.isActive,
    permissions: [],
  }))
  return { accounts }
}

export async function connectPlatform(platform: string) {
  // The OAuth init endpoint is opened in a popup (a browser navigation), so it
  // cannot carry an Authorization header. Pass the short-lived access token as a
  // query param instead; the backend verifies it to resolve the user.
  const token = localStorage.getItem('accessToken')
  const authUrl = `${API_URL}/oauth/${platform}/auth?token=${encodeURIComponent(token ?? '')}`
  return { authUrl }
}

export async function disconnectPlatform(accountId: string) {
  const response = await api.delete(`/platforms/${accountId}`)
  return response.data
}

export async function setPrimaryAccount(accountId: string) {
  const response = await api.patch(`/platforms/${accountId}/primary`)
  return response.data
}

// Backend `/:id/toggle` flips the current active state (ignores any body).
export async function toggleAccountActive(accountId: string, _isActive: boolean) {
  const response = await api.patch(`/platforms/${accountId}/toggle`)
  return response.data
}

export interface ConnectionTestResult {
  ok: boolean
  platform: 'INSTAGRAM' | 'FACEBOOK' | 'YOUTUBE'
  detail?: string
  error?: string
}

export async function testPlatformConnection(accountId: string) {
  const response = await api.get(`/platforms/${accountId}/verify`)
  return (response.data?.data || response.data) as ConnectionTestResult
}

/* ────────────────────── scheduler API ────────────────────── */

export type ApiPlatform = 'INSTAGRAM' | 'FACEBOOK' | 'YOUTUBE'
export type ApiPostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED'

export interface ScheduledPostDTO {
  id: string
  campaignId: string | null
  platform: ApiPlatform
  content: string
  mediaUrls: string[]
  scheduledAt: string
  status: ApiPostStatus
  publishedAt: string | null
  engagement: Record<string, number> | null
  createdAt: string
  campaign?: { id: string; name: string } | null
}

export interface ScheduledPostInput {
  campaignId?: string
  platform: ApiPlatform
  content: string
  mediaUrls?: string[]
  scheduledAt: string
  status?: ApiPostStatus
}

export async function fetchScheduledPosts(params?: {
  page?: number
  limit?: number
  platform?: ApiPlatform
  status?: ApiPostStatus
  month?: number
  year?: number
}) {
  const response = await api.get('/scheduler/posts', { params })
  return normalizePaginatedResponse<ScheduledPostDTO>(response.data)
}

export async function createScheduledPost(data: ScheduledPostInput) {
  const response = await api.post('/scheduler/posts', data)
  return (response.data?.data || response.data) as ScheduledPostDTO
}

export async function updateScheduledPost(id: string, data: Partial<ScheduledPostInput>) {
  const response = await api.put(`/scheduler/posts/${id}`, data)
  return (response.data?.data || response.data) as ScheduledPostDTO
}

export async function deleteScheduledPost(id: string) {
  const response = await api.delete(`/scheduler/posts/${id}`)
  return response.data
}

export async function publishScheduledPost(id: string) {
  const response = await api.post(`/scheduler/posts/${id}/publish`)
  return (response.data?.data || response.data) as { post: ScheduledPostDTO }
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

/* ────────────────────── AI caption API ────────────────────── */

export async function generateAiCaption(instruction: string, platforms?: string[]) {
  const response = await api.post('/scheduler/posts/ai-caption', { instruction, platforms })
  return response.data.data.content as string
}

export default api
