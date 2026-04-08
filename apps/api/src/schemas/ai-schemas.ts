import { z } from 'zod'

// ─────────────────────────────────────────────
// Schemas de validacion para endpoints AI
// ─────────────────────────────────────────────

// Params
export const consultationParamsSchema = z.object({
  id: z.string().min(1, 'Consultation ID is required'),
})

// Query: acciones recientes (paginado)
export const aiActionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// Body: responder consulta
export const respondConsultationSchema = z.object({
  response: z.string().min(1, 'Response is required'),
})

// Body: analisis manual
export const triggerAnalysisSchema = z.object({
  type: z.enum(['patterns', 'predictions', 'full']).default('full'),
})

// Type exports
export type ConsultationParams = z.infer<typeof consultationParamsSchema>
export type AIActionsQuery = z.infer<typeof aiActionsQuerySchema>
export type RespondConsultation = z.infer<typeof respondConsultationSchema>
export type TriggerAnalysis = z.infer<typeof triggerAnalysisSchema>
