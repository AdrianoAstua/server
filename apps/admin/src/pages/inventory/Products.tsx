import { useState } from 'react';
import { useInventoryStore, getProductStatus, getVariantStatus, formatCRC, getTotalStock, getAvailableStock } from '@/store/inventoryStore';
import type { InventoryProduct, FilterCategory } from '@/types/inventory';
import {
  Search, Grid3X3, List, Plus, ChevronLeft, ChevronRight,
  Package, AlertTriangle, CheckCircle, XCircle, TrendingDown,
  Eye, ArrowDownToLine, X
} from 'lucide-react';

const ITEMS_PER_PAGE = 12;

const STATUS_CONFIG = {
  ok: { label: 'OK', color: '#00FF88', bg: '#00FF8810', icon: CheckCircle },
  low: { label: 'Bajo', color: '#FF8C00', bg: '#FF8C0010', icon: TrendingDown },
  critical: { label: 'Crítico', color: '#EF4444', bg: '#EF444410', icon: AlertTriangle },
  out: { label: 'Agotado', color: '#6B7280', bg: '#6B728020', icon: XCircle },
};

const CATEGORIES: { id: FilterCategory; label: string; emoji: string }[] = [
  { id: 'all', label: 'Todas', emoji: '📦' },
  { id: 'ciclismo', label: 'Ciclismo', emoji: '🚴' },
  { id: 'running', label: 'Running', emoji: '🏃' },
  { id: 'natacion', label: 'Natación', emoji: '🏊' },
  { id: 'tops', label: 'Tops', emoji: '👕' },
  { id: 'accesorios', label: 'Accesorios', emoji: '🧢' },
  { id: 'trail', label: 'Trail', emoji: '🥾' },
];

