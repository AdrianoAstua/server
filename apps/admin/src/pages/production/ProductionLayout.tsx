import { useProductionStore } from '@/store/production-store';
import type { ProductionView } from '@/types/production';
import {
  ShoppingCart, Palette, Cog, CheckCircle, Package,
  Truck, BarChart3, AlertTriangle, MessageSquare,
  ChevronRight, Factory, Brain
} from 'lucide-react';
import PanelVentas from './PanelVentas';
import WorkOrderDetail from './WorkOrderDetail';
import PanelDiseno from './PanelDiseno';
import PanelProduccion from './PanelProduccion';
import PanelCalidad from './PanelCalidad';
import PanelEmpaque from './PanelEmpaque';
import PanelLogistica from './PanelLogistica';
import GestionIncidencias from './GestionIncidencias';
import DashboardMetricas from './DashboardMetricas';
import PanelCerebro from './PanelCerebro';

// Placeholder panels for views not yet built
function PlaceholderPanel({ title, icon: Icon }: { title: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="h-full flex items-center justify-center bg-[#0A0A0A]">
      <div className="text-center">
        <Icon className="w-12 h-12 text-[#2A2A2A] mx-auto mb-4" />
        <h2 className="text-white text-lg font-semibold mb-1">{title}</h2>
        <p className="text-[#6B7280] text-sm">Proximamente</p>
      </div>
    </div>
  );
}

const navItems: { id: ProductionView; label: string; icon: React.ComponentType<{ className?: string }>; section: string }[] = [
  { id: 'ventas', label: 'Ventas', icon: ShoppingCart, section: 'ordenes' },
  { id: 'diseno', label: 'Diseno', icon: Palette, section: 'ordenes' },
  { id: 'produccion', label: 'Produccion', icon: Cog, section: 'produccion' },
  { id: 'calidad', label: 'Calidad', icon: CheckCircle, section: 'produccion' },
  { id: 'empaque', label: 'Empaque', icon: Package, section: 'produccion' },
  { id: 'logistica', label: 'Logistica', icon: Truck, section: 'seguimiento' },
  { id: 'metricas', label: 'Metricas', icon: BarChart3, section: 'seguimiento' },
  { id: 'incidencias', label: 'Incidencias', icon: AlertTriangle, section: 'seguimiento' },
  { id: 'cerebro', label: 'Cerebro IA', icon: Brain, section: 'seguimiento' },
];

function NavItem({
  item,
  active,
  onClick,
}: {
  item: typeof navItems[number];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
        transition-all duration-150 group relative
        ${active
          ? 'bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20'
          : 'text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A]'
        }
      `}
    >
      <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#00FF88]' : ''}`} />
      <span className="flex-1 text-left">{item.label}</span>
      {item.id === 'cerebro' && !active && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF88] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF88]" />
        </span>
      )}
      {active && <ChevronRight className="w-3.5 h-3.5 text-[#00FF88]/60" />}
    </button>
  );
}

function CurrentPage() {
  const view = useProductionStore(s => s.currentView);
  const selectedWorkOrderId = useProductionStore(s => s.selectedWorkOrderId);

  // If a work order is selected in ventas view, show detail
  if (view === 'ventas' && selectedWorkOrderId) {
    return <WorkOrderDetail />;
  }

  switch (view) {
    case 'ventas': return <PanelVentas />;
    case 'diseno': return <PanelDiseno />;
    case 'produccion': return <PanelProduccion />;
    case 'calidad': return <PanelCalidad />;
    case 'empaque': return <PanelEmpaque />;
    case 'logistica': return <PanelLogistica />;
    case 'metricas': return <DashboardMetricas />;
    case 'incidencias': return <GestionIncidencias />;
    case 'cerebro': return <PanelCerebro />;
    default: return <PanelVentas />;
  }
}

interface ProductionLayoutProps {
  onBack: () => void;
}

export function ProductionLayout({ onBack }: ProductionLayoutProps) {
  const currentView = useProductionStore(s => s.currentView);
  const setView = useProductionStore(s => s.setView);

  const sectionLabels: Record<string, string> = {
    ordenes: 'Ordenes',
    produccion: 'Produccion',
    seguimiento: 'Seguimiento',
  };

  return (
    <div className="h-screen bg-[#0A0A0A] flex flex-col overflow-hidden">
      {/* Top header bar */}
      <header className="h-14 border-b border-[#1E1E1E] bg-[#0F0F0F] flex items-center px-4 gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#6B7280] hover:text-white transition-colors text-sm"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat</span>
        </button>
        <span className="text-[#2A2A2A]">/</span>
        <div className="flex items-center gap-2">
          <Factory className="w-4 h-4 text-[#00FF88]" />
          <span className="text-white font-semibold text-sm">Produccion</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
          <span className="text-[#6B7280] text-xs">V ONE B Sistema</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar nav */}
        <nav className="w-56 flex-shrink-0 border-r border-[#1E1E1E] bg-[#0F0F0F] flex flex-col p-3 gap-1 overflow-y-auto">
          {(['ordenes', 'produccion', 'seguimiento'] as const).map(section => {
            const items = navItems.filter(i => i.section === section);
            if (items.length === 0) return null;
            return (
              <div key={section}>
                <p className="text-[10px] font-semibold text-[#4B5563] uppercase tracking-wider px-3 mb-1 mt-2">
                  {sectionLabels[section]}
                </p>
                {items.map(item => (
                  <NavItem
                    key={item.id}
                    item={item}
                    active={currentView === item.id}
                    onClick={() => setView(item.id)}
                  />
                ))}
              </div>
            );
          })}

          <div className="flex-1" />
          <div className="border-t border-[#1E1E1E] pt-3 mt-3">
            <div className="px-3 py-2 rounded-lg bg-[#1A1A1A]">
              <p className="text-[10px] text-[#6B7280]">V ONE B Admin</p>
              <p className="text-xs text-[#9CA3AF] font-medium mt-0.5">Panel de Produccion</p>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          <CurrentPage />
        </main>
      </div>
    </div>
  );
}
