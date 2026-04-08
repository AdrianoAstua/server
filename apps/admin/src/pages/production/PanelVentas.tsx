import { useState, useMemo } from 'react';
import { useProductionStore } from '@/store/production-store';
import type {
  WorkOrderListItem, WorkOrderStatus, WorkOrderPriority, DeliveryType,
} from '@/types/production';
import {
  Plus, Search, Filter, Eye, ChevronDown, X,
  ShoppingCart, Clock, Cog, CheckCircle,
} from 'lucide-react';

// ─── Status & Priority helpers ────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  BORRADOR: 'bg-[#374151]/60 text-[#9CA3AF] border-[#4B5563]/40',
  PENDIENTE_VALIDACION: 'bg-[#374151]/60 text-[#9CA3AF] border-[#4B5563]/40',
  ARCHIVOS_VALIDADOS: 'bg-[#374151]/60 text-[#9CA3AF] border-[#4B5563]/40',
  PENDIENTE_PAGO: 'bg-[#374151]/60 text-[#9CA3AF] border-[#4B5563]/40',
  ORDEN_CONFIRMADA: 'bg-[#7C3AED]/15 text-[#A78BFA] border-[#7C3AED]/30',
  EN_COLA_DISENO: 'bg-[#7C3AED]/15 text-[#A78BFA] border-[#7C3AED]/30',
  EN_DISENO: 'bg-[#7C3AED]/15 text-[#A78BFA] border-[#7C3AED]/30',
  DISENO_EN_REVISION: 'bg-[#7C3AED]/15 text-[#A78BFA] border-[#7C3AED]/30',
  ESPERANDO_APROBACION_CLIENTE: 'bg-[#D97706]/15 text-[#FBBF24] border-[#D97706]/30',
  APROBADO_PARA_PRODUCCION: 'bg-[#06B6D4]/15 text-[#67E8F9] border-[#06B6D4]/30',
  EN_IMPRESION: 'bg-[#06B6D4]/15 text-[#67E8F9] border-[#06B6D4]/30',
  EN_CORTE: 'bg-[#06B6D4]/15 text-[#67E8F9] border-[#06B6D4]/30',
  EN_ARMADO: 'bg-[#06B6D4]/15 text-[#67E8F9] border-[#06B6D4]/30',
  EN_CONTROL_CALIDAD: 'bg-[#D97706]/15 text-[#FBBF24] border-[#D97706]/30',
  QC_RECHAZADO: 'bg-[#DC2626]/15 text-[#F87171] border-[#DC2626]/30',
  EN_REPROCESO: 'bg-[#DC2626]/15 text-[#F87171] border-[#DC2626]/30',
  EMPACADO: 'bg-[#059669]/15 text-[#34D399] border-[#059669]/30',
  LISTO_PARA_ENTREGA: 'bg-[#059669]/15 text-[#34D399] border-[#059669]/30',
  EN_TRANSITO: 'bg-[#059669]/15 text-[#34D399] border-[#059669]/30',
  ENTREGADO: 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30',
  CERRADO: 'bg-[#374151]/60 text-[#9CA3AF] border-[#4B5563]/40',
  CANCELADO: 'bg-[#7F1D1D]/30 text-[#FCA5A5] border-[#991B1B]/40',
};

const STATUS_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  PENDIENTE_VALIDACION: 'Pend. Validacion',
  ARCHIVOS_VALIDADOS: 'Archivos OK',
  PENDIENTE_PAGO: 'Pend. Pago',
  ORDEN_CONFIRMADA: 'Confirmada',
  EN_COLA_DISENO: 'Cola Diseno',
  EN_DISENO: 'En Diseno',
  DISENO_EN_REVISION: 'Revision Diseno',
  ESPERANDO_APROBACION_CLIENTE: 'Esp. Aprobacion',
  APROBADO_PARA_PRODUCCION: 'Aprobado Prod.',
  EN_IMPRESION: 'Impresion',
  EN_CORTE: 'Corte',
  EN_ARMADO: 'Armado',
  EN_CONTROL_CALIDAD: 'Control Calidad',
  QC_RECHAZADO: 'QC Rechazado',
  EN_REPROCESO: 'Reproceso',
  EMPACADO: 'Empacado',
  LISTO_PARA_ENTREGA: 'Listo Entrega',
  EN_TRANSITO: 'En Transito',
  ENTREGADO: 'Entregado',
  CERRADO: 'Cerrado',
  CANCELADO: 'Cancelado',
};

