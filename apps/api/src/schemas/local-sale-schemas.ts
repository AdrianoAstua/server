import { z } from 'zod'

export const createLocalSaleSchema = z.object({
  items: z.array(z.object({
    variantId: z.string().min(1, 'Variant ID is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  })).min(1, 'At least one item is required'),
  paymentMethod: z.enum(['CASH', 'CARD', 'SINPE', 'TRANSFER', 'MIXED']),
  locationId: z.string().optional(),
  customerId: z.string().optional(),
  discountCents: z.number().int().min(0, 'Discount cannot be negative').optional(),
  notes: z.string().optional(),
})

export const localSaleFiltersSchema = z.object({
  date: z.coerce.date().optional(),
  soldById: z.string().optional(),
  paymentMethod: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const localSaleParamsSchema = z.object({
  id: z.string().min(1, 'Sale ID is required'),
})

export const voidSaleSchema = z.object({
  reason: z.string().min(1, 'Void reason is required'),
})

export const dailySummaryQuerySchema = z.object({
  date: z.coerce.date().optional(),
  locationId: z.string().min(1, 'Location ID is required'),
})

export type CreateLocalSale = z.infer<typeof createLocalSaleSchema>
export type LocalSaleFilters = z.infer<typeof localSaleFiltersSchema>
export type LocalSaleParams = z.infer<typeof localSaleParamsSchema>
export type VoidSale = z.infer<typeof voidSaleSchema>
export type DailySummaryQuery = z.infer<typeof dailySummaryQuerySchema>
