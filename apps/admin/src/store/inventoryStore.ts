import { create } from 'zustand';
import type { InventoryProduct, InventoryMovement, StockAlert, InventoryView, ProductView, FilterCategory, FilterStatus } from '@/types/inventory';
import { inventoryProducts, inventoryMovements, computeAlerts } from '@/data/inventory';

interface InventoryState {
  // Navigation
  currentView: InventoryView;
  setView: (view: InventoryView) => void;

  // Products
  products: InventoryProduct[];
  productView: ProductView;
  setProductView: (view: ProductView) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterCategory: FilterCategory;
  setFilterCategory: (cat: FilterCategory) => void;
  filterStatus: FilterStatus;
  setFilterStatus: (status: FilterStatus) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;

  // Selected product
  selectedProductId: string | null;
  setSelectedProduct: (id: string | null) => void;
  getSelectedProduct: () => InventoryProduct | undefined;

  // Entry modal
  entryModalOpen: boolean;
  entryVariantId: string | null;
  openEntryModal: (variantId: string) => void;
  closeEntryModal: () => void;
  addStock: (variantId: string, quantity: number, reason: string) => void;

  // Barcodes
  setVariantBarcode: (variantId: string, barcode: string, format?: string) => void;
  setVariantBarcodes: (barcodes: { variantId: string; barcode: string; format?: string }[]) => void;

  // Movements
  movements: InventoryMovement[];
  movementFilter: string;
  setMovementFilter: (filter: string) => void;

  // Alerts
  alerts: StockAlert[];
  refreshAlerts: () => void;

  // Import/Export
  importData: string | null;
  setImportData: (data: string | null) => void;
  importPreview: { row: number; sku: string; name: string; stock: number; valid: boolean }[];
  parseImport: (csv: string) => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  currentView: 'dashboard',
  setView: (view) => set({ currentView: view }),

