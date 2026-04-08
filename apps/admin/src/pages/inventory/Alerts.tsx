import { useInventoryStore } from '@/store/inventoryStore';
import type { StockAlert } from '@/types/inventory';
import { AlertTriangle, XCircle, Bell, CheckCircle } from 'lucide-react';

function AlertCard({ alert }: { alert: StockAlert }) {
  const { products, openEntryModal, setSelectedProduct, setView } = useInventoryStore();
  const isCritical = alert.status === 'critical';
  const percentage = alert.currentStock > 0
    ? Math.min(100, (alert.currentStock / alert.minStock) * 100)
    : 0;

  return (
    <div className={`
      bg-[#111111] border rounded-xl p-4 transition-all hover:bg-[#131313]
      ${isCritical ? 'border-[#EF4444]/30' : 'border-[#FF8C00]/20'}
    `}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-lg ${isCritical ? 'bg-[#EF4444]/10' : 'bg-[#FF8C00]/10'}`}>
          {isCritical
            ? <XCircle className="w-4 h-4 text-[#EF4444]" />
            : <AlertTriangle className="w-4 h-4 text-[#FF8C00]" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{alert.productName}</p>
          <p className="text-xs text-[#6B7280]">{alert.variantLabel}</p>
        </div>
        <span className={`
          text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0
          ${isCritical ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#FF8C00]/10 text-[#FF8C00]'}
        `}>
          {isCritical ? 'CRÍTICO' : 'BAJO'}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-[#6B7280]">Stock actual</span>
          <span className="font-bold" style={{ color: isCritical ? '#EF4444' : '#FF8C00' }}>
            {alert.currentStock} / {alert.minStock} mín.
          </span>
        </div>
        <div className="h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${percentage}%`,
              backgroundColor: isCritical ? '#EF4444' : '#FF8C00',
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-[#4B5563] bg-[#1A1A1A] px-2 py-0.5 rounded capitalize">{alert.category}</span>
        <div className="flex-1" />
        <button
          onClick={() => {
            const product = products.find(p => p.id === alert.productId);
            if (product) {
              setSelectedProduct(product.id);
              setView('products');
            }
          }}
          className="text-xs text-[#6B7280] hover:text-white px-2 py-1 rounded-lg hover:bg-[#1A1A1A] transition-colors"
        >
          Ver producto
        </button>
        <button
          onClick={() => openEntryModal(alert.variantId)}
          className={`
            text-xs font-medium px-3 py-1 rounded-lg transition-colors
            ${isCritical
              ? 'bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20'
              : 'bg-[#FF8C00]/10 text-[#FF8C00] hover:bg-[#FF8C00]/20'
            }
          `}
        >
          + Entrada
        </button>
      </div>
    </div>
  );
}

export function InventoryAlerts() {
  const alerts = useInventoryStore(s => s.alerts);
  const criticalAlerts = alerts.filter(a => a.status === 'critical');
  const lowAlerts = alerts.filter(a => a.status === 'low');

  return (
    <div className="h-full overflow-y-auto bg-[#0A0A0A] p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-5 h-5 text-[#00FF88]" />
        <div>
          <h1 className="text-xl font-bold text-white">Alertas de stock</h1>
          <p className="text-sm text-[#6B7280]">
            {criticalAlerts.length} críticas · {lowAlerts.length} bajas
          </p>
        </div>
        {alerts.length === 0 && (
          <span className="ml-auto text-xs text-[#00FF88] bg-[#00FF88]/10 px-3 py-1 rounded-full border border-[#00FF88]/20">
            Todo OK
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-[#6B7280]">
          <CheckCircle className="w-16 h-16 mb-4 text-[#00FF88] opacity-60" />
          <p className="text-lg font-semibold text-white mb-1">Sin alertas activas</p>
          <p className="text-sm">Todos los productos tienen stock suficiente</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Critical section */}
          {criticalAlerts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                <h2 className="text-sm font-bold text-[#EF4444]">Stock crítico ({criticalAlerts.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {criticalAlerts.map(alert => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            </section>
          )}

          {/* Low section */}
          {lowAlerts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#FF8C00]" />
                <h2 className="text-sm font-bold text-[#FF8C00]">Stock bajo ({lowAlerts.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {lowAlerts.map(alert => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
