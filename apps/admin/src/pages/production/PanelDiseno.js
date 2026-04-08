import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Palette, Clock, User, FileText, Download, AlertTriangle, Send, X, MessageSquare, } from 'lucide-react';
import { useProductionStore } from '@/store/production-store';
// ─── Mock Data ──────────────────────────────────────────────────────────────
const MOCK_ORDERS = [
    {
        id: 'wo-d1', workOrderNumber: 'MTO-2026-0041', status: 'EN_COLA_DISENO', priority: 'URGENTE',
        clientName: 'Carlos Mendez', clientPhone: '+506 8844-1122', productType: 'Jersey Ciclismo',
        description: 'Jersey personalizado equipo Ruta CR', assignedAt: '2026-04-07T06:30:00Z',
        designerName: null, revisionsUsed: 0, revisionsAllowed: 3,
        clientNotes: 'Quiero los colores del equipo: azul y blanco. Logo en el pecho.',
        specifications: { Talla: 'L', Tipo: 'Full Zip', Material: 'Lycra Pro', Manga: 'Corta' },
        clientFiles: [
            { name: 'logo-equipo.png', size: '2.4 MB', url: '#' },
            { name: 'referencia-colores.jpg', size: '1.1 MB', url: '#' },
        ],
    },
    {
        id: 'wo-d2', workOrderNumber: 'MTO-2026-0042', status: 'EN_COLA_DISENO', priority: 'NORMAL',
        clientName: 'Maria Solano', clientPhone: '+506 7711-3344', productType: 'Camiseta Running',
        description: 'Camiseta running evento 10K San Jose', assignedAt: '2026-04-07T08:15:00Z',
        designerName: null, revisionsUsed: 0, revisionsAllowed: 2,
        clientNotes: 'Evento benefico, necesito espacio para patrocinadores.',
        specifications: { Talla: 'M', Tipo: 'Cuello Redondo', Material: 'Dry-Fit', Color: 'Blanco' },
        clientFiles: [{ name: 'logos-patrocinadores.zip', size: '8.7 MB', url: '#' }],
    },
    {
        id: 'wo-d3', workOrderNumber: 'MTO-2026-0038', status: 'EN_DISENO', priority: 'ALTA',
        clientName: 'Roberto Jimenez', clientPhone: '+506 6655-7788', productType: 'Kit Completo Ciclismo',
        description: 'Kit jersey + bibshort equipo Volcan', assignedAt: '2026-04-06T14:00:00Z',
        designerName: 'Ana Lopez', revisionsUsed: 1, revisionsAllowed: 3,
        clientNotes: 'Revision 1: cambiar el rojo por naranja en las mangas.',
        specifications: { Talla: 'XL', Tipo: 'Race Fit', Material: 'Aero Pro', Piezas: 'Jersey + Bibshort' },
        clientFiles: [
            { name: 'logo-volcan.ai', size: '4.2 MB', url: '#' },
            { name: 'mockup-previo.pdf', size: '3.1 MB', url: '#' },
        ],
    },
    {
        id: 'wo-d4', workOrderNumber: 'MTO-2026-0039', status: 'EN_DISENO', priority: 'NORMAL',
        clientName: 'Lucia Vargas', clientPhone: '+506 8899-2233', productType: 'Top Natacion',
        description: 'Top competencia triathlon femenino', assignedAt: '2026-04-06T10:30:00Z',
        designerName: 'Ana Lopez', revisionsUsed: 0, revisionsAllowed: 2,
        clientNotes: null,
        specifications: { Talla: 'S', Tipo: 'Racerback', Material: 'Chlorine Resistant', Color: 'Negro/Turquesa' },
        clientFiles: [{ name: 'inspiracion.jpg', size: '890 KB', url: '#' }],
    },
    {
        id: 'wo-d5', workOrderNumber: 'MTO-2026-0035', status: 'DISENO_EN_REVISION', priority: 'ALTA',
        clientName: 'Fernando Rojas', clientPhone: '+506 7722-4455', productType: 'Jersey Trail Running',
        description: 'Jersey manga larga trail Chirripo', assignedAt: '2026-04-05T09:00:00Z',
        designerName: 'Ana Lopez', revisionsUsed: 2, revisionsAllowed: 3,
        clientNotes: 'Revision 2: el verde esta perfecto, solo ajustar texto trasero.',
        specifications: { Talla: 'M', Tipo: 'Manga Larga', Material: 'Trail Dry', Color: 'Verde/Negro' },
        clientFiles: [{ name: 'foto-chirripo.jpg', size: '5.6 MB', url: '#' }],
    },
    {
        id: 'wo-d6', workOrderNumber: 'MTO-2026-0036', status: 'DISENO_EN_REVISION', priority: 'NORMAL',
        clientName: 'Andrea Mora', clientPhone: '+506 6633-8899', productType: 'Uniforme Equipo',
        description: 'Uniforme completo equipo futbol sala', assignedAt: '2026-04-05T11:45:00Z',
        designerName: 'Daniel Arias', revisionsUsed: 1, revisionsAllowed: 2,
        clientNotes: null,
        specifications: { Talla: 'Varias (S-XL)', Tipo: 'Camiseta + Short', Material: 'Micro Mesh', Cantidad: '15 kits' },
        clientFiles: [
            { name: 'escudo-equipo.svg', size: '120 KB', url: '#' },
            { name: 'numeros-nombres.xlsx', size: '45 KB', url: '#' },
        ],
    },
    {
        id: 'wo-d7', workOrderNumber: 'MTO-2026-0033', status: 'ESPERANDO_APROBACION_CLIENTE', priority: 'NORMAL',
        clientName: 'Diego Castillo', clientPhone: '+506 8811-5566', productType: 'Jersey Ciclismo',
        description: 'Jersey conmemorativo Vuelta CR 2026', assignedAt: '2026-04-04T08:00:00Z',
        designerName: 'Ana Lopez', revisionsUsed: 2, revisionsAllowed: 3,
        clientNotes: 'Me gusta mucho! Solo verifico con el comite.',
        specifications: { Talla: 'L', Tipo: 'Club Fit', Material: 'Lycra Standard', Color: 'Multicolor' },
        clientFiles: [{ name: 'brief-vuelta.pdf', size: '2.8 MB', url: '#' }],
    },
    {
        id: 'wo-d8', workOrderNumber: 'MTO-2026-0034', status: 'ESPERANDO_APROBACION_CLIENTE', priority: 'BAJA',
        clientName: 'Sofia Herrera', clientPhone: '+506 7744-6677', productType: 'Gorra Running',
        description: 'Gorra personalizada maraton femenino', assignedAt: '2026-04-04T15:20:00Z',
        designerName: 'Daniel Arias', revisionsUsed: 1, revisionsAllowed: 2,
        clientNotes: null,
        specifications: { Tipo: 'Trucker', Material: 'Dry-Fit Mesh', Color: 'Rosa/Blanco' },
        clientFiles: [{ name: 'logo-maraton.png', size: '650 KB', url: '#' }],
    },
];
// ─── Column Config ──────────────────────────────────────────────────────────
const COLUMNS = [
    { key: 'EN_COLA_DISENO', label: 'En Cola', color: '#6B7280' },
    { key: 'EN_DISENO', label: 'En Diseno', color: '#3B82F6' },
    { key: 'DISENO_EN_REVISION', label: 'En Revision', color: '#F59E0B' },
    { key: 'ESPERANDO_APROBACION_CLIENTE', label: 'Esperando Cliente', color: '#A855F7' },
];
const PRIORITY_CONFIG = {
    BAJA: { label: 'Baja', bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
    NORMAL: { label: 'Normal', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    ALTA: { label: 'Alta', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    URGENTE: { label: 'Urgente', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};
// ─── Helpers ────────────────────────────────────────────────────────────────
function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1)
        return `${Math.floor(diff / 60000)} min`;
    if (hours < 24)
        return `${hours}h`;
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}
// ─── Component ──────────────────────────────────────────────────────────────
export default function PanelDiseno() {
    const { selectedWorkOrderId, setSelectedWorkOrder } = useProductionStore();
    const [orders, setOrders] = useState(MOCK_ORDERS);
    const selectedOrder = useMemo(() => orders.find((o) => o.id === selectedWorkOrderId) ?? null, [orders, selectedWorkOrderId]);
    const ordersByColumn = useMemo(() => {
        const map = {};
        for (const col of COLUMNS)
            map[col.key] = [];
        for (const o of orders) {
            if (map[o.status])
                map[o.status].push(o);
        }
        return map;
    }, [orders]);
    // ─── Actions ────────────────────────────────────────────────────────────
    const moveOrder = (id, toStatus) => {
        setOrders((prev) => prev.map((o) => o.id === id
            ? {
                ...o,
                status: toStatus,
                designerName: toStatus === 'EN_DISENO' && !o.designerName ? 'Ana Lopez' : o.designerName,
                assignedAt: toStatus === 'EN_DISENO' ? new Date().toISOString() : o.assignedAt,
            }
            : o));
    };
    // ─── Render ─────────────────────────────────────────────────────────────
    return (_jsxs("div", { className: "h-full flex bg-[#0A0A0A]", children: [_jsx("div", { className: "flex-1 flex gap-4 p-4 overflow-x-auto", children: COLUMNS.map((col) => (_jsxs("div", { className: "flex-1 min-w-[280px] flex flex-col", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3 px-1", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: col.color } }), _jsx("h3", { className: "text-sm font-semibold text-white", children: col.label }), _jsx("span", { className: "ml-auto text-xs text-[#6B7280] bg-[#111111] border border-[#1E1E1E] rounded-full px-2 py-0.5", children: ordersByColumn[col.key]?.length ?? 0 })] }), _jsx("div", { className: "flex-1 space-y-3 overflow-y-auto pr-1", children: ordersByColumn[col.key]?.map((order) => {
                                const pri = PRIORITY_CONFIG[order.priority];
                                const isSelected = selectedWorkOrderId === order.id;
                                return (_jsxs("button", { onClick: () => setSelectedWorkOrder(isSelected ? null : order.id), className: `w-full text-left bg-[#111111] border rounded-xl p-4 transition-all hover:border-[#2A2A2A] ${isSelected ? 'border-[#00FF88]/40 ring-1 ring-[#00FF88]/20' : 'border-[#1E1E1E]'} ${order.priority === 'URGENTE' ? 'border-l-2 border-l-red-500' : ''}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-xs font-mono text-[#00FF88]", children: order.workOrderNumber }), _jsx("span", { className: `text-[10px] font-medium px-2 py-0.5 rounded-full ${pri.bg} ${pri.text} border ${pri.border}`, children: pri.label })] }), _jsxs("div", { className: "flex items-center gap-1.5 mb-1", children: [_jsx(User, { className: "w-3 h-3 text-[#6B7280]" }), _jsx("span", { className: "text-sm text-white font-medium truncate", children: order.clientName })] }), _jsxs("p", { className: "text-xs text-[#9CA3AF] mb-2 truncate", children: [order.productType, " - ", order.description] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "text-[10px] text-[#6B7280] flex items-center gap-1", children: [_jsx(Clock, { className: "w-3 h-3" }), timeAgo(order.assignedAt)] }), order.designerName && (_jsxs("span", { className: "text-[10px] text-[#9CA3AF] flex items-center gap-1", children: [_jsx(Palette, { className: "w-3 h-3" }), order.designerName] }))] }), _jsxs("div", { className: "mt-3 pt-3 border-t border-[#1E1E1E] flex gap-2", children: [order.status === 'EN_COLA_DISENO' && (_jsx("button", { onClick: (e) => { e.stopPropagation(); moveOrder(order.id, 'EN_DISENO'); }, className: "flex-1 text-xs py-2 rounded-lg bg-[#00FF88]/10 text-[#00FF88] hover:bg-[#00FF88]/20 transition-colors font-medium", children: "Tomar Orden" })), order.status === 'EN_DISENO' && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: (e) => { e.stopPropagation(); moveOrder(order.id, 'DISENO_EN_REVISION'); }, className: "flex-1 text-xs py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium", children: "Subir Diseno" }), _jsxs("button", { onClick: (e) => { e.stopPropagation(); moveOrder(order.id, 'ESPERANDO_APROBACION_CLIENTE'); }, className: "flex-1 text-xs py-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors font-medium", children: [_jsx(Send, { className: "w-3 h-3 inline mr-1" }), "Enviar"] })] })), order.status === 'DISENO_EN_REVISION' && (_jsx("button", { onClick: (e) => { e.stopPropagation(); moveOrder(order.id, 'ESPERANDO_APROBACION_CLIENTE'); }, className: "flex-1 text-xs py-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors font-medium", children: "Solicitar Aprobacion" })), order.status === 'ESPERANDO_APROBACION_CLIENTE' && (_jsx("span", { className: "flex-1 text-xs py-2 text-center text-[#6B7280]", children: "Esperando respuesta..." }))] })] }, order.id));
                            }) })] }, col.key))) }), selectedOrder && (_jsxs("div", { className: "w-[380px] border-l border-[#1E1E1E] bg-[#0F0F0F] flex flex-col overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-[#1E1E1E]", children: [_jsxs("div", { children: [_jsx("span", { className: "text-xs font-mono text-[#00FF88]", children: selectedOrder.workOrderNumber }), _jsx("h3", { className: "text-sm font-semibold text-white mt-0.5", children: selectedOrder.clientName })] }), _jsx("button", { onClick: () => setSelectedWorkOrder(null), className: "p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors", children: _jsx(X, { className: "w-4 h-4 text-[#6B7280]" }) })] }), _jsxs("div", { className: "px-5 py-4 border-b border-[#1E1E1E]", children: [_jsx("h4", { className: "text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3", children: "Producto" }), _jsx("p", { className: "text-sm text-white font-medium", children: selectedOrder.productType }), _jsx("p", { className: "text-xs text-[#9CA3AF] mt-1", children: selectedOrder.description })] }), _jsxs("div", { className: "px-5 py-4 border-b border-[#1E1E1E]", children: [_jsx("h4", { className: "text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3", children: "Especificaciones" }), _jsx("div", { className: "space-y-2", children: Object.entries(selectedOrder.specifications).map(([key, val]) => (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-xs text-[#6B7280]", children: key }), _jsx("span", { className: "text-xs text-white font-medium", children: val })] }, key))) })] }), _jsxs("div", { className: "px-5 py-4 border-b border-[#1E1E1E]", children: [_jsx("h4", { className: "text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3", children: "Revisiones" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex-1 h-2 bg-[#1E1E1E] rounded-full overflow-hidden", children: _jsx("div", { className: "h-full rounded-full transition-all", style: {
                                                width: `${(selectedOrder.revisionsUsed / selectedOrder.revisionsAllowed) * 100}%`,
                                                backgroundColor: selectedOrder.revisionsUsed >= selectedOrder.revisionsAllowed ? '#EF4444' : '#00FF88',
                                            } }) }), _jsxs("span", { className: "text-xs text-white font-mono", children: [selectedOrder.revisionsUsed, "/", selectedOrder.revisionsAllowed] })] }), selectedOrder.revisionsUsed >= selectedOrder.revisionsAllowed && (_jsxs("div", { className: "flex items-center gap-1.5 mt-2 text-xs text-red-400", children: [_jsx(AlertTriangle, { className: "w-3 h-3" }), "Revisiones agotadas"] }))] }), _jsxs("div", { className: "px-5 py-4 border-b border-[#1E1E1E]", children: [_jsxs("h4", { className: "text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3", children: ["Archivos del Cliente (", selectedOrder.clientFiles.length, ")"] }), _jsx("div", { className: "space-y-2", children: selectedOrder.clientFiles.map((file, i) => (_jsxs("div", { className: "flex items-center gap-3 bg-[#111111] border border-[#1E1E1E] rounded-lg px-3 py-2.5 hover:border-[#2A2A2A] transition-colors cursor-pointer", children: [_jsx(FileText, { className: "w-4 h-4 text-[#9CA3AF] flex-shrink-0" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-xs text-white truncate", children: file.name }), _jsx("p", { className: "text-[10px] text-[#6B7280]", children: file.size })] }), _jsx(Download, { className: "w-4 h-4 text-[#6B7280] hover:text-[#00FF88] transition-colors" })] }, i))) })] }), _jsxs("div", { className: "px-5 py-4", children: [_jsxs("h4", { className: "text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3", children: [_jsx(MessageSquare, { className: "w-3 h-3 inline mr-1" }), "Notas del Cliente"] }), selectedOrder.clientNotes ? (_jsx("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-lg p-3", children: _jsx("p", { className: "text-xs text-[#9CA3AF] leading-relaxed", children: selectedOrder.clientNotes }) })) : (_jsx("p", { className: "text-xs text-[#6B7280] italic", children: "Sin notas del cliente" }))] }), selectedOrder.designerName && (_jsx("div", { className: "px-5 py-4 border-t border-[#1E1E1E]", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-[#00FF88]/10 flex items-center justify-center", children: _jsx(Palette, { className: "w-4 h-4 text-[#00FF88]" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-white font-medium", children: selectedOrder.designerName }), _jsx("p", { className: "text-[10px] text-[#6B7280]", children: "Disenador asignado" })] })] }) }))] }))] }));
}
