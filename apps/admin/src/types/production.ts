// ─── Work Order Types ────────────────────────────────────────────────────────

export type WorkOrderStatus =
  | 'BORRADOR' | 'PENDIENTE_VALIDACION' | 'ARCHIVOS_VALIDADOS' | 'PENDIENTE_PAGO'
  | 'ORDEN_CONFIRMADA' | 'EN_COLA_DISENO' | 'EN_DISENO' | 'DISENO_EN_REVISION'
  | 'ESPERANDO_APROBACION_CLIENTE' | 'APROBADO_PARA_PRODUCCION'
  | 'EN_IMPRESION' | 'EN_CORTE' | 'EN_ARMADO' | 'EN_CONTROL_CALIDAD'
  | 'QC_RECHAZADO' | 'EN_REPROCESO' | 'EMPACADO' | 'LISTO_PARA_ENTREGA'
  | 'EN_TRANSITO' | 'ENTREGADO' | 'CERRADO' | 'CANCELADO';

export type WorkOrderPriority = 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE';
export type ProductionStation = 'IMPRESION' | 'CORTE' | 'ARMADO' | 'EMPAQUE';
export type DeliveryType = 'ENVIO' | 'RETIRO_SUCURSAL' | 'TIENDA';
export type QCResult = 'PASSED' | 'FAILED' | 'PASSED_WITH_OBSERVATIONS';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
export type IncidentResponsibility = 'CLIENT' | 'VONEB' | 'SUPPLIER' | 'MACHINE';
export type DeliveryStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';

// ─── Work Order ──────────────────────────────────────────────────────────────

export interface WorkOrderLine {
  id: string;
  lineNumber: number;
  barcode: string;
  productType: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  specifications: Record<string, unknown> | null;
  status: WorkOrderStatus;
  currentStation: ProductionStation | null;
}

export interface WorkOrderStatusEntry {
  id: string;
  fromStatus: WorkOrderStatus | null;
  toStatus: WorkOrderStatus;
  changedBy?: { id: string; name: string };
  notes: string | null;
  automatic: boolean;
  createdAt: string;
}

export interface DesignFile {
  id: string;
  version: number;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  mimeType: string;
  dpiX: number | null;
  dpiY: number | null;
  validationStatus: 'PENDING_VALIDATION' | 'VALIDATED' | 'REJECTED';
  validationErrors: unknown | null;
  isClientFile: boolean;
  uploadedBy: { id: string; name: string };
  createdAt: string;
}

export interface DesignApproval {
  id: string;
  designFileId: string;
  iteration: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';
  approvalToken: string;
  clientComments: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface IncidentSummary {
  id: string;
  incidentNumber: string;
  type: string;
  severity: IncidentSeverity;
  responsibility: IncidentResponsibility;
  status: IncidentStatus;
  description: string;
  costEstimatedCents: number;
  costRealCents: number | null;
  resolution: string | null;
  reportedBy: { id: string; name: string };
  createdAt: string;
}

export interface DeliveryRecord {
  id: string;
  deliveryType: DeliveryType;
  status: DeliveryStatus;
  carrierName: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  receivedByName: string | null;
}

export interface WorkOrder {
  id: string;
  workOrderNumber: string;
  barcode: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  source: string;
  deliveryType: DeliveryType;
  totalCents: number;
  currency: string;
  customerNotes: string | null;
  internalNotes: string | null;
  estimatedCompletionDate: string | null;
  actualCompletionDate: string | null;
  cancellationReason: string | null;
  reworkReason: string | null;
  customer: { id: string; firstName: string | null; lastName: string | null; whatsappPhone: string };
  assignedDesigner: { id: string; name: string } | null;
  createdBy: { id: string; name: string };
  lines: WorkOrderLine[];
  designFiles: DesignFile[];
  designApprovals: DesignApproval[];
  statusHistory: WorkOrderStatusEntry[];
  incidents: IncidentSummary[];
  delivery: DeliveryRecord | null;
  parentWorkOrderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderListItem {
  id: string;
  workOrderNumber: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  customer: { firstName: string | null; lastName: string | null; whatsappPhone: string };
  assignedDesigner: { name: string } | null;
  totalCents: number;
  linesCount: number;
  createdAt: string;
}

// ─── Production ──────────────────────────────────────────────────────────────

export interface ProductionLogEntry {
  id: string;
  station: ProductionStation;
  operator: { id: string; name: string };
  scannedInAt: string;
  scannedOutAt: string | null;
  durationSeconds: number | null;
  notes: string | null;
}

export interface StationQueueItem {
  id: string;
  barcode: string;
  productType: string;
  description: string;
  quantity: number;
  status: WorkOrderStatus;
  workOrder: {
    workOrderNumber: string;
    priority: WorkOrderPriority;
    customer: { firstName: string | null; lastName: string | null };
  };
}

export interface WIPDashboard {
  stations: { station: ProductionStation; count: number; avgDurationSeconds: number | null }[];
  totalActive: number;
  totalToday: number;
}

// ─── Quality ─────────────────────────────────────────────────────────────────

export interface QualityCheckEntry {
  id: string;
  result: QCResult;
  checklistData: { item: string; passed: boolean; notes: string }[];
  photos: string[];
  notes: string | null;
  inspector: { id: string; name: string };
  createdAt: string;
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface WorkOrderStats {
  byStatus: { status: WorkOrderStatus; count: number }[];
  totalActive: number;
  totalToday: number;
}

export interface IncidentStats {
  byType: { type: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
  byResponsibility: { responsibility: string; count: number }[];
  totalCostCents: number;
  totalOpen: number;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type ProductionView =
  | 'ventas' | 'diseno' | 'produccion' | 'calidad'
  | 'empaque' | 'logistica' | 'metricas' | 'incidencias' | 'cerebro';
