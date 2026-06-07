import { Router } from 'express';
import { z } from 'zod';
import { successResponse } from '../utils/response';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import * as SettingsService from '../services/settings.service';

const router = Router();

// ── Validation Schemas ────────────────────────────────────────────────

const updateFullSchema = z.object({
  // Product
  productName: z.string().min(1).max(200).optional(),
  productTagline: z.string().max(300).optional(),
  productDescription: z.string().optional(),
  features: z.record(z.any()).optional(),
  pricingTiers: z.record(z.any()).optional(),
  targetAudience: z.array(z.string()).optional(),
  uvp: z.string().optional(),
  // Brand
  brandPrimary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  brandSecondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  brandAccent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  headingFont: z.string().min(1).optional(),
  bodyFont: z.string().min(1).optional(),
  brandVoice: z.record(z.any()).optional(),
  forbiddenWords: z.array(z.string()).optional(),
  // AI
  aiObjective: z.enum(['AWARENESS', 'ENGAGEMENT', 'CONVERSIONS']).optional(),
  aiPlatforms: z.array(z.string()).optional(),
  aiCreativity: z.number().int().min(0).max(100).optional(),
  aiHashtagCount: z.number().int().min(0).max(30).optional(),
  aiInclude: z.string().optional(),
  aiAvoid: z.string().optional(),
  aiEmojiEnabled: z.boolean().optional(),
  aiCopyLength: z.string().optional(),
  aiCTA: z.string().optional(),
  aiLanguage: z.string().optional(),
});

const updateProductSchema = z.object({
  productName: z.string().min(1, 'Product name is required').max(200).optional(),
  productTagline: z.string().max(300).optional(),
  productDescription: z.string().optional(),
  features: z.record(z.any()).optional(),
  pricingTiers: z.record(z.any()).optional(),
  targetAudience: z.array(z.string()).optional(),
  uvp: z.string().optional(),
});

const updateBrandSchema = z.object({
  brandPrimary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  brandSecondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  brandAccent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  headingFont: z.string().min(1).optional(),
  bodyFont: z.string().min(1).optional(),
  brandVoice: z.record(z.any()).optional(),
  forbiddenWords: z.array(z.string()).optional(),
});

const updateAISchema = z.object({
  aiObjective: z.enum(['AWARENESS', 'ENGAGEMENT', 'CONVERSIONS']).optional(),
  aiPlatforms: z.array(z.string()).optional(),
  aiCreativity: z.number().int().min(0).max(100).optional(),
  aiHashtagCount: z.number().int().min(0).max(30).optional(),
  aiInclude: z.string().optional(),
  aiAvoid: z.string().optional(),
  aiEmojiEnabled: z.boolean().optional(),
  aiCopyLength: z.string().optional(),
  aiCTA: z.string().optional(),
  aiLanguage: z.string().optional(),
});

// ── Routes ────────────────────────────────────────────────────────────

/**
 * GET /api/settings
 * Get user settings (creates default if not exists)
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

      const settings = await SettingsService.getOrCreateSettings(userId);
      successResponse(res, settings);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/settings
 * Update all settings
 */
router.put(
  '/',
  authenticate,
  validate(updateFullSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const settings = await SettingsService.updateAllSettings(userId, req.body);
      successResponse(res, settings, 'Settings updated successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/settings/product
 * Update product info only
 */
router.patch(
  '/product',
  authenticate,
  validate(updateProductSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const settings = await SettingsService.updateProductSettings(userId, req.body);
      successResponse(res, settings, 'Product settings updated');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/settings/brand
 * Update brand settings only
 */
router.patch(
  '/brand',
  authenticate,
  validate(updateBrandSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const settings = await SettingsService.updateBrandSettings(userId, req.body);
      successResponse(res, settings, 'Brand settings updated');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/settings/ai
 * Update AI preferences only
 */
router.patch(
  '/ai',
  authenticate,
  validate(updateAISchema),
  async (req: AuthRequest, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const settings = await SettingsService.updateAISettings(userId, req.body);
      successResponse(res, settings, 'AI settings updated');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/settings/defaults
 * Get factory default settings
 */
router.get(
  '/defaults',
  authenticate,
  async (_req, res, next) => {
    try {
      const defaults = SettingsService.getDefaultSettings();
      successResponse(res, defaults);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
