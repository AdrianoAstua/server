import { z } from 'zod'

export const configKeyParamsSchema = z.object({
  key: z.string().min(1, 'Config key is required').max(100),
})

export const updateConfigSchema = z.object({
  value: z.unknown(),
  description: z.string().max(500).optional(),
})

export type ConfigKeyParams = z.infer<typeof configKeyParamsSchema>
export type UpdateConfig = z.infer<typeof updateConfigSchema>
