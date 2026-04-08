import { useInventoryStore } from '@/store/inventoryStore';
import type { InventoryView } from '@/types/inventory';
import {
  LayoutDashboard, Package, ArrowLeftRight, Bell,
  Upload, Settings, MessageSquare, ChevronRight,
  ShoppingCart, ClipboardCheck, QrCode
} from 'lucide-react';
import { InventoryDashboard } from './Dashboard';
import { InventoryProducts } from './Products';
import { InventoryMovements } from './Movements';
import { InventoryAlerts } from './Alerts';
import { InventoryImportExport } from './ImportExport';
import { InventorySettings } from './Settings';
import LocalSales from './LocalSales';
import PhysicalCount from './PhysicalCount';
import BarcodeManager from './BarcodeManager';

const navItems: { id: InventoryView; label: string; icon: React.ComponentType<{ className?: string }>; section?: string; badge?: () => number | null }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'gestion' },
  { id: 'products', label: 'Productos', icon: Package, section: 'gestion' },
  { id: 'movements', label: 'Movimientos', icon: ArrowLeftRight, section: 'gestion' },
  {
    id: 'alerts', label: 'Alertas', icon: Bell, section: 'gestion',
    badge: () => {
      const { alerts } = useInventoryStore.getState();
      return alerts.length > 0 ? alerts.length : null;
    }
  },
  { id: 'local-sales', label: 'Punto de Venta', icon: ShoppingCart, section: 'operaciones' },
  { id: 'physical-count', label: 'Conteo Físico', icon: ClipboardCheck, section: 'operaciones' },
  { id: 'barcode-manager', label: 'Códigos de Barras', icon: QrCode, section: 'operaciones' },
  { id: 'import-export', label: 'Importar/Exportar', icon: Upload, section: 'herramientas' },
  { id: 'settings', label: 'Configuración', icon: Settings, section: 'herramientas' },
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
  const alertCount = useInventoryStore(s => s.alerts.length);
  const badgeCount = item.id === 'alerts' ? alertCount : null;

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
      {badgeCount ? (
        <span className="bg-[#EF4444] text-white text-xs px-1.5 py-0.5 rounded-full font-semibold min-w-[20px] text-center">
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      ) : null}
      {active && <ChevronRight className="w-3.5 h-3.5 text-[#00FF88]/60" />}
    </button>
  );
}

function CurrentPage() {
  const view = useInventoryStore(s => s.currentView);
  switch (view) {
    case 'dashboard': return <InventoryDashboard />;
    case 'products': return <InventoryProducts />;
    case 'movements': return <InventoryMovements />;
    case 'alerts': return <InventoryAlerts />;
    case 'local-sales': return <LocalSales />;
    case 'physical-count': return <PhysicalCount />;
    case 'barcode-manager': return <BarcodeManager />;
    case 'import-export': return <InventoryImportExport />;
    case 'settings': return <InventorySettings />;
    default: return <InventoryDashboard />;
  }
}

interface InventoryLayoutProps {
  onBack: () => void;
}

export function InventoryLayout({ onBack }: InventoryLayoutProps) {
  const currentView = useInventoryStore(s => s.currentView);
  const setView = useInventoryStore(s => s.setView);

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
          <Package className="w-4 h-4 text-[#00FF88]" />
          <span className="text-white font-semibold text-sm">Inventario</span>
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
          {(['gestion', 'operaciones', 'herramientas'] as const).map(section => {
            const sectionLabels = { gestion: 'Gestión', operaciones: 'Operaciones', herramientas: 'Herramientas' };
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
              <p className="text-xs text-[#9CA3AF] font-medium mt-0.5">Panel de Inventario</p>
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
