import type { FastifyInstance } from 'fastify'
import { validateBody, validateQuery } from '../middleware/validate.js'
import { success, created, paginated } from '../lib/reply.js'
import {
  movementFiltersSchema,
  registerEntrySchema,
  registerAdjustmentSchema,
} from '../schemas/inventory-schemas.js'
import type { MovementFilters, RegisterEntry, RegisterAdjustment } from '../schemas/inventory-schemas.js'
import * as inventoryService from '../services/inventory-service.js'

export default async function inventoryRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/inventory/movements
  fastify.get(
    '/api/inventory/movements',
    {
      preHandler: [
        fastify.authenticate,
        validateQuery(movementFiltersSchema),
      ],
    },
    async (request, reply) => {
      const filters = request.query as MovementFilters
      const result = await inventoryService.getMovements(filters)
      return paginated(reply, result.data, result.page, result.limit, result.total)
    },
  )

  // POST /api/inventory/entry
  fastify.post(
    '/api/inventory/entry',
    {
      preHandler: [
        fastify.authenticate,
        validateBody(registerEntrySchema),
      ],
    },
    async (request, reply) => {
      const data = request.body as RegisterEntry
      const results = await inventoryService.registerEntry(data, request.user.id)
      return created(reply, results)
    },
  )

  // POST /api/inventory/adjustment
  fastify.post(
    '/api/inventory/adjustment',
    {
      preHandler: [
        fastify.authenticate,
        validateBody(registerAdjustmentSchema),
      ],
    },
    async (request, reply) => {
      const data = request.body as RegisterAdjustment
      const result = await inventoryService.registerAdjustment(data, request.user.id)
      return created(reply, result)
    },
  )

  // GET /api/inventory/alerts
  fastify.get(
    '/api/inventory/alerts',
    { preHandler: [fastify.authenticate] },
    async (_request, reply) => {
      const alerts = await inventoryService.getLowStockAlerts()
      return success(reply, alerts)
    },
  )

  // GET /api/inventory/out-of-stock
  fastify.get(
    '/api/inventory/out-of-stock',
    { preHandler: [fastify.authenticate] },
    async (_request, reply) => {
      const items = await inventoryService.getOutOfStock()
      return success(reply, items)
    },
  )

  // GET /api/inventory/valuation
  fastify.get(
    '/api/inventory/valuation',
    { preHandler: [fastify.authenticate] },
    async (_request, reply) => {
      const valuation = await inventoryService.getValuation()
      return success(reply, valuation)
    },
  )
}
