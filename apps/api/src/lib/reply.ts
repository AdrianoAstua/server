import type { FastifyReply } from 'fastify'

interface SuccessResponse<T> {
  success: true
  data: T
}

interface SuccessResponseWithMeta<T> {
  success: true
  data: T
  meta: Record<string, unknown>
}

interface PaginatedMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface PaginatedResponse<T> {
  success: true
  data: T[]
  meta: PaginatedMeta
}

export function success<T>(
  reply: FastifyReply,
  data: T,
  meta?: Record<string, unknown>,
): FastifyReply {
  const body: SuccessResponse<T> | SuccessResponseWithMeta<T> = meta
    ? { success: true, data, meta }
    : { success: true, data }

  return reply.status(200).send(body)
}

export function created<T>(reply: FastifyReply, data: T): FastifyReply {
  return reply.status(201).send({ success: true, data })
}

export function noContent(reply: FastifyReply): FastifyReply {
  return reply.status(204).send()
}

export function paginated<T>(
  reply: FastifyReply,
  data: T[],
  page: number,
  limit: number,
  total: number,
): FastifyReply {
  const totalPages = Math.ceil(total / limit)

  const body: PaginatedResponse<T> = {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  }

  return reply.status(200).send(body)
}
