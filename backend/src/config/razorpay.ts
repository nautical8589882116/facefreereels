import Razorpay from 'razorpay'
import crypto from 'crypto'
import { ApiError } from '../middleware/errorHandler'

// Constructed lazily: Razorpay throws if key_id is missing, so building it at
// module load would crash the whole server when payment env vars aren't set.
let client: Razorpay | null = null

export function getRazorpayClient(): Razorpay {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new ApiError(503, 'Payments are not configured on this server')
  }
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }
  return client
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = orderId + '|' + paymentId
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new ApiError(503, 'Payments are not configured on this server')
  }
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')
  return expected === signature
}

export const PLAN_CONFIG: Record<string, { amount: number; name: string; description: string }> = {
  FREE: { amount: 0, name: 'Free', description: '5 campaigns, basic analytics' },
  STARTER: { amount: 99900, name: 'Starter', description: '20 campaigns, all features' },
  PROFESSIONAL: { amount: 299900, name: 'Professional', description: 'Unlimited campaigns, priority support' },
  ENTERPRISE: { amount: 999900, name: 'Enterprise', description: 'Custom solutions, dedicated account manager' },
}
