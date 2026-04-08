import type { FastifyInstance } from 'fastify'
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js'
import { success, created, paginated } from '../lib/reply.js'
import {
  customerParamsSchema,
  phoneParamsSchema,
  customerFiltersSchema,
  createCustomerSchema,
  updateCustomerSchema,
} from '../schemas/customer-schemas.js'
import type {
  CustomerParams,
  PhoneParams,
  CustomerFilters,
  CreateCustomer,
  UpdateCustomer,
} from '../schemas/customer-schemas.js'
import * as customerService from '../services/customer-service.js'

export default async function customerRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/customers
  fastify.get(
    '/api/customers',
    {
      preHandler: [fastify.authenticate, validateQuery(customerFiltersSchema)],
    },
    async (request, reply) => {
      const filters = request.query as CustomerFilters
      const result = await customerService.listCustomers(filters)
      return paginated(reply, result.data, result.page, result.limit, result.total)
    },
  )

  // GET /api/customers/phone/:phone — must be before :id to avoid conflicts
  fastify.get(
    '/api/customers/phone/:phone',
    {
      preHandler: [fastify.authenticate, validateParams(phoneParamsSchema)],
    },
    async (request, reply) => {
      const { phone } = request.params as PhoneParams
      const customer = await customerService.findByPhone(phone)
      return success(reply, customer)
    },
  )

  // GET /api/customers/:id
  fastify.get(
    '/api/customers/:id',
    {
      preHandler: [fastify.authenticate, validateParams(customerParamsSchema)],
    },
    async (request, reply) => {
      const { id } = request.params as CustomerParams
      const customer = await customerService.getCustomerById(id)
      return success(reply, customer)
    },
  )

  // POST /api/customers
  fastify.post(
    '/api/customers',
    {
      preHandler: [fastify.authenticate, validateBody(createCustomerSchema)],
    },
    async (request, reply) => {
      const data = request.body as CreateCustomer
      const customer = await customerService.createOrUpdate(data.whatsappPhone, data)
      return created(reply, customer)
    },
  )

  // PUT /api/customers/:id
  fastify.put(
    '/api/customers/:id',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(customerParamsSchema),
        validateBody(updateCustomerSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as CustomerParams
      const data = request.body as UpdateCustomer
      // Get existing customer to retrieve phone for upsert
      const existing = await customerService.getCustomerById(id)
      const customer = await customerService.createOrUpdate(existing.whatsappPhone, data)
      return success(reply, customer)
    },
  )

  // GET /api/customers/:id/stats
  fastify.get(
    '/api/customers/:id/stats',
    {
      preHandler: [fastify.authenticate, validateParams(customerParamsSchema)],
    },
    async (request, reply) => {
      const { id } = request.params as CustomerParams
      const stats = await customerService.getCustomerStats(id)
      return success(reply, stats)
    },
  )
}
