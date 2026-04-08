import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  ClipboardCheck,
  Plus,
  ScanBarcode,
  X,
  Check,
  Clock,
  AlertTriangle,
  ChevronRight,
  MapPin,
  Package,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  BarChart3,
  Search,
} from 'lucide-react';
import { useInventoryStore } from '@/store/inventoryStore';

// ─── Types ───

type CountStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type ActiveTab = 'pending' | 'counted' | 'discrepancies';

interface LocalCountItem {
  variantId: string;
  productName: string;
  sku: string;
  size: string;
  color: string;
  barcode?: string;
  expectedQty: number;
  actualQty: number | null;
  difference: number | null;
}

interface LocalCount {
  id: string;
  locationId: string;
  locationName: string;
  status: CountStatus;
  startedAt: string;
  completedAt?: string;
  notes?: string;
  items: LocalCountItem[];
}

// ─── Constants ───

const LOCATIONS = [
  { id: 'local', name: 'Tienda Local V ONE B' },
  { id: 'shopify', name: 'Shopify Online' },
] as const;

const STATUS_CONFIG: Record<CountStatus, { label: string; color: string; bg: string }> = {
  IN_PROGRESS: { label: 'En Progreso', color: '#F59E0B', bg: '#F59E0B15' },
  COMPLETED: { label: 'Completado', color: '#00FF88', bg: '#00FF8815' },
  CANCELLED: { label: 'Cancelado', color: '#6B7280', bg: '#6B728015' },
};

// ─── Helpers ───

