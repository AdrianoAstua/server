import type { FastifyInstance } from 'fastify'
import { validateParams } from '../middleware/validate.js'
import { success } from '../lib/reply.js'
import {
  labelWorkOrderParamsSchema,
  labelLineParamsSchema,
  labelIdParamsSchema,
} from '../schemas/label-schemas.js'
import type {
  LabelWorkOrderParams,
  LabelLineParams,
  LabelIdParams,
} from '../schemas/label-schemas.js'
import * as labelService from '../services/label-service.js'

export default async function labelRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/labels/work-order/:workOrderId — generate work order label PDF
  fastify.get(
    '/api/labels/work-order/:workOrderId',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(labelWorkOrderParamsSchema),
      ],
    },
    async (request, reply) => {
      const { workOrderId } = request.params as LabelWorkOrderParams
      const pdfBuffer = await labelService.generateWorkOrderLabel(workOrderId)
      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `inline; filename="label-${workOrderId}.pdf"`)
        .send(pdfBuffer)
    },
  )

  // GET /api/labels/line/:lineId — generate line label PDF
  fastify.get(
    '/api/labels/line/:lineId',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(labelLineParamsSchema),
      ],
    },
    async (request, reply) => {
      const { lineId } = request.params as LabelLineParams
      const pdfBuffer = await labelService.generateLineLabel(lineId)
      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `inline; filename="label-line-${lineId}.pdf"`)
        .send(pdfBuffer)
    },
  )

  // GET /api/labels/package/:workOrderId — generate package label PDF
  fastify.get(
    '/api/labels/package/:workOrderId',
    {
      preHandler: [
        fastify.authorize('EMPAQUE', 'ADMIN'),
        validateParams(labelWorkOrderParamsSchema),
      ],
    },
    async (request, reply) => {
      const { workOrderId } = request.params as LabelWorkOrderParams
      const pdfBuffer = await labelService.generatePackageLabel(workOrderId)
      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `inline; filename="package-${workOrderId}.pdf"`)
        .send(pdfBuffer)
    },
  )

  // POST /api/labels/package/:workOrderId/printed — mark label as printed
  fastify.post(
    '/api/labels/package/:id/printed',
    {
      preHandler: [
        fastify.authorize('EMPAQUE', 'ADMIN'),
        validateParams(labelIdParamsSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as LabelIdParams
      const result = await labelService.markLabelPrinted(id)
      return success(reply, result)
    },
  )
}
