import { getDatabase } from '@voneb/database'
import pino from 'pino'
import type { INotificationChannel, NotificationPayload } from './types.js'

const logger = pino({ name: 'dashboard-channel' })

export class DashboardChannel implements INotificationChannel {
  readonly name = 'dashboard'

  isConfigured(): boolean {
    return true // Always available — just writes to DB
  }

  async send(notification: NotificationPayload): Promise<void> {
    const db = getDatabase()

    try {
      await db.notification.create({
        data: {
          type: (notification.metadata?.['type'] as string) ?? 'SYSTEM_ERROR',
          title: notification.title,
          body: notification.body,
          channel: 'DASHBOARD',
          priority: notification.priority,
          targetUserId: notification.metadata?.['targetUserId'] as string | undefined,
          relatedEntityType: notification.metadata?.['relatedEntityType'] as string | undefined,
          relatedEntityId: notification.metadata?.['relatedEntityId'] as string | undefined,
          metadata: notification.metadata ?? undefined,
          sent: true,
          sentAt: new Date(),
        },
      })

      logger.info(
        { type: notification.metadata?.['type'] },
        'Dashboard notification saved',
      )
    } catch (error) {
      logger.error({ error }, 'Failed to save dashboard notification')
      throw error
    }
  }
}
