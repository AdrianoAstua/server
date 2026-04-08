import { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Info, MoreVertical, Paperclip, Camera, Send, Bot, User, CheckCheck, Plus, FileText, MessageSquare } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useOrderModalStore } from '@/store/chatStore';
import type { Message } from '@/types';

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hoy';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Ayer';
  } else {
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  }
}

interface MessageBubbleProps {
  message: Message;
  showDate: boolean;
}

function MessageBubble({ message, showDate }: MessageBubbleProps) {
  const isClient = message.sender === 'client';
  const isBot = message.sender === 'bot';
  const isAgent = message.sender === 'agent';

  const bubbleStyles = {
    client: 'bg-[#1B4332] text-white rounded-2xl rounded-tl-sm ml-0 mr-auto',
    bot: 'bg-[#2D2D2D] text-white rounded-2xl rounded-tr-sm ml-auto mr-0',
    agent: 'bg-[#3B82F6] text-white rounded-2xl rounded-tr-sm ml-auto mr-0',
  };

  return (
    <div className="mb-4">
      {showDate && (
        <div className="flex justify-center my-4">
          <span className="text-xs text-white/40 bg-white/5 px-3 py-1 rounded-full">
            {formatDate(message.timestamp)}
          </span>
        </div>
      )}
      <div className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}>
        <div className={`max-w-[85%] sm:max-w-[75%] ${bubbleStyles[message.sender]}`}>
          <div className="px-4 py-3">
            {/* Indicador de remitente */}
            {isBot && (
              <div className="flex items-center gap-1.5 mb-2 text-white/60">
                <Bot className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Bot</span>
              </div>
            )}
            {isAgent && message.senderName && (
              <div className="flex items-center gap-1.5 mb-2 text-white/80">
                <User className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{message.senderName}</span>
              </div>
            )}

            {/* Contenido del mensaje */}
            <p className="text-sm whitespace-pre-line leading-relaxed">
              {message.content}
            </p>

            {/* Botones (si los hay) */}
            {message.buttons && message.buttons.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {message.buttons.map((button, idx) => (
                  <button
                    key={idx}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors"
                  >
                    {button.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Timestamp */}
          <div className={`px-4 pb-2 flex items-center gap-1 ${isClient ? 'justify-end' : 'justify-end'}`}>
            <span className="text-[10px] text-white/40">{formatTime(message.timestamp)}</span>
            {!isClient && (
              <CheckCheck className="w-3 h-3 text-white/60" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface EscalationBannerProps {
  conversation: ReturnType<typeof useChatStore.getState>['conversations'][0];
  onTake: () => void;
}

function EscalationBanner({ conversation, onTake }: EscalationBannerProps) {
  const waitingTime = Math.floor((new Date().getTime() - conversation.lastMessageAt.getTime()) / 60000);

  return (
    <div className="bg-gradient-to-r from-[#FF8C00]/20 to-[#FF8C00]/10 border-b border-[#FF8C00]/30 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[#FF8C00]/20 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xl">⚠️</span>
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm">
            {conversation.customer.name.toUpperCase()} SOLICITA ATENCIÓN PERSONALIZADA
          </h3>
          <p className="text-white/70 text-xs mt-1">
            {conversation.topic || 'El cliente necesita ayuda de un agente humano'}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
            <span>📱 {conversation.customer.phone}</span>
            <span>🕐 Esperando: {waitingTime} min</span>
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button
          onClick={onTake}
          className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <User className="w-4 h-4" />
          Tomar conversación
        </button>
        <button className="flex-1 bg-white/10 hover:bg-white/15 text-white/80 text-sm font-medium py-2.5 rounded-lg transition-colors">
          ⏰ Responder luego
        </button>
      </div>
    </div>
  );
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll al último mensaje
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation?.messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0A0A0A]">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-white/30" />
          </div>
          <p className="text-white/50 text-lg">Selecciona una conversación</p>
          <p className="text-white/30 text-sm mt-2">Haz clic en un chat del sidebar para ver los mensajes</p>
        </div>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput.trim());
      setMessageInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Agrupar mensajes por fecha
  let lastDate: string | null = null;

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A0A] h-full">
      {/* Header del chat */}
      <div className="h-16 bg-[#111111] border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('list')}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <div>
            <h2 className="text-white font-medium">{conversation.customer.name}</h2>
            <div className="flex items-center gap-2 text-xs">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: conversation.status === 'bot' ? '#00FF88' :
                    conversation.status === 'waiting' ? '#FF8C00' :
                    conversation.status === 'agent' ? '#3B82F6' : '#6B7280'
                }}
              />
              <span className="text-white/50">
                {conversation.status === 'bot' ? 'Bot atendiendo' :
                 conversation.status === 'waiting' ? 'Esperando agente' :
                 conversation.status === 'agent' ? `Agente: ${conversation.agentName || 'Tú'}` :
                 'Finalizada'}
              </span>
              <span className="text-white/30">•</span>
              <span className="text-white/50">{conversation.customer.phone}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleInfoPanel}
            className={`hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              isInfoPanelOpen ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-white/70'
            }`}
          >
            <Info className="w-4 h-4" />
            <span className="text-sm">Info</span>
          </button>
          <button
            onClick={() => setView('info')}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Info className="w-5 h-5 text-white/70" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5 text-white/70" />
          </button>
        </div>
      </div>

      {/* Banner de escalamiento (si aplica) */}
      {conversation.status === 'waiting' && (
        <EscalationBanner conversation={conversation} onTake={takeConversation} />
      )}

      {/* Área de mensajes */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {conversation.messages.map((message) => {
          const messageDate = formatDate(message.timestamp);
          const showDate = messageDate !== lastDate;
          lastDate = messageDate;

          return (
            <MessageBubble
              key={message.id}
              message={message}
              showDate={showDate}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer del chat */}
      <div className="bg-[#111111] border-t border-white/10 p-4">
        {/* Input de mensaje */}
        <div className="flex items-center gap-2 mb-3">
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Paperclip className="w-5 h-5 text-white/50" />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Camera className="w-5 h-5 text-white/50" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              className="w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-12 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#3B82F6] transition-colors"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="p-2.5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Acciones rápidas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {conversation.status === 'agent' && (
              <button
                onClick={returnToBot}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/70 transition-colors"
              >
                <Bot className="w-3.5 h-3.5" />
                Devolver a Bot
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openOrderModal}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#00FF88]/10 hover:bg-[#00FF88]/20 text-[#00FF88] rounded-lg text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Crear Pedido
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/70 transition-colors">
              <FileText className="w-3.5 h-3.5" />
              Nota
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
