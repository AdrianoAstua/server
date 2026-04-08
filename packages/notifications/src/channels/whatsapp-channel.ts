import pino from 'pino'
import type { INotificationChannel, NotificationPayload } from './types.js'

const logger = pino({ name: 'whatsapp-channel' })

export class WhatsAppChannel implements INotificationChannel {
  readonly name = 'whatsapp'

  private readonly token: string | undefined
  private readonly phoneNumberId: string | undefined
  private readonly collaboratorPhone: string | undefined
  private readonly isDev: boolean

  constructor() {
    this.token = process.env['WHATSAPP_TOKEN']
    this.phoneNumberId = process.env['WHATSAPP_PHONE_NUMBER_ID']
    this.collaboratorPhone = process.env['COLLABORATOR_WHATSAPP']
    this.isDev = process.env['NODE_ENV'] === 'development'
  }

  isConfigured(): boolean {
    return Boolean(this.token && this.phoneNumberId)
  }

  async send(notification: NotificationPayload): Promise<void> {
    const recipient = notification.to || this.collaboratorPhone

    if (!recipient) {
      logger.warn('No WhatsApp recipient configured, skipping')
      return
    }

    if (this.isDev || !this.isConfigured()) {
      logger.info(
        { to: recipient, title: notification.title },
        '[DEV] WhatsApp notification (not sent): %s',
        notification.body,
      )
      return
    }

    const url = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`
    const body = JSON.stringify({
      messaging_product: 'whatsapp',
      to: recipient.replace(/[^0-9]/g, ''),
      type: 'text',
      text: {
        preview_url: false,
        body: `*${notification.title}*\n\n${notification.body}`,
      },
    })

    try {
      const { request } = await import('undici')
      const response = await request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body,
      })

      if (response.statusCode >= 400) {
        const responseBody = await response.body.text()
        throw new Error(
          `WhatsApp API error ${response.statusCode}: ${responseBody}`,
        )
      }

      logger.info({ to: recipient }, 'WhatsApp notification sent')
    } catch (error) {
      logger.error({ error, to: recipient }, 'Failed to send WhatsApp notification')
      throw error
    }
  }
}
