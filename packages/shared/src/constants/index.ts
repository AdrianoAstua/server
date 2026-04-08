export const APP_NAME = 'V ONE B'
export const DEFAULT_CURRENCY = 'CRC'
export const DEFAULT_TIMEZONE = 'America/Costa_Rica'

/** Precios en centavos */
export const SHIPPING_CORREOS_CR_CENTS = 250000 // ₡2,500

/** Envios solo lunes y miercoles */
export const SHIPPING_DAYS = [1, 3] as const // Monday=1, Wednesday=3

/** Estimado de entrega en dias habiles */
export const ESTIMATED_DELIVERY_DAYS = '1-3'

/** Horario de atencion */
export const BUSINESS_HOURS = { start: '08:00', end: '18:00' } as const

/** JWT */
export const JWT_ACCESS_EXPIRES = '15m'
export const JWT_REFRESH_EXPIRES = '7d'
export const BCRYPT_SALT_ROUNDS = 12

/** Paginacion por defecto */
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

/** Stock */
export const DEFAULT_MIN_STOCK_THRESHOLD = 3

/** Tallas ordenadas */
export const SIZE_ORDER: Record<string, number> = {
  XS: 1, S: 2, M: 3, L: 4, XL: 5, XXL: 6,
}

export const VALID_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const

/** Formato de order number */
export const ORDER_NUMBER_PREFIX = 'VOB'

/** Transiciones de estado de pedido validas */
export const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PRODUCTION', 'CANCELLED'],
  IN_PRODUCTION: ['READY', 'CANCELLED'],
  READY: ['SHIPPED', 'DELIVERED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}

/** Mapeo de OrderStatus a CRM Stage */
export const ORDER_STATUS_TO_CRM_STAGE: Record<string, string> = {
  PENDING: 'Nuevo',
  CONFIRMED: 'Confirmado',
  IN_PRODUCTION: 'En Produccion',
  READY: 'Listo',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}
