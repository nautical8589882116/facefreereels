import Razorpay from 'razorpay'
import crypto from 'crypto'
import { ApiError } from '../middleware/errorHandler'

// The Razorpay constructor throws when `key_id` is absent. Building the client
// at import time therefore crashed the whole process on boot whenever payment
// credentials were not configured, taking the health endpoint down with it.
// Construct it on first use instead — matching how the Twilio and Cloudinary
// clients already tolerate missing configuration — so only payment endpoints
// fail, and they fail with a clear message.
let client: Razorpay | null = null

export function getRazorpay(): Razorpay {
  if (!client) {
    const key_id = process.env.RAZORPAY_KEY_ID
    const key_secret = process.env.RAZORPAY_KEY_SECRET

    if (!key_id || !key_secret) {
      throw new ApiError(
        503,
        'Payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'
      )
    }

    client = new Razorpay({ key_id, key_secret })
  }

  return client
}

export function isPaymentsConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) {
    throw new ApiError(503, 'Payments are not configured.')
  }

  const body = orderId + '|' + paymentId
  const expected = crypto
    .createHmac('sha256', secret)
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
