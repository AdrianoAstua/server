import { z } from 'zod'

export const barcodeLookupSchema = z.object({
  code: z.string().min(1, 'Barcode is required'),
})

export const generateBarcodeSchema = z.object({
  variantId: z.string().min(1, 'Variant ID is required'),
})

export const generateLabelsSchema = z.object({
  variantIds: z.array(z.string().min(1)).min(1, 'At least one variant ID is required'),
  format: z.enum(['small', 'medium', 'large']).default('medium'),
})

export const assignBarcodeSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required'),
  barcodeFormat: z.string().optional(),
})

export type BarcodeLookup = z.infer<typeof barcodeLookupSchema>
export type GenerateBarcode = z.infer<typeof generateBarcodeSchema>
export type GenerateLabels = z.infer<typeof generateLabelsSchema>
export type AssignBarcode = z.infer<typeof assignBarcodeSchema>
