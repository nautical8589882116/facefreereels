import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!
const SALT_ROUNDS = 12

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// `expiresIn` accepts jsonwebtoken's own duration union, which a plain
// `string` from the environment does not satisfy. Read it through the option
// type so an override like "30m" stays valid without widening the signature.
const ACCESS_EXPIRY = (process.env.JWT_ACCESS_EXPIRY ||
  '15m') as jwt.SignOptions['expiresIn']
const REFRESH_EXPIRY = (process.env.JWT_REFRESH_EXPIRY ||
  '7d') as jwt.SignOptions['expiresIn']

export function generateAccessToken(userId: string, phone: string): string {
  return jwt.sign({ userId, phone, type: 'access' }, JWT_SECRET, {
    expiresIn: ACCESS_EXPIRY,
  })
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRY,
  })
}

export function verifyAccessToken(token: string): { userId: string; phone: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string; phone: string }
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string }
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
