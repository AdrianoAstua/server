import type { FastifyInstance } from 'fastify'
import { validateBody, validateParams } from '../middleware/validate.js'
import { success } from '../lib/reply.js'
import {
  configKeyParamsSchema,
  updateConfigSchema,
} from '../schemas/config-schemas.js'
import type { ConfigKeyParams, UpdateConfig } from '../schemas/config-schemas.js'
import * as configService from '../services/config-service.js'

interface AuthenticatedUser {
  id: string
}

export default async function configRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  // GET /api/config — list all configs (ADMIN only)
  fastify.get(
    '/api/config',
    {
      preHandler: [fastify.authorize('ADMIN')],
    },
    async (_request, reply) => {
      const configs = await configService.listConfigs()
      return success(reply, configs)
    },
  )

  // PUT /api/config/:key — update a config value (ADMIN only)
  fastify.put(
    '/api/config/:key',
    {
      preHandler: [
        fastify.authorize('ADMIN'),
        validateParams(configKeyParamsSchema),
        validateBody(updateConfigSchema),
      ],
    },
    async (request, reply) => {
      const { key } = request.params as ConfigKeyParams
      const data = request.body as UpdateConfig
      const user = request.user as AuthenticatedUser
      const config = await configService.updateConfig(key, data, user.id)
      return success(reply, config)
    },
  )
}