function generateId(): string {
  return `cnt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── StatusBadge ───

function StatusBadge({ status }: { status: CountStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.IN_PROGRESS;
  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  );
}

// ─── New Count Modal ───

function NewCountModal({
  onClose,
  onStart,
}: {
  onClose: () => void;
  onStart: (locationId: string, locationName: string, notes?: string) => void;
}) {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [notes, setNotes] = useState('');

  const selectedName = LOCATIONS.find((l) => l.id === selectedLocation)?.name ?? '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <div className="p-6 border-b border-[#1E1E1E]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Nuevo Conteo Fisico</h2>
            <button onClick={onClose} className="text-[#6B7280] hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-[#6B7280] mt-1">Selecciona la ubicacion para iniciar el conteo</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Ubicacion</label>
            <div className="space-y-2">
              {LOCATIONS.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    selectedLocation === loc.id
                      ? 'border-[#00FF88]/50 bg-[#00FF88]/5'
                      : 'border-[#2A2A2A] bg-[#0F0F0F] hover:border-[#3A3A3A]'
                  }`}
                >
                  <MapPin
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: selectedLocation === loc.id ? '#00FF88' : '#6B7280' }}
                  />
                  <span className={selectedLocation === loc.id ? 'text-white font-medium' : 'text-[#9CA3AF]'}>
                    {loc.name}
                  </span>
                  {selectedLocation === loc.id && <Check className="w-4 h-4 ml-auto text-[#00FF88]" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9CA3AF] mb-2">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas sobre el conteo..."
              rows={3}
              className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white text-sm placeholder:text-[#4A4A4A] focus:outline-none focus:border-[#00FF88]/50 resize-none"
            />
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#2A2A2A] text-[#9CA3AF] hover:text-white hover:border-[#3A3A3A] transition-all text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={() => onStart(selectedLocation, selectedName, notes || undefined)}
            disabled={!selectedLocation}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#00FF88] text-black font-semibold text-sm hover:bg-[#00FF88]/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Iniciar Conteo
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Completion Summary Modal ───

function CompletionModal({
  count,
  onClose,
}: {
  count: LocalCount;
  onClose: () => void;
}) {
  const counted = count.items.filter((i) => i.actualQty !== null).length;
  const discrepancies = count.items.filter((i) => i.difference !== null && i.difference !== 0);
  const adjustments = discrepancies.reduce((sum, i) => sum + Math.abs(i.difference!), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="p-6 border-b border-[#1E1E1E] text-center">
          <div className="w-16 h-16 rounded-full bg-[#00FF88]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#00FF88]" />
          </div>
          <h2 className="text-xl font-bold text-white">Conteo Completado</h2>
          <p className="text-sm text-[#6B7280] mt-1">{count.locationName}</p>
        </div>

        <div className="p-6 grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-[#0F0F0F] rounded-xl border border-[#1E1E1E]">
            <div className="text-2xl font-bold text-white">{counted}</div>
            <div className="text-xs text-[#6B7280] mt-1">Items Contados</div>
          </div>
          <div className="text-center p-4 bg-[#0F0F0F] rounded-xl border border-[#1E1E1E]">
            <div className="text-2xl font-bold text-[#F59E0B]">{discrepancies.length}</div>
            <div className="text-xs text-[#6B7280] mt-1">Discrepancias</div>
          </div>
          <div className="text-center p-4 bg-[#0F0F0F] rounded-xl border border-[#1E1E1E]">
            <div className="text-2xl font-bold text-[#00FF88]">{adjustments}</div>
            <div className="text-xs text-[#6B7280] mt-1">Ajustes (uds)</div>
          </div>
        </div>

        {discrepancies.length > 0 && (
          <div className="px-6 pb-4">
            <h3 className="text-sm font-semibold text-[#9CA3AF] mb-2">Discrepancias Ajustadas</h3>
            <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
              {discrepancies.map((item) => (
                <div
                  key={item.variantId}
                  className="flex items-center justify-between text-xs px-3 py-2 bg-[#0A0A0A] rounded-lg border border-[#1E1E1E]"
                >
                  <div>
                    <span className="text-white">{item.productName}</span>
                    <span className="text-[#6B7280] ml-2">
                      {item.size}/{item.color}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#6B7280]">{item.expectedQty}</span>
                    <ChevronRight className="w-3 h-3 text-[#4A4A4A]" />
                    <span className="text-white font-medium">{item.actualQty}</span>
                    <span
                      className={`font-mono font-semibold ${
                        item.difference! > 0 ? 'text-[#00FF88]' : 'text-red-400'
                      }`}
                    >
                      {item.difference! > 0 ? '+' : ''}
                      {item.difference}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-6 pt-2">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 rounded-xl bg-[#00FF88] text-black font-semibold text-sm hover:bg-[#00FF88]/90 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cancel Confirmation Modal ───

function CancelModal({
  onConfirm,
  onClose,
}: {
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl w-full max-w-sm mx-4 shadow-2xl p-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Cancelar Conteo</h2>
          <p className="text-sm text-[#6B7280] mt-2">
            Se descartara todo el progreso del conteo actual. Esta accion no se puede deshacer.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#2A2A2A] text-[#9CA3AF] hover:text-white hover:border-[#3A3A3A] transition-all text-sm font-medium"
          >
            Volver
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-all"
          >
            Si, Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Count List View ───

function CountListView({
  counts,
  onNewCount,
  onSelectCount,
}: {
  counts: LocalCount[];
  onNewCount: () => void;
  onSelectCount: (id: string) => void;
}) {
  const totalCounts = counts.length;
  const inProgress = counts.filter((c) => c.status === 'IN_PROGRESS').length;
  const completed = counts.filter((c) => c.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <ClipboardCheck className="w-6 h-6 text-[#00FF88]" />
            Conteo Fisico
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">Verifica y ajusta el inventario con conteos fisicos</p>
        </div>
        <button
          onClick={onNewCount}
          className="px-5 py-2.5 rounded-xl bg-[#00FF88] text-black font-semibold text-sm hover:bg-[#00FF88]/90 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Conteo
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00FF88]/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#00FF88]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{totalCounts}</div>
              <div className="text-xs text-[#6B7280]">Total Conteos</div>
            </div>
          </div>
        </div>
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{inProgress}</div>
              <div className="text-xs text-[#6B7280]">En Progreso</div>
            </div>
          </div>
        </div>
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00FF88]/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-[#00FF88]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{completed}</div>
              <div className="text-xs text-[#6B7280]">Completados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Count list */}
      {counts.length === 0 ? (
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-[#2A2A2A] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No hay conteos</h3>
          <p className="text-sm text-[#6B7280] mb-6">
            Inicia un nuevo conteo fisico para verificar tu inventario
          </p>
          <button
            onClick={onNewCount}
            className="px-5 py-2.5 rounded-xl bg-[#00FF88] text-black font-semibold text-sm hover:bg-[#00FF88]/90 transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Conteo
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {counts.map((count) => {
            const total = count.items.length;
            const done = count.items.filter((i) => i.actualQty !== null).length;
            const discrep = count.items.filter((i) => i.difference !== null && i.difference !== 0).length;
            const isClickable = count.status === 'IN_PROGRESS';

            return (
              <button
                key={count.id}
                onClick={() => isClickable && onSelectCount(count.id)}
                disabled={!isClickable}
                className={`w-full bg-[#111111] border border-[#1E1E1E] rounded-xl p-4 text-left transition-all ${
                  isClickable ? 'hover:border-[#2A2A2A] cursor-pointer' : 'opacity-70 cursor-default'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1E1E1E] flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[#9CA3AF]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{count.locationName}</div>
                      <div className="text-xs text-[#6B7280]">{formatDate(count.startedAt)}</div>
                      {count.notes && (
                        <div className="text-xs text-[#4A4A4A] mt-0.5 truncate max-w-[300px]">{count.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-[#6B7280]">
                        {done}/{total} items
                      </div>
                      {count.status === 'COMPLETED' && discrep > 0 && (
                        <div className="text-xs text-[#F59E0B]">{discrep} discrepancias</div>
                      )}
                    </div>
                    <StatusBadge status={count.status} />
                    {isClickable && <ChevronRight className="w-4 h-4 text-[#3A3A3A]" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Active Count View ───

function ActiveCountView({
  count,
  onUpdateItem,
  onComplete,
  onCancel,
  onBack,
}: {
  count: LocalCount;
  onUpdateItem: (countId: string, variantId: string, qty: number | null) => void;
  onComplete: (countId: string) => void;
  onCancel: (countId: string) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<ActiveTab>('pending');
  const [scanValue, setScanValue] = useState('');
  const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const scanInputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Map<string, HTMLInputElement>>(new Map());

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
  const discrepancies = useMemo(
    () => count.items.filter((i) => i.difference !== null && i.difference !== 0),
    [count.items],
  );

  const countedCount = counted.length;
  const totalCount = count.items.length;
  const progress = totalCount > 0 ? (countedCount / totalCount) * 100 : 0;
  const allCounted = countedCount === totalCount && totalCount > 0;

  const tabItems = useMemo(() => {
    let items: LocalCountItem[];
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
      items = items.filter(
        (i) =>
          i.productName.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.size.toLowerCase().includes(q) ||
          i.color.toLowerCase().includes(q),
      );
    }
    return items;
  }, [tab, pending, counted, discrepancies, searchFilter]);

  const handleScan = useCallback(
    (value: string) => {
      const query = value.trim().toLowerCase();
      if (!query) return;

      const found = count.items.find(
        (i) => i.sku.toLowerCase() === query || (i.barcode && i.barcode.toLowerCase() === query),
      );

      if (found) {
        if (found.actualQty === null) {
          setTab('pending');
        } else if (found.difference !== null && found.difference !== 0) {
          setTab('discrepancies');
        } else {
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
      } else {
        setScanFeedback({ type: 'error', message: `No se encontro: "${value.trim()}"` });
      }

      setScanValue('');
    },
    [count.items],
  );

  const handleUpdateQty = useCallback(
    (variantId: string, qty: number | null) => {
      onUpdateItem(count.id, variantId, qty);
    },
    [count.id, onUpdateItem],
  );

  const tabsConfig: { key: ActiveTab; label: string; count: number; icon: React.ElementType }[] = [
    { key: 'pending', label: 'Pendientes', count: pending.length, icon: Clock },
    { key: 'counted', label: 'Contados', count: counted.length, icon: CheckCircle2 },
    { key: 'discrepancies', label: 'Discrepancias', count: discrepancies.length, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-[#2A2A2A] text-[#6B7280] hover:text-white hover:border-[#3A3A3A] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#00FF88]" />
              {count.locationName}
            </h2>
            <p className="text-xs text-[#6B7280]">Iniciado: {formatDate(count.startedAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all flex items-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Cancelar
          </button>
          <button
            onClick={() => onComplete(count.id)}
            disabled={!allCounted}
            className="px-4 py-2 rounded-xl bg-[#00FF88] text-black text-sm font-semibold hover:bg-[#00FF88]/90 transition-all flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            Completar
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[#9CA3AF]">Progreso</span>
          <span className="text-sm font-mono text-white">
            {countedCount}/{totalCount}
          </span>
        </div>
        <div className="h-2 bg-[#1E1E1E] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              backgroundColor: progress === 100 ? '#00FF88' : '#F59E0B',
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-[#6B7280]">
          <span>{pending.length} pendientes</span>
          <span>{discrepancies.length} discrepancias</span>
        </div>
      </div>

      {/* Barcode scan */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
        <div className="flex items-center gap-3">
          <ScanBarcode className="w-5 h-5 text-[#00FF88] flex-shrink-0" />
          <input
            ref={scanInputRef}
            type="text"
            value={scanValue}
            onChange={(e) => setScanValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleScan(scanValue);
              }
            }}
            placeholder="Escanear SKU o codigo de barras..."
            className="flex-1 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-4 py-2 text-white text-sm placeholder:text-[#4A4A4A] focus:outline-none focus:border-[#00FF88]/50 font-mono"
          />
        </div>
        {scanFeedback && (
          <div
            className={`mt-2 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
              scanFeedback.type === 'success' ? 'bg-[#00FF88]/10 text-[#00FF88]' : 'bg-red-500/10 text-red-400'
            }`}
          >
            {scanFeedback.type === 'success' ? (
              <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
            ) : (
              <XCircle className="w-3 h-3 flex-shrink-0" />
            )}
            {scanFeedback.message}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#111111] border border-[#1E1E1E] rounded-xl p-1">
        {tabsConfig.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                active ? 'bg-[#1E1E1E] text-white' : 'text-[#6B7280] hover:text-[#9CA3AF]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
                  active ? 'bg-[#2A2A2A] text-white' : 'bg-[#1E1E1E] text-[#6B7280]'
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search within tab */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A4A]" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Filtrar items..."
          className="w-full bg-[#111111] border border-[#1E1E1E] rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-[#4A4A4A] focus:outline-none focus:border-[#2A2A2A]"
        />
      </div>

      {/* Item list */}
      <div className="space-y-2">
        {tabItems.length === 0 ? (
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-8 text-center">
            <Package className="w-8 h-8 text-[#3A3A3A] mx-auto mb-2" />
            <p className="text-sm text-[#6B7280]">
              {tab === 'pending'
                ? 'Todos los items han sido contados'
                : tab === 'counted'
                  ? 'No hay items contados aun'
                  : 'No hay discrepancias'}
            </p>
          </div>
        ) : (
          tabItems.map((item) => {
            const diff = item.difference;
            const hasDiff = diff !== null && diff !== 0;

            return (
              <div
                key={item.variantId}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${
                  item.actualQty !== null
                    ? hasDiff
                      ? 'bg-[#F59E0B]/5 border-[#F59E0B]/20'
                      : 'bg-[#00FF88]/5 border-[#00FF88]/20'
                    : 'bg-[#0F0F0F] border-[#1E1E1E]'
                }`}
              >
                {/* Status indicator */}
                <div className="flex-shrink-0">
                  {item.actualQty === null ? (
                    <div className="w-6 h-6 rounded-full border-2 border-[#3A3A3A]" />
                  ) : hasDiff ? (
                    <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-[#00FF88]" />
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{item.productName}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#6B7280] font-mono">{item.sku}</span>
                    <span className="text-xs text-[#4A4A4A]">|</span>
                    <span className="text-xs text-[#6B7280]">
                      {item.size} / {item.color}
                    </span>
                  </div>
                </div>

                {/* Expected */}
                <div className="text-center flex-shrink-0 w-16">
                  <div className="text-xs text-[#6B7280] mb-0.5">Esperado</div>
                  <div className="text-sm font-semibold text-[#9CA3AF]">{item.expectedQty}</div>
                </div>

                {/* Actual input */}
                <div className="flex-shrink-0 w-20">
                  <div className="text-xs text-[#6B7280] mb-0.5 text-center">Actual</div>
                  <input
                    ref={(el) => {
                      if (el) {
                        itemRefs.current.set(item.variantId, el);
                      }
                    }}
                    type="number"
                    min={0}
                    value={item.actualQty ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        handleUpdateQty(item.variantId, null);
                      } else {
                        const num = parseInt(val, 10);
                        if (!isNaN(num) && num >= 0) {
                          handleUpdateQty(item.variantId, num);
                        }
                      }
                    }}
                    placeholder="-"
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-1.5 text-white text-sm text-center font-mono placeholder:text-[#3A3A3A] focus:outline-none focus:border-[#00FF88]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                {/* Difference */}
                <div className="text-center flex-shrink-0 w-16">
                  <div className="text-xs text-[#6B7280] mb-0.5">Dif.</div>
                  {diff !== null ? (
                    <div
                      className={`text-sm font-bold font-mono ${
                        diff > 0 ? 'text-[#00FF88]' : diff < 0 ? 'text-red-400' : 'text-[#6B7280]'
                      }`}
                    >
                      {diff > 0 ? '+' : ''}
                      {diff}
                    </div>
                  ) : (
                    <div className="text-sm text-[#3A3A3A]">-</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showCancelModal && (
        <CancelModal
          onClose={() => setShowCancelModal(false)}
          onConfirm={() => {
            setShowCancelModal(false);
            onCancel(count.id);
          }}
        />
      )}
    </div>
  );
}

// ─── Main Component ───

export default function PhysicalCount() {
  const products = useInventoryStore((s: { products: unknown }) => s.products) as ReturnType<typeof useInventoryStore>['products'];
  const addStock = useInventoryStore((s: { addStock: unknown }) => s.addStock) as ReturnType<typeof useInventoryStore>['addStock'];

  const [counts, setCounts] = useState<LocalCount[]>([]);
  const [activeCountId, setActiveCountId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [completedCount, setCompletedCount] = useState<LocalCount | null>(null);

  const activeCount = useMemo(
    () => counts.find((c) => c.id === activeCountId) ?? null,
    [counts, activeCountId],
  );

  // ─── Actions ───

  const handleStartCount = useCallback(
    (locationId: string, locationName: string, notes?: string) => {
      const items: LocalCountItem[] = [];
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

      const newCount: LocalCount = {
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
    },
    [products],
  );

  const handleUpdateItem = useCallback((countId: string, variantId: string, qty: number | null) => {
    setCounts((prev) =>
      prev.map((c) => {
        if (c.id !== countId) return c;
        return {
          ...c,
          items: c.items.map((item) => {
            if (item.variantId !== variantId) return item;
            const actualQty = qty;
            const difference = actualQty !== null ? actualQty - item.expectedQty : null;
            return { ...item, actualQty, difference };
          }),
        };
      }),
    );
  }, []);

  const handleComplete = useCallback(
    (countId: string) => {
      setCounts((prev) =>
        prev.map((c) => {
          if (c.id !== countId) return c;

          // Apply stock adjustments for discrepancies
          for (const item of c.items) {
            if (item.actualQty !== null && item.difference !== null && item.difference !== 0) {
              addStock(item.variantId, item.difference, 'Ajuste por conteo fisico');
            }
          }

          const completed: LocalCount = {
            ...c,
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
          };

          // Show completion modal after state update
          setTimeout(() => setCompletedCount(completed), 0);

          return completed;
        }),
      );

      setActiveCountId(null);
    },
    [addStock],
  );

  const handleCancel = useCallback((countId: string) => {
    setCounts((prev) =>
      prev.map((c) => (c.id === countId ? { ...c, status: 'CANCELLED' as const } : c)),
    );
    setActiveCountId(null);
  }, []);

  // ─── Render ───

  if (activeCount && activeCount.status === 'IN_PROGRESS') {
    return (
      <ActiveCountView
        count={activeCount}
        onUpdateItem={handleUpdateItem}
        onComplete={handleComplete}
        onCancel={handleCancel}
        onBack={() => setActiveCountId(null)}
      />
    );
  }

  return (
    <>
      <CountListView
        counts={counts}
        onNewCount={() => setShowNewModal(true)}
        onSelectCount={(id) => setActiveCountId(id)}
      />

      {showNewModal && (
        <NewCountModal onClose={() => setShowNewModal(false)} onStart={handleStartCount} />
      )}

      {completedCount && (
        <CompletionModal count={completedCount} onClose={() => setCompletedCount(null)} />
      )}
    </>
  );
}
