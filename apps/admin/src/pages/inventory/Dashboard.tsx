import { useState } from 'react';
import { useInventoryStore, getInventoryKPIs, getStockByCategory, getProductStatus } from '@/store/inventoryStore';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Package, AlertTriangle, TrendingDown, CheckCircle, DollarSign, Archive, XCircle, MapPin, ShoppingCart, RefreshCw } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  ciclismo: '#3B82F6',
  running: '#00FF88',
  natacion: '#06B6D4',
  tops: '#EC4899',
  accesorios: '#F59E0B',
  trail: '#8B5CF6',
};

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4 hover:border-[#2A2A2A] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}18` }}>
          <div style={{ color }}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
      <p className="text-xs text-[#6B7280]">{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color }}>{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm">
        <p className="text-white font-medium capitalize">{label}</p>
        <p className="text-[#00FF88]">{payload[0].value} unidades</p>
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm">
        <p className="text-white capitalize">{payload[0].name}</p>
        <p className="text-[#00FF88]">{payload[0].value} variantes</p>
      </div>
    );
  }
  return null;
};

const LOCATIONS = [
  { id: 'all', label: 'Todas', icon: '🌐' },
  { id: 'local', label: 'Tienda Local', icon: '🏪' },
  { id: 'shopify', label: 'Shopify', icon: '🛒' },
] as const;

