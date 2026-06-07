import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { sendOtp, verifyOtp, fetchMe, type User } from '@/lib/api'

/* ────────────────────── types ────────────────────── */

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  needsOnboarding: boolean
}

interface AuthContextValue extends AuthState {
  login: (phone: string) => Promise<{ isNewUser?: boolean }>
  verifyOtp: (phone: string, code: string, name?: string) => Promise<{ needsOnboarding: boolean }>
  completeOnboarding: (phone: string, code: string, name: string) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
}

/* ────────────────────── context ────────────────────── */

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}

/* ────────────────────── provider ────────────────────── */

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check for stored token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const userData = await fetchMe()
        setUser(userData)
      } catch (err) {
        console.error('Failed to fetch user:', err)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  /* ── send OTP ── */
  const login = useCallback(async (phone: string) => {
    try {
      setIsLoading(true)
      const result = await sendOtp(phone)
      toast.success('OTP sent successfully', {
        description: `Check your phone ${phone} for the 6-digit code.`,
      })
      return result as { isNewUser?: boolean }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to send OTP'
      toast.error('Error', { description: message })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  /* ── verify OTP ── */
  const verifyOtpCallback = useCallback(async (phone: string, code: string, name?: string) => {
    try {
      setIsLoading(true)
      const data = await verifyOtp(phone, code, name)

      // If user is new and no name was provided, signal that onboarding is needed
      if (data.user.isNewUser && !name) {
        setNeedsOnboarding(true)
        return { needsOnboarding: true }
      }

      // Otherwise, log the user in
      localStorage.setItem('accessToken', data.tokens.accessToken)
      localStorage.setItem('refreshToken', data.tokens.refreshToken)
      setUser(data.user)
      setNeedsOnboarding(false)

      toast.success(data.user.isNewUser ? 'Welcome!' : 'Login successful', {
        description: data.user.isNewUser
          ? `Your account has been created, ${data.user.name || 'User'}!`
          : `Welcome back, ${data.user.name || 'User'}!`,
      })

      navigate('/dashboard')
      return { needsOnboarding: false }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Invalid OTP'
      toast.error('Verification failed', { description: message })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [navigate])

  /* ── complete onboarding (new user provides name) ── */
  const completeOnboarding = useCallback(async (phone: string, code: string, name: string) => {
    try {
      setIsLoading(true)
      const data = await verifyOtp(phone, code, name)

      localStorage.setItem('accessToken', data.tokens.accessToken)
      localStorage.setItem('refreshToken', data.tokens.refreshToken)
      setUser(data.user)
      setNeedsOnboarding(false)

      toast.success('Welcome!', {
        description: `Your account has been created, ${data.user.name || 'User'}!`,
      })

      navigate('/dashboard')
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to complete signup'
      toast.error('Signup failed', { description: message })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [navigate])

  /* ── logout ── */
  const logout = useCallback(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
    setNeedsOnboarding(false)
    toast.success('Logged out successfully')
    navigate('/login')
  }, [navigate])

  /* ── update user ── */
  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser)
  }, [])

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    needsOnboarding,
    login,
    verifyOtp: verifyOtpCallback,
    completeOnboarding,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
