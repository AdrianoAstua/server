import type { FastifyInstance } from 'fastify'
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js'
import { success, created, paginated } from '../lib/reply.js'
import {
  startCountSchema,
  countItemSchema,
  physicalCountParamsSchema,
  physicalCountFiltersSchema,
} from '../schemas/physical-count-schemas.js'
import type {
  StartCount,
  CountItem,
  PhysicalCountParams,
  PhysicalCountFilters,
} from '../schemas/physical-count-schemas.js'
import * as physicalCountService from '../services/physical-count-service.js'

export default async function physicalCountRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/physical-counts
  fastify.get(
    '/api/physical-counts',
    {
      preHandler: [fastify.authenticate, validateQuery(physicalCountFiltersSchema)],
    },
    async (request, reply) => {
      const filters = request.query as PhysicalCountFilters
      const result = await physicalCountService.listCounts(filters)
      return paginated(reply, result.data, result.page, result.limit, result.total)
    },
  )

  // GET /api/physical-counts/:id
  fastify.get(
    '/api/physical-counts/:id',
    {
      preHandler: [fastify.authenticate, validateParams(physicalCountParamsSchema)],
    },
    async (request, reply) => {
      const { id } = request.params as PhysicalCountParams
      const count = await physicalCountService.getCount(id)
      return success(reply, count)
    },
  )

  // POST /api/physical-counts
  fastify.post(
    '/api/physical-counts',
    {
      preHandler: [fastify.authenticate, validateBody(startCountSchema)],
    },
    async (request, reply) => {
      const data = request.body as StartCount
      const userId = request.user!.id
      const count = await physicalCountService.startCount(
        data.locationId,
        userId,
        data.categoryId,
        data.notes,
      )
      return created(reply, count)
    },
  )

  // PUT /api/physical-counts/:id/items
  fastify.put(
    '/api/physical-counts/:id/items',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(physicalCountParamsSchema),
        validateBody(countItemSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as PhysicalCountParams
      const data = request.body as CountItem
      const item = await physicalCountService.countItem(id, data)
      return success(reply, item)
    },
  )

  // POST /api/physical-counts/:id/complete
  fastify.post(
    '/api/physical-counts/:id/complete',
    {
      preHandler: [fastify.authenticate, validateParams(physicalCountParamsSchema)],
    },
    async (request, reply) => {
      const { id } = request.params as PhysicalCountParams
      const userId = request.user!.id
      const result = await physicalCountService.completeCount(id, userId)
      return success(reply, result)
    },
  )

  // POST /api/physical-counts/:id/cancel
  fastify.post(
    '/api/physical-counts/:id/cancel',
    {
      preHandler: [fastify.authenticate, validateParams(physicalCountParamsSchema)],
    },
    async (request, reply) => {
      const { id } = request.params as PhysicalCountParams
      const count = await physicalCountService.cancelCount(id)
      return success(reply, count)
    },
  )
}
