import { Router } from 'express'
import type { Request } from 'express'
import { timingSafeEqual } from 'crypto'
import { ApiError } from '../middleware/errorHandler'
import { successResponse } from '../utils/response'
import { publishDueScheduledPosts } from '../services/scheduler.service'

const router = Router()

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

function requireJobSecret(req: Request) {
  const expected = process.env.SCHEDULER_JOB_SECRET || process.env.CRON_SECRET
  if (!expected) {
    throw new ApiError(503, 'Scheduler job secret is not configured.')
  }

  const authHeader = String(req.headers.authorization || '')
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : ''
  const headerSecret = String(req.headers['x-scheduler-secret'] || '')
  const provided = bearer || headerSecret

  if (!provided || !safeEqual(provided, expected)) {
    throw new ApiError(401, 'Invalid scheduler job secret.')
  }
}

function parseOptionalDate(value: unknown, name: string) {
  if (!value) return undefined
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, `${name} must be a valid ISO datetime.`)
  }
  return parsed
}

function getNotBefore(req: Request) {
  return parseOptionalDate(req.query.notBefore || process.env.SCHEDULER_AUTOPUBLISH_NOT_BEFORE, 'notBefore')
}

router.post('/scheduler/publish-due', async (req, res, next) => {
  try {
    requireJobSecret(req)

    const dryRun = req.query.dryRun === 'true'
    const rawLimit = Number.parseInt(String(req.query.limit || ''), 10)
    const limit = Number.isFinite(rawLimit) ? rawLimit : undefined
    const notBefore = getNotBefore(req)

    const result = await publishDueScheduledPosts({ dryRun, limit, notBefore })
    return successResponse(res, result, dryRun ? 'Due posts dry run complete' : 'Due posts publish job complete')
  } catch (err) {
    next(err)
  }
})

router.get('/scheduler/publish-due', async (req, res, next) => {
  try {
    requireJobSecret(req)

    const dryRun = req.query.dryRun === 'true'
    const rawLimit = Number.parseInt(String(req.query.limit || ''), 10)
    const limit = Number.isFinite(rawLimit) ? rawLimit : undefined
    const notBefore = getNotBefore(req)

    const result = await publishDueScheduledPosts({ dryRun, limit, notBefore })
    return successResponse(res, result, dryRun ? 'Due posts dry run complete' : 'Due posts publish job complete')
  } catch (err) {
    next(err)
  }
})

export default router
