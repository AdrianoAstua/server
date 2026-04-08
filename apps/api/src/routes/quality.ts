import type { FastifyInstance } from 'fastify'
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js'
import { success, created } from '../lib/reply.js'
import {
  performCheckSchema,
  qcLineParamsSchema,
  qcStatsQuerySchema,
} from '../schemas/quality-schemas.js'
import type {
  PerformCheck,
  QCLineParams,
  QCStatsQuery,
} from '../schemas/quality-schemas.js'
import * as qualityService from '../services/quality-service.js'

export default async function qualityRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /api/quality/check
  fastify.post(
    '/api/quality/check',
    {
      preHandler: [
        fastify.authorize('CONTROL_CALIDAD', 'ADMIN'),
        validateBody(performCheckSchema),
      ],
    },
    async (request, reply) => {
      const data = request.body as PerformCheck
      const check = await qualityService.performCheck(data)
      return created(reply, check)
    },
  )

  // GET /api/quality/history/:workOrderLineId
  fastify.get(
    '/api/quality/history/:workOrderLineId',
    {
      preHandler: [fastify.authenticate, validateParams(qcLineParamsSchema)],
    },
    async (request, reply) => {
      const { workOrderLineId } = request.params as QCLineParams
      const history = await qualityService.getQCHistory(workOrderLineId)
      return success(reply, history)
    },
  )

  // GET /api/quality/stats
  fastify.get(
    '/api/quality/stats',
    {
      preHandler: [
        fastify.authorize('ADMIN', 'SUPERVISOR_GENERAL'),
        validateQuery(qcStatsQuerySchema),
      ],
    },
    async (request, reply) => {
      const query = request.query as QCStatsQuery
      const stats = await qualityService.getQCStats(query)
      return success(reply, stats)
    },
  )
}
