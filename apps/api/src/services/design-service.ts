import crypto from 'node:crypto'
import { getDatabase } from '@voneb/database'
import { NotFoundError, ValidationError } from '../lib/errors.js'
import { ACCEPTED_DESIGN_FORMATS, MIN_PRINT_DPI } from '@voneb/shared'

const PUBLIC_BASE_URL = 'https://voneb.autovoid.tech'

interface UploadDesignFileData {
  fileName: string
  fileUrl: string
  fileSizeBytes: number
  mimeType: string
  dpiX?: number
  dpiY?: number
  width?: number
  height?: number
  isClientFile: boolean
}

export async function uploadDesignFile(
  workOrderId: string,
  fileData: UploadDesignFileData,
  userId: string,
) {
  const db = getDatabase()

  const workOrder = await db.workOrder.findUnique({ where: { id: workOrderId } })
  if (!workOrder) throw new NotFoundError('Work order not found')

  // Auto-validate format
  const acceptedFormats = ACCEPTED_DESIGN_FORMATS as readonly string[]
  const formatValid = acceptedFormats.includes(fileData.mimeType)

  // Determine validation status
  let validationStatus: 'PENDING_VALIDATION' | 'VALIDATED' | 'REJECTED' = 'PENDING_VALIDATION'
  let validationErrors: string[] | null = null

  if (!formatValid) {
    validationStatus = 'REJECTED'
    validationErrors = [`Formato no aceptado: ${fileData.mimeType}. Formatos validos: ${acceptedFormats.join(', ')}`]
  } else if (fileData.isClientFile && fileData.dpiX && fileData.dpiX < MIN_PRINT_DPI) {
    validationStatus = 'REJECTED'
    validationErrors = [`DPI insuficiente: ${fileData.dpiX}dpi. Minimo requerido: ${MIN_PRINT_DPI}dpi`]
  } else if (fileData.isClientFile && fileData.dpiY && fileData.dpiY < MIN_PRINT_DPI) {
    validationStatus = 'REJECTED'
    validationErrors = [`DPI vertical insuficiente: ${fileData.dpiY}dpi. Minimo requerido: ${MIN_PRINT_DPI}dpi`]
  }

  // Determine version number
  const latestFile = await db.designFile.findFirst({
    where: { workOrderId },
    orderBy: { version: 'desc' },
    select: { version: true },
  })
  const version = (latestFile?.version ?? 0) + 1

  const designFile = await db.designFile.create({
    data: {
      workOrderId,
      version,
      fileName: fileData.fileName,
      fileUrl: fileData.fileUrl,
      fileSizeBytes: fileData.fileSizeBytes,
      mimeType: fileData.mimeType,
      dpiX: fileData.dpiX ?? null,
      dpiY: fileData.dpiY ?? null,
      width: fileData.width ?? null,
      height: fileData.height ?? null,
      validationStatus,
      validationErrors: validationErrors ? JSON.stringify(validationErrors) : undefined,
      isClientFile: fileData.isClientFile,
      uploadedById: userId,
    },
    include: {
      uploadedBy: { select: { id: true, name: true } },
    },
  })

  return designFile
}

export async function validateDesignFile(fileId: string) {
  const db = getDatabase()

  const file = await db.designFile.findUnique({ where: { id: fileId } })
  if (!file) throw new NotFoundError('Design file not found')

  const acceptedFormats = ACCEPTED_DESIGN_FORMATS as readonly string[]
  const errors: string[] = []

  if (!acceptedFormats.includes(file.mimeType)) {
    errors.push(`Formato no aceptado: ${file.mimeType}`)
  }

  if (file.isClientFile) {
    if (file.dpiX && file.dpiX < MIN_PRINT_DPI) {
      errors.push(`DPI horizontal insuficiente: ${file.dpiX}dpi (minimo ${MIN_PRINT_DPI}dpi)`)
    }
    if (file.dpiY && file.dpiY < MIN_PRINT_DPI) {
      errors.push(`DPI vertical insuficiente: ${file.dpiY}dpi (minimo ${MIN_PRINT_DPI}dpi)`)
    }
  }

  const validationStatus = errors.length > 0 ? 'REJECTED' : 'VALIDATED'

  return db.designFile.update({
    where: { id: fileId },
    data: {
      validationStatus,
      validationErrors: errors.length > 0 ? JSON.stringify(errors) : undefined,
      validatedAt: new Date(),
    },
    include: {
      uploadedBy: { select: { id: true, name: true } },
    },
  })
}

