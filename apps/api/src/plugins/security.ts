import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import cookie from '@fastify/cookie'
import { getEnv } from '../config/env.js'

async function securityPlugin(fastify: FastifyInstance): Promise<void> {
  const env = getEnv()

  // CORS
  const origins = env.CORS_ORIGINS.split(',').map((o) => o.trim())
  await fastify.register(cors, {
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  })

  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      return request.ip
    },
    errorResponseBuilder: () => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        details: null,
      },
    }),
  })

  // Cookies (for refresh token)
  await fastify.register(cookie, {
    secret: env.JWT_SECRET,
    parseOptions: {},
  })
}

export default fp(securityPlugin, {
  name: 'security',
  fastify: '5.x',
})
