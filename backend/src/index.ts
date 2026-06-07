import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { authenticate } from './middleware/auth'

// ─── Route Imports ───────────────────────────────────────────
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import campaignRoutes from './routes/campaign.routes'
import adCopyRoutes from './routes/adcopy.routes'
import reelRoutes from './routes/reel.routes'
import assetRoutes from './routes/asset.routes'
import schedulerRoutes from './routes/scheduler.routes'
import analyticsRoutes from './routes/analytics.routes'
import settingsRoutes from './routes/settings.routes'
import platformRoutes from './routes/platform.routes'
import paymentRoutes from './routes/payment.routes'
import oauthRoutes from './routes/oauth.routes'

const app = express()
const PORT = parseInt(process.env.PORT || '4000')

// ─── Security Middleware ─────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))
app.use(cors({
  origin: process.env.FRONTEND_URL?.split(',') || ['http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}))

// ─── Rate Limiting ───────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10'),
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
})

app.use(limiter)

// ─── Body Parsing ────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(compression())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// ─── Health Check ────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'NHY-QR Ad Manager API is running', timestamp: new Date().toISOString() })
})

// ─── Public Routes ───────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/oauth', oauthRoutes)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentRoutes)

// ─── Protected Routes ────────────────────────────────────────
app.use('/api/user', authenticate, userRoutes)
app.use('/api/campaigns', authenticate, campaignRoutes)
app.use('/api/ad-copies', authenticate, adCopyRoutes)
app.use('/api/reels', authenticate, reelRoutes)
app.use('/api/assets', authenticate, assetRoutes)
app.use('/api/scheduler', authenticate, schedulerRoutes)
app.use('/api/analytics', authenticate, analyticsRoutes)
app.use('/api/settings', authenticate, settingsRoutes)
app.use('/api/platforms', authenticate, platformRoutes)
app.use('/api/payments', authenticate, paymentRoutes)

// ─── Error Handling ──────────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

// ─── Start Server ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 NHY-QR Ad Manager API running on port ${PORT}`)
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app
