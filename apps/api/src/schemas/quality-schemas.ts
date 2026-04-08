import { z } from 'zod'

export const performCheckSchema = z.object({
  workOrderLineId: z.string().min(1, 'Work order line ID is required'),
  inspectorId: z.string().min(1, 'Inspector ID is required'),
  result: z.enum(['PASSED', 'FAILED', 'PASSED_WITH_OBSERVATIONS']),
  checklistData: z.array(z.object({
    item: z.string().min(1),
    passed: z.boolean(),
    notes: z.string().optional(),
  })).min(1, 'At least one checklist item is required'),
  photos: z.array(z.string()).default([]),
  notes: z.string().optional(),
})

export const qcLineParamsSchema = z.object({
  workOrderLineId: z.string().min(1, 'Work order line ID is required'),
})

export const qcStatsQuerySchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})

export type PerformCheck = z.infer<typeof performCheckSchema>
export type QCLineParams = z.infer<typeof qcLineParamsSchema>
export type QCStatsQuery = z.infer<typeof qcStatsQuerySchema>
