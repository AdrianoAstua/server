import { z } from 'zod'

// ─────────────────────────────────────────────
// Params
// ─────────────────────────────────────────────

export const workOrderParamsSchema = z.object({
  id: z.string().min(1, 'Work order ID is required'),
})

export const workOrderBarcodeParamsSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required'),
})

// ─────────────────────────────────────────────
// Create
// ─────────────────────────────────────────────

export const createWorkOrderSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  lines: z.array(z.object({
    productType: z.string().min(1, 'Product type is required'),
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    unitPriceCents: z.number().int().min(0, 'Unit price must be >= 0'),
    specifications: z.any().optional(),
  })).min(1, 'At least one line is required'),
  source: z.enum(['WHATSAPP', 'WEB', 'ADMIN', 'SHOPIFY']).default('ADMIN'),
  deliveryType: z.enum(['ENVIO', 'RETIRO_SUCURSAL', 'TIENDA']).default('RETIRO_SUCURSAL'),
  customerNotes: z.string().optional(),
  internalNotes: z.string().optional(),
  priority: z.enum(['BAJA', 'NORMAL', 'ALTA', 'URGENTE']).default('NORMAL'),
})

// ─────────────────────────────────────────────
// Update status
// ─────────────────────────────────────────────

export const updateWorkOrderStatusSchema = z.object({
  status: z.enum([
    'BORRADOR', 'PENDIENTE_VALIDACION', 'ARCHIVOS_VALIDADOS', 'PENDIENTE_PAGO',
    'ORDEN_CONFIRMADA', 'EN_COLA_DISENO', 'EN_DISENO', 'DISENO_EN_REVISION',
    'ESPERANDO_APROBACION_CLIENTE', 'APROBADO_PARA_PRODUCCION',
    'EN_IMPRESION', 'EN_CORTE', 'EN_ARMADO', 'EN_CONTROL_CALIDAD',
    'QC_RECHAZADO', 'EN_REPROCESO', 'EMPACADO', 'LISTO_PARA_ENTREGA',
    'EN_TRANSITO', 'ENTREGADO', 'CERRADO', 'CANCELADO',
  ]),
  notes: z.string().optional(),
})

// ─────────────────────────────────────────────
// List / filters
// ─────────────────────────────────────────────

export const listWorkOrdersSchema = z.object({
  status: z.enum([
    'BORRADOR', 'PENDIENTE_VALIDACION', 'ARCHIVOS_VALIDADOS', 'PENDIENTE_PAGO',
    'ORDEN_CONFIRMADA', 'EN_COLA_DISENO', 'EN_DISENO', 'DISENO_EN_REVISION',
    'ESPERANDO_APROBACION_CLIENTE', 'APROBADO_PARA_PRODUCCION',
    'EN_IMPRESION', 'EN_CORTE', 'EN_ARMADO', 'EN_CONTROL_CALIDAD',
    'QC_RECHAZADO', 'EN_REPROCESO', 'EMPACADO', 'LISTO_PARA_ENTREGA',
    'EN_TRANSITO', 'ENTREGADO', 'CERRADO', 'CANCELADO',
  ]).optional(),
  priority: z.enum(['BAJA', 'NORMAL', 'ALTA', 'URGENTE']).optional(),
  customerId: z.string().optional(),
  assignedDesignerId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// ─────────────────────────────────────────────
// Assign designer
// ─────────────────────────────────────────────

export const assignDesignerSchema = z.object({
  designerId: z.string().min(1, 'Designer ID is required'),
})

// ─────────────────────────────────────────────
// Cancel
// ─────────────────────────────────────────────

export const cancelWorkOrderSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required'),
})

// ─────────────────────────────────────────────
// Type exports
// ─────────────────────────────────────────────

export type WorkOrderParams = z.infer<typeof workOrderParamsSchema>
export type WorkOrderBarcodeParams = z.infer<typeof workOrderBarcodeParamsSchema>
export type CreateWorkOrder = z.infer<typeof createWorkOrderSchema>
export type UpdateWorkOrderStatus = z.infer<typeof updateWorkOrderStatusSchema>
export type ListWorkOrdersFilters = z.infer<typeof listWorkOrdersSchema>
export type AssignDesigner = z.infer<typeof assignDesignerSchema>
export type CancelWorkOrder = z.infer<typeof cancelWorkOrderSchema>
