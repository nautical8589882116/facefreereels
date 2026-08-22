import { prisma } from '../config/database';
import { ApiError } from '../middleware/errorHandler';

/**
 * Get user profile by user ID
 */
export const getProfile = async (userId: string): Promise<any> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: true,
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

  return user;
};

/**
 * Update user profile fields
 */
export const updateProfile = async (
  userId: string,
  data: { name?: string; email?: string; avatar?: string }
): Promise<any> => {
  // Check if email is already taken by another user
  if (data.email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      throw new ApiError(409, 'Email already in use');
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.avatar !== undefined && { avatar: data.avatar }),
    },
    include: {
      subscriptions: true,
      _count: {
        select: {
          campaigns: true,
          reels: true,
        },
      },
    },
  });

  return user;
};

/**
 * Update user avatar
 */
export const updateAvatar = async (
  userId: string,
  fileUrl: string
): Promise<any> => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatar: fileUrl },
    include: {
      subscriptions: true,
      _count: {
        select: {
          campaigns: true,
          reels: true,
        },
      },
    },
  });

  return user;
};

/**
 * Delete user account and all associated data
 */
export const deleteUser = async (userId: string): Promise<void> => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Delete user and all related data (cascade deletes handle related records)
  await prisma.user.delete({
    where: { id: userId },
  });
};
