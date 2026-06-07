import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Smartphone,
  ArrowRight,
  Check,
  Loader2,
  Shield,
  Sparkles,
  Zap,
  Globe,
  BarChart3,
  UserCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

/* ────────────────────── steps enum ────────────────────── */

type LoginStep = 'phone' | 'otp' | 'name'

/* ────────────────────── component ────────────────────── */

export default function Login() {
  const navigate = useNavigate()
  const { login, verifyOtp, completeOnboarding, isAuthenticated, isLoading: authLoading } = useAuth()

  const [step, setStep] = useState<LoginStep>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpTimer, setOtpTimer] = useState(0)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // OTP countdown timer
  useEffect(() => {
    if (otpTimer <= 0) return
    const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000)
    return () => clearInterval(interval)
  }, [otpTimer])

  /* ── format phone number ── */
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 5) return digits
    if (digits.length <= 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`
    return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`
  }

  const getRawPhone = (value: string) => value.replace(/\D/g, '')

  /* ── validate Indian phone ── */
  const isValidIndianPhone = (digits: string) => {
    return digits.length === 10 && /^[6-9]/.test(digits)
  }

  /* ── send OTP ── */
  const handleSendOtp = async () => {
    setError('')
    const digits = getRawPhone(phone)
    if (!isValidIndianPhone(digits)) {
      setError('Please enter a valid 10-digit Indian mobile number')
      return
    }
    try {
      setIsLoading(true)
      await login(`+91${digits}`)
      setStep('otp')
      setOtpTimer(30)
    } catch {
      // error handled in login()
    } finally {
      setIsLoading(false)
    }
  }

  /* ── verify OTP ── */
  const handleVerifyOtp = async () => {
    setError('')
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP')
      return
    }
    const digits = getRawPhone(phone)
    try {
      setIsLoading(true)
      const result = await verifyOtp(`+91${digits}`, otp)
      if (result.needsOnboarding) {
        setStep('name')
        setIsLoading(false)
      }
      // If !needsOnboarding, the context navigates to /dashboard
    } catch {
      setIsLoading(false)
    }
  }

  /* ── complete onboarding (new user with name) ── */
  const handleCompleteOnboarding = async () => {
    setError('')
    if (!name.trim()) {
      setError('Please enter your name to continue')
      return
    }
    const digits = getRawPhone(phone)
    try {
      setIsLoading(true)
      await completeOnboarding(`+91${digits}`, otp, name.trim())
      // navigates to /dashboard on success
    } catch {
      setIsLoading(false)
    }
  }

  /* ── resend OTP ── */
  const handleResendOtp = async () => {
    if (otpTimer > 0) return
    setError('')
    const digits = getRawPhone(phone)
    try {
      setIsLoading(true)
      await login(`+91${digits}`)
      setOtpTimer(30)
      setOtp('')
      toast.success('OTP resent successfully')
    } catch {
      // handled
    } finally {
      setIsLoading(false)
    }
  }

  /* ── handle OTP input ── */
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newOtp = otp.split('')
    newOtp[index] = digit
    const joined = newOtp.join('').slice(0, 6)
    setOtp(joined)
    setError('')

    // Auto-focus next input
    if (digit && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  /* ── features list ── */
  const features = [
    { icon: Sparkles, text: 'AI-powered ad generation' },
    { icon: Zap, text: 'Automated campaign scheduling' },
    { icon: Globe, text: 'Multi-platform publishing' },
    { icon: BarChart3, text: 'Real-time analytics' },
  ]

  return (
    <div className="min-h-[100dvh] flex">
      {/* ─────────── Left: Branding Panel ─────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] gradient-dark relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-caramel blur-[128px]" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-caramel blur-[128px]" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <img src="/nhyqr-logo.svg" alt="NHY-QR" className="w-12 h-12" />
              <div>
                <h2 className="text-caramel font-semibold text-lg">NHY-QR</h2>
                <p className="text-stone text-sm">Ad Manager</p>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-[2.75rem] xl:text-[3.25rem] font-bold text-white leading-[1.1] tracking-tight mb-6">
              Advertise smarter.
              <br />
              <span className="text-caramel">Grow faster.</span>
            </h1>
            <p className="text-lg text-stone leading-relaxed max-w-md">
              Create, schedule, and manage AI-powered ad campaigns across Instagram, Facebook, and YouTube — all in one place.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 max-w-md">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.text}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 text-linen/90"
                >
                  <div className="w-9 h-9 rounded-lg bg-caramel/20 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-caramel" />
                  </div>
                  <span className="text-sm">{f.text}</span>
                </motion.div>
              )
            })}
          </div>

          {/* Bottom stats */}
          <div className="flex items-center gap-8 text-linen/70">
            <div>
              <p className="text-2xl font-bold text-white">10K+</p>
              <p className="text-sm">Campaigns Created</p>
            </div>
            <div className="w-px h-10 bg-warm-black/50" />
            <div>
              <p className="text-2xl font-bold text-white">500+</p>
              <p className="text-sm">Active Users</p>
            </div>
            <div className="w-px h-10 bg-warm-black/50" />
            <div>
              <p className="text-2xl font-bold text-white">3</p>
              <p className="text-sm">Platforms</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────── Right: Login Form ─────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-cream">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img src="/nhyqr-logo.svg" alt="NHY-QR" className="w-10 h-10" />
            <div>
              <h2 className="text-caramel font-semibold">NHY-QR Ad Manager</h2>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* ───── Step 1: Phone Input ───── */}
            {step === 'phone' && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-warm-black mb-2">Welcome back</h2>
                  <p className="text-stone">Enter your phone number to sign in</p>
                </div>

                <div className="space-y-4">
                  {/* Phone Input */}
                  <div>
                    <label className="block text-sm font-medium text-warm-black mb-2">
                      Mobile Number
                    </label>
                    <div className="flex items-center gap-2 bg-white border border-sand rounded-lg px-3 py-2.5 focus-within:border-caramel focus-within:ring-2 focus-within:ring-caramel/20 transition-all">
                      <span className="text-sm text-stone font-medium shrink-0 select-none">+91</span>
                      <Smartphone size={16} className="text-stone shrink-0" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(formatPhone(getRawPhone(e.target.value)))
                          setError('')
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendOtp()
                        }}
                        placeholder="98765 43210"
                        maxLength={11}
                        autoFocus
                        className="flex-1 bg-transparent text-sm text-warm-black placeholder:text-stone/50 outline-none font-mono"
                      />
                    </div>
                    {error && (
                      <p className="text-xs text-danger mt-1.5 flex items-center gap-1">
                        <Shield size={12} /> {error}
                      </p>
                    )}
                    <p className="text-xs text-stone mt-2">
                      We'll send a 6-digit OTP to verify your number.
                    </p>
                  </div>

                  {/* Send OTP Button */}
                  <button
                    onClick={handleSendOtp}
                    disabled={isLoading}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isLoading
                        ? 'bg-sand text-stone cursor-not-allowed'
                        : 'bg-caramel text-white hover:bg-caramel/90 active:scale-[0.98] shadow-sm'
                    )}
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        Send OTP <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ───── Step 2: OTP Input ───── */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-warm-black mb-2">Verify your number</h2>
                  <p className="text-stone">
                    We've sent a 6-digit code to{' '}
                    <span className="font-mono font-medium text-warm-black">+91 {phone}</span>
                  </p>
                </div>

                <div className="space-y-5">
                  {/* OTP Inputs */}
                  <div>
                    <label className="block text-sm font-medium text-warm-black mb-3">
                      Enter OTP
                    </label>
                    <div className="flex items-center justify-center gap-2.5">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <input
                          key={i}
                          id={`otp-${i}`}
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          value={otp[i] || ''}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          maxLength={1}
                          className={cn(
                            'w-12 h-14 text-center text-lg font-mono font-semibold rounded-lg border-2 transition-all outline-none',
                            otp[i]
                              ? 'border-caramel bg-caramel/[0.04] text-warm-black'
                              : 'border-sand bg-white text-warm-black focus:border-caramel focus:ring-2 focus:ring-caramel/20'
                          )}
                        />
                      ))}
                    </div>
                    {error && (
                      <p className="text-xs text-danger mt-2 flex items-center gap-1">
                        <Shield size={12} /> {error}
                      </p>
                    )}
                  </div>

                  {/* Verify Button */}
                  <button
                    onClick={handleVerifyOtp}
                    disabled={isLoading || otp.length !== 6}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isLoading || otp.length !== 6
                        ? 'bg-sand text-stone cursor-not-allowed'
                        : 'bg-caramel text-white hover:bg-caramel/90 active:scale-[0.98] shadow-sm'
                    )}
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        Verify & Login <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  {/* Resend / Back */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => { setStep('phone'); setOtp(''); setError('') }}
                      className="text-sm text-stone hover:text-warm-black transition-colors"
                    >
                      Change number
                    </button>
                    <button
                      onClick={handleResendOtp}
                      disabled={otpTimer > 0 || isLoading}
                      className={cn(
                        'text-sm font-medium transition-colors',
                        otpTimer > 0 ? 'text-stone cursor-not-allowed' : 'text-caramel hover:text-caramel/80'
                      )}
                    >
                      {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend OTP'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ───── Step 3: Name Input (New User) ───── */}
            {step === 'name' && (
              <motion.div
                key="name"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-8">
                  <div className="w-14 h-14 rounded-full bg-caramel/15 flex items-center justify-center mb-4">
                    <UserCircle size={28} className="text-caramel" />
                  </div>
                  <h2 className="text-2xl font-bold text-warm-black mb-2">Almost there!</h2>
                  <p className="text-stone">
                    Looks like you're new here. Tell us your name to complete setup.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Name Input */}
                  <div>
                    <label className="block text-sm font-medium text-warm-black mb-2">
                      Your Name
                    </label>
                    <div className="flex items-center gap-2 bg-white border border-sand rounded-lg px-3 py-2.5 focus-within:border-caramel focus-within:ring-2 focus-within:ring-caramel/20 transition-all">
                      <UserCircle size={16} className="text-stone shrink-0" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value)
                          setError('')
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCompleteOnboarding()
                        }}
                        placeholder="e.g. Rahul Sharma"
                        autoFocus
                        className={cn(
                          'flex-1 bg-transparent text-sm text-warm-black placeholder:text-stone/50 outline-none',
                          error && 'placeholder:text-danger/50'
                        )}
                      />
                    </div>
                    {error && (
                      <p className="text-xs text-danger mt-1.5">{error}</p>
                    )}
                  </div>

                  {/* Complete Button */}
                  <button
                    onClick={handleCompleteOnboarding}
                    disabled={isLoading || !name.trim()}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isLoading || !name.trim()
                        ? 'bg-sand text-stone cursor-not-allowed'
                        : 'bg-caramel text-white hover:bg-caramel/90 active:scale-[0.98] shadow-sm'
                    )}
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        Complete Setup <Check size={16} />
                      </>
                    )}
                  </button>

                  {/* Back to OTP */}
                  <button
                    onClick={() => { setStep('otp'); setName(''); setError('') }}
                    className="w-full text-sm text-stone hover:text-warm-black transition-colors text-center"
                  >
                    Back to OTP
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Footer ── */}
          <div className="mt-12 text-center">
            <p className="text-xs text-stone">
              By continuing, you agree to our{' '}
              <span className="text-caramel cursor-pointer hover:underline">Terms of Service</span>
              {' '}and{' '}
              <span className="text-caramel cursor-pointer hover:underline">Privacy Policy</span>
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <Shield size={12} className="text-success" />
              <p className="text-xs text-stone">End-to-end encrypted login</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
