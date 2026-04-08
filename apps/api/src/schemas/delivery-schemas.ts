import { z } from 'zod'

// ─────────────────────────────────────────────
// Params
// ─────────────────────────────────────────────

export const deliveryParamsSchema = z.object({
  id: z.string().min(1, 'Delivery record ID is required'),
})

export const deliveryWorkOrderParamsSchema = z.object({
  workOrderId: z.string().min(1, 'Work order ID is required'),
})

// ─────────────────────────────────────────────
// Create delivery
// ─────────────────────────────────────────────

export const createDeliverySchema = z.object({
  workOrderId: z.string().min(1, 'Work order ID is required'),
  deliveryType: z.enum(['ENVIO', 'RETIRO_SUCURSAL', 'TIENDA']),
  scheduledDate: z.coerce.date().optional(),
  notes: z.string().optional(),
})

// ─────────────────────────────────────────────
// Update delivery
// ─────────────────────────────────────────────

export const updateDeliverySchema = z.object({
  carrierName: z.string().optional(),
  trackingNumber: z.string().optional(),
  scheduledDate: z.coerce.date().optional(),
  notes: z.string().optional(),
})

// ─────────────────────────────────────────────
// Ship delivery
// ─────────────────────────────────────────────

export const shipDeliverySchema = z.object({
  carrierName: z.string().min(1, 'Carrier name is required'),
  trackingNumber: z.string().min(1, 'Tracking number is required'),
})

// ─────────────────────────────────────────────
// Confirm delivery
// ─────────────────────────────────────────────

export const confirmDeliverySchema = z.object({
  receivedByName: z.string().min(1, 'Receiver name is required'),
  signatureUrl: z.string().url().optional(),
  photoUrl: z.string().url().optional(),
})

// ─────────────────────────────────────────────
// List filters
// ─────────────────────────────────────────────

export const listDeliveriesSchema = z.object({
  status: z.enum(['PENDING', 'IN_TRANSIT', 'DELIVERED', 'FAILED']).optional(),
  deliveryType: z.enum(['ENVIO', 'RETIRO_SUCURSAL', 'TIENDA']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// ─────────────────────────────────────────────
// Type exports
// ─────────────────────────────────────────────

export type DeliveryParams = z.infer<typeof deliveryParamsSchema>
export type DeliveryWorkOrderParams = z.infer<typeof deliveryWorkOrderParamsSchema>
export type CreateDelivery = z.infer<typeof createDeliverySchema>
export type UpdateDelivery = z.infer<typeof updateDeliverySchema>
export type ShipDelivery = z.infer<typeof shipDeliverySchema>
export type ConfirmDelivery = z.infer<typeof confirmDeliverySchema>
export type ListDeliveriesFilters = z.infer<typeof listDeliveriesSchema>
