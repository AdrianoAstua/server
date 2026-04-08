import { z } from 'zod'

export const shopifySyncQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const linkVariantSchema = z.object({
  variantId: z.string().min(1, 'Variant ID is required'),
  shopifyVariantId: z.string().min(1, 'Shopify Variant ID is required'),
  shopifyInventoryItemId: z.string().min(1, 'Shopify Inventory Item ID is required'),
})

export const forceSyncSchema = z.object({
  variantId: z.string().min(1).optional(),
})

export type ShopifySyncQuery = z.infer<typeof shopifySyncQuerySchema>
export type LinkVariant = z.infer<typeof linkVariantSchema>
export type ForceSync = z.infer<typeof forceSyncSchema>
