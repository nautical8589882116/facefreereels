import { prisma } from '../config/database';
import {
  generateAccessToken,
  generateRefreshToken,
  generateOtp,
  verifyRefreshToken,
} from '../config/auth';
import { sendOtp as sendOtpSms } from '../config/otp';
import { ApiError } from '../middleware/errorHandler';

/**
 * Send OTP to a phone number
 * Creates an OTP record in the database and sends it via SMS
 */
export const sendOtp = async (phone: string): Promise<void> => {
  // Generate a 6-digit OTP
  const code = generateOtp();

  // Set expiry to 10 minutes from now
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Invalidate any existing unverified OTPs for this phone
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

  // Create new OTP record
  await prisma.otp.create({
    data: {
      phone,
      code,
      expiresAt,
      verified: false,
    },
  });

  // Send OTP via SMS
  await sendOtpSms(phone, code);
};

/**
 * Verify OTP and authenticate user
 * Checks OTP validity, marks as verified, finds or creates user, returns tokens
 */
export const verifyOtp = async (
  phone: string,
  code: string
): Promise<{ user: any; accessToken: string; refreshToken: string }> => {
  // Find the OTP record
  const otpRecord = await prisma.otp.findFirst({
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

  if (!otpRecord) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  // Mark OTP as verified
  await prisma.otp.update({
    where: { id: otpRecord.id },
    data: { verified: true },
  });

  // Find or create user by phone number
  let user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone,
        name: null,
        email: null,
        avatar: null,
        role: 'USER',
        isVerified: true,
      },
    });
  } else if (!user.isVerified) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.phone);
  const refreshToken = generateRefreshToken(user.id);

  return { user, accessToken, refreshToken };
};

/**
 * Refresh access token using a refresh token
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

  // Check if user still exists
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  // Generate new access token
  const accessToken = generateAccessToken(user.id, user.phone);

  return { accessToken };
};

/**
 * Get current user with subscription info
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
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const { subscriptions, ...rest } = user;

  return { ...rest, subscription: subscriptions[0] ?? null };
};
