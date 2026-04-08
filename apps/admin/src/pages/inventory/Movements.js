import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useInventoryStore } from '@/store/inventoryStore';
import { ArrowDownToLine, ArrowUpFromLine, RefreshCcw, Bookmark, RotateCcw, Filter } from 'lucide-react';
const TYPE_CONFIG = {
    entrada: { label: 'Entrada', color: '#00FF88', bg: '#00FF8815', icon: ArrowDownToLine, sign: '+' },
    salida: { label: 'Salida', color: '#EF4444', bg: '#EF444415', icon: ArrowUpFromLine, sign: '-' },
    ajuste: { label: 'Ajuste', color: '#F59E0B', bg: '#F59E0B15', icon: RefreshCcw, sign: '±' },
    reserva: { label: 'Reserva', color: '#3B82F6', bg: '#3B82F615', icon: Bookmark, sign: '-' },
    devolucion: { label: 'Devolución', color: '#8B5CF6', bg: '#8B5CF615', icon: RotateCcw, sign: '+' },
};
function MovementItem({ movement }) {
    const cfg = TYPE_CONFIG[movement.type];
    const date = new Date(movement.createdAt);
    return (_jsxs("div", { className: "flex items-start gap-4 p-4 hover:bg-[#111111] transition-colors rounded-xl border border-transparent hover:border-[#1E1E1E]", children: [_jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", style: { backgroundColor: cfg.bg }, children: _jsx(cfg.icon, { className: "w-4 h-4", style: { color: cfg.color } }) }), _jsx("div", { className: "w-px flex-1 min-h-[20px] bg-[#1E1E1E] mt-1" })] }), _jsxs("div", { className: "flex-1 min-w-0 pb-4", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-0.5", children: [_jsx("span", { className: "text-xs font-semibold px-2 py-0.5 rounded-full", style: { color: cfg.color, backgroundColor: cfg.bg }, children: cfg.label }), movement.reference && (_jsx("span", { className: "text-xs text-[#6B7280] font-mono bg-[#1A1A1A] px-2 py-0.5 rounded", children: movement.reference }))] }), _jsx("p", { className: "text-sm font-semibold text-white", children: movement.productName }), _jsx("p", { className: "text-xs text-[#9CA3AF]", children: movement.variantLabel }), _jsx("p", { className: "text-xs text-[#6B7280] mt-1", children: movement.reason })] }), _jsxs("div", { className: "text-right flex-shrink-0", children: [_jsxs("p", { className: "text-base font-bold", style: { color: cfg.color }, children: [cfg.sign, Math.abs(movement.quantity), " uds"] }), _jsxs("p", { className: "text-xs text-[#6B7280]", children: [movement.stockBefore, " \u2192 ", movement.stockAfter] })] })] }), _jsxs("div", { className: "flex items-center gap-2 mt-2", children: [_jsx("span", { className: "text-xs text-[#4B5563]", children: date.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' }) }), _jsx("span", { className: "text-[#2A2A2A]", children: "\u00B7" }), _jsx("span", { className: "text-xs text-[#4B5563]", children: date.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }) }), _jsx("span", { className: "text-[#2A2A2A]", children: "\u00B7" }), _jsx("span", { className: "text-xs text-[#4B5563]", children: movement.createdBy })] })] })] }));
}
// Group movements by date
function groupByDate(movements) {
    const groups = {};
    for (const m of movements) {
        const date = new Date(m.createdAt).toLocaleDateString('es-CR', {
            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
        });
        if (!groups[date])
            groups[date] = [];
        groups[date].push(m);
    }
    return groups;
}
export function InventoryMovements() {
    const movements = useInventoryStore(s => s.movements);
    const movementFilter = useInventoryStore(s => s.movementFilter);
    const setMovementFilter = useInventoryStore(s => s.setMovementFilter);
    const FILTERS = [
        { id: 'all', label: 'Todos' },
        { id: 'entrada', label: 'Entradas' },
        { id: 'salida', label: 'Salidas' },
        { id: 'ajuste', label: 'Ajustes' },
        { id: 'reserva', label: 'Reservas' },
        { id: 'devolucion', label: 'Devoluciones' },
    ];
    const filtered = movementFilter === 'all'
        ? movements
        : movements.filter(m => m.type === movementFilter);
    const groups = groupByDate(filtered);
    return (_jsxs("div", { className: "h-full flex flex-col overflow-hidden bg-[#0A0A0A]", children: [_jsxs("div", { className: "p-4 border-b border-[#1E1E1E] bg-[#0F0F0F] flex-shrink-0", children: [_jsx("div", { className: "flex items-center justify-between mb-3", children: _jsxs("div", { children: [_jsx("h1", { className: "text-lg font-bold text-white", children: "Movimientos de inventario" }), _jsxs("p", { className: "text-xs text-[#6B7280]", children: [movements.length, " movimientos registrados"] })] }) }), _jsx("div", { className: "flex items-center gap-1.5 flex-wrap", children: FILTERS.map(f => (_jsxs("button", { onClick: () => setMovementFilter(f.id), className: `text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${movementFilter === f.id
                                ? 'bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20'
                                : 'text-[#6B7280] hover:text-white bg-[#1A1A1A] border border-transparent'}`, children: [f.id !== 'all' && (_jsx("span", { className: "mr-1.5 inline-block w-1.5 h-1.5 rounded-full", style: { backgroundColor: TYPE_CONFIG[f.id]?.color } })), f.label] }, f.id))) })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-4", children: Object.keys(groups).length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-full text-[#6B7280]", children: [_jsx(Filter, { className: "w-10 h-10 mb-3 opacity-30" }), _jsx("p", { className: "text-sm", children: "No hay movimientos para este filtro" })] })) : (_jsx("div", { className: "space-y-2", children: Object.entries(groups).map(([date, items]) => (_jsxs("div", { children: [_jsxs("div", { className: "sticky top-0 z-10 py-2 mb-1", children: [_jsx("span", { className: "text-xs font-semibold text-[#4B5563] bg-[#0A0A0A] pr-3 capitalize", children: date }), _jsxs("span", { className: "text-xs text-[#2A2A2A] ml-2", children: ["(", items.length, ")"] })] }), _jsx("div", { className: "bg-[#0F0F0F] border border-[#1E1E1E] rounded-xl overflow-hidden", children: items.map((movement, i) => (_jsx("div", { className: i < items.length - 1 ? 'border-b border-[#111111]' : '', children: _jsx(MovementItem, { movement: movement }) }, movement.id))) })] }, date))) })) })] }));
}
