import { prisma } from '../config/database';
import razorpay, { verifyPaymentSignature, PLAN_CONFIG } from '../config/razorpay';
import { ApiError } from '../middleware/errorHandler';

// ── Types ─────────────────────────────────────────────────────────────

export type PlanType = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface CreateOrderInput {
  plan: PlanType;
}

export interface VerifyPaymentInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

// ── Plan Details ──────────────────────────────────────────────────────

/**
 * Get all available subscription plans with pricing details
 */
export async function getPlans() {
  const plans = Object.entries(PLAN_CONFIG).map(([key, config]) => ({
    id: key,
    name: config.name,
    amount: config.amount,
    amountInRupees: config.amount / 100,
    currency: 'INR',
    description: config.description,
  }));

  return plans;
}

// ── Order Management ──────────────────────────────────────────────────

/**
 * Create a Razorpay order for a subscription plan
 */
export async function createOrder(userId: string, input: CreateOrderInput) {
  const { plan } = input;

  if (!PLAN_CONFIG[plan] || plan === 'FREE') {
    throw new ApiError(400, 'Invalid plan selected');
  }

  const config = PLAN_CONFIG[plan];

  // Check if user already has an active paid subscription
  const existingActive = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existingActive && existingActive.plan !== 'FREE') {
    throw new ApiError(400, 'You already have an active subscription. Please cancel it before purchasing a new one.');
  }

  const order = await razorpay.orders.create({
    amount: config.amount,
    currency: 'INR',
    receipt: `sub_${userId}_${Date.now()}`,
    notes: {
      userId,
      plan,
    },
  });

  // Create a pending subscription record
  await prisma.subscription.create({
    data: {
      userId,
      plan,
      razorpayOrderId: order.id,
      amount: config.amount / 100,
      currency: 'INR',
      status: 'PENDING',
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    plan,
  };
}

// ── Payment Verification ──────────────────────────────────────────────

/**
 * Verify Razorpay payment signature and activate subscription
 */
export async function verifyPayment(userId: string, input: VerifyPaymentInput) {
  const { orderId, paymentId, signature } = input;

  const isValid = verifyPaymentSignature(orderId, paymentId, signature);

  if (!isValid) {
    throw new ApiError(400, 'Invalid payment signature');
  }

  // Find the pending subscription
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      razorpayOrderId: orderId,
      status: 'PENDING',
    },
  });

  if (!subscription) {
    throw new ApiError(404, 'Subscription order not found');
  }

  // Update subscription to active
  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
      status: 'ACTIVE',
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  // Mark any other active subscriptions as expired
  await prisma.subscription.updateMany({
    where: {
      userId,
      status: 'ACTIVE',
      id: { not: subscription.id },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  return updated;
}

// ── Subscription Queries ──────────────────────────────────────────────

/**
 * Get the current user's active subscription
 */
export async function getCurrentSubscription(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ['ACTIVE', 'PENDING'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!subscription) {
    // Return default free plan info
    return {
      plan: 'FREE',
      status: 'ACTIVE',
      amount: 0,
      currency: 'INR',
      startsAt: null,
      expiresAt: null,
    };
  }

  return subscription;
}

/**
 * Cancel the user's active subscription
 */
export async function cancelSubscription(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!subscription) {
    throw new ApiError(404, 'No active subscription found');
  }

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'CANCELLED',
    },
  });

  return updated;
}

// ── Webhook Handling ──────────────────────────────────────────────────

/**
 * Handle Razorpay webhook events
 */
export async function handleWebhookEvent(
  event: string,
  payload: Record<string, any>
): Promise<void> {
  switch (event) {
    case 'payment.captured': {
      const { order_id, id: paymentId } = payload;

      await prisma.subscription.updateMany({
        where: {
          razorpayOrderId: order_id,
          status: 'PENDING',
        },
        data: {
          razorpayPaymentId: paymentId,
          status: 'ACTIVE',
        },
      });
      break;
    }

    case 'subscription.charged': {
      // For Razorpay subscriptions (if used in future)
      const { order_id, id: paymentId } = payload;

      await prisma.subscription.updateMany({
        where: {
          razorpayOrderId: order_id,
        },
        data: {
          razorpayPaymentId: paymentId,
          status: 'ACTIVE',
        },
      });
      break;
    }

    case 'subscription.cancelled': {
      const { order_id } = payload;

      await prisma.subscription.updateMany({
        where: {
          razorpayOrderId: order_id,
        },
        data: {
          status: 'CANCELLED',
        },
      });
      break;
    }

    default:
      // Unhandled event - log and ignore
      console.log(`Unhandled Razorpay webhook event: ${event}`);
  }
}
