import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { ScanLine, Package, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle, AlertTriangle, Trash2, RotateCcw, Camera, X, Video } from 'lucide-react';
import { useInventoryStore } from '@/store/inventoryStore';
import { Html5Qrcode } from 'html5-qrcode';
// ─── Camera Scanner (cross-browser: Chrome, Firefox, Safari, Edge, mobile) ──
const SCANNER_DIV_ID = 'voneb-barcode-reader';
function CameraScanner({ onDetect, onClose }) {
    const scannerRef = useRef(null);
    const lastCodeRef = useRef('');
    const cooldownRef = useRef(false);
    const [error, setError] = useState(null);
    const [scanning, setScanning] = useState(false);
    useEffect(() => {
        let mounted = true;
        async function startScanner() {
            try {
                const scanner = new Html5Qrcode(SCANNER_DIV_ID, { verbose: false });
                scannerRef.current = scanner;
                await scanner.start({ facingMode: 'environment' }, {
                    fps: 10,
                    qrbox: { width: 280, height: 160 },
                    aspectRatio: 16 / 9,
                    disableFlip: false,
                }, (decodedText) => {
                    // Success callback — barcode detected
                    if (cooldownRef.current || decodedText === lastCodeRef.current)
                        return;
                    lastCodeRef.current = decodedText;
                    cooldownRef.current = true;
                    onDetect(decodedText);
                    // Cooldown 1.5s to prevent duplicate scans
                    setTimeout(() => {
                        cooldownRef.current = false;
                        lastCodeRef.current = '';
                    }, 1500);
                }, () => {
                    // Error callback — no code found this frame (ignore)
                });
                if (mounted)
                    setScanning(true);
            }
            catch (err) {
                console.error('Camera scanner error:', err);
                if (mounted) {
                    const msg = err instanceof Error ? err.message : String(err);
                    if (msg.includes('Permission') || msg.includes('NotAllowed')) {
                        setError('Permiso de camara denegado. Habilita el acceso en la configuracion del navegador.');
                    }
                    else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
                        setError('No se encontro ninguna camara en este dispositivo.');
                    }
                    else {
                        setError(`Error al iniciar la camara: ${msg}`);
                    }
                }
            }
        }
        startScanner();
        return () => {
            mounted = false;
            const scanner = scannerRef.current;
            if (scanner) {
                scanner.stop().then(() => scanner.clear()).catch(() => { });
            }
        };
    }, [onDetect]);
    const handleClose = useCallback(() => {
        const scanner = scannerRef.current;
        if (scanner) {
            scanner.stop().then(() => scanner.clear()).catch(() => { });
        }
        onClose();
    }, [onClose]);
    return (_jsxs("div", { className: "fixed inset-0 z-50 bg-black flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-3 bg-black/90 border-b border-white/10", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Video, { className: "w-5 h-5 text-[#00FF88]" }), _jsx("span", { className: "text-white font-medium text-sm", children: "Escaner de Camara" }), scanning && (_jsxs("span", { className: "flex items-center gap-1 text-xs text-[#00FF88]", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" }), "Activo"] }))] }), _jsx("button", { onClick: handleClose, className: "p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors", children: _jsx(X, { className: "w-5 h-5 text-white" }) })] }), _jsx("div", { className: "flex-1 flex flex-col items-center justify-center relative overflow-hidden", children: error ? (_jsxs("div", { className: "text-center px-8", children: [_jsx(AlertTriangle, { className: "w-12 h-12 text-red-400 mx-auto mb-4" }), _jsx("p", { className: "text-red-400 text-sm mb-4", children: error }), _jsx("button", { onClick: handleClose, className: "px-4 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20", children: "Cerrar" })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { id: SCANNER_DIV_ID, className: "w-full max-w-lg", style: { minHeight: '300px' } }), _jsx("p", { className: "text-white/50 text-sm mt-4", children: "Apunta la camara al codigo de barras del producto" }), _jsx("p", { className: "text-white/30 text-xs mt-1", children: "Compatible con Code128, EAN-13, EAN-8, QR, UPC-A, Code39" })] })) })] }));
}
// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
// ─── Component ───────────────────────────────────────────────────────────────
export default function LocalSales() {
    const products = useInventoryStore((s) => s.products);
    const addStock = useInventoryStore((s) => s.addStock);
    const [mode, setMode] = useState('salida');
    const [scanHistory, setScanHistory] = useState([]);
    const [lastScan, setLastScan] = useState(null);
    const [scanValue, setScanValue] = useState('');
    const [cameraOpen, setCameraOpen] = useState(false);
    const inputRef = useRef(null);
    // Always focus the scan input
    useEffect(() => {
        inputRef.current?.focus();
    }, []);
    // Clear feedback after 3s
    useEffect(() => {
        if (lastScan) {
            const timer = setTimeout(() => setLastScan(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [lastScan]);
    // Stats
    const todayStats = useMemo(() => {
        const salidas = scanHistory.filter((r) => r.type === 'salida');
        const entradas = scanHistory.filter((r) => r.type === 'entrada');
        return {
            totalScans: scanHistory.length,
            salidas: salidas.reduce((sum, r) => sum + r.quantity, 0),
            entradas: entradas.reduce((sum, r) => sum + r.quantity, 0),
        };
    }, [scanHistory]);
    // Find variant by barcode or SKU
    const findVariant = useCallback((code) => {
        const normalized = code.trim();
        if (!normalized)
            return null;
        for (const product of products) {
            for (const variant of product.variants) {
                if (variant.barcode === normalized ||
                    variant.barcode?.toLowerCase() === normalized.toLowerCase() ||
                    variant.sku === normalized ||
                    variant.sku.toLowerCase() === normalized.toLowerCase()) {
                    return { product, variant };
                }
            }
        }
        return null;
    }, [products]);
    // Handle scan (Enter key)
    const handleScan = useCallback((value) => {
        const code = value.trim();
        if (!code)
            return;
        const match = findVariant(code);
        if (!match) {
            setLastScan({ type: 'error', message: `No se encontro producto con codigo "${code}"` });
            setScanValue('');
            inputRef.current?.focus();
            return;
        }
        const { product, variant } = match;
        const available = variant.stock - variant.reserved;
        // For salida, check stock
        if (mode === 'salida' && available <= 0) {
            setLastScan({
                type: 'error',
                message: `Sin stock disponible para ${product.name} (${variant.size}/${variant.color})`,
                product: `${product.emoji} ${product.name}`,
            });
            setScanValue('');
            inputRef.current?.focus();
            return;
        }
        // Apply stock change
        const delta = mode === 'salida' ? -1 : 1;
        const reason = mode === 'salida' ? 'Venta — escaneo POS' : 'Entrada — escaneo POS';
        addStock(variant.id, delta, reason);
        // Record the scan
        const record = {
            id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            variantId: variant.id,
            productName: product.name,
            emoji: product.emoji,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            type: mode,
            quantity: 1,
            timestamp: new Date().toISOString(),
        };
        setScanHistory((prev) => [record, ...prev]);
        setLastScan({
            type: 'success',
            message: mode === 'salida'
                ? `Salida registrada — stock: ${available - 1}`
                : `Entrada registrada — stock: ${variant.stock + 1}`,
            product: `${product.emoji} ${product.name} (${variant.size}/${variant.color})`,
        });
        setScanValue('');
        inputRef.current?.focus();
    }, [findVariant, mode, addStock]);
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleScan(scanValue);
        }
    }, [handleScan, scanValue]);
    // Handle camera detection
    const handleCameraDetect = useCallback((code) => {
        handleScan(code);
        // Don't close camera — keep scanning
    }, [handleScan]);
    const undoLastScan = useCallback(() => {
        if (scanHistory.length === 0)
            return;
        const last = scanHistory[0];
        // Reverse the stock change
        const reverseDelta = last.type === 'salida' ? 1 : -1;
        addStock(last.variantId, reverseDelta, 'Deshacer — escaneo POS');
        setScanHistory((prev) => prev.slice(1));
        setLastScan({ type: 'success', message: `Deshecho: ${last.productName} (${last.size}/${last.color})` });
    }, [scanHistory, addStock]);
    return (_jsxs("div", { className: "h-full flex flex-col bg-[#0A0A0A]", children: [cameraOpen && (_jsx(CameraScanner, { onDetect: handleCameraDetect, onClose: () => setCameraOpen(false) })), _jsxs("div", { className: "flex-shrink-0 border-b border-[#1E1E1E] px-6 py-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-[#00FF88]/10 flex items-center justify-center", children: _jsx(ScanLine, { className: "w-5 h-5 text-[#00FF88]" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-white", children: "Registro por Escaneo" }), _jsx("p", { className: "text-sm text-[#6B7280]", children: "Escanea el codigo de barras para registrar movimiento" })] })] }), _jsxs("div", { className: "flex items-center gap-1 bg-[#111111] border border-[#1E1E1E] rounded-lg p-1", children: [_jsxs("button", { onClick: () => setMode('salida'), className: `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'salida'
                                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                            : 'text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A]'}`, children: [_jsx(ArrowDownCircle, { className: "w-4 h-4" }), "Salida (Venta)"] }), _jsxs("button", { onClick: () => setMode('entrada'), className: `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'entrada'
                                            ? 'bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20'
                                            : 'text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A]'}`, children: [_jsx(ArrowUpCircle, { className: "w-4 h-4" }), "Entrada"] })] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-3 mb-4", children: [_jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-lg px-4 py-3 flex items-center gap-3", children: [_jsx(Package, { className: "w-5 h-5 text-[#3B82F6]" }), _jsxs("div", { children: [_jsx("p", { className: "text-lg font-bold text-white", children: todayStats.totalScans }), _jsx("p", { className: "text-xs text-[#6B7280]", children: "Escaneos hoy" })] })] }), _jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-lg px-4 py-3 flex items-center gap-3", children: [_jsx(ArrowDownCircle, { className: "w-5 h-5 text-red-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-lg font-bold text-red-400", children: todayStats.salidas }), _jsx("p", { className: "text-xs text-[#6B7280]", children: "Salidas" })] })] }), _jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-lg px-4 py-3 flex items-center gap-3", children: [_jsx(ArrowUpCircle, { className: "w-5 h-5 text-[#00FF88]" }), _jsxs("div", { children: [_jsx("p", { className: "text-lg font-bold text-[#00FF88]", children: todayStats.entradas }), _jsx("p", { className: "text-xs text-[#6B7280]", children: "Entradas" })] })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(ScanLine, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" }), _jsx("input", { ref: inputRef, value: scanValue, onChange: (e) => setScanValue(e.target.value), onKeyDown: handleKeyDown, placeholder: mode === 'salida' ? 'Escanear barcode o escribir SKU...' : 'Escanear barcode o escribir SKU...', autoFocus: true, className: `w-full pl-12 pr-12 py-4 rounded-xl text-lg font-mono border-2 transition-colors bg-[#0F0F0F] text-white placeholder:text-[#4B5563] focus:outline-none ${mode === 'salida'
                                            ? 'border-red-500/30 focus:border-red-500/60'
                                            : 'border-[#00FF88]/30 focus:border-[#00FF88]/60'}` }), scanHistory.length > 0 && (_jsx("button", { onClick: undoLastScan, title: "Deshacer ultimo escaneo", className: "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[#6B7280] hover:text-[#F59E0B] hover:bg-[#F59E0B]/10 transition-colors", children: _jsx(RotateCcw, { className: "w-5 h-5" }) }))] }), _jsx("button", { onClick: () => setCameraOpen(true), className: `flex-shrink-0 w-16 rounded-xl border-2 flex items-center justify-center transition-all ${cameraOpen
                                    ? 'bg-[#00FF88]/10 border-[#00FF88]/40 text-[#00FF88]'
                                    : 'bg-[#111111] border-[#2A2A2A] text-[#9CA3AF] hover:text-white hover:border-[#3A3A3A]'}`, title: "Abrir camara para escanear", children: _jsx(Camera, { className: "w-6 h-6" }) })] }), lastScan && (_jsxs("div", { className: `mt-3 flex items-center gap-3 px-4 py-3 rounded-lg border ${lastScan.type === 'success'
                            ? 'bg-[#00FF88]/5 border-[#00FF88]/20'
                            : 'bg-red-500/5 border-red-500/20'}`, children: [lastScan.type === 'success' ? (_jsx(CheckCircle, { className: "w-5 h-5 text-[#00FF88] flex-shrink-0" })) : (_jsx(AlertTriangle, { className: "w-5 h-5 text-red-400 flex-shrink-0" })), _jsxs("div", { children: [lastScan.product && (_jsx("p", { className: `text-sm font-medium ${lastScan.type === 'success' ? 'text-[#00FF88]' : 'text-red-400'}`, children: lastScan.product })), _jsx("p", { className: `text-xs ${lastScan.type === 'success' ? 'text-[#9CA3AF]' : 'text-red-300'}`, children: lastScan.message })] })] }))] }), _jsxs("div", { className: "flex-1 overflow-y-auto px-6 py-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h2", { className: "text-sm font-semibold text-[#6B7280] uppercase tracking-wider", children: "Historial de escaneos" }), scanHistory.length > 0 && (_jsxs("button", { onClick: () => setScanHistory([]), className: "text-xs text-[#6B7280] hover:text-white transition-colors flex items-center gap-1", children: [_jsx(Trash2, { className: "w-3 h-3" }), " Limpiar"] }))] }), scanHistory.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-16 text-[#6B7280]", children: [_jsx(ScanLine, { className: "w-12 h-12 mb-4 opacity-20" }), _jsx("p", { className: "text-sm font-medium text-[#9CA3AF]", children: "Sin escaneos" }), _jsx("p", { className: "text-xs mt-1", children: "Escanea un codigo de barras para comenzar" })] })) : (_jsx("div", { className: "space-y-2", children: scanHistory.map((record) => (_jsxs("div", { className: "flex items-center gap-4 bg-[#111111] border border-[#1E1E1E] rounded-lg px-4 py-3 hover:border-[#2A2A2A] transition-colors", children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${record.type === 'salida' ? 'bg-red-500/10' : 'bg-[#00FF88]/10'}`, children: record.type === 'salida' ? (_jsx(ArrowDownCircle, { className: "w-4 h-4 text-red-400" })) : (_jsx(ArrowUpCircle, { className: "w-4 h-4 text-[#00FF88]" })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("p", { className: "text-sm text-white font-medium truncate", children: [record.emoji, " ", record.productName] }), _jsxs("p", { className: "text-xs text-[#6B7280]", children: [record.size, " / ", record.color, " \u00B7 ", record.sku] })] }), _jsx("span", { className: `text-xs font-medium px-2 py-1 rounded-full ${record.type === 'salida'
                                        ? 'bg-red-500/10 text-red-400'
                                        : 'bg-[#00FF88]/10 text-[#00FF88]'}`, children: record.type === 'salida' ? 'Salida' : 'Entrada' }), _jsxs("span", { className: "text-sm font-mono text-white", children: [record.type === 'salida' ? '-' : '+', record.quantity] }), _jsxs("span", { className: "text-xs text-[#6B7280] flex items-center gap-1", children: [_jsx(Clock, { className: "w-3 h-3" }), formatTime(record.timestamp)] })] }, record.id))) }))] })] }));
}
