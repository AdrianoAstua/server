import { useInventoryStore } from '@/store/inventoryStore';
import type { InventoryMovement } from '@/types/inventory';
import { ArrowDownToLine, ArrowUpFromLine, RefreshCcw, Bookmark, RotateCcw, Filter } from 'lucide-react';

const TYPE_CONFIG = {
  entrada: { label: 'Entrada', color: '#00FF88', bg: '#00FF8815', icon: ArrowDownToLine, sign: '+' },
  salida: { label: 'Salida', color: '#EF4444', bg: '#EF444415', icon: ArrowUpFromLine, sign: '-' },
  ajuste: { label: 'Ajuste', color: '#F59E0B', bg: '#F59E0B15', icon: RefreshCcw, sign: '±' },
  reserva: { label: 'Reserva', color: '#3B82F6', bg: '#3B82F615', icon: Bookmark, sign: '-' },
  devolucion: { label: 'Devolución', color: '#8B5CF6', bg: '#8B5CF615', icon: RotateCcw, sign: '+' },
};

function MovementItem({ movement }: { movement: InventoryMovement }) {
  const cfg = TYPE_CONFIG[movement.type];
  const date = new Date(movement.createdAt);

  return (
    <div className="flex items-start gap-4 p-4 hover:bg-[#111111] transition-colors rounded-xl border border-transparent hover:border-[#1E1E1E]">
      {/* Icon + line */}
      <div className="flex flex-col items-center">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: cfg.bg }}
        >
          <cfg.icon className="w-4 h-4" style={{ color: cfg.color }} />
        </div>
        <div className="w-px flex-1 min-h-[20px] bg-[#1E1E1E] mt-1" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color: cfg.color, backgroundColor: cfg.bg }}
              >
                {cfg.label}
              </span>
              {movement.reference && (
                <span className="text-xs text-[#6B7280] font-mono bg-[#1A1A1A] px-2 py-0.5 rounded">
                  {movement.reference}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-white">{movement.productName}</p>
            <p className="text-xs text-[#9CA3AF]">{movement.variantLabel}</p>
            <p className="text-xs text-[#6B7280] mt-1">{movement.reason}</p>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-base font-bold" style={{ color: cfg.color }}>
              {cfg.sign}{Math.abs(movement.quantity)} uds
            </p>
            <p className="text-xs text-[#6B7280]">
              {movement.stockBefore} → {movement.stockAfter}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-[#4B5563]">
            {date.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <span className="text-[#2A2A2A]">·</span>
          <span className="text-xs text-[#4B5563]">
            {date.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[#2A2A2A]">·</span>
          <span className="text-xs text-[#4B5563]">{movement.createdBy}</span>
        </div>
      </div>
    </div>
  );
}

// Group movements by date
function groupByDate(movements: InventoryMovement[]) {
  const groups: Record<string, InventoryMovement[]> = {};
  for (const m of movements) {
    const date = new Date(m.createdAt).toLocaleDateString('es-CR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
    if (!groups[date]) groups[date] = [];
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

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0A0A0A]">
      {/* Header */}
      <div className="p-4 border-b border-[#1E1E1E] bg-[#0F0F0F] flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-white">Movimientos de inventario</h1>
            <p className="text-xs text-[#6B7280]">{movements.length} movimientos registrados</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setMovementFilter(f.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                movementFilter === f.id
                  ? 'bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20'
                  : 'text-[#6B7280] hover:text-white bg-[#1A1A1A] border border-transparent'
              }`}
            >
              {f.id !== 'all' && (
                <span className="mr-1.5 inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TYPE_CONFIG[f.id as keyof typeof TYPE_CONFIG]?.color }} />
              )}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        {Object.keys(groups).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#6B7280]">
            <Filter className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No hay movimientos para este filtro</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(groups).map(([date, items]) => (
              <div key={date}>
                <div className="sticky top-0 z-10 py-2 mb-1">
                  <span className="text-xs font-semibold text-[#4B5563] bg-[#0A0A0A] pr-3 capitalize">
                    {date}
                  </span>
                  <span className="text-xs text-[#2A2A2A] ml-2">({items.length})</span>
                </div>
                <div className="bg-[#0F0F0F] border border-[#1E1E1E] rounded-xl overflow-hidden">
                  {items.map((movement, i) => (
                    <div key={movement.id} className={i < items.length - 1 ? 'border-b border-[#111111]' : ''}>
                      <MovementItem movement={movement} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
