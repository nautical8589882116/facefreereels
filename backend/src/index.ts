import 'dotenv/config'
import path from 'node:path'
import fs from 'node:fs'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'

import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { authenticate } from './middleware/auth'
import { apiLogger, requestContextMiddleware } from './utils/logger'

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
import jobsRoutes from './routes/jobs.routes'
import { startScheduledPublisherJob } from './jobs/scheduledPublisher.job'

const app = express()
const PORT = parseInt(process.env.PORT || '4000')

// ─── Security Middleware ─────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))
const allowedOrigins = process.env.FRONTEND_URL?.split(',')
app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin / curl (no origin), explicit allowlist, and any localhost port in dev
    if (!origin) return callback(null, true)
    if (allowedOrigins?.includes(origin)) return callback(null, true)
    if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true)
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`))
  },
  credentials: true,
}))
app.use(requestContextMiddleware)

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
app.use(apiLogger)

// ─── Root & Health ───────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'NHY-QR Ad Manager API',
    health: '/api/health',
    apiBase: '/api',
  })
})

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'NHY-QR Ad Manager API is running', timestamp: new Date().toISOString() })
})

// ─── Public Routes ───────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/oauth', oauthRoutes)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentRoutes)
app.use('/api/jobs', jobsRoutes)

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

// ─── Static Frontend (single App Service hosts API + SPA) ────
// The CI build copies webapp/dist into backend/public before packaging.
const publicDir = path.join(__dirname, '..', 'public')

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, { maxAge: '30d', index: false }))

  // SPA fallback — anything that is not an /api route serves index.html
  app.get(/^(?!\/api\/).*/, (_req, res, next) => {
    res.sendFile(path.join(publicDir, 'index.html'), (err) => {
      if (err) next(err)
    })
  })
}

// ─── Error Handling ──────────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

// ─── Start Server ────────────────────────────────────────────
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 NHY-QR Ad Manager API running on port ${PORT}`)
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}

startScheduledPublisherJob()

export default app
