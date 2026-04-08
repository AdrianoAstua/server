import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { useProductionStore } from '@/store/production-store';
import { Plus, Search, Filter, Eye, ChevronDown, X, ShoppingCart, Clock, Cog, CheckCircle, } from 'lucide-react';
// ─── Status & Priority helpers ────────────────────────────────────────────────
const STATUS_COLORS = {
    BORRADOR: 'bg-[#374151]/60 text-[#9CA3AF] border-[#4B5563]/40',
    PENDIENTE_VALIDACION: 'bg-[#374151]/60 text-[#9CA3AF] border-[#4B5563]/40',
    ARCHIVOS_VALIDADOS: 'bg-[#374151]/60 text-[#9CA3AF] border-[#4B5563]/40',
    PENDIENTE_PAGO: 'bg-[#374151]/60 text-[#9CA3AF] border-[#4B5563]/40',
    ORDEN_CONFIRMADA: 'bg-[#7C3AED]/15 text-[#A78BFA] border-[#7C3AED]/30',
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
    BAJA: 'Baja',
    NORMAL: 'Normal',
    ALTA: 'Alta',
    URGENTE: 'Urgente',
};
function StatusBadge({ status }) {
    return (_jsx("span", { className: `inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${STATUS_COLORS[status] || STATUS_COLORS.BORRADOR}`, children: STATUS_LABELS[status] || status }));
}
function PriorityBadge({ priority }) {
    return (_jsx("span", { className: `inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${PRIORITY_COLORS[priority]}`, children: PRIORITY_LABELS[priority] }));
}
// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_ORDERS = [
    {
        id: 'wo-001',
        workOrderNumber: 'WO-2026-0001',
        status: 'EN_DISENO',
        priority: 'ALTA',
        customer: { firstName: 'Carlos', lastName: 'Ramirez', whatsappPhone: '+50688881234' },
        assignedDesigner: { name: 'Maria Lopez' },
        totalCents: 4500000,
        linesCount: 3,
        createdAt: '2026-04-05T10:30:00Z',
    },
    {
        id: 'wo-002',
        workOrderNumber: 'WO-2026-0002',
        status: 'EN_IMPRESION',
        priority: 'URGENTE',
        customer: { firstName: 'Ana', lastName: 'Solis', whatsappPhone: '+50677772345' },
        assignedDesigner: { name: 'Pedro Arias' },
        totalCents: 7800000,
        linesCount: 5,
        createdAt: '2026-04-04T14:15:00Z',
    },
    {
        id: 'wo-003',
        workOrderNumber: 'WO-2026-0003',
        status: 'BORRADOR',
        priority: 'NORMAL',
        customer: { firstName: 'Luis', lastName: 'Mora', whatsappPhone: '+50666663456' },
        assignedDesigner: null,
        totalCents: 1500000,
        linesCount: 1,
        createdAt: '2026-04-07T08:00:00Z',
    },
    {
        id: 'wo-004',
        workOrderNumber: 'WO-2026-0004',
        status: 'LISTO_PARA_ENTREGA',
        priority: 'NORMAL',
        customer: { firstName: 'Sofia', lastName: 'Vargas', whatsappPhone: '+50699994567' },
        assignedDesigner: { name: 'Maria Lopez' },
        totalCents: 3200000,
        linesCount: 2,
        createdAt: '2026-04-01T09:45:00Z',
    },
    {
        id: 'wo-005',
        workOrderNumber: 'WO-2026-0005',
        status: 'EN_CONTROL_CALIDAD',
        priority: 'ALTA',
        customer: { firstName: 'Diego', lastName: 'Jimenez', whatsappPhone: '+50655555678' },
        assignedDesigner: { name: 'Pedro Arias' },
        totalCents: 12500000,
        linesCount: 8,
        createdAt: '2026-04-03T11:20:00Z',
    },
    {
        id: 'wo-006',
        workOrderNumber: 'WO-2026-0006',
        status: 'ENTREGADO',
        priority: 'BAJA',
        customer: { firstName: 'Valeria', lastName: 'Castro', whatsappPhone: '+50644446789' },
        assignedDesigner: { name: 'Maria Lopez' },
        totalCents: 2100000,
        linesCount: 2,
        createdAt: '2026-03-28T16:30:00Z',
    },
];
// ─── Product types for new order modal ────────────────────────────────────────
const PRODUCT_TYPES = ['MANGA', 'CAMISETA', 'GORRA', 'BOLSO', 'JERSEY', 'LICRA', 'OTRO'];
const DELIVERY_TYPES = [
    { value: 'ENVIO', label: 'Envio a domicilio' },
    { value: 'RETIRO_SUCURSAL', label: 'Retiro en sucursal' },
    { value: 'TIENDA', label: 'Entrega en tienda' },
];
function formatCRC(cents) {
    return '₡' + (cents / 100).toLocaleString('es-CR');
}
function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
}
// ─── Component ────────────────────────────────────────────────────────────────
export default function PanelVentas() {
    const { statusFilter, setStatusFilter, priorityFilter, setPriorityFilter, searchQuery, setSearchQuery, setSelectedWorkOrder } = useProductionStore();
    const [showNewOrder, setShowNewOrder] = useState(false);
    // New order form state
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [deliveryType, setDeliveryType] = useState('RETIRO_SUCURSAL');
    const [priority, setPriority] = useState('NORMAL');
    const [customerNotes, setCustomerNotes] = useState('');
    const [internalNotes, setInternalNotes] = useState('');
    const [lines, setLines] = useState([
        { id: '1', productType: 'CAMISETA', description: '', quantity: 1, unitPriceCents: 0 },
    ]);
    // Filter orders
    const filtered = useMemo(() => {
        return MOCK_ORDERS.filter(o => {
            if (statusFilter !== 'all' && o.status !== statusFilter)
                return false;
            if (priorityFilter !== 'all' && o.priority !== priorityFilter)
                return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const name = `${o.customer.firstName || ''} ${o.customer.lastName || ''}`.toLowerCase();
                if (!name.includes(q) && !o.workOrderNumber.toLowerCase().includes(q))
                    return false;
            }
            return true;
        });
    }, [statusFilter, priorityFilter, searchQuery]);
    // Stats
    const stats = useMemo(() => {
        const active = MOCK_ORDERS.filter(o => !['ENTREGADO', 'CERRADO', 'CANCELADO'].includes(o.status)).length;
        const today = MOCK_ORDERS.filter(o => {
            const d = new Date(o.createdAt);
            const now = new Date();
            return d.toDateString() === now.toDateString();
        }).length;
        const inProd = MOCK_ORDERS.filter(o => ['EN_IMPRESION', 'EN_CORTE', 'EN_ARMADO'].includes(o.status)).length;
        const ready = MOCK_ORDERS.filter(o => ['LISTO_PARA_ENTREGA', 'EMPACADO'].includes(o.status)).length;
        return { active, today, inProd, ready };
    }, []);
    const addLine = () => {
        setLines(prev => [...prev, {
                id: String(Date.now()),
                productType: 'CAMISETA',
                description: '',
                quantity: 1,
                unitPriceCents: 0,
            }]);
    };
    const removeLine = (id) => {
        if (lines.length <= 1)
            return;
        setLines(prev => prev.filter(l => l.id !== id));
    };
    const updateLine = (id, field, value) => {
        setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
    };
    const orderTotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPriceCents, 0);
    const resetForm = () => {
        setCustomerName('');
        setCustomerPhone('');
        setDeliveryType('RETIRO_SUCURSAL');
        setPriority('NORMAL');
        setCustomerNotes('');
        setInternalNotes('');
        setLines([{ id: '1', productType: 'CAMISETA', description: '', quantity: 1, unitPriceCents: 0 }]);
        setShowNewOrder(false);
    };
    return (_jsxs("div", { className: "h-full overflow-y-auto bg-[#0A0A0A] p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-white", children: "Ordenes de Trabajo" }), _jsx("p", { className: "text-[#6B7280] text-sm mt-0.5", children: "Gestiona papeletas y pedidos MTO" })] }), _jsxs("button", { onClick: () => setShowNewOrder(true), className: "flex items-center gap-2 px-4 py-2.5 bg-[#00FF88] hover:bg-[#00DD77] text-black rounded-lg text-sm font-semibold transition-colors", children: [_jsx(Plus, { className: "w-4 h-4" }), "Nueva Orden"] })] }), _jsx("div", { className: "grid grid-cols-4 gap-3 mb-6", children: [
                    { label: 'Activas', value: stats.active, icon: ShoppingCart, color: 'text-[#00FF88]' },
                    { label: 'Hoy', value: stats.today, icon: Clock, color: 'text-[#60A5FA]' },
                    { label: 'En Produccion', value: stats.inProd, icon: Cog, color: 'text-[#67E8F9]' },
                    { label: 'Listas', value: stats.ready, icon: CheckCircle, color: 'text-[#34D399]' },
                ].map(s => (_jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-lg px-4 py-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-[#6B7280] text-xs", children: s.label }), _jsx(s.icon, { className: `w-4 h-4 ${s.color}` })] }), _jsx("p", { className: `text-2xl font-bold mt-1 ${s.color}`, children: s.value })] }, s.label))) }), _jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsxs("div", { className: "relative", children: [_jsx(Filter, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280]" }), _jsxs("select", { value: statusFilter, onChange: e => setStatusFilter(e.target.value), className: "bg-[#111111] border border-[#1E1E1E] text-[#9CA3AF] text-sm rounded-lg pl-9 pr-8 py-2 appearance-none focus:outline-none focus:border-[#00FF88]/40", children: [_jsx("option", { value: "all", children: "Todos los estados" }), Object.entries(STATUS_LABELS).map(([k, v]) => (_jsx("option", { value: k, children: v }, k)))] }), _jsx(ChevronDown, { className: "absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280] pointer-events-none" })] }), _jsxs("div", { className: "relative", children: [_jsxs("select", { value: priorityFilter, onChange: e => setPriorityFilter(e.target.value), className: "bg-[#111111] border border-[#1E1E1E] text-[#9CA3AF] text-sm rounded-lg pl-3 pr-8 py-2 appearance-none focus:outline-none focus:border-[#00FF88]/40", children: [_jsx("option", { value: "all", children: "Todas las prioridades" }), Object.entries(PRIORITY_LABELS).map(([k, v]) => (_jsx("option", { value: k, children: v }, k)))] }), _jsx(ChevronDown, { className: "absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280] pointer-events-none" })] }), _jsxs("div", { className: "relative flex-1 max-w-xs", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280]" }), _jsx("input", { type: "text", value: searchQuery, onChange: e => setSearchQuery(e.target.value), placeholder: "Buscar por cliente o # orden...", className: "w-full bg-[#111111] border border-[#1E1E1E] text-white text-sm rounded-lg pl-9 pr-3 py-2 placeholder-[#4B5563] focus:outline-none focus:border-[#00FF88]/40" })] }), _jsxs("span", { className: "text-[#6B7280] text-xs ml-auto", children: [filtered.length, " orden", filtered.length !== 1 ? 'es' : ''] })] }), _jsx("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-lg overflow-hidden", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-[#1E1E1E]", children: ['# Orden', 'Cliente', 'Estado', 'Prioridad', 'Items', 'Total', 'Fecha', 'Acciones'].map(h => (_jsx("th", { className: "px-4 py-3 text-left text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider", children: h }, h))) }) }), _jsxs("tbody", { children: [filtered.map(order => (_jsxs("tr", { className: "border-b border-[#1E1E1E]/50 hover:bg-[#1A1A1A] transition-colors cursor-pointer", onClick: () => setSelectedWorkOrder(order.id), children: [_jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: "text-white text-sm font-mono", children: order.workOrderNumber }) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { children: [_jsxs("p", { className: "text-white text-sm", children: [order.customer.firstName, " ", order.customer.lastName] }), _jsx("p", { className: "text-[#6B7280] text-xs", children: order.customer.whatsappPhone })] }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(StatusBadge, { status: order.status }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(PriorityBadge, { priority: order.priority }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: "text-[#9CA3AF] text-sm", children: order.linesCount }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: "text-white text-sm font-medium", children: formatCRC(order.totalCents) }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: "text-[#9CA3AF] text-sm", children: formatDate(order.createdAt) }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("button", { onClick: (e) => { e.stopPropagation(); setSelectedWorkOrder(order.id); }, className: "p-1.5 rounded hover:bg-[#1E1E1E] text-[#6B7280] hover:text-white transition-colors", children: _jsx(Eye, { className: "w-4 h-4" }) }) })] }, order.id))), filtered.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 8, className: "px-4 py-12 text-center", children: _jsx("p", { className: "text-[#6B7280] text-sm", children: "No se encontraron ordenes" }) }) }))] })] }) }), showNewOrder && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm", children: _jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-b border-[#1E1E1E]", children: [_jsx("h2", { className: "text-white text-lg font-semibold", children: "Nueva Orden de Trabajo" }), _jsx("button", { onClick: resetForm, className: "p-1 text-[#6B7280] hover:text-white transition-colors", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "px-6 py-5 space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-[#9CA3AF] mb-1.5", children: "Cliente" }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx("input", { type: "text", value: customerName, onChange: e => setCustomerName(e.target.value), placeholder: "Nombre del cliente", className: "bg-[#0A0A0A] border border-[#1E1E1E] text-white text-sm rounded-lg px-3 py-2 placeholder-[#4B5563] focus:outline-none focus:border-[#00FF88]/40" }), _jsx("input", { type: "text", value: customerPhone, onChange: e => setCustomerPhone(e.target.value), placeholder: "+506 8888-1234", className: "bg-[#0A0A0A] border border-[#1E1E1E] text-white text-sm rounded-lg px-3 py-2 placeholder-[#4B5563] focus:outline-none focus:border-[#00FF88]/40" })] })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("label", { className: "text-xs font-medium text-[#9CA3AF]", children: "Lineas del pedido" }), _jsxs("button", { onClick: addLine, className: "text-[#00FF88] text-xs font-medium hover:underline flex items-center gap-1", children: [_jsx(Plus, { className: "w-3 h-3" }), " Agregar linea"] })] }), _jsx("div", { className: "space-y-2", children: lines.map((line, idx) => (_jsxs("div", { className: "grid grid-cols-[140px_1fr_70px_120px_32px] gap-2 items-center", children: [_jsx("select", { value: line.productType, onChange: e => updateLine(line.id, 'productType', e.target.value), className: "bg-[#0A0A0A] border border-[#1E1E1E] text-[#9CA3AF] text-sm rounded-lg px-2 py-2 focus:outline-none focus:border-[#00FF88]/40", children: PRODUCT_TYPES.map(t => _jsx("option", { value: t, children: t }, t)) }), _jsx("input", { type: "text", value: line.description, onChange: e => updateLine(line.id, 'description', e.target.value), placeholder: "Descripcion", className: "bg-[#0A0A0A] border border-[#1E1E1E] text-white text-sm rounded-lg px-3 py-2 placeholder-[#4B5563] focus:outline-none focus:border-[#00FF88]/40" }), _jsx("input", { type: "number", value: line.quantity, onChange: e => updateLine(line.id, 'quantity', parseInt(e.target.value) || 0), min: 1, className: "bg-[#0A0A0A] border border-[#1E1E1E] text-white text-sm rounded-lg px-2 py-2 text-center focus:outline-none focus:border-[#00FF88]/40" }), _jsx("input", { type: "number", value: line.unitPriceCents / 100 || '', onChange: e => updateLine(line.id, 'unitPriceCents', Math.round(parseFloat(e.target.value || '0') * 100)), placeholder: "Precio \u20A1", className: "bg-[#0A0A0A] border border-[#1E1E1E] text-white text-sm rounded-lg px-2 py-2 text-right focus:outline-none focus:border-[#00FF88]/40" }), _jsx("button", { onClick: () => removeLine(line.id), className: "p-1 text-[#6B7280] hover:text-[#F87171] transition-colors disabled:opacity-30", disabled: lines.length <= 1, children: _jsx(X, { className: "w-4 h-4" }) })] }, line.id))) }), orderTotal > 0 && (_jsx("div", { className: "flex justify-end mt-2", children: _jsxs("span", { className: "text-sm text-[#9CA3AF]", children: ["Total: ", _jsx("span", { className: "text-white font-semibold", children: formatCRC(orderTotal) })] }) }))] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-[#9CA3AF] mb-1.5", children: "Tipo de entrega" }), _jsx("select", { value: deliveryType, onChange: e => setDeliveryType(e.target.value), className: "w-full bg-[#0A0A0A] border border-[#1E1E1E] text-[#9CA3AF] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#00FF88]/40", children: DELIVERY_TYPES.map(d => _jsx("option", { value: d.value, children: d.label }, d.value)) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-[#9CA3AF] mb-1.5", children: "Prioridad" }), _jsx("select", { value: priority, onChange: e => setPriority(e.target.value), className: "w-full bg-[#0A0A0A] border border-[#1E1E1E] text-[#9CA3AF] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#00FF88]/40", children: ['BAJA', 'NORMAL', 'ALTA', 'URGENTE'].map(p => (_jsx("option", { value: p, children: PRIORITY_LABELS[p] }, p))) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-[#9CA3AF] mb-1.5", children: "Notas del cliente" }), _jsx("textarea", { value: customerNotes, onChange: e => setCustomerNotes(e.target.value), rows: 2, placeholder: "Instrucciones especiales del cliente...", className: "w-full bg-[#0A0A0A] border border-[#1E1E1E] text-white text-sm rounded-lg px-3 py-2 placeholder-[#4B5563] resize-none focus:outline-none focus:border-[#00FF88]/40" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-[#9CA3AF] mb-1.5", children: "Notas internas" }), _jsx("textarea", { value: internalNotes, onChange: e => setInternalNotes(e.target.value), rows: 2, placeholder: "Notas internas para el equipo...", className: "w-full bg-[#0A0A0A] border border-[#1E1E1E] text-white text-sm rounded-lg px-3 py-2 placeholder-[#4B5563] resize-none focus:outline-none focus:border-[#00FF88]/40" })] })] }), _jsxs("div", { className: "flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1E1E1E]", children: [_jsx("button", { onClick: resetForm, className: "px-4 py-2 text-sm text-[#9CA3AF] hover:text-white transition-colors", children: "Cancelar" }), _jsx("button", { onClick: resetForm, className: "px-5 py-2.5 bg-[#00FF88] hover:bg-[#00DD77] text-black rounded-lg text-sm font-semibold transition-colors", children: "Crear Orden" })] })] }) }))] }));
}
