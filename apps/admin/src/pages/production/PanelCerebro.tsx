import { useState } from 'react';
import {
  Brain, MessageCircle, AlertTriangle, Search, CheckCircle,
  XCircle, Pencil, Bell, Eye, Zap, Clock, ArrowUpDown,
  FileCheck, X, ChevronRight, Activity, Lightbulb, Shield
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

type ActionType = 'ASSIGNMENT' | 'NOTIFICATION' | 'ANOMALY' | 'AUTO_CLOSE' | 'PREDICTION' | 'PRIORITY' | 'ALERT' | 'VALIDATION';
type InsightSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
type ConsultaTarget = 'VENTAS' | 'SUPERVISOR_DISENO' | 'SUPERVISOR_GENERAL';

interface Consulta {
  id: string;
  mensaje: string;
  recomendacion: string;
  tiempo: string;
  target: ConsultaTarget;
}

interface AccionReciente {
  id: string;
  titulo: string;
  tiempo: string;
  tipo: ActionType;
  icon: React.ComponentType<{ className?: string }>;
}

interface Insight {
  id: string;
  titulo: string;
  descripcion: string;
  recomendacion: string;
  confianza: number;
  severity: InsightSeverity;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const HEALTH_SCORE = 78;

const stats = [
  { label: 'Acciones hoy', value: 23, icon: Brain, color: 'text-[#00FF88]', bg: 'bg-[#00FF88]/10' },
  { label: 'Consultas pendientes', value: 3, icon: MessageCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', alert: true },
  { label: 'Anomalias', value: 2, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', alert: true },
  { label: 'Patrones detectados', value: 5, icon: Search, color: 'text-violet-400', bg: 'bg-violet-500/10' },
];

const consultas: Consulta[] = [
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

const acciones: AccionReciente[] = [
  { id: 'a1', titulo: 'Auto-asigno disenadora Ana Lopez a VB-202604-0022 (carga: 2 activas)', tiempo: 'hace 5 min', tipo: 'ASSIGNMENT', icon: Zap },
  { id: 'a2', titulo: 'Notifico al cliente: pedido VB-202604-0018 listo para recoger', tiempo: 'hace 12 min', tipo: 'NOTIFICATION', icon: Bell },
  { id: 'a3', titulo: 'Detecto anomalia: estacion CORTE tarda 4.2h (promedio 1.5h)', tiempo: 'hace 23 min', tipo: 'ANOMALY', icon: AlertTriangle },
  { id: 'a4', titulo: 'Cerro automaticamente orden VB-202604-0010 (entregada, sin incidencias)', tiempo: 'hace 45 min', tipo: 'AUTO_CLOSE', icon: CheckCircle },
  { id: 'a5', titulo: 'Calculo fecha entrega VB-202604-0022: 11 abril (confianza 85%)', tiempo: 'hace 1h', tipo: 'PREDICTION', icon: Eye },
  { id: 'a6', titulo: 'Reordeno cola IMPRESION: VB-202604-0019 (URGENTE) movida al frente', tiempo: 'hace 1.5h', tipo: 'PRIORITY', icon: ArrowUpDown },
  { id: 'a7', titulo: 'Alerta: disenador Carlos Mendez tiene 6 ordenes activas (limite: 5)', tiempo: 'hace 2h', tipo: 'ALERT', icon: AlertTriangle },
  { id: 'a8', titulo: 'Valido archivo diseno VB-202604-0021: PNG 300dpi OK', tiempo: 'hace 3h', tipo: 'VALIDATION', icon: FileCheck },
];

const insights: Insight[] = [
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

const badgeStyles: Record<ActionType, { bg: string; text: string }> = {
  ASSIGNMENT:   { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  NOTIFICATION: { bg: 'bg-blue-500/15',    text: 'text-blue-400' },
  ANOMALY:      { bg: 'bg-red-500/15',     text: 'text-red-400' },
  AUTO_CLOSE:   { bg: 'bg-gray-500/15',    text: 'text-gray-400' },
  PREDICTION:   { bg: 'bg-violet-500/15',  text: 'text-violet-400' },
  PRIORITY:     { bg: 'bg-orange-500/15',  text: 'text-orange-400' },
  ALERT:        { bg: 'bg-amber-500/15',   text: 'text-amber-400' },
  VALIDATION:   { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
};

const severityStyles: Record<InsightSeverity, { border: string; icon: string; badge: string; badgeText: string }> = {
  CRITICAL: { border: 'border-l-red-500',    icon: 'text-red-400',    badge: 'bg-red-500/15',    badgeText: 'text-red-400' },
  WARNING:  { border: 'border-l-amber-500',  icon: 'text-amber-400',  badge: 'bg-amber-500/15',  badgeText: 'text-amber-400' },
  INFO:     { border: 'border-l-blue-500',   icon: 'text-blue-400',   badge: 'bg-blue-500/15',   badgeText: 'text-blue-400' },
};

const targetLabels: Record<ConsultaTarget, string> = {
  VENTAS: 'Ventas',
  SUPERVISOR_DISENO: 'Supervisor Diseno',
  SUPERVISOR_GENERAL: 'Supervisor General',
};

// ─── Health Score Ring ──────────────────────────────────────────────────────

function HealthScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 71 ? '#00FF88' : score >= 41 ? '#F59E0B' : '#EF4444';
  const glowColor = score >= 71 ? 'rgba(0,255,136,0.3)' : score >= 41 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)';

  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        {/* Background ring */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke="#1E1E1E"
          strokeWidth="8"
        />
        {/* Progress ring */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 8px ${glowColor})`,
            transition: 'stroke-dashoffset 1s ease-out',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-3xl font-bold font-mono"
          style={{ color, textShadow: `0 0 20px ${glowColor}` }}
        >
          {score}
        </span>
        <span className="text-[10px] text-[#6B7280] uppercase tracking-wider mt-0.5">Salud IA</span>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function PanelCerebro() {
  const [dismissedConsultas, setDismissedConsultas] = useState<Set<string>>(new Set());
  const [acknowledgedInsights, setAcknowledgedInsights] = useState<Set<string>>(new Set());

  const activeConsultas = consultas.filter(c => !dismissedConsultas.has(c.id));

  const handleConsultaAction = (id: string) => {
    setDismissedConsultas(prev => new Set(prev).add(id));
  };

  const handleAcknowledgeInsight = (id: string) => {
    setAcknowledgedInsights(prev => new Set(prev).add(id));
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0A0A0A] p-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative w-10 h-10 rounded-lg bg-[#00FF88]/10 flex items-center justify-center">
          <Brain className="w-5 h-5 text-[#00FF88]" />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00FF88] animate-pulse" />
        </div>
        <div>
          <h1 className="text-white text-xl font-bold">Cerebro IA</h1>
          <p className="text-[#6B7280] text-sm">Centro de inteligencia — Abril 2026</p>
        </div>
      </div>

      {/* ── Section 1: Health Score + Stats ─────────────────────────────── */}
      <div className="flex gap-4 mb-6">
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-5 flex items-center justify-center">
          <HealthScoreRing score={HEALTH_SCORE} />
        </div>

        <div className="flex-1 grid grid-cols-2 gap-3">
          {stats.map(stat => (
            <div
              key={stat.label}
              className={`bg-[#111111] border rounded-xl p-4 transition-all duration-300 ${
                stat.alert && stat.value > 0
                  ? 'border-amber-500/30'
                  : 'border-[#1E1E1E]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                {stat.alert && stat.value > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>
              <p className="text-2xl font-bold text-white font-mono">{stat.value}</p>
              <p className="text-[#6B7280] text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 2: Consultas Pendientes ─────────────────────────────── */}
      {activeConsultas.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-amber-400" />
            <h2 className="text-white font-semibold text-sm">Consultas Pendientes</h2>
            <span className="ml-auto text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium">
              {activeConsultas.length} requieren atencion
            </span>
          </div>

          <div className="space-y-3">
            {activeConsultas.map(consulta => (
              <div
                key={consulta.id}
                className="bg-[#111111] border border-amber-500/25 rounded-xl p-4 relative overflow-hidden"
                style={{ boxShadow: '0 0 20px rgba(245,158,11,0.05)' }}
              >
                {/* Ambient glow on the left */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-xl" />

                <div className="flex items-start justify-between mb-2 pl-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-[#00FF88]" />
                    <span className="text-[#00FF88] text-xs font-semibold">IA VOneB</span>
                    <span className="text-[10px] text-[#6B7280] bg-[#1A1A1A] px-1.5 py-0.5 rounded">
                      {targetLabels[consulta.target]}
                    </span>
                  </div>
                  <span className="text-[#6B7280] text-xs">{consulta.tiempo}</span>
                </div>

                <p className="text-[#9CA3AF] text-sm mb-2 pl-2">{consulta.mensaje}</p>

                <div className="bg-[#0A0A0A] rounded-lg p-3 mb-3 ml-2">
                  <p className="text-xs text-[#6B7280] mb-1 font-medium">Recomendacion:</p>
                  <p className="text-white text-sm">{consulta.recomendacion}</p>
                </div>

                <div className="flex items-center gap-2 pl-2">
                  <button
                    onClick={() => handleConsultaAction(consulta.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00FF88]/10 text-[#00FF88] text-xs font-medium hover:bg-[#00FF88]/20 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleConsultaAction(consulta.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleConsultaAction(consulta.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A1A1A] text-[#9CA3AF] text-xs font-medium hover:bg-[#252525] transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Modificar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Section 3: Acciones Recientes ───────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-[#6B7280]" />
          <h2 className="text-white font-semibold text-sm">Acciones Recientes</h2>
          <span className="ml-auto text-xs text-[#6B7280]">Ultimas 24h</span>
        </div>

        <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl overflow-hidden">
          {acciones.map((accion, idx) => {
            const badge = badgeStyles[accion.tipo];
            return (
              <div
                key={accion.id}
                className={`flex items-start gap-3 px-4 py-3 ${
                  idx < acciones.length - 1 ? 'border-b border-[#1E1E1E]' : ''
                } hover:bg-[#1A1A1A]/50 transition-colors`}
              >
                {/* Timeline dot + line */}
                <div className="flex flex-col items-center pt-0.5 flex-shrink-0">
                  <div className={`w-7 h-7 rounded-lg ${badge.bg} flex items-center justify-center`}>
                    <accion.icon className={`w-3.5 h-3.5 ${badge.text}`} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[#E5E7EB] text-sm leading-relaxed">{accion.titulo}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-[#4B5563]" />
                    <span className="text-[#6B7280] text-[11px]">{accion.tiempo}</span>
                  </div>
                </div>

                {/* Badge */}
                <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded ${badge.bg} ${badge.text} uppercase tracking-wider`}>
                  {accion.tipo.replace('_', ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 4: Insights del Cerebro ─────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-violet-400" />
          <h2 className="text-white font-semibold text-sm">Insights del Cerebro</h2>
          <span className="ml-auto text-xs text-[#6B7280]">{insights.length} patrones</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {insights.map(insight => {
            const style = severityStyles[insight.severity];
            const isAcked = acknowledgedInsights.has(insight.id);

            return (
              <div
                key={insight.id}
                className={`bg-[#111111] border border-[#1E1E1E] border-l-4 ${style.border} rounded-xl p-4 transition-all duration-300 ${
                  isAcked ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {insight.severity === 'CRITICAL' ? (
                      <Shield className={`w-4 h-4 ${style.icon}`} />
                    ) : insight.severity === 'WARNING' ? (
                      <AlertTriangle className={`w-4 h-4 ${style.icon}`} />
                    ) : (
                      <Lightbulb className={`w-4 h-4 ${style.icon}`} />
                    )}
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${style.badge} ${style.badgeText} uppercase tracking-wider`}>
                      {insight.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="text-[10px] text-[#6B7280] font-mono bg-[#1A1A1A] px-1.5 py-0.5 rounded">
                      {insight.confianza}%
                    </div>
                  </div>
                </div>

                <h3 className="text-white text-sm font-semibold mb-1.5">{insight.titulo}</h3>
                <p className="text-[#9CA3AF] text-xs leading-relaxed mb-2">{insight.descripcion}</p>

                <div className="bg-[#0A0A0A] rounded-lg p-2.5 mb-3">
                  <p className="text-[10px] text-[#6B7280] font-medium mb-0.5">Recomendacion</p>
                  <p className="text-[#E5E7EB] text-xs leading-relaxed">{insight.recomendacion}</p>
                </div>

                {/* Confidence bar */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] text-[#6B7280]">Confianza</span>
                  <div className="flex-1 h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        insight.confianza >= 85 ? 'bg-[#00FF88]' : insight.confianza >= 70 ? 'bg-amber-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${insight.confianza}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleAcknowledgeInsight(insight.id)}
                  disabled={isAcked}
                  className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isAcked
                      ? 'bg-[#1A1A1A] text-[#4B5563] cursor-default'
                      : 'bg-[#1A1A1A] text-[#9CA3AF] hover:bg-[#252525] hover:text-white'
                  }`}
                >
                  {isAcked ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Reconocido
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-3.5 h-3.5" />
                      Reconocer
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom: Learning Progress ───────────────────────────────────── */}
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#6B7280]" />
            <h3 className="text-white font-semibold text-sm">Progreso de Aprendizaje</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF88] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00FF88]" />
            </span>
            <span className="text-[#00FF88] text-xs font-medium">Cerebro activo</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-[#1A1A1A] rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#00FF88] to-[#00CC6A]"
            style={{ width: '82%', transition: 'width 1.5s ease-out' }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="text-[#9CA3AF]">
              <span className="text-white font-mono font-bold">1,234</span> muestras procesadas
            </span>
            <span className="text-[#2A2A2A]">|</span>
            <span className="text-[#9CA3AF]">
              <span className="text-white font-mono font-bold">18</span> metricas activas
            </span>
            <span className="text-[#2A2A2A]">|</span>
            <span className="text-[#9CA3AF]">
              <span className="text-white font-mono font-bold">5</span> patrones detectados
            </span>
          </div>
          <span className="text-[#9CA3AF]">
            Precision estimada: <span className="text-[#00FF88] font-mono font-bold">82%</span>
          </span>
        </div>
      </div>
    </div>
  );
}
