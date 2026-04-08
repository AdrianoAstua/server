import { z } from 'zod'

export const dashboardQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month', 'year']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

export const topProductsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(5),
  period: z.enum(['today', 'week', 'month', 'year']).optional(),
})

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>
export type TopProductsQuery = z.infer<typeof topProductsQuerySchema>
