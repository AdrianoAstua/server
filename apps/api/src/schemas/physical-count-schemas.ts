import { z } from 'zod'

export const startCountSchema = z.object({
  locationId: z.string().min(1, 'Location ID is required'),
  categoryId: z.string().optional(),
  notes: z.string().optional(),
})

export const countItemSchema = z.object({
  variantId: z.string().min(1, 'Variant ID is required'),
  actualQty: z.number().int().min(0, 'Actual quantity cannot be negative'),
})

export const physicalCountParamsSchema = z.object({
  id: z.string().min(1, 'Count ID is required'),
})

export const physicalCountFiltersSchema = z.object({
  locationId: z.string().optional(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type StartCount = z.infer<typeof startCountSchema>
export type CountItem = z.infer<typeof countItemSchema>
export type PhysicalCountParams = z.infer<typeof physicalCountParamsSchema>
export type PhysicalCountFilters = z.infer<typeof physicalCountFiltersSchema>
