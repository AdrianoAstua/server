// Tipos para la aplicación de Chat V ONE B

export type MessageType = 'text' | 'product' | 'order' | 'buttons';
export type ConversationStatus = 'bot' | 'waiting' | 'agent' | 'inactive';
export type SenderType = 'client' | 'bot' | 'agent';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  sizes: { [key: string]: number };
  emoji: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: SenderType;
  senderName?: string;
  content: string;
  timestamp: Date;
  type: MessageType;
  products?: Product[];
  buttons?: { label: string; action: string }[];
  read: boolean;
}

export interface Order {
  id: string;
  customerId: string;
  items: { product: Product; size: string; quantity: number }[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'ready';
  total: number;
  shippingCost: number;
  createdAt: Date;
  deliveryType: 'shipping' | 'pickup';
  address?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  customerSince: Date;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: Date;
  sports: string[];
  frequentProducts: { name: string; count: number; emoji: string }[];
  activeOrders: Order[];
}

export interface Conversation {
  id: string;
  customer: Customer;
  status: ConversationStatus;
  agentName?: string;
  messages: Message[];
  unreadCount: number;
  lastMessageAt: Date;
  startedAt: Date;
  topic?: string;
}

export interface ChatState {
  conversations: Conversation[];
  selectedConversationId: string | null;
  filter: 'all' | 'bot' | 'waiting' | 'agent';
  searchQuery: string;
  isInfoPanelOpen: boolean;
  currentView: 'list' | 'chat' | 'info';
  
  // Acciones
  selectConversation: (id: string) => void;
  sendMessage: (content: string) => void;
  takeConversation: () => void;
  returnToBot: () => void;
  setFilter: (filter: 'all' | 'bot' | 'waiting' | 'agent') => void;
  setSearchQuery: (query: string) => void;
  toggleInfoPanel: () => void;
  setView: (view: 'list' | 'chat' | 'info') => void;
  markAsRead: (conversationId: string) => void;
  getFilteredConversations: () => Conversation[];
  getSelectedConversation: () => Conversation | undefined;
}

export interface OrderModalState {
  isOpen: boolean;
  selectedProducts: { product: Product; size: string; quantity: number }[];
  deliveryType: 'shipping' | 'pickup';
  notes: string;
  
  openModal: () => void;
  closeModal: () => void;
  addProduct: (product: Product, size: string, quantity: number) => void;
  removeProduct: (index: number) => void;
  setDeliveryType: (type: 'shipping' | 'pickup') => void;
  setNotes: (notes: string) => void;
  clear: () => void;
}
