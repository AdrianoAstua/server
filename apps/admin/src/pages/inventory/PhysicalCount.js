import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { ClipboardCheck, Plus, ScanBarcode, X, Check, Clock, AlertTriangle, ChevronRight, MapPin, Package, ArrowLeft, CheckCircle2, XCircle, BarChart3, Search, } from 'lucide-react';
import { useInventoryStore } from '@/store/inventoryStore';
// ─── Constants ───
const LOCATIONS = [
    { id: 'local', name: 'Tienda Local V ONE B' },
    { id: 'shopify', name: 'Shopify Online' },
];
const STATUS_CONFIG = {
    IN_PROGRESS: { label: 'En Progreso', color: '#F59E0B', bg: '#F59E0B15' },
    COMPLETED: { label: 'Completado', color: '#00FF88', bg: '#00FF8815' },
    CANCELLED: { label: 'Cancelado', color: '#6B7280', bg: '#6B728015' },
};
// ─── Helpers ───
function generateId() {
    return `cnt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
function formatDate(iso) {
    return new Date(iso).toLocaleString('es-CR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
// ─── StatusBadge ───
function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.IN_PROGRESS;
    return (_jsxs("span", { className: "text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5", style: { color: cfg.color, backgroundColor: cfg.bg }, children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full", style: { backgroundColor: cfg.color } }), cfg.label] }));
}
// ─── New Count Modal ───
function NewCountModal({ onClose, onStart, }) {
    const [selectedLocation, setSelectedLocation] = useState('');
    const [notes, setNotes] = useState('');
    const selectedName = LOCATIONS.find((l) => l.id === selectedLocation)?.name ?? '';
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm", children: _jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-2xl w-full max-w-md mx-4 shadow-2xl", children: [_jsxs("div", { className: "p-6 border-b border-[#1E1E1E]", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-bold text-white", children: "Nuevo Conteo Fisico" }), _jsx("button", { onClick: onClose, className: "text-[#6B7280] hover:text-white transition-colors", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsx("p", { className: "text-sm text-[#6B7280] mt-1", children: "Selecciona la ubicacion para iniciar el conteo" })] }), _jsxs("div", { className: "p-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#9CA3AF] mb-2", children: "Ubicacion" }), _jsx("div", { className: "space-y-2", children: LOCATIONS.map((loc) => (_jsxs("button", { onClick: () => setSelectedLocation(loc.id), className: `w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${selectedLocation === loc.id
                                            ? 'border-[#00FF88]/50 bg-[#00FF88]/5'
                                            : 'border-[#2A2A2A] bg-[#0F0F0F] hover:border-[#3A3A3A]'}`, children: [_jsx(MapPin, { className: "w-4 h-4 flex-shrink-0", style: { color: selectedLocation === loc.id ? '#00FF88' : '#6B7280' } }), _jsx("span", { className: selectedLocation === loc.id ? 'text-white font-medium' : 'text-[#9CA3AF]', children: loc.name }), selectedLocation === loc.id && _jsx(Check, { className: "w-4 h-4 ml-auto text-[#00FF88]" })] }, loc.id))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#9CA3AF] mb-2", children: "Notas (opcional)" }), _jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), placeholder: "Notas sobre el conteo...", rows: 3, className: "w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white text-sm placeholder:text-[#4A4A4A] focus:outline-none focus:border-[#00FF88]/50 resize-none" })] })] }), _jsxs("div", { className: "p-6 pt-0 flex gap-3", children: [_jsx("button", { onClick: onClose, className: "flex-1 px-4 py-2.5 rounded-xl border border-[#2A2A2A] text-[#9CA3AF] hover:text-white hover:border-[#3A3A3A] transition-all text-sm font-medium", children: "Cancelar" }), _jsx("button", { onClick: () => onStart(selectedLocation, selectedName, notes || undefined), disabled: !selectedLocation, className: "flex-1 px-4 py-2.5 rounded-xl bg-[#00FF88] text-black font-semibold text-sm hover:bg-[#00FF88]/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed", children: "Iniciar Conteo" })] })] }) }));
}
// ─── Completion Summary Modal ───
function CompletionModal({ count, onClose, }) {
    const counted = count.items.filter((i) => i.actualQty !== null).length;
    const discrepancies = count.items.filter((i) => i.difference !== null && i.difference !== 0);
    const adjustments = discrepancies.reduce((sum, i) => sum + Math.abs(i.difference), 0);
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm", children: _jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-2xl w-full max-w-lg mx-4 shadow-2xl", children: [_jsxs("div", { className: "p-6 border-b border-[#1E1E1E] text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-[#00FF88]/10 flex items-center justify-center mx-auto mb-4", children: _jsx(CheckCircle2, { className: "w-8 h-8 text-[#00FF88]" }) }), _jsx("h2", { className: "text-xl font-bold text-white", children: "Conteo Completado" }), _jsx("p", { className: "text-sm text-[#6B7280] mt-1", children: count.locationName })] }), _jsxs("div", { className: "p-6 grid grid-cols-3 gap-4", children: [_jsxs("div", { className: "text-center p-4 bg-[#0F0F0F] rounded-xl border border-[#1E1E1E]", children: [_jsx("div", { className: "text-2xl font-bold text-white", children: counted }), _jsx("div", { className: "text-xs text-[#6B7280] mt-1", children: "Items Contados" })] }), _jsxs("div", { className: "text-center p-4 bg-[#0F0F0F] rounded-xl border border-[#1E1E1E]", children: [_jsx("div", { className: "text-2xl font-bold text-[#F59E0B]", children: discrepancies.length }), _jsx("div", { className: "text-xs text-[#6B7280] mt-1", children: "Discrepancias" })] }), _jsxs("div", { className: "text-center p-4 bg-[#0F0F0F] rounded-xl border border-[#1E1E1E]", children: [_jsx("div", { className: "text-2xl font-bold text-[#00FF88]", children: adjustments }), _jsx("div", { className: "text-xs text-[#6B7280] mt-1", children: "Ajustes (uds)" })] })] }), discrepancies.length > 0 && (_jsxs("div", { className: "px-6 pb-4", children: [_jsx("h3", { className: "text-sm font-semibold text-[#9CA3AF] mb-2", children: "Discrepancias Ajustadas" }), _jsx("div", { className: "max-h-48 overflow-y-auto space-y-1 custom-scrollbar", children: discrepancies.map((item) => (_jsxs("div", { className: "flex items-center justify-between text-xs px-3 py-2 bg-[#0A0A0A] rounded-lg border border-[#1E1E1E]", children: [_jsxs("div", { children: [_jsx("span", { className: "text-white", children: item.productName }), _jsxs("span", { className: "text-[#6B7280] ml-2", children: [item.size, "/", item.color] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-[#6B7280]", children: item.expectedQty }), _jsx(ChevronRight, { className: "w-3 h-3 text-[#4A4A4A]" }), _jsx("span", { className: "text-white font-medium", children: item.actualQty }), _jsxs("span", { className: `font-mono font-semibold ${item.difference > 0 ? 'text-[#00FF88]' : 'text-red-400'}`, children: [item.difference > 0 ? '+' : '', item.difference] })] })] }, item.variantId))) })] })), _jsx("div", { className: "p-6 pt-2", children: _jsx("button", { onClick: onClose, className: "w-full px-4 py-3 rounded-xl bg-[#00FF88] text-black font-semibold text-sm hover:bg-[#00FF88]/90 transition-all", children: "Cerrar" }) })] }) }));
}
// ─── Cancel Confirmation Modal ───
function CancelModal({ onConfirm, onClose, }) {
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm", children: _jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-2xl w-full max-w-sm mx-4 shadow-2xl p-6", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("div", { className: "w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4", children: _jsx(AlertTriangle, { className: "w-7 h-7 text-red-400" }) }), _jsx("h2", { className: "text-lg font-bold text-white", children: "Cancelar Conteo" }), _jsx("p", { className: "text-sm text-[#6B7280] mt-2", children: "Se descartara todo el progreso del conteo actual. Esta accion no se puede deshacer." })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: onClose, className: "flex-1 px-4 py-2.5 rounded-xl border border-[#2A2A2A] text-[#9CA3AF] hover:text-white hover:border-[#3A3A3A] transition-all text-sm font-medium", children: "Volver" }), _jsx("button", { onClick: onConfirm, className: "flex-1 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-all", children: "Si, Cancelar" })] })] }) }));
}
// ─── Count List View ───
function CountListView({ counts, onNewCount, onSelectCount, }) {
    const totalCounts = counts.length;
    const inProgress = counts.filter((c) => c.status === 'IN_PROGRESS').length;
    const completed = counts.filter((c) => c.status === 'COMPLETED').length;
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-white flex items-center gap-3", children: [_jsx(ClipboardCheck, { className: "w-6 h-6 text-[#00FF88]" }), "Conteo Fisico"] }), _jsx("p", { className: "text-sm text-[#6B7280] mt-1", children: "Verifica y ajusta el inventario con conteos fisicos" })] }), _jsxs("button", { onClick: onNewCount, className: "px-5 py-2.5 rounded-xl bg-[#00FF88] text-black font-semibold text-sm hover:bg-[#00FF88]/90 transition-all flex items-center gap-2", children: [_jsx(Plus, { className: "w-4 h-4" }), "Nuevo Conteo"] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsx("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-[#00FF88]/10 flex items-center justify-center", children: _jsx(BarChart3, { className: "w-5 h-5 text-[#00FF88]" }) }), _jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-white", children: totalCounts }), _jsx("div", { className: "text-xs text-[#6B7280]", children: "Total Conteos" })] })] }) }), _jsx("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center", children: _jsx(Clock, { className: "w-5 h-5 text-[#F59E0B]" }) }), _jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-white", children: inProgress }), _jsx("div", { className: "text-xs text-[#6B7280]", children: "En Progreso" })] })] }) }), _jsx("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-[#00FF88]/10 flex items-center justify-center", children: _jsx(CheckCircle2, { className: "w-5 h-5 text-[#00FF88]" }) }), _jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-white", children: completed }), _jsx("div", { className: "text-xs text-[#6B7280]", children: "Completados" })] })] }) })] }), counts.length === 0 ? (_jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-12 text-center", children: [_jsx(ClipboardCheck, { className: "w-12 h-12 text-[#2A2A2A] mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-white mb-2", children: "No hay conteos" }), _jsx("p", { className: "text-sm text-[#6B7280] mb-6", children: "Inicia un nuevo conteo fisico para verificar tu inventario" }), _jsxs("button", { onClick: onNewCount, className: "px-5 py-2.5 rounded-xl bg-[#00FF88] text-black font-semibold text-sm hover:bg-[#00FF88]/90 transition-all inline-flex items-center gap-2", children: [_jsx(Plus, { className: "w-4 h-4" }), "Nuevo Conteo"] })] })) : (_jsx("div", { className: "space-y-2", children: counts.map((count) => {
                    const total = count.items.length;
                    const done = count.items.filter((i) => i.actualQty !== null).length;
                    const discrep = count.items.filter((i) => i.difference !== null && i.difference !== 0).length;
                    const isClickable = count.status === 'IN_PROGRESS';
                    return (_jsx("button", { onClick: () => isClickable && onSelectCount(count.id), disabled: !isClickable, className: `w-full bg-[#111111] border border-[#1E1E1E] rounded-xl p-4 text-left transition-all ${isClickable ? 'hover:border-[#2A2A2A] cursor-pointer' : 'opacity-70 cursor-default'}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-[#1E1E1E] flex items-center justify-center", children: _jsx(MapPin, { className: "w-5 h-5 text-[#9CA3AF]" }) }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold text-white", children: count.locationName }), _jsx("div", { className: "text-xs text-[#6B7280]", children: formatDate(count.startedAt) }), count.notes && (_jsx("div", { className: "text-xs text-[#4A4A4A] mt-0.5 truncate max-w-[300px]", children: count.notes }))] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "text-right", children: [_jsxs("div", { className: "text-xs text-[#6B7280]", children: [done, "/", total, " items"] }), count.status === 'COMPLETED' && discrep > 0 && (_jsxs("div", { className: "text-xs text-[#F59E0B]", children: [discrep, " discrepancias"] }))] }), _jsx(StatusBadge, { status: count.status }), isClickable && _jsx(ChevronRight, { className: "w-4 h-4 text-[#3A3A3A]" })] })] }) }, count.id));
                }) }))] }));
}
// ─── Active Count View ───
function ActiveCountView({ count, onUpdateItem, onComplete, onCancel, onBack, }) {
    const [tab, setTab] = useState('pending');
    const [scanValue, setScanValue] = useState('');
    const [scanFeedback, setScanFeedback] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [searchFilter, setSearchFilter] = useState('');
    const scanInputRef = useRef(null);
    const itemRefs = useRef(new Map());
    useEffect(() => {
        scanInputRef.current?.focus();
    }, []);
    useEffect(() => {
        if (scanFeedback) {
            const timer = setTimeout(() => setScanFeedback(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [scanFeedback]);
    const pending = useMemo(() => count.items.filter((i) => i.actualQty === null), [count.items]);
    const counted = useMemo(() => count.items.filter((i) => i.actualQty !== null), [count.items]);
    const discrepancies = useMemo(() => count.items.filter((i) => i.difference !== null && i.difference !== 0), [count.items]);
    const countedCount = counted.length;
    const totalCount = count.items.length;
    const progress = totalCount > 0 ? (countedCount / totalCount) * 100 : 0;
    const allCounted = countedCount === totalCount && totalCount > 0;
    const tabItems = useMemo(() => {
        let items;
        switch (tab) {
            case 'pending':
                items = pending;
                break;
            case 'counted':
                items = counted;
                break;
            case 'discrepancies':
                items = discrepancies;
                break;
            default:
                items = pending;
        }
        if (searchFilter) {
            const q = searchFilter.toLowerCase();
            items = items.filter((i) => i.productName.toLowerCase().includes(q) ||
                i.sku.toLowerCase().includes(q) ||
                i.size.toLowerCase().includes(q) ||
                i.color.toLowerCase().includes(q));
        }
        return items;
    }, [tab, pending, counted, discrepancies, searchFilter]);
    const handleScan = useCallback((value) => {
        const query = value.trim().toLowerCase();
        if (!query)
            return;
        const found = count.items.find((i) => i.sku.toLowerCase() === query || (i.barcode && i.barcode.toLowerCase() === query));
        if (found) {
            if (found.actualQty === null) {
                setTab('pending');
            }
            else if (found.difference !== null && found.difference !== 0) {
                setTab('discrepancies');
            }
            else {
                setTab('counted');
            }
            setSearchFilter('');
            setScanFeedback({ type: 'success', message: `${found.productName} - ${found.size}/${found.color}` });
            requestAnimationFrame(() => {
                const inputEl = itemRefs.current.get(found.variantId);
                if (inputEl) {
                    inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    inputEl.focus();
                    inputEl.select();
                }
            });
        }
        else {
            setScanFeedback({ type: 'error', message: `No se encontro: "${value.trim()}"` });
        }
        setScanValue('');
    }, [count.items]);
    const handleUpdateQty = useCallback((variantId, qty) => {
        onUpdateItem(count.id, variantId, qty);
    }, [count.id, onUpdateItem]);
    const tabsConfig = [
        { key: 'pending', label: 'Pendientes', count: pending.length, icon: Clock },
        { key: 'counted', label: 'Contados', count: counted.length, icon: CheckCircle2 },
        { key: 'discrepancies', label: 'Discrepancias', count: discrepancies.length, icon: AlertTriangle },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: onBack, className: "p-2 rounded-xl border border-[#2A2A2A] text-[#6B7280] hover:text-white hover:border-[#3A3A3A] transition-all", children: _jsx(ArrowLeft, { className: "w-4 h-4" }) }), _jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-bold text-white flex items-center gap-2", children: [_jsx(MapPin, { className: "w-4 h-4 text-[#00FF88]" }), count.locationName] }), _jsxs("p", { className: "text-xs text-[#6B7280]", children: ["Iniciado: ", formatDate(count.startedAt)] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: () => setShowCancelModal(true), className: "px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all flex items-center gap-2", children: [_jsx(XCircle, { className: "w-4 h-4" }), "Cancelar"] }), _jsxs("button", { onClick: () => onComplete(count.id), disabled: !allCounted, className: "px-4 py-2 rounded-xl bg-[#00FF88] text-black text-sm font-semibold hover:bg-[#00FF88]/90 transition-all flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed", children: [_jsx(Check, { className: "w-4 h-4" }), "Completar"] })] })] }), _jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm text-[#9CA3AF]", children: "Progreso" }), _jsxs("span", { className: "text-sm font-mono text-white", children: [countedCount, "/", totalCount] })] }), _jsx("div", { className: "h-2 bg-[#1E1E1E] rounded-full overflow-hidden", children: _jsx("div", { className: "h-full rounded-full transition-all duration-500 ease-out", style: {
                                width: `${progress}%`,
                                backgroundColor: progress === 100 ? '#00FF88' : '#F59E0B',
                            } }) }), _jsxs("div", { className: "flex items-center justify-between mt-2 text-xs text-[#6B7280]", children: [_jsxs("span", { children: [pending.length, " pendientes"] }), _jsxs("span", { children: [discrepancies.length, " discrepancias"] })] })] }), _jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(ScanBarcode, { className: "w-5 h-5 text-[#00FF88] flex-shrink-0" }), _jsx("input", { ref: scanInputRef, type: "text", value: scanValue, onChange: (e) => setScanValue(e.target.value), onKeyDown: (e) => {
                                    if (e.key === 'Enter') {
                                        handleScan(scanValue);
                                    }
                                }, placeholder: "Escanear SKU o codigo de barras...", className: "flex-1 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2 text-white text-sm placeholder:text-[#4A4A4A] focus:outline-none focus:border-[#00FF88]/50 font-mono" })] }), scanFeedback && (_jsxs("div", { className: `mt-2 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${scanFeedback.type === 'success' ? 'bg-[#00FF88]/10 text-[#00FF88]' : 'bg-red-500/10 text-red-400'}`, children: [scanFeedback.type === 'success' ? (_jsx(CheckCircle2, { className: "w-3 h-3 flex-shrink-0" })) : (_jsx(XCircle, { className: "w-3 h-3 flex-shrink-0" })), scanFeedback.message] }))] }), _jsx("div", { className: "flex items-center gap-1 bg-[#111111] border border-[#1E1E1E] rounded-xl p-1", children: tabsConfig.map((t) => {
                    const Icon = t.icon;
                    const active = tab === t.key;
                    return (_jsxs("button", { onClick: () => setTab(t.key), className: `flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'bg-[#1E1E1E] text-white' : 'text-[#6B7280] hover:text-[#9CA3AF]'}`, children: [_jsx(Icon, { className: "w-3.5 h-3.5" }), t.label, _jsx("span", { className: `text-xs px-1.5 py-0.5 rounded-full font-mono ${active ? 'bg-[#2A2A2A] text-white' : 'bg-[#1E1E1E] text-[#6B7280]'}`, children: t.count })] }, t.key));
                }) }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A4A]" }), _jsx("input", { type: "text", value: searchFilter, onChange: (e) => setSearchFilter(e.target.value), placeholder: "Filtrar items...", className: "w-full bg-[#111111] border border-[#1E1E1E] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-[#4A4A4A] focus:outline-none focus:border-[#2A2A2A]" })] }), _jsx("div", { className: "space-y-2", children: tabItems.length === 0 ? (_jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-8 text-center", children: [_jsx(Package, { className: "w-8 h-8 text-[#3A3A3A] mx-auto mb-2" }), _jsx("p", { className: "text-sm text-[#6B7280]", children: tab === 'pending'
                                ? 'Todos los items han sido contados'
                                : tab === 'counted'
                                    ? 'No hay items contados aun'
                                    : 'No hay discrepancias' })] })) : (tabItems.map((item) => {
                    const diff = item.difference;
                    const hasDiff = diff !== null && diff !== 0;
                    return (_jsxs("div", { className: `flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${item.actualQty !== null
                            ? hasDiff
                                ? 'bg-[#F59E0B]/5 border-[#F59E0B]/20'
                                : 'bg-[#00FF88]/5 border-[#00FF88]/20'
                            : 'bg-[#0F0F0F] border-[#1E1E1E]'}`, children: [_jsx("div", { className: "flex-shrink-0", children: item.actualQty === null ? (_jsx("div", { className: "w-6 h-6 rounded-full border-2 border-[#3A3A3A]" })) : hasDiff ? (_jsx(AlertTriangle, { className: "w-5 h-5 text-[#F59E0B]" })) : (_jsx(CheckCircle2, { className: "w-5 h-5 text-[#00FF88]" })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-sm font-medium text-white truncate", children: item.productName }), _jsxs("div", { className: "flex items-center gap-2 mt-0.5", children: [_jsx("span", { className: "text-xs text-[#6B7280] font-mono", children: item.sku }), _jsx("span", { className: "text-xs text-[#4A4A4A]", children: "|" }), _jsxs("span", { className: "text-xs text-[#6B7280]", children: [item.size, " / ", item.color] })] })] }), _jsxs("div", { className: "text-center flex-shrink-0 w-16", children: [_jsx("div", { className: "text-xs text-[#6B7280] mb-0.5", children: "Esperado" }), _jsx("div", { className: "text-sm font-semibold text-[#9CA3AF]", children: item.expectedQty })] }), _jsxs("div", { className: "flex-shrink-0 w-20", children: [_jsx("div", { className: "text-xs text-[#6B7280] mb-0.5 text-center", children: "Actual" }), _jsx("input", { ref: (el) => {
                                            if (el) {
                                                itemRefs.current.set(item.variantId, el);
                                            }
                                        }, type: "number", min: 0, value: item.actualQty ?? '', onChange: (e) => {
                                            const val = e.target.value;
                                            if (val === '') {
                                                handleUpdateQty(item.variantId, null);
                                            }
                                            else {
                                                const num = parseInt(val, 10);
                                                if (!isNaN(num) && num >= 0) {
                                                    handleUpdateQty(item.variantId, num);
                                                }
                                            }
                                        }, placeholder: "-", className: "w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-1.5 text-white text-sm text-center font-mono placeholder:text-[#3A3A3A] focus:outline-none focus:border-[#00FF88]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" })] }), _jsxs("div", { className: "text-center flex-shrink-0 w-16", children: [_jsx("div", { className: "text-xs text-[#6B7280] mb-0.5", children: "Dif." }), diff !== null ? (_jsxs("div", { className: `text-sm font-bold font-mono ${diff > 0 ? 'text-[#00FF88]' : diff < 0 ? 'text-red-400' : 'text-[#6B7280]'}`, children: [diff > 0 ? '+' : '', diff] })) : (_jsx("div", { className: "text-sm text-[#3A3A3A]", children: "-" }))] })] }, item.variantId));
                })) }), showCancelModal && (_jsx(CancelModal, { onClose: () => setShowCancelModal(false), onConfirm: () => {
                    setShowCancelModal(false);
                    onCancel(count.id);
                } }))] }));
}
// ─── Main Component ───
export default function PhysicalCount() {
    const products = useInventoryStore((s) => s.products);
    const addStock = useInventoryStore((s) => s.addStock);
    const [counts, setCounts] = useState([]);
    const [activeCountId, setActiveCountId] = useState(null);
    const [showNewModal, setShowNewModal] = useState(false);
    const [completedCount, setCompletedCount] = useState(null);
    const activeCount = useMemo(() => counts.find((c) => c.id === activeCountId) ?? null, [counts, activeCountId]);
    // ─── Actions ───
    const handleStartCount = useCallback((locationId, locationName, notes) => {
        const items = [];
        for (const product of products) {
            for (const variant of product.variants) {
                items.push({
                    variantId: variant.id,
                    productName: `${product.emoji} ${product.name}`,
                    sku: variant.sku,
                    size: variant.size,
                    color: variant.color,
                    barcode: variant.barcode,
                    expectedQty: variant.stock,
                    actualQty: null,
                    difference: null,
                });
            }
        }
        const newCount = {
            id: generateId(),
            locationId,
            locationName,
            status: 'IN_PROGRESS',
            startedAt: new Date().toISOString(),
            notes,
            items,
        };
        setCounts((prev) => [newCount, ...prev]);
        setActiveCountId(newCount.id);
        setShowNewModal(false);
    }, [products]);
    const handleUpdateItem = useCallback((countId, variantId, qty) => {
        setCounts((prev) => prev.map((c) => {
            if (c.id !== countId)
                return c;
            return {
                ...c,
                items: c.items.map((item) => {
                    if (item.variantId !== variantId)
                        return item;
                    const actualQty = qty;
                    const difference = actualQty !== null ? actualQty - item.expectedQty : null;
                    return { ...item, actualQty, difference };
                }),
            };
        }));
    }, []);
    const handleComplete = useCallback((countId) => {
        setCounts((prev) => prev.map((c) => {
            if (c.id !== countId)
                return c;
            // Apply stock adjustments for discrepancies
            for (const item of c.items) {
                if (item.actualQty !== null && item.difference !== null && item.difference !== 0) {
                    addStock(item.variantId, item.difference, 'Ajuste por conteo fisico');
                }
            }
            const completed = {
                ...c,
                status: 'COMPLETED',
                completedAt: new Date().toISOString(),
            };
            // Show completion modal after state update
            setTimeout(() => setCompletedCount(completed), 0);
            return completed;
        }));
        setActiveCountId(null);
    }, [addStock]);
    const handleCancel = useCallback((countId) => {
        setCounts((prev) => prev.map((c) => (c.id === countId ? { ...c, status: 'CANCELLED' } : c)));
        setActiveCountId(null);
    }, []);
    // ─── Render ───
    if (activeCount && activeCount.status === 'IN_PROGRESS') {
        return (_jsx(ActiveCountView, { count: activeCount, onUpdateItem: handleUpdateItem, onComplete: handleComplete, onCancel: handleCancel, onBack: () => setActiveCountId(null) }));
    }
    return (_jsxs(_Fragment, { children: [_jsx(CountListView, { counts: counts, onNewCount: () => setShowNewModal(true), onSelectCount: (id) => setActiveCountId(id) }), showNewModal && (_jsx(NewCountModal, { onClose: () => setShowNewModal(false), onStart: handleStartCount })), completedCount && (_jsx(CompletionModal, { count: completedCount, onClose: () => setCompletedCount(null) }))] }));
}
