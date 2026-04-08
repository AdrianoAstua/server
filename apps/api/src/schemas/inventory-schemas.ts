import { z } from 'zod'

export const movementFiltersSchema = z.object({
  type: z.enum(['ENTRY', 'EXIT', 'ADJUSTMENT', 'RETURN', 'TRANSFER', 'TRANSFER_OUT', 'TRANSFER_IN', 'SALE_LOCAL', 'SALE_ONLINE', 'PHYSICAL_COUNT']).optional(),
  variantId: z.string().optional(),
  locationId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  performedById: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const registerEntrySchema = z.object({
  entries: z.array(z.object({
    variantId: z.string().min(1),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    notes: z.string().optional(),
  })).min(1, 'At least one entry is required'),
  reason: z.string().min(1, 'Reason is required'),
  referenceType: z.enum(['MANUAL', 'IMPORT', 'RETURN']).default('MANUAL'),
  referenceId: z.string().optional(),
  locationId: z.string().optional(),
})

export const registerAdjustmentSchema = z.object({
  variantId: z.string().min(1, 'Variant ID is required'),
  quantity: z.number().int(),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
  locationId: z.string().optional(),
})

export type MovementFilters = z.infer<typeof movementFiltersSchema>
export type RegisterEntry = z.infer<typeof registerEntrySchema>
export type RegisterAdjustment = z.infer<typeof registerAdjustmentSchema>
