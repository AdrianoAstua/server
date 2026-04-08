import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Brain, MessageCircle, AlertTriangle, Search, CheckCircle, XCircle, Pencil, Bell, Eye, Zap, Clock, ArrowUpDown, FileCheck, ChevronRight, Activity, Lightbulb, Shield } from 'lucide-react';
// ─── Mock Data ──────────────────────────────────────────────────────────────
const HEALTH_SCORE = 78;
const stats = [
    { label: 'Acciones hoy', value: 23, icon: Brain, color: 'text-[#00FF88]', bg: 'bg-[#00FF88]/10' },
    { label: 'Consultas pendientes', value: 3, icon: MessageCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', alert: true },
    { label: 'Anomalias', value: 2, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', alert: true },
    { label: 'Patrones detectados', value: 5, icon: Search, color: 'text-violet-400', bg: 'bg-violet-500/10' },
];
const consultas = [
    {
        id: 'c1',
        mensaje: 'La orden VB-202604-0015 lleva 72h esperando aprobacion del cliente.',
        recomendacion: 'Enviar recordatorio por WhatsApp y si no responde en 24h, notificar a ventas.',
        tiempo: 'hace 2h',
        target: 'VENTAS',
    },
    {
        id: 'c2',
        mensaje: 'Disenador Carlos Mendez tiene 6 ordenes activas (limite recomendado: 5). Carga desbalanceada respecto al equipo.',
        recomendacion: 'Reasignar 2 ordenes de menor prioridad a Ana Lopez (carga actual: 2 activas).',
        tiempo: 'hace 3h',
        target: 'SUPERVISOR_DISENO',
    },
    {
        id: 'c3',
        mensaje: 'Pieza de orden VB-202604-0012 rechazada 2 veces en control de calidad. Defecto recurrente: desalineacion de impresion.',
        recomendacion: 'Escalar a prioridad CRITICO y asignar revision de proceso a supervisor de produccion.',
        tiempo: 'hace 4h',
        target: 'SUPERVISOR_GENERAL',
    },
];
const acciones = [
    { id: 'a1', titulo: 'Auto-asigno disenadora Ana Lopez a VB-202604-0022 (carga: 2 activas)', tiempo: 'hace 5 min', tipo: 'ASSIGNMENT', icon: Zap },
    { id: 'a2', titulo: 'Notifico al cliente: pedido VB-202604-0018 listo para recoger', tiempo: 'hace 12 min', tipo: 'NOTIFICATION', icon: Bell },
    { id: 'a3', titulo: 'Detecto anomalia: estacion CORTE tarda 4.2h (promedio 1.5h)', tiempo: 'hace 23 min', tipo: 'ANOMALY', icon: AlertTriangle },
    { id: 'a4', titulo: 'Cerro automaticamente orden VB-202604-0010 (entregada, sin incidencias)', tiempo: 'hace 45 min', tipo: 'AUTO_CLOSE', icon: CheckCircle },
    { id: 'a5', titulo: 'Calculo fecha entrega VB-202604-0022: 11 abril (confianza 85%)', tiempo: 'hace 1h', tipo: 'PREDICTION', icon: Eye },
    { id: 'a6', titulo: 'Reordeno cola IMPRESION: VB-202604-0019 (URGENTE) movida al frente', tiempo: 'hace 1.5h', tipo: 'PRIORITY', icon: ArrowUpDown },
    { id: 'a7', titulo: 'Alerta: disenador Carlos Mendez tiene 6 ordenes activas (limite: 5)', tiempo: 'hace 2h', tipo: 'ALERT', icon: AlertTriangle },
    { id: 'a8', titulo: 'Valido archivo diseno VB-202604-0021: PNG 300dpi OK', tiempo: 'hace 3h', tipo: 'VALIDATION', icon: FileCheck },
];
const insights = [
    {
        id: 'i1',
        titulo: 'Cuello de botella en CORTE',
        descripcion: 'Tiempo promedio 3.2h vs 1.5h en IMPRESION. Las ordenes se acumulan en esta estacion consistentemente durante los ultimos 5 dias.',
        recomendacion: 'Agregar operario temporal o revisar proceso de corte. Considerar dividir lotes grandes.',
        confianza: 92,
        severity: 'CRITICAL',
    },
    {
        id: 'i2',
        titulo: 'Errores de impresion en aumento',
        descripcion: 'Subieron 40% esta semana — 8 incidencias vs 5 la semana pasada. Patron: 70% ocurren despues de las 3pm.',
        recomendacion: 'Revisar calibracion de impresora a media jornada. Posible sobrecalentamiento o fatiga del operario.',
        confianza: 78,
        severity: 'WARNING',
    },
    {
        id: 'i3',
        titulo: 'Ana Lopez: mejor tasa de aprobacion',
        descripcion: 'Tasa de aprobacion a primera revision: 85% vs promedio del equipo 62%. Consistente en los ultimos 30 dias.',
        recomendacion: 'Documentar su proceso como referencia para el equipo. Considerar como mentora para nuevos disenadores.',
        confianza: 88,
        severity: 'INFO',
    },
    {
        id: 'i4',
        titulo: 'Cliente COOPERSAIN: revisiones excesivas',
        descripcion: 'Requiere 3+ revisiones en el 80% de sus ordenes. Incrementa lead time promedio en 2.1 dias por orden.',
        recomendacion: 'Enviar guia de preparacion de archivos y agendar llamada de alineacion con el cliente.',
        confianza: 75,
        severity: 'WARNING',
    },
];
// ─── Badge Colors ───────────────────────────────────────────────────────────
const badgeStyles = {
    ASSIGNMENT: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
    NOTIFICATION: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
    ANOMALY: { bg: 'bg-red-500/15', text: 'text-red-400' },
    AUTO_CLOSE: { bg: 'bg-gray-500/15', text: 'text-gray-400' },
    PREDICTION: { bg: 'bg-violet-500/15', text: 'text-violet-400' },
    PRIORITY: { bg: 'bg-orange-500/15', text: 'text-orange-400' },
    ALERT: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
    VALIDATION: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
};
const severityStyles = {
    CRITICAL: { border: 'border-l-red-500', icon: 'text-red-400', badge: 'bg-red-500/15', badgeText: 'text-red-400' },
    WARNING: { border: 'border-l-amber-500', icon: 'text-amber-400', badge: 'bg-amber-500/15', badgeText: 'text-amber-400' },
    INFO: { border: 'border-l-blue-500', icon: 'text-blue-400', badge: 'bg-blue-500/15', badgeText: 'text-blue-400' },
};
const targetLabels = {
    VENTAS: 'Ventas',
    SUPERVISOR_DISENO: 'Supervisor Diseno',
    SUPERVISOR_GENERAL: 'Supervisor General',
};
// ─── Health Score Ring ──────────────────────────────────────────────────────
function HealthScoreRing({ score }) {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 71 ? '#00FF88' : score >= 41 ? '#F59E0B' : '#EF4444';
    const glowColor = score >= 71 ? 'rgba(0,255,136,0.3)' : score >= 41 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)';
    return (_jsxs("div", { className: "relative w-36 h-36 flex-shrink-0", children: [_jsxs("svg", { className: "w-full h-full -rotate-90", viewBox: "0 0 120 120", children: [_jsx("circle", { cx: "60", cy: "60", r: radius, fill: "none", stroke: "#1E1E1E", strokeWidth: "8" }), _jsx("circle", { cx: "60", cy: "60", r: radius, fill: "none", stroke: color, strokeWidth: "8", strokeLinecap: "round", strokeDasharray: circumference, strokeDashoffset: offset, style: {
                            filter: `drop-shadow(0 0 8px ${glowColor})`,
                            transition: 'stroke-dashoffset 1s ease-out',
                        } })] }), _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [_jsx("span", { className: "text-3xl font-bold font-mono", style: { color, textShadow: `0 0 20px ${glowColor}` }, children: score }), _jsx("span", { className: "text-[10px] text-[#6B7280] uppercase tracking-wider mt-0.5", children: "Salud IA" })] })] }));
}
// ─── Main Component ─────────────────────────────────────────────────────────
export default function PanelCerebro() {
    const [dismissedConsultas, setDismissedConsultas] = useState(new Set());
    const [acknowledgedInsights, setAcknowledgedInsights] = useState(new Set());
    const activeConsultas = consultas.filter(c => !dismissedConsultas.has(c.id));
    const handleConsultaAction = (id) => {
        setDismissedConsultas(prev => new Set(prev).add(id));
    };
    const handleAcknowledgeInsight = (id) => {
        setAcknowledgedInsights(prev => new Set(prev).add(id));
    };
    return (_jsxs("div", { className: "h-full overflow-y-auto bg-[#0A0A0A] p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsxs("div", { className: "relative w-10 h-10 rounded-lg bg-[#00FF88]/10 flex items-center justify-center", children: [_jsx(Brain, { className: "w-5 h-5 text-[#00FF88]" }), _jsx("span", { className: "absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00FF88] animate-pulse" })] }), _jsxs("div", { children: [_jsx("h1", { className: "text-white text-xl font-bold", children: "Cerebro IA" }), _jsx("p", { className: "text-[#6B7280] text-sm", children: "Centro de inteligencia \u2014 Abril 2026" })] })] }), _jsxs("div", { className: "flex gap-4 mb-6", children: [_jsx("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-5 flex items-center justify-center", children: _jsx(HealthScoreRing, { score: HEALTH_SCORE }) }), _jsx("div", { className: "flex-1 grid grid-cols-2 gap-3", children: stats.map(stat => (_jsxs("div", { className: `bg-[#111111] border rounded-xl p-4 transition-all duration-300 ${stat.alert && stat.value > 0
                                ? 'border-amber-500/30'
                                : 'border-[#1E1E1E]'}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("div", { className: `w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`, children: _jsx(stat.icon, { className: `w-4 h-4 ${stat.color}` }) }), stat.alert && stat.value > 0 && (_jsx("span", { className: "w-2 h-2 rounded-full bg-amber-400 animate-pulse" }))] }), _jsx("p", { className: "text-2xl font-bold text-white font-mono", children: stat.value }), _jsx("p", { className: "text-[#6B7280] text-xs mt-0.5", children: stat.label })] }, stat.label))) })] }), activeConsultas.length > 0 && (_jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(MessageCircle, { className: "w-4 h-4 text-amber-400" }), _jsx("h2", { className: "text-white font-semibold text-sm", children: "Consultas Pendientes" }), _jsxs("span", { className: "ml-auto text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium", children: [activeConsultas.length, " requieren atencion"] })] }), _jsx("div", { className: "space-y-3", children: activeConsultas.map(consulta => (_jsxs("div", { className: "bg-[#111111] border border-amber-500/25 rounded-xl p-4 relative overflow-hidden", style: { boxShadow: '0 0 20px rgba(245,158,11,0.05)' }, children: [_jsx("div", { className: "absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-xl" }), _jsxs("div", { className: "flex items-start justify-between mb-2 pl-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Brain, { className: "w-4 h-4 text-[#00FF88]" }), _jsx("span", { className: "text-[#00FF88] text-xs font-semibold", children: "IA VOneB" }), _jsx("span", { className: "text-[10px] text-[#6B7280] bg-[#1A1A1A] px-1.5 py-0.5 rounded", children: targetLabels[consulta.target] })] }), _jsx("span", { className: "text-[#6B7280] text-xs", children: consulta.tiempo })] }), _jsx("p", { className: "text-[#9CA3AF] text-sm mb-2 pl-2", children: consulta.mensaje }), _jsxs("div", { className: "bg-[#0A0A0A] rounded-lg p-3 mb-3 ml-2", children: [_jsx("p", { className: "text-xs text-[#6B7280] mb-1 font-medium", children: "Recomendacion:" }), _jsx("p", { className: "text-white text-sm", children: consulta.recomendacion })] }), _jsxs("div", { className: "flex items-center gap-2 pl-2", children: [_jsxs("button", { onClick: () => handleConsultaAction(consulta.id), className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00FF88]/10 text-[#00FF88] text-xs font-medium hover:bg-[#00FF88]/20 transition-colors", children: [_jsx(CheckCircle, { className: "w-3.5 h-3.5" }), "Aprobar"] }), _jsxs("button", { onClick: () => handleConsultaAction(consulta.id), className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors", children: [_jsx(XCircle, { className: "w-3.5 h-3.5" }), "Rechazar"] }), _jsxs("button", { onClick: () => handleConsultaAction(consulta.id), className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A1A1A] text-[#9CA3AF] text-xs font-medium hover:bg-[#252525] transition-colors", children: [_jsx(Pencil, { className: "w-3.5 h-3.5" }), "Modificar"] })] })] }, consulta.id))) })] })), _jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Activity, { className: "w-4 h-4 text-[#6B7280]" }), _jsx("h2", { className: "text-white font-semibold text-sm", children: "Acciones Recientes" }), _jsx("span", { className: "ml-auto text-xs text-[#6B7280]", children: "Ultimas 24h" })] }), _jsx("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl overflow-hidden", children: acciones.map((accion, idx) => {
                            const badge = badgeStyles[accion.tipo];
                            return (_jsxs("div", { className: `flex items-start gap-3 px-4 py-3 ${idx < acciones.length - 1 ? 'border-b border-[#1E1E1E]' : ''} hover:bg-[#1A1A1A]/50 transition-colors`, children: [_jsx("div", { className: "flex flex-col items-center pt-0.5 flex-shrink-0", children: _jsx("div", { className: `w-7 h-7 rounded-lg ${badge.bg} flex items-center justify-center`, children: _jsx(accion.icon, { className: `w-3.5 h-3.5 ${badge.text}` }) }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-[#E5E7EB] text-sm leading-relaxed", children: accion.titulo }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsx(Clock, { className: "w-3 h-3 text-[#4B5563]" }), _jsx("span", { className: "text-[#6B7280] text-[11px]", children: accion.tiempo })] })] }), _jsx("span", { className: `flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded ${badge.bg} ${badge.text} uppercase tracking-wider`, children: accion.tipo.replace('_', ' ') })] }, accion.id));
                        }) })] }), _jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Lightbulb, { className: "w-4 h-4 text-violet-400" }), _jsx("h2", { className: "text-white font-semibold text-sm", children: "Insights del Cerebro" }), _jsxs("span", { className: "ml-auto text-xs text-[#6B7280]", children: [insights.length, " patrones"] })] }), _jsx("div", { className: "grid grid-cols-2 gap-3", children: insights.map(insight => {
                            const style = severityStyles[insight.severity];
                            const isAcked = acknowledgedInsights.has(insight.id);
                            return (_jsxs("div", { className: `bg-[#111111] border border-[#1E1E1E] border-l-4 ${style.border} rounded-xl p-4 transition-all duration-300 ${isAcked ? 'opacity-50' : ''}`, children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [insight.severity === 'CRITICAL' ? (_jsx(Shield, { className: `w-4 h-4 ${style.icon}` })) : insight.severity === 'WARNING' ? (_jsx(AlertTriangle, { className: `w-4 h-4 ${style.icon}` })) : (_jsx(Lightbulb, { className: `w-4 h-4 ${style.icon}` })), _jsx("span", { className: `text-[10px] font-semibold px-1.5 py-0.5 rounded ${style.badge} ${style.badgeText} uppercase tracking-wider`, children: insight.severity })] }), _jsx("div", { className: "flex items-center gap-1", children: _jsxs("div", { className: "text-[10px] text-[#6B7280] font-mono bg-[#1A1A1A] px-1.5 py-0.5 rounded", children: [insight.confianza, "%"] }) })] }), _jsx("h3", { className: "text-white text-sm font-semibold mb-1.5", children: insight.titulo }), _jsx("p", { className: "text-[#9CA3AF] text-xs leading-relaxed mb-2", children: insight.descripcion }), _jsxs("div", { className: "bg-[#0A0A0A] rounded-lg p-2.5 mb-3", children: [_jsx("p", { className: "text-[10px] text-[#6B7280] font-medium mb-0.5", children: "Recomendacion" }), _jsx("p", { className: "text-[#E5E7EB] text-xs leading-relaxed", children: insight.recomendacion })] }), _jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("span", { className: "text-[10px] text-[#6B7280]", children: "Confianza" }), _jsx("div", { className: "flex-1 h-1 bg-[#1A1A1A] rounded-full overflow-hidden", children: _jsx("div", { className: `h-full rounded-full ${insight.confianza >= 85 ? 'bg-[#00FF88]' : insight.confianza >= 70 ? 'bg-amber-400' : 'bg-red-400'}`, style: { width: `${insight.confianza}%` } }) })] }), _jsx("button", { onClick: () => handleAcknowledgeInsight(insight.id), disabled: isAcked, className: `w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isAcked
                                            ? 'bg-[#1A1A1A] text-[#4B5563] cursor-default'
                                            : 'bg-[#1A1A1A] text-[#9CA3AF] hover:bg-[#252525] hover:text-white'}`, children: isAcked ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "w-3.5 h-3.5" }), "Reconocido"] })) : (_jsxs(_Fragment, { children: [_jsx(ChevronRight, { className: "w-3.5 h-3.5" }), "Reconocer"] })) })] }, insight.id));
                        }) })] }), _jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Brain, { className: "w-4 h-4 text-[#6B7280]" }), _jsx("h3", { className: "text-white font-semibold text-sm", children: "Progreso de Aprendizaje" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "relative flex h-2.5 w-2.5", children: [_jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF88] opacity-75" }), _jsx("span", { className: "relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00FF88]" })] }), _jsx("span", { className: "text-[#00FF88] text-xs font-medium", children: "Cerebro activo" })] })] }), _jsx("div", { className: "w-full h-2 bg-[#1A1A1A] rounded-full overflow-hidden mb-3", children: _jsx("div", { className: "h-full rounded-full bg-gradient-to-r from-[#00FF88] to-[#00CC6A]", style: { width: '82%', transition: 'width 1.5s ease-out' } }) }), _jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("span", { className: "text-[#9CA3AF]", children: [_jsx("span", { className: "text-white font-mono font-bold", children: "1,234" }), " muestras procesadas"] }), _jsx("span", { className: "text-[#2A2A2A]", children: "|" }), _jsxs("span", { className: "text-[#9CA3AF]", children: [_jsx("span", { className: "text-white font-mono font-bold", children: "18" }), " metricas activas"] }), _jsx("span", { className: "text-[#2A2A2A]", children: "|" }), _jsxs("span", { className: "text-[#9CA3AF]", children: [_jsx("span", { className: "text-white font-mono font-bold", children: "5" }), " patrones detectados"] })] }), _jsxs("span", { className: "text-[#9CA3AF]", children: ["Precision estimada: ", _jsx("span", { className: "text-[#00FF88] font-mono font-bold", children: "82%" })] })] })] })] }));
}
