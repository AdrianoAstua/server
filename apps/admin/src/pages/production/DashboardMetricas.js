import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BarChart3, TrendingUp, TrendingDown, Clock, CheckCircle, AlertTriangle, DollarSign, User, Zap, Layers } from 'lucide-react';
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
    return (_jsxs("div", { className: "h-full overflow-y-auto bg-[#0A0A0A] p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-[#00FF88]/10 flex items-center justify-center", children: _jsx(BarChart3, { className: "w-5 h-5 text-[#00FF88]" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-white text-xl font-bold", children: "Dashboard de Metricas" }), _jsx("p", { className: "text-[#6B7280] text-sm", children: "KPIs de produccion \u2014 Abril 2026" })] })] }), _jsx("div", { className: "grid grid-cols-4 gap-4 mb-6", children: kpis.map(kpi => {
                    const isPositiveTrend = kpi.trend > 0;
                    const showGreen = (kpi.label === 'Tasa entrega a tiempo' && isPositiveTrend) ||
                        (kpi.label !== 'Tasa entrega a tiempo' && !isPositiveTrend);
                    return (_jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("div", { className: `w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`, children: _jsx(kpi.icon, { className: `w-4.5 h-4.5 ${kpi.color}` }) }), _jsxs("div", { className: `flex items-center gap-1 text-xs ${showGreen ? 'text-[#00FF88]' : 'text-red-400'}`, children: [isPositiveTrend
                                                ? _jsx(TrendingUp, { className: "w-3 h-3" })
                                                : _jsx(TrendingDown, { className: "w-3 h-3" }), _jsxs("span", { children: [isPositiveTrend ? '+' : '', typeof kpi.trend === 'number' && Math.abs(kpi.trend) > 100 ? `C${Math.abs(kpi.trend / 1000).toFixed(0)}k` : kpi.trend] })] })] }), _jsx("p", { className: "text-2xl font-bold text-white", children: kpi.value }), _jsx("p", { className: "text-[#6B7280] text-xs mt-0.5", children: kpi.label })] }, kpi.label));
                }) }), _jsxs("div", { className: "grid grid-cols-2 gap-6 mb-6", children: [_jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-4", children: [_jsxs("h3", { className: "text-white font-semibold text-sm mb-4 flex items-center gap-2", children: [_jsx(Layers, { className: "w-4 h-4 text-[#6B7280]" }), "Ordenes por Estado"] }), _jsx("div", { className: "space-y-2.5", children: ordersByStatus.map(item => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-[#9CA3AF] text-xs w-[150px] truncate text-right", children: item.label }), _jsxs("div", { className: "flex-1 h-6 bg-[#1A1A1A] rounded-md overflow-hidden relative", children: [_jsx("div", { className: `h-full ${item.color} rounded-md transition-all duration-500`, style: { width: `${(item.count / maxOrders) * 100}%` } }), _jsx("span", { className: "absolute right-2 top-1/2 -translate-y-1/2 text-white text-[10px] font-mono font-bold", children: item.count })] })] }, item.label))) })] }), _jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-4", children: [_jsxs("h3", { className: "text-white font-semibold text-sm mb-4 flex items-center gap-2", children: [_jsx(AlertTriangle, { className: "w-4 h-4 text-[#6B7280]" }), "Incidencias por Tipo"] }), _jsx("div", { className: "space-y-3", children: incidentsByType.map(item => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-3 h-3 rounded-full ${item.color} flex-shrink-0` }), _jsx("span", { className: "text-[#9CA3AF] text-sm flex-1", children: item.type }), _jsx("span", { className: "text-white text-sm font-mono font-bold", children: item.count }), _jsx("div", { className: "w-16 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden", children: _jsx("div", { className: `h-full ${item.color} rounded-full`, style: { width: `${(item.count / totalIncidents) * 100}%` } }) }), _jsxs("span", { className: "text-[#6B7280] text-xs w-8 text-right", children: [Math.round((item.count / totalIncidents) * 100), "%"] })] }, item.type))) }), _jsxs("div", { className: "mt-4 pt-3 border-t border-[#1E1E1E] flex items-center justify-between", children: [_jsx("span", { className: "text-[#6B7280] text-xs", children: "Total incidencias" }), _jsx("span", { className: "text-white text-sm font-bold", children: totalIncidents })] })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl overflow-hidden", children: [_jsxs("div", { className: "px-4 py-3 border-b border-[#1E1E1E] flex items-center gap-2", children: [_jsx(User, { className: "w-4 h-4 text-[#6B7280]" }), _jsx("h3", { className: "text-white font-semibold text-sm", children: "Productividad por Disenador" })] }), _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-[#1E1E1E]", children: ['Nombre', 'Completadas', 'Tiempo prom.', 'Aprobacion'].map(h => (_jsx("th", { className: "text-left px-4 py-2.5 text-[10px] text-[#6B7280] uppercase tracking-wider font-medium", children: h }, h))) }) }), _jsx("tbody", { children: designers.map(d => (_jsxs("tr", { className: "border-b border-[#1E1E1E] last:border-b-0", children: [_jsx("td", { className: "px-4 py-3 text-white text-sm", children: d.name }), _jsx("td", { className: "px-4 py-3 text-[#9CA3AF] text-sm font-mono", children: d.completed }), _jsxs("td", { className: "px-4 py-3 text-[#9CA3AF] text-sm", children: [d.avgDays, " dias"] }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-16 h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden", children: _jsx("div", { className: `h-full rounded-full ${d.approvalRate >= 90 ? 'bg-[#00FF88]' : d.approvalRate >= 85 ? 'bg-amber-400' : 'bg-red-400'}`, style: { width: `${d.approvalRate}%` } }) }), _jsxs("span", { className: `text-xs font-mono ${d.approvalRate >= 90 ? 'text-[#00FF88]' : d.approvalRate >= 85 ? 'text-amber-400' : 'text-red-400'}`, children: [d.approvalRate, "%"] })] }) })] }, d.name))) })] })] }), _jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl overflow-hidden", children: [_jsxs("div", { className: "px-4 py-3 border-b border-[#1E1E1E] flex items-center gap-2", children: [_jsx(Zap, { className: "w-4 h-4 text-[#6B7280]" }), _jsx("h3", { className: "text-white font-semibold text-sm", children: "Piezas por Estacion Hoy" })] }), _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-[#1E1E1E]", children: ['Estacion', 'En cola', 'En proceso', 'Completadas', 'Tiempo prom.'].map(h => (_jsx("th", { className: "text-left px-4 py-2.5 text-[10px] text-[#6B7280] uppercase tracking-wider font-medium", children: h }, h))) }) }), _jsx("tbody", { children: stationStats.map(s => (_jsxs("tr", { className: "border-b border-[#1E1E1E] last:border-b-0", children: [_jsx("td", { className: "px-4 py-3 text-white text-sm", children: s.station }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: "text-amber-400 text-sm font-mono bg-amber-500/10 px-2 py-0.5 rounded", children: s.queue }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: "text-blue-400 text-sm font-mono bg-blue-500/10 px-2 py-0.5 rounded", children: s.inProcess }) }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: "text-[#00FF88] text-sm font-mono bg-[#00FF88]/10 px-2 py-0.5 rounded", children: s.completed }) }), _jsxs("td", { className: "px-4 py-3 text-[#9CA3AF] text-sm", children: [s.avgMinutes, " min"] })] }, s.station))) })] })] })] })] }));
}
