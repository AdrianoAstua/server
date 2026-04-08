import { z } from 'zod'

// ─────────────────────────────────────────────
// Params
// ─────────────────────────────────────────────

export const designWorkOrderParamsSchema = z.object({
  workOrderId: z.string().min(1, 'Work order ID is required'),
})

export const designFileParamsSchema = z.object({
  fileId: z.string().min(1, 'Design file ID is required'),
})

export const approvalTokenParamsSchema = z.object({
  token: z.string().min(1, 'Approval token is required'),
})

// ─────────────────────────────────────────────
// Upload design file
// ─────────────────────────────────────────────

export const uploadDesignFileSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileUrl: z.string().url('File URL must be a valid URL'),
  fileSizeBytes: z.number().int().min(1, 'File size must be > 0'),
  mimeType: z.string().min(1, 'MIME type is required'),
  dpiX: z.number().int().min(1).optional(),
  dpiY: z.number().int().min(1).optional(),
  width: z.number().int().min(1).optional(),
  height: z.number().int().min(1).optional(),
  isClientFile: z.boolean().default(true),
})

// ─────────────────────────────────────────────
// Request approval
// ─────────────────────────────────────────────

export const requestApprovalSchema = z.object({
  designFileId: z.string().min(1, 'Design file ID is required'),
})

// ─────────────────────────────────────────────
// Record approval (public)
// ─────────────────────────────────────────────

export const recordApprovalSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'REVISION_REQUESTED']),
  clientComments: z.string().optional(),
})

// ─────────────────────────────────────────────
// Type exports
// ─────────────────────────────────────────────

export type DesignWorkOrderParams = z.infer<typeof designWorkOrderParamsSchema>
export type DesignFileParams = z.infer<typeof designFileParamsSchema>
export type ApprovalTokenParams = z.infer<typeof approvalTokenParamsSchema>
export type UploadDesignFile = z.infer<typeof uploadDesignFileSchema>
export type RequestApproval = z.infer<typeof requestApprovalSchema>
export type RecordApproval = z.infer<typeof recordApprovalSchema>
