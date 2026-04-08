import type { FastifyInstance } from 'fastify'
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js'
import { success, created } from '../lib/reply.js'
import {
  locationParamsSchema,
  createLocationSchema,
  updateLocationSchema,
  stockMatrixParamsSchema,
  updateLocationStockSchema,
  locationStockParamsSchema,
  transferStockSchema,
  locationStockQuerySchema,
} from '../schemas/location-schemas.js'
import type {
  LocationParams,
  CreateLocation,
  UpdateLocation,
  StockMatrixParams,
  UpdateLocationStock,
  LocationStockParams,
  TransferStock,
  LocationStockQuery,
} from '../schemas/location-schemas.js'
import { NotFoundError } from '../lib/errors.js'
import { getDatabase } from '@voneb/database'
import * as locationStockService from '../services/location-stock-service.js'

export default async function locationRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/locations
  fastify.get(
    '/api/locations',
    { preHandler: [fastify.authenticate] },
    async (_request, reply) => {
      const locations = await locationStockService.listLocations()
      return success(reply, locations)
    },
  )

  // POST /api/locations
  fastify.post(
    '/api/locations',
    {
      preHandler: [
        fastify.authorize('ADMIN'),
        validateBody(createLocationSchema),
      ],
    },
    async (request, reply) => {
      const data = request.body as CreateLocation
      const location = await locationStockService.createLocation(data)
      return created(reply, location)
    },
  )

  // PUT /api/locations/:id
  fastify.put(
    '/api/locations/:id',
    {
      preHandler: [
        fastify.authorize('ADMIN'),
        validateParams(locationParamsSchema),
        validateBody(updateLocationSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as LocationParams
      const data = request.body as UpdateLocation
      const location = await locationStockService.updateLocation(id, data)
      return success(reply, location)
    },
  )

  // GET /api/locations/:id/stock
  fastify.get(
    '/api/locations/:id/stock',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(locationParamsSchema),
        validateQuery(locationStockQuerySchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as LocationParams
      const _query = request.query as LocationStockQuery
      const stocks = await locationStockService.getLowStockByLocation(id)
      return success(reply, stocks)
    },
  )

  // GET /api/locations/:id/low-stock
  fastify.get(
    '/api/locations/:id/low-stock',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(locationParamsSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as LocationParams
      const items = await locationStockService.getLowStockByLocation(id)
      return success(reply, items)
    },
  )

  // GET /api/locations/:id/out-of-stock
  fastify.get(
    '/api/locations/:id/out-of-stock',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(locationParamsSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as LocationParams
      const items = await locationStockService.getOutOfStockByLocation(id)
      return success(reply, items)
    },
  )

  // GET /api/variants/:id/stock-matrix
  fastify.get(
    '/api/variants/:id/stock-matrix',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(stockMatrixParamsSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as StockMatrixParams
      const db = getDatabase()
      const variant = await db.productVariant.findUnique({
        where: { id },
        select: { productId: true },
      })
      if (!variant) throw new NotFoundError('Variant not found')
      const matrix = await locationStockService.getStockMatrix(variant.productId)
      return success(reply, matrix)
    },
  )

  // PUT /api/variants/:id/stock/:locationId
  fastify.put(
    '/api/variants/:id/stock/:locationId',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(locationStockParamsSchema),
        validateBody(updateLocationStockSchema),
      ],
    },
    async (request, reply) => {
      const { id, locationId } = request.params as LocationStockParams
      const { quantity, reason } = request.body as UpdateLocationStock
      const result = await locationStockService.updateStock(
        id,
        locationId,
        quantity,
        reason,
        request.user.id,
      )
      return success(reply, result)
    },
  )

  // POST /api/stock/transfer
  fastify.post(
    '/api/stock/transfer',
    {
      preHandler: [
        fastify.authenticate,
        validateBody(transferStockSchema),
      ],
    },
    async (request, reply) => {
      const data = request.body as TransferStock
      const result = await locationStockService.transferStock(
        data,
        request.user.id,
      )
      return created(reply, result)
    },
  )
}