  products: inventoryProducts,
  productView: 'table',
  setProductView: (view) => set({ productView: view }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q, currentPage: 1 }),
  filterCategory: 'all',
  setFilterCategory: (cat) => set({ filterCategory: cat, currentPage: 1 }),
  filterStatus: 'all',
  setFilterStatus: (status) => set({ filterStatus: status, currentPage: 1 }),
  currentPage: 1,
  setCurrentPage: (page) => set({ currentPage: page }),

  selectedProductId: null,
  setSelectedProduct: (id) => set({ selectedProductId: id }),
  getSelectedProduct: () => {
    const { products, selectedProductId } = get();
    return products.find(p => p.id === selectedProductId);
  },

  entryModalOpen: false,
  entryVariantId: null,
  openEntryModal: (variantId) => set({ entryModalOpen: true, entryVariantId: variantId }),
  closeEntryModal: () => set({ entryModalOpen: false, entryVariantId: null }),
  addStock: (variantId, quantity, reason) => {
    const products = get().products.map(p => ({
      ...p,
      variants: p.variants.map(v => {
        if (v.id === variantId) {
          return { ...v, stock: v.stock + quantity };
        }
        return v;
      }),
    }));

    const product = products.find(p => p.variants.some(v => v.id === variantId));
    const variant = product?.variants.find(v => v.id === variantId);
    const prevVariant = get().products.flatMap(p => p.variants).find(v => v.id === variantId);

    const newMovement: InventoryMovement = {
      id: `MOV${Date.now()}`,
      productId: product?.id ?? '',
      productName: product?.name ?? '',
      variantId,
      variantLabel: variant ? `${variant.size} / ${variant.color}` : '',
      type: 'entrada',
      quantity,
      stockBefore: prevVariant?.stock ?? 0,
      stockAfter: (prevVariant?.stock ?? 0) + quantity,
      reason,
      createdAt: new Date().toISOString(),
      createdBy: 'Adrián V.',
    };

    set({
      products,
      movements: [newMovement, ...get().movements],
      entryModalOpen: false,
      entryVariantId: null,
    });
    get().refreshAlerts();
  },

  setVariantBarcode: (variantId, barcode, format) => {
    const products = get().products.map(p => ({
      ...p,
      variants: p.variants.map(v =>
        v.id === variantId ? { ...v, barcode, barcodeFormat: format || 'CODE128' } : v
      ),
    }));
    set({ products });
  },

  setVariantBarcodes: (barcodes) => {
    const barcodeMap = new Map(barcodes.map(b => [b.variantId, b]));
    const products = get().products.map(p => ({
      ...p,
      variants: p.variants.map(v => {
        const entry = barcodeMap.get(v.id);
        return entry ? { ...v, barcode: entry.barcode, barcodeFormat: entry.format || 'CODE128' } : v;
      }),
    }));
    set({ products });
  },

  movements: inventoryMovements,
  movementFilter: 'all',
  setMovementFilter: (filter) => set({ movementFilter: filter }),

  alerts: computeAlerts(),
  refreshAlerts: () => {
    const { products } = get();
    const alerts: StockAlert[] = [];
    for (const product of products) {
      for (const variant of product.variants) {
        const available = variant.stock - variant.reserved;
        if (available <= 0) {
          alerts.push({
            id: `alert-${variant.id}`,
            productId: product.id,
            productName: product.name,
            variantId: variant.id,
            variantLabel: `${variant.size} / ${variant.color}`,
            category: product.category,
            currentStock: variant.stock,
            minStock: variant.minStock,
            status: 'critical',
            createdAt: new Date().toISOString(),
          });
        } else if (available < variant.minStock) {
          alerts.push({
            id: `alert-${variant.id}`,
            productId: product.id,
            productName: product.name,
            variantId: variant.id,
            variantLabel: `${variant.size} / ${variant.color}`,
            category: product.category,
            currentStock: variant.stock,
            minStock: variant.minStock,
            status: 'low',
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
    set({ alerts });
  },

  importData: null,
  setImportData: (data) => set({ importData: data }),
  importPreview: [],
  parseImport: (csv) => {
    const lines = csv.trim().split('\n').slice(1); // skip header
    const preview = lines.slice(0, 20).map((line, i) => {
      const [sku, name, stock] = line.split(',').map(s => s.trim());
      const stockNum = parseInt(stock, 10);
      return {
        row: i + 2,
        sku: sku || '',
        name: name || '',
        stock: isNaN(stockNum) ? 0 : stockNum,
        valid: Boolean(sku && name && !isNaN(stockNum) && stockNum >= 0),
      };
    });
    set({ importPreview: preview });
  },
}));

// Selectors
export function getFilteredProducts(state: InventoryState) {
  let products = state.products;

  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  if (state.filterCategory !== 'all') {
    products = products.filter(p => p.category === state.filterCategory);
  }

  if (state.filterStatus !== 'all') {
    products = products.filter(p => {
      const status = getProductStatus(p);
      return status === state.filterStatus;
    });
  }

  return products;
}

export function getProductStatus(product: InventoryProduct): 'ok' | 'low' | 'critical' | 'out' {
  const stocks = product.variants.map(v => v.stock - v.reserved);
  const mins = product.variants.map(v => v.minStock);
  const totalStock = stocks.reduce((a, b) => a + b, 0);
  const hasOut = stocks.some(s => s <= 0);
  const hasCritical = stocks.some((s, i) => s > 0 && s < mins[i]);

  if (totalStock <= 0) return 'out';
  if (hasOut || hasCritical) return 'critical';
  const belowMin = stocks.filter((s, i) => s < mins[i]).length;
  if (belowMin > stocks.length * 0.3) return 'low';
  return 'ok';
}

export function getVariantStatus(stock: number, reserved: number, minStock: number): 'ok' | 'low' | 'critical' | 'out' {
  const available = stock - reserved;
  if (available <= 0) return 'out';
  if (available < minStock * 0.5) return 'critical';
  if (available < minStock) return 'low';
  return 'ok';
}

export function formatCRC(cents: number): string {
  return `₡${(cents / 100).toLocaleString('es-CR')}`;
}

export function getTotalStock(product: InventoryProduct): number {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

export function getAvailableStock(product: InventoryProduct): number {
  return product.variants.reduce((sum, v) => sum + (v.stock - v.reserved), 0);
}

export function getInventoryKPIs(products: InventoryProduct[]) {
  let totalUnits = 0, totalValue = 0, criticalCount = 0, lowCount = 0, outCount = 0, okCount = 0;
  let totalVariants = 0;

  for (const product of products) {
    for (const variant of product.variants) {
      totalVariants++;
      totalUnits += variant.stock;
      totalValue += variant.stock * (product.cost / 100);
      const status = getVariantStatus(variant.stock, variant.reserved, variant.minStock);
      if (status === 'out') outCount++;
      else if (status === 'critical') criticalCount++;
      else if (status === 'low') lowCount++;
      else okCount++;
    }
  }

  return {
    totalProducts: products.length,
    totalVariants,
    totalUnits,
    totalValue,
    criticalCount,
    lowCount,
    outOfStockCount: outCount,
    okCount,
  };
}

export function getStockByCategory(products: InventoryProduct[]) {
  const map: Record<string, number> = {};
  for (const p of products) {
    const stock = getTotalStock(p);
    map[p.category] = (map[p.category] ?? 0) + stock;
  }
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}
