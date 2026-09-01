import { prisma } from '../config/database';
import {
  generateAccessToken,
  generateRefreshToken,
  generateOtp,
  verifyRefreshToken,
} from '../config/auth';
import { sendOtp as sendOtpSms } from '../config/otp';
import { isDemoLogin, isDemoPhone } from '../config/demoLogin';
import { ApiError } from '../middleware/errorHandler';

const DEV_OTP_BYPASS = process.env.DEV_OTP_BYPASS === 'true';
const DEV_OTP_CODE = process.env.DEV_OTP_CODE || '000000';

/**
 * Send OTP to a phone number.
 * Creates an OTP record in the database and sends it via SMS.
 * In dev mode with DEV_OTP_BYPASS=true, SMS is skipped and a fixed code can be used.
 */
export const sendOtp = async (phone: string): Promise<void> => {
  if (isDemoPhone(phone)) {
    return;
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.otp.updateMany({
    where: {
      phone,
      verified: false,
      expiresAt: { gt: new Date() },
    },
    data: {
      expiresAt: new Date(),
    },
  });

  await prisma.otp.create({
    data: {
      phone,
      code,
      expiresAt,
      verified: false,
    },
  });

  if (DEV_OTP_BYPASS) {
    // eslint-disable-next-line no-console
    console.log(`[DEV OTP BYPASS] Phone: ${phone} | Real code: ${code} | Bypass code: ${DEV_OTP_CODE}`);
    return;
  }

  await sendOtpSms(phone, code);
};

/**
 * Verify OTP and authenticate user.
 * Checks OTP validity, marks it verified, finds or creates user, returns tokens.
 */
export const verifyOtp = async (
  phone: string,
  code: string,
  name?: string
): Promise<{ user: any; accessToken: string; refreshToken: string; isNewUser: boolean }> => {
  const demoLogin = isDemoLogin(phone, code);
  let otpRecord = demoLogin
    ? null
    : await prisma.otp.findFirst({
        where: {
          phone,
          code,
          verified: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

  if (!otpRecord && DEV_OTP_BYPASS && code === DEV_OTP_CODE) {
    otpRecord = await prisma.otp.findFirst({
      where: {
        phone,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    // eslint-disable-next-line no-console
    console.log(`[DEV OTP BYPASS] Verified ${phone} using bypass code ${DEV_OTP_CODE}`);
  }

  if (!otpRecord && !demoLogin) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  if (otpRecord) {
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });
  }

  let user = await prisma.user.findUnique({
    where: { phone },
  });

  let isNewUser = false;
  const trimmedName = name?.trim();

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone,
        name: trimmedName || null,
        email: null,
        avatar: null,
        role: 'USER',
        isVerified: true,
      },
    });
    isNewUser = true;
  } else if (!user.isVerified || (trimmedName && !user.name)) {
    const wasUnverified = !user.isVerified;
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(wasUnverified && { isVerified: true }),
        ...(trimmedName && !user.name && { name: trimmedName }),
      },
    });
    isNewUser = wasUnverified;
  }

  const accessToken = generateAccessToken(user.id, user.phone);
  const refreshToken = generateRefreshToken(user.id);

  return { user, accessToken, refreshToken, isNewUser };
};

/**
 * Refresh access token using a refresh token.
 */
export const refreshToken = async (token: string): Promise<{ accessToken: string }> => {
  let decoded: { userId: string };

  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }

  if (!decoded?.userId) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  const accessToken = generateAccessToken(user.id, user.phone);

  return { accessToken };
};

/**
 * Get current user with subscription info.
 */
export const getUser = async (userId: string): Promise<any> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: {
        select: {
          campaigns: true,
          reels: true,
          assets: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return user;
};

export function formatUserForClient(user: any, isNewUser = false) {
  const subscription = user.subscriptions?.[0] ?? user.subscription ?? null;

  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    role: user.role?.toLowerCase() ?? 'user',
    isNewUser,
    subscription: subscription
      ? {
          id: subscription.id,
          plan: subscription.plan?.toLowerCase() ?? 'free',
          status: subscription.status?.toLowerCase() ?? 'active',
          expiresAt: subscription.expiresAt?.toISOString() ?? null,
          razorpaySubscriptionId: subscription.razorpayPaymentId ?? null,
        }
      : null,
    createdAt: user.createdAt?.toISOString?.() ?? user.createdAt,
  };
}