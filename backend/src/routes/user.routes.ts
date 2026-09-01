import { Router } from 'express';
import { z } from 'zod';
import { successResponse } from '../utils/response';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import * as UserServiceRaw from '../services/user.service';
import { instrumentServiceModule } from '../utils/logger';

const router = Router();
const UserService = instrumentServiceModule('UserService', UserServiceRaw);

// ── Validation Schemas ────────────────────────────────────────────────

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  email: z.string().email('Invalid email format').optional(),
});

// ── Routes ────────────────────────────────────────────────────────────

/**
 * GET /api/user/profile
 * Get current user profile with subscription info
 */
router.get(
  '/profile',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const user = await UserService.getProfile(userId);

      successResponse(res, { user });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/user/profile
 * Update user profile (name, email)
 */
router.put(
  '/profile',
  authenticate,
  validate(updateProfileSchema),
  async (req, res, next) => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const { name, email } = req.body;

      const user = await UserService.updateProfile(userId, {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
      });

      successResponse(res, { user });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/user/avatar
 * Upload user avatar
 * Expects multipart/form-data with 'avatar' field
 */
router.put(
  '/avatar',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      // Multer middleware should be applied at the app level or router level
      // The file is expected to be available at req.file after multer processing
      const file = (req as any).file;

      if (!file) {
        throw new ApiError(400, 'Avatar file is required');
      }

      // File URL from cloud storage or local upload
      const fileUrl = (file as any).location || `/uploads/${file.filename}`;

      const user = await UserService.updateAvatar(userId, fileUrl);

      successResponse(res, { user });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/user
 * Delete user account permanently
 */
router.delete(
  '/',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      await UserService.deleteUser(userId);

      successResponse(res, { message: 'Account deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
