// ─────────────────────────────────────────────
// Conversation Manager — Main State Machine
// ─────────────────────────────────────────────

import { getDatabase } from '@voneb/database'
import pino from 'pino'
import type { IncomingMessage } from '../providers/types.js'
import type {
  BotState,
  ConversationContext,
  ResponseMessage,
  SideEffect,
  StateHandlerInput,
} from './types.js'
import { handleGreeting } from './handlers/greeting-handler.js'
import { handleDataCollection } from './handlers/data-collection-handler.js'
import { handleMenu } from './handlers/menu-handler.js'
import { handleAvailability } from './handlers/availability-handler.js'
import { handleOrderStatus } from './handlers/order-status-handler.js'
import { handleAgent } from './handlers/agent-handler.js'

const logger = pino({ level: process.env['LOG_LEVEL'] ?? 'info' })

export interface ConversationManagerResult {
  responses: ResponseMessage[]
  conversationId: string
  customerId: string
}

export async function processMessage(
  message: IncomingMessage,
): Promise<ConversationManagerResult> {
  const db = getDatabase()
  const phone = normalizePhone(message.from)

  // 1. Find or create customer
  let customer = await db.customer.findUnique({
    where: { whatsappPhone: phone },
  })

  const isNewCustomer = !customer

  if (!customer) {
    customer = await db.customer.create({
      data: { whatsappPhone: phone },
    })
    logger.info({ phone, customerId: customer.id }, 'New customer created')
  }

  // Update last interaction
  await db.customer.update({
    where: { id: customer.id },
    data: { lastInteractionAt: new Date() },
  })

  // 2. Find or create active conversation
  let conversation = await db.conversation.findFirst({
    where: {
      customerId: customer.id,
      channel: 'WHATSAPP',
      status: { not: 'CLOSED' },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        customerId: customer.id,
        channel: 'WHATSAPP',
        status: 'BOT_ACTIVE',
        botState: 'GREETING',
        botContext: {},
      },
    })
    logger.info(
      { conversationId: conversation.id },
      'New conversation created',
    )
  }

  // 3. Save incoming message
  await db.message.create({
    data: {
      conversationId: conversation.id,
      senderType: 'CUSTOMER',
      content: message.text,
      messageType: mapMessageType(message.type),
      whatsappMessageId: message.messageId,
    },
  })

  // 4. Get current state
  const currentState = (conversation.botState as BotState) ?? 'GREETING'
  const context = (conversation.botContext as ConversationContext) ?? {}

  const customerName = customer.firstName
    ? `${customer.firstName}${customer.lastName ? ` ${customer.lastName}` : ''}`
    : undefined

  // 5. Dispatch to handler
  const handlerInput: StateHandlerInput = {
    message,
    customerId: customer.id,
    conversationId: conversation.id,
    context,
    customerName,
    isNewCustomer,
  }

  const result = await dispatchToHandler(currentState, handlerInput)

  // 6. Process side effects
  await processSideEffects(result.sideEffects)

  // 7. Save responses and update state
  for (const response of result.responses) {
    await db.message.create({
      data: {
        conversationId: conversation.id,
        senderType: 'BOT',
        content: response.text,
        messageType: 'TEXT',
        metadata: buildResponseMetadata(response),
      },
    })
  }

  // Update conversation state
  const newStatus =
    result.nextState === 'AGENT_ACTIVE'
      ? 'AGENT_ACTIVE'
      : result.nextState === 'WAITING_FOR_AGENT'
        ? 'WAITING_AGENT'
        : 'BOT_ACTIVE'

  await db.conversation.update({
    where: { id: conversation.id },
    data: {
      botState: result.nextState,
      botContext: context,
      status: newStatus as 'BOT_ACTIVE' | 'WAITING_AGENT' | 'AGENT_ACTIVE',
      lastMessageAt: new Date(),
    },
  })

  return {
    responses: result.responses,
    conversationId: conversation.id,
    customerId: customer.id,
  }
}

// ── Handler dispatch ────────────────────────

async function dispatchToHandler(
  state: BotState,
  input: StateHandlerInput,
) {
  switch (state) {
    case 'IDLE':
    case 'GREETING':
      return handleGreeting(input)

    case 'COLLECTING_NAME':
    case 'COLLECTING_EMAIL':
    case 'COLLECTING_ADDRESS':
      return handleDataCollection(state, input)

    case 'MAIN_MENU':
      return handleMenu(input)

    case 'BROWSING_CATALOG':
    case 'CHECKING_AVAILABILITY':
      return handleAvailability(input)

    case 'CHECKING_ORDER_STATUS':
      return handleOrderStatus(input)

    case 'REQUESTING_AGENT':
    case 'WAITING_FOR_AGENT':
      return handleAgent(state, input)

    case 'AGENT_ACTIVE':
      // Should not reach here; handled by message router
      return {
        nextState: 'AGENT_ACTIVE' as BotState,
        responses: [],
        sideEffects: [],
      }

    default:
      logger.warn({ state }, 'Unknown state, resetting to GREETING')
      return handleGreeting(input)
  }
}

// ── Side effect processing ──────────────────

async function processSideEffects(effects: SideEffect[]): Promise<void> {
  const db = getDatabase()

  for (const effect of effects) {
    try {
      switch (effect.type) {
        case 'CREATE_CUSTOMER':
          // Customer already created above, skip
          break

        case 'UPDATE_CUSTOMER':
          await db.customer.update({
            where: { id: effect.data.customerId },
            data: {
              ...(effect.data.firstName !== undefined && {
                firstName: effect.data.firstName,
              }),
              ...(effect.data.lastName !== undefined && {
                lastName: effect.data.lastName,
              }),
              ...(effect.data.email !== undefined && {
                email: effect.data.email,
              }),
              ...(effect.data.dataCollectionComplete !== undefined && {
                dataCollectionComplete: effect.data.dataCollectionComplete,
              }),
            },
          })
          break

        case 'NOTIFY_AGENT':
          await db.notification.create({
            data: {
              type: 'AGENT_REQUEST',
              title: 'Cliente solicita asesor',
              body: effect.summary,
              channel: 'DASHBOARD',
              priority: 'HIGH',
              relatedEntityType: 'conversation',
              relatedEntityId: effect.conversationId,
              metadata: { conversationId: effect.conversationId },
            },
          })
          logger.info(
            { conversationId: effect.conversationId },
            'Agent notification created',
          )
          break

        case 'CREATE_ORDER':
          logger.info(
            { customerId: effect.data.customerId },
            'Order creation triggered (handled by order service)',
          )
          break
      }
    } catch (err: unknown) {
      logger.error({ err, effect: effect.type }, 'Side effect processing error')
    }
  }
}

// ── Helpers ──────────────────────────────────

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, '')
}

function mapMessageType(
  type: IncomingMessage['type'],
): 'TEXT' | 'IMAGE' | 'BUTTON_RESPONSE' | 'LOCATION' {
  switch (type) {
    case 'text':
      return 'TEXT'
    case 'button_response':
    case 'list_response':
      return 'BUTTON_RESPONSE'
    case 'image':
      return 'IMAGE'
    case 'location':
      return 'LOCATION'
    default:
      return 'TEXT'
  }
}

function buildResponseMetadata(
  response: ResponseMessage,
): Record<string, unknown> | undefined {
  if (response.type === 'buttons' && response.buttons) {
    return { responseType: 'buttons', buttons: response.buttons }
  }
  if (response.type === 'list' && response.sections) {
    return { responseType: 'list', sections: response.sections }
  }
  return undefined
}
