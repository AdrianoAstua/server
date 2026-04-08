import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useInventoryStore } from '@/store/inventoryStore';
import { AlertTriangle, XCircle, Bell, CheckCircle } from 'lucide-react';
function AlertCard({ alert }) {
    const { products, openEntryModal, setSelectedProduct, setView } = useInventoryStore();
    const isCritical = alert.status === 'critical';
    const percentage = alert.currentStock > 0
        ? Math.min(100, (alert.currentStock / alert.minStock) * 100)
        : 0;
    return (_jsxs("div", { className: `
      bg-[#111111] border rounded-xl p-4 transition-all hover:bg-[#131313]
      ${isCritical ? 'border-[#EF4444]/30' : 'border-[#FF8C00]/20'}
    `, children: [_jsxs("div", { className: "flex items-start gap-3 mb-3", children: [_jsx("div", { className: `p-2 rounded-lg ${isCritical ? 'bg-[#EF4444]/10' : 'bg-[#FF8C00]/10'}`, children: isCritical
                            ? _jsx(XCircle, { className: "w-4 h-4 text-[#EF4444]" })
                            : _jsx(AlertTriangle, { className: "w-4 h-4 text-[#FF8C00]" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-semibold text-white truncate", children: alert.productName }), _jsx("p", { className: "text-xs text-[#6B7280]", children: alert.variantLabel })] }), _jsx("span", { className: `
          text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0
          ${isCritical ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#FF8C00]/10 text-[#FF8C00]'}
        `, children: isCritical ? 'CRÍTICO' : 'BAJO' })] }), _jsxs("div", { className: "mb-3", children: [_jsxs("div", { className: "flex items-center justify-between text-xs mb-1.5", children: [_jsx("span", { className: "text-[#6B7280]", children: "Stock actual" }), _jsxs("span", { className: "font-bold", style: { color: isCritical ? '#EF4444' : '#FF8C00' }, children: [alert.currentStock, " / ", alert.minStock, " m\u00EDn."] })] }), _jsx("div", { className: "h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden", children: _jsx("div", { className: "h-full rounded-full transition-all", style: {
                                width: `${percentage}%`,
                                backgroundColor: isCritical ? '#EF4444' : '#FF8C00',
                            } }) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs text-[#4B5563] bg-[#1A1A1A] px-2 py-0.5 rounded capitalize", children: alert.category }), _jsx("div", { className: "flex-1" }), _jsx("button", { onClick: () => {
                            const product = products.find(p => p.id === alert.productId);
                            if (product) {
                                setSelectedProduct(product.id);
                                setView('products');
                            }
                        }, className: "text-xs text-[#6B7280] hover:text-white px-2 py-1 rounded-lg hover:bg-[#1A1A1A] transition-colors", children: "Ver producto" }), _jsx("button", { onClick: () => openEntryModal(alert.variantId), className: `
            text-xs font-medium px-3 py-1 rounded-lg transition-colors
            ${isCritical
                            ? 'bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20'
                            : 'bg-[#FF8C00]/10 text-[#FF8C00] hover:bg-[#FF8C00]/20'}
          `, children: "+ Entrada" })] })] }));
}
export function InventoryAlerts() {
    const alerts = useInventoryStore(s => s.alerts);
    const criticalAlerts = alerts.filter(a => a.status === 'critical');
    const lowAlerts = alerts.filter(a => a.status === 'low');
    return (_jsxs("div", { className: "h-full overflow-y-auto bg-[#0A0A0A] p-5", children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx(Bell, { className: "w-5 h-5 text-[#00FF88]" }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-white", children: "Alertas de stock" }), _jsxs("p", { className: "text-sm text-[#6B7280]", children: [criticalAlerts.length, " cr\u00EDticas \u00B7 ", lowAlerts.length, " bajas"] })] }), alerts.length === 0 && (_jsx("span", { className: "ml-auto text-xs text-[#00FF88] bg-[#00FF88]/10 px-3 py-1 rounded-full border border-[#00FF88]/20", children: "Todo OK" }))] }), alerts.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-24 text-[#6B7280]", children: [_jsx(CheckCircle, { className: "w-16 h-16 mb-4 text-[#00FF88] opacity-60" }), _jsx("p", { className: "text-lg font-semibold text-white mb-1", children: "Sin alertas activas" }), _jsx("p", { className: "text-sm", children: "Todos los productos tienen stock suficiente" })] })) : (_jsxs("div", { className: "space-y-6", children: [criticalAlerts.length > 0 && (_jsxs("section", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-[#EF4444]" }), _jsxs("h2", { className: "text-sm font-bold text-[#EF4444]", children: ["Stock cr\u00EDtico (", criticalAlerts.length, ")"] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", children: criticalAlerts.map(alert => (_jsx(AlertCard, { alert: alert }, alert.id))) })] })), lowAlerts.length > 0 && (_jsxs("section", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-[#FF8C00]" }), _jsxs("h2", { className: "text-sm font-bold text-[#FF8C00]", children: ["Stock bajo (", lowAlerts.length, ")"] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3", children: lowAlerts.map(alert => (_jsx(AlertCard, { alert: alert }, alert.id))) })] }))] }))] }));
}
