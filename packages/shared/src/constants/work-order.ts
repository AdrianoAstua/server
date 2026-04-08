// ─────────────────────────────────────────────
// WORK ORDER (PAPELETA) — State Machine & Rules
// ─────────────────────────────────────────────

export const WORK_ORDER_NUMBER_PREFIX = 'VB'

/** All 23 states of a work order */
export const WorkOrderStatus = {
  BORRADOR: 'BORRADOR',
  PENDIENTE_VALIDACION: 'PENDIENTE_VALIDACION',
  ARCHIVOS_VALIDADOS: 'ARCHIVOS_VALIDADOS',
  PENDIENTE_PAGO: 'PENDIENTE_PAGO',
  ORDEN_CONFIRMADA: 'ORDEN_CONFIRMADA',
  EN_COLA_DISENO: 'EN_COLA_DISENO',
  EN_DISENO: 'EN_DISENO',
  DISENO_EN_REVISION: 'DISENO_EN_REVISION',
  ESPERANDO_APROBACION_CLIENTE: 'ESPERANDO_APROBACION_CLIENTE',
  APROBADO_PARA_PRODUCCION: 'APROBADO_PARA_PRODUCCION',
  EN_IMPRESION: 'EN_IMPRESION',
  EN_CORTE: 'EN_CORTE',
  EN_ARMADO: 'EN_ARMADO',
  EN_CONTROL_CALIDAD: 'EN_CONTROL_CALIDAD',
  QC_RECHAZADO: 'QC_RECHAZADO',
  EN_REPROCESO: 'EN_REPROCESO',
  EMPACADO: 'EMPACADO',
  LISTO_PARA_ENTREGA: 'LISTO_PARA_ENTREGA',
  EN_TRANSITO: 'EN_TRANSITO',
  ENTREGADO: 'ENTREGADO',
  CERRADO: 'CERRADO',
  CANCELADO: 'CANCELADO',
} as const
export type WorkOrderStatus = (typeof WorkOrderStatus)[keyof typeof WorkOrderStatus]

/** Valid state transitions — the state machine */
export const VALID_WORK_ORDER_TRANSITIONS: Record<string, string[]> = {
  BORRADOR: ['PENDIENTE_VALIDACION', 'CANCELADO'],
  PENDIENTE_VALIDACION: ['ARCHIVOS_VALIDADOS', 'BORRADOR', 'CANCELADO'],
  ARCHIVOS_VALIDADOS: ['PENDIENTE_PAGO', 'CANCELADO'],
  PENDIENTE_PAGO: ['ORDEN_CONFIRMADA', 'CANCELADO'],
  ORDEN_CONFIRMADA: ['EN_COLA_DISENO', 'CANCELADO'],
  EN_COLA_DISENO: ['EN_DISENO', 'CANCELADO'],
  EN_DISENO: ['DISENO_EN_REVISION', 'CANCELADO'],
  DISENO_EN_REVISION: ['ESPERANDO_APROBACION_CLIENTE', 'EN_DISENO', 'CANCELADO'],
  ESPERANDO_APROBACION_CLIENTE: ['APROBADO_PARA_PRODUCCION', 'EN_DISENO', 'CANCELADO'],
  APROBADO_PARA_PRODUCCION: ['EN_IMPRESION', 'CANCELADO'],
  EN_IMPRESION: ['EN_CORTE', 'EN_CONTROL_CALIDAD', 'CANCELADO'],
  EN_CORTE: ['EN_ARMADO', 'EN_CONTROL_CALIDAD', 'CANCELADO'],
  EN_ARMADO: ['EN_CONTROL_CALIDAD', 'CANCELADO'],
  EN_CONTROL_CALIDAD: ['EMPACADO', 'QC_RECHAZADO'],
  QC_RECHAZADO: ['EN_REPROCESO', 'CANCELADO'],
  EN_REPROCESO: ['EN_IMPRESION', 'EN_CORTE', 'EN_ARMADO', 'CANCELADO'],
  EMPACADO: ['LISTO_PARA_ENTREGA'],
  LISTO_PARA_ENTREGA: ['EN_TRANSITO', 'ENTREGADO'],
  EN_TRANSITO: ['ENTREGADO'],
  ENTREGADO: ['CERRADO'],
  CERRADO: [],
  CANCELADO: [],
}

/** States that require admin approval for cancellation */
export const PRODUCTION_STATES: string[] = [
  'APROBADO_PARA_PRODUCCION', 'EN_IMPRESION', 'EN_CORTE', 'EN_ARMADO',
  'EN_CONTROL_CALIDAD', 'EMPACADO', 'LISTO_PARA_ENTREGA',
]

/** Spanish labels for all states */
export const WORK_ORDER_STATUS_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  PENDIENTE_VALIDACION: 'Pendiente validacion',
  ARCHIVOS_VALIDADOS: 'Archivos validados',
  PENDIENTE_PAGO: 'Pendiente de pago',
  ORDEN_CONFIRMADA: 'Orden confirmada',
  EN_COLA_DISENO: 'En cola de diseno',
  EN_DISENO: 'En diseno',
  DISENO_EN_REVISION: 'Diseno en revision',
  ESPERANDO_APROBACION_CLIENTE: 'Esperando aprobacion del cliente',
  APROBADO_PARA_PRODUCCION: 'Aprobado para produccion',
  EN_IMPRESION: 'En impresion',
  EN_CORTE: 'En corte',
  EN_ARMADO: 'En armado',
  EN_CONTROL_CALIDAD: 'En control de calidad',
  QC_RECHAZADO: 'Rechazado en CC',
  EN_REPROCESO: 'En reproceso',
  EMPACADO: 'Empacado',
  LISTO_PARA_ENTREGA: 'Listo para entrega',
  EN_TRANSITO: 'En transito',
  ENTREGADO: 'Entregado',
  CERRADO: 'Cerrado',
  CANCELADO: 'Cancelado',
}

