import cron, { ScheduledTask } from 'node-cron'
import { publishDueScheduledPosts } from '../services/scheduler.service'
import { logger } from '../utils/logger'

let task: ScheduledTask | null = null
let running = false

function envBool(name: string, fallback = false) {
  const value = process.env[name]
  if (value === undefined) return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

function envInt(name: string, fallback: number) {
  const parsed = Number.parseInt(process.env[name] || '', 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function envDate(name: string) {
  const value = process.env[name]
  if (!value) return undefined

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    logger.warn('scheduler.autopublish.invalid_date', { name, value })
    return undefined
  }
  return parsed
}

export async function runScheduledPublisherTick(source = 'manual') {
  if (running) {
    logger.warn('scheduler.autopublish.skipped_running', { source })
    return {
      skipped: true,
      reason: 'already_running',
    }
  }

  running = true
  const dryRun = envBool('SCHEDULER_AUTOPUBLISH_DRY_RUN', false)
  const limit = envInt('SCHEDULER_AUTOPUBLISH_LIMIT', 10)
  const notBefore = envDate('SCHEDULER_AUTOPUBLISH_NOT_BEFORE')

  try {
    const result = await publishDueScheduledPosts({ dryRun, limit, notBefore })
    logger.info('scheduler.autopublish.tick', {
      source,
      dryRun,
      dueCount: result.dueCount,
      publishedCount: result.published.length,
      failedCount: result.failed.length,
      skippedCount: result.skipped.length,
    })
    return result
  } finally {
    running = false
  }
}

export function startScheduledPublisherJob() {
  if (task) return task

  if (process.env.VERCEL === '1') {
    logger.info('scheduler.autopublish.disabled', {
      reason: 'vercel_serverless_use_external_cron_endpoint',
    })
    return null
  }

  if (!envBool('SCHEDULER_AUTOPUBLISH_ENABLED', false)) {
    logger.info('scheduler.autopublish.disabled', {
      reason: 'SCHEDULER_AUTOPUBLISH_ENABLED is not true',
    })
    return null
  }

  const schedule = process.env.SCHEDULER_AUTOPUBLISH_CRON || '* * * * *'
  if (!cron.validate(schedule)) {
    logger.error('scheduler.autopublish.invalid_cron', { schedule })
    return null
  }

  task = cron.schedule(schedule, () => {
    void runScheduledPublisherTick('cron').catch((err) => {
      logger.error('scheduler.autopublish.error', {
        name: err?.name,
        message: err?.message,
      })
    })
  })

  logger.info('scheduler.autopublish.started', {
    schedule,
    dryRun: envBool('SCHEDULER_AUTOPUBLISH_DRY_RUN', false),
    limit: envInt('SCHEDULER_AUTOPUBLISH_LIMIT', 10),
  })

  if (envBool('SCHEDULER_AUTOPUBLISH_RUN_ON_START', false)) {
    void runScheduledPublisherTick('startup').catch((err) => {
      logger.error('scheduler.autopublish.startup_error', {
        name: err?.name,
        message: err?.message,
      })
    })
  }

  return task
}
