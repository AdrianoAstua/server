import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { getDatabase } from '@voneb/database'
import { getEnv } from '../config/env.js'
import { validateBody } from '../middleware/validate.js'
import {
  UnauthorizedError,
  NotFoundError,
  ValidationError,
} from '../lib/errors.js'
import { success, noContent } from '../lib/reply.js'
import jwt from 'jsonwebtoken'

const SALT_ROUNDS = 12
const REFRESH_TOKEN_EXPIRY = '7d'
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days in ms

// --- Schemas ---

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must include uppercase, lowercase, and a digit',
    ),
})

// --- Helpers ---

function setRefreshCookie(
  reply: { setCookie: (name: string, value: string, options: Record<string, unknown>) => unknown },
  token: string,
): void {
  reply.setCookie('refreshToken', token, {
    httpOnly: true,
    secure: getEnv().NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: REFRESH_COOKIE_MAX_AGE,
  })
}

function clearRefreshCookie(
  reply: { clearCookie: (name: string, options: Record<string, unknown>) => unknown },
): void {
  reply.clearCookie('refreshToken', {
    httpOnly: true,
    secure: getEnv().NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
  })
}

function sanitizeUser(user: {
  id: string
  email: string
  name: string
  role: string
  avatarUrl: string | null
  active: boolean
  createdAt: Date
}): {
  id: string
  email: string
  name: string
  role: string
  avatarUrl: string | null
  active: boolean
  createdAt: Date
} {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    active: user.active,
    createdAt: user.createdAt,
  }
}

// --- Route registration ---

export default async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const db = getDatabase()
  const env = getEnv()

  // POST /api/auth/login
  fastify.post(
    '/api/auth/login',
    { preHandler: [validateBody(loginSchema)] },
    async (request, reply) => {
      const { email, password } = request.body as z.infer<typeof loginSchema>

      const user = await db.user.findUnique({ where: { email } })
      if (!user || !user.active) {
        throw new UnauthorizedError('Invalid email or password')
      }

      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) {
        throw new UnauthorizedError('Invalid email or password')
      }

      // Update last login
      await db.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      })

      const accessToken = fastify.jwt.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      })

      const refreshToken = jwt.sign(
        { sub: user.id, type: 'refresh' },
        env.JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY },
      )

      setRefreshCookie(reply, refreshToken)

      return success(reply, {
        accessToken,
        user: sanitizeUser(user),
      })
    },
  )

  // POST /api/auth/refresh
  fastify.post('/api/auth/refresh', async (request, reply) => {
    const token =
      (request.cookies as Record<string, string | undefined>)['refreshToken']

    if (!token) {
      throw new UnauthorizedError('Refresh token missing')
    }

    let payload: { sub: string; type: string }
    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
        sub: string
        type: string
      }
    } catch {
      clearRefreshCookie(reply)
      throw new UnauthorizedError('Invalid or expired refresh token')
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedError('Invalid token type')
    }

    const user = await db.user.findUnique({ where: { id: payload.sub } })
    if (!user || !user.active) {
      clearRefreshCookie(reply)
      throw new UnauthorizedError('User not found or inactive')
    }

    const accessToken = fastify.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    })

    // Rotate refresh token
    const newRefreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      env.JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY },
    )
    setRefreshCookie(reply, newRefreshToken)

    return success(reply, { accessToken })
  })

  // POST /api/auth/logout
  fastify.post('/api/auth/logout', async (_request, reply) => {
    clearRefreshCookie(reply)
    return noContent(reply)
  })

  // GET /api/auth/me
  fastify.get(
    '/api/auth/me',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = await db.user.findUnique({
        where: { id: request.user.id },
      })

      if (!user || !user.active) {
        throw new NotFoundError('User not found')
      }

      return success(reply, sanitizeUser(user))
    },
  )

  // PUT /api/auth/change-password
  fastify.put(
    '/api/auth/change-password',
    {
      preHandler: [
        fastify.authenticate,
        validateBody(changePasswordSchema),
      ],
    },
    async (request, reply) => {
      const { currentPassword, newPassword } = request.body as z.infer<
        typeof changePasswordSchema
      >

      const user = await db.user.findUnique({
        where: { id: request.user.id },
      })

      if (!user) {
        throw new NotFoundError('User not found')
      }

      const valid = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!valid) {
        throw new ValidationError('Current password is incorrect')
      }

      const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      })

      return success(reply, { message: 'Password changed successfully' })
    },
  )
}
