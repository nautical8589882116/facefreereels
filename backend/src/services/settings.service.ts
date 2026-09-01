import { prisma } from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { Prisma } from '@prisma/client';

// ── Types ─────────────────────────────────────────────────────────────

export interface ProductSettingsInput {
  productName?: string;
  productTagline?: string;
  productDescription?: string;
  features?: Record<string, unknown>;
  pricingTiers?: Record<string, unknown>;
  targetAudience?: string[];
  uvp?: string;
}

export interface BrandSettingsInput {
  brandPrimary?: string;
  brandSecondary?: string;
  brandAccent?: string;
  headingFont?: string;
  bodyFont?: string;
  brandVoice?: Record<string, unknown>;
  forbiddenWords?: string[];
}

export interface AISettingsInput {
  aiObjective?: 'AWARENESS' | 'ENGAGEMENT' | 'CONVERSIONS';
  aiPlatforms?: string[];
  aiCreativity?: number;
  aiHashtagCount?: number;
  aiInclude?: string;
  aiAvoid?: string;
  aiEmojiEnabled?: boolean;
  aiCopyLength?: string;
  aiCTA?: string;
  aiLanguage?: string;
}

export type FullSettingsInput = ProductSettingsInput & BrandSettingsInput & AISettingsInput;

// ── Factory Defaults ──────────────────────────────────────────────────

export const DEFAULT_SETTINGS: Omit<FullSettingsInput, 'userId'> = {
  productName: 'NHY-QR Digital Menu',
  productTagline: 'QR-powered digital menus for modern restaurants',
  productDescription: '',
  features: {},
  pricingTiers: {},
  targetAudience: [],
  uvp: '',
  brandPrimary: '#C4814B',
  brandSecondary: '#2C2420',
  brandAccent: '#4A7FB5',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  brandVoice: {},
  forbiddenWords: [],
  aiObjective: 'AWARENESS',
  aiPlatforms: [],
  aiCreativity: 50,
  aiHashtagCount: 8,
  aiInclude: '',
  aiAvoid: '',
  aiEmojiEnabled: true,
  aiCopyLength: 'medium',
  aiCTA: 'Learn More',
  aiLanguage: 'en',
};

// ── Helper: Build selective data object ───────────────────────────────

function buildUpdateData<T extends object>(
  input: T,
  allowedKeys: (keyof T)[]
): Partial<T> {
  const data: Partial<T> = {};
  for (const key of allowedKeys) {
    if (input[key] !== undefined) {
      data[key] = input[key] as T[keyof T];
    }
  }
  return data;
}

function toSettingsUpdateInput<T extends object>(data: Partial<T>): Prisma.UserSettingsUpdateInput {
  return data as unknown as Prisma.UserSettingsUpdateInput;
}

// ── Service Methods ───────────────────────────────────────────────────

/**
 * Get or create user settings. Creates default settings if none exist.
 */
export async function getOrCreateSettings(userId: string) {
  let settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: {
        userId,
        productName: DEFAULT_SETTINGS.productName!,
        productTagline: DEFAULT_SETTINGS.productTagline!,
        productDescription: DEFAULT_SETTINGS.productDescription,
        features: DEFAULT_SETTINGS.features as any,
        pricingTiers: DEFAULT_SETTINGS.pricingTiers as any,
        targetAudience: DEFAULT_SETTINGS.targetAudience!,
        uvp: DEFAULT_SETTINGS.uvp,
        brandPrimary: DEFAULT_SETTINGS.brandPrimary!,
        brandSecondary: DEFAULT_SETTINGS.brandSecondary!,
        brandAccent: DEFAULT_SETTINGS.brandAccent!,
        headingFont: DEFAULT_SETTINGS.headingFont!,
        bodyFont: DEFAULT_SETTINGS.bodyFont!,
        brandVoice: DEFAULT_SETTINGS.brandVoice as any,
        forbiddenWords: DEFAULT_SETTINGS.forbiddenWords!,
        aiObjective: DEFAULT_SETTINGS.aiObjective as 'AWARENESS' | 'ENGAGEMENT' | 'CONVERSIONS',
        aiPlatforms: DEFAULT_SETTINGS.aiPlatforms!,
        aiCreativity: DEFAULT_SETTINGS.aiCreativity!,
        aiHashtagCount: DEFAULT_SETTINGS.aiHashtagCount!,
        aiInclude: DEFAULT_SETTINGS.aiInclude,
        aiAvoid: DEFAULT_SETTINGS.aiAvoid,
        aiEmojiEnabled: DEFAULT_SETTINGS.aiEmojiEnabled!,
        aiCopyLength: DEFAULT_SETTINGS.aiCopyLength!,
        aiCTA: DEFAULT_SETTINGS.aiCTA!,
        aiLanguage: DEFAULT_SETTINGS.aiLanguage!,
      },
    });
  }

  return settings;
}

/**
 * Get user settings (without auto-creation)
 */
export async function getSettings(userId: string) {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    throw new ApiError(404, 'Settings not found');
  }

  return settings;
}

/**
 * Update all settings fields
 */
export async function updateAllSettings(userId: string, input: FullSettingsInput) {
  await getOrCreateSettings(userId);

  const data = buildUpdateData(input, [
    'productName', 'productTagline', 'productDescription', 'features',
    'pricingTiers', 'targetAudience', 'uvp', 'brandPrimary', 'brandSecondary',
    'brandAccent', 'headingFont', 'bodyFont', 'brandVoice', 'forbiddenWords',
    'aiObjective', 'aiPlatforms', 'aiCreativity', 'aiHashtagCount', 'aiInclude',
    'aiAvoid', 'aiEmojiEnabled', 'aiCopyLength', 'aiCTA', 'aiLanguage',
  ]);

  const settings = await prisma.userSettings.update({
    where: { userId },
    data: toSettingsUpdateInput(data),
  });

  return settings;
}

/**
 * Update product-related settings only
 */
export async function updateProductSettings(userId: string, input: ProductSettingsInput) {
  await getOrCreateSettings(userId);

  const data = buildUpdateData(input, [
    'productName', 'productTagline', 'productDescription', 'features',
    'pricingTiers', 'targetAudience', 'uvp',
  ]);

  const settings = await prisma.userSettings.update({
    where: { userId },
    data: toSettingsUpdateInput(data),
  });

  return settings;
}

/**
 * Update brand-related settings only
 */
export async function updateBrandSettings(userId: string, input: BrandSettingsInput) {
  await getOrCreateSettings(userId);

  const data = buildUpdateData(input, [
    'brandPrimary', 'brandSecondary', 'brandAccent', 'headingFont',
    'bodyFont', 'brandVoice', 'forbiddenWords',
  ]);

  const settings = await prisma.userSettings.update({
    where: { userId },
    data: toSettingsUpdateInput(data),
  });

  return settings;
}

/**
 * Update AI-related settings only
 */
export async function updateAISettings(userId: string, input: AISettingsInput) {
  await getOrCreateSettings(userId);

  const data = buildUpdateData(input, [
    'aiObjective', 'aiPlatforms', 'aiCreativity', 'aiHashtagCount',
    'aiInclude', 'aiAvoid', 'aiEmojiEnabled', 'aiCopyLength', 'aiCTA', 'aiLanguage',
  ]);

  const settings = await prisma.userSettings.update({
    where: { userId },
    data: toSettingsUpdateInput(data),
  });

  return settings;
}

/**
 * Get factory default settings (used as template for reset/defaults endpoint)
 */
export function getDefaultSettings() {
  return { ...DEFAULT_SETTINGS };
}
