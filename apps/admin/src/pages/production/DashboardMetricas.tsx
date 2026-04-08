import {
  BarChart3, TrendingUp, TrendingDown, Clock, CheckCircle,
  AlertTriangle, DollarSign, User, Zap, Layers
} from 'lucide-react';

// ─── Mock Data ──────────────────────────────────────────────────────────────

const kpis = [
  { label: 'Lead time promedio', value: '3.2 dias', trend: -0.3, trendLabel: 'vs sem. anterior', good: true, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { label: 'Tasa entrega a tiempo', value: '87%', trend: 2.1, trendLabel: 'vs sem. anterior', good: true, icon: CheckCircle, color: 'text-[#00FF88]', bg: 'bg-[#00FF88]/10' },
  { label: 'Tasa reproceso', value: '4.2%', trend: 0.8, trendLabel: 'vs sem. anterior', good: false, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { label: 'Costo perdidas mes', value: 'C125,400', trend: -15000, trendLabel: 'vs mes anterior', good: true, icon: DollarSign, color: 'text-orange-400', bg: 'bg-orange-500/10' },
];

const ordersByStatus = [
  { label: 'Pendiente validacion', count: 4, color: 'bg-gray-500' },
  { label: 'En diseno', count: 6, color: 'bg-purple-500' },
  { label: 'Aprobado para produccion', count: 3, color: 'bg-blue-500' },
  { label: 'En impresion', count: 8, color: 'bg-cyan-500' },
  { label: 'En corte', count: 5, color: 'bg-indigo-500' },
  { label: 'En armado', count: 3, color: 'bg-violet-500' },
  { label: 'Control calidad', count: 4, color: 'bg-amber-500' },
  { label: 'Empacado', count: 2, color: 'bg-[#00FF88]' },
  { label: 'Listo para entrega', count: 6, color: 'bg-emerald-500' },
  { label: 'Entregado', count: 12, color: 'bg-green-600' },
];

const incidentsByType = [
  { type: 'Defecto impresion', count: 5, color: 'bg-red-400' },
  { type: 'Error de corte', count: 3, color: 'bg-orange-400' },
  { type: 'Archivo incorrecto', count: 4, color: 'bg-amber-400' },
  { type: 'Material defectuoso', count: 2, color: 'bg-purple-400' },
  { type: 'Retraso produccion', count: 3, color: 'bg-blue-400' },
  { type: 'Devolucion cliente', count: 1, color: 'bg-pink-400' },
];

const designers = [
  { name: 'Carlos Mena', completed: 28, avgDays: 2.1, approvalRate: 92 },
  { name: 'Maria Solis', completed: 24, avgDays: 2.4, approvalRate: 88 },
  { name: 'Adrian Mora', completed: 31, avgDays: 1.8, approvalRate: 95 },
  { name: 'Luis Herrera', completed: 19, avgDays: 2.7, approvalRate: 84 },
];

const stationStats = [
  { station: 'Impresion', queue: 3, inProcess: 2, completed: 14, avgMinutes: 45 },
  { station: 'Corte', queue: 5, inProcess: 1, completed: 12, avgMinutes: 22 },
  { station: 'Armado', queue: 2, inProcess: 3, completed: 10, avgMinutes: 35 },
  { station: 'Empaque', queue: 4, inProcess: 1, completed: 8, avgMinutes: 15 },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const maxOrders = Math.max(...ordersByStatus.map(s => s.count));
const totalIncidents = incidentsByType.reduce((s, i) => s + i.count, 0);

// ─── Component ──────────────────────────────────────────────────────────────

export default function DashboardMetricas() {
  return (
    <div className="h-full overflow-y-auto bg-[#0A0A0A] p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#00FF88]/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-[#00FF88]" />
        </div>
        <div>
          <h1 className="text-white text-xl font-bold">Dashboard de Metricas</h1>
          <p className="text-[#6B7280] text-sm">KPIs de produccion — Abril 2026</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map(kpi => {
          const isPositiveTrend = kpi.trend > 0;
          const showGreen = (kpi.label === 'Tasa entrega a tiempo' && isPositiveTrend) ||
                            (kpi.label !== 'Tasa entrega a tiempo' && !isPositiveTrend);

          return (
            <div key={kpi.label} className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <kpi.icon className={`w-4.5 h-4.5 ${kpi.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs ${showGreen ? 'text-[#00FF88]' : 'text-red-400'}`}>
                  {isPositiveTrend
                    ? <TrendingUp className="w-3 h-3" />
                    : <TrendingDown className="w-3 h-3" />
                  }
                  <span>{isPositiveTrend ? '+' : ''}{typeof kpi.trend === 'number' && Math.abs(kpi.trend) > 100 ? `C${Math.abs(kpi.trend / 1000).toFixed(0)}k` : kpi.trend}</span>
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{kpi.value}</p>
              <p className="text-[#6B7280] text-xs mt-0.5">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Bar Chart: Orders by Status */}
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#6B7280]" />
            Ordenes por Estado
          </h3>
          <div className="space-y-2.5">
            {ordersByStatus.map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-[#9CA3AF] text-xs w-[150px] truncate text-right">{item.label}</span>
                <div className="flex-1 h-6 bg-[#1A1A1A] rounded-md overflow-hidden relative">
                  <div
                    className={`h-full ${item.color} rounded-md transition-all duration-500`}
                    style={{ width: `${(item.count / maxOrders) * 100}%` }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-[10px] font-mono font-bold">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dot Chart: Incidents by Type */}
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#6B7280]" />
            Incidencias por Tipo
          </h3>
          <div className="space-y-3">
            {incidentsByType.map(item => (
              <div key={item.type} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color} flex-shrink-0`} />
                <span className="text-[#9CA3AF] text-sm flex-1">{item.type}</span>
                <span className="text-white text-sm font-mono font-bold">{item.count}</span>
                <div className="w-16 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${(item.count / totalIncidents) * 100}%` }}
                  />
                </div>
                <span className="text-[#6B7280] text-xs w-8 text-right">
                  {Math.round((item.count / totalIncidents) * 100)}%
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[#1E1E1E] flex items-center justify-between">
            <span className="text-[#6B7280] text-xs">Total incidencias</span>
            <span className="text-white text-sm font-bold">{totalIncidents}</span>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Designers Productivity */}
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1E1E1E] flex items-center gap-2">
            <User className="w-4 h-4 text-[#6B7280]" />
            <h3 className="text-white font-semibold text-sm">Productividad por Disenador</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E1E1E]">
                {['Nombre', 'Completadas', 'Tiempo prom.', 'Aprobacion'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] text-[#6B7280] uppercase tracking-wider font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {designers.map(d => (
                <tr key={d.name} className="border-b border-[#1E1E1E] last:border-b-0">
                  <td className="px-4 py-3 text-white text-sm">{d.name}</td>
                  <td className="px-4 py-3 text-[#9CA3AF] text-sm font-mono">{d.completed}</td>
                  <td className="px-4 py-3 text-[#9CA3AF] text-sm">{d.avgDays} dias</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${d.approvalRate >= 90 ? 'bg-[#00FF88]' : d.approvalRate >= 85 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${d.approvalRate}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono ${d.approvalRate >= 90 ? 'text-[#00FF88]' : d.approvalRate >= 85 ? 'text-amber-400' : 'text-red-400'}`}>
                        {d.approvalRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Station Stats */}
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1E1E1E] flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#6B7280]" />
            <h3 className="text-white font-semibold text-sm">Piezas por Estacion Hoy</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E1E1E]">
                {['Estacion', 'En cola', 'En proceso', 'Completadas', 'Tiempo prom.'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] text-[#6B7280] uppercase tracking-wider font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stationStats.map(s => (
                <tr key={s.station} className="border-b border-[#1E1E1E] last:border-b-0">
                  <td className="px-4 py-3 text-white text-sm">{s.station}</td>
                  <td className="px-4 py-3">
                    <span className="text-amber-400 text-sm font-mono bg-amber-500/10 px-2 py-0.5 rounded">
                      {s.queue}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-blue-400 text-sm font-mono bg-blue-500/10 px-2 py-0.5 rounded">
                      {s.inProcess}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[#00FF88] text-sm font-mono bg-[#00FF88]/10 px-2 py-0.5 rounded">
                      {s.completed}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#9CA3AF] text-sm">{s.avgMinutes} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
