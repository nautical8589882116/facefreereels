/**
 * The Prisma schema models a user's subscriptions as a one-to-many relation
 * (`User.subscriptions`), but the API contract exposes a single current
 * subscription (`user.subscription`, nullable). Services therefore load the
 * newest ACTIVE subscription and reshape the record through this helper.
 */

type WithSubscriptions<T> = T & { subscriptions: unknown[] }

export function withCurrentSubscription<T extends object>(
  user: WithSubscriptions<T>
): Omit<T, 'subscriptions'> & { subscription: unknown | null } {
  const { subscriptions, ...rest } = user
  return { ...rest, subscription: subscriptions[0] ?? null }
}

/**
 * Include clause shared by every endpoint that returns the user profile, so
 * the shape stays identical across auth, profile read, and profile update.
 */
export const userProfileInclude = {
  subscriptions: {
    where: { status: 'ACTIVE' as const },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
  _count: {
    select: {
      campaigns: true,
      reels: true,
    },
  },
} as const
