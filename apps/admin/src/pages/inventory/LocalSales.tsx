import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  ScanLine, Package, ArrowDownCircle, ArrowUpCircle, Clock,
  CheckCircle, AlertTriangle, Trash2, RotateCcw, Camera, X, Video
} from 'lucide-react';
import { useInventoryStore } from '@/store/inventoryStore';
import { Html5Qrcode } from 'html5-qrcode';

// ─── Camera Scanner (cross-browser: Chrome, Firefox, Safari, Edge, mobile) ──

const SCANNER_DIV_ID = 'voneb-barcode-reader';

function CameraScanner({ onDetect, onClose }: { onDetect: (code: string) => void; onClose: () => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastCodeRef = useRef('');
  const cooldownRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function startScanner() {
      try {
        const scanner = new Html5Qrcode(SCANNER_DIV_ID, { verbose: false });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 16 / 9,
            disableFlip: false,
          },
          (decodedText) => {
            // Success callback — barcode detected
            if (cooldownRef.current || decodedText === lastCodeRef.current) return;
            lastCodeRef.current = decodedText;
            cooldownRef.current = true;
            onDetect(decodedText);
            // Cooldown 1.5s to prevent duplicate scans
            setTimeout(() => {
              cooldownRef.current = false;
              lastCodeRef.current = '';
            }, 1500);
          },
          () => {
            // Error callback — no code found this frame (ignore)
          },
        );

        if (mounted) setScanning(true);
      } catch (err: unknown) {
        console.error('Camera scanner error:', err);
        if (mounted) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('Permission') || msg.includes('NotAllowed')) {
            setError('Permiso de camara denegado. Habilita el acceso en la configuracion del navegador.');
          } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
            setError('No se encontro ninguna camara en este dispositivo.');
          } else {
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
        scanner.stop().then(() => scanner.clear()).catch(() => {});
      }
    };
  }, [onDetect]);

  const handleClose = useCallback(() => {
    const scanner = scannerRef.current;
    if (scanner) {
      scanner.stop().then(() => scanner.clear()).catch(() => {});
    }
    onClose();
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/90 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-[#00FF88]" />
          <span className="text-white font-medium text-sm">Escaner de Camara</span>
          {scanning && (
            <span className="flex items-center gap-1 text-xs text-[#00FF88]">
              <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
              Activo
            </span>
          )}
        </div>
        <button onClick={handleClose} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Scanner area */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {error ? (
          <div className="text-center px-8">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button onClick={handleClose} className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20">
              Cerrar
            </button>
          </div>
        ) : (
          <>
            {/* html5-qrcode mounts its video here */}
            <div
              id={SCANNER_DIV_ID}
              className="w-full max-w-lg"
              style={{ minHeight: '300px' }}
            />
            <p className="text-white/50 text-sm mt-4">
              Apunta la camara al codigo de barras del producto
            </p>
            <p className="text-white/30 text-xs mt-1">
              Compatible con Code128, EAN-13, EAN-8, QR, UPC-A, Code39
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

type MovementType = 'salida' | 'entrada';

interface ScanRecord {
  id: string;
  variantId: string;
  productName: string;
  emoji: string;
  sku: string;
  size: string;
  color: string;
  type: MovementType;
  quantity: number;
  timestamp: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LocalSales() {
  const products = useInventoryStore((s) => s.products);
  const addStock = useInventoryStore((s) => s.addStock);

  const [mode, setMode] = useState<MovementType>('salida');
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [lastScan, setLastScan] = useState<{ type: 'success' | 'error'; message: string; product?: string } | null>(null);
  const [scanValue, setScanValue] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
  const findVariant = useCallback(
    (code: string) => {
      const normalized = code.trim();
      if (!normalized) return null;

      for (const product of products) {
        for (const variant of product.variants) {
          if (
            variant.barcode === normalized ||
            variant.barcode?.toLowerCase() === normalized.toLowerCase() ||
            variant.sku === normalized ||
            variant.sku.toLowerCase() === normalized.toLowerCase()
          ) {
            return { product, variant };
          }
        }
      }
      return null;
    },
    [products],
  );

  // Handle scan (Enter key)
  const handleScan = useCallback(
    (value: string) => {
      const code = value.trim();
      if (!code) return;

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
      const record: ScanRecord = {
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
    },
    [findVariant, mode, addStock],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleScan(scanValue);
      }
    },
    [handleScan, scanValue],
  );

  // Handle camera detection
  const handleCameraDetect = useCallback(
    (code: string) => {
      handleScan(code);
      // Don't close camera — keep scanning
    },
    [handleScan],
  );

  const undoLastScan = useCallback(() => {
    if (scanHistory.length === 0) return;
    const last = scanHistory[0];
    // Reverse the stock change
    const reverseDelta = last.type === 'salida' ? 1 : -1;
    addStock(last.variantId, reverseDelta, 'Deshacer — escaneo POS');
    setScanHistory((prev) => prev.slice(1));
    setLastScan({ type: 'success', message: `Deshecho: ${last.productName} (${last.size}/${last.color})` });
  }, [scanHistory, addStock]);

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A]">
      {/* Camera Scanner Overlay */}
      {cameraOpen && (
        <CameraScanner onDetect={handleCameraDetect} onClose={() => setCameraOpen(false)} />
      )}

      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#1E1E1E] px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00FF88]/10 flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-[#00FF88]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Registro por Escaneo</h1>
              <p className="text-sm text-[#6B7280]">Escanea el codigo de barras para registrar movimiento</p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-1 bg-[#111111] border border-[#1E1E1E] rounded-lg p-1">
            <button
              onClick={() => setMode('salida')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'salida'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A]'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              Salida (Venta)
            </button>
            <button
              onClick={() => setMode('entrada')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'entrada'
                  ? 'bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20'
                  : 'text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A]'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              Entrada
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-lg px-4 py-3 flex items-center gap-3">
            <Package className="w-5 h-5 text-[#3B82F6]" />
            <div>
              <p className="text-lg font-bold text-white">{todayStats.totalScans}</p>
              <p className="text-xs text-[#6B7280]">Escaneos hoy</p>
            </div>
          </div>
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-lg px-4 py-3 flex items-center gap-3">
            <ArrowDownCircle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-lg font-bold text-red-400">{todayStats.salidas}</p>
              <p className="text-xs text-[#6B7280]">Salidas</p>
            </div>
          </div>
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-lg px-4 py-3 flex items-center gap-3">
            <ArrowUpCircle className="w-5 h-5 text-[#00FF88]" />
            <div>
              <p className="text-lg font-bold text-[#00FF88]">{todayStats.entradas}</p>
              <p className="text-xs text-[#6B7280]">Entradas</p>
            </div>
          </div>
        </div>

        {/* Scan input + Camera button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
            <input
              ref={inputRef}
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === 'salida' ? 'Escanear barcode o escribir SKU...' : 'Escanear barcode o escribir SKU...'}
              autoFocus
              className={`w-full pl-12 pr-12 py-4 rounded-xl text-lg font-mono border-2 transition-colors bg-[#0F0F0F] text-white placeholder:text-[#4B5563] focus:outline-none ${
                mode === 'salida'
                  ? 'border-red-500/30 focus:border-red-500/60'
                  : 'border-[#00FF88]/30 focus:border-[#00FF88]/60'
              }`}
            />
            {scanHistory.length > 0 && (
              <button
                onClick={undoLastScan}
                title="Deshacer ultimo escaneo"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[#6B7280] hover:text-[#F59E0B] hover:bg-[#F59E0B]/10 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setCameraOpen(true)}
            className={`flex-shrink-0 w-16 rounded-xl border-2 flex items-center justify-center transition-all ${
              cameraOpen
                ? 'bg-[#00FF88]/10 border-[#00FF88]/40 text-[#00FF88]'
                : 'bg-[#111111] border-[#2A2A2A] text-[#9CA3AF] hover:text-white hover:border-[#3A3A3A]'
            }`}
            title="Abrir camara para escanear"
          >
            <Camera className="w-6 h-6" />
          </button>
        </div>

        {/* Scan feedback */}
        {lastScan && (
          <div
            className={`mt-3 flex items-center gap-3 px-4 py-3 rounded-lg border ${
              lastScan.type === 'success'
                ? 'bg-[#00FF88]/5 border-[#00FF88]/20'
                : 'bg-red-500/5 border-red-500/20'
            }`}
          >
            {lastScan.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-[#00FF88] flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <div>
              {lastScan.product && (
                <p className={`text-sm font-medium ${lastScan.type === 'success' ? 'text-[#00FF88]' : 'text-red-400'}`}>
                  {lastScan.product}
                </p>
              )}
              <p className={`text-xs ${lastScan.type === 'success' ? 'text-[#9CA3AF]' : 'text-red-300'}`}>
                {lastScan.message}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Scan history */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider">Historial de escaneos</h2>
          {scanHistory.length > 0 && (
            <button
              onClick={() => setScanHistory([])}
              className="text-xs text-[#6B7280] hover:text-white transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>

        {scanHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#6B7280]">
            <ScanLine className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-medium text-[#9CA3AF]">Sin escaneos</p>
            <p className="text-xs mt-1">Escanea un codigo de barras para comenzar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scanHistory.map((record) => (
              <div
                key={record.id}
                className="flex items-center gap-4 bg-[#111111] border border-[#1E1E1E] rounded-lg px-4 py-3 hover:border-[#2A2A2A] transition-colors"
              >
                {/* Type icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    record.type === 'salida' ? 'bg-red-500/10' : 'bg-[#00FF88]/10'
                  }`}
                >
                  {record.type === 'salida' ? (
                    <ArrowDownCircle className="w-4 h-4 text-red-400" />
                  ) : (
                    <ArrowUpCircle className="w-4 h-4 text-[#00FF88]" />
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {record.emoji} {record.productName}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {record.size} / {record.color} · {record.sku}
                  </p>
                </div>

                {/* Type label */}
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    record.type === 'salida'
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-[#00FF88]/10 text-[#00FF88]'
                  }`}
                >
                  {record.type === 'salida' ? 'Salida' : 'Entrada'}
                </span>

                {/* Quantity */}
                <span className="text-sm font-mono text-white">
                  {record.type === 'salida' ? '-' : '+'}{record.quantity}
                </span>

                {/* Time */}
                <span className="text-xs text-[#6B7280] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(record.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
