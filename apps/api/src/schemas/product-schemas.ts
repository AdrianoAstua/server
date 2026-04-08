import { z } from 'zod'

export const productParamsSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
})

export const productFiltersSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'UNISEX']).optional(),
  sport: z.enum(['CYCLING', 'RUNNING', 'TRIATHLON', 'SWIMMING', 'GENERAL', 'OTHER']).optional(),
  status: z.enum(['ACTIVE', 'DRAFT', 'DISCONTINUED']).optional(),
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().min(0).optional(),
  season: z.string().optional(),
  tags: z.string().optional(),
  hasStock: z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
  newArrival: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'price', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  slug: z.string().min(1).max(200),
  descriptionShort: z.string().max(500).optional(),
  descriptionLong: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  basePriceCents: z.number().int().min(0, 'Price must be positive'),
  costPriceCents: z.number().int().min(0).optional(),
  currency: z.string().default('CRC'),
  brand: z.string().default('V ONE B'),
  supplier: z.string().optional(),
  season: z.string().optional(),
  images: z.array(z.string().url()).default([]),
  tags: z.array(z.string()).default([]),
  gender: z.enum(['MALE', 'FEMALE', 'UNISEX']).default('UNISEX'),
  sport: z.enum(['CYCLING', 'RUNNING', 'TRIATHLON', 'SWIMMING', 'GENERAL', 'OTHER']).default('GENERAL'),
  materialInfo: z.string().optional(),
  careInstructions: z.string().optional(),
  status: z.enum(['ACTIVE', 'DRAFT', 'DISCONTINUED']).default('DRAFT'),
  featured: z.boolean().default(false),
  newArrival: z.boolean().default(false),
  variants: z.array(z.object({
    color: z.string().min(1),
    colorHex: z.string().optional(),
    size: z.string().min(1),
    sizeOrder: z.number().int().min(0),
    stockQuantity: z.number().int().min(0).default(0),
    minStockThreshold: z.number().int().min(0).default(3),
    additionalPriceCents: z.number().int().min(0).default(0),
    weightGrams: z.number().int().min(0).optional(),
    barcode: z.string().optional(),
  })).min(1, 'At least one variant is required'),
})

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).optional(),
  descriptionShort: z.string().max(500).nullable().optional(),
  descriptionLong: z.string().nullable().optional(),
  categoryId: z.string().optional(),
  basePriceCents: z.number().int().min(0).optional(),
  costPriceCents: z.number().int().min(0).nullable().optional(),
  currency: z.string().optional(),
  brand: z.string().optional(),
  supplier: z.string().nullable().optional(),
  season: z.string().nullable().optional(),
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'UNISEX']).optional(),
  sport: z.enum(['CYCLING', 'RUNNING', 'TRIATHLON', 'SWIMMING', 'GENERAL', 'OTHER']).optional(),
  materialInfo: z.string().nullable().optional(),
  careInstructions: z.string().nullable().optional(),
  status: z.enum(['ACTIVE', 'DRAFT', 'DISCONTINUED']).optional(),
  featured: z.boolean().optional(),
  newArrival: z.boolean().optional(),
})

export type ProductParams = z.infer<typeof productParamsSchema>
export type ProductFilters = z.infer<typeof productFiltersSchema>
export type CreateProduct = z.infer<typeof createProductSchema>
export type UpdateProduct = z.infer<typeof updateProductSchema>
