import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ZodSchema, ZodError } from 'zod'
import { ValidationError } from '../lib/errors.js'

type PreHandler = (
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void,
) => void

function formatZodError(error: ZodError): Array<{ path: string; message: string }> {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

export function validateBody<T>(schema: ZodSchema<T>): PreHandler {
  return (request: FastifyRequest, _reply: FastifyReply, done: (err?: Error) => void) => {
    const result = schema.safeParse(request.body)
    if (!result.success) {
      done(new ValidationError('Request body validation failed', formatZodError(result.error)))
      return
    }
    request.body = result.data
    done()
  }
}

export function validateParams<T>(schema: ZodSchema<T>): PreHandler {
  return (request: FastifyRequest, _reply: FastifyReply, done: (err?: Error) => void) => {
    const result = schema.safeParse(request.params)
    if (!result.success) {
      done(new ValidationError('Path params validation failed', formatZodError(result.error)))
      return
    }
    request.params = result.data as typeof request.params
    done()
  }
}

export function validateQuery<T>(schema: ZodSchema<T>): PreHandler {
  return (request: FastifyRequest, _reply: FastifyReply, done: (err?: Error) => void) => {
    const result = schema.safeParse(request.query)
    if (!result.success) {
      done(new ValidationError('Query params validation failed', formatZodError(result.error)))
      return
    }
    request.query = result.data as typeof request.query
    done()
  }
}
