import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import { getEnv } from '../config/env.js'
import { UnauthorizedError, ForbiddenError } from '../lib/errors.js'

interface JwtSignPayload {
  sub: string
  email: string
  role: string
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
    authorize: (
      ...roles: string[]
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtSignPayload
    user: {
      id: string
      email: string
      role: string
    }
  }
}

async function authPlugin(fastify: FastifyInstance): Promise<void> {
  const env = getEnv()

  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: '15m',
    },
    cookie: {
      cookieName: 'refreshToken',
      signed: false,
    },
  })

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
      try {
        await request.jwtVerify()
      } catch {
        throw new UnauthorizedError('Invalid or expired token')
      }
    },
  )

  fastify.decorate(
    'authorize',
    (...roles: string[]) =>
      async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
        try {
          await request.jwtVerify()
        } catch {
          throw new UnauthorizedError('Invalid or expired token')
        }

        const userRole = request.user.role
        if (!roles.includes(userRole)) {
          throw new ForbiddenError(
            `Role '${userRole}' is not authorized for this resource`,
          )
        }
      },
  )
}

export default fp(authPlugin, {
  name: 'auth',
  fastify: '5.x',
})
