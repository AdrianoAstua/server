import type { FastifyInstance } from 'fastify'
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js'
import { success, created, paginated } from '../lib/reply.js'
import {
  productParamsSchema,
  productFiltersSchema,
  createProductSchema,
  updateProductSchema,
} from '../schemas/product-schemas.js'
import type { ProductFilters, CreateProduct, UpdateProduct, ProductParams } from '../schemas/product-schemas.js'
import * as productService from '../services/product-service.js'

export default async function productRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/products
  fastify.get(
    '/api/products',
    {
      preHandler: [fastify.authenticate, validateQuery(productFiltersSchema)],
    },
    async (request, reply) => {
      const filters = request.query as ProductFilters
      const result = await productService.listProducts(filters)
      return paginated(reply, result.data, result.page, result.limit, result.total)
    },
  )

  // GET /api/products/:id
  fastify.get(
    '/api/products/:id',
    {
      preHandler: [fastify.authenticate, validateParams(productParamsSchema)],
    },
    async (request, reply) => {
      const { id } = request.params as ProductParams
      const product = await productService.getProductById(id)
      return success(reply, product)
    },
  )

  // POST /api/products
  fastify.post(
    '/api/products',
    {
      preHandler: [
        fastify.authorize('ADMIN'),
        validateBody(createProductSchema),
      ],
    },
    async (request, reply) => {
      const data = request.body as CreateProduct
      const product = await productService.createProduct(data)
      return created(reply, product)
    },
  )

  // PUT /api/products/:id
  fastify.put(
    '/api/products/:id',
    {
      preHandler: [
        fastify.authorize('ADMIN'),
        validateParams(productParamsSchema),
        validateBody(updateProductSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as ProductParams
      const data = request.body as UpdateProduct
      const product = await productService.updateProduct(id, data)
      return success(reply, product)
    },
  )

  // DELETE /api/products/:id
  fastify.delete(
    '/api/products/:id',
    {
      preHandler: [
        fastify.authorize('ADMIN'),
        validateParams(productParamsSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as ProductParams
      const product = await productService.softDeleteProduct(id)
      return success(reply, product)
    },
  )
}
