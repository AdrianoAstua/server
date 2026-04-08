import type { FastifyInstance } from 'fastify'
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js'
import { success, created, paginated } from '../lib/reply.js'
import {
  createLocalSaleSchema,
  localSaleFiltersSchema,
  localSaleParamsSchema,
  voidSaleSchema,
  dailySummaryQuerySchema,
} from '../schemas/local-sale-schemas.js'
import type {
  CreateLocalSale,
  LocalSaleFilters,
  LocalSaleParams,
  VoidSale,
  DailySummaryQuery,
} from '../schemas/local-sale-schemas.js'
import * as localSaleService from '../services/local-sale-service.js'

export default async function localSaleRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/local-sales
  fastify.get(
    '/api/local-sales',
    {
      preHandler: [fastify.authenticate, validateQuery(localSaleFiltersSchema)],
    },
    async (request, reply) => {
      const filters = request.query as LocalSaleFilters
      const result = await localSaleService.listSales(filters)
      return paginated(reply, result.data, result.page, result.limit, result.total)
    },
  )

  // GET /api/local-sales/daily-summary
  fastify.get(
    '/api/local-sales/daily-summary',
    {
      preHandler: [fastify.authenticate, validateQuery(dailySummaryQuerySchema)],
    },
    async (request, reply) => {
      const query = request.query as DailySummaryQuery
      const summary = await localSaleService.getDailySummary(query)
      return success(reply, summary)
    },
  )

  // GET /api/local-sales/:id
  fastify.get(
    '/api/local-sales/:id',
    {
      preHandler: [fastify.authenticate, validateParams(localSaleParamsSchema)],
    },
    async (request, reply) => {
      const { id } = request.params as LocalSaleParams
      const sale = await localSaleService.getSale(id)
      return success(reply, sale)
    },
  )

  // POST /api/local-sales
  fastify.post(
    '/api/local-sales',
    {
      preHandler: [fastify.authenticate, validateBody(createLocalSaleSchema)],
    },
    async (request, reply) => {
      const data = request.body as CreateLocalSale
      const userId = request.user!.id
      const sale = await localSaleService.createSale(data, userId)
      return created(reply, sale)
    },
  )

  // POST /api/local-sales/:id/void
  fastify.post(
    '/api/local-sales/:id/void',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(localSaleParamsSchema),
        validateBody(voidSaleSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as LocalSaleParams
      const { reason } = request.body as VoidSale
      const userId = request.user!.id
      const sale = await localSaleService.voidSale(id, reason, userId)
      return success(reply, sale)
    },
  )

  // GET /api/local-sales/:id/receipt
  fastify.get(
    '/api/local-sales/:id/receipt',
    {
      preHandler: [fastify.authenticate, validateParams(localSaleParamsSchema)],
    },
    async (request, reply) => {
      const { id } = request.params as LocalSaleParams
      const receipt = await localSaleService.generateReceipt(id)
      return reply.type('text/plain').status(200).send(receipt)
    },
  )
}
