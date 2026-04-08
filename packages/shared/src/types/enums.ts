export const UserRole = { ADMIN: 'ADMIN', COLLABORATOR: 'COLLABORATOR' } as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const Sport = { CYCLING: 'CYCLING', RUNNING: 'RUNNING', TRIATHLON: 'TRIATHLON', SWIMMING: 'SWIMMING', GENERAL: 'GENERAL', OTHER: 'OTHER' } as const
export type Sport = (typeof Sport)[keyof typeof Sport]

export const Gender = { MALE: 'MALE', FEMALE: 'FEMALE', UNISEX: 'UNISEX' } as const
export type Gender = (typeof Gender)[keyof typeof Gender]

export const ProductStatus = { ACTIVE: 'ACTIVE', DRAFT: 'DRAFT', DISCONTINUED: 'DISCONTINUED' } as const
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus]

export const VariantStatus = { AVAILABLE: 'AVAILABLE', LOW_STOCK: 'LOW_STOCK', OUT_OF_STOCK: 'OUT_OF_STOCK', DISCONTINUED: 'DISCONTINUED' } as const
export type VariantStatus = (typeof VariantStatus)[keyof typeof VariantStatus]

export const StockMovementType = { ENTRY: 'ENTRY', EXIT: 'EXIT', ADJUSTMENT: 'ADJUSTMENT', RETURN: 'RETURN', TRANSFER: 'TRANSFER', TRANSFER_OUT: 'TRANSFER_OUT', TRANSFER_IN: 'TRANSFER_IN', SALE_LOCAL: 'SALE_LOCAL', SALE_ONLINE: 'SALE_ONLINE', PHYSICAL_COUNT: 'PHYSICAL_COUNT' } as const
export type StockMovementType = (typeof StockMovementType)[keyof typeof StockMovementType]

export const LocationType = { LOCAL: 'LOCAL', SHOPIFY: 'SHOPIFY', WAREHOUSE: 'WAREHOUSE' } as const
export type LocationType = (typeof LocationType)[keyof typeof LocationType]

export const PaymentMethod = { CASH: 'CASH', CARD: 'CARD', SINPE: 'SINPE', TRANSFER: 'TRANSFER', MIXED: 'MIXED' } as const
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]

export const CountStatus = { IN_PROGRESS: 'IN_PROGRESS', COMPLETED: 'COMPLETED', CANCELLED: 'CANCELLED' } as const
export type CountStatus = (typeof CountStatus)[keyof typeof CountStatus]

export const ShopifySyncType = { PRODUCT: 'PRODUCT', INVENTORY: 'INVENTORY', ORDER: 'ORDER', FULL: 'FULL' } as const
export type ShopifySyncType = (typeof ShopifySyncType)[keyof typeof ShopifySyncType]

export const SyncDirection = { TO_SHOPIFY: 'TO_SHOPIFY', FROM_SHOPIFY: 'FROM_SHOPIFY', RECONCILIATION: 'RECONCILIATION' } as const
export type SyncDirection = (typeof SyncDirection)[keyof typeof SyncDirection]

export const SyncStatus = { SUCCESS: 'SUCCESS', FAILED: 'FAILED', PARTIAL: 'PARTIAL', PENDING: 'PENDING' } as const
export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus]

export const OrderStatus = { PENDING: 'PENDING', CONFIRMED: 'CONFIRMED', IN_PRODUCTION: 'IN_PRODUCTION', READY: 'READY', SHIPPED: 'SHIPPED', DELIVERED: 'DELIVERED', CANCELLED: 'CANCELLED' } as const
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]

export const DeliveryMethod = { PICKUP: 'PICKUP', CORREOS_CR: 'CORREOS_CR', PRIVATE_COURIER: 'PRIVATE_COURIER' } as const
export type DeliveryMethod = (typeof DeliveryMethod)[keyof typeof DeliveryMethod]

export const OrderSource = { WHATSAPP: 'WHATSAPP', WEB: 'WEB', ADMIN: 'ADMIN', SHOPIFY: 'SHOPIFY' } as const
export type OrderSource = (typeof OrderSource)[keyof typeof OrderSource]

export const ConversationStatus = { BOT_ACTIVE: 'BOT_ACTIVE', WAITING_AGENT: 'WAITING_AGENT', AGENT_ACTIVE: 'AGENT_ACTIVE', CLOSED: 'CLOSED' } as const
export type ConversationStatus = (typeof ConversationStatus)[keyof typeof ConversationStatus]

export const MessageSenderType = { CUSTOMER: 'CUSTOMER', BOT: 'BOT', AGENT: 'AGENT', SYSTEM: 'SYSTEM' } as const
export type MessageSenderType = (typeof MessageSenderType)[keyof typeof MessageSenderType]

export const NotificationType = { NEW_CUSTOMER: 'NEW_CUSTOMER', NEW_ORDER: 'NEW_ORDER', ORDER_STATUS: 'ORDER_STATUS', LOW_STOCK: 'LOW_STOCK', STOCK_OUT: 'STOCK_OUT', AGENT_REQUEST: 'AGENT_REQUEST', ORDER_READY: 'ORDER_READY', ORDER_SHIPPED: 'ORDER_SHIPPED', CRM_SYNC_ERROR: 'CRM_SYNC_ERROR', SYSTEM_ERROR: 'SYSTEM_ERROR' } as const
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType]

export const NotificationPriority = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', URGENT: 'URGENT' } as const
export type NotificationPriority = (typeof NotificationPriority)[keyof typeof NotificationPriority]
