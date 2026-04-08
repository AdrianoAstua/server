import { z } from 'zod'

export const createIncidentSchema = z.object({
  workOrderId: z.string().min(1, 'Work order ID is required'),
  workOrderLineId: z.string().optional(),
  type: z.enum([
    'CLIENT_FILE_ERROR', 'DESIGN_ERROR', 'PRINT_DEFECT', 'CUT_ERROR',
    'ASSEMBLY_DEFECT', 'MATERIAL_DEFECT', 'MACHINE_FAILURE', 'PACKAGING_ERROR',
    'DELIVERY_ERROR', 'OTHER',
  ]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  responsibility: z.enum(['CLIENT', 'VONEB', 'SUPPLIER', 'MACHINE']),
  description: z.string().min(1, 'Description is required'),
  photos: z.array(z.string()).default([]),
  costEstimatedCents: z.number().int().min(0).default(0),
  reportedById: z.string().min(1, 'Reporter ID is required'),
})

export const incidentParamsSchema = z.object({
  id: z.string().min(1, 'Incident ID is required'),
})

export const resolveIncidentSchema = z.object({
  resolution: z.enum([
    'FULL_REWORK', 'PARTIAL_REWORK', 'NEW_ORDER', 'DISCOUNT', 'TOTAL_LOSS', 'NO_ACTION',
  ]),
  costRealCents: z.number().int().min(0),
  userId: z.string().min(1, 'User ID is required'),
  notes: z.string().optional(),
})

export const incidentFiltersSchema = z.object({
  type: z.enum([
    'CLIENT_FILE_ERROR', 'DESIGN_ERROR', 'PRINT_DEFECT', 'CUT_ERROR',
    'ASSEMBLY_DEFECT', 'MATERIAL_DEFECT', 'MACHINE_FAILURE', 'PACKAGING_ERROR',
    'DELIVERY_ERROR', 'OTHER',
  ]).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED']).optional(),
  workOrderId: z.string().optional(),
  responsibility: z.enum(['CLIENT', 'VONEB', 'SUPPLIER', 'MACHINE']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const incidentStatsQuerySchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})

export type CreateIncident = z.infer<typeof createIncidentSchema>
export type IncidentParams = z.infer<typeof incidentParamsSchema>
export type ResolveIncident = z.infer<typeof resolveIncidentSchema>
export type IncidentFilters = z.infer<typeof incidentFiltersSchema>
export type IncidentStatsQuery = z.infer<typeof incidentStatsQuerySchema>
