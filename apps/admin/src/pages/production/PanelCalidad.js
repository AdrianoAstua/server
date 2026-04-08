import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { ScanLine, CheckCircle, XCircle, AlertTriangle, Clock, Camera, Upload, MessageSquare, Shield, ChevronDown, ChevronUp, } from 'lucide-react';
// ─── Mock Data ──────────────────────────────────────────────────────────────
const MOCK_PIECES = {
    'VONEB-P-00101': {
        barcode: 'VONEB-P-00101', workOrderNumber: 'MTO-2026-0038',
        productType: 'Jersey Ciclismo', description: 'Jersey equipo Volcan',
        variant: 'Talla XL - Azul/Naranja', designerName: 'Ana Lopez',
    },
    'VONEB-P-00105': {
        barcode: 'VONEB-P-00105', workOrderNumber: 'MTO-2026-0033',
        productType: 'Jersey Ciclismo', description: 'Jersey Vuelta CR 2026',
        variant: 'Talla L - Multicolor', designerName: 'Ana Lopez',
    },
    'VONEB-P-00108': {
        barcode: 'VONEB-P-00108', workOrderNumber: 'MTO-2026-0034',
        productType: 'Gorra Running', description: 'Gorra maraton femenino',
        variant: 'Unica - Rosa/Blanco', designerName: 'Daniel Arias',
    },
    'VONEB-P-00109': {
        barcode: 'VONEB-P-00109', workOrderNumber: 'MTO-2026-0041',
        productType: 'Jersey Ciclismo', description: 'Jersey Ruta CR',
        variant: 'Talla L - Azul/Blanco', designerName: 'Ana Lopez',
    },
};
const MOCK_RECENT = [
    { id: 'qc-1', workOrderNumber: 'MTO-2026-0030', barcode: 'VONEB-P-00090', productType: 'Camiseta Running', result: 'PASSED', timestamp: '2026-04-07T09:45:00Z', inspector: 'Marco Vega' },
    { id: 'qc-2', workOrderNumber: 'MTO-2026-0029', barcode: 'VONEB-P-00088', productType: 'Jersey Ciclismo', result: 'PASSED', timestamp: '2026-04-07T09:20:00Z', inspector: 'Marco Vega' },
    { id: 'qc-3', workOrderNumber: 'MTO-2026-0031', barcode: 'VONEB-P-00092', productType: 'Bibshort', result: 'FAILED', timestamp: '2026-04-07T08:55:00Z', inspector: 'Marco Vega' },
    { id: 'qc-4', workOrderNumber: 'MTO-2026-0028', barcode: 'VONEB-P-00085', productType: 'Top Natacion', result: 'PASSED', timestamp: '2026-04-07T08:30:00Z', inspector: 'Marco Vega' },
    { id: 'qc-5', workOrderNumber: 'MTO-2026-0027', barcode: 'VONEB-P-00083', productType: 'Camiseta Running', result: 'PASSED_WITH_OBSERVATIONS', timestamp: '2026-04-07T08:10:00Z', inspector: 'Marco Vega' },
    { id: 'qc-6', workOrderNumber: 'MTO-2026-0032', barcode: 'VONEB-P-00094', productType: 'Uniforme Futsal', result: 'FAILED', timestamp: '2026-04-07T07:40:00Z', inspector: 'Marco Vega' },
    { id: 'qc-7', workOrderNumber: 'MTO-2026-0026', barcode: 'VONEB-P-00080', productType: 'Jersey Trail', result: 'PASSED', timestamp: '2026-04-07T07:15:00Z', inspector: 'Marco Vega' },
    { id: 'qc-8', workOrderNumber: 'MTO-2026-0025', barcode: 'VONEB-P-00078', productType: 'Gorra Running', result: 'PASSED', timestamp: '2026-04-07T06:50:00Z', inspector: 'Marco Vega' },
];
const DEFAULT_CHECKLIST = [
    { label: 'Colores correctos', passed: null, notes: '' },
    { label: 'Alineacion del diseno', passed: null, notes: '' },
    { label: 'Medidas correctas', passed: null, notes: '' },
    { label: 'Acabado limpio (sin manchas)', passed: null, notes: '' },
    { label: 'Costuras correctas', passed: null, notes: '' },
    { label: 'Etiqueta presente', passed: null, notes: '' },
    { label: 'Material sin defectos', passed: null, notes: '' },
];
// ─── Helpers ────────────────────────────────────────────────────────────────
function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
}
const RESULT_CONFIG = {
    PASSED: { label: 'Aprobado', bg: 'bg-[#00FF88]/10', text: 'text-[#00FF88]' },
    FAILED: { label: 'Rechazado', bg: 'bg-red-500/10', text: 'text-red-400' },
    PASSED_WITH_OBSERVATIONS: { label: 'Con Obs.', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
};
// ─── Component ──────────────────────────────────────────────────────────────
export default function PanelCalidad() {
    const [scanValue, setScanValue] = useState('');
    const [scannedPiece, setScannedPiece] = useState(null);
    const [lastScanError, setLastScanError] = useState(null);
    const [checklist, setChecklist] = useState([]);
    const [generalNotes, setGeneralNotes] = useState('');
    const [photos, setPhotos] = useState([]);
    const [recentInspections, setRecentInspections] = useState(MOCK_RECENT);
    const [showRecent, setShowRecent] = useState(true);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    // Autofocus
    useEffect(() => {
        if (!scannedPiece)
            inputRef.current?.focus();
    }, [scannedPiece]);
    // Clear scan error
    useEffect(() => {
        if (lastScanError) {
            const t = setTimeout(() => setLastScanError(null), 3000);
            return () => clearTimeout(t);
        }
    }, [lastScanError]);
    // Stats
    const stats = useMemo(() => {
        const passed = recentInspections.filter((r) => r.result === 'PASSED' || r.result === 'PASSED_WITH_OBSERVATIONS').length;
        const failed = recentInspections.filter((r) => r.result === 'FAILED').length;
        const total = recentInspections.length;
        const rate = total > 0 ? Math.round((passed / total) * 100) : 0;
        return { passed, failed, total, rate };
    }, [recentInspections]);
    // Handle scan
    const handleScan = useCallback((value) => {
        const code = value.trim();
        if (!code)
            return;
        const piece = MOCK_PIECES[code];
        if (!piece) {
            setLastScanError(`Pieza no encontrada: "${code}"`);
            setScanValue('');
            inputRef.current?.focus();
            return;
        }
        setScannedPiece(piece);
        setChecklist(DEFAULT_CHECKLIST.map((item, i) => ({ ...item, id: `cl-${i}` })));
        setGeneralNotes('');
        setPhotos([]);
        setLastScanError(null);
        setScanValue('');
    }, []);
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleScan(scanValue);
        }
    }, [handleScan, scanValue]);
    // Toggle checklist item
    const toggleItem = (id, value) => {
        setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, passed: item.passed === value ? null : value } : item)));
    };
    const updateItemNotes = (id, notes) => {
        setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, notes } : item)));
    };
    // Photo upload handler
    const handlePhotoUpload = () => {
        fileInputRef.current?.click();
    };
    const handleFileChange = (e) => {
        const files = e.target.files;
        if (!files)
            return;
        const names = Array.from(files).map((f) => f.name);
        setPhotos((prev) => [...prev, ...names]);
        e.target.value = '';
    };
    // Submit inspection
    const submitInspection = (result) => {
        if (!scannedPiece)
            return;
        const record = {
            id: `qc-${Date.now()}`,
            workOrderNumber: scannedPiece.workOrderNumber,
            barcode: scannedPiece.barcode,
            productType: scannedPiece.productType,
            result,
            timestamp: new Date().toISOString(),
            inspector: 'Marco Vega',
        };
        setRecentInspections((prev) => [record, ...prev]);
        setScannedPiece(null);
        setChecklist([]);
        setGeneralNotes('');
        setPhotos([]);
        inputRef.current?.focus();
    };
    // Check if all items have been evaluated
    const allChecked = checklist.every((item) => item.passed !== null);
    const allPassed = checklist.every((item) => item.passed === true);
    return (_jsxs("div", { className: "h-full flex flex-col bg-[#0A0A0A]", children: [_jsxs("div", { className: "flex-shrink-0 px-6 py-5 border-b border-[#1E1E1E]", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-[#00FF88]/10 flex items-center justify-center", children: _jsx(Shield, { className: "w-5 h-5 text-[#00FF88]" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-white", children: "Control de Calidad" }), _jsx("p", { className: "text-sm text-[#6B7280]", children: "Escanear pieza para inspeccionar" })] })] }), !scannedPiece && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "relative", children: [_jsx(ScanLine, { className: "absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-[#6B7280]" }), _jsx("input", { ref: inputRef, value: scanValue, onChange: (e) => setScanValue(e.target.value), onKeyDown: handleKeyDown, placeholder: "Escanear codigo de barras de la pieza...", autoFocus: true, className: "w-full pl-14 pr-6 py-5 rounded-2xl text-xl font-mono border-2 border-[#1E1E1E] bg-[#0F0F0F] text-white placeholder:text-[#4B5563] focus:outline-none focus:border-[#00FF88]/50 transition-colors" })] }), lastScanError && (_jsxs("div", { className: "mt-3 flex items-center gap-3 px-5 py-3 rounded-xl bg-red-500/5 border border-red-500/20", children: [_jsx(AlertTriangle, { className: "w-5 h-5 text-red-400 flex-shrink-0" }), _jsx("p", { className: "text-sm text-red-400", children: lastScanError })] }))] }))] }), scannedPiece ? (_jsxs("div", { className: "flex-1 overflow-y-auto px-6 py-4 space-y-4", children: [_jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("span", { className: "text-xs font-mono text-[#00FF88]", children: scannedPiece.barcode }), _jsx("span", { className: "text-xs text-[#6B7280]", children: scannedPiece.workOrderNumber })] }), _jsx("h3", { className: "text-lg font-semibold text-white", children: scannedPiece.productType }), _jsx("p", { className: "text-sm text-[#9CA3AF] mt-1", children: scannedPiece.description }), _jsxs("div", { className: "flex items-center gap-4 mt-3 pt-3 border-t border-[#1E1E1E]", children: [_jsxs("span", { className: "text-xs text-[#6B7280]", children: ["Variante: ", _jsx("span", { className: "text-white", children: scannedPiece.variant })] }), _jsxs("span", { className: "text-xs text-[#6B7280]", children: ["Diseno: ", _jsx("span", { className: "text-white", children: scannedPiece.designerName })] })] })] }), _jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-5", children: [_jsx("h4", { className: "text-sm font-semibold text-white mb-4", children: "Lista de Verificacion" }), _jsx("div", { className: "space-y-3", children: checklist.map((item) => (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: () => toggleItem(item.id, true), className: `w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 ${item.passed === true
                                                        ? 'bg-[#00FF88]/20 border-2 border-[#00FF88]/40'
                                                        : 'bg-[#0A0A0A] border-2 border-[#1E1E1E] hover:border-[#00FF88]/30'}`, children: _jsx(CheckCircle, { className: `w-5 h-5 ${item.passed === true ? 'text-[#00FF88]' : 'text-[#4B5563]'}` }) }), _jsx("button", { onClick: () => toggleItem(item.id, false), className: `w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 ${item.passed === false
                                                        ? 'bg-red-500/20 border-2 border-red-500/40'
                                                        : 'bg-[#0A0A0A] border-2 border-[#1E1E1E] hover:border-red-500/30'}`, children: _jsx(XCircle, { className: `w-5 h-5 ${item.passed === false ? 'text-red-400' : 'text-[#4B5563]'}` }) }), _jsx("span", { className: `text-sm flex-1 ${item.passed === true ? 'text-[#00FF88]' : item.passed === false ? 'text-red-400' : 'text-white'}`, children: item.label })] }), item.passed === false && (_jsx("input", { value: item.notes, onChange: (e) => updateItemNotes(item.id, e.target.value), placeholder: "Describir el problema...", className: "w-full ml-[108px] text-xs px-3 py-2 rounded-lg bg-[#0A0A0A] border border-red-500/20 text-white placeholder:text-[#4B5563] focus:outline-none focus:border-red-500/40", style: { width: 'calc(100% - 108px)' } }))] }, item.id))) })] }), _jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-5", children: [_jsx("h4", { className: "text-sm font-semibold text-white mb-3", children: "Fotos de Evidencia" }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", multiple: true, className: "hidden", onChange: handleFileChange }), _jsxs("button", { onClick: handlePhotoUpload, className: "w-full py-8 rounded-xl border-2 border-dashed border-[#2A2A2A] hover:border-[#00FF88]/30 transition-colors flex flex-col items-center gap-2 active:scale-[0.98]", children: [_jsx(Upload, { className: "w-8 h-8 text-[#6B7280]" }), _jsx("span", { className: "text-sm text-[#9CA3AF]", children: "Toca para subir fotos" }), _jsx("span", { className: "text-xs text-[#6B7280]", children: "o arrastra archivos aqui" })] }), photos.length > 0 && (_jsx("div", { className: "mt-3 space-y-1", children: photos.map((name, i) => (_jsxs("div", { className: "flex items-center gap-2 text-xs text-[#9CA3AF] bg-[#0A0A0A] rounded-lg px-3 py-2", children: [_jsx(Camera, { className: "w-3 h-3 text-[#00FF88]" }), _jsx("span", { className: "truncate", children: name })] }, i))) }))] }), _jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-5", children: [_jsxs("h4", { className: "text-sm font-semibold text-white mb-3 flex items-center gap-2", children: [_jsx(MessageSquare, { className: "w-4 h-4 text-[#6B7280]" }), "Notas Generales"] }), _jsx("textarea", { value: generalNotes, onChange: (e) => setGeneralNotes(e.target.value), placeholder: "Observaciones adicionales sobre la pieza...", rows: 3, className: "w-full text-sm px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#1E1E1E] text-white placeholder:text-[#4B5563] focus:outline-none focus:border-[#00FF88]/30 resize-none" })] }), _jsxs("div", { className: "flex gap-4 pb-4", children: [_jsxs("button", { onClick: () => submitInspection(allPassed ? 'PASSED' : 'PASSED_WITH_OBSERVATIONS'), disabled: !allChecked, className: `flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl text-lg font-bold transition-all active:scale-[0.98] ${allChecked
                                    ? 'bg-[#00FF88]/20 text-[#00FF88] border-2 border-[#00FF88]/30 hover:bg-[#00FF88]/30'
                                    : 'bg-[#111111] text-[#4B5563] border-2 border-[#1E1E1E] cursor-not-allowed'}`, children: [_jsx(CheckCircle, { className: "w-6 h-6" }), "APROBAR"] }), _jsxs("button", { onClick: () => submitInspection('FAILED'), disabled: !allChecked, className: `flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl text-lg font-bold transition-all active:scale-[0.98] ${allChecked
                                    ? 'bg-red-500/20 text-red-400 border-2 border-red-500/30 hover:bg-red-500/30'
                                    : 'bg-[#111111] text-[#4B5563] border-2 border-[#1E1E1E] cursor-not-allowed'}`, children: [_jsx(XCircle, { className: "w-6 h-6" }), "RECHAZAR"] })] })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex-shrink-0 px-6 py-4 border-b border-[#1E1E1E]", children: _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl px-4 py-3 flex items-center gap-3", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-[#00FF88]" }), _jsxs("div", { children: [_jsx("p", { className: "text-lg font-bold text-[#00FF88]", children: stats.passed }), _jsx("p", { className: "text-[10px] text-[#6B7280]", children: "Aprobadas hoy" })] })] }), _jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl px-4 py-3 flex items-center gap-3", children: [_jsx(XCircle, { className: "w-5 h-5 text-red-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-lg font-bold text-red-400", children: stats.failed }), _jsx("p", { className: "text-[10px] text-[#6B7280]", children: "Rechazadas hoy" })] })] }), _jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl px-4 py-3 flex items-center gap-3", children: [_jsx(Shield, { className: "w-5 h-5 text-[#3B82F6]" }), _jsxs("div", { children: [_jsxs("p", { className: "text-lg font-bold text-white", children: [stats.rate, "%"] }), _jsx("p", { className: "text-[10px] text-[#6B7280]", children: "Tasa aprobacion" })] })] })] }) }), _jsxs("div", { className: "flex-1 overflow-y-auto px-6 py-4", children: [_jsxs("button", { onClick: () => setShowRecent(!showRecent), className: "flex items-center justify-between w-full mb-3", children: [_jsxs("h2", { className: "text-xs font-semibold text-[#6B7280] uppercase tracking-wider", children: ["Inspecciones Recientes (", recentInspections.length, ")"] }), showRecent ? (_jsx(ChevronUp, { className: "w-4 h-4 text-[#6B7280]" })) : (_jsx(ChevronDown, { className: "w-4 h-4 text-[#6B7280]" }))] }), showRecent && (_jsx("div", { className: "space-y-2", children: recentInspections.map((record) => {
                                    const cfg = RESULT_CONFIG[record.result];
                                    return (_jsxs("div", { className: "flex items-center gap-4 bg-[#111111] border border-[#1E1E1E] rounded-xl px-4 py-3 hover:border-[#2A2A2A] transition-colors", children: [_jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`, children: record.result === 'FAILED' ? (_jsx(XCircle, { className: `w-5 h-5 ${cfg.text}` })) : (_jsx(CheckCircle, { className: `w-5 h-5 ${cfg.text}` })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm text-white font-medium truncate", children: record.productType }), _jsxs("p", { className: "text-xs text-[#6B7280]", children: [record.workOrderNumber, " - ", record.barcode] })] }), _jsx("span", { className: `text-[10px] font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`, children: cfg.label }), _jsxs("span", { className: "text-xs text-[#6B7280] flex items-center gap-1 flex-shrink-0", children: [_jsx(Clock, { className: "w-3 h-3" }), formatTime(record.timestamp)] })] }, record.id));
                                }) }))] })] }))] }));
}
