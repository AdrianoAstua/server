// ─────────────────────────────────────────────
// Channel interface & shared types
// ─────────────────────────────────────────────

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface NotificationPayload {
  title: string
  body: string
  to: string // phone, email, or userId
  priority: NotificationPriority
  metadata?: Record<string, unknown>
}

export interface INotificationChannel {
  readonly name: string
  send(notification: NotificationPayload): Promise<void>
  isConfigured(): boolean
}

// ─────────────────────────────────────────────
// Data types for predefined notifications
// ─────────────────────────────────────────────

export interface OrderData {
  orderNumber: string
  customerName: string
  customerPhone: string
  totalCents: number
  currency: string
  itemCount: number
}

export interface VariantData {
  productName: string
  sku: string
  size: string
  color: string
  stockQuantity: number
  minStockThreshold: number
}

export interface CustomerData {
  name: string
  phone: string
  email?: string
}

export interface CreateNotification {
  type: string
  title: string
  body: string
  channel: 'WHATSAPP' | 'EMAIL' | 'DASHBOARD' | 'ALL'
  priority: NotificationPriority
  targetUserId?: string
  relatedEntityType?: string
  relatedEntityId?: string
  metadata?: Record<string, unknown>
}

export interface NotifFilters {
  type?: string
  read?: boolean
  priority?: NotificationPriority
  page: number
  limit: number
}
