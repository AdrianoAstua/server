import type { FastifyInstance } from 'fastify'
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js'
import { success, created, paginated } from '../lib/reply.js'
import {
  createIncidentSchema,
  incidentParamsSchema,
  resolveIncidentSchema,
  incidentFiltersSchema,
  incidentStatsQuerySchema,
} from '../schemas/incident-schemas.js'
import type {
  CreateIncident,
  IncidentParams,
  ResolveIncident,
  IncidentFilters,
  IncidentStatsQuery,
} from '../schemas/incident-schemas.js'
import * as incidentService from '../services/incident-service.js'

export default async function incidentRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /api/incidents
  fastify.post(
    '/api/incidents',
    {
      preHandler: [fastify.authenticate, validateBody(createIncidentSchema)],
    },
    async (request, reply) => {
      const data = request.body as CreateIncident
      const incident = await incidentService.createIncident(data)
      return created(reply, incident)
    },
  )

  // GET /api/incidents
  fastify.get(
    '/api/incidents',
    {
      preHandler: [fastify.authenticate, validateQuery(incidentFiltersSchema)],
    },
    async (request, reply) => {
      const filters = request.query as IncidentFilters
      const result = await incidentService.listIncidents(filters)
      return paginated(reply, result.data, result.page, result.limit, result.total)
    },
  )

  // GET /api/incidents/stats
  // NOTE: Defined BEFORE /:id to avoid matching "stats" as an id param
  fastify.get(
    '/api/incidents/stats',
    {
      preHandler: [
        fastify.authorize('ADMIN', 'SUPERVISOR_GENERAL'),
        validateQuery(incidentStatsQuerySchema),
      ],
    },
    async (request, reply) => {
      const query = request.query as IncidentStatsQuery
      const stats = await incidentService.getIncidentStats(query)
      return success(reply, stats)
    },
  )

  // GET /api/incidents/:id
  fastify.get(
    '/api/incidents/:id',
    {
      preHandler: [fastify.authenticate, validateParams(incidentParamsSchema)],
    },
    async (request, reply) => {
      const { id } = request.params as IncidentParams
      const incident = await incidentService.getIncidentById(id)
      return success(reply, incident)
    },
  )

  // PUT /api/incidents/:id/resolve
  fastify.put(
    '/api/incidents/:id/resolve',
    {
      preHandler: [
        fastify.authorize('ADMIN', 'SUPERVISOR_GENERAL'),
        validateParams(incidentParamsSchema),
        validateBody(resolveIncidentSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as IncidentParams
      const data = request.body as ResolveIncident
      const incident = await incidentService.resolveIncident(id, data)
      return success(reply, incident)
    },
  )
}
