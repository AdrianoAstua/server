// ─────────────────────────────────────────────
// WhatsApp Cloud API Provider (Production)
// ─────────────────────────────────────────────

import { request } from 'undici'
import { randomUUID } from 'node:crypto'
import pino from 'pino'
import type {
  IWhatsAppProvider,
  IncomingMessage,
  MessageHandler,
  WhatsAppButton,
  WhatsAppListSection,
} from './types.js'

const logger = pino({ level: process.env['LOG_LEVEL'] ?? 'info' })

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0'

interface CloudApiConfig {
  phoneNumberId: string
  accessToken: string
  verifyToken: string
}

interface CloudApiMessageResponse {
  messaging_product: string
  contacts: { input: string; wa_id: string }[]
  messages: { id: string }[]
}

export class CloudApiProvider implements IWhatsAppProvider {
  private handlers: MessageHandler[] = []
  private readonly config: CloudApiConfig

  constructor() {
    const phoneNumberId = process.env['WHATSAPP_PHONE_NUMBER_ID']
    const accessToken = process.env['WHATSAPP_ACCESS_TOKEN']
    const verifyToken = process.env['WHATSAPP_VERIFY_TOKEN'] ?? 'voneb-verify'

    if (!phoneNumberId || !accessToken) {
      throw new Error(
        'WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN are required for Cloud API provider',
      )
    }

    this.config = { phoneNumberId, accessToken, verifyToken }
  }

  async initialize(): Promise<void> {
    logger.info('WhatsApp Cloud API provider initialized')
    logger.info(
      { phoneNumberId: this.config.phoneNumberId },
      'Ready to send/receive messages',
    )
  }

  async sendTextMessage(to: string, text: string): Promise<string> {
    const body = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }
    return this.sendRequest(body)
  }

  async sendButtonMessage(
    to: string,
    text: string,
    buttons: WhatsAppButton[],
  ): Promise<string> {
    const body = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text },
        action: {
          buttons: buttons.slice(0, 3).map((b) => ({
            type: 'reply' as const,
            reply: { id: b.id, title: b.title.slice(0, 20) },
          })),
        },
      },
    }
    return this.sendRequest(body)
  }

  async sendListMessage(
    to: string,
    text: string,
    sections: WhatsAppListSection[],
  ): Promise<string> {
    const body = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text },
        action: {
          button: 'Ver opciones',
          sections: sections.map((s) => ({
            title: s.title.slice(0, 24),
            rows: s.rows.map((r) => ({
              id: r.id,
              title: r.title.slice(0, 24),
              description: r.description?.slice(0, 72),
            })),
          })),
        },
      },
    }
    return this.sendRequest(body)
  }

  onMessage(handler: MessageHandler): void {
    this.handlers.push(handler)
  }

  async shutdown(): Promise<void> {
    logger.info('Cloud API provider shutting down')
  }

  /**
   * Parse incoming webhook payload from WhatsApp Cloud API.
   * Call this from your webhook endpoint handler.
   */
  handleWebhook(payload: Record<string, unknown>): void {
    const entries = (payload['entry'] ?? []) as WebhookEntry[]

    for (const entry of entries) {
      const changes = entry.changes ?? []

      for (const change of changes) {
        if (change.field !== 'messages') continue

        const messages = change.value?.messages ?? []
        for (const msg of messages) {
          const parsed = this.parseWebhookMessage(msg)
          if (!parsed) continue

          for (const handler of this.handlers) {
            void Promise.resolve(handler(parsed)).catch((err: unknown) => {
              logger.error({ err }, 'Message handler error')
            })
          }
        }
      }
    }
  }

  /**
   * Verify webhook GET request from Meta.
   */
  verifyWebhook(
    mode: string,
    token: string,
    challenge: string,
  ): string | null {
    if (mode === 'subscribe' && token === this.config.verifyToken) {
      return challenge
    }
    return null
  }

  // ── Private helpers ──────────────────────────

  private async sendRequest(body: Record<string, unknown>): Promise<string> {
    const url = `${GRAPH_API_BASE}/${this.config.phoneNumberId}/messages`

    const { statusCode, body: responseBody } = await request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.accessToken}`,
      },
      body: JSON.stringify(body),
    })

    const responseText = await responseBody.text()

    if (statusCode < 200 || statusCode >= 300) {
      logger.error(
        { statusCode, response: responseText },
        'WhatsApp Cloud API error',
      )
      throw new Error(`WhatsApp API error: ${statusCode}`)
    }

    const data = JSON.parse(responseText) as CloudApiMessageResponse
    return data.messages?.[0]?.id ?? randomUUID()
  }

  private parseWebhookMessage(
    msg: WebhookMessage,
  ): IncomingMessage | null {
    const from = msg.from ?? ''
    const messageId = msg.id ?? randomUUID()
    const timestamp = new Date(Number(msg.timestamp ?? 0) * 1000)

    if (msg.type === 'text' && msg.text?.body) {
      return {
        from,
        text: msg.text.body,
        type: 'text',
        messageId,
        timestamp,
      }
    }

    if (msg.type === 'interactive') {
      const interactive = msg.interactive
      if (interactive?.type === 'button_reply') {
        return {
          from,
          text: interactive.button_reply?.title ?? '',
          type: 'button_response',
          messageId,
          timestamp,
          buttonResponseId: interactive.button_reply?.id,
        }
      }
      if (interactive?.type === 'list_reply') {
        return {
          from,
          text: interactive.list_reply?.title ?? '',
          type: 'list_response',
          messageId,
          timestamp,
          listResponseId: interactive.list_reply?.id,
        }
      }
    }

    if (msg.type === 'image') {
      return {
        from,
        text: msg.image?.caption ?? '',
        type: 'image',
        messageId,
        timestamp,
        imageUrl: msg.image?.id,
      }
    }

    if (msg.type === 'location') {
      return {
        from,
        text: '',
        type: 'location',
        messageId,
        timestamp,
        location: {
          latitude: msg.location?.latitude ?? 0,
          longitude: msg.location?.longitude ?? 0,
        },
      }
    }

    return null
  }
}

// ── Webhook payload types ──────────────────────

interface WebhookEntry {
  changes: {
    field: string
    value?: {
      messages?: WebhookMessage[]
    }
  }[]
}

interface WebhookMessage {
  from?: string
  id?: string
  timestamp?: string
  type?: string
  text?: { body?: string }
  interactive?: {
    type?: string
    button_reply?: { id?: string; title?: string }
    list_reply?: { id?: string; title?: string }
  }
  image?: { id?: string; caption?: string }
  location?: { latitude?: number; longitude?: number }
}
