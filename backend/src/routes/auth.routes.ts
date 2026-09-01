import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import * as AuthServiceRaw from '../services/auth.service';
import { instrumentServiceModule } from '../utils/logger';

const router = Router();
const AuthService = instrumentServiceModule('AuthService', AuthServiceRaw);

// ── Validation Schemas ────────────────────────────────────────────────

const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .refine((val) => {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    const indianRegex = /^[6-9]\d{9}$/;
    return e164Regex.test(val) || indianRegex.test(val);
  }, 'Invalid phone number format. Use E.164 (+919876543210) or 10-digit Indian format');

const sendOtpSchema = z.object({
  phone: phoneSchema,
});

const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
  name: z.string().trim().min(1).optional(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

function normalizePhone(phone: string): string {
  return phone.startsWith('+') ? phone : `+91${phone}`;
}

// ── Routes (frontend contract: /send-otp, /verify-otp) ──────────────

/**
 * POST /api/auth/send-otp
 * Send OTP to phone number
 */
router.post(
  '/send-otp',
  validate(sendOtpSchema),
  async (req, res, next) => {
    try {
      const normalizedPhone = normalizePhone(req.body.phone);
      await AuthService.sendOtp(normalizedPhone);

      res.json({
        success: true,
        message: 'OTP sent',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/verify-otp
 * Verify OTP and authenticate
 */
router.post(
  '/verify-otp',
  validate(verifyOtpSchema),
  async (req, res, next) => {
    try {
      const { phone, code, name } = req.body;
      const normalizedPhone = normalizePhone(phone);

      const result = await AuthService.verifyOtp(normalizedPhone, code, name);

      res.json({
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
        user: AuthService.formatUserForClient(result.user, result.isNewUser),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);

      res.json({
        tokens: {
          accessToken: result.accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/logout
 */
router.post('/logout', async (_req, res, next) => {
  try {
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user with subscription info
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(401, 'Authentication required');
    }

    const user = await AuthService.getUser(userId);

    res.json({
      user: AuthService.formatUserForClient(user, false),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
