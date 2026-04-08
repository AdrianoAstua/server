import type { FastifyInstance } from 'fastify'
import { validateQuery } from '../middleware/validate.js'
import { success, paginated } from '../lib/reply.js'
import { syncLogsQuerySchema } from '../schemas/crm-schemas.js'
import type { SyncLogsQuery } from '../schemas/crm-schemas.js'
import * as crmApiService from '../services/crm-api-service.js'

export default async function crmRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/crm/status — test connection + stats (ADMIN)
  fastify.get(
    '/api/crm/status',
    {
      preHandler: [fastify.authorize('ADMIN')],
    },
    async (_request, reply) => {
      const status = await crmApiService.getCRMStatus()
      return success(reply, status)
    },
  )

  // POST /api/crm/sync-all — force full sync (ADMIN)
  fastify.post(
    '/api/crm/sync-all',
    {
      preHandler: [fastify.authorize('ADMIN')],
    },
    async (_request, reply) => {
      const result = await crmApiService.syncAllOrders()
      return success(reply, result)
    },
  )

  // GET /api/crm/sync-logs — sync history (ADMIN)
  fastify.get(
    '/api/crm/sync-logs',
    {
      preHandler: [fastify.authorize('ADMIN'), validateQuery(syncLogsQuerySchema)],
    },
    async (request, reply) => {
      const query = request.query as SyncLogsQuery
      const result = await crmApiService.listSyncLogs(query)
      return paginated(reply, result.data, result.page, result.limit, result.total)
    },
  )
}
