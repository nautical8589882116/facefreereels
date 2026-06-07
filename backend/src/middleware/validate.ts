import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { ApiError } from './errorHandler'

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errors: Record<string, string[]> = {}
      result.error.errors.forEach((e) => {
        const path = e.path.join('.')
        if (!errors[path]) errors[path] = []
        errors[path].push(e.message)
      })
      throw new ApiError(400, 'Validation failed', errors)
    }
    req.body = result.data
    next()
  }
}
