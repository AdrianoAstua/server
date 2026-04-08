import type { FastifyInstance } from 'fastify'
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js'
import { success, created, paginated } from '../lib/reply.js'
import {
  deliveryParamsSchema,
  deliveryWorkOrderParamsSchema,
  createDeliverySchema,
  updateDeliverySchema,
  shipDeliverySchema,
  confirmDeliverySchema,
  listDeliveriesSchema,
} from '../schemas/delivery-schemas.js'
import type {
  DeliveryParams,
  DeliveryWorkOrderParams,
  CreateDelivery,
  UpdateDelivery,
  ShipDelivery,
  ConfirmDelivery,
  ListDeliveriesFilters,
} from '../schemas/delivery-schemas.js'
import * as deliveryService from '../services/delivery-service.js'

export default async function deliveryRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /api/deliveries — create delivery record
  fastify.post(
    '/api/deliveries',
    {
      preHandler: [
        fastify.authorize('LOGISTICA', 'ADMIN'),
        validateBody(createDeliverySchema),
      ],
    },
    async (request, reply) => {
      const data = request.body as CreateDelivery
      const result = await deliveryService.createDeliveryRecord(
        data.workOrderId,
        data.deliveryType,
        data.scheduledDate,
        data.notes,
      )
      return created(reply, result)
    },
  )

  // GET /api/deliveries — list deliveries (paginated)
  fastify.get(
    '/api/deliveries',
    {
      preHandler: [
        fastify.authenticate,
        validateQuery(listDeliveriesSchema),
      ],
    },
    async (request, reply) => {
      const filters = request.query as ListDeliveriesFilters
      const result = await deliveryService.listDeliveries(filters)
      return paginated(reply, result.data, result.page, result.limit, result.total)
    },
  )

  // GET /api/deliveries/:workOrderId — get delivery by work order
  fastify.get(
    '/api/deliveries/:workOrderId',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(deliveryWorkOrderParamsSchema),
      ],
    },
    async (request, reply) => {
      const { workOrderId } = request.params as DeliveryWorkOrderParams
      const result = await deliveryService.getDeliveryByWorkOrder(workOrderId)
      return success(reply, result)
    },
  )

  // PUT /api/deliveries/:id — update delivery
  fastify.put(
    '/api/deliveries/:id',
    {
      preHandler: [
        fastify.authorize('LOGISTICA', 'ADMIN'),
        validateParams(deliveryParamsSchema),
        validateBody(updateDeliverySchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as DeliveryParams
      const data = request.body as UpdateDelivery
      const result = await deliveryService.updateDelivery(id, data)
      return success(reply, result)
    },
  )

  // POST /api/deliveries/:id/ship — mark as shipped
  fastify.post(
    '/api/deliveries/:id/ship',
    {
      preHandler: [
        fastify.authorize('LOGISTICA', 'ADMIN'),
        validateParams(deliveryParamsSchema),
        validateBody(shipDeliverySchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as DeliveryParams
      const { carrierName, trackingNumber } = request.body as ShipDelivery
      const userId = request.user.id
      const result = await deliveryService.shipDelivery(id, carrierName, trackingNumber, userId)
      return success(reply, result)
    },
  )

  // POST /api/deliveries/:id/confirm — confirm delivery
  fastify.post(
    '/api/deliveries/:id/confirm',
    {
      preHandler: [
        fastify.authorize('LOGISTICA', 'ADMIN'),
        validateParams(deliveryParamsSchema),
        validateBody(confirmDeliverySchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as DeliveryParams
      const { receivedByName, signatureUrl, photoUrl } = request.body as ConfirmDelivery
      const userId = request.user.id
      const result = await deliveryService.confirmDelivery(
        id,
        receivedByName,
        signatureUrl,
        photoUrl,
        userId,
      )
      return success(reply, result)
    },
  )
}
