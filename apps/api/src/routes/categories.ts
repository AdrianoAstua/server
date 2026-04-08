import type { FastifyInstance } from 'fastify'
import { validateBody, validateParams } from '../middleware/validate.js'
import { success, created, noContent } from '../lib/reply.js'
import {
  categoryParamsSchema,
  createCategorySchema,
  updateCategorySchema,
} from '../schemas/category-schemas.js'
import type { CategoryParams, CreateCategory, UpdateCategory } from '../schemas/category-schemas.js'
import * as categoryService from '../services/category-service.js'

export default async function categoryRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/categories
  fastify.get('/api/categories', async (_request, reply) => {
    const categories = await categoryService.listCategories()
    return success(reply, categories)
  })

  // GET /api/categories/tree
  fastify.get('/api/categories/tree', async (_request, reply) => {
    const tree = await categoryService.getCategoryTree()
    return success(reply, tree)
  })

  // POST /api/categories
  fastify.post(
    '/api/categories',
    {
      preHandler: [
        fastify.authorize('ADMIN'),
        validateBody(createCategorySchema),
      ],
    },
    async (request, reply) => {
      const data = request.body as CreateCategory
      const category = await categoryService.createCategory(data)
      return created(reply, category)
    },
  )

  // PUT /api/categories/:id
  fastify.put(
    '/api/categories/:id',
    {
      preHandler: [
        fastify.authorize('ADMIN'),
        validateParams(categoryParamsSchema),
        validateBody(updateCategorySchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as CategoryParams
      const data = request.body as UpdateCategory
      const category = await categoryService.updateCategory(id, data)
      return success(reply, category)
    },
  )

  // DELETE /api/categories/:id
  fastify.delete(
    '/api/categories/:id',
    {
      preHandler: [
        fastify.authorize('ADMIN'),
        validateParams(categoryParamsSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as CategoryParams
      await categoryService.deleteCategory(id)
      return noContent(reply)
    },
  )
}