export function InventoryDashboard() {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const products = useInventoryStore(s => s.products);
  const alerts = useInventoryStore(s => s.alerts);
  const setView = useInventoryStore(s => s.setView);
  const setSelectedProduct = useInventoryStore(s => s.setSelectedProduct);

  const kpis = getInventoryKPIs(products);
  const stockByCategory = getStockByCategory(products);

  // Valor a precio de venta
  const totalRetailValue = products.reduce((sum, p) =>
    sum + p.variants.reduce((s, v) => s + v.stock * (p.price / 100), 0), 0
  );

  const fmtM = (n: number) => {
    if (n >= 1_000_000) return `₡${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `₡${Math.round(n / 1_000)}K`;
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

  return (
    <div className="h-full overflow-y-auto bg-[#0A0A0A] p-5">
      {/* Title + Location Selector */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard de Inventario</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Resumen general — {new Date().toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-1 bg-[#111111] border border-[#1E1E1E] rounded-lg p-1">
          {LOCATIONS.map(loc => (
            <button
              key={loc.id}
              onClick={() => setSelectedLocation(loc.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                selectedLocation === loc.id
                  ? 'bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20'
                  : 'text-[#9CA3AF] hover:text-white hover:bg-[#1A1A1A]'
              }`}
            >
              <span>{loc.icon}</span>{loc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Operations Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <button
          onClick={() => setView('local-sales')}
          className="flex items-center gap-3 bg-[#111111] border border-[#1E1E1E] rounded-xl p-3 hover:border-[#00FF88]/30 transition-all group"
        >
          <div className="p-2 rounded-lg bg-[#00FF88]/10">
            <ShoppingCart className="w-4 h-4 text-[#00FF88]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white group-hover:text-[#00FF88] transition-colors">Punto de Venta</p>
            <p className="text-xs text-[#6B7280]">Abrir POS local</p>
          </div>
        </button>
        <button
          onClick={() => setView('physical-count')}
          className="flex items-center gap-3 bg-[#111111] border border-[#1E1E1E] rounded-xl p-3 hover:border-[#3B82F6]/30 transition-all group"
        >
          <div className="p-2 rounded-lg bg-[#3B82F6]/10">
            <MapPin className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white group-hover:text-[#3B82F6] transition-colors">Conteo Físico</p>
            <p className="text-xs text-[#6B7280]">Iniciar conteo</p>
          </div>
        </button>
        <button
          onClick={() => setView('barcode-manager')}
          className="flex items-center gap-3 bg-[#111111] border border-[#1E1E1E] rounded-xl p-3 hover:border-[#F59E0B]/30 transition-all group"
        >
          <div className="p-2 rounded-lg bg-[#F59E0B]/10">
            <Package className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white group-hover:text-[#F59E0B] transition-colors">Barcodes</p>
            <p className="text-xs text-[#6B7280]">Gestionar etiquetas</p>
          </div>
        </button>
        <div className="flex items-center gap-3 bg-[#111111] border border-[#1E1E1E] rounded-xl p-3">
          <div className="p-2 rounded-lg bg-[#8B5CF6]/10">
            <RefreshCw className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">Shopify Sync</p>
            <p className="text-xs text-[#00FF88]">Sincronizado hace 12 min</p>
          </div>
        </div>
      </div>

      {/* KPI Cards — fila 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <KpiCard icon={Package}       label="Productos activos" value={kpis.totalProducts}              color="#3B82F6" />
        <KpiCard icon={Archive}       label="Total unidades"    value={kpis.totalUnits.toLocaleString()} color="#00FF88" />
        <KpiCard icon={XCircle}       label="Agotados"          value={kpis.outOfStockCount} sub="variantes sin stock" color="#6B7280" />
        <KpiCard icon={AlertTriangle} label="Stock crítico"     value={kpis.criticalCount}   sub="variantes"           color="#EF4444" />
      </div>

      {/* KPI Cards — fila 2: valor inventario ancho + stock bajo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {/* Card valor — ocupa 3 cols en lg, 1 en mobile */}
        <div className="col-span-2 lg:col-span-3 bg-[#111111] border border-[#1E1E1E] rounded-xl p-4 hover:border-[#2A2A2A] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#F59E0B18' }}>
                <div style={{ color: '#F59E0B' }}><DollarSign className="w-4 h-4" /></div>
              </div>
              <span className="text-xs text-[#6B7280] font-medium">Valor inventario</span>
            </div>
          </div>
          <div className="flex items-end gap-6">
            <div>
              <p className="text-2xl font-bold text-white">{fmtM(totalRetailValue)}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">precio de venta</p>
            </div>
            <div className="pb-0.5">
              <p className="text-lg font-semibold text-[#F59E0B]">{fmtM(kpis.totalValue)}</p>
              <p className="text-xs text-[#6B7280]">costo</p>
            </div>
            <div className="ml-auto pb-0.5 text-right">
              <p className="text-lg font-semibold text-[#00FF88]">+{fmtM(totalRetailValue - kpis.totalValue)}</p>
              <p className="text-xs text-[#6B7280]">margen potencial</p>
            </div>
          </div>
        </div>

        <KpiCard icon={TrendingDown} label="Stock bajo" value={kpis.lowCount} sub="variantes" color="#FF8C00" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Bar chart - stock by category */}
        <div className="lg:col-span-2 bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Stock por categoría</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stockByCategory} barSize={28}>
              <XAxis
                dataKey="name"
                tick={{ fill: '#6B7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6B7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {stockByCategory.map(entry => (
                  <Cell
                    key={entry.name}
                    fill={CATEGORY_COLORS[entry.name] ?? '#3B82F6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut chart - status */}
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Distribución de estado</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {statusDistribution.map(entry => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-[#9CA3AF] capitalize">{value}</span>
                )}
                iconSize={8}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 10 products */}
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Top 10 productos por valor</h3>
            <button
              onClick={() => setView('products')}
              className="text-xs text-[#00FF88] hover:underline"
            >
              Ver todos →
            </button>
          </div>
          <div className="space-y-2">
            {topProducts.map((product, i) => {
              const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
              const value = totalStock * (product.cost / 100);
              const status = getProductStatus(product);
              const statusColors = { ok: '#00FF88', low: '#FF8C00', critical: '#EF4444', out: '#6B7280' };

              return (
                <div
                  key={product.id}
                  className="flex items-center gap-3 py-1.5 hover:bg-[#1A1A1A] rounded-lg px-2 cursor-pointer transition-colors group"
                  onClick={() => { setSelectedProduct(product.id); setView('products'); }}
                >
                  <span className="text-xs text-[#4B5563] w-5 text-right font-mono">{i + 1}</span>
                  <span className="text-base">{product.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate group-hover:text-[#00FF88] transition-colors">{product.name}</p>
                    <p className="text-xs text-[#6B7280] capitalize">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{totalStock} uds</p>
                    <p className="text-xs text-[#6B7280]">₡{Math.round(value / 1000)}K</p>
                  </div>
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: statusColors[status] }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent alerts */}
        <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Alertas recientes</h3>
            <button
              onClick={() => setView('alerts')}
              className="text-xs text-[#00FF88] hover:underline"
            >
              Ver todas →
            </button>
          </div>
          {recentAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-[#6B7280]">
              <CheckCircle className="w-8 h-8 mb-2 text-[#00FF88]" />
              <p className="text-sm">Sin alertas activas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAlerts.map(alert => (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#1A1A1A] cursor-pointer transition-colors"
                  onClick={() => setView('alerts')}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${alert.status === 'critical' ? 'bg-[#EF4444]' : 'bg-[#FF8C00]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{alert.productName}</p>
                    <p className="text-xs text-[#6B7280]">{alert.variantLabel} · {alert.currentStock} uds</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    alert.status === 'critical'
                      ? 'bg-[#EF4444]/10 text-[#EF4444]'
                      : 'bg-[#FF8C00]/10 text-[#FF8C00]'
                  }`}>
                    {alert.status === 'critical' ? 'Crítico' : 'Bajo'}
                  </span>
                </div>
              ))}
              {alerts.length > 5 && (
                <button
                  onClick={() => setView('alerts')}
                  className="w-full text-center text-xs text-[#6B7280] hover:text-white py-2 transition-colors"
                >
                  +{alerts.length - 5} alertas más
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
