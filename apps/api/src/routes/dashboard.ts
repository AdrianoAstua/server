import type { FastifyInstance } from 'fastify'
import { validateQuery } from '../middleware/validate.js'
import { success } from '../lib/reply.js'
import {
  dashboardQuerySchema,
  topProductsQuerySchema,
} from '../schemas/dashboard-schemas.js'
import type { DashboardQuery, TopProductsQuery } from '../schemas/dashboard-schemas.js'
import * as dashboardService from '../services/dashboard-service.js'

export default async function dashboardRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/dashboard/summary
  fastify.get(
    '/api/dashboard/summary',
    {
      preHandler: [fastify.authenticate, validateQuery(dashboardQuerySchema)],
    },
    async (request, reply) => {
      const query = request.query as DashboardQuery
      const summary = await dashboardService.getSummary(query)
      return success(reply, summary)
    },
  )

  // GET /api/dashboard/revenue-chart
  fastify.get(
    '/api/dashboard/revenue-chart',
    {
      preHandler: [fastify.authenticate, validateQuery(dashboardQuerySchema)],
    },
    async (request, reply) => {
      const query = request.query as DashboardQuery
      const now = new Date()
      const startDate = query.startDate ?? new Date(now.getFullYear(), now.getMonth(), 1)
      const endDate = query.endDate ?? now
      const chart = await dashboardService.getRevenueChart(startDate, endDate)
      return success(reply, chart)
    },
  )

  // GET /api/dashboard/top-products
  fastify.get(
    '/api/dashboard/top-products',
    {
      preHandler: [fastify.authenticate, validateQuery(topProductsQuerySchema)],
    },
    async (request, reply) => {
      const query = request.query as TopProductsQuery
      const products = await dashboardService.getTopProducts(query)
      return success(reply, products)
    },
  )

  // GET /api/dashboard/activity
  fastify.get(
    '/api/dashboard/activity',
    {
      preHandler: [fastify.authenticate],
    },
    async (_request, reply) => {
      const feed = await dashboardService.getActivityFeed(20)
      return success(reply, feed)
    },
  )
}
