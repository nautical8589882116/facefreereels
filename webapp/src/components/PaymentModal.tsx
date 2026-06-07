import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Check,
  Sparkles,
  Zap,
  Crown,
  Loader2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { createOrder, verifyPayment } from '@/lib/api'
import { cn } from '@/lib/utils'

/* ────────────────────── types ────────────────────── */

interface Plan {
  id: string
  name: string
  price: number
  priceFormatted: string
  period: string
  features: string[]
  highlighted: boolean
  icon: React.ElementType
  color: string
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

/* ────────────────────── plans data ────────────────────── */

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 999,
    priceFormatted: '\u20b9999',
    period: '/month',
    features: [
      'Up to 10 campaigns/month',
      'Instagram + Facebook',
      'AI ad copy generation',
      'Basic analytics',
      'Email support',
    ],
    highlighted: false,
    icon: Sparkles,
    color: '#8C8178',
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 2999,
    priceFormatted: '\u20b92,999',
    period: '/month',
    features: [
      'Unlimited campaigns',
      'All 3 platforms (IG, FB, YT)',
      'AI reel generation',
      'Advanced analytics & reports',
      'Priority support',
      'Brand voice customization',
      'Scheduled publishing',
    ],
    highlighted: true,
    icon: Zap,
    color: '#C4814B',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 9999,
    priceFormatted: '\u20b99,999',
    period: '/month',
    features: [
      'Everything in Professional',
      'Multiple team members',
      'API access',
      'Custom AI training',
      'Dedicated account manager',
      'White-label options',
      'SSO & advanced security',
    ],
    highlighted: false,
    icon: Crown,
    color: '#4A7FB5',
  },
]

/* ────────────────────── Razorpay types ────────────────────── */

declare global {
  interface Window {
    Razorpay: any
  }
}

/* ────────────────────── component ────────────────────── */

export default function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || ''

  const handleSubscribe = async (plan: Plan) => {
    if (!RAZORPAY_KEY) {
      toast.error('Razorpay key not configured', {
        description: 'Please set VITE_RAZORPAY_KEY_ID in your .env file.',
      })
      return
    }

    try {
      setIsProcessing(true)
      setSelectedPlan(plan.id)

      // 1. Create order on backend
      const { order } = await createOrder(plan.id)

      // 2. Open Razorpay checkout
      const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        name: import.meta.env.VITE_APP_NAME || 'NHY-QR Ad Manager',
        description: `${plan.name} Plan Subscription`,
        order_id: order.id,
        handler: async (response: {
          razorpay_payment_id: string
          razorpay_order_id: string
          razorpay_signature: string
        }) => {
          try {
            // 3. Verify payment
            await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan.id,
            })

            toast.success('Subscription activated!', {
              description: `You are now subscribed to the ${plan.name} plan.`,
            })

            onSuccess?.()
            onClose()
          } catch (err: any) {
            toast.error('Payment verification failed', {
              description: err.response?.data?.message || 'Please contact support.',
            })
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#C4814B',
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false)
            setSelectedPlan(null)
          },
        },
      }

      if (window.Razorpay) {
        const razorpay = new window.Razorpay(options)
        razorpay.open()
      } else {
        // Load Razorpay script dynamically
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => {
          const razorpay = new window.Razorpay(options)
          razorpay.open()
        }
        script.onerror = () => {
          toast.error('Failed to load payment gateway')
          setIsProcessing(false)
          setSelectedPlan(null)
        }
        document.body.appendChild(script)
      }
    } catch (err: any) {
      toast.error('Failed to initiate payment', {
        description: err.response?.data?.message || 'Something went wrong.',
      })
      setIsProcessing(false)
      setSelectedPlan(null)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-linen px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-warm-black">Choose Your Plan</h2>
                <p className="text-sm text-stone mt-0.5">
                  Unlock the full power of AI-driven advertising
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-stone hover:text-warm-black hover:bg-cream transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Plans Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {plans.map((plan, idx) => {
                  const Icon = plan.icon
                  const isSelected = selectedPlan === plan.id

                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className={cn(
                        'relative rounded-xl border-2 p-5 transition-all duration-200',
                        plan.highlighted
                          ? 'border-caramel bg-caramel/[0.03] shadow-lg'
                          : 'border-linen bg-white hover:border-sand',
                        isSelected && 'ring-2 ring-caramel/30'
                      )}
                    >
                      {/* Popular Badge */}
                      {plan.highlighted && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-caramel text-white text-xs font-semibold">
                            <Zap size={10} /> Most Popular
                          </span>
                        </div>
                      )}

                      {/* Icon */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                        style={{ backgroundColor: `${plan.color}15` }}
                      >
                        <Icon size={22} style={{ color: plan.color }} />
                      </div>

                      {/* Name */}
                      <h3 className="text-lg font-bold text-warm-black">{plan.name}</h3>

                      {/* Price */}
                      <div className="flex items-baseline gap-1 mt-2 mb-4">
                        <span className="text-3xl font-bold text-warm-black">
                          {plan.priceFormatted}
                        </span>
                        <span className="text-sm text-stone">{plan.period}</span>
                      </div>

                      {/* Features */}
                      <ul className="space-y-2.5 mb-6">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm text-warm-black">
                            <Check
                              size={14}
                              className={cn(
                                'shrink-0 mt-0.5',
                                plan.highlighted ? 'text-caramel' : 'text-success'
                              )}
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <button
                        onClick={() => handleSubscribe(plan)}
                        disabled={isProcessing}
                        className={cn(
                          'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98]',
                          plan.highlighted
                            ? 'bg-caramel text-white hover:bg-caramel/90 shadow-sm'
                            : 'bg-cream text-warm-black hover:bg-sand/50 border border-linen',
                          isProcessing && selectedPlan === plan.id && 'opacity-70 cursor-wait'
                        )}
                      >
                        {isProcessing && selectedPlan === plan.id ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Subscribe <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </motion.div>
                  )
                })}
              </div>

              {/* Security Note */}
              <div className="flex items-center justify-center gap-1.5 mt-6 pt-4 border-t border-linen">
                <ShieldCheck size={14} className="text-success" />
                <p className="text-xs text-stone">
                  Secure payment powered by Razorpay. 100% encrypted transactions.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
