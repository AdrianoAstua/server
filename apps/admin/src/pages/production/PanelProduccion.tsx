import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  ScanLine, Camera, X, Video, AlertTriangle, CheckCircle,
  Clock, Printer, Scissors, Hammer, Package, BarChart3,
} from 'lucide-react';
import type { ProductionStation, WorkOrderPriority } from '@/types/production';
import { useProductionStore } from '@/store/production-store';
import { Html5Qrcode } from 'html5-qrcode';

// ─── Camera Scanner ─────────────────────────────────────────────────────────

const SCANNER_DIV_ID = 'voneb-production-reader';

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
          { fps: 10, qrbox: { width: 280, height: 160 }, aspectRatio: 16 / 9, disableFlip: false },
          (decodedText) => {
            if (cooldownRef.current || decodedText === lastCodeRef.current) return;
            lastCodeRef.current = decodedText;
            cooldownRef.current = true;
            onDetect(decodedText);
            setTimeout(() => { cooldownRef.current = false; lastCodeRef.current = ''; }, 1500);
          },
          () => {},
        );
        if (mounted) setScanning(true);
      } catch (err: unknown) {
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
      if (scanner) scanner.stop().then(() => scanner.clear()).catch(() => {});
    };
  }, [onDetect]);

  const handleClose = useCallback(() => {
    const scanner = scannerRef.current;
    if (scanner) scanner.stop().then(() => scanner.clear()).catch(() => {});
    onClose();
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
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
            <div id={SCANNER_DIV_ID} className="w-full max-w-lg" style={{ minHeight: '300px' }} />
            <p className="text-white/50 text-sm mt-4">Apunta la camara al codigo de barras de la pieza</p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface QueueItem {
  id: string;
  barcode: string;
  workOrderNumber: string;
  productType: string;
  description: string;
  priority: WorkOrderPriority;
  station: ProductionStation;
  enteredAt: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_QUEUE: QueueItem[] = [
  { id: 'ql-1', barcode: 'VONEB-P-00101', workOrderNumber: 'MTO-2026-0038', productType: 'Jersey Ciclismo', description: 'Jersey equipo Volcan - Talla XL', priority: 'ALTA', station: 'IMPRESION', enteredAt: '2026-04-07T07:15:00Z' },
  { id: 'ql-2', barcode: 'VONEB-P-00102', workOrderNumber: 'MTO-2026-0038', productType: 'Bibshort', description: 'Bibshort equipo Volcan - Talla XL', priority: 'ALTA', station: 'IMPRESION', enteredAt: '2026-04-07T07:16:00Z' },
  { id: 'ql-3', barcode: 'VONEB-P-00103', workOrderNumber: 'MTO-2026-0035', productType: 'Jersey Trail', description: 'Jersey manga larga Chirripo - Talla M', priority: 'ALTA', station: 'IMPRESION', enteredAt: '2026-04-07T08:00:00Z' },
  { id: 'ql-4', barcode: 'VONEB-P-00104', workOrderNumber: 'MTO-2026-0042', productType: 'Camiseta Running', description: 'Camiseta 10K San Jose - Talla M', priority: 'NORMAL', station: 'IMPRESION', enteredAt: '2026-04-07T09:30:00Z' },
  { id: 'ql-5', barcode: 'VONEB-P-00105', workOrderNumber: 'MTO-2026-0033', productType: 'Jersey Ciclismo', description: 'Jersey Vuelta CR 2026 - Talla L', priority: 'NORMAL', station: 'CORTE', enteredAt: '2026-04-07T06:45:00Z' },
  { id: 'ql-6', barcode: 'VONEB-P-00106', workOrderNumber: 'MTO-2026-0036', productType: 'Camiseta Futsal', description: 'Uniforme futbol sala #7 - Talla M', priority: 'NORMAL', station: 'CORTE', enteredAt: '2026-04-07T07:00:00Z' },
  { id: 'ql-7', barcode: 'VONEB-P-00107', workOrderNumber: 'MTO-2026-0036', productType: 'Short Futsal', description: 'Short futbol sala #7 - Talla M', priority: 'NORMAL', station: 'CORTE', enteredAt: '2026-04-07T07:02:00Z' },
  { id: 'ql-8', barcode: 'VONEB-P-00108', workOrderNumber: 'MTO-2026-0034', productType: 'Gorra Running', description: 'Gorra maraton femenino', priority: 'BAJA', station: 'ARMADO', enteredAt: '2026-04-07T06:00:00Z' },
  { id: 'ql-9', barcode: 'VONEB-P-00109', workOrderNumber: 'MTO-2026-0041', productType: 'Jersey Ciclismo', description: 'Jersey Ruta CR - Talla L', priority: 'URGENTE', station: 'ARMADO', enteredAt: '2026-04-07T08:45:00Z' },
  { id: 'ql-10', barcode: 'VONEB-P-00110', workOrderNumber: 'MTO-2026-0039', productType: 'Top Natacion', description: 'Top triathlon femenino - Talla S', priority: 'NORMAL', station: 'ARMADO', enteredAt: '2026-04-07T09:00:00Z' },
];

const STATION_CONFIG: Record<ProductionStation, { label: string; icon: typeof Printer; color: string }> = {
  IMPRESION: { label: 'Impresion', icon: Printer, color: '#3B82F6' },
  CORTE: { label: 'Corte', icon: Scissors, color: '#F59E0B' },
  ARMADO: { label: 'Armado', icon: Hammer, color: '#A855F7' },
  EMPAQUE: { label: 'Empaque', icon: Package, color: '#00FF88' },
};

const PRIORITY_BORDER: Record<WorkOrderPriority, string> = {
  BAJA: 'border-l-gray-500',
  NORMAL: 'border-l-blue-500',
  ALTA: 'border-l-orange-500',
  URGENTE: 'border-l-red-500',
};

const PRIORITY_BADGE: Record<WorkOrderPriority, { bg: string; text: string }> = {
  BAJA: { bg: 'bg-gray-500/10', text: 'text-gray-400' },
  NORMAL: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  ALTA: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  URGENTE: { bg: 'bg-red-500/10', text: 'text-red-400' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeWaiting(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PanelProduccion() {
  const { activeStation, setActiveStation } = useProductionStore();
  const [scanValue, setScanValue] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [lastScan, setLastScan] = useState<{ type: 'success' | 'error'; message: string; detail?: string } | null>(null);
  const [scannedToday, setScannedToday] = useState(14);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentStation: ProductionStation = activeStation ?? 'IMPRESION';

  // Autofocus scan input
  useEffect(() => {
    if (!cameraOpen) inputRef.current?.focus();
  }, [cameraOpen, currentStation]);

  // Clear feedback after 3s
  useEffect(() => {
    if (lastScan) {
      const timer = setTimeout(() => setLastScan(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastScan]);

  const stationQueue = useMemo(
    () => MOCK_QUEUE.filter((q) => q.station === currentStation)
        .sort((a, b) => {
          const prio: Record<WorkOrderPriority, number> = { URGENTE: 0, ALTA: 1, NORMAL: 2, BAJA: 3 };
          return prio[a.priority] - prio[b.priority];
        }),
    [currentStation],
  );

  const avgTime = useMemo(() => {
    if (stationQueue.length === 0) return 0;
    const total = stationQueue.reduce((sum, q) => sum + (Date.now() - new Date(q.enteredAt).getTime()), 0);
    return Math.floor(total / stationQueue.length / 60000);
  }, [stationQueue]);

  // Handle scan
  const handleScan = useCallback(
    (value: string) => {
      const code = value.trim();
      if (!code) return;

      const found = MOCK_QUEUE.find((q) => q.barcode === code);
      if (!found) {
        setLastScan({ type: 'error', message: `Pieza no encontrada: "${code}"` });
      } else if (found.station !== currentStation) {
        setLastScan({
          type: 'error',
          message: `Pieza pertenece a ${STATION_CONFIG[found.station].label}`,
          detail: `${found.productType} - ${found.workOrderNumber}`,
        });
      } else {
        setLastScan({
          type: 'success',
          message: `Pieza escaneada correctamente`,
          detail: `${found.productType} - ${found.description}`,
        });
        setScannedToday((p) => p + 1);
      }

      setScanValue('');
      inputRef.current?.focus();
    },
    [currentStation],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); handleScan(scanValue); }
    },
    [handleScan, scanValue],
  );

  const handleCameraDetect = useCallback(
    (code: string) => handleScan(code),
    [handleScan],
  );

  // ─── Render ─────────────────────────────────────────────────────────────

  const stations: ProductionStation[] = ['IMPRESION', 'CORTE', 'ARMADO'];

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A]">
      {/* Camera Overlay */}
      {cameraOpen && <CameraScanner onDetect={handleCameraDetect} onClose={() => setCameraOpen(false)} />}

      {/* Station Tabs — Large Touch Targets */}
      <div className="flex-shrink-0 flex border-b border-[#1E1E1E]">
        {stations.map((st) => {
          const cfg = STATION_CONFIG[st];
          const Icon = cfg.icon;
          const isActive = currentStation === st;
          const count = MOCK_QUEUE.filter((q) => q.station === st).length;
          return (
            <button
              key={st}
              onClick={() => setActiveStation(st)}
              className={`flex-1 flex items-center justify-center gap-3 py-5 px-4 text-base font-semibold transition-all border-b-2 ${
                isActive
                  ? 'border-b-current text-white bg-[#111111]'
                  : 'border-b-transparent text-[#6B7280] hover:text-white hover:bg-[#0F0F0F]'
              }`}
              style={isActive ? { color: cfg.color } : undefined}
            >
              <Icon className="w-6 h-6" />
              <span>{cfg.label.toUpperCase()}</span>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-bold"
                style={isActive ? { backgroundColor: `${cfg.color}20`, color: cfg.color } : { backgroundColor: '#1E1E1E', color: '#6B7280' }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Scan Input Area */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-[#1E1E1E]">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <ScanLine className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-[#6B7280]" />
            <input
              ref={inputRef}
              value={scanValue}
              onChange={(e) => setScanValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escanear codigo de barras de la pieza..."
              autoFocus
              className="w-full pl-14 pr-6 py-5 rounded-2xl text-xl font-mono border-2 border-[#1E1E1E] bg-[#0F0F0F] text-white placeholder:text-[#4B5563] focus:outline-none focus:border-[#00FF88]/50 transition-colors"
            />
          </div>
          <button
            onClick={() => setCameraOpen(true)}
            className="flex-shrink-0 w-20 rounded-2xl border-2 border-[#2A2A2A] bg-[#111111] flex items-center justify-center text-[#9CA3AF] hover:text-white hover:border-[#3A3A3A] transition-all active:scale-95"
          >
            <Camera className="w-7 h-7" />
          </button>
        </div>

        {/* Scan Feedback */}
        {lastScan && (
          <div
            className={`mt-4 flex items-center gap-3 px-5 py-4 rounded-xl border ${
              lastScan.type === 'success'
                ? 'bg-[#00FF88]/5 border-[#00FF88]/20'
                : 'bg-red-500/5 border-red-500/20'
            }`}
          >
            {lastScan.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-[#00FF88] flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
            )}
            <div>
              <p className={`text-sm font-medium ${lastScan.type === 'success' ? 'text-[#00FF88]' : 'text-red-400'}`}>
                {lastScan.message}
              </p>
              {lastScan.detail && (
                <p className="text-xs text-[#9CA3AF] mt-0.5">{lastScan.detail}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Station Queue */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">
          Cola de {STATION_CONFIG[currentStation].label} ({stationQueue.length} piezas)
        </h2>

        {stationQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#6B7280]">
            <Package className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-medium text-[#9CA3AF]">Estacion vacia</p>
            <p className="text-xs mt-1">No hay piezas esperando en esta estacion</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stationQueue.map((item) => {
              const priBorder = PRIORITY_BORDER[item.priority];
              const priBadge = PRIORITY_BADGE[item.priority];
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 bg-[#111111] border border-[#1E1E1E] rounded-xl px-5 py-4 border-l-2 ${priBorder} hover:border-[#2A2A2A] transition-colors`}
                >
                  {/* Barcode */}
                  <div className="flex-shrink-0">
                    <p className="text-xs font-mono text-[#00FF88]">{item.barcode}</p>
                    <p className="text-[10px] text-[#6B7280] mt-0.5">{item.workOrderNumber}</p>
                  </div>

                  {/* Product */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{item.productType}</p>
                    <p className="text-xs text-[#9CA3AF] truncate">{item.description}</p>
                  </div>

                  {/* Priority */}
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${priBadge.bg} ${priBadge.text}`}>
                    {item.priority}
                  </span>

                  {/* Time Waiting */}
                  <span className="text-xs text-[#6B7280] flex items-center gap-1 flex-shrink-0 min-w-[60px] justify-end">
                    <Clock className="w-3.5 h-3.5" />
                    {timeWaiting(item.enteredAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="flex-shrink-0 border-t border-[#1E1E1E] px-6 py-4">
        <div className="flex items-center justify-around">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#3B82F6]" />
            <div>
              <p className="text-lg font-bold text-white">{stationQueue.length}</p>
              <p className="text-[10px] text-[#6B7280]">En esta estacion</p>
            </div>
          </div>
          <div className="w-px h-10 bg-[#1E1E1E]" />
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-[#00FF88]" />
            <div>
              <p className="text-lg font-bold text-[#00FF88]">{scannedToday}</p>
              <p className="text-[10px] text-[#6B7280]">Escaneadas hoy</p>
            </div>
          </div>
          <div className="w-px h-10 bg-[#1E1E1E]" />
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#F59E0B]" />
            <div>
              <p className="text-lg font-bold text-white">{avgTime} min</p>
              <p className="text-[10px] text-[#6B7280]">Tiempo promedio</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
