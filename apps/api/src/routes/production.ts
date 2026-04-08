import type { FastifyInstance } from 'fastify'
import { validateBody, validateParams } from '../middleware/validate.js'
import { success, created } from '../lib/reply.js'
import {
  scanInSchema,
  scanOutSchema,
  stationParamsSchema,
  workOrderIdParamsSchema,
} from '../schemas/production-schemas.js'
import type {
  ScanIn,
  ScanOut,
  StationParams,
  WorkOrderIdParams,
} from '../schemas/production-schemas.js'
import * as productionService from '../services/production-service.js'

export default async function productionRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /api/production/scan-in
  fastify.post(
    '/api/production/scan-in',
    {
      preHandler: [
        fastify.authorize('PRODUCCION', 'ADMIN'),
        validateBody(scanInSchema),
      ],
    },
    async (request, reply) => {
      const data = request.body as ScanIn
      const log = await productionService.scanIn(data)
      return created(reply, log)
    },
  )

  // POST /api/production/scan-out
  fastify.post(
    '/api/production/scan-out',
    {
      preHandler: [
        fastify.authorize('PRODUCCION', 'ADMIN'),
        validateBody(scanOutSchema),
      ],
    },
    async (request, reply) => {
      const data = request.body as ScanOut
      const log = await productionService.scanOut(data)
      return success(reply, log)
    },
  )

  // GET /api/production/station/:station/queue
  fastify.get(
    '/api/production/station/:station/queue',
    {
      preHandler: [
        fastify.authorize('PRODUCCION', 'SUPERVISOR_GENERAL', 'ADMIN'),
        validateParams(stationParamsSchema),
      ],
    },
    async (request, reply) => {
      const { station } = request.params as StationParams
      const queue = await productionService.getStationQueue(station)
      return success(reply, queue)
    },
  )

  // GET /api/production/wip
  fastify.get(
    '/api/production/wip',
    {
      preHandler: [fastify.authenticate],
    },
    async (_request, reply) => {
      const dashboard = await productionService.getWIPDashboard()
      return success(reply, dashboard)
    },
  )

  // GET /api/production/timeline/:workOrderId
  fastify.get(
    '/api/production/timeline/:workOrderId',
    {
      preHandler: [fastify.authenticate, validateParams(workOrderIdParamsSchema)],
    },
    async (request, reply) => {
      const { workOrderId } = request.params as WorkOrderIdParams
      const timeline = await productionService.getProductionTimeline(workOrderId)
      return success(reply, timeline)
    },
  )
}
