import { z } from 'zod'

export const variantParamsSchema = z.object({
  id: z.string().min(1, 'Variant ID is required'),
})

export const productIdParamsSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
})

export const addVariantSchema = z.object({
  color: z.string().min(1, 'Color is required'),
  colorHex: z.string().optional(),
  size: z.string().min(1, 'Size is required'),
  sizeOrder: z.number().int().min(0),
  stockQuantity: z.number().int().min(0).default(0),
  minStockThreshold: z.number().int().min(0).default(3),
  additionalPriceCents: z.number().int().min(0).default(0),
  weightGrams: z.number().int().min(0).optional(),
  barcode: z.string().optional(),
})

export const updateVariantSchema = z.object({
  color: z.string().min(1).optional(),
  colorHex: z.string().nullable().optional(),
  size: z.string().min(1).optional(),
  sizeOrder: z.number().int().min(0).optional(),
  minStockThreshold: z.number().int().min(0).optional(),
  additionalPriceCents: z.number().int().min(0).optional(),
  weightGrams: z.number().int().min(0).nullable().optional(),
  barcode: z.string().nullable().optional(),
  status: z.enum(['AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED']).optional(),
})

export const updateStockSchema = z.object({
  quantity: z.number().int(),
  reason: z.string().min(1, 'Reason is required'),
})

export const bulkUpdateStockSchema = z.object({
  updates: z.array(z.object({
    variantId: z.string().min(1),
    quantity: z.number().int(),
    reason: z.string().min(1),
  })).min(1, 'At least one update is required'),
})

export const variantSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export type VariantParams = z.infer<typeof variantParamsSchema>
export type ProductIdParams = z.infer<typeof productIdParamsSchema>
export type AddVariant = z.infer<typeof addVariantSchema>
export type UpdateVariant = z.infer<typeof updateVariantSchema>
export type UpdateStock = z.infer<typeof updateStockSchema>
export type BulkUpdateStock = z.infer<typeof bulkUpdateStockSchema>
export type VariantSearch = z.infer<typeof variantSearchSchema>
