import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../config/auth'
import { prisma } from '../config/database'
import { logger, setRequestUser } from '../utils/logger'

// `req.user` shape is declared globally in src/types/express.d.ts.
export type AuthRequest = Request

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token required' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyAccessToken(token)
    setRequestUser(decoded.userId)

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }

    req.user = { userId: decoded.userId, phone: decoded.phone }
    logger.debug('auth.success', { userId: decoded.userId })
    next()
  } catch (error) {
    logger.warn('auth.failed', {
      reason: error instanceof Error ? error.message : 'unknown',
    })
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const decoded = verifyAccessToken(token)
      req.user = { userId: decoded.userId, phone: decoded.phone }
      setRequestUser(decoded.userId)
      logger.debug('auth.optional.success', { userId: decoded.userId })
    }
    next()
  } catch (error) {
    logger.debug('auth.optional.failed', {
      reason: error instanceof Error ? error.message : 'unknown',
    })
    next()
  }
}
