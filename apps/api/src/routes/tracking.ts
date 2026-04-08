import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getDatabase } from '@voneb/database'
import { validateParams } from '../middleware/validate.js'
import { success } from '../lib/reply.js'
import { NotFoundError } from '../lib/errors.js'
import { WORK_ORDER_STATUS_LABELS } from '@voneb/shared'

const trackingParamsSchema = z.object({
  workOrderNumber: z.string().min(1, 'Work order number is required'),
})

type TrackingParams = z.infer<typeof trackingParamsSchema>

export default async function trackingRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/tracking/:workOrderNumber — PUBLIC (no auth)
  fastify.get(
    '/api/tracking/:workOrderNumber',
    {
      preHandler: [validateParams(trackingParamsSchema)],
    },
    async (request, reply) => {
      const { workOrderNumber } = request.params as TrackingParams
      const db = getDatabase()

      const workOrder = await db.workOrder.findUnique({
        where: { workOrderNumber },
        select: {
          id: true,
          workOrderNumber: true,
          status: true,
          estimatedCompletionDate: true,
          actualCompletionDate: true,
          createdAt: true,
          statusHistory: {
            orderBy: { createdAt: 'asc' },
            select: {
              fromStatus: true,
              toStatus: true,
              notes: true,
              automatic: true,
              createdAt: true,
            },
          },
          delivery: {
            select: {
              status: true,
              deliveryType: true,
              carrierName: true,
              trackingNumber: true,
              scheduledDate: true,
              shippedAt: true,
              deliveredAt: true,
            },
          },
        },
      })

      if (!workOrder) throw new NotFoundError('Work order not found')

      // Build public-safe timeline
      const timeline = workOrder.statusHistory.map((entry: any) => ({
        status: entry.toStatus,
        label: WORK_ORDER_STATUS_LABELS[entry.toStatus] ?? entry.toStatus,
        timestamp: entry.createdAt,
      }))

      const result = {
        workOrderNumber: workOrder.workOrderNumber,
        status: workOrder.status,
        statusLabel: WORK_ORDER_STATUS_LABELS[workOrder.status] ?? workOrder.status,
        estimatedCompletionDate: workOrder.estimatedCompletionDate,
        actualCompletionDate: workOrder.actualCompletionDate,
        createdAt: workOrder.createdAt,
        timeline,
        delivery: workOrder.delivery
          ? {
              status: workOrder.delivery.status,
              deliveryType: workOrder.delivery.deliveryType,
              carrierName: workOrder.delivery.carrierName,
              trackingNumber: workOrder.delivery.trackingNumber,
              scheduledDate: workOrder.delivery.scheduledDate,
              shippedAt: workOrder.delivery.shippedAt,
              deliveredAt: workOrder.delivery.deliveredAt,
            }
          : null,
      }

      return success(reply, result)
    },
  )
}
