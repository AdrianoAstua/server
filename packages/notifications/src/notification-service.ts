import { Queue } from 'bullmq'
import { getDatabase } from '@voneb/database'
import pino from 'pino'
import { WhatsAppChannel } from './channels/whatsapp-channel.js'
import { EmailChannel } from './channels/email-channel.js'
import { DashboardChannel } from './channels/dashboard-channel.js'
import type {
  INotificationChannel,
  NotificationPayload,
  CreateNotification,
  NotifFilters,
  OrderData,
  VariantData,
  CustomerData,
} from './channels/types.js'

const logger = pino({ name: 'notification-service' })

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatColones(cents: number): string {
  const amount = Math.round(cents / 100)
  return `₡${amount.toLocaleString('es-CR')}`
}

function getRedisConnection(): { host: string; port: number } {
  const url = process.env['REDIS_URL'] ?? 'redis://localhost:6379'
  try {
    const parsed = new URL(url)
    return {
      host: parsed.hostname || 'localhost',
      port: Number(parsed.port) || 6379,
    }
  } catch {
    return { host: 'localhost', port: 6379 }
  }
}

// ─────────────────────────────────────────────
// NotificationService
// ─────────────────────────────────────────────

export class NotificationService {
  private readonly channels: Map<string, INotificationChannel> = new Map()
  private queue: Queue | null = null

