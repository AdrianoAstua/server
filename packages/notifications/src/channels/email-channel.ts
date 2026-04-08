import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import pino from 'pino'
import type { INotificationChannel, NotificationPayload } from './types.js'

const logger = pino({ name: 'email-channel' })

function buildHtmlTemplate(title: string, body: string, priority: string): string {
  const priorityColors: Record<string, string> = {
    LOW: '#6b7280',
    MEDIUM: '#2563eb',
    HIGH: '#f59e0b',
    URGENT: '#ef4444',
  }
  const color = priorityColors[priority] ?? '#2563eb'

  // Convert newlines to <br> for the body
  const htmlBody = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; padding: 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: ${color}; padding: 16px 24px;">
      <h2 style="color: #fff; margin: 0; font-size: 18px;">V ONE B</h2>
    </div>
    <div style="padding: 24px;">
      <h3 style="margin: 0 0 12px; color: #111827;">${title}</h3>
      <p style="color: #374151; line-height: 1.6; margin: 0;">${htmlBody}</p>
    </div>
    <div style="padding: 12px 24px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
      <small style="color: #9ca3af;">Notificacion automatica — V ONE B</small>
    </div>
  </div>
</body>
</html>`
}

export class EmailChannel implements INotificationChannel {
  readonly name = 'email'

  private transporter: Transporter | null = null
  private readonly smtpHost: string
  private readonly smtpPort: number
  private readonly smtpUser: string | undefined
  private readonly smtpPass: string | undefined
  private readonly collaboratorEmail: string | undefined
  private readonly isDev: boolean

  constructor() {
    this.smtpHost = process.env['SMTP_HOST'] ?? 'localhost'
    this.smtpPort = Number(process.env['SMTP_PORT']) || 587
    this.smtpUser = process.env['SMTP_USER']
    this.smtpPass = process.env['SMTP_PASS']
    this.collaboratorEmail = process.env['COLLABORATOR_EMAIL']
    this.isDev = process.env['NODE_ENV'] === 'development'
  }

  isConfigured(): boolean {
    return Boolean(this.smtpUser && this.smtpPass)
  }

  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.smtpHost,
        port: this.smtpPort,
        secure: this.smtpPort === 465,
        auth:
          this.smtpUser && this.smtpPass
            ? { user: this.smtpUser, pass: this.smtpPass }
            : undefined,
      })
    }
    return this.transporter
  }

  async send(notification: NotificationPayload): Promise<void> {
    const recipient = notification.to || this.collaboratorEmail

    if (!recipient) {
      logger.warn('No email recipient configured, skipping')
      return
    }

    if (this.isDev || !this.isConfigured()) {
      logger.info(
        { to: recipient, title: notification.title },
        '[DEV] Email notification (not sent): %s',
        notification.body,
      )
      return
    }

    const html = buildHtmlTemplate(
      notification.title,
      notification.body,
      notification.priority,
    )

    try {
      const transport = this.getTransporter()
      await transport.sendMail({
        from: `"V ONE B" <${this.smtpUser}>`,
        to: recipient,
        subject: `[V ONE B] ${notification.title}`,
        html,
        text: `${notification.title}\n\n${notification.body}`,
      })

      logger.info({ to: recipient }, 'Email notification sent')
    } catch (error) {
      logger.error({ error, to: recipient }, 'Failed to send email notification')
      throw error
    }
  }
}
