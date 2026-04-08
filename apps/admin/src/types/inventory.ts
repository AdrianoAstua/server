export type StockStatus = 'ok' | 'low' | 'critical' | 'out';

// ─── Location types ───
export type LocationType = 'LOCAL' | 'SHOPIFY' | 'WAREHOUSE';

export interface InventoryLocation {
  id: string;
  name: string;
  slug: string;
  type: LocationType;
  address?: string;
  isDefault: boolean;
  isActive: boolean;
  shopifyLocationId?: string;
}

export interface LocationStock {
  id: string;
  variantId: string;
  locationId: string;
  quantity: number;
  minThreshold: number;
  location: Pick<InventoryLocation, 'id' | 'slug' | 'name' | 'type'>;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
  reserved: number;
  minStock: number;
  barcode?: string;
  barcodeFormat?: string;
  locationStocks?: LocationStock[];
}

export interface InventoryProduct {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number; // cents CRC
  cost: number;  // cents CRC
  sku: string;
  emoji: string;
  description: string;
  variants: ProductVariant[];
  tags: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantLabel: string;
  type: 'entrada' | 'salida' | 'ajuste' | 'reserva' | 'devolucion' | 'transferencia_in' | 'transferencia_out' | 'venta_local' | 'venta_online' | 'conteo_fisico';
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason: string;
  reference?: string;
  locationId?: string;
  locationName?: string;
  createdAt: string;
  createdBy: string;
}

export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantLabel: string;
  category: string;
  currentStock: number;
  minStock: number;
  status: 'critical' | 'low';
  createdAt: string;
}

export interface InventoryKPIs {
  totalProducts: number;
  totalVariants: number;
  totalUnits: number;
  totalValue: number;
  criticalCount: number;
  lowCount: number;
  outOfStockCount: number;
  okCount: number;
}

export type InventoryView = 'dashboard' | 'products' | 'movements' | 'alerts' | 'import-export' | 'settings' | 'local-sales' | 'physical-count' | 'barcode-manager';
export type ProductView = 'table' | 'grid';
export type FilterCategory = 'all' | 'ciclismo' | 'running' | 'natacion' | 'tops' | 'accesorios' | 'trail';
export type FilterStatus = 'all' | 'ok' | 'low' | 'critical' | 'out';

// ─── Local Sale (POS) types ───
export type PaymentMethod = 'CASH' | 'CARD' | 'SINPE' | 'TRANSFER' | 'MIXED';

export interface LocalSaleItem {
  id: string;
  variantId: string;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  variant: {
    sku: string;
    size: string;
    color: string;
    product: { name: string; basePriceCents: number };
  };
}

export interface LocalSale {
  id: string;
  saleNumber: string;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  paymentMethod: PaymentMethod;
  customerId?: string;
  soldById: string;
  locationId: string;
  notes?: string;
  voided: boolean;
  voidReason?: string;
  voidedAt?: string;
  items: LocalSaleItem[];
  soldBy: { id: string; name: string };
  createdAt: string;
}

export interface DailySummary {
  totalSales: number;
  totalRevenueCents: number;
  itemsSold: number;
  byPaymentMethod: { method: PaymentMethod; count: number; totalCents: number }[];
  topProducts: { product: string; quantity: number }[];
}

// ─── POS Cart types ───
export interface CartItem {
  variantId: string;
  sku: string;
  productName: string;
  size: string;
  color: string;
  unitPriceCents: number;
  quantity: number;
  localStock: number;
}

// ─── Physical Count types ───
export type CountStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface PhysicalCountItem {
  id: string;
  variantId: string;
  expectedQty: number;
  actualQty: number | null;
  difference: number | null;
  resolved: boolean;
  variant: {
    sku: string;
    size: string;
    color: string;
    barcode?: string;
    product: { name: string };
  };
}

export interface PhysicalCount {
  id: string;
  locationId: string;
  status: CountStatus;
  startedAt: string;
  completedAt?: string;
  performedById: string;
  notes?: string;
  items: PhysicalCountItem[];
  location: Pick<InventoryLocation, 'id' | 'name' | 'slug'>;
  performedBy: { id: string; name: string };
}

// ─── Shopify Sync types ───
export type ShopifySyncType = 'PRODUCT' | 'INVENTORY' | 'ORDER' | 'FULL';
export type SyncDirection = 'TO_SHOPIFY' | 'FROM_SHOPIFY' | 'RECONCILIATION';
export type SyncStatus = 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'PENDING';

export interface ShopifySync {
  id: string;
  type: ShopifySyncType;
  direction: SyncDirection;
  status: SyncStatus;
  itemsProcessed: number;
  itemsFailed: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

// ─── Stock Matrix ───
export interface StockMatrixEntry {
  location: Pick<InventoryLocation, 'id' | 'slug' | 'name' | 'type'>;
  quantity: number;
  minThreshold: number;
  status: StockStatus;
}

export interface VariantStockMatrix {
  variantId: string;
  sku: string;
  size: string;
  color: string;
  locations: StockMatrixEntry[];
  totalStock: number;
}
