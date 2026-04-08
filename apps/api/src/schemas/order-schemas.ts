import { z } from 'zod'

export const orderParamsSchema = z.object({
  id: z.string().min(1, 'Order ID is required'),
})

export const orderFiltersSchema = z.object({
  status: z.enum([
    'PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'DELIVERED', 'CANCELLED',
  ]).optional(),
  customerId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  source: z.enum(['WHATSAPP', 'WEB', 'ADMIN', 'SHOPIFY']).optional(),
  assignedToId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const createOrderSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  items: z.array(z.object({
    variantId: z.string().min(1, 'Variant ID is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    notes: z.string().optional(),
  })).min(1, 'At least one item is required'),
  deliveryMethod: z.enum(['PICKUP', 'CORREOS_CR', 'PRIVATE_COURIER']),
  deliveryAddress: z.any().optional(),
  customerNotes: z.string().optional(),
  source: z.enum(['WHATSAPP', 'WEB', 'ADMIN', 'SHOPIFY']).default('ADMIN'),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'DELIVERED', 'CANCELLED',
  ]),
  notes: z.string().optional(),
})

export const cancelOrderSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required'),
})

export type OrderParams = z.infer<typeof orderParamsSchema>
export type OrderFilters = z.infer<typeof orderFiltersSchema>
export type CreateOrder = z.infer<typeof createOrderSchema>
export type UpdateOrderStatus = z.infer<typeof updateOrderStatusSchema>
export type CancelOrder = z.infer<typeof cancelOrderSchema>
