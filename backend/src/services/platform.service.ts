import { prisma } from '../config/database';
import { ApiError } from '../middleware/errorHandler';

// ── Types ─────────────────────────────────────────────────────────────

export type Platform = 'INSTAGRAM' | 'FACEBOOK' | 'YOUTUBE';

export interface ConnectAccountInput {
  accountName: string;
  accountId: string;
  profileUrl?: string;
  followerCount?: number;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string | Date | null;
}

export interface RefreshTokenInput {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string | Date | null;
}

// ── Validation ────────────────────────────────────────────────────────

const VALID_PLATFORMS: Platform[] = ['INSTAGRAM', 'FACEBOOK', 'YOUTUBE'];

export function isValidPlatform(value: string): value is Platform {
  return VALID_PLATFORMS.includes(value as Platform);
}

// ── Service Methods ───────────────────────────────────────────────────

/**
 * Get all connected platform accounts for a user
 */
export async function getAllAccounts(userId: string) {
  const accounts = await prisma.platformAccount.findMany({
    where: { userId },
    orderBy: [{ platform: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      userId: true,
      platform: true,
      accountName: true,
      accountId: true,
      profileUrl: true,
      followerCount: true,
      isActive: true,
      isPrimary: true,
      createdAt: true,
      updatedAt: true,
      // Exclude sensitive tokens from list view
      accessToken: false,
      refreshToken: false,
      expiresAt: true,
    },
  });

  return accounts;
}

/**
 * Get accounts for a specific platform
 */
export async function getAccountsByPlatform(userId: string, platform: Platform) {
  const accounts = await prisma.platformAccount.findMany({
    where: { userId, platform },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      userId: true,
      platform: true,
      accountName: true,
      accountId: true,
      profileUrl: true,
      followerCount: true,
      isActive: true,
      isPrimary: true,
      createdAt: true,
      updatedAt: true,
      accessToken: false,
      refreshToken: false,
      expiresAt: true,
    },
  });

  return accounts;
}

/**
 * Store a new platform account after OAuth flow
 * If this is the first account for the platform, marks it as primary.
 */
export async function connectAccount(
  userId: string,
  platform: Platform,
  input: ConnectAccountInput
) {
  // Check if an account with the same accountId already exists for this user+platform
  const existing = await prisma.platformAccount.findUnique({
    where: {
      userId_platform_accountId: {
        userId,
        platform,
        accountId: input.accountId,
      },
    },
  });

  if (existing) {
    // Update existing account with new tokens
    const updated = await prisma.platformAccount.update({
      where: { id: existing.id },
      data: {
        accountName: input.accountName,
        profileUrl: input.profileUrl,
        followerCount: input.followerCount ?? 0,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        isActive: true,
      },
      select: {
        id: true,
        userId: true,
        platform: true,
        accountName: true,
        accountId: true,
        profileUrl: true,
        followerCount: true,
        isActive: true,
        isPrimary: true,
        createdAt: true,
        updatedAt: true,
        accessToken: false,
        refreshToken: false,
        expiresAt: true,
      },
    });

    return updated;
  }

  // Check if this is the first account for this platform (to auto-set as primary)
  const existingCount = await prisma.platformAccount.count({
    where: { userId, platform },
  });
  const isPrimary = existingCount === 0;

  const account = await prisma.platformAccount.create({
    data: {
      userId,
      platform,
      accountName: input.accountName,
      accountId: input.accountId,
      profileUrl: input.profileUrl,
      followerCount: input.followerCount ?? 0,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      isActive: true,
      isPrimary,
    },
    select: {
      id: true,
      userId: true,
      platform: true,
      accountName: true,
      accountId: true,
      profileUrl: true,
      followerCount: true,
      isActive: true,
      isPrimary: true,
      createdAt: true,
      updatedAt: true,
      accessToken: false,
      refreshToken: false,
      expiresAt: true,
    },
  });

  return account;
}

/**
 * Toggle account active/inactive status
 */
