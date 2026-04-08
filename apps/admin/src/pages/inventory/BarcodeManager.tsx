import { useState, useCallback, useMemo, useRef } from 'react';
import {
  QrCode,
  Search,
  Printer,
  Tag,
  CheckCircle,
  AlertCircle,
  Settings2,
  RefreshCw,
  X,
  ChevronDown,
  Package,
} from 'lucide-react';
import { useInventoryStore } from '@/store/inventoryStore';
import type { InventoryProduct, ProductVariant } from '@/types/inventory';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FlatVariant {
  product: InventoryProduct;
  variant: ProductVariant;
}

type LabelFormat = 'small' | 'medium' | 'large';
type BarcodeFormatType = 'CODE128' | 'EAN13' | 'QR';

interface BarcodeEntry {
  code: string;
  format: BarcodeFormatType;
}

// ─── Label sizes (mm) ────────────────────────────────────────────────────────

const LABEL_SIZES: Record<LabelFormat, { width: number; height: number; fontSize: number }> = {
  small: { width: 50, height: 25, fontSize: 8 },
  medium: { width: 70, height: 40, fontSize: 10 },
  large: { width: 100, height: 60, fontSize: 13 },
};

// ─── Toast helper ────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info';
}

let toastCounter = 0;

// ─── Component ───────────────────────────────────────────────────────────────

