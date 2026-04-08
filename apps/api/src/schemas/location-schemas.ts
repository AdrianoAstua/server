import { z } from 'zod'

export const locationParamsSchema = z.object({
  id: z.string().min(1, 'Location ID is required'),
})

export const createLocationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  type: z.enum(['LOCAL', 'SHOPIFY', 'WAREHOUSE']).default('LOCAL'),
  address: z.string().optional(),
  isDefault: z.boolean().optional(),
  shopifyLocationId: z.string().optional(),
})

export const updateLocationSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  type: z.enum(['LOCAL', 'SHOPIFY', 'WAREHOUSE']).optional(),
  address: z.string().nullable().optional(),
  isDefault: z.boolean().optional(),
  shopifyLocationId: z.string().nullable().optional(),
})

export const stockMatrixParamsSchema = z.object({
  id: z.string().min(1, 'Variant ID is required'),
})

export const updateLocationStockSchema = z.object({
  quantity: z.number().int('Quantity must be an integer'),
  reason: z.string().min(1, 'Reason is required'),
})

export const locationStockParamsSchema = z.object({
  id: z.string().min(1, 'Variant ID is required'),
  locationId: z.string().min(1, 'Location ID is required'),
})

export const transferStockSchema = z.object({
  variantId: z.string().min(1, 'Variant ID is required'),
  fromLocationId: z.string().min(1, 'Source location ID is required'),
  toLocationId: z.string().min(1, 'Destination location ID is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  reason: z.string().min(1, 'Reason is required'),
})

export const locationStockQuerySchema = z.object({
  locationId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type LocationParams = z.infer<typeof locationParamsSchema>
export type CreateLocation = z.infer<typeof createLocationSchema>
export type UpdateLocation = z.infer<typeof updateLocationSchema>
export type StockMatrixParams = z.infer<typeof stockMatrixParamsSchema>
export type UpdateLocationStock = z.infer<typeof updateLocationStockSchema>
export type LocationStockParams = z.infer<typeof locationStockParamsSchema>
export type TransferStock = z.infer<typeof transferStockSchema>
export type LocationStockQuery = z.infer<typeof locationStockQuerySchema>
