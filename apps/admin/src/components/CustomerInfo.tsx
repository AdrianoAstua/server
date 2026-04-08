import { ArrowLeft, User, Phone, Mail, MapPin, Package, ExternalLink, TrendingUp, Activity } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';

function formatCurrency(amount: number): string {
  return `₡${amount.toLocaleString()}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
}

export function CustomerInfo() {
  const conversation = useChatStore(state => state.getSelectedConversation());
  const setView = useChatStore(state => state.setView);
  const toggleInfoPanel = useChatStore(state => state.toggleInfoPanel);

  if (!conversation) {
    return (
      <aside className="w-full h-full bg-[#111111] border-l border-white/10 flex items-center justify-center">
        <p className="text-white/40 text-sm">Selecciona una conversación</p>
      </aside>
    );
  }

  const { customer } = conversation;

  return (
    <aside className="w-full h-full bg-[#111111] border-l border-white/10 flex flex-col">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        <button
          onClick={() => setView('chat')}
          className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </button>
        <h2 className="text-white font-medium">Información del Cliente</h2>
        <button
          onClick={toggleInfoPanel}
          className="hidden lg:block p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <span className="text-white/50 text-lg">×</span>
        </button>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Avatar y nombre */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#3B82F6] to-[#00FF88] rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-white font-semibold text-lg">{customer.name}</h3>
          <p className="text-white/50 text-sm">
            Cliente desde {formatDate(customer.customerSince)}
          </p>
        </div>

        {/* Información de contacto */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm">
            <Phone className="w-4 h-4 text-white/40" />
            <span className="text-white/70">{customer.phone}</span>
          </div>
          {customer.email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-white/40" />
              <span className="text-white/70">{customer.email}</span>
            </div>
          )}
          {customer.address && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-white/40" />
              <span className="text-white/70">{customer.address}</span>
            </div>
          )}
        </div>

        {/* Pedidos Activos */}
        {customer.activeOrders.length > 0 && (
          <div className="mb-6">
            <h4 className="text-white/50 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <Package className="w-3.5 h-3.5" />
              Pedidos Activos
            </h4>
            <div className="space-y-2">
              {customer.activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white/5 rounded-lg p-3 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm">{order.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'ready'
                        ? 'bg-[#00FF88]/20 text-[#00FF88]'
                        : 'bg-[#3B82F6]/20 text-[#3B82F6]'
                    }`}>
                      {order.status === 'ready' ? '✅ Listo' : '🔄 En Proceso'}
                    </span>
                  </div>
                  <p className="text-white/60 text-xs">
                    {order.items.map(item => 
                      `${item.product.name} (${item.size})`
                    ).join(', ')}
                  </p>
                  <p className="text-white font-medium text-sm mt-2">
                    {formatCurrency(order.total)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historial */}
        <div className="mb-6">
          <h4 className="text-white/50 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Historial
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/50 text-xs">Total pedidos</p>
              <p className="text-white font-semibold text-lg">{customer.totalOrders}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/50 text-xs">Total compras</p>
              <p className="text-white font-semibold text-lg">{formatCurrency(customer.totalSpent)}</p>
            </div>
          </div>
          {customer.lastOrderDate && (
            <p className="text-white/50 text-xs mt-2">
              Último pedido: {formatDate(customer.lastOrderDate)}
            </p>
          )}
        </div>

        {/* Deportes */}
        {customer.sports.length > 0 && (
          <div className="mb-6">
            <h4 className="text-white/50 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" />
              Deportes
            </h4>
            <div className="flex flex-wrap gap-2">
              {customer.sports.map((sport, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/70"
                >
                  {sport}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Productos frecuentes */}
        {customer.frequentProducts.length > 0 && (
          <div className="mb-6">
            <h4 className="text-white/50 text-xs uppercase tracking-wider mb-3">
              Productos Frecuentes
            </h4>
            <div className="space-y-2">
              {customer.frequentProducts.map((product, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <span className="text-white/70 text-sm">
                    {product.emoji} {product.name}
                  </span>
                  <span className="text-white/50 text-xs">{product.count} compras</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="space-y-2">
          <button className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white/70 text-sm rounded-lg transition-colors flex items-center justify-center gap-2">
            Ver perfil completo
          </button>
          <button className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white/70 text-sm rounded-lg transition-colors flex items-center justify-center gap-2">
            Ver en Shopify
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