/** Status color mapping for UI */
export const WORK_ORDER_STATUS_COLORS: Record<string, string> = {
  BORRADOR: '#6B7280',           // gray
  PENDIENTE_VALIDACION: '#F59E0B', // amber
  ARCHIVOS_VALIDADOS: '#3B82F6',  // blue
  PENDIENTE_PAGO: '#F59E0B',     // amber
  ORDEN_CONFIRMADA: '#10B981',   // emerald
  EN_COLA_DISENO: '#8B5CF6',     // violet
  EN_DISENO: '#8B5CF6',          // violet
  DISENO_EN_REVISION: '#EC4899', // pink
  ESPERANDO_APROBACION_CLIENTE: '#F97316', // orange
  APROBADO_PARA_PRODUCCION: '#10B981', // emerald
  EN_IMPRESION: '#06B6D4',       // cyan
  EN_CORTE: '#06B6D4',           // cyan
  EN_ARMADO: '#06B6D4',          // cyan
  EN_CONTROL_CALIDAD: '#EAB308', // yellow
  QC_RECHAZADO: '#EF4444',       // red
  EN_REPROCESO: '#EF4444',       // red
  EMPACADO: '#22C55E',           // green
  LISTO_PARA_ENTREGA: '#22C55E', // green
  EN_TRANSITO: '#3B82F6',        // blue
  ENTREGADO: '#00FF88',          // voneb green
  CERRADO: '#6B7280',            // gray
  CANCELADO: '#991B1B',          // dark red
}

/** Production stations in sequential order */
export const PRODUCTION_STATIONS_ORDER = ['IMPRESION', 'CORTE', 'ARMADO', 'EMPAQUE'] as const

/** Station labels */
export const PRODUCTION_STATION_LABELS: Record<string, string> = {
  IMPRESION: 'Impresion',
  CORTE: 'Corte',
  ARMADO: 'Armado',
  EMPAQUE: 'Empaque',
}

/** Incident types */
export const IncidentType = {
  CLIENT_FILE_ERROR: 'CLIENT_FILE_ERROR',
  DESIGN_ERROR: 'DESIGN_ERROR',
  PRINT_DEFECT: 'PRINT_DEFECT',
  CUT_ERROR: 'CUT_ERROR',
  ASSEMBLY_DEFECT: 'ASSEMBLY_DEFECT',
  MATERIAL_DEFECT: 'MATERIAL_DEFECT',
  MACHINE_FAILURE: 'MACHINE_FAILURE',
  PACKAGING_ERROR: 'PACKAGING_ERROR',
  DELIVERY_ERROR: 'DELIVERY_ERROR',
  OTHER: 'OTHER',
} as const

export const INCIDENT_TYPE_LABELS: Record<string, string> = {
  CLIENT_FILE_ERROR: 'Error de archivo del cliente',
  DESIGN_ERROR: 'Error de diseno',
  PRINT_DEFECT: 'Defecto de impresion',
  CUT_ERROR: 'Error de corte',
  ASSEMBLY_DEFECT: 'Defecto de armado',
  MATERIAL_DEFECT: 'Material defectuoso',
  MACHINE_FAILURE: 'Falla de maquina',
  PACKAGING_ERROR: 'Error de empaque',
  DELIVERY_ERROR: 'Error de entrega',
  OTHER: 'Otro',
}

/** States that notify the client via WhatsApp */
export const CLIENT_NOTIFICATION_STATES: string[] = [
  'ESPERANDO_APROBACION_CLIENTE',  // "Tu diseno esta listo para revision"
  'APROBADO_PARA_PRODUCCION',      // "Tu pedido entro a produccion"
  'EMPACADO',                       // "Tu pedido esta casi listo"
  'LISTO_PARA_ENTREGA',            // "Tu pedido esta listo para recoger/enviar"
  'EN_TRANSITO',                    // "Tu pedido va en camino"
  'ENTREGADO',                      // "Tu pedido fue entregado"
]

/** Barcode format */
export const BARCODE_FORMAT = {
  INTERNAL: 'CODE128',  // For scanner/pistola
  EXTERNAL: 'QR',       // For client tracking
} as const

/** Accepted file formats for design uploads */
export const ACCEPTED_DESIGN_FORMATS = [
  'image/png', 'image/jpeg', 'image/tiff', 'image/svg+xml',
  'application/pdf', 'application/postscript', // AI files
  'application/illustrator',
] as const

/** Minimum DPI for print-ready files */
export const MIN_PRINT_DPI = 300

/** Default QC checklist items */
export const DEFAULT_QC_CHECKLIST = [
  { item: 'Colores correctos', category: 'visual' },
  { item: 'Alineacion del diseno', category: 'visual' },
  { item: 'Medidas correctas', category: 'dimensional' },
  { item: 'Acabado limpio (sin manchas)', category: 'visual' },
  { item: 'Costuras correctas', category: 'structural' },
  { item: 'Etiqueta presente', category: 'labeling' },
  { item: 'Material sin defectos', category: 'material' },
] as const

/** Label sizes in mm */
export const LABEL_SIZES = {
  PRODUCT: { width: 50, height: 35 },   // Product barcode label
  PACKAGE: { width: 100, height: 70 },  // Package label for kraft bag
} as const
