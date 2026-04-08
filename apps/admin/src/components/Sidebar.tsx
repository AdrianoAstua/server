import { Search, Bot, User, AlertCircle, MessageSquare } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import type { Conversation, ConversationStatus } from '@/types';
import { useMemo } from 'react';

function getStatusColor(status: ConversationStatus): string {
  switch (status) {
    case 'bot':
      return '#00FF88';
    case 'waiting':
      return '#FF8C00';
    case 'agent':
      return '#3B82F6';
    case 'inactive':
      return '#6B7280';
    default:
      return '#6B7280';
  }
}

function getStatusLabel(status: ConversationStatus, agentName?: string): string {
  switch (status) {
    case 'bot':
      return '🤖 Bot atendiendo';
    case 'waiting':
      return '⚠️ Esperando agente';
    case 'agent':
      return `👤 Agente: ${agentName || 'Tú'}`;
    case 'inactive':
      return 'Finalizada';
    default:
      return '';
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours} h`;
  if (days === 1) return 'Ayer';
  return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
}

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const statusColor = getStatusColor(conversation.status);
  const isWaiting = conversation.status === 'waiting';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 border-b border-white/5 transition-all duration-200 group relative
        ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'}
        ${isWaiting ? 'bg-[#FF8C00]/10' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Indicador de estado */}
        <div className="flex-shrink-0 mt-1">
          <span
            className="w-3 h-3 rounded-full block"
            style={{ backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}` }}
          />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`font-medium truncate ${isWaiting ? 'text-white' : 'text-white/90'}`}>
              {conversation.customer.name}
            </h3>
            <span className="text-xs text-white/40 flex-shrink-0">
              {formatRelativeTime(conversation.lastMessageAt)}
            </span>
          </div>

          <p className="text-xs mt-0.5" style={{ color: statusColor }}>
            {getStatusLabel(conversation.status, conversation.agentName)}
          </p>

          <p className="text-sm text-white/50 mt-1 truncate group-hover:text-white/70 transition-colors">
            {lastMessage?.content.substring(0, 60).replace(/\n/g, ' ')}...
          </p>
        </div>

        {/* Badge de no leídos */}
        {conversation.unreadCount > 0 && (
          <div className="flex-shrink-0 mt-1">
            <span className="w-5 h-5 bg-[#3B82F6] rounded-full text-[10px] text-white flex items-center justify-center font-medium">
              {conversation.unreadCount}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

export function Sidebar() {
  const conversations = useChatStore(state => state.conversations);
  const selectedId = useChatStore(state => state.selectedConversationId);
  const filter = useChatStore(state => state.filter);
  const searchQuery = useChatStore(state => state.searchQuery);
  const selectConversation = useChatStore(state => state.selectConversation);
  const setFilter = useChatStore(state => state.setFilter);
  const setSearchQuery = useChatStore(state => state.setSearchQuery);

  const filteredConversations = useMemo(() => {
    let filtered = [...conversations];

    if (filter !== 'all') {
      filtered = filtered.filter(c => c.status === filter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.customer.name.toLowerCase().includes(query) ||
          c.customer.phone.includes(query)
      );
    }

    // Ordenar: primero las que esperan, luego por fecha
    return filtered.sort((a, b) => {
      if (a.status === 'waiting' && b.status !== 'waiting') return -1;
      if (b.status === 'waiting' && a.status !== 'waiting') return 1;
      return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
    });
  }, [conversations, filter, searchQuery]);

  const filterTabs = [
    { key: 'all', label: 'Todas', icon: MessageSquare },
    { key: 'bot', label: 'Bot', icon: Bot },
    { key: 'waiting', label: 'Espera', icon: AlertCircle },
    { key: 'agent', label: 'Agente', icon: User },
  ] as const;

  return (
    <aside className="w-full h-full bg-[#111111] flex flex-col">
      {/* Búsqueda */}
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#3B82F6] transition-colors"
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex border-b border-white/10">
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors relative
                ${filter === tab.key ? 'text-white' : 'text-white/50 hover:text-white/70'}
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              {filter === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3B82F6]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Lista de conversaciones */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-white/40 text-sm">No hay conversaciones</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedId === conversation.id}
              onClick={() => selectConversation(conversation.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
