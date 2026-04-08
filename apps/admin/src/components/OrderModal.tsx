import { useState } from 'react';
import { X, Search, Trash2, Plus, Package } from 'lucide-react';
import { useOrderModalStore } from '@/store/chatStore';
import { useChatStore } from '@/store/chatStore';
import { products } from '@/store/chatStore';

function formatCurrency(amount: number): string {
  return `₡${amount.toLocaleString()}`;
}

export function OrderModal() {
  const { isOpen, selectedProducts, deliveryType, notes, closeModal, addProduct, removeProduct, setDeliveryType, setNotes, clear } = useOrderModalStore();
  const conversation = useChatStore(state => state.getSelectedConversation());

  const [searchQuery, setSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !conversation) return null;

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const subtotal = selectedProducts.reduce((sum: number, item: { product: { price: number }; quantity: number }) => 
    sum + (item.product.price * item.quantity), 0
  );
  const shippingCost = deliveryType === 'shipping' ? 2500 : 0;
  const total = subtotal + shippingCost;

  const handleAddProduct = () => {
    if (selectedProduct && selectedSize) {
      addProduct(selectedProduct, selectedSize, quantity);
      setSelectedProduct(null);
      setSelectedSize('');
      setQuantity(1);
      setShowProductSearch(false);
    }
  };

  const handleClose = () => {
    clear();
    closeModal();
  };

  const handleCreateOrder = () => {
    // Aquí se crearía el pedido
    alert(`Pedido creado para ${conversation.customer.name}\nTotal: ${formatCurrency(total)}`);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1A1A1A] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00FF88]/20 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-[#00FF88]" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Nuevo Pedido V ONE B</h2>
              <p className="text-white/50 text-sm">{conversation.customer.name}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/50" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Productos seleccionados */}
          <div className="mb-6">
            <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3">Productos</h3>
            <div className="bg-white/5 rounded-lg border border-white/10 p-3">
              {selectedProducts.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-4">No hay productos seleccionados</p>
              ) : (
                <div className="space-y-2">
                  {selectedProducts.map((item: { product: { emoji: string; name: string; price: number }; size: string; quantity: number }, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className="flex-1">
                        <p className="text-white text-sm">{item.product.emoji} {item.product.name}</p>
                        <p className="text-white/50 text-xs">Talla: {item.size} | Cant: {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-medium text-sm">{formatCurrency(item.product.price * item.quantity)}</span>
                        <button
                          onClick={() => removeProduct(idx)}
                          className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Agregar producto */}
              {!showProductSearch ? (
                <button
                  onClick={() => setShowProductSearch(true)}
                  className="w-full mt-3 py-2 border border-dashed border-white/20 rounded-lg text-white/50 text-sm hover:border-white/40 hover:text-white/70 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar producto
                </button>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar producto..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>

                  {searchQuery && (
                    <div className="max-h-32 overflow-y-auto bg-white/5 rounded-lg">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => {
                            setSelectedProduct(product);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-white/10 transition-colors text-sm text-white/70"
                        >
                          {product.emoji} {product.name} - {formatCurrency(product.price)}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedProduct && (
                    <div className="bg-white/5 rounded-lg p-3 space-y-3">
                      <p className="text-white text-sm">{selectedProduct.emoji} {selectedProduct.name}</p>
                      <div className="flex gap-3">
                        <select
                          value={selectedSize}
                          onChange={(e) => setSelectedSize(e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        >
                          <option value="">Talla</option>
                          {Object.keys(selectedProduct.sizes).map(size => (
                            <option key={size} value={size}>{size}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white text-center"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(null);
                            setShowProductSearch(false);
                          }}
                          className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 text-sm transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleAddProduct}
                          disabled={!selectedSize}
                          className="flex-1 py-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 rounded-lg text-white text-sm transition-colors"
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tipo de entrega */}
          <div className="mb-6">
            <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3">Entrega</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="radio"
                  checked={deliveryType === 'shipping'}
                  onChange={() => setDeliveryType('shipping')}
                  className="w-4 h-4 accent-[#3B82F6]"
                />
                <span className="text-white text-sm flex-1">📦 Envío Correos de CR</span>
                <span className="text-white/50 text-sm">₡2,500</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="radio"
                  checked={deliveryType === 'pickup'}
                  onChange={() => setDeliveryType('pickup')}
                  className="w-4 h-4 accent-[#3B82F6]"
                />
                <span className="text-white text-sm flex-1">🏪 Retiro en taller</span>
                <span className="text-white/50 text-sm">Gratis</span>
              </label>
            </div>
            {deliveryType === 'shipping' && conversation.customer.address && (
              <p className="mt-2 text-white/50 text-xs">
                📍 {conversation.customer.address}
              </p>
            )}
          </div>

          {/* Notas */}
          <div className="mb-6">
            <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3">Notas</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#3B82F6] resize-none h-20"
            />
          </div>

          {/* Totales */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/50">Subtotal</span>
              <span className="text-white">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-white/50">Envío</span>
              <span className="text-white">{formatCurrency(shippingCost)}</span>
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between">
              <span className="text-white font-semibold">TOTAL</span>
              <span className="text-white font-bold text-lg">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-white/10 bg-[#111111]">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-white/70 text-sm hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateOrder}
            disabled={selectedProducts.length === 0}
            className="px-6 py-2 bg-[#00FF88] hover:bg-[#00DD77] disabled:opacity-50 disabled:cursor-not-allowed text-black font-medium text-sm rounded-lg transition-colors"
          >
            ✅ Crear Pedido
          </button>
        </div>
      </div>
    </div>
  );
}
