import { Bell, Settings, User, Menu, Package, Factory } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';

export function Header({ onNavInventory, onNavProduction }: { onNavInventory?: () => void; onNavProduction?: () => void }) {
  const conversations = useChatStore(state => state.conversations);
  const setView = useChatStore(state => state.setView);

  // Calcular estadísticas
  const activeCount = conversations.filter(c => c.status !== 'inactive').length;
  const waitingCount = conversations.filter(c => c.status === 'waiting').length;
  const todayOrders = 3;
  const todayRevenue = 87000;

  return (
    <header className="h-16 bg-[#0F0F0F] border-b border-white/10 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-50">
      {/* Logo y título */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setView('list')}
          className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-white font-bold text-lg tracking-tight">V ONE B</h1>
          <p className="text-white/50 text-xs uppercase tracking-wider">Chat Center</p>
        </div>
      </div>

      {/* Estadísticas - Desktop */}
      <div className="hidden md:flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
          <span className="text-white/70 text-sm">{activeCount} activas</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF8C00]" />
          <span className="text-white/70 text-sm">{waitingCount} esperando</span>
        </div>
        <div className="h-4 w-px bg-white/20" />
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-sm">📦</span>
          <span className="text-white/70 text-sm">{todayOrders} pedidos hoy</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-sm">💰</span>
          <span className="text-white font-medium text-sm">₡{todayRevenue.toLocaleString()}</span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        {onNavProduction && (
          <button
            onClick={onNavProduction}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors border border-white/10"
          >
            <Factory className="w-4 h-4" />
            <span className="hidden sm:inline">Produccion</span>
          </button>
        )}
        {onNavInventory && (
          <button
            onClick={onNavInventory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors border border-white/10"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Inventario</span>
          </button>
        )}
        <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-white/70" />
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
            3
          </span>
        </button>
        <div className="hidden sm:flex items-center gap-2 ml-2 pl-2 border-l border-white/20">
          <div className="w-8 h-8 bg-gradient-to-br from-[#3B82F6] to-[#00FF88] rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-white/70 text-sm hidden lg:inline">Admin</span>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-white/70" />
          </button>
        </div>
      </div>
    </header>
  );
}
