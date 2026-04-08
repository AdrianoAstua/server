import { z } from 'zod'

export const scanInSchema = z.object({
  lineBarcode: z.string().min(1, 'Line barcode is required'),
  station: z.enum(['IMPRESION', 'CORTE', 'ARMADO', 'EMPAQUE']),
  operatorId: z.string().min(1, 'Operator ID is required'),
})

export const scanOutSchema = z.object({
  lineBarcode: z.string().min(1, 'Line barcode is required'),
  station: z.enum(['IMPRESION', 'CORTE', 'ARMADO', 'EMPAQUE']),
  operatorId: z.string().min(1, 'Operator ID is required'),
  notes: z.string().optional(),
})

export const stationParamsSchema = z.object({
  station: z.enum(['IMPRESION', 'CORTE', 'ARMADO', 'EMPAQUE']),
})

export const workOrderIdParamsSchema = z.object({
  workOrderId: z.string().min(1, 'Work order ID is required'),
})

export type ScanIn = z.infer<typeof scanInSchema>
export type ScanOut = z.infer<typeof scanOutSchema>
export type StationParams = z.infer<typeof stationParamsSchema>
export type WorkOrderIdParams = z.infer<typeof workOrderIdParamsSchema>
