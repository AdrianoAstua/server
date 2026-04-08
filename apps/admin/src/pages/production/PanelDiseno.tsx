import { useState, useMemo } from 'react';
import {
  Palette, Clock, User, FileText, Download, ChevronRight,
  AlertTriangle, Eye, Send, X, MessageSquare, Image,
} from 'lucide-react';
import type { WorkOrderStatus, WorkOrderPriority } from '@/types/production';
import { useProductionStore } from '@/store/production-store';

// ─── Types ──────────────────────────────────────────────────────────────────

interface MockDesignOrder {
  id: string;
  workOrderNumber: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  clientName: string;
  clientPhone: string;
  productType: string;
  description: string;
  assignedAt: string;
  designerName: string | null;
  revisionsUsed: number;
  revisionsAllowed: number;
  clientNotes: string | null;
  specifications: Record<string, string>;
  clientFiles: { name: string; size: string; url: string }[];
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_ORDERS: MockDesignOrder[] = [
  {
    id: 'wo-d1', workOrderNumber: 'MTO-2026-0041', status: 'EN_COLA_DISENO', priority: 'URGENTE',
    clientName: 'Carlos Mendez', clientPhone: '+506 8844-1122', productType: 'Jersey Ciclismo',
    description: 'Jersey personalizado equipo Ruta CR', assignedAt: '2026-04-07T06:30:00Z',
    designerName: null, revisionsUsed: 0, revisionsAllowed: 3,
    clientNotes: 'Quiero los colores del equipo: azul y blanco. Logo en el pecho.',
    specifications: { Talla: 'L', Tipo: 'Full Zip', Material: 'Lycra Pro', Manga: 'Corta' },
    clientFiles: [
      { name: 'logo-equipo.png', size: '2.4 MB', url: '#' },
      { name: 'referencia-colores.jpg', size: '1.1 MB', url: '#' },
    ],
  },
  {
    id: 'wo-d2', workOrderNumber: 'MTO-2026-0042', status: 'EN_COLA_DISENO', priority: 'NORMAL',
    clientName: 'Maria Solano', clientPhone: '+506 7711-3344', productType: 'Camiseta Running',
    description: 'Camiseta running evento 10K San Jose', assignedAt: '2026-04-07T08:15:00Z',
    designerName: null, revisionsUsed: 0, revisionsAllowed: 2,
    clientNotes: 'Evento benefico, necesito espacio para patrocinadores.',
    specifications: { Talla: 'M', Tipo: 'Cuello Redondo', Material: 'Dry-Fit', Color: 'Blanco' },
    clientFiles: [{ name: 'logos-patrocinadores.zip', size: '8.7 MB', url: '#' }],
  },
  {
    id: 'wo-d3', workOrderNumber: 'MTO-2026-0038', status: 'EN_DISENO', priority: 'ALTA',
    clientName: 'Roberto Jimenez', clientPhone: '+506 6655-7788', productType: 'Kit Completo Ciclismo',
    description: 'Kit jersey + bibshort equipo Volcan', assignedAt: '2026-04-06T14:00:00Z',
    designerName: 'Ana Lopez', revisionsUsed: 1, revisionsAllowed: 3,
    clientNotes: 'Revision 1: cambiar el rojo por naranja en las mangas.',
    specifications: { Talla: 'XL', Tipo: 'Race Fit', Material: 'Aero Pro', Piezas: 'Jersey + Bibshort' },
    clientFiles: [
      { name: 'logo-volcan.ai', size: '4.2 MB', url: '#' },
      { name: 'mockup-previo.pdf', size: '3.1 MB', url: '#' },
    ],
  },
  {
    id: 'wo-d4', workOrderNumber: 'MTO-2026-0039', status: 'EN_DISENO', priority: 'NORMAL',
    clientName: 'Lucia Vargas', clientPhone: '+506 8899-2233', productType: 'Top Natacion',
    description: 'Top competencia triathlon femenino', assignedAt: '2026-04-06T10:30:00Z',
    designerName: 'Ana Lopez', revisionsUsed: 0, revisionsAllowed: 2,
    clientNotes: null,
    specifications: { Talla: 'S', Tipo: 'Racerback', Material: 'Chlorine Resistant', Color: 'Negro/Turquesa' },
    clientFiles: [{ name: 'inspiracion.jpg', size: '890 KB', url: '#' }],
  },
  {
    id: 'wo-d5', workOrderNumber: 'MTO-2026-0035', status: 'DISENO_EN_REVISION', priority: 'ALTA',
    clientName: 'Fernando Rojas', clientPhone: '+506 7722-4455', productType: 'Jersey Trail Running',
    description: 'Jersey manga larga trail Chirripo', assignedAt: '2026-04-05T09:00:00Z',
    designerName: 'Ana Lopez', revisionsUsed: 2, revisionsAllowed: 3,
    clientNotes: 'Revision 2: el verde esta perfecto, solo ajustar texto trasero.',
    specifications: { Talla: 'M', Tipo: 'Manga Larga', Material: 'Trail Dry', Color: 'Verde/Negro' },
    clientFiles: [{ name: 'foto-chirripo.jpg', size: '5.6 MB', url: '#' }],
  },
  {
    id: 'wo-d6', workOrderNumber: 'MTO-2026-0036', status: 'DISENO_EN_REVISION', priority: 'NORMAL',
    clientName: 'Andrea Mora', clientPhone: '+506 6633-8899', productType: 'Uniforme Equipo',
    description: 'Uniforme completo equipo futbol sala', assignedAt: '2026-04-05T11:45:00Z',
    designerName: 'Daniel Arias', revisionsUsed: 1, revisionsAllowed: 2,
    clientNotes: null,
    specifications: { Talla: 'Varias (S-XL)', Tipo: 'Camiseta + Short', Material: 'Micro Mesh', Cantidad: '15 kits' },
    clientFiles: [
      { name: 'escudo-equipo.svg', size: '120 KB', url: '#' },
      { name: 'numeros-nombres.xlsx', size: '45 KB', url: '#' },
    ],
  },
  {
    id: 'wo-d7', workOrderNumber: 'MTO-2026-0033', status: 'ESPERANDO_APROBACION_CLIENTE', priority: 'NORMAL',
    clientName: 'Diego Castillo', clientPhone: '+506 8811-5566', productType: 'Jersey Ciclismo',
    description: 'Jersey conmemorativo Vuelta CR 2026', assignedAt: '2026-04-04T08:00:00Z',
    designerName: 'Ana Lopez', revisionsUsed: 2, revisionsAllowed: 3,
    clientNotes: 'Me gusta mucho! Solo verifico con el comite.',
    specifications: { Talla: 'L', Tipo: 'Club Fit', Material: 'Lycra Standard', Color: 'Multicolor' },
    clientFiles: [{ name: 'brief-vuelta.pdf', size: '2.8 MB', url: '#' }],
  },
  {
    id: 'wo-d8', workOrderNumber: 'MTO-2026-0034', status: 'ESPERANDO_APROBACION_CLIENTE', priority: 'BAJA',
    clientName: 'Sofia Herrera', clientPhone: '+506 7744-6677', productType: 'Gorra Running',
    description: 'Gorra personalizada maraton femenino', assignedAt: '2026-04-04T15:20:00Z',
    designerName: 'Daniel Arias', revisionsUsed: 1, revisionsAllowed: 2,
    clientNotes: null,
    specifications: { Tipo: 'Trucker', Material: 'Dry-Fit Mesh', Color: 'Rosa/Blanco' },
    clientFiles: [{ name: 'logo-maraton.png', size: '650 KB', url: '#' }],
  },
];

// ─── Column Config ──────────────────────────────────────────────────────────

const COLUMNS: { key: WorkOrderStatus; label: string; color: string }[] = [
  { key: 'EN_COLA_DISENO', label: 'En Cola', color: '#6B7280' },
  { key: 'EN_DISENO', label: 'En Diseno', color: '#3B82F6' },
  { key: 'DISENO_EN_REVISION', label: 'En Revision', color: '#F59E0B' },
  { key: 'ESPERANDO_APROBACION_CLIENTE', label: 'Esperando Cliente', color: '#A855F7' },
];

const PRIORITY_CONFIG: Record<WorkOrderPriority, { label: string; bg: string; text: string; border: string }> = {
  BAJA: { label: 'Baja', bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
  NORMAL: { label: 'Normal', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  ALTA: { label: 'Alta', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  URGENTE: { label: 'Urgente', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return `${Math.floor(diff / 60000)} min`;
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PanelDiseno() {
  const { selectedWorkOrderId, setSelectedWorkOrder } = useProductionStore();
  const [orders, setOrders] = useState<MockDesignOrder[]>(MOCK_ORDERS);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedWorkOrderId) ?? null,
    [orders, selectedWorkOrderId],
  );

  const ordersByColumn = useMemo(() => {
    const map: Record<string, MockDesignOrder[]> = {};
    for (const col of COLUMNS) map[col.key] = [];
    for (const o of orders) {
      if (map[o.status]) map[o.status].push(o);
    }
    return map;
  }, [orders]);

  // ─── Actions ────────────────────────────────────────────────────────────

  const moveOrder = (id: string, toStatus: WorkOrderStatus) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: toStatus,
              designerName: toStatus === 'EN_DISENO' && !o.designerName ? 'Ana Lopez' : o.designerName,
              assignedAt: toStatus === 'EN_DISENO' ? new Date().toISOString() : o.assignedAt,
            }
          : o,
      ),
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex bg-[#0A0A0A]">
      {/* Kanban Columns */}
      <div className="flex-1 flex gap-4 p-4 overflow-x-auto">
        {COLUMNS.map((col) => (
          <div key={col.key} className="flex-1 min-w-[280px] flex flex-col">
            {/* Column Header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
              <h3 className="text-sm font-semibold text-white">{col.label}</h3>
              <span className="ml-auto text-xs text-[#6B7280] bg-[#111111] border border-[#1E1E1E] rounded-full px-2 py-0.5">
                {ordersByColumn[col.key]?.length ?? 0}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {ordersByColumn[col.key]?.map((order) => {
                const pri = PRIORITY_CONFIG[order.priority];
                const isSelected = selectedWorkOrderId === order.id;
                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedWorkOrder(isSelected ? null : order.id)}
                    className={`w-full text-left bg-[#111111] border rounded-xl p-4 transition-all hover:border-[#2A2A2A] ${
                      isSelected ? 'border-[#00FF88]/40 ring-1 ring-[#00FF88]/20' : 'border-[#1E1E1E]'
                    } ${order.priority === 'URGENTE' ? 'border-l-2 border-l-red-500' : ''}`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-[#00FF88]">{order.workOrderNumber}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${pri.bg} ${pri.text} border ${pri.border}`}>
                        {pri.label}
                      </span>
                    </div>

                    {/* Client */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <User className="w-3 h-3 text-[#6B7280]" />
                      <span className="text-sm text-white font-medium truncate">{order.clientName}</span>
                    </div>

                    {/* Product */}
                    <p className="text-xs text-[#9CA3AF] mb-2 truncate">{order.productType} - {order.description}</p>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#6B7280] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(order.assignedAt)}
                      </span>
                      {order.designerName && (
                        <span className="text-[10px] text-[#9CA3AF] flex items-center gap-1">
                          <Palette className="w-3 h-3" />
                          {order.designerName}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 pt-3 border-t border-[#1E1E1E] flex gap-2">
                      {order.status === 'EN_COLA_DISENO' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); moveOrder(order.id, 'EN_DISENO'); }}
                          className="flex-1 text-xs py-2 rounded-lg bg-[#00FF88]/10 text-[#00FF88] hover:bg-[#00FF88]/20 transition-colors font-medium"
                        >
                          Tomar Orden
                        </button>
                      )}
                      {order.status === 'EN_DISENO' && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveOrder(order.id, 'DISENO_EN_REVISION'); }}
                            className="flex-1 text-xs py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium"
                          >
                            Subir Diseno
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveOrder(order.id, 'ESPERANDO_APROBACION_CLIENTE'); }}
                            className="flex-1 text-xs py-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors font-medium"
                          >
                            <Send className="w-3 h-3 inline mr-1" />
                            Enviar
                          </button>
                        </>
                      )}
                      {order.status === 'DISENO_EN_REVISION' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); moveOrder(order.id, 'ESPERANDO_APROBACION_CLIENTE'); }}
                          className="flex-1 text-xs py-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors font-medium"
                        >
                          Solicitar Aprobacion
                        </button>
                      )}
                      {order.status === 'ESPERANDO_APROBACION_CLIENTE' && (
                        <span className="flex-1 text-xs py-2 text-center text-[#6B7280]">
                          Esperando respuesta...
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Right Sidebar — Order Detail */}
      {selectedOrder && (
        <div className="w-[380px] border-l border-[#1E1E1E] bg-[#0F0F0F] flex flex-col overflow-y-auto">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E1E]">
            <div>
              <span className="text-xs font-mono text-[#00FF88]">{selectedOrder.workOrderNumber}</span>
              <h3 className="text-sm font-semibold text-white mt-0.5">{selectedOrder.clientName}</h3>
            </div>
            <button
              onClick={() => setSelectedWorkOrder(null)}
              className="p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors"
            >
              <X className="w-4 h-4 text-[#6B7280]" />
            </button>
          </div>

          {/* Product Info */}
          <div className="px-5 py-4 border-b border-[#1E1E1E]">
            <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Producto</h4>
            <p className="text-sm text-white font-medium">{selectedOrder.productType}</p>
            <p className="text-xs text-[#9CA3AF] mt-1">{selectedOrder.description}</p>
          </div>

          {/* Specifications */}
          <div className="px-5 py-4 border-b border-[#1E1E1E]">
            <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Especificaciones</h4>
            <div className="space-y-2">
              {Object.entries(selectedOrder.specifications).map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-xs text-[#6B7280]">{key}</span>
                  <span className="text-xs text-white font-medium">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revisions */}
          <div className="px-5 py-4 border-b border-[#1E1E1E]">
            <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Revisiones</h4>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-[#1E1E1E] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(selectedOrder.revisionsUsed / selectedOrder.revisionsAllowed) * 100}%`,
                    backgroundColor: selectedOrder.revisionsUsed >= selectedOrder.revisionsAllowed ? '#EF4444' : '#00FF88',
                  }}
                />
              </div>
              <span className="text-xs text-white font-mono">
                {selectedOrder.revisionsUsed}/{selectedOrder.revisionsAllowed}
              </span>
            </div>
            {selectedOrder.revisionsUsed >= selectedOrder.revisionsAllowed && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-red-400">
                <AlertTriangle className="w-3 h-3" />
                Revisiones agotadas
              </div>
            )}
          </div>

          {/* Client Files */}
          <div className="px-5 py-4 border-b border-[#1E1E1E]">
            <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">
              Archivos del Cliente ({selectedOrder.clientFiles.length})
            </h4>
            <div className="space-y-2">
              {selectedOrder.clientFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-[#111111] border border-[#1E1E1E] rounded-lg px-3 py-2.5 hover:border-[#2A2A2A] transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{file.name}</p>
                    <p className="text-[10px] text-[#6B7280]">{file.size}</p>
                  </div>
                  <Download className="w-4 h-4 text-[#6B7280] hover:text-[#00FF88] transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* Client Notes */}
          <div className="px-5 py-4">
            <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">
              <MessageSquare className="w-3 h-3 inline mr-1" />
              Notas del Cliente
            </h4>
            {selectedOrder.clientNotes ? (
              <div className="bg-[#111111] border border-[#1E1E1E] rounded-lg p-3">
                <p className="text-xs text-[#9CA3AF] leading-relaxed">{selectedOrder.clientNotes}</p>
              </div>
            ) : (
              <p className="text-xs text-[#6B7280] italic">Sin notas del cliente</p>
            )}
          </div>

          {/* Designer Info */}
          {selectedOrder.designerName && (
            <div className="px-5 py-4 border-t border-[#1E1E1E]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#00FF88]/10 flex items-center justify-center">
                  <Palette className="w-4 h-4 text-[#00FF88]" />
                </div>
                <div>
                  <p className="text-xs text-white font-medium">{selectedOrder.designerName}</p>
                  <p className="text-[10px] text-[#6B7280]">Disenador asignado</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
