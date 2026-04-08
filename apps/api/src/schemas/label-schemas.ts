import { z } from 'zod'

// ─────────────────────────────────────────────
// Params
// ─────────────────────────────────────────────

export const labelWorkOrderParamsSchema = z.object({
  workOrderId: z.string().min(1, 'Work order ID is required'),
})

export const labelLineParamsSchema = z.object({
  lineId: z.string().min(1, 'Work order line ID is required'),
})

export const labelIdParamsSchema = z.object({
  id: z.string().min(1, 'Label ID is required'),
})

// ─────────────────────────────────────────────
// Type exports
// ─────────────────────────────────────────────

export type LabelWorkOrderParams = z.infer<typeof labelWorkOrderParamsSchema>
export type LabelLineParams = z.infer<typeof labelLineParamsSchema>
export type LabelIdParams = z.infer<typeof labelIdParamsSchema>
