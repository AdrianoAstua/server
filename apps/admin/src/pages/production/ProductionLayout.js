import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useProductionStore } from '@/store/production-store';
import { ShoppingCart, Palette, Cog, CheckCircle, Package, Truck, BarChart3, AlertTriangle, MessageSquare, ChevronRight, Factory, Brain } from 'lucide-react';
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
function PlaceholderPanel({ title, icon: Icon }) {
    return (_jsx("div", { className: "h-full flex items-center justify-center bg-[#0A0A0A]", children: _jsxs("div", { className: "text-center", children: [_jsx(Icon, { className: "w-12 h-12 text-[#2A2A2A] mx-auto mb-4" }), _jsx("h2", { className: "text-white text-lg font-semibold mb-1", children: title }), _jsx("p", { className: "text-[#6B7280] text-sm", children: "Proximamente" })] }) }));
}
const navItems = [
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
function NavItem({ item, active, onClick, }) {
    return (_jsxs("button", { onClick: onClick, className: `
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
        transition-all duration-150 group relative
        ${active
            ? 'bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20'
            : 'text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A]'}
      `, children: [_jsx(item.icon, { className: `w-4 h-4 flex-shrink-0 ${active ? 'text-[#00FF88]' : ''}` }), _jsx("span", { className: "flex-1 text-left", children: item.label }), item.id === 'cerebro' && !active && (_jsxs("span", { className: "relative flex h-2 w-2", children: [_jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF88] opacity-75" }), _jsx("span", { className: "relative inline-flex rounded-full h-2 w-2 bg-[#00FF88]" })] })), active && _jsx(ChevronRight, { className: "w-3.5 h-3.5 text-[#00FF88]/60" })] }));
}
function CurrentPage() {
    const view = useProductionStore(s => s.currentView);
    const selectedWorkOrderId = useProductionStore(s => s.selectedWorkOrderId);
    // If a work order is selected in ventas view, show detail
    if (view === 'ventas' && selectedWorkOrderId) {
        return _jsx(WorkOrderDetail, {});
    }
    switch (view) {
        case 'ventas': return _jsx(PanelVentas, {});
        case 'diseno': return _jsx(PanelDiseno, {});
        case 'produccion': return _jsx(PanelProduccion, {});
        case 'calidad': return _jsx(PanelCalidad, {});
        case 'empaque': return _jsx(PanelEmpaque, {});
        case 'logistica': return _jsx(PanelLogistica, {});
        case 'metricas': return _jsx(DashboardMetricas, {});
        case 'incidencias': return _jsx(GestionIncidencias, {});
        case 'cerebro': return _jsx(PanelCerebro, {});
        default: return _jsx(PanelVentas, {});
    }
}
export function ProductionLayout({ onBack }) {
    const currentView = useProductionStore(s => s.currentView);
    const setView = useProductionStore(s => s.setView);
    const sectionLabels = {
        ordenes: 'Ordenes',
        produccion: 'Produccion',
        seguimiento: 'Seguimiento',
    };
    return (_jsxs("div", { className: "h-screen bg-[#0A0A0A] flex flex-col overflow-hidden", children: [_jsxs("header", { className: "h-14 border-b border-[#1E1E1E] bg-[#0F0F0F] flex items-center px-4 gap-3 flex-shrink-0", children: [_jsxs("button", { onClick: onBack, className: "flex items-center gap-2 text-[#6B7280] hover:text-white transition-colors text-sm", children: [_jsx(MessageSquare, { className: "w-4 h-4" }), _jsx("span", { children: "Chat" })] }), _jsx("span", { className: "text-[#2A2A2A]", children: "/" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Factory, { className: "w-4 h-4 text-[#00FF88]" }), _jsx("span", { className: "text-white font-semibold text-sm", children: "Produccion" })] }), _jsx("div", { className: "flex-1" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" }), _jsx("span", { className: "text-[#6B7280] text-xs", children: "V ONE B Sistema" })] })] }), _jsxs("div", { className: "flex-1 flex overflow-hidden", children: [_jsxs("nav", { className: "w-56 flex-shrink-0 border-r border-[#1E1E1E] bg-[#0F0F0F] flex flex-col p-3 gap-1 overflow-y-auto", children: [['ordenes', 'produccion', 'seguimiento'].map(section => {
                                const items = navItems.filter(i => i.section === section);
                                if (items.length === 0)
                                    return null;
                                return (_jsxs("div", { children: [_jsx("p", { className: "text-[10px] font-semibold text-[#4B5563] uppercase tracking-wider px-3 mb-1 mt-2", children: sectionLabels[section] }), items.map(item => (_jsx(NavItem, { item: item, active: currentView === item.id, onClick: () => setView(item.id) }, item.id)))] }, section));
                            }), _jsx("div", { className: "flex-1" }), _jsx("div", { className: "border-t border-[#1E1E1E] pt-3 mt-3", children: _jsxs("div", { className: "px-3 py-2 rounded-lg bg-[#1A1A1A]", children: [_jsx("p", { className: "text-[10px] text-[#6B7280]", children: "V ONE B Admin" }), _jsx("p", { className: "text-xs text-[#9CA3AF] font-medium mt-0.5", children: "Panel de Produccion" })] }) })] }), _jsx("main", { className: "flex-1 overflow-hidden", children: _jsx(CurrentPage, {}) })] })] }));
}
