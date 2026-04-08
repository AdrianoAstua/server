import type { FastifyInstance } from 'fastify'
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js'
import { success, created, paginated } from '../lib/reply.js'
import {
  orderParamsSchema,
  orderFiltersSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
} from '../schemas/order-schemas.js'
import type {
  OrderParams,
  OrderFilters,
  CreateOrder,
  UpdateOrderStatus,
  CancelOrder,
} from '../schemas/order-schemas.js'
import * as orderService from '../services/order-service.js'

export default async function orderRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/orders
  fastify.get(
    '/api/orders',
    {
      preHandler: [fastify.authenticate, validateQuery(orderFiltersSchema)],
    },
    async (request, reply) => {
      const filters = request.query as OrderFilters
      const result = await orderService.listOrders(filters)
      return paginated(reply, result.data, result.page, result.limit, result.total)
    },
  )

  // GET /api/orders/:id
  fastify.get(
    '/api/orders/:id',
    {
      preHandler: [fastify.authenticate, validateParams(orderParamsSchema)],
    },
    async (request, reply) => {
      const { id } = request.params as OrderParams
      const order = await orderService.getOrderById(id)
      return success(reply, order)
    },
  )

  // POST /api/orders
  fastify.post(
    '/api/orders',
    {
      preHandler: [fastify.authenticate, validateBody(createOrderSchema)],
    },
    async (request, reply) => {
      const data = request.body as CreateOrder
      const order = await orderService.createOrder(data)
      return created(reply, order)
    },
  )

  // PUT /api/orders/:id/status
  fastify.put(
    '/api/orders/:id/status',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(orderParamsSchema),
        validateBody(updateOrderStatusSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as OrderParams
      const data = request.body as UpdateOrderStatus
      const userId = request.user?.id
      const order = await orderService.updateOrderStatus(id, data, userId)
      return success(reply, order)
    },
  )

  // PUT /api/orders/:id/cancel
  fastify.put(
    '/api/orders/:id/cancel',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(orderParamsSchema),
        validateBody(cancelOrderSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as OrderParams
      const { reason } = request.body as CancelOrder
      const userId = request.user?.id
      const order = await orderService.cancelOrder(id, reason, userId)
      return success(reply, order)
    },
  )

  // GET /api/orders/:id/timeline
  fastify.get(
    '/api/orders/:id/timeline',
    {
      preHandler: [fastify.authenticate, validateParams(orderParamsSchema)],
    },
    async (request, reply) => {
      const { id } = request.params as OrderParams
      const timeline = await orderService.getOrderTimeline(id)
      return success(reply, timeline)
    },
  )
}
