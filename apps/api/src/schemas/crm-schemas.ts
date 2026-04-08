import { z } from 'zod'

export const syncLogsQuerySchema = z.object({
  status: z.enum(['SUCCESS', 'FAILED', 'PENDING', 'RETRYING']).optional(),
  entityType: z.enum(['DEAL', 'PERSON', 'STAGE']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type SyncLogsQuery = z.infer<typeof syncLogsQuerySchema>
