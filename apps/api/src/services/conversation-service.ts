// ─────────────────────────────────────────────
// Conversation Service
// ─────────────────────────────────────────────

import { getDatabase } from '@voneb/database'
import { NotFoundError, ValidationError } from '../lib/errors.js'
import type {
  ConversationFilters,
  MessagesFilters,
  SendMessage,
} from '../schemas/conversation-schemas.js'

export async function listConversations(filters: ConversationFilters) {
  const db = getDatabase()
  const { page, limit, ...rest } = filters
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}

  if (rest.status) where['status'] = rest.status
  if (rest.channel) where['channel'] = rest.channel
  if (rest.customerId) where['customerId'] = rest.customerId
  if (rest.assignedAgentId) where['assignedAgentId'] = rest.assignedAgentId

  if (rest.dateFrom || rest.dateTo) {
    const dateFilter: Record<string, Date> = {}
    if (rest.dateFrom) dateFilter['gte'] = rest.dateFrom
    if (rest.dateTo) dateFilter['lte'] = rest.dateTo
    where['createdAt'] = dateFilter
  }

  const [data, total] = await Promise.all([
    db.conversation.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            whatsappPhone: true,
            firstName: true,
            lastName: true,
          },
        },
        assignedAgent: {
          select: { id: true, name: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            senderType: true,
            createdAt: true,
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      skip,
      take: limit,
    }),
    db.conversation.count({ where }),
  ])

  return { data, page, limit, total }
}

export async function getConversationById(id: string) {
  const db = getDatabase()

  const conversation = await db.conversation.findUnique({
    where: { id },
    include: {
      customer: true,
      assignedAgent: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  if (!conversation) {
    throw new NotFoundError('Conversation not found')
  }

  return conversation
}

export async function getConversationMessages(
  conversationId: string,
  filters: MessagesFilters,
) {
  const db = getDatabase()
  const { page, limit } = filters
  const skip = (page - 1) * limit

  // Verify conversation exists
  const exists = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true },
  })

  if (!exists) {
    throw new NotFoundError('Conversation not found')
  }

  const [data, total] = await Promise.all([
    db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
    db.message.count({ where: { conversationId } }),
  ])

  return { data, page, limit, total }
}

export async function sendAgentMessage(
  conversationId: string,
  agentId: string,
  messageData: SendMessage,
) {
  const db = getDatabase()

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      status: true,
      assignedAgentId: true,
      customer: { select: { whatsappPhone: true } },
    },
  })

  if (!conversation) {
    throw new NotFoundError('Conversation not found')
  }

  if (conversation.status !== 'AGENT_ACTIVE') {
    throw new ValidationError(
      'Conversation must be in AGENT_ACTIVE status to send agent messages',
    )
  }

  if (conversation.assignedAgentId !== agentId) {
    throw new ValidationError(
      'Only the assigned agent can send messages in this conversation',
    )
  }

  const message = await db.message.create({
    data: {
      conversationId,
      senderType: 'AGENT',
      content: messageData.content,
      messageType: messageData.messageType,
      mediaUrl: messageData.mediaUrl,
    },
  })

  await db.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  })

  return {
    message,
    whatsappPhone: conversation.customer.whatsappPhone,
  }
}

export async function takeConversation(
  conversationId: string,
  agentId: string,
) {
  const db = getDatabase()

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
  })

  if (!conversation) {
    throw new NotFoundError('Conversation not found')
  }

  if (conversation.status === 'CLOSED') {
    throw new ValidationError('Cannot take a closed conversation')
  }

  const updated = await db.conversation.update({
    where: { id: conversationId },
    data: {
      status: 'AGENT_ACTIVE',
      botState: 'AGENT_ACTIVE',
      assignedAgentId: agentId,
    },
    include: {
      customer: {
        select: { id: true, firstName: true, lastName: true, whatsappPhone: true },
      },
      assignedAgent: { select: { id: true, name: true } },
    },
  })

  // Create system message
  await db.message.create({
    data: {
      conversationId,
      senderType: 'SYSTEM',
      content: 'Asesor se ha conectado a la conversacion.',
      messageType: 'TEXT',
    },
  })

  return updated
}

export async function releaseConversation(conversationId: string) {
  const db = getDatabase()

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
  })

  if (!conversation) {
    throw new NotFoundError('Conversation not found')
  }

  if (conversation.status !== 'AGENT_ACTIVE') {
    throw new ValidationError(
      'Only AGENT_ACTIVE conversations can be released',
    )
  }

  const updated = await db.conversation.update({
    where: { id: conversationId },
    data: {
      status: 'BOT_ACTIVE',
      botState: 'MAIN_MENU',
      assignedAgentId: null,
    },
  })

  await db.message.create({
    data: {
      conversationId,
      senderType: 'SYSTEM',
      content: 'Conversacion devuelta al asistente virtual.',
      messageType: 'TEXT',
    },
  })

  return updated
}

export async function closeConversation(conversationId: string) {
  const db = getDatabase()

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
  })

  if (!conversation) {
    throw new NotFoundError('Conversation not found')
  }

  if (conversation.status === 'CLOSED') {
    throw new ValidationError('Conversation is already closed')
  }

  const updated = await db.conversation.update({
    where: { id: conversationId },
    data: {
      status: 'CLOSED',
      closedAt: new Date(),
    },
  })

  await db.message.create({
    data: {
      conversationId,
      senderType: 'SYSTEM',
      content: 'Conversacion cerrada.',
      messageType: 'TEXT',
    },
  })

  return updated
}

export async function getConversationStats() {
  const db = getDatabase()

  const [active, waiting, agentActive, closed] = await Promise.all([
    db.conversation.count({ where: { status: 'BOT_ACTIVE' } }),
    db.conversation.count({ where: { status: 'WAITING_AGENT' } }),
    db.conversation.count({ where: { status: 'AGENT_ACTIVE' } }),
    db.conversation.count({ where: { status: 'CLOSED' } }),
  ])

  return { active, waiting, agentActive, closed }
}