export async function listDesignFiles(workOrderId: string) {
  const db = getDatabase()

  const workOrder = await db.workOrder.findUnique({ where: { id: workOrderId } })
  if (!workOrder) throw new NotFoundError('Work order not found')

  return db.designFile.findMany({
    where: { workOrderId },
    orderBy: { version: 'desc' },
    include: {
      uploadedBy: { select: { id: true, name: true } },
      approvals: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, status: true, createdAt: true },
      },
    },
  })
}

export async function requestApproval(
  workOrderId: string,
  designFileId: string,
  userId: string,
) {
  const db = getDatabase()

  const workOrder = await db.workOrder.findUnique({ where: { id: workOrderId } })
  if (!workOrder) throw new NotFoundError('Work order not found')

  const designFile = await db.designFile.findUnique({ where: { id: designFileId } })
  if (!designFile) throw new NotFoundError('Design file not found')
  if (designFile.workOrderId !== workOrderId) {
    throw new ValidationError('Design file does not belong to this work order')
  }
  if (designFile.validationStatus === 'REJECTED') {
    throw new ValidationError('Cannot request approval for a rejected design file')
  }

  // Count previous iterations for this work order
  const previousApprovals = await db.designApproval.count({
    where: { workOrderId },
  })
  const iteration = previousApprovals + 1

  const approvalToken = crypto.randomUUID()
  const approvalUrl = `${PUBLIC_BASE_URL}/approval/${approvalToken}`

  // Set expiration to 7 days from now
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const approval = await db.designApproval.create({
    data: {
      workOrderId,
      designFileId,
      iteration,
      status: 'PENDING',
      approvalToken,
      expiresAt,
    },
    include: {
      designFile: { select: { id: true, fileName: true, fileUrl: true, version: true } },
    },
  })

  return {
    approval,
    approvalToken,
    approvalUrl,
  }
}

export async function recordApproval(
  token: string,
  status: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED',
  clientComments?: string,
) {
  const db = getDatabase()

  const approval = await db.designApproval.findUnique({
    where: { approvalToken: token },
    include: {
      workOrder: { select: { id: true, status: true } },
    },
  })

  if (!approval) throw new NotFoundError('Approval not found or invalid token')

  if (approval.status !== 'PENDING') {
    throw new ValidationError('This approval has already been processed')
  }

  if (approval.expiresAt && approval.expiresAt < new Date()) {
    throw new ValidationError('This approval link has expired')
  }

  const updated = await db.designApproval.update({
    where: { id: approval.id },
    data: {
      status,
      clientComments: clientComments ?? null,
      reviewedAt: new Date(),
    },
    include: {
      designFile: { select: { id: true, fileName: true, fileUrl: true, version: true } },
      workOrder: {
        select: {
          id: true,
          workOrderNumber: true,
          status: true,
          customer: { select: { firstName: true, lastName: true } },
        },
      },
    },
  })

  return updated
}

export async function getApprovalByToken(token: string) {
  const db = getDatabase()

  const approval = await db.designApproval.findUnique({
    where: { approvalToken: token },
    include: {
      designFile: {
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
          version: true,
          mimeType: true,
          width: true,
          height: true,
        },
      },
      workOrder: {
        select: {
          id: true,
          workOrderNumber: true,
          customer: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
  })

  if (!approval) throw new NotFoundError('Approval not found or invalid token')

  const isExpired = approval.expiresAt ? approval.expiresAt < new Date() : false

  return {
    id: approval.id,
    status: approval.status,
    iteration: approval.iteration,
    clientComments: approval.clientComments,
    reviewedAt: approval.reviewedAt,
    isExpired,
    createdAt: approval.createdAt,
    designFile: approval.designFile,
    workOrder: {
      workOrderNumber: approval.workOrder.workOrderNumber,
      customerName: `${approval.workOrder.customer.firstName} ${approval.workOrder.customer.lastName}`,
    },
  }
}