export async function toggleAccount(userId: string, accountId: string) {
  const account = await prisma.platformAccount.findFirst({
    where: { id: accountId, userId },
  });

  if (!account) {
    throw new ApiError(404, 'Platform account not found');
  }

  const updated = await prisma.platformAccount.update({
    where: { id: accountId },
    data: { isActive: !account.isActive },
    select: {
      id: true,
      userId: true,
      platform: true,
      accountName: true,
      accountId: true,
      profileUrl: true,
      followerCount: true,
      isActive: true,
      isPrimary: true,
      createdAt: true,
      updatedAt: true,
      accessToken: false,
      refreshToken: false,
      expiresAt: true,
    },
  });

  return updated;
}

/**
 * Set an account as the primary account for its platform.
 * Unsets primary on all other accounts of the same platform for the user.
 */
export async function setPrimary(userId: string, accountId: string) {
  const account = await prisma.platformAccount.findFirst({
    where: { id: accountId, userId },
  });

  if (!account) {
    throw new ApiError(404, 'Platform account not found');
  }

  // Use transaction to ensure atomicity
  const [_, updated] = await prisma.$transaction([
    prisma.platformAccount.updateMany({
      where: { userId, platform: account.platform, isPrimary: true },
      data: { isPrimary: false },
    }),
    prisma.platformAccount.update({
      where: { id: accountId },
      data: { isPrimary: true },
      select: {
        id: true,
        userId: true,
        platform: true,
        accountName: true,
        accountId: true,
        profileUrl: true,
        followerCount: true,
        isActive: true,
        isPrimary: true,
        createdAt: true,
        updatedAt: true,
        accessToken: false,
        refreshToken: false,
        expiresAt: true,
      },
    }),
  ]);

  return updated;
}

/**
 * Disconnect (delete) a platform account
 */
export async function disconnectAccount(userId: string, accountId: string) {
  const account = await prisma.platformAccount.findFirst({
    where: { id: accountId, userId },
  });

  if (!account) {
    throw new ApiError(404, 'Platform account not found');
  }

  await prisma.platformAccount.delete({
    where: { id: accountId },
  });

  // If we deleted the primary account, set the oldest remaining as primary
  const remaining = await prisma.platformAccount.findFirst({
    where: { userId, platform: account.platform },
    orderBy: { createdAt: 'asc' },
  });

  if (remaining) {
    await prisma.platformAccount.update({
      where: { id: remaining.id },
      data: { isPrimary: true },
    });
  }

  return { message: 'Account disconnected successfully' };
}

/**
 * Refresh access token for a platform account
 */
export async function refreshAccessToken(
  userId: string,
  accountId: string,
  tokens: RefreshTokenInput
) {
  const account = await prisma.platformAccount.findFirst({
    where: { id: accountId, userId },
  });

  if (!account) {
    throw new ApiError(404, 'Platform account not found');
  }

  const updated = await prisma.platformAccount.update({
    where: { id: accountId },
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt ? new Date(tokens.expiresAt) : null,
    },
    select: {
      id: true,
      userId: true,
      platform: true,
      accountName: true,
      accountId: true,
      profileUrl: true,
      followerCount: true,
      isActive: true,
      isPrimary: true,
      createdAt: true,
      updatedAt: true,
      accessToken: false,
      refreshToken: false,
      expiresAt: true,
    },
  });

  return updated;
}

/**
 * Get connection status summary for all platforms
 */
export async function getConnectionStatus(userId: string) {
  const accounts = await prisma.platformAccount.findMany({
    where: { userId, isActive: true },
    select: { platform: true, isPrimary: true, accountName: true },
  });

  const allPlatforms: Platform[] = ['INSTAGRAM', 'FACEBOOK', 'YOUTUBE'];

  const status = allPlatforms.map((platform) => {
    const platformAccounts = accounts.filter((a) => a.platform === platform);
    const primary = platformAccounts.find((a) => a.isPrimary);

    return {
      platform,
      connected: platformAccounts.length > 0,
      accountCount: platformAccounts.length,
      primaryAccount: primary
        ? { name: primary.accountName }
        : null,
    };
  });

  return status;
}

/**
 * Get a single account by ID with full token details
 * (Internal use for API calls that need tokens)
 */
export async function getAccountWithTokens(userId: string, accountId: string) {
  const account = await prisma.platformAccount.findFirst({
    where: { id: accountId, userId },
  });

  if (!account) {
    throw new ApiError(404, 'Platform account not found');
  }

  return account;
}
