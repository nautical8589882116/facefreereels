import { Router } from 'express';
import { z } from 'zod';
import { successResponse } from '../utils/response';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import * as PlatformService from '../services/platform.service';

const router = Router();

// ── Validation Schemas ────────────────────────────────────────────────

const connectAccountSchema = z.object({
  accountName: z.string().min(1, 'Account name is required').max(200),
  accountId: z.string().min(1, 'Account ID is required').max(200),
  profileUrl: z.string().url('Invalid profile URL').optional(),
  followerCount: z.number().int().min(0).optional(),
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

const refreshTokenSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

// ── Helper ────────────────────────────────────────────────────────────

function getPlatformParam(platform: string): PlatformService.Platform {
  const upper = platform.toUpperCase();
  if (!PlatformService.isValidPlatform(upper)) {
    throw new ApiError(400, `Invalid platform. Must be one of: instagram, facebook, youtube`);
  }
  return upper as PlatformService.Platform;
}

// ── Routes ────────────────────────────────────────────────────────────

/**
 * GET /api/platforms
 * List all connected platform accounts for the authenticated user
 */
router.get(
  '/',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const accounts = await PlatformService.getAllAccounts(userId);
      successResponse(res, accounts);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/platforms/:platform
 * List accounts for a specific platform (instagram, facebook, youtube)
 */
router.get(
  '/:platform',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const platform = getPlatformParam(req.params.platform);
      const accounts = await PlatformService.getAccountsByPlatform(userId, platform);
      successResponse(res, accounts);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/platforms/:platform/connect
 * Store new platform account after OAuth
 */
router.post(
  '/:platform/connect',
  authenticate,
  validate(connectAccountSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const platform = getPlatformParam(req.params.platform);
      const account = await PlatformService.connectAccount(userId, platform, req.body);
      successResponse(res, account, 'Account connected successfully', 201);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/platforms/:id/toggle
 * Toggle account active/inactive status
 */
router.patch(
  '/:id/toggle',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const account = await PlatformService.toggleAccount(userId, req.params.id);
      successResponse(res, account, `Account ${account.isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/platforms/:id/primary
 * Set account as primary for its platform
 */
router.patch(
  '/:id/primary',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const account = await PlatformService.setPrimary(userId, req.params.id);
      successResponse(res, account, 'Primary account updated');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/platforms/:id
 * Disconnect (delete) a platform account
 */
router.delete(
  '/:id',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const result = await PlatformService.disconnectAccount(userId, req.params.id);
      successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/platforms/:id/refresh
 * Refresh access token for a platform account
 */
router.post(
  '/:id/refresh',
  authenticate,
  validate(refreshTokenSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const account = await PlatformService.refreshAccessToken(userId, req.params.id, req.body);
      successResponse(res, account, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/platforms/status
 * Get connection status summary for all platforms
 */
router.get(
  '/status/summary',
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const status = await PlatformService.getConnectionStatus(userId);
      successResponse(res, status);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
