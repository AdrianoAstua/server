import type { FastifyInstance } from 'fastify'
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js'
import { success, created, paginated } from '../lib/reply.js'
import { ForbiddenError } from '../lib/errors.js'
import {
  workOrderParamsSchema,
  workOrderBarcodeParamsSchema,
  createWorkOrderSchema,
  updateWorkOrderStatusSchema,
  listWorkOrdersSchema,
  assignDesignerSchema,
  cancelWorkOrderSchema,
} from '../schemas/work-order-schemas.js'
import type {
  WorkOrderParams,
  WorkOrderBarcodeParams,
  CreateWorkOrder,
  UpdateWorkOrderStatus,
  ListWorkOrdersFilters,
  AssignDesigner,
  CancelWorkOrder,
} from '../schemas/work-order-schemas.js'
import * as workOrderService from '../services/work-order-service.js'

const ADMIN_ROLES = ['ADMIN']
const SALES_ROLES = ['ADMIN', 'VENTAS']
const SUPERVISOR_ROLES = ['ADMIN', 'SUPERVISOR_GENERAL']
const DESIGN_SUPERVISOR_ROLES = ['ADMIN', 'SUPERVISOR_DISENO']

export default async function workOrderRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /api/work-orders — create work order (ADMIN, VENTAS)
  fastify.post(
    '/api/work-orders',
    {
      preHandler: [fastify.authenticate, validateBody(createWorkOrderSchema)],
    },
    async (request, reply) => {
      const userRole = request.user?.role
      if (!SALES_ROLES.includes(userRole)) {
        throw new ForbiddenError('Only ADMIN or VENTAS can create work orders')
      }
      const data = request.body as CreateWorkOrder
      const userId = request.user.id
      const workOrder = await workOrderService.createWorkOrder(data, userId)
      return created(reply, workOrder)
    },
  )

  // GET /api/work-orders — list work orders (all authenticated)
  fastify.get(
    '/api/work-orders',
    {
      preHandler: [fastify.authenticate, validateQuery(listWorkOrdersSchema)],
    },
    async (request, reply) => {
      const filters = request.query as ListWorkOrdersFilters
      const result = await workOrderService.listWorkOrders(filters)
      return paginated(reply, result.data, result.page, result.limit, result.total)
    },
  )

  // GET /api/work-orders/stats — dashboard stats (ADMIN, SUPERVISOR_GENERAL)
  // NOTE: must be before /:id to avoid matching "stats" as an id
  fastify.get(
    '/api/work-orders/stats',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userRole = request.user?.role
      if (!SUPERVISOR_ROLES.includes(userRole)) {
        throw new ForbiddenError('Only ADMIN or SUPERVISOR_GENERAL can view stats')
      }
      const stats = await workOrderService.getWorkOrderStats()
      return success(reply, stats)
    },
  )

  // GET /api/work-orders/barcode/:barcode — lookup by barcode scan (all authenticated)
  fastify.get(
    '/api/work-orders/barcode/:barcode',
    {
      preHandler: [fastify.authenticate, validateParams(workOrderBarcodeParamsSchema)],
    },
    async (request, reply) => {
      const { barcode } = request.params as WorkOrderBarcodeParams
      const workOrder = await workOrderService.getWorkOrderByBarcode(barcode)
      return success(reply, workOrder)
    },
  )

  // GET /api/work-orders/:id — get by ID (all authenticated)
  fastify.get(
    '/api/work-orders/:id',
    {
      preHandler: [fastify.authenticate, validateParams(workOrderParamsSchema)],
    },
    async (request, reply) => {
      const { id } = request.params as WorkOrderParams
      const workOrder = await workOrderService.getWorkOrderById(id)
      return success(reply, workOrder)
    },
  )

  // PUT /api/work-orders/:id/status — update status (role depends on context)
  fastify.put(
    '/api/work-orders/:id/status',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(workOrderParamsSchema),
        validateBody(updateWorkOrderStatusSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as WorkOrderParams
      const data = request.body as UpdateWorkOrderStatus
      const userId = request.user?.id
      const workOrder = await workOrderService.updateWorkOrderStatus(id, data, userId)
      return success(reply, workOrder)
    },
  )

  // PUT /api/work-orders/:id/assign-designer — assign designer (ADMIN, SUPERVISOR_DISENO)
  fastify.put(
    '/api/work-orders/:id/assign-designer',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(workOrderParamsSchema),
        validateBody(assignDesignerSchema),
      ],
    },
    async (request, reply) => {
      const userRole = request.user?.role
      if (!DESIGN_SUPERVISOR_ROLES.includes(userRole)) {
        throw new ForbiddenError('Only ADMIN or SUPERVISOR_DISENO can assign designers')
      }
      const { id } = request.params as WorkOrderParams
      const { designerId } = request.body as AssignDesigner
      const userId = request.user?.id
      const workOrder = await workOrderService.assignDesigner(id, designerId, userId)
      return success(reply, workOrder)
    },
  )

  // POST /api/work-orders/:id/cancel — cancel work order (ADMIN, VENTAS)
  fastify.post(
    '/api/work-orders/:id/cancel',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(workOrderParamsSchema),
        validateBody(cancelWorkOrderSchema),
      ],
    },
    async (request, reply) => {
      const userRole = request.user?.role
      if (!SALES_ROLES.includes(userRole)) {
        throw new ForbiddenError('Only ADMIN or VENTAS can cancel work orders')
      }
      const { id } = request.params as WorkOrderParams
      const { reason } = request.body as CancelWorkOrder
      const userId = request.user?.id
      const workOrder = await workOrderService.cancelWorkOrder(id, reason, userId)
      return success(reply, workOrder)
    },
  )
}
