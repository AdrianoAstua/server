import type { FastifyInstance } from 'fastify'
import { validateBody, validateParams } from '../middleware/validate.js'
import { success, created } from '../lib/reply.js'
import {
  barcodeLookupSchema,
  generateBarcodeSchema,
  generateLabelsSchema,
  assignBarcodeSchema,
} from '../schemas/barcode-schemas.js'
import type {
  BarcodeLookup,
  GenerateLabels,
  AssignBarcode,
} from '../schemas/barcode-schemas.js'
import { variantParamsSchema } from '../schemas/variant-schemas.js'
import type { VariantParams } from '../schemas/variant-schemas.js'
import * as barcodeService from '../services/barcode-service.js'

export default async function barcodeRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/barcode/lookup/:code
  fastify.get(
    '/api/barcode/lookup/:code',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(barcodeLookupSchema),
      ],
    },
    async (request, reply) => {
      const { code } = request.params as BarcodeLookup
      const variant = await barcodeService.findByBarcode(code)
      return success(reply, variant)
    },
  )

  // POST /api/barcode/generate/:variantId
  fastify.post(
    '/api/barcode/generate/:variantId',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(generateBarcodeSchema),
      ],
    },
    async (request, reply) => {
      const { variantId } = request.params as { variantId: string }
      const result = await barcodeService.generateBarcode(variantId)
      return created(reply, result)
    },
  )

  // POST /api/barcode/generate-missing
  fastify.post(
    '/api/barcode/generate-missing',
    {
      preHandler: [fastify.authorize('ADMIN')],
    },
    async (_request, reply) => {
      const result = await barcodeService.generateMissingBarcodes()
      return success(reply, result)
    },
  )

  // POST /api/barcode/labels
  fastify.post(
    '/api/barcode/labels',
    {
      preHandler: [
        fastify.authenticate,
        validateBody(generateLabelsSchema),
      ],
    },
    async (request, reply) => {
      const { variantIds, format } = request.body as GenerateLabels
      const pdfBuffer = await barcodeService.generateLabels(variantIds, format)

      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', 'attachment; filename="barcode-labels.pdf"')
        .send(pdfBuffer)
    },
  )

  // PUT /api/variants/:id/barcode
  fastify.put(
    '/api/variants/:id/barcode',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(variantParamsSchema),
        validateBody(assignBarcodeSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as VariantParams
      const { barcode, barcodeFormat } = request.body as AssignBarcode
      const variant = await barcodeService.assignBarcode(id, barcode, barcodeFormat)
      return success(reply, variant)
    },
  )
}
