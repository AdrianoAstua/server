import type { FastifyInstance } from 'fastify'
import { validateBody, validateParams } from '../middleware/validate.js'
import { success, created } from '../lib/reply.js'
import {
  designWorkOrderParamsSchema,
  designFileParamsSchema,
  approvalTokenParamsSchema,
  uploadDesignFileSchema,
  requestApprovalSchema,
  recordApprovalSchema,
} from '../schemas/design-schemas.js'
import type {
  DesignWorkOrderParams,
  DesignFileParams,
  ApprovalTokenParams,
  UploadDesignFile,
  RequestApproval,
  RecordApproval,
} from '../schemas/design-schemas.js'
import * as designService from '../services/design-service.js'

export default async function designRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /api/design/upload/:workOrderId — upload design file
  fastify.post(
    '/api/design/upload/:workOrderId',
    {
      preHandler: [
        fastify.authorize('DISENADOR', 'SUPERVISOR_DISENO', 'ADMIN'),
        validateParams(designWorkOrderParamsSchema),
        validateBody(uploadDesignFileSchema),
      ],
    },
    async (request, reply) => {
      const { workOrderId } = request.params as DesignWorkOrderParams
      const fileData = request.body as UploadDesignFile
      const userId = request.user.id
      const result = await designService.uploadDesignFile(workOrderId, fileData, userId)
      return created(reply, result)
    },
  )

  // GET /api/design/files/:workOrderId — list design files
  fastify.get(
    '/api/design/files/:workOrderId',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(designWorkOrderParamsSchema),
      ],
    },
    async (request, reply) => {
      const { workOrderId } = request.params as DesignWorkOrderParams
      const files = await designService.listDesignFiles(workOrderId)
      return success(reply, files)
    },
  )

  // POST /api/design/validate/:fileId — validate design file
  fastify.post(
    '/api/design/validate/:fileId',
    {
      preHandler: [
        fastify.authorize('SUPERVISOR_DISENO', 'ADMIN'),
        validateParams(designFileParamsSchema),
      ],
    },
    async (request, reply) => {
      const { fileId } = request.params as DesignFileParams
      const result = await designService.validateDesignFile(fileId)
      return success(reply, result)
    },
  )

  // POST /api/design/request-approval/:workOrderId — request client approval
  fastify.post(
    '/api/design/request-approval/:workOrderId',
    {
      preHandler: [
        fastify.authorize('VENTAS', 'SUPERVISOR_DISENO', 'ADMIN'),
        validateParams(designWorkOrderParamsSchema),
        validateBody(requestApprovalSchema),
      ],
    },
    async (request, reply) => {
      const { workOrderId } = request.params as DesignWorkOrderParams
      const { designFileId } = request.body as RequestApproval
      const userId = request.user.id
      const result = await designService.requestApproval(workOrderId, designFileId, userId)
      return created(reply, result)
    },
  )

  // GET /api/design/approval/:token — PUBLIC, get approval page data
  fastify.get(
    '/api/design/approval/:token',
    {
      preHandler: [validateParams(approvalTokenParamsSchema)],
    },
    async (request, reply) => {
      const { token } = request.params as ApprovalTokenParams
      const result = await designService.getApprovalByToken(token)
      return success(reply, result)
    },
  )

  // POST /api/design/approval/:token — PUBLIC, record client approval/rejection
  fastify.post(
    '/api/design/approval/:token',
    {
      preHandler: [
        validateParams(approvalTokenParamsSchema),
        validateBody(recordApprovalSchema),
      ],
    },
    async (request, reply) => {
      const { token } = request.params as ApprovalTokenParams
      const { status, clientComments } = request.body as RecordApproval
      const result = await designService.recordApproval(token, status, clientComments)
      return success(reply, result)
    },
  )
}
