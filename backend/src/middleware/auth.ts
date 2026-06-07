import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../config/auth'
import { prisma } from '../config/database'

export interface AuthRequest extends Request {
  user?: {
    userId: string
    phone: string
  }
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token required' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyAccessToken(token)

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }

    req.user = { userId: decoded.userId, phone: decoded.phone }
    next()
  } catch {
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
    }
    next()
  } catch {
    next()
  }
}
