import { useState } from 'react';
import {
  AlertTriangle, Plus, Search, Filter, ArrowLeft,
  DollarSign, Image, CheckCircle,
  ExternalLink, XCircle
} from 'lucide-react';
type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
type IncidentResponsibility = 'CLIENT' | 'VONEB' | 'SUPPLIER' | 'MACHINE';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Incident {
  id: string;
  incidentNumber: string;
  type: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  responsibility: IncidentResponsibility;
  linkedOrder: string;
  description: string;
  costEstimatedCents: number;
  costRealCents: number | null;
  resolution: string | null;
  resolutionType: string | null;
  photos: string[];
  reportedBy: string;
  createdAt: string;
  resolvedAt: string | null;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const mockIncidents: Incident[] = [
  { id: '1', incidentNumber: 'INC-2026-0034', type: 'DEFECTO_IMPRESION', severity: 'HIGH', status: 'OPEN', responsibility: 'MACHINE', linkedOrder: 'VB-202604-0015', description: 'Color desaturado en panel frontal del jersey. La sublimacion no alcanzo temperatura adecuada, generando colores palidos en zona de pecho.', costEstimatedCents: 4500000, costRealCents: null, resolution: null, resolutionType: null, photos: ['foto_defecto_1.jpg', 'foto_defecto_2.jpg', 'foto_comparacion.jpg'], reportedBy: 'Carlos Mena', createdAt: '07 abr 2026 10:30', resolvedAt: null },
  { id: '2', incidentNumber: 'INC-2026-0033', type: 'ERROR_CORTE', severity: 'CRITICAL', status: 'INVESTIGATING', responsibility: 'VONEB', linkedOrder: 'VB-202604-0012', description: 'Corte desalineado en 3 piezas del lote. El patron estaba invertido en el plotter.', costEstimatedCents: 8700000, costRealCents: null, resolution: null, resolutionType: null, photos: ['corte_error_1.jpg', 'corte_error_2.jpg'], reportedBy: 'Maria Solis', createdAt: '07 abr 2026 09:15', resolvedAt: null },
  { id: '3', incidentNumber: 'INC-2026-0032', type: 'ARCHIVO_INCORRECTO', severity: 'MEDIUM', status: 'RESOLVED', responsibility: 'CLIENT', linkedOrder: 'VB-202604-0010', description: 'Cliente envio archivo con resolucion 72dpi en lugar de 300dpi requeridos.', costEstimatedCents: 1500000, costRealCents: 0, resolution: 'Cliente reenvia archivos correctos. Sin costo para VONEB.', resolutionType: 'SIN_COSTO', photos: ['archivo_original.jpg'], reportedBy: 'Adrian Mora', createdAt: '06 abr 2026 16:00', resolvedAt: '06 abr 2026 18:30' },
  { id: '4', incidentNumber: 'INC-2026-0031', type: 'MATERIAL_DEFECTUOSO', severity: 'HIGH', status: 'OPEN', responsibility: 'SUPPLIER', linkedOrder: 'VB-202604-0009', description: 'Tela recibida con manchas en 2 rollos. Proveedor TextilCR entrego lote con defectos visibles.', costEstimatedCents: 12000000, costRealCents: null, resolution: null, resolutionType: null, photos: ['tela_mancha_1.jpg', 'tela_mancha_2.jpg', 'tela_mancha_3.jpg', 'guia_envio.jpg'], reportedBy: 'Luis Herrera', createdAt: '06 abr 2026 11:45', resolvedAt: null },
  { id: '5', incidentNumber: 'INC-2026-0030', type: 'RETRASO_PRODUCCION', severity: 'LOW', status: 'CLOSED', responsibility: 'VONEB', linkedOrder: 'VB-202604-0008', description: 'Retraso de 1 dia por mantenimiento no programado de la impresora.', costEstimatedCents: 0, costRealCents: 0, resolution: 'Se reprogramo la entrega. Cliente acepto sin penalidad.', resolutionType: 'REPROGRAMACION', photos: [], reportedBy: 'Carlos Mena', createdAt: '05 abr 2026 14:00', resolvedAt: '05 abr 2026 16:00' },
  { id: '6', incidentNumber: 'INC-2026-0029', type: 'DEFECTO_IMPRESION', severity: 'MEDIUM', status: 'RESOLVED', responsibility: 'MACHINE', linkedOrder: 'VB-202604-0007', description: 'Lineas blancas horizontales en impresion. Cabezal necesitaba limpieza profunda.', costEstimatedCents: 3200000, costRealCents: 3200000, resolution: 'Reimpresion completa del lote. Cabezal limpiado y calibrado.', resolutionType: 'REIMPRESION', photos: ['lineas_defecto.jpg'], reportedBy: 'Maria Solis', createdAt: '04 abr 2026 10:00', resolvedAt: '04 abr 2026 15:00' },
  { id: '7', incidentNumber: 'INC-2026-0028', type: 'ERROR_EMPAQUE', severity: 'LOW', status: 'CLOSED', responsibility: 'VONEB', linkedOrder: 'VB-202604-0005', description: 'Etiqueta de paquete impresa con numero de orden incorrecto. Corregido antes del envio.', costEstimatedCents: 50000, costRealCents: 50000, resolution: 'Etiqueta reimpresa. Verificacion doble implementada.', resolutionType: 'CORRECCION_INMEDIATA', photos: [], reportedBy: 'Adrian Mora', createdAt: '03 abr 2026 17:30', resolvedAt: '03 abr 2026 17:45' },
  { id: '8', incidentNumber: 'INC-2026-0027', type: 'DEVOLUCION_CLIENTE', severity: 'HIGH', status: 'INVESTIGATING', responsibility: 'VONEB', linkedOrder: 'VB-202604-0003', description: 'Cliente reporta tallas incorrectas en 2 de 5 piezas del pedido. Posible error en la tabla de medidas.', costEstimatedCents: 6500000, costRealCents: null, resolution: null, resolutionType: null, photos: ['devolucion_1.jpg', 'devolucion_2.jpg'], reportedBy: 'Luis Herrera', createdAt: '03 abr 2026 09:00', resolvedAt: null },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCRC = (cents: number) => {
  const colones = cents / 100;
  return 'C' + colones.toLocaleString('es-CR', { minimumFractionDigits: 0 });
};

const severityConfig: Record<IncidentSeverity, { label: string; cls: string }> = {
  LOW: { label: 'Baja', cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  MEDIUM: { label: 'Media', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  HIGH: { label: 'Alta', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  CRITICAL: { label: 'Critica', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

const statusConfig: Record<IncidentStatus, { label: string; cls: string }> = {
  OPEN: { label: 'Abierta', cls: 'bg-red-500/10 text-red-400' },
  INVESTIGATING: { label: 'En investigacion', cls: 'bg-amber-500/10 text-amber-400' },
  RESOLVED: { label: 'Resuelta', cls: 'bg-[#00FF88]/10 text-[#00FF88]' },
  CLOSED: { label: 'Cerrada', cls: 'bg-gray-500/10 text-gray-400' },
};

const responsibilityConfig: Record<IncidentResponsibility, { label: string; cls: string }> = {
  CLIENT: { label: 'Cliente', cls: 'text-blue-400' },
  VONEB: { label: 'V ONE B', cls: 'text-red-400' },
  SUPPLIER: { label: 'Proveedor', cls: 'text-amber-400' },
  MACHINE: { label: 'Maquina', cls: 'text-gray-400' },
};

const typeLabels: Record<string, string> = {
  DEFECTO_IMPRESION: 'Defecto impresion',
  ERROR_CORTE: 'Error de corte',
  ARCHIVO_INCORRECTO: 'Archivo incorrecto',
  MATERIAL_DEFECTUOSO: 'Material defectuoso',
  RETRASO_PRODUCCION: 'Retraso produccion',
  ERROR_EMPAQUE: 'Error empaque',
  DEVOLUCION_CLIENTE: 'Devolucion cliente',
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function GestionIncidencias() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Resolve form
  const [resolveType, setResolveType] = useState('');
  const [resolveCost, setResolveCost] = useState('');
  const [resolveNotes, setResolveNotes] = useState('');

  const selected = selectedId ? mockIncidents.find(i => i.id === selectedId) : null;

  const filtered = mockIncidents.filter(i => {
    if (filterType !== 'all' && i.type !== filterType) return false;
    if (filterSeverity !== 'all' && i.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && i.status !== filterStatus) return false;
    return true;
  });

  const totalOpen = mockIncidents.filter(i => i.status === 'OPEN').length;
  const totalInvestigating = mockIncidents.filter(i => i.status === 'INVESTIGATING').length;
  const totalLossCents = mockIncidents
    .filter(i => i.costRealCents !== null)
    .reduce((sum, i) => sum + (i.costRealCents ?? 0), 0);

  // ─── Detail View ────────────────────────────────────────────────────────

  if (selected) {
    const sev = severityConfig[selected.severity] ?? { label: selected.severity, cls: '' };
    const stat = statusConfig[selected.status] ?? { label: selected.status, cls: '' };
    const resp = responsibilityConfig[selected.responsibility] ?? { label: selected.responsibility, cls: '' };

    return (
      <div className="h-full overflow-y-auto bg-[#0A0A0A] p-6">
        <button
          onClick={() => setSelectedId(null)}
          className="flex items-center gap-2 text-[#6B7280] hover:text-white transition-colors text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a incidencias
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white text-xl font-bold">{selected.incidentNumber}</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${sev.cls}`}>{sev.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${stat.cls}`}>{stat.label}</span>
            </div>
            <p className="text-[#6B7280] text-sm">{typeLabels[selected.type] ?? selected.type}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Info */}
          <div className="space-y-4">
            <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4 space-y-3">
              <h3 className="text-white font-semibold text-sm">Descripcion</h3>
              <p className="text-[#9CA3AF] text-sm leading-relaxed">{selected.description}</p>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1E1E1E]">
                <div>
                  <p className="text-[#6B7280] text-[10px] uppercase tracking-wider">Orden vinculada</p>
                  <p className="text-blue-400 text-sm font-mono flex items-center gap-1 mt-0.5">
                    <ExternalLink className="w-3 h-3" />{selected.linkedOrder}
                  </p>
                </div>
                <div>
                  <p className="text-[#6B7280] text-[10px] uppercase tracking-wider">Responsabilidad</p>
                  <p className={`text-sm font-medium mt-0.5 ${resp.cls}`}>{resp.label}</p>
                </div>
                <div>
                  <p className="text-[#6B7280] text-[10px] uppercase tracking-wider">Costo estimado</p>
                  <p className="text-white text-sm font-mono mt-0.5">{formatCRC(selected.costEstimatedCents)}</p>
                </div>
                <div>
                  <p className="text-[#6B7280] text-[10px] uppercase tracking-wider">Costo real</p>
                  <p className="text-white text-sm font-mono mt-0.5">
                    {selected.costRealCents !== null ? formatCRC(selected.costRealCents) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[#6B7280] text-[10px] uppercase tracking-wider">Reportado por</p>
                  <p className="text-[#9CA3AF] text-sm mt-0.5">{selected.reportedBy}</p>
                </div>
                <div>
                  <p className="text-[#6B7280] text-[10px] uppercase tracking-wider">Fecha</p>
                  <p className="text-[#9CA3AF] text-sm mt-0.5">{selected.createdAt}</p>
                </div>
              </div>
            </div>

            {/* Photos */}
            {selected.photos.length > 0 && (
              <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
                <h3 className="text-white font-semibold text-sm mb-3">Fotos ({selected.photos.length})</h3>
                <div className="grid grid-cols-3 gap-2">
                  {selected.photos.map((_photo, idx) => (
                    <div
                      key={idx}
                      className="aspect-square bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg flex items-center justify-center"
                    >
                      <Image className="w-6 h-6 text-[#4B5563]" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Resolution */}
          <div className="space-y-4">
            {selected.resolution && (
              <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
                <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#00FF88]" /> Resolucion
                </h3>
                <p className="text-[#9CA3AF] text-sm leading-relaxed">{selected.resolution}</p>
                {selected.resolvedAt && (
                  <p className="text-[#6B7280] text-xs mt-2">Resuelta: {selected.resolvedAt}</p>
                )}
              </div>
            )}

            {(selected.status === 'OPEN' || selected.status === 'INVESTIGATING') && (
              <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
                <h3 className="text-white font-semibold text-sm mb-3">Resolver Incidencia</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[#6B7280] text-[10px] uppercase tracking-wider mb-1 block">Tipo de resolucion</label>
                    <select
                      value={resolveType}
                      onChange={e => setResolveType(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00FF88]/50 appearance-none"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="REIMPRESION">Reimpresion</option>
                      <option value="REPROCESO">Reproceso</option>
                      <option value="REEMBOLSO">Reembolso</option>
                      <option value="SIN_COSTO">Sin costo</option>
                      <option value="CORRECCION_INMEDIATA">Correccion inmediata</option>
                      <option value="REPROGRAMACION">Reprogramacion</option>
                      <option value="DEVOLUCION_PROVEEDOR">Devolucion a proveedor</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[#6B7280] text-[10px] uppercase tracking-wider mb-1 block">Costo real (colones)</label>
                    <input
                      type="number"
                      value={resolveCost}
                      onChange={e => setResolveCost(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm placeholder-[#4B5563] focus:outline-none focus:border-[#00FF88]/50"
                    />
                  </div>
                  <div>
                    <label className="text-[#6B7280] text-[10px] uppercase tracking-wider mb-1 block">Notas de resolucion</label>
                    <textarea
                      value={resolveNotes}
                      onChange={e => setResolveNotes(e.target.value)}
                      placeholder="Describir la resolucion..."
                      rows={3}
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm placeholder-[#4B5563] focus:outline-none focus:border-[#00FF88]/50 resize-none"
                    />
                  </div>
                  <button className="w-full px-4 py-2.5 bg-[#00FF88]/10 text-[#00FF88] rounded-lg text-sm font-medium hover:bg-[#00FF88]/20 transition-colors border border-[#00FF88]/20">
                    Resolver Incidencia
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── List View ──────────────────────────────────────────────────────────

  return (
    <div className="h-full overflow-y-auto bg-[#0A0A0A] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">Incidencias</h1>
            <p className="text-[#6B7280] text-sm">Gestion de problemas y resoluciones</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#00FF88]/10 text-[#00FF88] rounded-lg text-sm font-medium hover:bg-[#00FF88]/20 transition-colors border border-[#00FF88]/20">
          <Plus className="w-4 h-4" /> Nueva Incidencia
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
            <XCircle className="w-4.5 h-4.5 text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalOpen}</p>
            <p className="text-[#6B7280] text-xs">Abiertas</p>
          </div>
        </div>
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Search className="w-4.5 h-4.5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalInvestigating}</p>
            <p className="text-[#6B7280] text-xs">En investigacion</p>
          </div>
        </div>
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <DollarSign className="w-4.5 h-4.5 text-orange-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{formatCRC(totalLossCents)}</p>
            <p className="text-[#6B7280] text-xs">Total perdidas</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <Filter className="w-4 h-4 text-[#6B7280]" />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-[#111111] border border-[#1E1E1E] rounded-lg px-3 py-1.5 text-sm text-[#9CA3AF] focus:outline-none focus:border-[#2A2A2A] appearance-none"
        >
          <option value="all">Todos los tipos</option>
          {Object.entries(typeLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={filterSeverity}
          onChange={e => setFilterSeverity(e.target.value)}
          className="bg-[#111111] border border-[#1E1E1E] rounded-lg px-3 py-1.5 text-sm text-[#9CA3AF] focus:outline-none focus:border-[#2A2A2A] appearance-none"
        >
          <option value="all">Todas las severidades</option>
          {Object.entries(severityConfig).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-[#111111] border border-[#1E1E1E] rounded-lg px-3 py-1.5 text-sm text-[#9CA3AF] focus:outline-none focus:border-[#2A2A2A] appearance-none"
        >
          <option value="all">Todos los estados</option>
          {Object.entries(statusConfig).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1E1E1E]">
              {['#', 'Tipo', 'Severidad', 'Orden', 'Responsabilidad', 'Costo Est.', 'Estado', 'Fecha'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] text-[#6B7280] uppercase tracking-wider font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(incident => {
              const sev = severityConfig[incident.severity] ?? { label: incident.severity, cls: '' };
              const stat = statusConfig[incident.status] ?? { label: incident.status, cls: '' };
              const resp = responsibilityConfig[incident.responsibility] ?? { label: incident.responsibility, cls: '' };
              return (
                <tr
                  key={incident.id}
                  onClick={() => setSelectedId(incident.id)}
                  className="border-b border-[#1E1E1E] last:border-b-0 hover:bg-[#1A1A1A] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-white text-sm font-mono">{incident.incidentNumber}</td>
                  <td className="px-4 py-3">
                    <span className="text-[#9CA3AF] text-xs">{typeLabels[incident.type] ?? incident.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${sev.cls}`}>{sev.label}</span>
                  </td>
                  <td className="px-4 py-3 text-blue-400 text-xs font-mono">{incident.linkedOrder}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${resp.cls}`}>{resp.label}</span>
                  </td>
                  <td className="px-4 py-3 text-white text-xs font-mono">{formatCRC(incident.costEstimatedCents)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${stat.cls}`}>{stat.label}</span>
                  </td>
                  <td className="px-4 py-3 text-[#6B7280] text-xs">{incident.createdAt}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
