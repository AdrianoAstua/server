import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useInventoryStore, getInventoryKPIs, getStockByCategory, getProductStatus } from '@/store/inventoryStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Package, AlertTriangle, TrendingDown, CheckCircle, DollarSign, Archive, XCircle, MapPin, ShoppingCart, RefreshCw } from 'lucide-react';
const CATEGORY_COLORS = {
    ciclismo: '#3B82F6',
    running: '#00FF88',
    natacion: '#06B6D4',
    tops: '#EC4899',
    accesorios: '#F59E0B',
    trail: '#8B5CF6',
};
function KpiCard({ icon: Icon, label, value, sub, color }) {
    return (_jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-4 hover:border-[#2A2A2A] transition-colors", children: [_jsx("div", { className: "flex items-start justify-between mb-3", children: _jsx("div", { className: "p-2 rounded-lg", style: { backgroundColor: `${color}18` }, children: _jsx("div", { style: { color }, children: _jsx(Icon, { className: "w-4 h-4" }) }) }) }), _jsx("p", { className: "text-2xl font-bold text-white mb-0.5", children: value }), _jsx("p", { className: "text-xs text-[#6B7280]", children: label }), sub && _jsx("p", { className: "text-xs mt-1", style: { color }, children: sub })] }));
}
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (_jsxs("div", { className: "bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm", children: [_jsx("p", { className: "text-white font-medium capitalize", children: label }), _jsxs("p", { className: "text-[#00FF88]", children: [payload[0].value, " unidades"] })] }));
    }
    return null;
};
const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (_jsxs("div", { className: "bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm", children: [_jsx("p", { className: "text-white capitalize", children: payload[0].name }), _jsxs("p", { className: "text-[#00FF88]", children: [payload[0].value, " variantes"] })] }));
    }
    return null;
};
const LOCATIONS = [
    { id: 'all', label: 'Todas', icon: '🌐' },
    { id: 'local', label: 'Tienda Local', icon: '🏪' },
    { id: 'shopify', label: 'Shopify', icon: '🛒' },
];
export function InventoryDashboard() {
    const [selectedLocation, setSelectedLocation] = useState('all');
    const products = useInventoryStore(s => s.products);
    const alerts = useInventoryStore(s => s.alerts);
    const setView = useInventoryStore(s => s.setView);
    const setSelectedProduct = useInventoryStore(s => s.setSelectedProduct);
    const kpis = getInventoryKPIs(products);
    const stockByCategory = getStockByCategory(products);
    // Valor a precio de venta
    const totalRetailValue = products.reduce((sum, p) => sum + p.variants.reduce((s, v) => s + v.stock * (p.price / 100), 0), 0);
    const fmtM = (n) => {
        if (n >= 1_000_000)
            return `₡${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000)
            return `₡${Math.round(n / 1_000)}K`;
        return `₡${Math.round(n)}`;
    };
    const statusDistribution = [
        { name: 'ok', value: kpis.okCount, color: '#00FF88' },
        { name: 'bajo', value: kpis.lowCount, color: '#FF8C00' },
        { name: 'crítico', value: kpis.criticalCount, color: '#EF4444' },
        { name: 'agotado', value: kpis.outOfStockCount, color: '#6B7280' },
    ].filter(d => d.value > 0);
    // Top 10 products by stock value
    const topProducts = [...products]
        .sort((a, b) => {
        const valA = a.variants.reduce((s, v) => s + v.stock, 0) * (a.cost / 100);
        const valB = b.variants.reduce((s, v) => s + v.stock, 0) * (b.cost / 100);
        return valB - valA;
    })
        .slice(0, 10);
    const recentAlerts = alerts.slice(0, 5);
    return (_jsxs("div", { className: "h-full overflow-y-auto bg-[#0A0A0A] p-5", children: [_jsxs("div", { className: "mb-6 flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-white", children: "Dashboard de Inventario" }), _jsxs("p", { className: "text-sm text-[#6B7280] mt-0.5", children: ["Resumen general \u2014 ", new Date().toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })] })] }), _jsx("div", { className: "flex items-center gap-1 bg-[#111111] border border-[#1E1E1E] rounded-lg p-1", children: LOCATIONS.map(loc => (_jsxs("button", { onClick: () => setSelectedLocation(loc.id), className: `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${selectedLocation === loc.id
                                ? 'bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20'
                                : 'text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A]'}`, children: [_jsx("span", { children: loc.icon }), loc.label] }, loc.id))) })] }), _jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4", children: [_jsxs("button", { onClick: () => setView('local-sales'), className: "flex items-center gap-3 bg-[#111111] border border-[#1E1E1E] rounded-xl p-3 hover:border-[#00FF88]/30 transition-all group", children: [_jsx("div", { className: "p-2 rounded-lg bg-[#00FF88]/10", children: _jsx(ShoppingCart, { className: "w-4 h-4 text-[#00FF88]" }) }), _jsxs("div", { className: "text-left", children: [_jsx("p", { className: "text-sm font-medium text-white group-hover:text-[#00FF88] transition-colors", children: "Punto de Venta" }), _jsx("p", { className: "text-xs text-[#6B7280]", children: "Abrir POS local" })] })] }), _jsxs("button", { onClick: () => setView('physical-count'), className: "flex items-center gap-3 bg-[#111111] border border-[#1E1E1E] rounded-xl p-3 hover:border-[#3B82F6]/30 transition-all group", children: [_jsx("div", { className: "p-2 rounded-lg bg-[#3B82F6]/10", children: _jsx(MapPin, { className: "w-4 h-4 text-[#3B82F6]" }) }), _jsxs("div", { className: "text-left", children: [_jsx("p", { className: "text-sm font-medium text-white group-hover:text-[#3B82F6] transition-colors", children: "Conteo F\u00EDsico" }), _jsx("p", { className: "text-xs text-[#6B7280]", children: "Iniciar conteo" })] })] }), _jsxs("button", { onClick: () => setView('barcode-manager'), className: "flex items-center gap-3 bg-[#111111] border border-[#1E1E1E] rounded-xl p-3 hover:border-[#F59E0B]/30 transition-all group", children: [_jsx("div", { className: "p-2 rounded-lg bg-[#F59E0B]/10", children: _jsx(Package, { className: "w-4 h-4 text-[#F59E0B]" }) }), _jsxs("div", { className: "text-left", children: [_jsx("p", { className: "text-sm font-medium text-white group-hover:text-[#F59E0B] transition-colors", children: "Barcodes" }), _jsx("p", { className: "text-xs text-[#6B7280]", children: "Gestionar etiquetas" })] })] }), _jsxs("div", { className: "flex items-center gap-3 bg-[#111111] border border-[#1E1E1E] rounded-xl p-3", children: [_jsx("div", { className: "p-2 rounded-lg bg-[#8B5CF6]/10", children: _jsx(RefreshCw, { className: "w-4 h-4 text-[#8B5CF6]" }) }), _jsxs("div", { className: "text-left", children: [_jsx("p", { className: "text-sm font-medium text-white", children: "Shopify Sync" }), _jsx("p", { className: "text-xs text-[#00FF88]", children: "Sincronizado hace 12 min" })] })] })] }), _jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3", children: [_jsx(KpiCard, { icon: Package, label: "Productos activos", value: kpis.totalProducts, color: "#3B82F6" }), _jsx(KpiCard, { icon: Archive, label: "Total unidades", value: kpis.totalUnits.toLocaleString(), color: "#00FF88" }), _jsx(KpiCard, { icon: XCircle, label: "Agotados", value: kpis.outOfStockCount, sub: "variantes sin stock", color: "#6B7280" }), _jsx(KpiCard, { icon: AlertTriangle, label: "Stock cr\u00EDtico", value: kpis.criticalCount, sub: "variantes", color: "#EF4444" })] }), _jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6", children: [_jsxs("div", { className: "col-span-2 lg:col-span-3 bg-[#111111] border border-[#1E1E1E] rounded-xl p-4 hover:border-[#2A2A2A] transition-colors", children: [_jsx("div", { className: "flex items-center justify-between mb-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "p-2 rounded-lg", style: { backgroundColor: '#F59E0B18' }, children: _jsx("div", { style: { color: '#F59E0B' }, children: _jsx(DollarSign, { className: "w-4 h-4" }) }) }), _jsx("span", { className: "text-xs text-[#6B7280] font-medium", children: "Valor inventario" })] }) }), _jsxs("div", { className: "flex items-end gap-6", children: [_jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold text-white", children: fmtM(totalRetailValue) }), _jsx("p", { className: "text-xs text-[#6B7280] mt-0.5", children: "precio de venta" })] }), _jsxs("div", { className: "pb-0.5", children: [_jsx("p", { className: "text-lg font-semibold text-[#F59E0B]", children: fmtM(kpis.totalValue) }), _jsx("p", { className: "text-xs text-[#6B7280]", children: "costo" })] }), _jsxs("div", { className: "ml-auto pb-0.5 text-right", children: [_jsxs("p", { className: "text-lg font-semibold text-[#00FF88]", children: ["+", fmtM(totalRetailValue - kpis.totalValue)] }), _jsx("p", { className: "text-xs text-[#6B7280]", children: "margen potencial" })] })] })] }), _jsx(KpiCard, { icon: TrendingDown, label: "Stock bajo", value: kpis.lowCount, sub: "variantes", color: "#FF8C00" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6", children: [_jsxs("div", { className: "lg:col-span-2 bg-[#111111] border border-[#1E1E1E] rounded-xl p-4", children: [_jsx("h3", { className: "text-sm font-semibold text-white mb-4", children: "Stock por categor\u00EDa" }), _jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(BarChart, { data: stockByCategory, barSize: 28, children: [_jsx(XAxis, { dataKey: "name", tick: { fill: '#6B7280', fontSize: 11 }, axisLine: false, tickLine: false }), _jsx(YAxis, { tick: { fill: '#6B7280', fontSize: 11 }, axisLine: false, tickLine: false, width: 35 }), _jsx(Tooltip, { content: _jsx(CustomTooltip, {}) }), _jsx(Bar, { dataKey: "value", radius: [4, 4, 0, 0], children: stockByCategory.map(entry => (_jsx(Cell, { fill: CATEGORY_COLORS[entry.name] ?? '#3B82F6' }, entry.name))) })] }) })] }), _jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-4", children: [_jsx("h3", { className: "text-sm font-semibold text-white mb-4", children: "Distribuci\u00F3n de estado" }), _jsx(ResponsiveContainer, { width: "100%", height: 200, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: statusDistribution, cx: "50%", cy: "50%", innerRadius: 55, outerRadius: 80, paddingAngle: 3, dataKey: "value", children: statusDistribution.map(entry => (_jsx(Cell, { fill: entry.color }, entry.name))) }), _jsx(Tooltip, { content: _jsx(PieTooltip, {}) }), _jsx(Legend, { formatter: (value) => (_jsx("span", { className: "text-xs text-[#9CA3AF] capitalize", children: value })), iconSize: 8, iconType: "circle" })] }) })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-sm font-semibold text-white", children: "Top 10 productos por valor" }), _jsx("button", { onClick: () => setView('products'), className: "text-xs text-[#00FF88] hover:underline", children: "Ver todos \u2192" })] }), _jsx("div", { className: "space-y-2", children: topProducts.map((product, i) => {
                                    const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
                                    const value = totalStock * (product.cost / 100);
                                    const status = getProductStatus(product);
                                    const statusColors = { ok: '#00FF88', low: '#FF8C00', critical: '#EF4444', out: '#6B7280' };
                                    return (_jsxs("div", { className: "flex items-center gap-3 py-1.5 hover:bg-[#1A1A1A] rounded-lg px-2 cursor-pointer transition-colors group", onClick: () => { setSelectedProduct(product.id); setView('products'); }, children: [_jsx("span", { className: "text-xs text-[#4B5563] w-5 text-right font-mono", children: i + 1 }), _jsx("span", { className: "text-base", children: product.emoji }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm text-white truncate group-hover:text-[#00FF88] transition-colors", children: product.name }), _jsx("p", { className: "text-xs text-[#6B7280] capitalize", children: product.category })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-sm font-semibold text-white", children: [totalStock, " uds"] }), _jsxs("p", { className: "text-xs text-[#6B7280]", children: ["\u20A1", Math.round(value / 1000), "K"] })] }), _jsx("div", { className: "w-2 h-2 rounded-full flex-shrink-0", style: { backgroundColor: statusColors[status] } })] }, product.id));
                                }) })] }), _jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-sm font-semibold text-white", children: "Alertas recientes" }), _jsx("button", { onClick: () => setView('alerts'), className: "text-xs text-[#00FF88] hover:underline", children: "Ver todas \u2192" })] }), recentAlerts.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-8 text-[#6B7280]", children: [_jsx(CheckCircle, { className: "w-8 h-8 mb-2 text-[#00FF88]" }), _jsx("p", { className: "text-sm", children: "Sin alertas activas" })] })) : (_jsxs("div", { className: "space-y-2", children: [recentAlerts.map(alert => (_jsxs("div", { className: "flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#1A1A1A] cursor-pointer transition-colors", onClick: () => setView('alerts'), children: [_jsx("div", { className: `w-2 h-2 rounded-full flex-shrink-0 ${alert.status === 'critical' ? 'bg-[#EF4444]' : 'bg-[#FF8C00]'}` }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm text-white truncate", children: alert.productName }), _jsxs("p", { className: "text-xs text-[#6B7280]", children: [alert.variantLabel, " \u00B7 ", alert.currentStock, " uds"] })] }), _jsx("span", { className: `text-xs font-medium px-2 py-0.5 rounded-full ${alert.status === 'critical'
                                                    ? 'bg-[#EF4444]/10 text-[#EF4444]'
                                                    : 'bg-[#FF8C00]/10 text-[#FF8C00]'}`, children: alert.status === 'critical' ? 'Crítico' : 'Bajo' })] }, alert.id))), alerts.length > 5 && (_jsxs("button", { onClick: () => setView('alerts'), className: "w-full text-center text-xs text-[#6B7280] hover:text-white py-2 transition-colors", children: ["+", alerts.length - 5, " alertas m\u00E1s"] }))] }))] })] })] }));
}
