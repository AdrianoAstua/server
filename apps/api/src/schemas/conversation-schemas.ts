// ─────────────────────────────────────────────
// Conversation Schemas
// ─────────────────────────────────────────────

import { z } from 'zod'

export const conversationParamsSchema = z.object({
  id: z.string().min(1, 'Conversation ID is required'),
})

export const conversationFiltersSchema = z.object({
  status: z
    .enum(['BOT_ACTIVE', 'WAITING_AGENT', 'AGENT_ACTIVE', 'CLOSED'])
    .optional(),
  channel: z.enum(['WHATSAPP', 'WEB']).optional(),
  customerId: z.string().optional(),
  assignedAgentId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const messagesFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  messageType: z.enum(['TEXT', 'IMAGE', 'DOCUMENT']).default('TEXT'),
  mediaUrl: z.string().url().optional(),
})

export const takeConversationSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
})

export type ConversationParams = z.infer<typeof conversationParamsSchema>
export type ConversationFilters = z.infer<typeof conversationFiltersSchema>
export type MessagesFilters = z.infer<typeof messagesFiltersSchema>
export type SendMessage = z.infer<typeof sendMessageSchema>
export type TakeConversation = z.infer<typeof takeConversationSchema>
