import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useInventoryStore } from '@/store/inventoryStore';
import { LayoutDashboard, Package, ArrowLeftRight, Bell, Upload, Settings, MessageSquare, ChevronRight, ShoppingCart, ClipboardCheck, QrCode } from 'lucide-react';
import { InventoryDashboard } from './Dashboard';
import { InventoryProducts } from './Products';
import { InventoryMovements } from './Movements';
import { InventoryAlerts } from './Alerts';
import { InventoryImportExport } from './ImportExport';
import { InventorySettings } from './Settings';
import LocalSales from './LocalSales';
import PhysicalCount from './PhysicalCount';
import BarcodeManager from './BarcodeManager';
const navItems = [
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
function NavItem({ item, active, onClick, }) {
    const alertCount = useInventoryStore(s => s.alerts.length);
    const badgeCount = item.id === 'alerts' ? alertCount : null;
    return (_jsxs("button", { onClick: onClick, className: `
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
        transition-all duration-150 group relative
        ${active
            ? 'bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20'
            : 'text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A]'}
      `, children: [_jsx(item.icon, { className: `w-4 h-4 flex-shrink-0 ${active ? 'text-[#00FF88]' : ''}` }), _jsx("span", { className: "flex-1 text-left", children: item.label }), badgeCount ? (_jsx("span", { className: "bg-[#EF4444] text-white text-xs px-1.5 py-0.5 rounded-full font-semibold min-w-[20px] text-center", children: badgeCount > 99 ? '99+' : badgeCount })) : null, active && _jsx(ChevronRight, { className: "w-3.5 h-3.5 text-[#00FF88]/60" })] }));
}
function CurrentPage() {
    const view = useInventoryStore(s => s.currentView);
    switch (view) {
        case 'dashboard': return _jsx(InventoryDashboard, {});
        case 'products': return _jsx(InventoryProducts, {});
        case 'movements': return _jsx(InventoryMovements, {});
        case 'alerts': return _jsx(InventoryAlerts, {});
        case 'local-sales': return _jsx(LocalSales, {});
        case 'physical-count': return _jsx(PhysicalCount, {});
        case 'barcode-manager': return _jsx(BarcodeManager, {});
        case 'import-export': return _jsx(InventoryImportExport, {});
        case 'settings': return _jsx(InventorySettings, {});
        default: return _jsx(InventoryDashboard, {});
    }
}
export function InventoryLayout({ onBack }) {
    const currentView = useInventoryStore(s => s.currentView);
    const setView = useInventoryStore(s => s.setView);
    return (_jsxs("div", { className: "h-screen bg-[#0A0A0A] flex flex-col overflow-hidden", children: [_jsxs("header", { className: "h-14 border-b border-[#1E1E1E] bg-[#0F0F0F] flex items-center px-4 gap-3 flex-shrink-0", children: [_jsxs("button", { onClick: onBack, className: "flex items-center gap-2 text-[#6B7280] hover:text-white transition-colors text-sm", children: [_jsx(MessageSquare, { className: "w-4 h-4" }), _jsx("span", { children: "Chat" })] }), _jsx("span", { className: "text-[#2A2A2A]", children: "/" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Package, { className: "w-4 h-4 text-[#00FF88]" }), _jsx("span", { className: "text-white font-semibold text-sm", children: "Inventario" })] }), _jsx("div", { className: "flex-1" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" }), _jsx("span", { className: "text-[#6B7280] text-xs", children: "V ONE B Sistema" })] })] }), _jsxs("div", { className: "flex-1 flex overflow-hidden", children: [_jsxs("nav", { className: "w-56 flex-shrink-0 border-r border-[#1E1E1E] bg-[#0F0F0F] flex flex-col p-3 gap-1 overflow-y-auto", children: [['gestion', 'operaciones', 'herramientas'].map(section => {
                                const sectionLabels = { gestion: 'Gestión', operaciones: 'Operaciones', herramientas: 'Herramientas' };
                                const items = navItems.filter(i => i.section === section);
                                if (items.length === 0)
                                    return null;
                                return (_jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-semibold text-[#4B5563] uppercase tracking-wider px-3 mb-1 mt-2", children: sectionLabels[section] }), items.map(item => (_jsx(NavItem, { item: item, active: currentView === item.id, onClick: () => setView(item.id) }, item.id)))] }, section));
                            }), _jsx("div", { className: "flex-1" }), _jsx("div", { className: "border-t border-[#1E1E1E] pt-3 mt-3", children: _jsxs("div", { className: "px-3 py-2 rounded-lg bg-[#1A1A1A]", children: [_jsx("p", { className: "text-[10px] text-[#6B7280]", children: "V ONE B Admin" }), _jsx("p", { className: "text-xs text-[#9CA3AF] font-medium mt-0.5", children: "Panel de Inventario" })] }) })] }), _jsx("main", { className: "flex-1 overflow-hidden", children: _jsx(CurrentPage, {}) })] })] }));
}
