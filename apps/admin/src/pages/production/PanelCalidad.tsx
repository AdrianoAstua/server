import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  ScanLine, CheckCircle, XCircle, AlertTriangle, Clock,
  Camera, Upload, MessageSquare, Shield, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { QCResult } from '@/types/production';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChecklistItem {
  id: string;
  label: string;
  passed: boolean | null;
  notes: string;
}

interface ScannedPiece {
  barcode: string;
  workOrderNumber: string;
  productType: string;
  description: string;
  variant: string;
  designerName: string;
}

interface InspectionRecord {
  id: string;
  workOrderNumber: string;
  barcode: string;
  productType: string;
  result: QCResult;
  timestamp: string;
  inspector: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_PIECES: Record<string, ScannedPiece> = {
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

const MOCK_RECENT: InspectionRecord[] = [
  { id: 'qc-1', workOrderNumber: 'MTO-2026-0030', barcode: 'VONEB-P-00090', productType: 'Camiseta Running', result: 'PASSED', timestamp: '2026-04-07T09:45:00Z', inspector: 'Marco Vega' },
  { id: 'qc-2', workOrderNumber: 'MTO-2026-0029', barcode: 'VONEB-P-00088', productType: 'Jersey Ciclismo', result: 'PASSED', timestamp: '2026-04-07T09:20:00Z', inspector: 'Marco Vega' },
  { id: 'qc-3', workOrderNumber: 'MTO-2026-0031', barcode: 'VONEB-P-00092', productType: 'Bibshort', result: 'FAILED', timestamp: '2026-04-07T08:55:00Z', inspector: 'Marco Vega' },
  { id: 'qc-4', workOrderNumber: 'MTO-2026-0028', barcode: 'VONEB-P-00085', productType: 'Top Natacion', result: 'PASSED', timestamp: '2026-04-07T08:30:00Z', inspector: 'Marco Vega' },
  { id: 'qc-5', workOrderNumber: 'MTO-2026-0027', barcode: 'VONEB-P-00083', productType: 'Camiseta Running', result: 'PASSED_WITH_OBSERVATIONS', timestamp: '2026-04-07T08:10:00Z', inspector: 'Marco Vega' },
  { id: 'qc-6', workOrderNumber: 'MTO-2026-0032', barcode: 'VONEB-P-00094', productType: 'Uniforme Futsal', result: 'FAILED', timestamp: '2026-04-07T07:40:00Z', inspector: 'Marco Vega' },
  { id: 'qc-7', workOrderNumber: 'MTO-2026-0026', barcode: 'VONEB-P-00080', productType: 'Jersey Trail', result: 'PASSED', timestamp: '2026-04-07T07:15:00Z', inspector: 'Marco Vega' },
  { id: 'qc-8', workOrderNumber: 'MTO-2026-0025', barcode: 'VONEB-P-00078', productType: 'Gorra Running', result: 'PASSED', timestamp: '2026-04-07T06:50:00Z', inspector: 'Marco Vega' },
];

const DEFAULT_CHECKLIST: Omit<ChecklistItem, 'id'>[] = [
  { label: 'Colores correctos', passed: null, notes: '' },
  { label: 'Alineacion del diseno', passed: null, notes: '' },
  { label: 'Medidas correctas', passed: null, notes: '' },
  { label: 'Acabado limpio (sin manchas)', passed: null, notes: '' },
  { label: 'Costuras correctas', passed: null, notes: '' },
  { label: 'Etiqueta presente', passed: null, notes: '' },
  { label: 'Material sin defectos', passed: null, notes: '' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
}

const RESULT_CONFIG: Record<QCResult, { label: string; bg: string; text: string }> = {
  PASSED: { label: 'Aprobado', bg: 'bg-[#00FF88]/10', text: 'text-[#00FF88]' },
  FAILED: { label: 'Rechazado', bg: 'bg-red-500/10', text: 'text-red-400' },
  PASSED_WITH_OBSERVATIONS: { label: 'Con Obs.', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function PanelCalidad() {
  const [scanValue, setScanValue] = useState('');
  const [scannedPiece, setScannedPiece] = useState<ScannedPiece | null>(null);
  const [lastScanError, setLastScanError] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [recentInspections, setRecentInspections] = useState<InspectionRecord[]>(MOCK_RECENT);
  const [showRecent, setShowRecent] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Autofocus
  useEffect(() => {
    if (!scannedPiece) inputRef.current?.focus();
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
  const handleScan = useCallback((value: string) => {
    const code = value.trim();
    if (!code) return;

    const piece = MOCK_PIECES[code];
    if (!piece) {
      setLastScanError(`Pieza no encontrada: "${code}"`);
      setScanValue('');
      inputRef.current?.focus();
      return;
    }

    setScannedPiece(piece);
    setChecklist(
      DEFAULT_CHECKLIST.map((item, i) => ({ ...item, id: `cl-${i}` })),
    );
    setGeneralNotes('');
    setPhotos([]);
    setLastScanError(null);
    setScanValue('');
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); handleScan(scanValue); }
    },
    [handleScan, scanValue],
  );

  // Toggle checklist item
  const toggleItem = (id: string, value: boolean) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, passed: item.passed === value ? null : value } : item)),
    );
  };

