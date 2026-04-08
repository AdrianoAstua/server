import { useState } from 'react';
import {
  Truck, Package, CheckCircle, Clock, MapPin, Send,
  User, Hash
} from 'lucide-react';
type DeliveryType = 'ENVIO' | 'RETIRO_SUCURSAL' | 'TIENDA';

// ─── Types ──────────────────────────────────────────────────────────────────

type LogisticsTab = 'ready' | 'transit' | 'delivered';

interface LogisticsOrder {
  id: string;
  orderNumber: string;
  clientName: string;
  pieces: number;
  deliveryType: DeliveryType;
  // transit-specific
  carrierName?: string;
  trackingNumber?: string;
  shippedAt?: string;
  // delivered-specific
  deliveredAt?: string;
  receivedBy?: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const mockReady: LogisticsOrder[] = [
  { id: '1', orderNumber: 'VB-202604-0015', clientName: 'DEPORTES MAX', pieces: 5, deliveryType: 'ENVIO' },
  { id: '2', orderNumber: 'VB-202604-0014', clientName: 'COOPERSAIN', pieces: 3, deliveryType: 'RETIRO_SUCURSAL' },
  { id: '3', orderNumber: 'VB-202604-0013', clientName: 'MARIA LOPEZ', pieces: 2, deliveryType: 'TIENDA' },
  { id: '4', orderNumber: 'VB-202604-0012', clientName: 'CLUB NATACION HEREDIA', pieces: 8, deliveryType: 'ENVIO' },
];

const mockTransit: LogisticsOrder[] = [
  { id: '5', orderNumber: 'VB-202604-0011', clientName: 'RUNNERS SAN JOSE', pieces: 4, deliveryType: 'ENVIO', carrierName: 'Correos de Costa Rica', trackingNumber: 'CR-2026-04578', shippedAt: '07 abr 14:00' },
  { id: '6', orderNumber: 'VB-202604-0010', clientName: 'TEAM CYCLING CR', pieces: 6, deliveryType: 'ENVIO', carrierName: 'Guatex Express', trackingNumber: 'GX-889012', shippedAt: '06 abr 16:30' },
  { id: '7', orderNumber: 'VB-202604-0009', clientName: 'CARLOS RAMIREZ', pieces: 1, deliveryType: 'ENVIO', carrierName: 'Correos de Costa Rica', trackingNumber: 'CR-2026-04520', shippedAt: '06 abr 10:00' },
];

const mockDelivered: LogisticsOrder[] = [
  { id: '8', orderNumber: 'VB-202604-0008', clientName: 'ANA JIMENEZ', pieces: 2, deliveryType: 'RETIRO_SUCURSAL', deliveredAt: '07 abr 15:10', receivedBy: 'Ana Jimenez' },
  { id: '9', orderNumber: 'VB-202604-0007', clientName: 'JOSE VARGAS', pieces: 3, deliveryType: 'ENVIO', deliveredAt: '07 abr 12:45', receivedBy: 'Recepcion Oficina' },
  { id: '10', orderNumber: 'VB-202604-0006', clientName: 'TRIATHLON ESCAZU', pieces: 10, deliveryType: 'TIENDA', deliveredAt: '07 abr 09:20', receivedBy: 'Luis Mora' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const deliveryBadge = (type: DeliveryType) => {
  const map: Record<DeliveryType, { label: string; cls: string }> = {
    ENVIO: { label: 'Envio', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    RETIRO_SUCURSAL: { label: 'Retiro', cls: 'bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/20' },
    TIENDA: { label: 'Tienda', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  };
  const { label, cls } = map[type];
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${cls}`}>{label}</span>;
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function PanelLogistica() {
  const [tab, setTab] = useState<LogisticsTab>('ready');
  const [shipForm, setShipForm] = useState<string | null>(null);
  const [confirmForm, setConfirmForm] = useState<string | null>(null);

  // Ship form state
  const [carrier, setCarrier] = useState('');
  const [tracking, setTracking] = useState('');

  // Confirm form state
  const [receivedBy, setReceivedBy] = useState('');
  const [notes, setNotes] = useState('');

  const tabs: { id: LogisticsTab; label: string; count: number }[] = [
    { id: 'ready', label: 'Listos para entrega', count: mockReady.length },
    { id: 'transit', label: 'En transito', count: mockTransit.length },
    { id: 'delivered', label: 'Entregados hoy', count: mockDelivered.length },
  ];

  const resetShipForm = () => { setShipForm(null); setCarrier(''); setTracking(''); };
  const resetConfirmForm = () => { setConfirmForm(null); setReceivedBy(''); setNotes(''); };

  return (
    <div className="h-full overflow-y-auto bg-[#0A0A0A] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Truck className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">Logistica de Entregas</h1>
            <p className="text-[#6B7280] text-sm">Gestion de envios, retiros y entregas</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Listos', value: mockReady.length, icon: Package, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'En transito', value: mockTransit.length, icon: Truck, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Entregados hoy', value: mockDelivered.length, icon: CheckCircle, color: 'text-[#00FF88]', bg: 'bg-[#00FF88]/10' },
        ].map(s => (
          <div key={s.label} className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
              <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-[#6B7280] text-xs">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[#111111] rounded-lg p-1 border border-[#1E1E1E]">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); resetShipForm(); resetConfirmForm(); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-[#1A1A1A] text-white border border-[#2A2A2A]'
                : 'text-[#6B7280] hover:text-[#9CA3AF]'
            }`}
          >
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              tab === t.id ? 'bg-[#00FF88]/10 text-[#00FF88]' : 'bg-[#1E1E1E] text-[#6B7280]'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-2">
        {/* Ready Tab */}
        {tab === 'ready' && mockReady.map(order => (
          <div key={order.id} className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-mono text-sm font-semibold">{order.orderNumber}</span>
                  {deliveryBadge(order.deliveryType)}
                </div>
                <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{order.clientName}</span>
                  <span className="flex items-center gap-1"><Package className="w-3 h-3" />{order.pieces} piezas</span>
                </div>
              </div>

              {shipForm !== order.id ? (
                <div className="flex gap-2">
                  {order.deliveryType === 'ENVIO' && (
                    <button
                      onClick={() => { resetConfirmForm(); setShipForm(order.id); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition-colors border border-blue-500/20"
                    >
                      <Send className="w-3 h-3" /> Asignar envio
                    </button>
                  )}
                  {(order.deliveryType === 'RETIRO_SUCURSAL' || order.deliveryType === 'TIENDA') && (
                    <button
                      onClick={() => { resetShipForm(); setConfirmForm(order.id); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00FF88]/10 text-[#00FF88] rounded-lg text-xs font-medium hover:bg-[#00FF88]/20 transition-colors border border-[#00FF88]/20"
                    >
                      <CheckCircle className="w-3 h-3" /> Registrar retiro
                    </button>
                  )}
                </div>
              ) : null}
            </div>

            {/* Inline Ship Form */}
            {shipForm === order.id && (
              <div className="mt-3 pt-3 border-t border-[#1E1E1E] flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-[#6B7280] text-[10px] uppercase tracking-wider mb-1 block">Transportista</label>
                  <input
                    type="text"
                    value={carrier}
                    onChange={e => setCarrier(e.target.value)}
                    placeholder="Nombre del transportista"
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm placeholder-[#4B5563] focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[#6B7280] text-[10px] uppercase tracking-wider mb-1 block">Numero de rastreo</label>
                  <input
                    type="text"
                    value={tracking}
                    onChange={e => setTracking(e.target.value)}
                    placeholder="Tracking number"
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm placeholder-[#4B5563] focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <button
                  onClick={resetShipForm}
                  className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors border border-blue-500/20"
                >
                  Enviar
                </button>
                <button onClick={resetShipForm} className="px-3 py-2 text-[#6B7280] hover:text-white text-sm">
                  Cancelar
                </button>
              </div>
            )}

            {/* Inline Confirm Form */}
            {confirmForm === order.id && (
              <div className="mt-3 pt-3 border-t border-[#1E1E1E] flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-[#6B7280] text-[10px] uppercase tracking-wider mb-1 block">Recibido por</label>
                  <input
                    type="text"
                    value={receivedBy}
                    onChange={e => setReceivedBy(e.target.value)}
                    placeholder="Nombre de quien recibe"
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm placeholder-[#4B5563] focus:outline-none focus:border-[#00FF88]/50"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[#6B7280] text-[10px] uppercase tracking-wider mb-1 block">Notas</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Notas opcionales"
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm placeholder-[#4B5563] focus:outline-none focus:border-[#00FF88]/50"
                  />
                </div>
                <button
                  onClick={resetConfirmForm}
                  className="px-4 py-2 bg-[#00FF88]/10 text-[#00FF88] rounded-lg text-sm font-medium hover:bg-[#00FF88]/20 transition-colors border border-[#00FF88]/20"
                >
                  Confirmar
                </button>
                <button onClick={resetConfirmForm} className="px-3 py-2 text-[#6B7280] hover:text-white text-sm">
                  Cancelar
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Transit Tab */}
        {tab === 'transit' && mockTransit.map(order => (
          <div key={order.id} className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-mono text-sm font-semibold">{order.orderNumber}</span>
                  {deliveryBadge(order.deliveryType)}
                </div>
                <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{order.clientName}</span>
                  <span className="flex items-center gap-1"><Package className="w-3 h-3" />{order.pieces} piezas</span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="flex items-center gap-1 text-[#9CA3AF]">
                    <Truck className="w-3 h-3" />{order.carrierName}
                  </span>
                  <span className="flex items-center gap-1 text-blue-400 font-mono">
                    <Hash className="w-3 h-3" />{order.trackingNumber}
                  </span>
                  <span className="flex items-center gap-1 text-[#6B7280]">
                    <Clock className="w-3 h-3" />{order.shippedAt}
                  </span>
                </div>
              </div>

              {confirmForm !== order.id ? (
                <button
                  onClick={() => { resetShipForm(); setConfirmForm(order.id); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00FF88]/10 text-[#00FF88] rounded-lg text-xs font-medium hover:bg-[#00FF88]/20 transition-colors border border-[#00FF88]/20"
                >
                  <CheckCircle className="w-3 h-3" /> Confirmar entrega
                </button>
              ) : null}
            </div>

            {confirmForm === order.id && (
              <div className="mt-3 pt-3 border-t border-[#1E1E1E] flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-[#6B7280] text-[10px] uppercase tracking-wider mb-1 block">Recibido por</label>
                  <input
                    type="text"
                    value={receivedBy}
                    onChange={e => setReceivedBy(e.target.value)}
                    placeholder="Nombre de quien recibe"
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm placeholder-[#4B5563] focus:outline-none focus:border-[#00FF88]/50"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[#6B7280] text-[10px] uppercase tracking-wider mb-1 block">Notas</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Notas opcionales"
                    className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm placeholder-[#4B5563] focus:outline-none focus:border-[#00FF88]/50"
                  />
                </div>
                <button
                  onClick={resetConfirmForm}
                  className="px-4 py-2 bg-[#00FF88]/10 text-[#00FF88] rounded-lg text-sm font-medium hover:bg-[#00FF88]/20 transition-colors border border-[#00FF88]/20"
                >
                  Confirmar
                </button>
                <button onClick={resetConfirmForm} className="px-3 py-2 text-[#6B7280] hover:text-white text-sm">
                  Cancelar
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Delivered Tab */}
        {tab === 'delivered' && mockDelivered.map(order => (
          <div key={order.id} className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-[#00FF88]/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-[#00FF88]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-mono text-sm font-semibold">{order.orderNumber}</span>
                  {deliveryBadge(order.deliveryType)}
                </div>
                <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{order.clientName}</span>
                  <span className="flex items-center gap-1"><Package className="w-3 h-3" />{order.pieces} piezas</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#9CA3AF]">{order.deliveredAt}</p>
                <p className="text-xs text-[#6B7280] flex items-center gap-1 justify-end mt-0.5">
                  <MapPin className="w-3 h-3" />Recibio: {order.receivedBy}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
