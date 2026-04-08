import type { FastifyInstance } from 'fastify'
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js'
import { success, created } from '../lib/reply.js'
import {
  variantParamsSchema,
  productIdParamsSchema,
  addVariantSchema,
  updateVariantSchema,
  updateStockSchema,
  bulkUpdateStockSchema,
  variantSearchSchema,
} from '../schemas/variant-schemas.js'
import type {
  VariantParams,
  ProductIdParams,
  AddVariant,
  UpdateVariant,
  UpdateStock,
  BulkUpdateStock,
  VariantSearch,
} from '../schemas/variant-schemas.js'
import * as variantService from '../services/variant-service.js'

export default async function variantRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /api/products/:id/variants
  fastify.post(
    '/api/products/:id/variants',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(productIdParamsSchema),
        validateBody(addVariantSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as ProductIdParams
      const data = request.body as AddVariant
      const variant = await variantService.addVariant(id, data)
      return created(reply, variant)
    },
  )

  // PUT /api/variants/:id
  fastify.put(
    '/api/variants/:id',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(variantParamsSchema),
        validateBody(updateVariantSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as VariantParams
      const data = request.body as UpdateVariant
      const variant = await variantService.updateVariant(id, data)
      return success(reply, variant)
    },
  )

  // PUT /api/variants/:id/stock
  fastify.put(
    '/api/variants/:id/stock',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(variantParamsSchema),
        validateBody(updateStockSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as VariantParams
      const { quantity, reason } = request.body as UpdateStock
      const variant = await variantService.updateStock(
        id,
        quantity,
        reason,
        request.user.id,
      )
      return success(reply, variant)
    },
  )

  // PUT /api/variants/bulk-stock
  fastify.put(
    '/api/variants/bulk-stock',
    {
      preHandler: [
        fastify.authenticate,
        validateBody(bulkUpdateStockSchema),
      ],
    },
    async (request, reply) => {
      const { updates } = request.body as BulkUpdateStock
      const results = await variantService.bulkUpdateStock(
        updates,
        request.user.id,
      )
      return success(reply, results)
    },
  )

  // GET /api/variants/search
  fastify.get(
    '/api/variants/search',
    {
      preHandler: [
        fastify.authenticate,
        validateQuery(variantSearchSchema),
      ],
    },
    async (request, reply) => {
      const { q, limit } = request.query as VariantSearch
      const variants = await variantService.getBySkuOrSearch(q, limit)
      return success(reply, variants)
    },
  )
}
