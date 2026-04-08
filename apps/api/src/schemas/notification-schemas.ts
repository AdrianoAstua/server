import { z } from 'zod'

export const notificationParamsSchema = z.object({
  id: z.string().min(1, 'Notification ID is required'),
})

export const notificationFiltersSchema = z.object({
  type: z.enum([
    'NEW_CUSTOMER', 'NEW_ORDER', 'ORDER_STATUS', 'LOW_STOCK', 'STOCK_OUT',
    'AGENT_REQUEST', 'ORDER_READY', 'ORDER_SHIPPED', 'CRM_SYNC_ERROR', 'SYSTEM_ERROR',
  ]).optional(),
  read: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type NotificationParams = z.infer<typeof notificationParamsSchema>
export type NotificationFilters = z.infer<typeof notificationFiltersSchema>
