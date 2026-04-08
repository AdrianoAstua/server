// ─────────────────────────────────────────────
// Message Router
// ─────────────────────────────────────────────

import { getDatabase } from '@voneb/database'
import pino from 'pino'
import type { IWhatsAppProvider, IncomingMessage } from './providers/types.js'
import type { ResponseMessage } from './state-machine/types.js'
import { processMessage } from './state-machine/conversation-manager.js'

const logger = pino({ level: process.env['LOG_LEVEL'] ?? 'info' })

export function createMessageRouter(provider: IWhatsAppProvider) {
  return async function routeMessage(message: IncomingMessage): Promise<void> {
    const phone = message.from
    logger.info({ from: phone, type: message.type }, 'Incoming message')

    try {
      const db = getDatabase()

      // Check if there's an active agent conversation for this phone
      const customer = await db.customer.findUnique({
        where: { whatsappPhone: normalizePhone(phone) },
      })

      if (customer) {
        const activeConversation = await db.conversation.findFirst({
          where: {
            customerId: customer.id,
            channel: 'WHATSAPP',
            status: { not: 'CLOSED' },
          },
          orderBy: { createdAt: 'desc' },
        })

        // If agent is active, just save the message — don't run state machine
        if (activeConversation?.status === 'AGENT_ACTIVE') {
          await db.message.create({
            data: {
              conversationId: activeConversation.id,
              senderType: 'CUSTOMER',
              content: message.text,
              messageType: mapMessageType(message.type),
              whatsappMessageId: message.messageId,
            },
          })

          await db.conversation.update({
            where: { id: activeConversation.id },
            data: { lastMessageAt: new Date() },
          })

          logger.info(
            { conversationId: activeConversation.id },
            'Message saved for agent-active conversation',
          )
          return
        }
      }

      // Run through conversation manager (state machine)
      const result = await processMessage(message)

      // Send responses via WhatsApp provider
      for (const response of result.responses) {
        await sendResponse(provider, phone, response)
      }

      logger.info(
        {
          conversationId: result.conversationId,
          responseCount: result.responses.length,
        },
        'Message processed',
      )
    } catch (err: unknown) {
      logger.error({ err, from: phone }, 'Error processing message')

      // Send a fallback error message
      try {
        await provider.sendTextMessage(
          phone,
          'Disculpa, tuve un problema procesando tu mensaje. Por favor intenta de nuevo.',
        )
      } catch (sendErr: unknown) {
        logger.error({ err: sendErr }, 'Failed to send error message')
      }
    }
  }
}

// ── Helpers ──────────────────────────────────

async function sendResponse(
  provider: IWhatsAppProvider,
  to: string,
  response: ResponseMessage,
): Promise<void> {
  switch (response.type) {
    case 'buttons':
      if (response.buttons && response.buttons.length > 0) {
        await provider.sendButtonMessage(to, response.text, response.buttons)
      } else {
        await provider.sendTextMessage(to, response.text)
      }
      break

    case 'list':
      if (response.sections && response.sections.length > 0) {
        await provider.sendListMessage(to, response.text, response.sections)
      } else {
        await provider.sendTextMessage(to, response.text)
      }
      break

    case 'text':
    default:
      await provider.sendTextMessage(to, response.text)
      break
  }
}

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
