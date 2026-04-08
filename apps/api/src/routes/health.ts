import type { FastifyInstance } from 'fastify'
import { getDatabase } from '@voneb/database'
import { success } from '../lib/reply.js'

export default async function healthRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  fastify.get('/api/health', async (_request, reply) => {
    let dbHealthy = false
    let redisHealthy = false

    // Check database connectivity
    try {
      const db = getDatabase()
      await db.$queryRaw`SELECT 1`
      dbHealthy = true
    } catch (err) {
      fastify.log.warn({ err }, 'Database health check failed')
    }

    // Check Redis connectivity (BullMQ / ioredis)
    // Redis check is a placeholder until a shared Redis client is registered
    try {
      // If a redis decorator exists, ping it
      const redis = (fastify as unknown as Record<string, unknown>)['redis'] as
        | { ping: () => Promise<string> }
        | undefined
      if (redis) {
        await redis.ping()
        redisHealthy = true
      } else {
        // No redis client registered yet — mark as unknown
        redisHealthy = false
      }
    } catch (err) {
      fastify.log.warn({ err }, 'Redis health check failed')
    }

    const status = dbHealthy ? 'ok' : 'degraded'

    return success(reply, {
      status,
      db: dbHealthy,
      redis: redisHealthy,
      uptime: process.uptime(),
      version: process.env['npm_package_version'] ?? '0.1.0',
      timestamp: new Date().toISOString(),
    })
  })
}
