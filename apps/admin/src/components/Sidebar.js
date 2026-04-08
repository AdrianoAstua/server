import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Search, Bot, User, AlertCircle, MessageSquare } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useMemo } from 'react';
function getStatusColor(status) {
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
function getStatusLabel(status, agentName) {
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
function formatRelativeTime(date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1)
        return 'Ahora';
    if (minutes < 60)
        return `Hace ${minutes} min`;
    if (hours < 24)
        return `Hace ${hours} h`;
    if (days === 1)
        return 'Ayer';
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
}
function ConversationItem({ conversation, isSelected, onClick }) {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const statusColor = getStatusColor(conversation.status);
    const isWaiting = conversation.status === 'waiting';
    return (_jsx("button", { onClick: onClick, className: `w-full text-left p-4 border-b border-white/5 transition-all duration-200 group relative
        ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'}
        ${isWaiting ? 'bg-[#FF8C00]/10' : ''}
      `, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "flex-shrink-0 mt-1", children: _jsx("span", { className: "w-3 h-3 rounded-full block", style: { backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}` } }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("h3", { className: `font-medium truncate ${isWaiting ? 'text-white' : 'text-white/90'}`, children: conversation.customer.name }), _jsx("span", { className: "text-xs text-white/40 flex-shrink-0", children: formatRelativeTime(conversation.lastMessageAt) })] }), _jsx("p", { className: "text-xs mt-0.5", style: { color: statusColor }, children: getStatusLabel(conversation.status, conversation.agentName) }), _jsxs("p", { className: "text-sm text-white/50 mt-1 truncate group-hover:text-white/70 transition-colors", children: [lastMessage?.content.substring(0, 60).replace(/\n/g, ' '), "..."] })] }), conversation.unreadCount > 0 && (_jsx("div", { className: "flex-shrink-0 mt-1", children: _jsx("span", { className: "w-5 h-5 bg-[#3B82F6] rounded-full text-[10px] text-white flex items-center justify-center font-medium", children: conversation.unreadCount }) }))] }) }));
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
            filtered = filtered.filter(c => c.customer.name.toLowerCase().includes(query) ||
                c.customer.phone.includes(query));
        }
        // Ordenar: primero las que esperan, luego por fecha
        return filtered.sort((a, b) => {
            if (a.status === 'waiting' && b.status !== 'waiting')
                return -1;
            if (b.status === 'waiting' && a.status !== 'waiting')
                return 1;
            return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
        });
    }, [conversations, filter, searchQuery]);
    const filterTabs = [
        { key: 'all', label: 'Todas', icon: MessageSquare },
        { key: 'bot', label: 'Bot', icon: Bot },
        { key: 'waiting', label: 'Espera', icon: AlertCircle },
        { key: 'agent', label: 'Agente', icon: User },
    ];
    return (_jsxs("aside", { className: "w-full h-full bg-[#111111] flex flex-col", children: [_jsx("div", { className: "p-4 border-b border-white/10", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" }), _jsx("input", { type: "text", placeholder: "Buscar cliente...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#3B82F6] transition-colors" })] }) }), _jsx("div", { className: "flex border-b border-white/10", children: filterTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (_jsxs("button", { onClick: () => setFilter(tab.key), className: `flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors relative
                ${filter === tab.key ? 'text-white' : 'text-white/50 hover:text-white/70'}
              `, children: [_jsx(Icon, { className: "w-3.5 h-3.5" }), _jsx("span", { className: "hidden sm:inline", children: tab.label }), filter === tab.key && (_jsx("span", { className: "absolute bottom-0 left-0 right-0 h-0.5 bg-[#3B82F6]" }))] }, tab.key));
                }) }), _jsx("div", { className: "flex-1 overflow-y-auto", children: filteredConversations.length === 0 ? (_jsx("div", { className: "p-8 text-center", children: _jsx("p", { className: "text-white/40 text-sm", children: "No hay conversaciones" }) })) : (filteredConversations.map((conversation) => (_jsx(ConversationItem, { conversation: conversation, isSelected: selectedId === conversation.id, onClick: () => selectConversation(conversation.id) }, conversation.id)))) })] }));
}
