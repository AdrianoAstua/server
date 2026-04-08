/**
 * API-specific types that extend or complement the existing domain types.
 * These represent the shapes returned by the backend API endpoints.
 */

import type { ConversationStatus, SenderType, MessageType } from './index';

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'agent';
  avatarUrl?: string;
  createdAt: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ─── Conversations ───────────────────────────────────────────────────────────

export interface ConversationListParams {
  status?: ConversationStatus;
  agentId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ConversationSummary {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  status: ConversationStatus;
  agentId?: string;
  agentName?: string;
  unreadCount: number;
  lastMessage?: string;
  lastMessageAt: string;
  startedAt: string;
  topic?: string;
}

export interface ConversationDetail {
  id: string;
  customer: CustomerSummary;
  status: ConversationStatus;
  agentId?: string;
  agentName?: string;
  unreadCount: number;
  lastMessageAt: string;
  startedAt: string;
  topic?: string;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  sender: SenderType;
  senderName?: string;
  content: string;
  timestamp: string;
  type: MessageType;
  products?: ProductItem[];
  buttons?: { label: string; action: string }[];
  read: boolean;
}

export interface MessageListParams {
  page?: number;
  pageSize?: number;
  before?: string;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  type?: MessageType;
}

export interface ConversationStatsResponse {
  total: number;
  bot: number;
  waiting: number;
  agent: number;
  inactive: number;
}

// ─── Customers ───────────────────────────────────────────────────────────────

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  totalOrders: number;
  totalSpent: number;
}

export interface CustomerDetail {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  customerSince: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  sports: string[];
  frequentProducts: { name: string; count: number; emoji: string }[];
  activeOrders: OrderSummary[];
}

export interface CustomerListParams {
  search?: string;
  city?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerStatsResponse {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  favoriteCategory: string;
  lastOrderDate?: string;
}

// ─── Products ────────────────────────────────────────────────────────────────

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  category: string;
  sizes: Record<string, number>;
  emoji: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListParams {
  category?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProductRequest {
  name: string;
  price: number;
  category: string;
  sizes: Record<string, number>;
  emoji: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateProductRequest {
  name?: string;
  price?: number;
  category?: string;
  sizes?: Record<string, number>;
  emoji?: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateStockRequest {
  productId: string;
  size: string;
  quantity: number;
  operation: 'set' | 'increment' | 'decrement';
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'ready' | 'cancelled';

export interface OrderSummary {
  id: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: string;
  deliveryType: 'shipping' | 'pickup';
}

export interface OrderDetail {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: { product: ProductItem; size: string; quantity: number; subtotal: number }[];
  status: OrderStatus;
  total: number;
  shippingCost: number;
  createdAt: string;
  updatedAt: string;
  deliveryType: 'shipping' | 'pickup';
  address?: string;
  notes?: string;
  timeline: OrderTimelineEntry[];
}

export interface OrderListParams {
  status?: OrderStatus;
  customerId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateOrderRequest {
  customerId: string;
  items: { productId: string; size: string; quantity: number }[];
  deliveryType: 'shipping' | 'pickup';
  address?: string;
  notes?: string;
}

export interface UpdateOrderStatusRequest {
  orderId: string;
  status: OrderStatus;
  note?: string;
}

export interface OrderTimelineEntry {
  id: string;
  status: OrderStatus;
  note?: string;
  createdAt: string;
  createdBy: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationType = 'order' | 'conversation' | 'stock' | 'system';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface NotificationListParams {
  type?: NotificationType;
  read?: boolean;
  page?: number;
  pageSize?: number;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardSummary {
  revenue: { today: number; week: number; month: number; trend: number };
  orders: { today: number; week: number; month: number; pending: number };
  conversations: { active: number; waiting: number; avgResponseTime: number };
  inventory: { lowStock: number; outOfStock: number; totalProducts: number };
}

export interface RevenueChartData {
  labels: string[];
  datasets: { label: string; data: number[] }[];
}

export interface TopProductData {
  productId: string;
  productName: string;
  emoji: string;
  totalSold: number;
  revenue: number;
}

export interface ActivityFeedEntry {
  id: string;
  type: 'order' | 'conversation' | 'stock' | 'agent';
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export type MovementType = 'entry' | 'exit' | 'adjustment';

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  size: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  createdAt: string;
  createdBy: string;
}

export interface InventoryMovementParams {
  productId?: string;
  type?: MovementType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface RegisterEntryRequest {
  productId: string;
  size: string;
  quantity: number;
  reason?: string;
}

export interface InventoryAlert {
  productId: string;
  productName: string;
  emoji: string;
  size: string;
  currentStock: number;
  threshold: number;
  severity: 'low' | 'out';
}

export interface InventoryValuation {
  totalItems: number;
  totalValue: number;
  byCategory: { category: string; items: number; value: number }[];
}

// ─── Realtime Events ─────────────────────────────────────────────────────────

export type ConversationEventType =
  | 'new_message'
  | 'status_changed'
  | 'agent_joined'
  | 'agent_left'
  | 'conversation_created';

export interface ConversationEvent {
  type: ConversationEventType;
  conversationId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export type NotificationEventType = 'new_notification' | 'read_update';

export interface NotificationEvent {
  type: NotificationEventType;
  data: Record<string, unknown>;
  timestamp: string;
}