export default function BarcodeManager() {
  const products = useInventoryStore((s) => s.products);
  const setVariantBarcode = useInventoryStore((s) => s.setVariantBarcode);
  const setVariantBarcodes = useInventoryStore((s) => s.setVariantBarcodes);

  // Local barcode state: Map<variantId, BarcodeEntry>
  const [barcodeMap, setBarcodeMap] = useState<Map<string, BarcodeEntry>>(() => {
    // Seed from existing product data
    const initial = new Map<string, BarcodeEntry>();
    for (const product of products) {
      for (const variant of product.variants) {
        if (variant.barcode) {
          initial.set(variant.id, {
            code: variant.barcode,
            format: (variant.barcodeFormat as BarcodeFormatType) ?? 'CODE128',
          });
        }
      }
    }
    return initial;
  });

  // Search / filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'with' | 'without'>('all');

  // Lookup
  const [lookupCode, setLookupCode] = useState('');
  const [lookupResult, setLookupResult] = useState<FlatVariant | null>(null);
  const [lookupSearched, setLookupSearched] = useState(false);
  const lookupRef = useRef<HTMLInputElement>(null);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Label format
  const [labelFormat, setLabelFormat] = useState<LabelFormat>('medium');

  // Assign modal
  const [assignModal, setAssignModal] = useState<{
    variant: ProductVariant;
    product: InventoryProduct;
  } | null>(null);
  const [assignBarcodeValue, setAssignBarcodeValue] = useState('');
  const [assignFormat, setAssignFormat] = useState<BarcodeFormatType>('CODE128');

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Generating states
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [generatingAll, setGeneratingAll] = useState(false);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const showToast = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const getBarcode = useCallback(
    (variantId: string): BarcodeEntry | undefined => {
      return barcodeMap.get(variantId);
    },
    [barcodeMap]
  );

  // ─── Derived Data ────────────────────────────────────────────────────────

  const flatVariants = useMemo<FlatVariant[]>(() => {
    const result: FlatVariant[] = [];
    for (const product of products) {
      for (const variant of product.variants) {
        result.push({ product, variant });
      }
    }
    return result;
  }, [products]);

  const filtered = useMemo(() => {
    let items = flatVariants;

    if (filterMode === 'with') {
      items = items.filter((fv) => !!getBarcode(fv.variant.id));
    } else if (filterMode === 'without') {
      items = items.filter((fv) => !getBarcode(fv.variant.id));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (fv) =>
          fv.product.name.toLowerCase().includes(q) ||
          fv.variant.sku.toLowerCase().includes(q) ||
          (getBarcode(fv.variant.id)?.code.toLowerCase().includes(q) ?? false)
      );
    }

    return items;
  }, [flatVariants, filterMode, searchQuery, getBarcode]);

  const stats = useMemo(() => {
    const total = flatVariants.length;
    const withBarcode = flatVariants.filter((fv) => !!getBarcode(fv.variant.id)).length;
    const withoutBarcode = total - withBarcode;
    return { total, withBarcode, withoutBarcode };
  }, [flatVariants, getBarcode]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleLookup = useCallback(
    (code: string) => {
      if (!code.trim()) {
        setLookupResult(null);
        setLookupSearched(false);
        return;
      }
      const q = code.trim().toLowerCase();
      const match = flatVariants.find((fv) => {
        const bc = getBarcode(fv.variant.id);
        return (
          fv.variant.sku.toLowerCase() === q ||
          bc?.code.toLowerCase() === q ||
          fv.variant.sku.toLowerCase().includes(q) ||
          (bc?.code.toLowerCase().includes(q) ?? false)
        );
      });
      setLookupResult(match ?? null);
      setLookupSearched(true);
    },
    [flatVariants, getBarcode]
  );

  const handleLookupKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleLookup(lookupCode);
      }
    },
    [lookupCode, handleLookup]
  );

  const toggleSelect = useCallback((variantId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(variantId)) next.delete(variantId);
      else next.add(variantId);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((fv) => fv.variant.id)));
    }
  }, [filtered, selectedIds.size]);

  const generateBarcodeForVariant = useCallback(
    (variantId: string, sku: string) => {
      setGeneratingIds((prev) => new Set(prev).add(variantId));

      setTimeout(() => {
        const code = `VONEB-${sku}`;
        // Save to global store FIRST
        useInventoryStore.getState().setVariantBarcode(variantId, code, 'CODE128');
        // Then update local map
        setBarcodeMap((prev) => {
          const next = new Map(prev);
          next.set(variantId, { code, format: 'CODE128' });
          return next;
        });
        setGeneratingIds((prev) => {
          const next = new Set(prev);
          next.delete(variantId);
          return next;
        });
      }, 150);
    },
    []
  );

  const handleGenerateMissing = useCallback(
    (onlyIds?: Set<string>) => {
      setGeneratingAll(true);

      setTimeout(() => {
        // Read current products from store to get latest state
        const currentProducts = useInventoryStore.getState().products;
        const newBarcodes: { variantId: string; barcode: string; format: string }[] = [];
        const mapUpdates = new Map<string, BarcodeEntry>();

        for (const product of currentProducts) {
          for (const variant of product.variants) {
            if (onlyIds && !onlyIds.has(variant.id)) continue;
            if (!variant.barcode) {
              const code = `VONEB-${variant.sku}`;
              newBarcodes.push({ variantId: variant.id, barcode: code, format: 'CODE128' });
              mapUpdates.set(variant.id, { code, format: 'CODE128' });
            }
          }
        }

        // Save to global store FIRST
        if (newBarcodes.length > 0) {
          useInventoryStore.getState().setVariantBarcodes(newBarcodes);
        }

        // Then update local map
        setBarcodeMap((prev) => {
          const next = new Map(prev);
          for (const [id, entry] of mapUpdates) {
            next.set(id, entry);
          }
          return next;
        });

        setGeneratingAll(false);
        showToast(`${newBarcodes.length} barcodes generados`);
      }, 300);
    },
    [showToast]
  );

  const handlePrintLabels = useCallback(
    (variantIds: string[]) => {
      const size = LABEL_SIZES[labelFormat];
      const items: Array<{
        productName: string;
        emoji: string;
        size: string;
        color: string;
        sku: string;
        barcode: string;
        price: string;
      }> = [];

      for (const vid of variantIds) {
        const fv = flatVariants.find((f) => f.variant.id === vid);
        if (!fv) continue;
        const bc = getBarcode(vid);
        if (!bc) continue;
        items.push({
          productName: fv.product.name,
          emoji: fv.product.emoji,
          size: fv.variant.size,
          color: fv.variant.color,
          sku: fv.variant.sku,
          barcode: bc.code,
          price: `₡${(fv.product.price / 100).toLocaleString('es-CR')}`,
        });
      }

      if (items.length === 0) {
        showToast('No hay barcodes para imprimir. Genera los barcodes primero.', 'info');
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const labelsHtml = items
        .map(
          (item) => `
        <div style="
          width: ${size.width}mm;
          height: ${size.height}mm;
          border: 1px solid #ccc;
          padding: 2mm;
          display: inline-flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
          font-family: 'Courier New', monospace;
          font-size: ${size.fontSize}pt;
          page-break-inside: avoid;
          margin: 1mm;
          overflow: hidden;
        ">
          <div style="font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${item.emoji} ${item.productName}
          </div>
          <div style="color: #555; font-size: ${Math.max(size.fontSize - 2, 6)}pt;">
            ${item.size} / ${item.color}
          </div>
          <div style="
            font-size: ${size.fontSize + 2}pt;
            font-weight: bold;
            letter-spacing: 2px;
            text-align: center;
            padding: 1mm 0;
            border-top: 1px dashed #999;
            border-bottom: 1px dashed #999;
            margin: 1mm 0;
          ">
            ${item.barcode}
          </div>
          <div style="display: flex; justify-content: space-between; font-size: ${Math.max(size.fontSize - 2, 6)}pt;">
            <span style="color: #555;">${item.sku}</span>
            <span style="font-weight: bold;">${item.price}</span>
          </div>
        </div>
      `
        )
        .join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Etiquetas V ONE B</title>
          <style>
            @page { margin: 5mm; }
            body {
              margin: 0;
              padding: 5mm;
              display: flex;
              flex-wrap: wrap;
              gap: 0;
              align-content: flex-start;
            }
          </style>
        </head>
        <body>
          ${labelsHtml}
          <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    },
    [flatVariants, getBarcode, labelFormat, showToast]
  );

  const handleAssignSubmit = useCallback(() => {
    if (!assignModal || !assignBarcodeValue.trim()) return;
    const code = assignBarcodeValue.trim();
    // Save to global store
    useInventoryStore.getState().setVariantBarcode(assignModal.variant.id, code, assignFormat);
    // Update local map
    setBarcodeMap((prev) => {
      const next = new Map(prev);
      next.set(assignModal.variant.id, { code, format: assignFormat });
      return next;
    });
    showToast('Barcode asignado correctamente');
    setAssignModal(null);
    setAssignBarcodeValue('');
    setAssignFormat('CODE128');
  }, [assignModal, assignBarcodeValue, assignFormat, showToast]);

  const openAssignModal = useCallback(
    (product: InventoryProduct, variant: ProductVariant) => {
      setAssignModal({ product, variant });
      const existing = barcodeMap.get(variant.id);
      setAssignBarcodeValue(existing?.code ?? variant.barcode ?? '');
      setAssignFormat(existing?.format ?? (variant.barcodeFormat as BarcodeFormatType) ?? 'CODE128');
    },
    [barcodeMap]
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  const hasSelection = selectedIds.size > 0;

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 pt-6 pb-4 border-b border-[#1E1E1E]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00FF88]/10 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-[#00FF88]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Gesti&oacute;n de C&oacute;digos de Barras
              </h1>
              <p className="text-sm text-[#6B7280]">
                Generar, asignar e imprimir etiquetas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleGenerateMissing()}
              disabled={generatingAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-white text-sm font-medium hover:border-[#3A3A3A] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${generatingAll ? 'animate-spin' : ''}`} />
              Generar faltantes
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setFilterMode(filterMode === 'with' ? 'all' : 'with')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
              filterMode === 'with'
                ? 'bg-[#00FF88]/5 border-[#00FF88]/30'
                : 'bg-[#111111] border-[#1E1E1E] hover:border-[#2A2A2A]'
            }`}
          >
            <CheckCircle
              className={`w-5 h-5 ${filterMode === 'with' ? 'text-[#00FF88]' : 'text-[#00FF88]/60'}`}
            />
            <div className="text-left">
              <p className="text-lg font-bold text-white">{stats.withBarcode}</p>
              <p className="text-xs text-[#6B7280]">Con barcode</p>
            </div>
          </button>

          <button
            onClick={() => setFilterMode(filterMode === 'without' ? 'all' : 'without')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
              filterMode === 'without'
                ? 'bg-amber-500/5 border-amber-500/30'
                : 'bg-[#111111] border-[#1E1E1E] hover:border-[#2A2A2A]'
            }`}
          >
            <AlertCircle
              className={`w-5 h-5 ${filterMode === 'without' ? 'text-amber-400' : 'text-amber-400/60'}`}
            />
            <div className="text-left">
              <p className="text-lg font-bold text-white">{stats.withoutBarcode}</p>
              <p className="text-xs text-[#6B7280]">Sin barcode</p>
            </div>
          </button>

          <button
            onClick={() => setFilterMode('all')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
              filterMode === 'all'
                ? 'bg-blue-500/5 border-blue-500/30'
                : 'bg-[#111111] border-[#1E1E1E] hover:border-[#2A2A2A]'
            }`}
          >
            <Package
              className={`w-5 h-5 ${filterMode === 'all' ? 'text-blue-400' : 'text-blue-400/60'}`}
            />
            <div className="text-left">
              <p className="text-lg font-bold text-white">{stats.total}</p>
              <p className="text-xs text-[#6B7280]">Total variantes</p>
            </div>
          </button>
        </div>
      </div>

      {/* Lookup + Search bar */}
      <div className="shrink-0 px-6 py-4 flex items-center gap-3">
        {/* Barcode lookup */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <input
            ref={lookupRef}
            type="text"
            value={lookupCode}
            onChange={(e) => {
              setLookupCode(e.target.value);
              if (!e.target.value.trim()) {
                setLookupResult(null);
                setLookupSearched(false);
              }
            }}
            onKeyDown={handleLookupKeyDown}
            placeholder="Escanear o buscar barcode... (Enter)"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0F0F0F] border border-[#2A2A2A] text-white text-sm placeholder:text-[#6B7280] focus:outline-none focus:border-[#00FF88]/50 transition-colors"
          />
        </div>

        {/* Product / SKU search */}
        <div className="relative flex-1 max-w-sm">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar por producto o SKU..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0F0F0F] border border-[#2A2A2A] text-white text-sm placeholder:text-[#6B7280] focus:outline-none focus:border-[#00FF88]/50 transition-colors"
          />
        </div>

        {/* Label format selector */}
        <div className="relative">
          <select
            value={labelFormat}
            onChange={(e) => setLabelFormat(e.target.value as LabelFormat)}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-lg bg-[#0F0F0F] border border-[#2A2A2A] text-white text-sm focus:outline-none focus:border-[#00FF88]/50 transition-colors cursor-pointer"
          >
            <option value="small">Etiqueta S</option>
            <option value="medium">Etiqueta M</option>
            <option value="large">Etiqueta L</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
        </div>
      </div>

      {/* Lookup result */}
      {lookupSearched && lookupResult && (
        <div className="shrink-0 mx-6 mb-3 p-4 rounded-lg bg-[#111111] border border-[#00FF88]/20">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-[#00FF88]" />
            <span className="text-sm font-medium text-[#00FF88]">Barcode encontrado</span>
          </div>
          <p className="text-white text-sm">
            {lookupResult.product.emoji} {lookupResult.product.name} &mdash;{' '}
            <span className="text-[#9CA3AF]">
              {lookupResult.variant.sku} / {lookupResult.variant.size}{' '}
              {lookupResult.variant.color}
            </span>
          </p>
          {getBarcode(lookupResult.variant.id) && (
            <p className="text-xs text-[#6B7280] mt-1 font-mono">
              Barcode: {getBarcode(lookupResult.variant.id)!.code} ({getBarcode(lookupResult.variant.id)!.format})
            </p>
          )}
          <p className="text-xs text-[#9CA3AF] mt-1">
            Stock: {lookupResult.variant.stock} &middot; Precio: ₡{(lookupResult.product.price / 100).toLocaleString('es-CR')}
          </p>
        </div>
      )}

      {lookupSearched && !lookupResult && (
        <div className="shrink-0 mx-6 mb-3 p-4 rounded-lg bg-[#111111] border border-amber-500/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-400">
              No se encontr&oacute; ning&uacute;n producto con ese c&oacute;digo
            </span>
          </div>
        </div>
      )}

      {/* Bulk actions toolbar */}
      {hasSelection && (
        <div className="shrink-0 mx-6 mb-3 flex items-center gap-3 px-4 py-3 rounded-lg bg-[#00FF88]/5 border border-[#00FF88]/20">
          <span className="text-sm text-[#00FF88] font-medium">
            {selectedIds.size} seleccionado{selectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="h-4 w-px bg-[#2A2A2A]" />

          <button
            onClick={() => handlePrintLabels(Array.from(selectedIds))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#00FF88] text-black text-xs font-semibold hover:bg-[#00FF88]/90 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir etiquetas
          </button>

          <button
            onClick={() => {
              const withoutBarcode = new Set(
                Array.from(selectedIds).filter((id) => !barcodeMap.has(id))
              );
              if (withoutBarcode.size > 0) {
                handleGenerateMissing(withoutBarcode);
              } else {
                showToast('Todos los seleccionados ya tienen barcode', 'info');
              }
            }}
            disabled={generatingAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] text-white text-xs font-medium hover:border-[#3A3A3A] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generatingAll ? 'animate-spin' : ''}`} />
            Generar faltantes
          </button>

          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto flex items-center gap-1 px-2 py-1.5 rounded-md text-[#6B7280] text-xs hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar
          </button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="bg-[#111111] rounded-lg border border-[#1E1E1E] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[40px_1fr_140px_120px_160px_180px] gap-2 px-4 py-3 border-b border-[#1E1E1E] text-xs font-medium text-[#6B7280] uppercase tracking-wider">
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={selectedIds.size === filtered.length && filtered.length > 0}
                onChange={toggleSelectAll}
                className="w-3.5 h-3.5 rounded border-[#2A2A2A] bg-[#0F0F0F] accent-[#00FF88] cursor-pointer"
              />
            </div>
            <div>Producto / Variante</div>
            <div>SKU</div>
            <div>Talla / Color</div>
            <div>C&oacute;digo de barras</div>
            <div className="text-right">Acciones</div>
          </div>

          {/* Table body */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#6B7280]">
              <QrCode className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">No se encontraron variantes</p>
            </div>
          ) : (
            filtered.map(({ product, variant }) => {
              const isSelected = selectedIds.has(variant.id);
              const bc = getBarcode(variant.id);
              const hasBarcode = !!bc;
              const isGenerating = generatingIds.has(variant.id);

              return (
                <div
                  key={variant.id}
                  className={`grid grid-cols-[40px_1fr_140px_120px_160px_180px] gap-2 px-4 py-3 border-b border-[#1E1E1E]/50 items-center text-sm transition-colors ${
                    isSelected
                      ? 'bg-[#00FF88]/[0.03]'
                      : 'hover:bg-[#ffffff]/[0.02]'
                  }`}
                >
                  {/* Checkbox */}
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(variant.id)}
                      className="w-3.5 h-3.5 rounded border-[#2A2A2A] bg-[#0F0F0F] accent-[#00FF88] cursor-pointer"
                    />
                  </div>

                  {/* Product name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{product.emoji}</span>
                    <span className="text-white truncate">{product.name}</span>
                  </div>

                  {/* SKU */}
                  <div className="text-[#9CA3AF] font-mono text-xs truncate">
                    {variant.sku}
                  </div>

                  {/* Size / Color */}
                  <div className="text-[#9CA3AF] text-xs">
                    {variant.size} / {variant.color}
                  </div>

                  {/* Barcode */}
                  <div className="min-w-0">
                    {hasBarcode ? (
                      <div className="flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-[#00FF88] shrink-0" />
                        <span className="text-white font-mono text-xs truncate">
                          {bc.code}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#6B7280] text-xs italic">Sin barcode</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5">
                    {!hasBarcode && (
                      <button
                        onClick={() => generateBarcodeForVariant(variant.id, variant.sku)}
                        disabled={isGenerating}
                        title="Generar barcode"
                        className="p-1.5 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] text-[#9CA3AF] hover:text-[#00FF88] hover:border-[#00FF88]/30 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`}
                        />
                      </button>
                    )}

                    {hasBarcode && (
                      <button
                        onClick={() => handlePrintLabels([variant.id])}
                        title="Imprimir etiqueta"
                        className="p-1.5 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] text-[#9CA3AF] hover:text-[#00FF88] hover:border-[#00FF88]/30 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => openAssignModal(product, variant)}
                      title="Asignar manualmente"
                      className="p-1.5 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] text-[#9CA3AF] hover:text-[#00FF88] hover:border-[#00FF88]/30 transition-colors"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#111111] border border-[#00FF88]/30 shadow-lg shadow-black/40 animate-in fade-in slide-in-from-bottom-4"
          >
            <CheckCircle className="w-4 h-4 text-[#00FF88]" />
            <span className="text-sm text-white">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Assign barcode modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setAssignModal(null)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md mx-4 bg-[#111111] border border-[#1E1E1E] rounded-xl shadow-2xl shadow-black/60">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E1E]">
              <div>
                <h3 className="text-base font-semibold text-white">Asignar barcode</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  {assignModal.product.emoji} {assignModal.product.name} &mdash;{' '}
                  {assignModal.variant.size} / {assignModal.variant.color}
                </p>
              </div>
              <button
                onClick={() => setAssignModal(null)}
                className="p-1.5 rounded-md text-[#6B7280] hover:text-white hover:bg-[#1A1A1A] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
                  C&oacute;digo de barras
                </label>
                <input
                  type="text"
                  value={assignBarcodeValue}
                  onChange={(e) => setAssignBarcodeValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && assignBarcodeValue.trim()) {
                      handleAssignSubmit();
                    }
                  }}
                  placeholder="Escanear o ingresar manualmente..."
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0F0F0F] border border-[#2A2A2A] text-white text-sm font-mono placeholder:text-[#6B7280] focus:outline-none focus:border-[#00FF88]/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#9CA3AF] mb-1.5">
                  Formato
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CODE128', 'EAN13', 'QR'] as BarcodeFormatType[]).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setAssignFormat(fmt)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        assignFormat === fmt
                          ? 'bg-[#00FF88]/10 border-[#00FF88]/30 text-[#00FF88]'
                          : 'bg-[#0F0F0F] border-[#2A2A2A] text-[#9CA3AF] hover:border-[#3A3A3A]'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const existing = barcodeMap.get(assignModal.variant.id);
                if (!existing) return null;
                return (
                  <div className="p-3 rounded-lg bg-[#0A0A0A] border border-[#1E1E1E]">
                    <p className="text-xs text-[#6B7280] mb-1">Barcode actual</p>
                    <p className="text-sm text-white font-mono">{existing.code}</p>
                    <p className="text-xs text-[#6B7280] mt-1">
                      Formato: {existing.format}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#1E1E1E]">
              <button
                onClick={() => setAssignModal(null)}
                className="px-4 py-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-white text-sm font-medium hover:border-[#3A3A3A] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignSubmit}
                disabled={!assignBarcodeValue.trim()}
                className="px-4 py-2 rounded-lg bg-[#00FF88] text-black text-sm font-semibold hover:bg-[#00FF88]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
