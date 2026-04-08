import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Info, MoreVertical, Paperclip, Camera, Send, Bot, User, CheckCheck, Plus, FileText, MessageSquare } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useOrderModalStore } from '@/store/chatStore';
function formatTime(date) {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) {
        return 'Hoy';
    }
    else if (date.toDateString() === yesterday.toDateString()) {
        return 'Ayer';
    }
    else {
        return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    }
}
function MessageBubble({ message, showDate }) {
    const isClient = message.sender === 'client';
    const isBot = message.sender === 'bot';
    const isAgent = message.sender === 'agent';
    const bubbleStyles = {
        client: 'bg-[#1B4332] text-white rounded-2xl rounded-tl-sm ml-0 mr-auto',
        bot: 'bg-[#2D2D2D] text-white rounded-2xl rounded-tr-sm ml-auto mr-0',
        agent: 'bg-[#3B82F6] text-white rounded-2xl rounded-tr-sm ml-auto mr-0',
    };
    return (_jsxs("div", { className: "mb-4", children: [showDate && (_jsx("div", { className: "flex justify-center my-4", children: _jsx("span", { className: "text-xs text-white/40 bg-white/5 px-3 py-1 rounded-full", children: formatDate(message.timestamp) }) })), _jsx("div", { className: `flex ${isClient ? 'justify-start' : 'justify-end'}`, children: _jsxs("div", { className: `max-w-[85%] sm:max-w-[75%] ${bubbleStyles[message.sender]}`, children: [_jsxs("div", { className: "px-4 py-3", children: [isBot && (_jsxs("div", { className: "flex items-center gap-1.5 mb-2 text-white/60", children: [_jsx(Bot, { className: "w-3.5 h-3.5" }), _jsx("span", { className: "text-xs font-medium", children: "Bot" })] })), isAgent && message.senderName && (_jsxs("div", { className: "flex items-center gap-1.5 mb-2 text-white/80", children: [_jsx(User, { className: "w-3.5 h-3.5" }), _jsx("span", { className: "text-xs font-medium", children: message.senderName })] })), _jsx("p", { className: "text-sm whitespace-pre-line leading-relaxed", children: message.content }), message.buttons && message.buttons.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2 mt-3", children: message.buttons.map((button, idx) => (_jsx("button", { className: "px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors", children: button.label }, idx))) }))] }), _jsxs("div", { className: `px-4 pb-2 flex items-center gap-1 ${isClient ? 'justify-end' : 'justify-end'}`, children: [_jsx("span", { className: "text-[10px] text-white/40", children: formatTime(message.timestamp) }), !isClient && (_jsx(CheckCheck, { className: "w-3 h-3 text-white/60" }))] })] }) })] }));
}
function EscalationBanner({ conversation, onTake }) {
    const waitingTime = Math.floor((new Date().getTime() - conversation.lastMessageAt.getTime()) / 60000);
    return (_jsxs("div", { className: "bg-gradient-to-r from-[#FF8C00]/20 to-[#FF8C00]/10 border-b border-[#FF8C00]/30 p-4", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-[#FF8C00]/20 rounded-full flex items-center justify-center flex-shrink-0", children: _jsx("span", { className: "text-xl", children: "\u26A0\uFE0F" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("h3", { className: "text-white font-semibold text-sm", children: [conversation.customer.name.toUpperCase(), " SOLICITA ATENCI\u00D3N PERSONALIZADA"] }), _jsx("p", { className: "text-white/70 text-xs mt-1", children: conversation.topic || 'El cliente necesita ayuda de un agente humano' }), _jsxs("div", { className: "flex items-center gap-4 mt-2 text-xs text-white/50", children: [_jsxs("span", { children: ["\uD83D\uDCF1 ", conversation.customer.phone] }), _jsxs("span", { children: ["\uD83D\uDD50 Esperando: ", waitingTime, " min"] })] })] })] }), _jsxs("div", { className: "flex gap-3 mt-4", children: [_jsxs("button", { onClick: onTake, className: "flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2", children: [_jsx(User, { className: "w-4 h-4" }), "Tomar conversaci\u00F3n"] }), _jsx("button", { className: "flex-1 bg-white/10 hover:bg-white/15 text-white/80 text-sm font-medium py-2.5 rounded-lg transition-colors", children: "\u23F0 Responder luego" })] })] }));
}
export function ChatArea() {
    const conversation = useChatStore(state => state.getSelectedConversation());
    const sendMessage = useChatStore(state => state.sendMessage);
    const takeConversation = useChatStore(state => state.takeConversation);
    const returnToBot = useChatStore(state => state.returnToBot);
    const toggleInfoPanel = useChatStore(state => state.toggleInfoPanel);
    const setView = useChatStore(state => state.setView);
    const isInfoPanelOpen = useChatStore(state => state.isInfoPanelOpen);
    const openOrderModal = useOrderModalStore(state => state.openModal);
    const [messageInput, setMessageInput] = useState('');
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    // Scroll al último mensaje
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [conversation?.messages]);
    if (!conversation) {
        return (_jsx("div", { className: "flex-1 flex items-center justify-center bg-[#0A0A0A]", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(MessageSquare, { className: "w-8 h-8 text-white/30" }) }), _jsx("p", { className: "text-white/50 text-lg", children: "Selecciona una conversaci\u00F3n" }), _jsx("p", { className: "text-white/30 text-sm mt-2", children: "Haz clic en un chat del sidebar para ver los mensajes" })] }) }));
    }
    const handleSendMessage = () => {
        if (messageInput.trim()) {
            sendMessage(messageInput.trim());
            setMessageInput('');
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    // Agrupar mensajes por fecha
    let lastDate = null;
    return (_jsxs("div", { className: "flex-1 flex flex-col bg-[#0A0A0A] h-full", children: [_jsxs("div", { className: "h-16 bg-[#111111] border-b border-white/10 flex items-center justify-between px-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: () => setView('list'), className: "lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors", children: _jsx(ArrowLeft, { className: "w-5 h-5 text-white/70" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-white font-medium", children: conversation.customer.name }), _jsxs("div", { className: "flex items-center gap-2 text-xs", children: [_jsx("span", { className: "w-2 h-2 rounded-full", style: {
                                                    backgroundColor: conversation.status === 'bot' ? '#00FF88' :
                                                        conversation.status === 'waiting' ? '#FF8C00' :
                                                            conversation.status === 'agent' ? '#3B82F6' : '#6B7280'
                                                } }), _jsx("span", { className: "text-white/50", children: conversation.status === 'bot' ? 'Bot atendiendo' :
                                                    conversation.status === 'waiting' ? 'Esperando agente' :
                                                        conversation.status === 'agent' ? `Agente: ${conversation.agentName || 'Tú'}` :
                                                            'Finalizada' }), _jsx("span", { className: "text-white/30", children: "\u2022" }), _jsx("span", { className: "text-white/50", children: conversation.customer.phone })] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: toggleInfoPanel, className: `hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isInfoPanelOpen ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-white/70'}`, children: [_jsx(Info, { className: "w-4 h-4" }), _jsx("span", { className: "text-sm", children: "Info" })] }), _jsx("button", { onClick: () => setView('info'), className: "lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors", children: _jsx(Info, { className: "w-5 h-5 text-white/70" }) }), _jsx("button", { className: "p-2 hover:bg-white/10 rounded-lg transition-colors", children: _jsx(MoreVertical, { className: "w-5 h-5 text-white/70" }) })] })] }), conversation.status === 'waiting' && (_jsx(EscalationBanner, { conversation: conversation, onTake: takeConversation })), _jsxs("div", { ref: messagesContainerRef, className: "flex-1 overflow-y-auto p-4 space-y-2", children: [conversation.messages.map((message) => {
                        const messageDate = formatDate(message.timestamp);
                        const showDate = messageDate !== lastDate;
                        lastDate = messageDate;
                        return (_jsx(MessageBubble, { message: message, showDate: showDate }, message.id));
                    }), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { className: "bg-[#111111] border-t border-white/10 p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("button", { className: "p-2 hover:bg-white/10 rounded-lg transition-colors", children: _jsx(Paperclip, { className: "w-5 h-5 text-white/50" }) }), _jsx("button", { className: "p-2 hover:bg-white/10 rounded-lg transition-colors", children: _jsx(Camera, { className: "w-5 h-5 text-white/50" }) }), _jsx("div", { className: "flex-1 relative", children: _jsx("input", { type: "text", value: messageInput, onChange: (e) => setMessageInput(e.target.value), onKeyDown: handleKeyDown, placeholder: "Escribe un mensaje...", className: "w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-12 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#3B82F6] transition-colors" }) }), _jsx("button", { onClick: handleSendMessage, disabled: !messageInput.trim(), className: "p-2.5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors", children: _jsx(Send, { className: "w-5 h-5 text-white" }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "flex items-center gap-2", children: conversation.status === 'agent' && (_jsxs("button", { onClick: returnToBot, className: "flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/70 transition-colors", children: [_jsx(Bot, { className: "w-3.5 h-3.5" }), "Devolver a Bot"] })) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: openOrderModal, className: "flex items-center gap-2 px-3 py-1.5 bg-[#00FF88]/10 hover:bg-[#00FF88]/20 text-[#00FF88] rounded-lg text-xs font-medium transition-colors", children: [_jsx(Plus, { className: "w-3.5 h-3.5" }), "Crear Pedido"] }), _jsxs("button", { className: "flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/70 transition-colors", children: [_jsx(FileText, { className: "w-3.5 h-3.5" }), "Nota"] })] })] })] })] }));
}
