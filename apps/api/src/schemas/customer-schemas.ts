import { z } from 'zod'

export const customerParamsSchema = z.object({
  id: z.string().min(1, 'Customer ID is required'),
})

export const phoneParamsSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
})

export const customerFiltersSchema = z.object({
  search: z.string().optional(),
  preferredSport: z.enum(['CYCLING', 'RUNNING', 'TRIATHLON', 'SWIMMING', 'GENERAL', 'OTHER']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const createCustomerSchema = z.object({
  whatsappPhone: z.string().min(1, 'WhatsApp phone is required'),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().optional(),
  province: z.string().max(100).optional(),
  canton: z.string().max(100).optional(),
  preferredSport: z.enum(['CYCLING', 'RUNNING', 'TRIATHLON', 'SWIMMING', 'GENERAL', 'OTHER']).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const updateCustomerSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().nullable().optional(),
  province: z.string().max(100).nullable().optional(),
  canton: z.string().max(100).nullable().optional(),
  preferredSport: z.enum(['CYCLING', 'RUNNING', 'TRIATHLON', 'SWIMMING', 'GENERAL', 'OTHER']).nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  deliveryAddresses: z.any().optional(),
})

export type CustomerParams = z.infer<typeof customerParamsSchema>
export type PhoneParams = z.infer<typeof phoneParamsSchema>
export type CustomerFilters = z.infer<typeof customerFiltersSchema>
export type CreateCustomer = z.infer<typeof createCustomerSchema>
export type UpdateCustomer = z.infer<typeof updateCustomerSchema>
