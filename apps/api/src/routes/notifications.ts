import type { FastifyInstance } from 'fastify'
import { validateParams, validateQuery } from '../middleware/validate.js'
import { success, paginated } from '../lib/reply.js'
import {
  notificationParamsSchema,
  notificationFiltersSchema,
} from '../schemas/notification-schemas.js'
import type {
  NotificationParams,
  NotificationFilters,
} from '../schemas/notification-schemas.js'
import * as notificationApiService from '../services/notification-api-service.js'

export default async function notificationRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  // GET /api/notifications — list paginated with filters
  fastify.get(
    '/api/notifications',
    {
      preHandler: [fastify.authenticate, validateQuery(notificationFiltersSchema)],
    },
    async (request, reply) => {
      const userId = request.user.id
      const filters = request.query as NotificationFilters
      const result = await notificationApiService.listNotifications(userId, filters)
      return paginated(reply, result.data, result.page, result.limit, result.total)
    },
  )

  // GET /api/notifications/unread-count — count for badge
  fastify.get(
    '/api/notifications/unread-count',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.id
      const count = await notificationApiService.getUnreadCount(userId)
      return success(reply, { count })
    },
  )

  // PUT /api/notifications/:id/read — mark as read
  fastify.put(
    '/api/notifications/:id/read',
    {
      preHandler: [fastify.authenticate, validateParams(notificationParamsSchema)],
    },
    async (request, reply) => {
      const userId = request.user.id
      const { id } = request.params as NotificationParams
      const notification = await notificationApiService.markAsRead(id, userId)
      return success(reply, notification)
    },
  )

  // PUT /api/notifications/read-all — mark all as read
  fastify.put(
    '/api/notifications/read-all',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = request.user.id
      const count = await notificationApiService.markAllAsRead(userId)
      return success(reply, { updated: count })
    },
  )
}