function StatusBadge({ status }: { status: 'ok' | 'low' | 'critical' | 'out' }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      <cfg.icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function ProductRow({ product, onClick }: { product: InventoryProduct; onClick: () => void }) {
  const status = getProductStatus(product);
  const totalStock = getTotalStock(product);
  const available = getAvailableStock(product);

  return (
    <tr
      className="border-b border-[#1E1E1E] hover:bg-[#111111] cursor-pointer transition-colors group"
      onClick={onClick}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">{product.emoji}</span>
          <div>
            <p className="text-sm font-medium text-white group-hover:text-[#00FF88] transition-colors">{product.name}</p>
            <p className="text-xs text-[#6B7280] font-mono">{product.sku}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-xs text-[#9CA3AF] capitalize bg-[#1A1A1A] px-2 py-1 rounded-md">{product.category}</span>
      </td>
      <td className="py-3 px-4 text-sm text-white">{formatCRC(product.price)}</td>
      <td className="py-3 px-4">
        <div>
          <span className="text-sm font-semibold text-white">{totalStock}</span>
          <span className="text-xs text-[#6B7280] ml-1">({available} disp.)</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-xs text-[#6B7280]">{product.variants.length} variantes</span>
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={status} />
      </td>
      <td className="py-3 px-4">
        <button className="p-1.5 rounded-lg text-[#6B7280] hover:text-white hover:bg-[#1A1A1A] transition-colors">
          <Eye className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}

function ProductCard({ product, onClick }: { product: InventoryProduct; onClick: () => void }) {
  const status = getProductStatus(product);
  const totalStock = getTotalStock(product);
  const available = getAvailableStock(product);
  const statusCfg = STATUS_CONFIG[status];

  return (
    <div
      className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4 cursor-pointer hover:border-[#2A2A2A] hover:bg-[#131313] transition-all group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{product.emoji}</span>
        <StatusBadge status={status} />
      </div>
      <h3 className="text-sm font-semibold text-white mb-0.5 group-hover:text-[#00FF88] transition-colors line-clamp-1">{product.name}</h3>
      <p className="text-xs text-[#6B7280] font-mono mb-3">{product.sku}</p>

      <div className="flex items-center justify-between text-xs">
        <span className="text-[#9CA3AF] capitalize">{product.category}</span>
        <span className="font-semibold text-white">{formatCRC(product.price)}</span>
      </div>

      <div className="mt-3 pt-3 border-t border-[#1E1E1E] flex items-center justify-between text-xs">
        <span className="text-[#6B7280]">{product.variants.length} variantes</span>
        <div>
          <span className="font-bold text-white">{totalStock}</span>
          <span className="text-[#6B7280] ml-1">uds</span>
          <span className="text-[#4B5563] mx-1">·</span>
          <span style={{ color: statusCfg.color }}>{available} disp.</span>
        </div>
      </div>
    </div>
  );
}

// Entry Modal
function EntryModal() {
  const { entryModalOpen, entryVariantId, products, closeEntryModal, addStock } = useInventoryStore();
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState('');

  if (!entryModalOpen || !entryVariantId) return null;

  const product = products.find(p => p.variants.some(v => v.id === entryVariantId));
  const variant = product?.variants.find(v => v.id === entryVariantId);

  const handleSubmit = () => {
    if (qty > 0 && reason.trim()) {
      addStock(entryVariantId, qty, reason);
      setQty(1);
      setReason('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-[#1E1E1E] rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">Entrada de stock</h3>
          <button onClick={closeEntryModal} className="p-1.5 text-[#6B7280] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {product && variant && (
          <div className="bg-[#1A1A1A] rounded-lg p-3 mb-4">
            <p className="text-sm font-medium text-white">{product.name}</p>
            <p className="text-xs text-[#6B7280]">Talla {variant.size} · {variant.color} · Stock actual: {variant.stock}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#9CA3AF] mb-1.5 block">Cantidad a agregar</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-8 h-8 rounded-lg bg-[#1A1A1A] text-white hover:bg-[#222] flex items-center justify-center text-lg"
              >−</button>
              <input
                type="number"
                value={qty}
                onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none focus:border-[#00FF88]"
                min={1}
              />
              <button
                onClick={() => setQty(qty + 1)}
                className="w-8 h-8 rounded-lg bg-[#1A1A1A] text-white hover:bg-[#222] flex items-center justify-center text-lg"
              >+</button>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#9CA3AF] mb-1.5 block">Motivo / Referencia</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ej: Orden de compra OC-146"
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#00FF88] placeholder-[#4B5563]"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={closeEntryModal}
            className="flex-1 py-2.5 rounded-lg border border-[#2A2A2A] text-[#9CA3AF] hover:text-white text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={qty < 1 || !reason.trim()}
            className="flex-1 py-2.5 rounded-lg bg-[#00FF88] text-black font-semibold text-sm hover:bg-[#00DD77] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Agregar {qty} ud{qty !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

// Product Detail Modal
function ProductDetailModal({ product, onClose }: { product: InventoryProduct; onClose: () => void }) {
  const openEntryModal = useInventoryStore(s => s.openEntryModal);
  const movements = useInventoryStore(s => s.movements);
  const productMovements = movements.filter(m => m.productId === product.id).slice(0, 8);

  const MOVE_TYPE_LABELS = {
    entrada: { label: 'Entrada', color: '#00FF88' },
    salida: { label: 'Salida', color: '#EF4444' },
    ajuste: { label: 'Ajuste', color: '#F59E0B' },
    reserva: { label: 'Reserva', color: '#3B82F6' },
    devolucion: { label: 'Devolución', color: '#8B5CF6' },
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0F0F0F] border border-[#1E1E1E] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 p-5 border-b border-[#1E1E1E]">
          <span className="text-3xl">{product.emoji}</span>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">{product.name}</h2>
            <p className="text-sm text-[#6B7280] font-mono">{product.sku} · {product.category}</p>
          </div>
          <div className="text-right mr-4">
            <p className="text-lg font-bold text-white">{formatCRC(product.price)}</p>
            <p className="text-xs text-[#6B7280]">Costo: {formatCRC(product.cost)}</p>
          </div>
          <button onClick={onClose} className="p-2 text-[#6B7280] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Variants table */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Variantes y stock</h3>
            <table className="w-full">
              <thead>
                <tr className="text-xs text-[#6B7280] border-b border-[#1E1E1E]">
                  <th className="text-left pb-2 font-medium">SKU</th>
                  <th className="text-left pb-2 font-medium">Talla</th>
                  <th className="text-left pb-2 font-medium">Color</th>
                  <th className="text-right pb-2 font-medium">Stock</th>
                  <th className="text-right pb-2 font-medium">Reservado</th>
                  <th className="text-right pb-2 font-medium">Disponible</th>
                  <th className="text-right pb-2 font-medium">Mín.</th>
                  <th className="text-center pb-2 font-medium">Estado</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {product.variants.map(variant => {
                  const status = getVariantStatus(variant.stock, variant.reserved, variant.minStock);
                  const available = variant.stock - variant.reserved;
                  return (
                    <tr key={variant.id} className="border-b border-[#1A1A1A] hover:bg-[#111111]">
                      <td className="py-2.5 text-xs text-[#6B7280] font-mono">{variant.sku}</td>
                      <td className="py-2.5 text-sm text-white">{variant.size}</td>
                      <td className="py-2.5 text-sm text-[#9CA3AF]">{variant.color}</td>
                      <td className="py-2.5 text-sm text-white text-right font-semibold">{variant.stock}</td>
                      <td className="py-2.5 text-sm text-[#6B7280] text-right">{variant.reserved}</td>
                      <td className="py-2.5 text-sm text-right font-bold" style={{
                        color: status === 'ok' ? '#00FF88' : status === 'low' ? '#FF8C00' : status === 'critical' ? '#EF4444' : '#6B7280'
                      }}>{available}</td>
                      <td className="py-2.5 text-sm text-[#6B7280] text-right">{variant.minStock}</td>
                      <td className="py-2.5 text-center"><StatusBadge status={status} /></td>
                      <td className="py-2.5 pl-3">
                        <button
                          onClick={() => openEntryModal(variant.id)}
                          className="text-xs text-[#00FF88] hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Entrada
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Movement history */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Historial de movimientos</h3>
            {productMovements.length === 0 ? (
              <p className="text-sm text-[#6B7280]">Sin movimientos registrados</p>
            ) : (
              <div className="space-y-2">
                {productMovements.map(mov => {
                  const cfg = MOVE_TYPE_LABELS[mov.type];
                  const sign = mov.type === 'salida' || mov.type === 'reserva' ? '-' : '+';
                  return (
                    <div key={mov.id} className="flex items-center gap-3 bg-[#111111] rounded-lg px-3 py-2.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                      <div className="flex-1">
                        <p className="text-sm text-white">{mov.reason}</p>
                        <p className="text-xs text-[#6B7280]">{mov.variantLabel} · {new Date(mov.createdAt).toLocaleString('es-CR')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: cfg.color }}>
                          {sign}{Math.abs(mov.quantity)} uds
                        </p>
                        <p className="text-xs text-[#6B7280]">{mov.stockBefore} → {mov.stockAfter}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function InventoryProducts() {
  const {
    products, productView, setProductView,
    searchQuery, setSearchQuery,
    filterCategory, setFilterCategory,
    filterStatus, setFilterStatus,
    currentPage, setCurrentPage,
    setSelectedProduct, getSelectedProduct,
  } = useInventoryStore();

  // Filter
  let filtered = products;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }
  if (filterCategory !== 'all') {
    filtered = filtered.filter(p => p.category === filterCategory);
  }
  if (filterStatus !== 'all') {
    filtered = filtered.filter(p => getProductStatus(p) === filterStatus);
  }

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const selectedProduct = getSelectedProduct();

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0A0A0A]">
      {/* Toolbar */}
      <div className="p-4 border-b border-[#1E1E1E] bg-[#0F0F0F] flex-shrink-0">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h1 className="text-lg font-bold text-white">Productos</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#6B7280]">{filtered.length} productos</span>
            <div className="flex items-center bg-[#1A1A1A] rounded-lg p-0.5 border border-[#2A2A2A]">
              <button
                onClick={() => setProductView('table')}
                className={`p-1.5 rounded-md transition-colors ${productView === 'table' ? 'bg-[#2A2A2A] text-white' : 'text-[#6B7280] hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setProductView('grid')}
                className={`p-1.5 rounded-md transition-colors ${productView === 'grid' ? 'bg-[#2A2A2A] text-white' : 'text-[#6B7280] hover:text-white'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Buscar producto, SKU, tag..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-[#4B5563] focus:outline-none focus:border-[#00FF88]"
            />
          </div>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value as FilterCategory)}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF88]"
          >
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF88]"
          >
            <option value="all">Todos los estados</option>
            <option value="ok">✅ OK</option>
            <option value="low">🟠 Bajo</option>
            <option value="critical">🔴 Crítico</option>
            <option value="out">⚫ Agotado</option>
          </select>

          {(searchQuery || filterCategory !== 'all' || filterStatus !== 'all') && (
            <button
              onClick={() => { setSearchQuery(''); setFilterCategory('all'); setFilterStatus('all'); }}
              className="p-2 rounded-lg text-[#6B7280] hover:text-white hover:bg-[#1A1A1A] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {productView === 'table' ? (
          <div className="bg-[#0F0F0F] border border-[#1E1E1E] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#111111]">
                <tr className="text-xs text-[#6B7280] border-b border-[#1E1E1E]">
                  <th className="text-left py-3 px-4 font-medium">Producto</th>
                  <th className="text-left py-3 px-4 font-medium">Categoría</th>
                  <th className="text-left py-3 px-4 font-medium">Precio</th>
                  <th className="text-left py-3 px-4 font-medium">Stock</th>
                  <th className="text-left py-3 px-4 font-medium">Variantes</th>
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {paginated.map(product => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onClick={() => setSelectedProduct(product.id)}
                  />
                ))}
              </tbody>
            </table>
            {paginated.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-[#6B7280]">
                <Package className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No se encontraron productos</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {paginated.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setSelectedProduct(product.id)}
              />
            ))}
            {paginated.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-[#6B7280]">
                <Package className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No se encontraron productos</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-[#1E1E1E] p-3 flex items-center justify-between flex-shrink-0 bg-[#0F0F0F]">
          <span className="text-xs text-[#6B7280]">
            {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-lg text-xs transition-colors ${
                  page === currentPage
                    ? 'bg-[#00FF88] text-black font-bold'
                    : 'text-[#6B7280] hover:text-white hover:bg-[#1A1A1A]'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Product detail modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Entry modal */}
      <EntryModal />
    </div>
  );
}
