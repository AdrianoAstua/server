// ─────────────────────────────────────────────
// @voneb/notifications — Multi-channel notification system
// ─────────────────────────────────────────────

// Types
export type {
  INotificationChannel,
  NotificationPayload,
  NotificationPriority,
  CreateNotification,
  NotifFilters,
  OrderData,
  VariantData,
  CustomerData,
} from './channels/types.js'

// Channels
export { WhatsAppChannel } from './channels/whatsapp-channel.js'
export { EmailChannel } from './channels/email-channel.js'
export { DashboardChannel } from './channels/dashboard-channel.js'

// Service
export { NotificationService, getNotificationService } from './notification-service.js'

// Worker
export { createNotificationWorker } from './worker.js'