  constructor() {
    // Register channels
    const whatsapp = new WhatsAppChannel()
    const email = new EmailChannel()
    const dashboard = new DashboardChannel()

    this.channels.set('WHATSAPP', whatsapp)
    this.channels.set('EMAIL', email)
    this.channels.set('DASHBOARD', dashboard)

    // Attempt to create BullMQ queue (non-blocking)
    try {
      this.queue = new Queue('notifications', {
        connection: getRedisConnection(),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 500 },
          removeOnFail: { count: 200 },
        },
      })
    } catch (error) {
      logger.warn({ error }, 'Redis not available — notifications will be sent synchronously')
    }
  }

  // ─── Core send ─────────────────────────────

  /** Enqueue notification for async processing */
  async send(notification: CreateNotification): Promise<void> {
    if (this.queue) {
      await this.queue.add('send-notification', notification, {
        priority: this.priorityToNumber(notification.priority),
      })
      return
    }

    // Fallback: send synchronously
    await this.sendDirect(notification)
  }

  /** Broadcast to ALL configured channels */
  async broadcast(notification: CreateNotification): Promise<void> {
    const broadcastNotif: CreateNotification = { ...notification, channel: 'ALL' }

    if (this.queue) {
      await this.queue.add('send-notification', broadcastNotif, {
        priority: this.priorityToNumber(notification.priority),
      })
      return
    }

    await this.sendDirect(broadcastNotif)
  }

  /** Send directly without queue (used by worker and fallback) */
  async sendDirect(notification: CreateNotification): Promise<void> {
    const payload: NotificationPayload = {
      title: notification.title,
      body: notification.body,
      to: notification.targetUserId ?? '',
      priority: notification.priority,
      metadata: {
        type: notification.type,
        targetUserId: notification.targetUserId,
        relatedEntityType: notification.relatedEntityType,
        relatedEntityId: notification.relatedEntityId,
        ...notification.metadata,
      },
    }

    if (notification.channel === 'ALL') {
      const results = await Promise.allSettled(
        Array.from(this.channels.values())
          .filter((ch) => ch.isConfigured())
          .map((ch) => ch.send(payload)),
      )

      for (const result of results) {
        if (result.status === 'rejected') {
          logger.error({ error: result.reason }, 'Channel send failed')
        }
      }
      return
    }

    const channel = this.channels.get(notification.channel)
    if (!channel) {
      logger.warn({ channel: notification.channel }, 'Unknown notification channel')
      return
    }

    if (!channel.isConfigured()) {
      logger.warn({ channel: notification.channel }, 'Channel not configured, skipping')
      return
    }

    await channel.send(payload)
  }

  // ─── Predefined notifications ──────────────

  async notifyNewOrder(order: OrderData): Promise<void> {
    await this.broadcast({
      type: 'NEW_ORDER',
      title: 'Nuevo pedido',
      body: [
        `📦 Nuevo pedido ${order.orderNumber}`,
        `👤 ${order.customerName}`,
        `💰 ${formatColones(order.totalCents)}`,
        `📱 ${order.customerPhone}`,
        `📋 ${order.itemCount} articulo(s)`,
      ].join('\n'),
      channel: 'ALL',
      priority: 'HIGH',
      relatedEntityType: 'order',
      relatedEntityId: order.orderNumber,
      metadata: { orderNumber: order.orderNumber },
    })
  }

  async notifyOrderReady(order: OrderData): Promise<void> {
    await this.broadcast({
      type: 'ORDER_READY',
      title: 'Pedido listo',
      body: [
        `✅ Pedido ${order.orderNumber} listo para entrega`,
        `👤 ${order.customerName}`,
        `📱 ${order.customerPhone}`,
      ].join('\n'),
      channel: 'ALL',
      priority: 'MEDIUM',
      relatedEntityType: 'order',
      relatedEntityId: order.orderNumber,
    })
  }

  async notifyOrderShipped(order: OrderData, tracking: string): Promise<void> {
    await this.broadcast({
      type: 'ORDER_SHIPPED',
      title: 'Pedido enviado',
      body: [
        `🚚 Pedido ${order.orderNumber} enviado`,
        `👤 ${order.customerName}`,
        `📦 Tracking: ${tracking}`,
      ].join('\n'),
      channel: 'ALL',
      priority: 'MEDIUM',
      relatedEntityType: 'order',
      relatedEntityId: order.orderNumber,
      metadata: { tracking },
    })
  }

  async notifyLowStock(variant: VariantData): Promise<void> {
    await this.broadcast({
      type: 'LOW_STOCK',
      title: 'Stock bajo',
      body: [
        `⚠️ Stock bajo: ${variant.productName} ${variant.sku} (${variant.size}/${variant.color})`,
        `Quedan ${variant.stockQuantity} unidades (minimo: ${variant.minStockThreshold})`,
      ].join('\n'),
      channel: 'ALL',
      priority: 'MEDIUM',
      relatedEntityType: 'variant',
      relatedEntityId: variant.sku,
    })
  }

  async notifyStockOut(variant: VariantData): Promise<void> {
    await this.broadcast({
      type: 'STOCK_OUT',
      title: 'Producto agotado',
      body: [
        `🔴 AGOTADO: ${variant.productName} ${variant.sku} (${variant.size}/${variant.color})`,
        `Stock: 0 unidades`,
      ].join('\n'),
      channel: 'ALL',
      priority: 'URGENT',
      relatedEntityType: 'variant',
      relatedEntityId: variant.sku,
    })
  }

  async notifyAgentRequest(
    conversationId: string,
    summary: string,
  ): Promise<void> {
    await this.broadcast({
      type: 'AGENT_REQUEST',
      title: 'Solicitud de asesor',
      body: [
        `💬 Solicitud de asesor`,
        `📝 ${summary}`,
        `🔗 Conversacion: ${conversationId}`,
      ].join('\n'),
      channel: 'ALL',
      priority: 'HIGH',
      relatedEntityType: 'conversation',
      relatedEntityId: conversationId,
    })
  }

  async notifyNewCustomer(customer: CustomerData): Promise<void> {
    await this.send({
      type: 'NEW_CUSTOMER',
      title: 'Nuevo cliente',
      body: [
        `🆕 Nuevo cliente registrado`,
        `👤 ${customer.name}`,
        `📱 ${customer.phone}`,
        customer.email ? `📧 ${customer.email}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      channel: 'DASHBOARD',
      priority: 'LOW',
    })
  }

  async notifyCRMError(
    error: string,
    context: Record<string, unknown>,
  ): Promise<void> {
    await this.broadcast({
      type: 'CRM_SYNC_ERROR',
      title: 'Error de sincronizacion CRM',
      body: [
        `🔴 Error CRM`,
        `📝 ${error}`,
        `🔧 Contexto: ${JSON.stringify(context)}`,
      ].join('\n'),
      channel: 'ALL',
      priority: 'URGENT',
      metadata: { error, context },
    })
  }

  // ─── Dashboard queries ─────────────────────

  async getForUser(
    userId: string,
    filters?: NotifFilters,
  ): Promise<{ data: Array<Record<string, unknown>>; total: number }> {
    const db = getDatabase()
    const page = filters?.page ?? 1
    const limit = filters?.limit ?? 20
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      targetUserId: userId,
    }

    if (filters?.type) where['type'] = filters.type
    if (filters?.read !== undefined) where['read'] = filters.read
    if (filters?.priority) where['priority'] = filters.priority

    const [data, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.notification.count({ where }),
    ])

    return { data, total }
  }

  async markAsRead(id: string): Promise<void> {
    const db = getDatabase()
    await db.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    })
  }

  async markAllAsRead(userId: string): Promise<void> {
    const db = getDatabase()
    await db.notification.updateMany({
      where: { targetUserId: userId, read: false },
      data: { read: true, readAt: new Date() },
    })
  }

  async getUnreadCount(userId: string): Promise<number> {
    const db = getDatabase()
    return db.notification.count({
      where: { targetUserId: userId, read: false },
    })
  }

  // ─── Internals ─────────────────────────────

  private priorityToNumber(priority: string): number {
    const map: Record<string, number> = {
      URGENT: 1,
      HIGH: 2,
      MEDIUM: 3,
      LOW: 4,
    }
    return map[priority] ?? 3
  }

  async close(): Promise<void> {
    if (this.queue) {
      await this.queue.close()
    }
  }
}

// ─────────────────────────────────────────────
// Singleton
// ─────────────────────────────────────────────

let instance: NotificationService | undefined

export function getNotificationService(): NotificationService {
  if (!instance) {
    instance = new NotificationService()
  }
  return instance
}