const PRIORITY_COLORS: Record<WorkOrderPriority, string> = {
  BAJA: 'bg-[#374151]/60 text-[#9CA3AF] border-[#4B5563]/40',
  NORMAL: 'bg-[#1E40AF]/15 text-[#60A5FA] border-[#1E40AF]/30',
  ALTA: 'bg-[#D97706]/15 text-[#FBBF24] border-[#D97706]/30',
  URGENTE: 'bg-[#DC2626]/15 text-[#F87171] border-[#DC2626]/30',
};

const PRIORITY_LABELS: Record<WorkOrderPriority, string> = {
  BAJA: 'Baja',
  NORMAL: 'Normal',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

function StatusBadge({ status }: { status: WorkOrderStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${STATUS_COLORS[status] || STATUS_COLORS.BORRADOR}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: WorkOrderPriority }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${PRIORITY_COLORS[priority]}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_ORDERS: WorkOrderListItem[] = [
  {
    id: 'wo-001',
    workOrderNumber: 'WO-2026-0001',
    status: 'EN_DISENO',
    priority: 'ALTA',
    customer: { firstName: 'Carlos', lastName: 'Ramirez', whatsappPhone: '+50688881234' },
    assignedDesigner: { name: 'Maria Lopez' },
    totalCents: 4500000,
    linesCount: 3,
    createdAt: '2026-04-05T10:30:00Z',
  },
  {
    id: 'wo-002',
    workOrderNumber: 'WO-2026-0002',
    status: 'EN_IMPRESION',
    priority: 'URGENTE',
    customer: { firstName: 'Ana', lastName: 'Solis', whatsappPhone: '+50677772345' },
    assignedDesigner: { name: 'Pedro Arias' },
    totalCents: 7800000,
    linesCount: 5,
    createdAt: '2026-04-04T14:15:00Z',
  },
  {
    id: 'wo-003',
    workOrderNumber: 'WO-2026-0003',
    status: 'BORRADOR',
    priority: 'NORMAL',
    customer: { firstName: 'Luis', lastName: 'Mora', whatsappPhone: '+50666663456' },
    assignedDesigner: null,
    totalCents: 1500000,
    linesCount: 1,
    createdAt: '2026-04-07T08:00:00Z',
  },
  {
    id: 'wo-004',
    workOrderNumber: 'WO-2026-0004',
    status: 'LISTO_PARA_ENTREGA',
    priority: 'NORMAL',
    customer: { firstName: 'Sofia', lastName: 'Vargas', whatsappPhone: '+50699994567' },
    assignedDesigner: { name: 'Maria Lopez' },
    totalCents: 3200000,
    linesCount: 2,
    createdAt: '2026-04-01T09:45:00Z',
  },
  {
    id: 'wo-005',
    workOrderNumber: 'WO-2026-0005',
    status: 'EN_CONTROL_CALIDAD',
    priority: 'ALTA',
    customer: { firstName: 'Diego', lastName: 'Jimenez', whatsappPhone: '+50655555678' },
    assignedDesigner: { name: 'Pedro Arias' },
    totalCents: 12500000,
    linesCount: 8,
    createdAt: '2026-04-03T11:20:00Z',
  },
  {
    id: 'wo-006',
    workOrderNumber: 'WO-2026-0006',
    status: 'ENTREGADO',
    priority: 'BAJA',
    customer: { firstName: 'Valeria', lastName: 'Castro', whatsappPhone: '+50644446789' },
    assignedDesigner: { name: 'Maria Lopez' },
    totalCents: 2100000,
    linesCount: 2,
    createdAt: '2026-03-28T16:30:00Z',
  },
];

// ─── Product types for new order modal ────────────────────────────────────────

const PRODUCT_TYPES = ['MANGA', 'CAMISETA', 'GORRA', 'BOLSO', 'JERSEY', 'LICRA', 'OTRO'];
const DELIVERY_TYPES: { value: DeliveryType; label: string }[] = [
  { value: 'ENVIO', label: 'Envio a domicilio' },
  { value: 'RETIRO_SUCURSAL', label: 'Retiro en sucursal' },
  { value: 'TIENDA', label: 'Entrega en tienda' },
];

// ─── New Order Line ──────────────────────────────────────────────────────────

interface NewOrderLine {
  id: string;
  productType: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
}

function formatCRC(cents: number): string {
  return '₡' + (cents / 100).toLocaleString('es-CR');
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PanelVentas() {
  const { statusFilter, setStatusFilter, priorityFilter, setPriorityFilter, searchQuery, setSearchQuery, setSelectedWorkOrder } = useProductionStore();
  const [showNewOrder, setShowNewOrder] = useState(false);

  // New order form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('RETIRO_SUCURSAL');
  const [priority, setPriority] = useState<WorkOrderPriority>('NORMAL');
  const [customerNotes, setCustomerNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [lines, setLines] = useState<NewOrderLine[]>([
    { id: '1', productType: 'CAMISETA', description: '', quantity: 1, unitPriceCents: 0 },
  ]);

  // Filter orders
  const filtered = useMemo(() => {
    return MOCK_ORDERS.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && o.priority !== priorityFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = `${o.customer.firstName || ''} ${o.customer.lastName || ''}`.toLowerCase();
        if (!name.includes(q) && !o.workOrderNumber.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [statusFilter, priorityFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const active = MOCK_ORDERS.filter(o => !['ENTREGADO', 'CERRADO', 'CANCELADO'].includes(o.status)).length;
    const today = MOCK_ORDERS.filter(o => {
      const d = new Date(o.createdAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length;
    const inProd = MOCK_ORDERS.filter(o => ['EN_IMPRESION', 'EN_CORTE', 'EN_ARMADO'].includes(o.status)).length;
    const ready = MOCK_ORDERS.filter(o => ['LISTO_PARA_ENTREGA', 'EMPACADO'].includes(o.status)).length;
    return { active, today, inProd, ready };
  }, []);

  const addLine = () => {
    setLines(prev => [...prev, {
      id: String(Date.now()),
      productType: 'CAMISETA',
      description: '',
      quantity: 1,
      unitPriceCents: 0,
    }]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines(prev => prev.filter(l => l.id !== id));
  };

  const updateLine = (id: string, field: keyof NewOrderLine, value: string | number) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const orderTotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPriceCents, 0);

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryType('RETIRO_SUCURSAL');
    setPriority('NORMAL');
    setCustomerNotes('');
    setInternalNotes('');
    setLines([{ id: '1', productType: 'CAMISETA', description: '', quantity: 1, unitPriceCents: 0 }]);
    setShowNewOrder(false);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0A0A0A] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Ordenes de Trabajo</h1>
          <p className="text-[#6B7280] text-sm mt-0.5">Gestiona papeletas y pedidos MTO</p>
        </div>
        <button
          onClick={() => setShowNewOrder(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#00FF88] hover:bg-[#00DD77] text-black rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Orden
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Activas', value: stats.active, icon: ShoppingCart, color: 'text-[#00FF88]' },
          { label: 'Hoy', value: stats.today, icon: Clock, color: 'text-[#60A5FA]' },
          { label: 'En Produccion', value: stats.inProd, icon: Cog, color: 'text-[#67E8F9]' },
          { label: 'Listas', value: stats.ready, icon: CheckCircle, color: 'text-[#34D399]' },
        ].map(s => (
          <div key={s.label} className="bg-[#111111] border border-[#1E1E1E] rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280] text-xs">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280]" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#111111] border border-[#1E1E1E] text-[#9CA3AF] text-sm rounded-lg pl-9 pr-8 py-2 appearance-none focus:outline-none focus:border-[#00FF88]/40"
          >
            <option value="all">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280] pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="bg-[#111111] border border-[#1E1E1E] text-[#9CA3AF] text-sm rounded-lg pl-3 pr-8 py-2 appearance-none focus:outline-none focus:border-[#00FF88]/40"
          >
            <option value="all">Todas las prioridades</option>
            {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280] pointer-events-none" />
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente o # orden..."
            className="w-full bg-[#111111] border border-[#1E1E1E] text-white text-sm rounded-lg pl-9 pr-3 py-2 placeholder-[#4B5563] focus:outline-none focus:border-[#00FF88]/40"
          />
        </div>

        <span className="text-[#6B7280] text-xs ml-auto">
          {filtered.length} orden{filtered.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Work orders table */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1E1E1E]">
              {['# Orden', 'Cliente', 'Estado', 'Prioridad', 'Items', 'Total', 'Fecha', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(order => (
              <tr
                key={order.id}
                className="border-b border-[#1E1E1E]/50 hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                onClick={() => setSelectedWorkOrder(order.id)}
              >
                <td className="px-4 py-3">
                  <span className="text-white text-sm font-mono">{order.workOrderNumber}</span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-white text-sm">{order.customer.firstName} {order.customer.lastName}</p>
                    <p className="text-[#6B7280] text-xs">{order.customer.whatsappPhone}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={order.priority} />
                </td>
                <td className="px-4 py-3">
                  <span className="text-[#9CA3AF] text-sm">{order.linesCount}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-white text-sm font-medium">{formatCRC(order.totalCents)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[#9CA3AF] text-sm">{formatDate(order.createdAt)}</span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedWorkOrder(order.id); }}
                    className="p-1.5 rounded hover:bg-[#1E1E1E] text-[#6B7280] hover:text-white transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <p className="text-[#6B7280] text-sm">No se encontraron ordenes</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ─── New Order Modal (inline overlay) ───────────────────────────────── */}
      {showNewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E1E]">
              <h2 className="text-white text-lg font-semibold">Nueva Orden de Trabajo</h2>
              <button onClick={resetForm} className="p-1 text-[#6B7280] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Customer */}
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Cliente</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Nombre del cliente"
                    className="bg-[#0A0A0A] border border-[#1E1E1E] text-white text-sm rounded-lg px-3 py-2 placeholder-[#4B5563] focus:outline-none focus:border-[#00FF88]/40"
                  />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="+506 8888-1234"
                    className="bg-[#0A0A0A] border border-[#1E1E1E] text-white text-sm rounded-lg px-3 py-2 placeholder-[#4B5563] focus:outline-none focus:border-[#00FF88]/40"
                  />
                </div>
              </div>

              {/* Lines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-[#9CA3AF]">Lineas del pedido</label>
                  <button onClick={addLine} className="text-[#00FF88] text-xs font-medium hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Agregar linea
                  </button>
                </div>
                <div className="space-y-2">
                  {lines.map((line, idx) => (
                    <div key={line.id} className="grid grid-cols-[140px_1fr_70px_120px_32px] gap-2 items-center">
                      <select
                        value={line.productType}
                        onChange={e => updateLine(line.id, 'productType', e.target.value)}
                        className="bg-[#0A0A0A] border border-[#1E1E1E] text-[#9CA3AF] text-sm rounded-lg px-2 py-2 focus:outline-none focus:border-[#00FF88]/40"
                      >
                        {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input
                        type="text"
                        value={line.description}
                        onChange={e => updateLine(line.id, 'description', e.target.value)}
                        placeholder="Descripcion"
                        className="bg-[#0A0A0A] border border-[#1E1E1E] text-white text-sm rounded-lg px-3 py-2 placeholder-[#4B5563] focus:outline-none focus:border-[#00FF88]/40"
                      />
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={e => updateLine(line.id, 'quantity', parseInt(e.target.value) || 0)}
                        min={1}
                        className="bg-[#0A0A0A] border border-[#1E1E1E] text-white text-sm rounded-lg px-2 py-2 text-center focus:outline-none focus:border-[#00FF88]/40"
                      />
                      <input
                        type="number"
                        value={line.unitPriceCents / 100 || ''}
                        onChange={e => updateLine(line.id, 'unitPriceCents', Math.round(parseFloat(e.target.value || '0') * 100))}
                        placeholder="Precio ₡"
                        className="bg-[#0A0A0A] border border-[#1E1E1E] text-white text-sm rounded-lg px-2 py-2 text-right focus:outline-none focus:border-[#00FF88]/40"
                      />
                      <button
                        onClick={() => removeLine(line.id)}
                        className="p-1 text-[#6B7280] hover:text-[#F87171] transition-colors disabled:opacity-30"
                        disabled={lines.length <= 1}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {orderTotal > 0 && (
                  <div className="flex justify-end mt-2">
                    <span className="text-sm text-[#9CA3AF]">
                      Total: <span className="text-white font-semibold">{formatCRC(orderTotal)}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Delivery & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Tipo de entrega</label>
                  <select
                    value={deliveryType}
                    onChange={e => setDeliveryType(e.target.value as DeliveryType)}
                    className="w-full bg-[#0A0A0A] border border-[#1E1E1E] text-[#9CA3AF] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#00FF88]/40"
                  >
                    {DELIVERY_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Prioridad</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as WorkOrderPriority)}
                    className="w-full bg-[#0A0A0A] border border-[#1E1E1E] text-[#9CA3AF] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#00FF88]/40"
                  >
                    {(['BAJA', 'NORMAL', 'ALTA', 'URGENTE'] as WorkOrderPriority[]).map(p => (
                      <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Notas del cliente</label>
                <textarea
                  value={customerNotes}
                  onChange={e => setCustomerNotes(e.target.value)}
                  rows={2}
                  placeholder="Instrucciones especiales del cliente..."
                  className="w-full bg-[#0A0A0A] border border-[#1E1E1E] text-white text-sm rounded-lg px-3 py-2 placeholder-[#4B5563] resize-none focus:outline-none focus:border-[#00FF88]/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">Notas internas</label>
                <textarea
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  rows={2}
                  placeholder="Notas internas para el equipo..."
                  className="w-full bg-[#0A0A0A] border border-[#1E1E1E] text-white text-sm rounded-lg px-3 py-2 placeholder-[#4B5563] resize-none focus:outline-none focus:border-[#00FF88]/40"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1E1E1E]">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-sm text-[#9CA3AF] hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={resetForm}
                className="px-5 py-2.5 bg-[#00FF88] hover:bg-[#00DD77] text-black rounded-lg text-sm font-semibold transition-colors"
              >
                Crear Orden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
