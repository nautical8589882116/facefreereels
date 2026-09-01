import { AsyncLocalStorage } from 'async_hooks'
import { randomUUID } from 'crypto'
import { Request, Response, NextFunction } from 'express'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface RequestLogContext {
  requestId: string
  method?: string
  path?: string
  userId?: string
}

interface LogRecord {
  level: LogLevel
  event: string
  timestamp: string
  requestId?: string
  method?: string
  path?: string
  userId?: string
  [key: string]: unknown
}

const requestContext = new AsyncLocalStorage<RequestLogContext>()

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase()
const LOG_REQUEST_BODY = process.env.LOG_REQUEST_BODY === 'true'
const LOG_RESPONSE_BODY = process.env.LOG_RESPONSE_BODY === 'true'
const LOG_SERVICE_ARGS = process.env.LOG_SERVICE_ARGS === 'true'
const LOG_SERVICE_RESULT = process.env.LOG_SERVICE_RESULT === 'true'
const LOG_STACK = process.env.LOG_STACK !== 'false' && process.env.NODE_ENV !== 'production'
const MAX_LOG_VALUE_LENGTH = parseInt(process.env.MAX_LOG_VALUE_LENGTH || '2000', 10)

const REDACTED = '[REDACTED]'
const SENSITIVE_KEY_PATTERN =
  /pass(word)?|token|secret|authorization|auth|cookie|otp|verificationCode|signature|api[_-]?key|keySecret|clientSecret|sid|phone|email/i
const SENSITIVE_VALUE_PATTERN =
  /^(\+?\d{10,15}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|Bearer\s+.+|eyJ[A-Za-z0-9_-]+\..+|rzp_(test|live)_.+|AC[a-f0-9]{32}|VA[a-f0-9]{32})$/i

function shouldLog(level: LogLevel) {
  if (LOG_LEVEL === 'silent') return false
  const configured = LEVEL_WEIGHT[LOG_LEVEL as LogLevel] ?? LEVEL_WEIGHT.info
  return LEVEL_WEIGHT[level] >= configured
}

function truncate(value: string) {
  if (value.length <= MAX_LOG_VALUE_LENGTH) return value
  return `${value.slice(0, MAX_LOG_VALUE_LENGTH)}...[truncated]`
}

export function sanitizeForLog(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value
  if (depth > 5) return '[MAX_DEPTH]'

  if (typeof value === 'string') {
    if (SENSITIVE_VALUE_PATTERN.test(value.trim())) return REDACTED
    return truncate(value)
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (value instanceof Date) return value.toISOString()
  if (Buffer.isBuffer(value)) return `[Buffer ${value.length} bytes]`

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeForLog(item, depth + 1))
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).slice(0, 80)
    return entries.reduce<Record<string, unknown>>((acc, [key, item]) => {
      acc[key] = SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : sanitizeForLog(item, depth + 1)
      return acc
    }, {})
  }

  return String(value)
}

function writeLog(level: LogLevel, event: string, fields: Record<string, unknown> = {}) {
  if (!shouldLog(level)) return

  const context = requestContext.getStore()
  const record: LogRecord = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...context,
    ...(sanitizeForLog(fields) as Record<string, unknown>),
  }

  const line = JSON.stringify(record)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const logger = {
  debug: (event: string, fields?: Record<string, unknown>) => writeLog('debug', event, fields),
  info: (event: string, fields?: Record<string, unknown>) => writeLog('info', event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => writeLog('warn', event, fields),
  error: (event: string, fields?: Record<string, unknown>) => writeLog('error', event, fields),
}

export function getRequestContext() {
  return requestContext.getStore()
}

export function setRequestUser(userId: string | undefined) {
  const context = requestContext.getStore()
  if (context && userId) context.userId = userId
}

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = String(req.headers['x-request-id'] || randomUUID())
  res.setHeader('x-request-id', requestId)

  requestContext.run(
    {
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
    },
    next
  )
}

export function apiLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = process.hrtime.bigint()
  const contentLengthBefore = res.getHeader('content-length')
  let responseBody: unknown

  const originalJson = res.json.bind(res)
  res.json = ((body?: unknown) => {
    responseBody = body
    return originalJson(body)
  }) as Response['json']

  logger.info('api.request.start', {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    query: req.query,
    body: LOG_REQUEST_BODY ? req.body : undefined,
  })

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
    const statusCode = res.statusCode
    const event = statusCode >= 500 ? 'api.request.error' : statusCode >= 400 ? 'api.request.warn' : 'api.request.finish'
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'

    logger[level](event, {
      statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      contentLength: res.getHeader('content-length') || contentLengthBefore,
      responseBody: LOG_RESPONSE_BODY ? responseBody : undefined,
    })
  })

  next()
}

export function logError(error: Error, fields: Record<string, unknown> = {}) {
  logger.error('api.error', {
    name: error.name,
    message: error.message,
    stack: LOG_STACK ? error.stack : undefined,
    ...fields,
  })
}

export function instrumentServiceModule<T extends Record<string, unknown>>(serviceName: string, serviceModule: T): T {
  const wrapped = new Map<PropertyKey, unknown>()

  return new Proxy(serviceModule, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)
      if (typeof value !== 'function') return value
      if (wrapped.has(prop)) return wrapped.get(prop)

      const operation = String(prop)
      const traced = (...args: unknown[]) => {
        const startedAt = process.hrtime.bigint()
        logger.debug('service.call.start', {
          service: serviceName,
          operation,
          args: LOG_SERVICE_ARGS ? args : undefined,
        })

        try {
          const result = value.apply(target, args)
          if (result && typeof result.then === 'function') {
            return result
              .then((resolved: unknown) => {
                const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
                logger.info('service.call.success', {
                  service: serviceName,
                  operation,
                  durationMs: Number(durationMs.toFixed(2)),
                  result: LOG_SERVICE_RESULT ? resolved : undefined,
                })
                return resolved
              })
              .catch((error: Error) => {
                const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
                logger.error('service.call.error', {
                  service: serviceName,
                  operation,
                  durationMs: Number(durationMs.toFixed(2)),
                  name: error.name,
                  message: error.message,
                  stack: LOG_STACK ? error.stack : undefined,
                })
                throw error
              })
          }

          const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
          logger.info('service.call.success', {
            service: serviceName,
            operation,
            durationMs: Number(durationMs.toFixed(2)),
            result: LOG_SERVICE_RESULT ? result : undefined,
          })
          return result
        } catch (error) {
          const err = error as Error
          const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
          logger.error('service.call.error', {
            service: serviceName,
            operation,
            durationMs: Number(durationMs.toFixed(2)),
            name: err.name,
            message: err.message,
            stack: LOG_STACK ? err.stack : undefined,
          })
          throw error
        }
      }

      wrapped.set(prop, traced)
      return traced
    },
  })
}
