import type { FastifyInstance, FastifyError } from 'fastify'
import fp from 'fastify-plugin'
import { ZodError } from 'zod'
import { AppError } from '../lib/errors.js'

interface ErrorResponseBody {
  success: false
  error: {
    code: string
    message: string
    details: unknown
  }
}

function buildErrorResponse(
  code: string,
  message: string,
  details?: unknown,
): ErrorResponseBody {
  return {
    success: false,
    error: {
      code,
      message,
      details: details ?? null,
    },
  }
}

function redactSensitiveFields(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj
  if (Array.isArray(obj)) return obj.map(redactSensitiveFields)

  const redacted: Record<string, unknown> = {}
  const sensitiveKeys = new Set([
    'password',
    'passwordHash',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'authorization',
    'cookie',
  ])

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (sensitiveKeys.has(key.toLowerCase())) {
      redacted[key] = '[REDACTED]'
    } else {
      redacted[key] = redactSensitiveFields(value)
    }
  }

  return redacted
}

async function errorHandlerPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.setErrorHandler((error: FastifyError | Error, request, reply) => {
    const safeError = redactSensitiveFields({
      message: error.message,
      url: request.url,
      method: request.method,
    })

    // Application errors
    if (error instanceof AppError) {
      request.log.warn(safeError, `AppError: ${error.code}`)
      return reply
        .status(error.statusCode)
        .send(buildErrorResponse(error.code, error.message, error.details))
    }

    // Zod validation errors
    if (error instanceof ZodError) {
      const details = error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }))
      request.log.warn(safeError, 'Validation error')
      return reply
        .status(400)
        .send(buildErrorResponse('VALIDATION_ERROR', 'Validation failed', details))
    }

    // Fastify validation errors (from schema validation)
    const fastifyError = error as FastifyError
    if (fastifyError.statusCode && fastifyError.statusCode < 500) {
      request.log.warn(safeError, `Client error: ${fastifyError.statusCode}`)
      return reply
        .status(fastifyError.statusCode)
        .send(
          buildErrorResponse(
            fastifyError.code ?? 'CLIENT_ERROR',
            fastifyError.message,
          ),
        )
    }

    // Unexpected errors — do NOT leak details
    request.log.error(
      { err: error, url: request.url, method: request.method },
      'Unhandled error',
    )
    return reply
      .status(500)
      .send(
        buildErrorResponse(
          'INTERNAL_SERVER_ERROR',
          'An unexpected error occurred',
        ),
      )
  })

  fastify.setNotFoundHandler((request, reply) => {
    return reply
      .status(404)
      .send(
        buildErrorResponse(
          'ROUTE_NOT_FOUND',
          `Route ${request.method} ${request.url} not found`,
        ),
      )
  })
}

export default fp(errorHandlerPlugin, {
  name: 'error-handler',
  fastify: '5.x',
})
