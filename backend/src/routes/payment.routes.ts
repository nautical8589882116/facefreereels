import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { successResponse } from '../utils/response';
import { validate } from '../middleware/validate';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import * as PaymentServiceRaw from '../services/payment.service';
import { instrumentServiceModule } from '../utils/logger';

const router = Router();
const PaymentService = instrumentServiceModule('PaymentService', PaymentServiceRaw);

// ── Validation Schemas ────────────────────────────────────────────────

const createOrderSchema = z.object({
  plan: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE'], {
    errorMap: () => ({ message: 'Plan must be STARTER, PROFESSIONAL, or ENTERPRISE' }),
  }),
});

const verifyPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  paymentId: z.string().min(1, 'Payment ID is required'),
  signature: z.string().min(1, 'Signature is required'),
});

// ── Routes ────────────────────────────────────────────────────────────

/**
 * GET /api/payments/plans
 * List available subscription plans with pricing
 */
router.get('/plans', async (_req, res, next) => {
  try {
    const plans = await PaymentService.getPlans();
    successResponse(res, plans);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/create-order
 * Create a Razorpay order for the selected plan
 */
router.post(
  '/create-order',
  validate(createOrderSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const result = await PaymentService.createOrder(userId, req.body);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/payments/verify
 * Verify payment signature and activate subscription
 */
router.post(
  '/verify',
  validate(verifyPaymentSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const subscription = await PaymentService.verifyPayment(userId, req.body);
      successResponse(res, subscription, 'Payment verified successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/payments/subscription
 * Get current user's subscription details
 */
router.get('/subscription', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Authentication required');
    }

    const subscription = await PaymentService.getCurrentSubscription(userId);
    successResponse(res, subscription);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/cancel
 * Cancel the user's active subscription
 */
router.post('/cancel', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Authentication required');
    }

    const subscription = await PaymentService.cancelSubscription(userId);
    successResponse(res, subscription, 'Subscription cancelled successfully');
  } catch (error) {
    next(error);
  }
});

// ── Webhook Handler ───────────────────────────────────────────────────

/**
 * POST /api/payments/webhook
 * Razorpay webhook handler (uses raw body for signature verification)
 *
 * Mounted at /api/payments/webhook with express.raw() middleware in index.ts,
 * so it responds to both '/' (via the webhook mount) and '/webhook' (via the
 * payments mount).
 */
router.post('/', async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!signature) {
      throw new ApiError(400, 'Missing Razorpay signature');
    }

    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET!)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new ApiError(400, 'Invalid webhook signature');
    }

    const event = req.body.event;
    const payload = req.body.payload?.payment?.entity || req.body.payload?.subscription?.entity || {};

    // Process the webhook event
    await PaymentService.handleWebhookEvent(event, payload);

    successResponse(res, { received: true }, 'Webhook processed');
  } catch (error) {
    next(error);
  }
});

// Also handle /webhook path for compatibility with the payments router mount
router.post('/webhook', async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!signature) {
      throw new ApiError(400, 'Missing Razorpay signature');
    }

    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET!)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new ApiError(400, 'Invalid webhook signature');
    }

    const event = req.body.event;
    const payload = req.body.payload?.payment?.entity || req.body.payload?.subscription?.entity || {};

    // Process the webhook event
    await PaymentService.handleWebhookEvent(event, payload);

    successResponse(res, { received: true }, 'Webhook processed');
  } catch (error) {
    next(error);
  }
});

export default router;
