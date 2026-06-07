import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { generateAccessToken, generateRefreshToken, generateOtp } from '../config/auth';
import { sendOtp } from '../config/otp';
import { successResponse } from '../utils/response';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import * as AuthService from '../services/auth.service';

const router = Router();

// ── Validation Schemas ────────────────────────────────────────────────

const sendOtpSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine((val) => {
      // Accept E.164 format (+919876543210) or Indian 10-digit format
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      const indianRegex = /^[6-9]\d{9}$/;
      return e164Regex.test(val) || indianRegex.test(val);
    }, 'Invalid phone number format. Use E.164 (+919876543210) or 10-digit Indian format'),
});

const verifyOtpSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine((val) => {
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      const indianRegex = /^[6-9]\d{9}$/;
      return e164Regex.test(val) || indianRegex.test(val);
    }, 'Invalid phone number format'),
  code: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ── Routes ────────────────────────────────────────────────────────────

/**
 * POST /api/auth/otp/send
 * Send OTP to phone number
 */
router.post(
  '/otp/send',
  validate(sendOtpSchema),
  async (req, res, next) => {
    try {
      const { phone } = req.body;

      // Normalize phone to E.164 if it's in Indian format
      const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

      await AuthService.sendOtp(normalizedPhone);

      successResponse(res, { message: 'OTP sent' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/otp/verify
 * Verify OTP and authenticate
 */
router.post(
  '/otp/verify',
  validate(verifyOtpSchema),
  async (req, res, next) => {
    try {
      const { phone, code } = req.body;

      // Normalize phone to E.164 if it's in Indian format
      const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

      const result = await AuthService.verifyOtp(normalizedPhone, code);

      successResponse(res, {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
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

      successResponse(res, {
        accessToken: result.accessToken,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/logout
 * Logout user (revoke refresh token context)
 */
router.post(
  '/logout',
  async (req, res, next) => {
    try {
      // In a stateless JWT setup, the client discards the tokens.
      // If refresh tokens are stored server-side for revocation,
      // delete the refresh token record here.
      // For now, we rely on the client to remove tokens.

      successResponse(res, { message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/auth/me
 * Get current authenticated user with subscription info
 */
router.get(
  '/me',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const user = await AuthService.getUser(userId);

      successResponse(res, { user });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