  const updateItemNotes = (id: string, notes: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item)),
    );
  };

  // Photo upload handler
  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const names = Array.from(files).map((f) => f.name);
    setPhotos((prev) => [...prev, ...names]);
    e.target.value = '';
  };

  // Submit inspection
  const submitInspection = (result: QCResult) => {
    if (!scannedPiece) return;

    const record: InspectionRecord = {
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

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A]">
      {/* Scan Input */}
      <div className="flex-shrink-0 px-6 py-5 border-b border-[#1E1E1E]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-[#00FF88]/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#00FF88]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Control de Calidad</h1>
            <p className="text-sm text-[#6B7280]">Escanear pieza para inspeccionar</p>
          </div>
        </div>

        {!scannedPiece && (
          <>
            <div className="relative">
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
            {lastScanError && (
              <div className="mt-3 flex items-center gap-3 px-5 py-3 rounded-xl bg-red-500/5 border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{lastScanError}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Inspection Area */}
      {scannedPiece ? (
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Product Info Card */}
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-[#00FF88]">{scannedPiece.barcode}</span>
              <span className="text-xs text-[#6B7280]">{scannedPiece.workOrderNumber}</span>
            </div>
            <h3 className="text-lg font-semibold text-white">{scannedPiece.productType}</h3>
            <p className="text-sm text-[#9CA3AF] mt-1">{scannedPiece.description}</p>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#1E1E1E]">
              <span className="text-xs text-[#6B7280]">Variante: <span className="text-white">{scannedPiece.variant}</span></span>
              <span className="text-xs text-[#6B7280]">Diseno: <span className="text-white">{scannedPiece.designerName}</span></span>
            </div>
          </div>

          {/* Digital Checklist */}
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-5">
            <h4 className="text-sm font-semibold text-white mb-4">Lista de Verificacion</h4>
            <div className="space-y-3">
              {checklist.map((item) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center gap-3">
                    {/* Pass Button */}
                    <button
                      onClick={() => toggleItem(item.id, true)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                        item.passed === true
                          ? 'bg-[#00FF88]/20 border-2 border-[#00FF88]/40'
                          : 'bg-[#0A0A0A] border-2 border-[#1E1E1E] hover:border-[#00FF88]/30'
                      }`}
                    >
                      <CheckCircle className={`w-5 h-5 ${item.passed === true ? 'text-[#00FF88]' : 'text-[#4B5563]'}`} />
                    </button>

                    {/* Fail Button */}
                    <button
                      onClick={() => toggleItem(item.id, false)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                        item.passed === false
                          ? 'bg-red-500/20 border-2 border-red-500/40'
                          : 'bg-[#0A0A0A] border-2 border-[#1E1E1E] hover:border-red-500/30'
                      }`}
                    >
                      <XCircle className={`w-5 h-5 ${item.passed === false ? 'text-red-400' : 'text-[#4B5563]'}`} />
                    </button>

                    {/* Label */}
                    <span className={`text-sm flex-1 ${
                      item.passed === true ? 'text-[#00FF88]' : item.passed === false ? 'text-red-400' : 'text-white'
                    }`}>
                      {item.label}
                    </span>
                  </div>

                  {/* Notes input (always visible when failed, toggle for others) */}
                  {item.passed === false && (
                    <input
                      value={item.notes}
                      onChange={(e) => updateItemNotes(item.id, e.target.value)}
                      placeholder="Describir el problema..."
                      className="w-full ml-[108px] text-xs px-3 py-2 rounded-lg bg-[#0A0A0A] border border-red-500/20 text-white placeholder:text-[#4B5563] focus:outline-none focus:border-red-500/40"
                      style={{ width: 'calc(100% - 108px)' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Photo Upload */}
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-5">
            <h4 className="text-sm font-semibold text-white mb-3">Fotos de Evidencia</h4>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={handlePhotoUpload}
              className="w-full py-8 rounded-xl border-2 border-dashed border-[#2A2A2A] hover:border-[#00FF88]/30 transition-colors flex flex-col items-center gap-2 active:scale-[0.98]"
            >
              <Upload className="w-8 h-8 text-[#6B7280]" />
              <span className="text-sm text-[#9CA3AF]">Toca para subir fotos</span>
              <span className="text-xs text-[#6B7280]">o arrastra archivos aqui</span>
            </button>
            {photos.length > 0 && (
              <div className="mt-3 space-y-1">
                {photos.map((name, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#9CA3AF] bg-[#0A0A0A] rounded-lg px-3 py-2">
                    <Camera className="w-3 h-3 text-[#00FF88]" />
                    <span className="truncate">{name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* General Notes */}
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-5">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#6B7280]" />
              Notas Generales
            </h4>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Observaciones adicionales sobre la pieza..."
              rows={3}
              className="w-full text-sm px-4 py-3 rounded-xl bg-[#0A0A0A] border border-[#1E1E1E] text-white placeholder:text-[#4B5563] focus:outline-none focus:border-[#00FF88]/30 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pb-4">
            <button
              onClick={() => submitInspection(allPassed ? 'PASSED' : 'PASSED_WITH_OBSERVATIONS')}
              disabled={!allChecked}
              className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl text-lg font-bold transition-all active:scale-[0.98] ${
                allChecked
                  ? 'bg-[#00FF88]/20 text-[#00FF88] border-2 border-[#00FF88]/30 hover:bg-[#00FF88]/30'
                  : 'bg-[#111111] text-[#4B5563] border-2 border-[#1E1E1E] cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-6 h-6" />
              APROBAR
            </button>
            <button
              onClick={() => submitInspection('FAILED')}
              disabled={!allChecked}
              className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl text-lg font-bold transition-all active:scale-[0.98] ${
                allChecked
                  ? 'bg-red-500/20 text-red-400 border-2 border-red-500/30 hover:bg-red-500/30'
                  : 'bg-[#111111] text-[#4B5563] border-2 border-[#1E1E1E] cursor-not-allowed'
              }`}
            >
              <XCircle className="w-6 h-6" />
              RECHAZAR
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-[#1E1E1E]">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl px-4 py-3 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#00FF88]" />
                <div>
                  <p className="text-lg font-bold text-[#00FF88]">{stats.passed}</p>
                  <p className="text-[10px] text-[#6B7280]">Aprobadas hoy</p>
                </div>
              </div>
              <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl px-4 py-3 flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-lg font-bold text-red-400">{stats.failed}</p>
                  <p className="text-[10px] text-[#6B7280]">Rechazadas hoy</p>
                </div>
              </div>
              <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl px-4 py-3 flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#3B82F6]" />
                <div>
                  <p className="text-lg font-bold text-white">{stats.rate}%</p>
                  <p className="text-[10px] text-[#6B7280]">Tasa aprobacion</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Inspections */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <button
              onClick={() => setShowRecent(!showRecent)}
              className="flex items-center justify-between w-full mb-3"
            >
              <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                Inspecciones Recientes ({recentInspections.length})
              </h2>
              {showRecent ? (
                <ChevronUp className="w-4 h-4 text-[#6B7280]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#6B7280]" />
              )}
            </button>

            {showRecent && (
              <div className="space-y-2">
                {recentInspections.map((record) => {
                  const cfg = RESULT_CONFIG[record.result];
                  return (
                    <div
                      key={record.id}
                      className="flex items-center gap-4 bg-[#111111] border border-[#1E1E1E] rounded-xl px-4 py-3 hover:border-[#2A2A2A] transition-colors"
                    >
                      {/* Result Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                        {record.result === 'FAILED' ? (
                          <XCircle className={`w-5 h-5 ${cfg.text}`} />
                        ) : (
                          <CheckCircle className={`w-5 h-5 ${cfg.text}`} />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{record.productType}</p>
                        <p className="text-xs text-[#6B7280]">{record.workOrderNumber} - {record.barcode}</p>
                      </div>

                      {/* Result Badge */}
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>

                      {/* Time */}
                      <span className="text-xs text-[#6B7280] flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatTime(record.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
