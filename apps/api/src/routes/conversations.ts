// ─────────────────────────────────────────────
// Conversation Routes
// ─────────────────────────────────────────────

import type { FastifyInstance } from 'fastify'
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js'
import { success, paginated } from '../lib/reply.js'
import {
  conversationParamsSchema,
  conversationFiltersSchema,
  messagesFiltersSchema,
  sendMessageSchema,
  takeConversationSchema,
} from '../schemas/conversation-schemas.js'
import type {
  ConversationParams,
  ConversationFilters,
  MessagesFilters,
  SendMessage,
  TakeConversation,
} from '../schemas/conversation-schemas.js'
import * as conversationService from '../services/conversation-service.js'

export default async function conversationRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  // GET /api/conversations/stats
  fastify.get(
    '/api/conversations/stats',
    {
      preHandler: [fastify.authenticate],
    },
    async (_request, reply) => {
      const stats = await conversationService.getConversationStats()
      return success(reply, stats)
    },
  )

  // GET /api/conversations
  fastify.get(
    '/api/conversations',
    {
      preHandler: [fastify.authenticate, validateQuery(conversationFiltersSchema)],
    },
    async (request, reply) => {
      const filters = request.query as ConversationFilters
      const result = await conversationService.listConversations(filters)
      return paginated(reply, result.data, result.page, result.limit, result.total)
    },
  )

  // GET /api/conversations/:id
  fastify.get(
    '/api/conversations/:id',
    {
      preHandler: [fastify.authenticate, validateParams(conversationParamsSchema)],
    },
    async (request, reply) => {
      const { id } = request.params as ConversationParams
      const conversation = await conversationService.getConversationById(id)
      return success(reply, conversation)
    },
  )

  // GET /api/conversations/:id/messages
  fastify.get(
    '/api/conversations/:id/messages',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(conversationParamsSchema),
        validateQuery(messagesFiltersSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as ConversationParams
      const filters = request.query as MessagesFilters
      const result = await conversationService.getConversationMessages(id, filters)
      return paginated(reply, result.data, result.page, result.limit, result.total)
    },
  )

  // POST /api/conversations/:id/messages — send as agent
  fastify.post(
    '/api/conversations/:id/messages',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(conversationParamsSchema),
        validateBody(sendMessageSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as ConversationParams
      const data = request.body as SendMessage
      const agentId = request.user?.id

      if (!agentId) {
        return reply.status(401).send({ success: false, error: 'Not authenticated' })
      }

      const result = await conversationService.sendAgentMessage(id, agentId, data)

      // TODO: Send via WhatsApp provider (requires shared provider instance or queue)
      // For now, the message is saved and the admin panel can poll for it

      return success(reply, result.message)
    },
  )

  // PUT /api/conversations/:id/take — take conversation
  fastify.put(
    '/api/conversations/:id/take',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(conversationParamsSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as ConversationParams
      const agentId = request.user?.id

      if (!agentId) {
        return reply.status(401).send({ success: false, error: 'Not authenticated' })
      }

      const conversation = await conversationService.takeConversation(id, agentId)
      return success(reply, conversation)
    },
  )

  // PUT /api/conversations/:id/release — release to bot
  fastify.put(
    '/api/conversations/:id/release',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(conversationParamsSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as ConversationParams
      const conversation = await conversationService.releaseConversation(id)
      return success(reply, conversation)
    },
  )

  // PUT /api/conversations/:id/close — close conversation
  fastify.put(
    '/api/conversations/:id/close',
    {
      preHandler: [
        fastify.authenticate,
        validateParams(conversationParamsSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.params as ConversationParams
      const conversation = await conversationService.closeConversation(id)
      return success(reply, conversation)
    },
  )
}
