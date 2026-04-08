import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useProductionStore } from '@/store/production-store';
import { ArrowLeft, Copy, FileText, User, Package, Clock, CheckCircle, XCircle, AlertTriangle, Truck, Download, Eye, UserPlus, Play, Ban, RotateCcw, } from 'lucide-react';
// ─── Status & Priority helpers ────────────────────────────────────────────────
const STATUS_COLORS = {
    BORRADOR: 'bg-[#374151]/60 text-[#9CA3AF] border-[#4B5563]/40',
    PENDIENTE_VALIDACION: 'bg-[#374151]/60 text-[#9CA3AF] border-[#4B5563]/40',
    EN_COLA_DISENO: 'bg-[#7C3AED]/15 text-[#A78BFA] border-[#7C3AED]/30',
    EN_DISENO: 'bg-[#7C3AED]/15 text-[#A78BFA] border-[#7C3AED]/30',
    DISENO_EN_REVISION: 'bg-[#7C3AED]/15 text-[#A78BFA] border-[#7C3AED]/30',
    ESPERANDO_APROBACION_CLIENTE: 'bg-[#D97706]/15 text-[#FBBF24] border-[#D97706]/30',
    APROBADO_PARA_PRODUCCION: 'bg-[#06B6D4]/15 text-[#67E8F9] border-[#06B6D4]/30',
    EN_IMPRESION: 'bg-[#06B6D4]/15 text-[#67E8F9] border-[#06B6D4]/30',
    EN_CORTE: 'bg-[#06B6D4]/15 text-[#67E8F9] border-[#06B6D4]/30',
    EN_ARMADO: 'bg-[#06B6D4]/15 text-[#67E8F9] border-[#06B6D4]/30',
    EN_CONTROL_CALIDAD: 'bg-[#D97706]/15 text-[#FBBF24] border-[#D97706]/30',
    QC_RECHAZADO: 'bg-[#DC2626]/15 text-[#F87171] border-[#DC2626]/30',
    EN_REPROCESO: 'bg-[#DC2626]/15 text-[#F87171] border-[#DC2626]/30',
    EMPACADO: 'bg-[#059669]/15 text-[#34D399] border-[#059669]/30',
    LISTO_PARA_ENTREGA: 'bg-[#059669]/15 text-[#34D399] border-[#059669]/30',
    EN_TRANSITO: 'bg-[#059669]/15 text-[#34D399] border-[#059669]/30',
    ENTREGADO: 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30',
    CERRADO: 'bg-[#374151]/60 text-[#9CA3AF] border-[#4B5563]/40',
    CANCELADO: 'bg-[#7F1D1D]/30 text-[#FCA5A5] border-[#991B1B]/40',
};
const STATUS_LABELS = {
    BORRADOR: 'Borrador',
    PENDIENTE_VALIDACION: 'Pend. Validacion',
    ARCHIVOS_VALIDADOS: 'Archivos OK',
    PENDIENTE_PAGO: 'Pend. Pago',
    ORDEN_CONFIRMADA: 'Confirmada',
    EN_COLA_DISENO: 'Cola Diseno',
    EN_DISENO: 'En Diseno',
    DISENO_EN_REVISION: 'Revision Diseno',
    ESPERANDO_APROBACION_CLIENTE: 'Esp. Aprobacion',
    APROBADO_PARA_PRODUCCION: 'Aprobado Prod.',
    EN_IMPRESION: 'Impresion',
    EN_CORTE: 'Corte',
    EN_ARMADO: 'Armado',
    EN_CONTROL_CALIDAD: 'Control Calidad',
    QC_RECHAZADO: 'QC Rechazado',
    EN_REPROCESO: 'Reproceso',
    EMPACADO: 'Empacado',
    LISTO_PARA_ENTREGA: 'Listo Entrega',
    EN_TRANSITO: 'En Transito',
    ENTREGADO: 'Entregado',
    CERRADO: 'Cerrado',
    CANCELADO: 'Cancelado',
};
const PRIORITY_COLORS = {
    BAJA: 'bg-[#374151]/60 text-[#9CA3AF] border-[#4B5563]/40',
    NORMAL: 'bg-[#1E40AF]/15 text-[#60A5FA] border-[#1E40AF]/30',
    ALTA: 'bg-[#D97706]/15 text-[#FBBF24] border-[#D97706]/30',
    URGENTE: 'bg-[#DC2626]/15 text-[#F87171] border-[#DC2626]/30',
};
const PRIORITY_LABELS = {
    BAJA: 'Baja', NORMAL: 'Normal', ALTA: 'Alta', URGENTE: 'Urgente',
};
const SEVERITY_COLORS = {
    LOW: 'text-[#9CA3AF]',
    MEDIUM: 'text-[#FBBF24]',
    HIGH: 'text-[#F97316]',
    CRITICAL: 'text-[#F87171]',
};
const VALIDATION_COLORS = {
    PENDING_VALIDATION: 'text-[#FBBF24]',
    VALIDATED: 'text-[#34D399]',
    REJECTED: 'text-[#F87171]',
};
function StatusBadge({ status }) {
    return (_jsx("span", { className: `inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border ${STATUS_COLORS[status] || STATUS_COLORS.BORRADOR}`, children: STATUS_LABELS[status] || status }));
}
function PriorityBadge({ priority }) {
    return (_jsx("span", { className: `inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border ${PRIORITY_COLORS[priority]}`, children: PRIORITY_LABELS[priority] }));
}
function formatCRC(cents) {
    return '\u20A1' + (cents / 100).toLocaleString('es-CR');
}
function formatDateTime(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function formatDate(iso) {
    return new Date(iso).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
}
// ─── Mock full work order ─────────────────────────────────────────────────────
const MOCK_DETAIL = {
    'wo-001': {
        id: 'wo-001',
        workOrderNumber: 'WO-2026-0001',
        barcode: 'WO20260001',
        status: 'EN_DISENO',
        priority: 'ALTA',
        source: 'whatsapp',
        deliveryType: 'ENVIO',
        totalCents: 4500000,
        currency: 'CRC',
        customerNotes: 'Necesito que el logo sea en color dorado, no amarillo. Tallas: 2 M y 1 L.',
        internalNotes: 'Cliente recurrente, dar prioridad. Contactar por WhatsApp para aprobacion.',
        estimatedCompletionDate: '2026-04-12T00:00:00Z',
        actualCompletionDate: null,
        cancellationReason: null,
        reworkReason: null,
        customer: { id: 'cust-001', firstName: 'Carlos', lastName: 'Ramirez', whatsappPhone: '+50688881234' },
        assignedDesigner: { id: 'user-002', name: 'Maria Lopez' },
        createdBy: { id: 'user-001', name: 'Adrian' },
        lines: [
            {
                id: 'line-001', lineNumber: 1, barcode: 'LN20260001-01',
                productType: 'CAMISETA', description: 'Camiseta ciclismo manga corta - Logo dorado',
                quantity: 2, unitPriceCents: 1200000, specifications: null,
                status: 'EN_DISENO', currentStation: null,
            },
            {
                id: 'line-002', lineNumber: 2, barcode: 'LN20260001-02',
                productType: 'JERSEY', description: 'Jersey ciclismo completo - Diseno personalizado',
                quantity: 1, unitPriceCents: 2100000, specifications: null,
                status: 'EN_COLA_DISENO', currentStation: null,
            },
        ],
        designFiles: [
            {
                id: 'df-001', version: 1, fileName: 'logo-dorado-v1.ai',
                fileUrl: '#', fileSizeBytes: 4200000, mimeType: 'application/illustrator',
                dpiX: 300, dpiY: 300, validationStatus: 'VALIDATED', validationErrors: null,
                isClientFile: true, uploadedBy: { id: 'cust-001', name: 'Carlos Ramirez' },
                createdAt: '2026-04-05T11:00:00Z',
            },
            {
                id: 'df-002', version: 1, fileName: 'mockup-camiseta-v1.png',
                fileUrl: '#', fileSizeBytes: 2800000, mimeType: 'image/png',
                dpiX: 150, dpiY: 150, validationStatus: 'PENDING_VALIDATION', validationErrors: null,
                isClientFile: false, uploadedBy: { id: 'user-002', name: 'Maria Lopez' },
                createdAt: '2026-04-06T09:30:00Z',
            },
        ],
        designApprovals: [],
        statusHistory: [
            {
                id: 'sh-001', fromStatus: null, toStatus: 'BORRADOR',
                changedBy: { id: 'user-001', name: 'Adrian' }, notes: 'Orden creada desde WhatsApp',
                automatic: false, createdAt: '2026-04-05T10:30:00Z',
            },
            {
                id: 'sh-002', fromStatus: 'BORRADOR', toStatus: 'PENDIENTE_VALIDACION',
                changedBy: { id: 'user-001', name: 'Adrian' }, notes: null,
                automatic: false, createdAt: '2026-04-05T10:35:00Z',
            },
            {
                id: 'sh-003', fromStatus: 'PENDIENTE_VALIDACION', toStatus: 'ARCHIVOS_VALIDADOS',
                changedBy: { id: 'user-002', name: 'Maria Lopez' }, notes: 'Archivo AI validado, 300 DPI',
                automatic: false, createdAt: '2026-04-05T11:15:00Z',
            },
            {
                id: 'sh-004', fromStatus: 'ARCHIVOS_VALIDADOS', toStatus: 'ORDEN_CONFIRMADA',
                notes: 'Pago confirmado via SINPE Movil', changedBy: { id: 'user-001', name: 'Adrian' },
                automatic: false, createdAt: '2026-04-05T14:00:00Z',
            },
            {
                id: 'sh-005', fromStatus: 'ORDEN_CONFIRMADA', toStatus: 'EN_COLA_DISENO',
                notes: null, automatic: true, createdAt: '2026-04-05T14:01:00Z',
            },
            {
                id: 'sh-006', fromStatus: 'EN_COLA_DISENO', toStatus: 'EN_DISENO',
                changedBy: { id: 'user-002', name: 'Maria Lopez' }, notes: 'Asignada y en proceso',
                automatic: false, createdAt: '2026-04-06T09:00:00Z',
            },
        ],
        incidents: [
            {
                id: 'inc-001', incidentNumber: 'INC-001', type: 'ARCHIVO_CORRUPTO',
                severity: 'LOW', responsibility: 'CLIENT', status: 'RESOLVED',
                description: 'Primer archivo enviado estaba corrupto, cliente reenvio correctamente.',
                costEstimatedCents: 0, costRealCents: 0, resolution: 'Cliente reenvio archivo correcto.',
                reportedBy: { id: 'user-002', name: 'Maria Lopez' }, createdAt: '2026-04-05T11:10:00Z',
            },
        ],
        delivery: null,
        parentWorkOrderId: null,
        createdAt: '2026-04-05T10:30:00Z',
        updatedAt: '2026-04-06T09:30:00Z',
    },
    'wo-002': {
        id: 'wo-002',
        workOrderNumber: 'WO-2026-0002',
        barcode: 'WO20260002',
        status: 'EN_IMPRESION',
        priority: 'URGENTE',
        source: 'presencial',
        deliveryType: 'RETIRO_SUCURSAL',
        totalCents: 7800000,
        currency: 'CRC',
        customerNotes: 'Pedido para equipo de triatlon. 5 piezas iguales.',
        internalNotes: 'URGENTE - evento este sabado.',
        estimatedCompletionDate: '2026-04-09T00:00:00Z',
        actualCompletionDate: null,
        cancellationReason: null,
        reworkReason: null,
        customer: { id: 'cust-002', firstName: 'Ana', lastName: 'Solis', whatsappPhone: '+50677772345' },
        assignedDesigner: { id: 'user-003', name: 'Pedro Arias' },
        createdBy: { id: 'user-001', name: 'Adrian' },
        lines: [
            {
                id: 'line-003', lineNumber: 1, barcode: 'LN20260002-01',
                productType: 'JERSEY', description: 'Jersey triatlon completo - Equipo Fenix',
                quantity: 5, unitPriceCents: 1560000, specifications: null,
                status: 'EN_IMPRESION', currentStation: 'IMPRESION',
            },
        ],
        designFiles: [
            {
                id: 'df-003', version: 2, fileName: 'jersey-fenix-v2-final.ai',
                fileUrl: '#', fileSizeBytes: 6100000, mimeType: 'application/illustrator',
                dpiX: 300, dpiY: 300, validationStatus: 'VALIDATED', validationErrors: null,
                isClientFile: false, uploadedBy: { id: 'user-003', name: 'Pedro Arias' },
                createdAt: '2026-04-05T16:00:00Z',
            },
        ],
        designApprovals: [],
        statusHistory: [
            {
                id: 'sh-010', fromStatus: null, toStatus: 'BORRADOR',
                changedBy: { id: 'user-001', name: 'Adrian' }, notes: 'Pedido presencial en tienda',
                automatic: false, createdAt: '2026-04-04T14:15:00Z',
            },
            {
                id: 'sh-011', fromStatus: 'BORRADOR', toStatus: 'ORDEN_CONFIRMADA',
                changedBy: { id: 'user-001', name: 'Adrian' }, notes: 'Pago completo en efectivo',
                automatic: false, createdAt: '2026-04-04T14:30:00Z',
            },
            {
                id: 'sh-012', fromStatus: 'ORDEN_CONFIRMADA', toStatus: 'EN_DISENO',
                changedBy: { id: 'user-003', name: 'Pedro Arias' }, notes: null,
                automatic: false, createdAt: '2026-04-04T15:00:00Z',
            },
            {
                id: 'sh-013', fromStatus: 'EN_DISENO', toStatus: 'APROBADO_PARA_PRODUCCION',
                changedBy: { id: 'user-001', name: 'Adrian' }, notes: 'Cliente aprobo en tienda',
                automatic: false, createdAt: '2026-04-05T17:00:00Z',
            },
            {
                id: 'sh-014', fromStatus: 'APROBADO_PARA_PRODUCCION', toStatus: 'EN_IMPRESION',
                changedBy: { id: 'user-004', name: 'Jose Operador' }, notes: 'Inicio impresion sublimacion',
                automatic: false, createdAt: '2026-04-06T08:00:00Z',
            },
        ],
        incidents: [],
        delivery: null,
        parentWorkOrderId: null,
        createdAt: '2026-04-04T14:15:00Z',
        updatedAt: '2026-04-06T08:00:00Z',
    },
    'wo-004': {
        id: 'wo-004',
        workOrderNumber: 'WO-2026-0004',
        barcode: 'WO20260004',
        status: 'LISTO_PARA_ENTREGA',
        priority: 'NORMAL',
        source: 'whatsapp',
        deliveryType: 'ENVIO',
        totalCents: 3200000,
        currency: 'CRC',
        customerNotes: null,
        internalNotes: 'Enviar por Correos de Costa Rica.',
        estimatedCompletionDate: '2026-04-06T00:00:00Z',
        actualCompletionDate: '2026-04-05T16:00:00Z',
        cancellationReason: null,
        reworkReason: null,
        customer: { id: 'cust-004', firstName: 'Sofia', lastName: 'Vargas', whatsappPhone: '+50699994567' },
        assignedDesigner: { id: 'user-002', name: 'Maria Lopez' },
        createdBy: { id: 'user-001', name: 'Adrian' },
        lines: [
            {
                id: 'line-010', lineNumber: 1, barcode: 'LN20260004-01',
                productType: 'CAMISETA', description: 'Camiseta running personalizada - Logo empresa',
                quantity: 2, unitPriceCents: 1600000, specifications: null,
                status: 'LISTO_PARA_ENTREGA', currentStation: null,
            },
        ],
        designFiles: [
            {
                id: 'df-010', version: 1, fileName: 'logo-empresa-vargas.png',
                fileUrl: '#', fileSizeBytes: 1200000, mimeType: 'image/png',
                dpiX: 300, dpiY: 300, validationStatus: 'VALIDATED', validationErrors: null,
                isClientFile: true, uploadedBy: { id: 'cust-004', name: 'Sofia Vargas' },
                createdAt: '2026-04-01T10:00:00Z',
            },
        ],
        designApprovals: [],
        statusHistory: [
            {
                id: 'sh-020', fromStatus: null, toStatus: 'BORRADOR',
                changedBy: { id: 'user-001', name: 'Adrian' }, notes: null,
                automatic: false, createdAt: '2026-04-01T09:45:00Z',
            },
            {
                id: 'sh-021', fromStatus: 'BORRADOR', toStatus: 'ORDEN_CONFIRMADA',
                changedBy: { id: 'user-001', name: 'Adrian' }, notes: 'SINPE confirmado',
                automatic: false, createdAt: '2026-04-01T10:30:00Z',
            },
            {
                id: 'sh-025', fromStatus: 'ORDEN_CONFIRMADA', toStatus: 'EMPACADO',
                changedBy: { id: 'user-004', name: 'Jose Operador' }, notes: 'Produccion completada',
                automatic: false, createdAt: '2026-04-05T15:00:00Z',
            },
            {
                id: 'sh-026', fromStatus: 'EMPACADO', toStatus: 'LISTO_PARA_ENTREGA',
                changedBy: { id: 'user-004', name: 'Jose Operador' }, notes: 'Empacado y etiquetado',
                automatic: false, createdAt: '2026-04-05T16:00:00Z',
            },
        ],
        incidents: [],
        delivery: {
            id: 'del-001', deliveryType: 'ENVIO', status: 'PENDING',
            carrierName: 'Correos de Costa Rica', trackingNumber: null,
            shippedAt: null, deliveredAt: null, receivedByName: null,
        },
        parentWorkOrderId: null,
        createdAt: '2026-04-01T09:45:00Z',
        updatedAt: '2026-04-05T16:00:00Z',
    },
};
// Fallback for orders without full detail
function buildFallback(id) {
    return {
        id, workOrderNumber: 'WO-????', barcode: '', status: 'BORRADOR', priority: 'NORMAL',
        source: 'manual', deliveryType: 'TIENDA', totalCents: 0, currency: 'CRC',
        customerNotes: null, internalNotes: null, estimatedCompletionDate: null,
        actualCompletionDate: null, cancellationReason: null, reworkReason: null,
        customer: { id: '', firstName: 'Desconocido', lastName: '', whatsappPhone: '' },
        assignedDesigner: null, createdBy: { id: '', name: 'Sistema' },
        lines: [], designFiles: [], designApprovals: [], statusHistory: [],
        incidents: [], delivery: null, parentWorkOrderId: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
}
// ─── Section card wrapper ─────────────────────────────────────────────────────
function Card({ title, icon: Icon, children }) {
    return (_jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-2 px-4 py-3 border-b border-[#1E1E1E]", children: [_jsx(Icon, { className: "w-4 h-4 text-[#6B7280]" }), _jsx("h3", { className: "text-white text-sm font-semibold", children: title })] }), _jsx("div", { className: "p-4", children: children })] }));
}
// ─── Action buttons per status ────────────────────────────────────────────────
function ActionButtons({ status }) {
    const btnBase = 'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors';
    const primary = `${btnBase} bg-[#00FF88] hover:bg-[#00DD77] text-black`;
    const secondary = `${btnBase} bg-[#1A1A1A] hover:bg-[#252525] text-white border border-[#1E1E1E]`;
    const danger = `${btnBase} bg-[#7F1D1D]/40 hover:bg-[#7F1D1D]/60 text-[#FCA5A5] border border-[#991B1B]/30`;
    switch (status) {
        case 'BORRADOR':
            return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { className: primary, children: [_jsx(Play, { className: "w-4 h-4" }), " Validar y Confirmar"] }), _jsxs("button", { className: danger, children: [_jsx(Ban, { className: "w-4 h-4" }), " Cancelar"] })] }));
        case 'EN_COLA_DISENO':
            return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { className: primary, children: [_jsx(UserPlus, { className: "w-4 h-4" }), " Asignar Disenador"] }), _jsxs("button", { className: danger, children: [_jsx(Ban, { className: "w-4 h-4" }), " Cancelar"] })] }));
        case 'EN_DISENO':
        case 'DISENO_EN_REVISION':
            return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { className: primary, children: [_jsx(CheckCircle, { className: "w-4 h-4" }), " Aprobar Diseno"] }), _jsxs("button", { className: secondary, children: [_jsx(RotateCcw, { className: "w-4 h-4" }), " Solicitar Revision"] }), _jsxs("button", { className: danger, children: [_jsx(Ban, { className: "w-4 h-4" }), " Cancelar"] })] }));
        case 'APROBADO_PARA_PRODUCCION':
            return (_jsx("div", { className: "flex items-center gap-2", children: _jsxs("button", { className: primary, children: [_jsx(Play, { className: "w-4 h-4" }), " Enviar a Produccion"] }) }));
        case 'EN_IMPRESION':
        case 'EN_CORTE':
        case 'EN_ARMADO':
            return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { className: primary, children: [_jsx(CheckCircle, { className: "w-4 h-4" }), " Completar Estacion"] }), _jsxs("button", { className: secondary, children: [_jsx(AlertTriangle, { className: "w-4 h-4" }), " Reportar Incidencia"] })] }));
        case 'EN_CONTROL_CALIDAD':
            return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { className: primary, children: [_jsx(CheckCircle, { className: "w-4 h-4" }), " Aprobar QC"] }), _jsxs("button", { className: danger, children: [_jsx(XCircle, { className: "w-4 h-4" }), " Rechazar QC"] })] }));
        case 'QC_RECHAZADO':
            return (_jsx("div", { className: "flex items-center gap-2", children: _jsxs("button", { className: primary, children: [_jsx(RotateCcw, { className: "w-4 h-4" }), " Enviar a Reproceso"] }) }));
        case 'EMPACADO':
        case 'LISTO_PARA_ENTREGA':
            return (_jsx("div", { className: "flex items-center gap-2", children: _jsxs("button", { className: primary, children: [_jsx(Truck, { className: "w-4 h-4" }), " Marcar Entregado"] }) }));
        default:
            return null;
    }
}
// ─── Timeline entry ───────────────────────────────────────────────────────────
function TimelineEntry({ entry, isLast }) {
    return (_jsxs("div", { className: "flex gap-3", children: [_jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-[#00FF88] ring-2 ring-[#00FF88]/20 flex-shrink-0 mt-1" }), !isLast && _jsx("div", { className: "w-px flex-1 bg-[#1E1E1E] mt-1" })] }), _jsxs("div", { className: "pb-5 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx(StatusBadge, { status: entry.toStatus }), entry.automatic && (_jsx("span", { className: "text-[10px] text-[#4B5563] border border-[#1E1E1E] px-1.5 py-0.5 rounded", children: "Auto" }))] }), entry.notes && _jsx("p", { className: "text-[#9CA3AF] text-xs mt-1", children: entry.notes }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [entry.changedBy && _jsx("span", { className: "text-[#6B7280] text-[11px]", children: entry.changedBy.name }), _jsx("span", { className: "text-[#4B5563] text-[11px]", children: formatDateTime(entry.createdAt) })] })] })] }));
}
// ─── Main Component ───────────────────────────────────────────────────────────
export default function WorkOrderDetail() {
    const selectedId = useProductionStore(s => s.selectedWorkOrderId);
    const setSelectedWorkOrder = useProductionStore(s => s.setSelectedWorkOrder);
    const order = selectedId ? (MOCK_DETAIL[selectedId] || buildFallback(selectedId)) : buildFallback('');
    return (_jsxs("div", { className: "h-full overflow-y-auto bg-[#0A0A0A] p-6", children: [_jsxs("button", { onClick: () => setSelectedWorkOrder(null), className: "flex items-center gap-2 text-[#6B7280] hover:text-white text-sm mb-4 transition-colors", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), "Volver a ordenes"] }), _jsxs("div", { className: "flex items-start justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [_jsx("h1", { className: "text-xl font-bold text-white font-mono", children: order.workOrderNumber }), _jsx(StatusBadge, { status: order.status }), _jsx(PriorityBadge, { priority: order.priority }), _jsx("button", { className: "p-1 text-[#6B7280] hover:text-white transition-colors", title: "Copiar numero de orden", children: _jsx(Copy, { className: "w-3.5 h-3.5" }) })] }), _jsx(ActionButtons, { status: order.status })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [_jsxs("div", { className: "lg:col-span-2 space-y-4", children: [_jsx(Card, { title: "Cliente", icon: User, children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[#6B7280] text-xs", children: "Nombre" }), _jsxs("p", { className: "text-white text-sm font-medium", children: [order.customer.firstName, " ", order.customer.lastName] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[#6B7280] text-xs", children: "WhatsApp" }), _jsx("p", { className: "text-white text-sm font-medium", children: order.customer.whatsappPhone })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[#6B7280] text-xs", children: "Fuente" }), _jsx("p", { className: "text-[#9CA3AF] text-sm capitalize", children: order.source })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[#6B7280] text-xs", children: "Tipo de entrega" }), _jsx("p", { className: "text-[#9CA3AF] text-sm", children: order.deliveryType === 'ENVIO' ? 'Envio a domicilio' : order.deliveryType === 'RETIRO_SUCURSAL' ? 'Retiro en sucursal' : 'Tienda' })] }), order.customerNotes && (_jsxs("div", { className: "col-span-2", children: [_jsx("p", { className: "text-[#6B7280] text-xs", children: "Notas del cliente" }), _jsx("p", { className: "text-[#9CA3AF] text-sm mt-0.5", children: order.customerNotes })] })), order.internalNotes && (_jsxs("div", { className: "col-span-2", children: [_jsx("p", { className: "text-[#6B7280] text-xs", children: "Notas internas" }), _jsx("p", { className: "text-[#FBBF24] text-sm mt-0.5", children: order.internalNotes })] }))] }) }), _jsxs(Card, { title: "Lineas del Pedido", icon: Package, children: [_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-[#1E1E1E]", children: ['#', 'Barcode', 'Tipo', 'Descripcion', 'Cant.', 'Estado'].map(h => (_jsx("th", { className: "px-3 py-2 text-left text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider", children: h }, h))) }) }), _jsx("tbody", { children: order.lines.map(line => (_jsxs("tr", { className: "border-b border-[#1E1E1E]/30", children: [_jsx("td", { className: "px-3 py-2.5 text-[#9CA3AF] text-sm", children: line.lineNumber }), _jsx("td", { className: "px-3 py-2.5 text-[#6B7280] text-xs font-mono", children: line.barcode }), _jsx("td", { className: "px-3 py-2.5", children: _jsx("span", { className: "text-[#9CA3AF] text-xs bg-[#1A1A1A] px-2 py-0.5 rounded", children: line.productType }) }), _jsx("td", { className: "px-3 py-2.5 text-white text-sm", children: line.description }), _jsx("td", { className: "px-3 py-2.5 text-white text-sm text-center", children: line.quantity }), _jsx("td", { className: "px-3 py-2.5", children: _jsx(StatusBadge, { status: line.status }) })] }, line.id))) })] }) }), _jsx("div", { className: "flex justify-end mt-3 pt-3 border-t border-[#1E1E1E]", children: _jsxs("span", { className: "text-sm text-[#9CA3AF]", children: ["Total: ", _jsx("span", { className: "text-white font-bold text-base", children: formatCRC(order.totalCents) })] }) })] }), order.designFiles.length > 0 && (_jsx(Card, { title: "Archivos de Diseno", icon: FileText, children: _jsx("div", { className: "space-y-2", children: order.designFiles.map(file => (_jsxs("div", { className: "flex items-center justify-between bg-[#0A0A0A] rounded-lg px-3 py-2.5", children: [_jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [_jsx(FileText, { className: "w-4 h-4 text-[#6B7280] flex-shrink-0" }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-white text-sm truncate", children: file.fileName }), _jsxs("p", { className: "text-[#6B7280] text-xs", children: ["v", file.version, " \u00B7 ", (file.fileSizeBytes / 1024 / 1024).toFixed(1), " MB", file.dpiX && _jsxs(_Fragment, { children: [" \u00B7 ", file.dpiX, " DPI"] }), "\u00B7 ", file.isClientFile ? 'Cliente' : 'Disenador'] })] })] }), _jsxs("div", { className: "flex items-center gap-2 flex-shrink-0", children: [_jsx("span", { className: `text-xs font-medium ${VALIDATION_COLORS[file.validationStatus] || 'text-[#9CA3AF]'}`, children: file.validationStatus === 'VALIDATED' ? 'Validado' : file.validationStatus === 'REJECTED' ? 'Rechazado' : 'Pendiente' }), _jsx("button", { className: "p-1 text-[#6B7280] hover:text-white transition-colors", children: _jsx(Eye, { className: "w-3.5 h-3.5" }) }), _jsx("button", { className: "p-1 text-[#6B7280] hover:text-white transition-colors", children: _jsx(Download, { className: "w-3.5 h-3.5" }) })] })] }, file.id))) }) })), order.incidents.length > 0 && (_jsx(Card, { title: "Incidencias", icon: AlertTriangle, children: _jsx("div", { className: "space-y-2", children: order.incidents.map(inc => (_jsxs("div", { className: "bg-[#0A0A0A] rounded-lg px-4 py-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-white text-sm font-mono", children: inc.incidentNumber }), _jsx("span", { className: `text-xs font-medium ${SEVERITY_COLORS[inc.severity]}`, children: inc.severity }), _jsx("span", { className: `text-xs px-1.5 py-0.5 rounded ${inc.status === 'RESOLVED' || inc.status === 'CLOSED'
                                                                    ? 'bg-[#059669]/15 text-[#34D399]'
                                                                    : 'bg-[#D97706]/15 text-[#FBBF24]'}`, children: inc.status })] }), _jsx("span", { className: "text-[#6B7280] text-xs", children: formatDate(inc.createdAt) })] }), _jsx("p", { className: "text-[#9CA3AF] text-sm", children: inc.description }), inc.resolution && (_jsxs("p", { className: "text-[#34D399] text-xs mt-1", children: ["Resolucion: ", inc.resolution] })), _jsxs("div", { className: "flex items-center gap-3 mt-1 text-[11px] text-[#6B7280]", children: [_jsxs("span", { children: ["Responsabilidad: ", inc.responsibility] }), inc.costEstimatedCents > 0 && _jsxs("span", { children: ["Costo est.: ", formatCRC(inc.costEstimatedCents)] }), _jsxs("span", { children: ["Reportado por: ", inc.reportedBy.name] })] })] }, inc.id))) }) }))] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-lg p-4", children: [_jsx("h3", { className: "text-white text-sm font-semibold mb-3", children: "Resumen" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B7280] text-xs", children: "Total" }), _jsx("span", { className: "text-[#00FF88] text-sm font-bold", children: formatCRC(order.totalCents) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B7280] text-xs", children: "Lineas" }), _jsx("span", { className: "text-white text-sm", children: order.lines.length })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B7280] text-xs", children: "Items totales" }), _jsx("span", { className: "text-white text-sm", children: order.lines.reduce((s, l) => s + l.quantity, 0) })] }), _jsx("div", { className: "border-t border-[#1E1E1E] pt-3", children: _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B7280] text-xs", children: "Creada" }), _jsx("span", { className: "text-[#9CA3AF] text-xs", children: formatDate(order.createdAt) })] }) }), order.estimatedCompletionDate && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B7280] text-xs", children: "Entrega estimada" }), _jsx("span", { className: "text-[#9CA3AF] text-xs", children: formatDate(order.estimatedCompletionDate) })] })), order.assignedDesigner && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B7280] text-xs", children: "Disenador" }), _jsx("span", { className: "text-[#9CA3AF] text-xs", children: order.assignedDesigner.name })] })), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B7280] text-xs", children: "Creado por" }), _jsx("span", { className: "text-[#9CA3AF] text-xs", children: order.createdBy.name })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B7280] text-xs", children: "Barcode" }), _jsx("span", { className: "text-[#6B7280] text-xs font-mono", children: order.barcode })] })] })] }), order.delivery && (_jsx(Card, { title: "Entrega", icon: Truck, children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B7280] text-xs", children: "Tipo" }), _jsx("span", { className: "text-[#9CA3AF] text-xs", children: order.delivery.deliveryType === 'ENVIO' ? 'Envio' : order.delivery.deliveryType === 'RETIRO_SUCURSAL' ? 'Retiro' : 'Tienda' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B7280] text-xs", children: "Estado" }), _jsx("span", { className: `text-xs font-medium ${order.delivery.status === 'DELIVERED' ? 'text-[#00FF88]' :
                                                        order.delivery.status === 'IN_TRANSIT' ? 'text-[#67E8F9]' :
                                                            order.delivery.status === 'FAILED' ? 'text-[#F87171]' : 'text-[#FBBF24]'}`, children: order.delivery.status === 'PENDING' ? 'Pendiente' :
                                                        order.delivery.status === 'IN_TRANSIT' ? 'En transito' :
                                                            order.delivery.status === 'DELIVERED' ? 'Entregado' : 'Fallido' })] }), order.delivery.carrierName && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B7280] text-xs", children: "Transportista" }), _jsx("span", { className: "text-[#9CA3AF] text-xs", children: order.delivery.carrierName })] })), order.delivery.trackingNumber && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B7280] text-xs", children: "Tracking" }), _jsx("span", { className: "text-[#9CA3AF] text-xs font-mono", children: order.delivery.trackingNumber })] }))] }) })), _jsx(Card, { title: "Historial", icon: Clock, children: _jsxs("div", { className: "max-h-[400px] overflow-y-auto pr-1", children: [[...order.statusHistory].reverse().map((entry, idx) => (_jsx(TimelineEntry, { entry: entry, isLast: idx === order.statusHistory.length - 1 }, entry.id))), order.statusHistory.length === 0 && (_jsx("p", { className: "text-[#6B7280] text-sm text-center py-4", children: "Sin historial" }))] }) })] })] })] }));
}
