import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useCallback } from 'react';
import { useInventoryStore } from '@/store/inventoryStore';
import * as XLSX from 'xlsx';
import { Upload, Download, CheckCircle2, XCircle, AlertCircle, Trash2, FileSpreadsheet, Table2 } from 'lucide-react';
// ─── Columnas de la plantilla ────────────────────────────────────────────────
const TEMPLATE_COLUMNS = [
    { key: 'SKU', label: 'SKU', example: 'CIC-JER-001-S-R', note: 'Código único de la variante', required: true },
    { key: 'Nombre', label: 'Nombre', example: 'Jersey Giro PRO-01', note: 'Nombre del producto', required: true },
    { key: 'Categoría', label: 'Categoría', example: 'ciclismo', note: 'ciclismo / running / natacion / tops / accesorios / trail', required: true },
    { key: 'Precio', label: 'Precio (₡)', example: '30000', note: 'Precio de venta en colones', required: true },
    { key: 'Costo', label: 'Costo (₡)', example: '15000', note: 'Costo de producción/compra', required: false },
    { key: 'Talla', label: 'Talla', example: 'S', note: 'S / M / L / XL / U', required: true },
    { key: 'Color', label: 'Color', example: 'Rojo', note: 'Nombre del color', required: true },
    { key: 'Stock', label: 'Stock', example: '5', note: 'Cantidad disponible actual', required: true },
    { key: 'Reservado', label: 'Reservado', example: '0', note: 'Unidades reservadas en pedidos', required: false },
    { key: 'StockMínimo', label: 'Stock Mínimo', example: '3', note: 'Mínimo antes de alerta', required: false },
];
// Filas de ejemplo para la plantilla
const EXAMPLE_ROWS = [
    ['CIC-JER-001-S-R', 'Jersey Giro PRO-01', 'ciclismo', 30000, 15000, 'S', 'Rojo', 5, 0, 3],
    ['CIC-JER-001-M-R', 'Jersey Giro PRO-01', 'ciclismo', 30000, 15000, 'M', 'Rojo', 8, 1, 3],
    ['CIC-JER-001-L-R', 'Jersey Giro PRO-01', 'ciclismo', 30000, 15000, 'L', 'Rojo', 3, 0, 3],
    ['RUN-CAM-001-S-V', 'Camisa Trail Runner', 'running', 12000, 6000, 'S', 'Verde', 4, 0, 4],
    ['RUN-CAM-001-M-V', 'Camisa Trail Runner', 'running', 12000, 6000, 'M', 'Verde', 6, 0, 4],
    ['ACC-GOR-001-U-N', 'Gorra V-One-B', 'accesorios', 6000, 2500, 'U', 'Negro', 15, 2, 10],
];
// ─── Generar y descargar plantilla .xlsx ─────────────────────────────────────
function downloadTemplate() {
    const wb = XLSX.utils.book_new();
    // Hoja 1 — Plantilla
    const headers = TEMPLATE_COLUMNS.map(c => c.key);
    const exampleData = EXAMPLE_ROWS.map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i]; });
        return obj;
    });
    const ws = XLSX.utils.json_to_sheet(exampleData, { header: headers });
    // Ancho de columnas
    ws['!cols'] = [
        { wch: 22 }, { wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
        { wch: 8 }, { wch: 14 }, { wch: 8 }, { wch: 12 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    // Hoja 2 — Instrucciones
    const instrData = TEMPLATE_COLUMNS.map(c => ({
        'Columna': c.key,
        'Requerida': c.required ? 'SÍ' : 'No',
        'Ejemplo': c.example,
        'Descripción': c.note,
    }));
    const wsInstr = XLSX.utils.json_to_sheet(instrData);
    wsInstr['!cols'] = [{ wch: 16 }, { wch: 12 }, { wch: 22 }, { wch: 52 }];
    XLSX.utils.book_append_sheet(wb, wsInstr, 'Instrucciones');
    XLSX.writeFile(wb, 'voneb_plantilla_productos.xlsx');
}
// ─── Exportar inventario actual a .xlsx ───────────────────────────────────────
function exportToExcel(products, type, movements) {
    const wb = XLSX.utils.book_new();
    if (type === 'products' || type === 'full') {
        const rows = products.flatMap(p => p.variants.map(v => ({
            SKU: v.sku,
            Nombre: p.name,
            'Categoría': p.category,
            'Precio (₡)': p.price / 100,
            'Costo (₡)': p.cost / 100,
            Talla: v.size,
            Color: v.color,
            Stock: v.stock,
            Reservado: v.reserved,
            Disponible: v.stock - v.reserved,
            'Stock Mínimo': v.minStock,
        })));
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [
            { wch: 22 }, { wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
            { wch: 8 }, { wch: 14 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
        ];
        XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    }
    if (type === 'movements' || type === 'full') {
        const rows = movements.map(m => ({
            ID: m.id,
            Producto: m.productName,
            Variante: m.variantLabel,
            Tipo: m.type,
            Cantidad: m.quantity,
            'Stock Antes': m.stockBefore,
            'Stock Después': m.stockAfter,
            Motivo: m.reason,
            Referencia: m.reference ?? '',
            Fecha: m.createdAt,
            Usuario: m.createdBy,
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
    }
    const filename = type === 'products'
        ? `voneb_inventario_${new Date().toISOString().slice(0, 10)}.xlsx`
        : type === 'movements'
            ? `voneb_movimientos_${new Date().toISOString().slice(0, 10)}.xlsx`
            : `voneb_reporte_completo_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
}
function parseUploadedFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result);
                const wb = XLSX.read(data, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
                const preview = rows.slice(0, 50).map((row, i) => {
                    // Mapeo flexible de columnas (insensible a mayúsculas/tildes)
                    const get = (keys) => {
                        for (const k of keys) {
                            const found = Object.keys(row).find(rk => rk.toLowerCase().replace(/[áéíóúü]/g, c => ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' }[c] ?? c))
                                === k.toLowerCase().replace(/[áéíóúü]/g, c => ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' }[c] ?? c)));
                            if (found)
                                return String(row[found] ?? '').trim();
                        }
                        return '';
                    };
                    const sku = get(['sku']);
                    const nombre = get(['nombre', 'name', 'producto']);
                    const categoria = get(['categoria', 'categoría', 'category']);
                    const precioStr = get(['precio', 'price', 'precio (₡)']);
                    const talla = get(['talla', 'size', 'talle']);
                    const color = get(['color']);
                    const stockStr = get(['stock']);
                    const stockMinStr = get(['stockmínimo', 'stockminimo', 'stock mínimo', 'stock minimo', 'min', 'minimo']);
                    const precio = parseFloat(precioStr) || 0;
                    const stock = parseInt(stockStr, 10);
                    const stockMin = parseInt(stockMinStr, 10) || 3;
                    const errors = [];
                    if (!sku)
                        errors.push('SKU requerido');
                    if (!nombre)
                        errors.push('Nombre requerido');
                    if (!talla)
                        errors.push('Talla requerida');
                    if (!color)
                        errors.push('Color requerido');
                    if (isNaN(stock) || stock < 0)
                        errors.push('Stock inválido');
                    if (precio <= 0)
                        errors.push('Precio inválido');
                    return {
                        row: i + 2,
                        sku,
                        nombre,
                        categoria,
                        precio,
                        talla,
                        color,
                        stock: isNaN(stock) ? 0 : stock,
                        stockMinimo: stockMin,
                        valid: errors.length === 0,
                        errors,
                    };
                });
                resolve(preview);
            }
            catch {
                reject(new Error('No se pudo leer el archivo'));
            }
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsArrayBuffer(file);
    });
}
// ─── Sección Exportar ────────────────────────────────────────────────────────
function ExportSection() {
    const products = useInventoryStore(s => s.products);
    const movements = useInventoryStore(s => s.movements);
    const [exportType, setExportType] = useState('products');
    const rowCount = exportType === 'movements'
        ? movements.length
        : products.reduce((s, p) => s + p.variants.length, 0);
    return (_jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-5", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "p-2 rounded-lg bg-[#00FF88]/10", children: _jsx(Download, { className: "w-5 h-5 text-[#00FF88]" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-bold text-white", children: "Exportar datos" }), _jsx("p", { className: "text-xs text-[#6B7280]", children: "Descarga inventario y movimientos en Excel" })] })] }), _jsx("div", { className: "grid grid-cols-3 gap-2 mb-4", children: ['products', 'movements', 'full'].map(type => (_jsx("button", { onClick: () => setExportType(type), className: `py-2.5 px-3 rounded-lg text-xs font-medium transition-colors border ${exportType === type
                        ? 'bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/20'
                        : 'text-[#6B7280] border-[#2A2A2A] hover:text-white'}`, children: type === 'products' ? '📦 Productos' : type === 'movements' ? '🔄 Movimientos' : '📊 Completo' }, type))) }), _jsxs("div", { className: "bg-[#1A1A1A] rounded-lg px-4 py-3 mb-4 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-[#6B7280]", children: "Filas a exportar" }), _jsx("p", { className: "text-lg font-bold text-white", children: rowCount })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-xs text-[#6B7280]", children: "Formato" }), _jsx("p", { className: "text-sm font-semibold text-white", children: "Excel (.xlsx)" })] })] }), _jsxs("button", { onClick: () => exportToExcel(products, exportType, movements), className: "w-full py-3 rounded-xl bg-[#00FF88] text-black font-bold text-sm hover:bg-[#00DD77] transition-colors flex items-center justify-center gap-2", children: [_jsx(FileSpreadsheet, { className: "w-4 h-4" }), "Descargar Excel"] })] }));
}
// ─── Sección Importar ────────────────────────────────────────────────────────
function ImportSection() {
    const [preview, setPreview] = useState([]);
    const [fileName, setFileName] = useState(null);
    const [loading, setLoading] = useState(false);
    const [imported, setImported] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState(null);
    const fileRef = useRef(null);
    const handleFile = useCallback(async (file) => {
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        const isCsv = file.name.endsWith('.csv');
        if (!isExcel && !isCsv) {
            setError('Solo se aceptan archivos .xlsx, .xls o .csv');
            return;
        }
        setLoading(true);
        setError(null);
        setImported(false);
        try {
            const rows = await parseUploadedFile(file);
            setPreview(rows);
            setFileName(file.name);
        }
        catch {
            setError('No se pudo leer el archivo. Asegúrate de usar la plantilla correcta.');
        }
        finally {
            setLoading(false);
        }
    }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files[0])
            handleFile(e.dataTransfer.files[0]);
    }, [handleFile]);
    const validRows = preview.filter(r => r.valid).length;
    const invalidRows = preview.filter(r => !r.valid).length;
    const reset = () => {
        setPreview([]);
        setFileName(null);
        setImported(false);
        setError(null);
    };
    return (_jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-5", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "p-2 rounded-lg bg-[#3B82F6]/10", children: _jsx(Upload, { className: "w-5 h-5 text-[#3B82F6]" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-bold text-white", children: "Importar productos" }), _jsx("p", { className: "text-xs text-[#6B7280]", children: "Sube un archivo Excel o CSV con los productos" })] })] }), !fileName ? (_jsxs("div", { className: `
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all mb-4
            ${dragActive
                    ? 'border-[#3B82F6] bg-[#3B82F6]/5'
                    : 'border-[#2A2A2A] hover:border-[#3B82F6]/50 hover:bg-[#1A1A1A]'}
          `, onDragOver: e => { e.preventDefault(); setDragActive(true); }, onDragLeave: () => setDragActive(false), onDrop: handleDrop, onClick: () => fileRef.current?.click(), children: [loading ? (_jsxs("div", { className: "flex flex-col items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto" }), _jsx("p", { className: "text-sm text-[#6B7280]", children: "Procesando archivo..." })] })) : (_jsxs(_Fragment, { children: [_jsx(FileSpreadsheet, { className: "w-9 h-9 text-[#4B5563] mx-auto mb-3" }), _jsx("p", { className: "text-sm text-white font-medium mb-1", children: dragActive ? 'Suelta el archivo aquí' : 'Arrastra tu Excel o CSV aquí' }), _jsx("p", { className: "text-xs text-[#6B7280]", children: "o haz clic para seleccionar" }), _jsxs("div", { className: "flex items-center justify-center gap-3 mt-3", children: [_jsx("span", { className: "text-xs bg-[#1A1A1A] border border-[#2A2A2A] px-2 py-1 rounded text-[#6B7280]", children: ".xlsx" }), _jsx("span", { className: "text-xs bg-[#1A1A1A] border border-[#2A2A2A] px-2 py-1 rounded text-[#6B7280]", children: ".xls" }), _jsx("span", { className: "text-xs bg-[#1A1A1A] border border-[#2A2A2A] px-2 py-1 rounded text-[#6B7280]", children: ".csv" })] })] })), _jsx("input", { ref: fileRef, type: "file", accept: ".xlsx,.xls,.csv", className: "hidden", onChange: e => e.target.files?.[0] && handleFile(e.target.files[0]) })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "bg-[#1A1A1A] rounded-lg px-4 py-3 mb-3 flex items-center gap-3", children: [_jsx(FileSpreadsheet, { className: "w-5 h-5 text-[#3B82F6] flex-shrink-0" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm text-white font-medium truncate", children: fileName }), _jsxs("p", { className: "text-xs text-[#6B7280]", children: [preview.length, " filas detectadas"] })] }), _jsx("button", { onClick: reset, className: "p-1.5 text-[#6B7280] hover:text-white", children: _jsx(Trash2, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(CheckCircle2, { className: "w-4 h-4 text-[#00FF88]" }), _jsxs("span", { className: "text-sm text-[#00FF88] font-semibold", children: [validRows, " v\u00E1lidas"] })] }), invalidRows > 0 && (_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(XCircle, { className: "w-4 h-4 text-[#EF4444]" }), _jsxs("span", { className: "text-sm text-[#EF4444] font-semibold", children: [invalidRows, " con errores"] })] }))] }), _jsx("div", { className: "bg-[#0F0F0F] border border-[#1E1E1E] rounded-lg overflow-hidden mb-4", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-xs", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-[#1E1E1E] text-[#6B7280]", children: [_jsx("th", { className: "text-left py-2 px-3 font-medium", children: "#" }), _jsx("th", { className: "text-left py-2 px-3 font-medium", children: "SKU" }), _jsx("th", { className: "text-left py-2 px-3 font-medium", children: "Nombre" }), _jsx("th", { className: "text-left py-2 px-3 font-medium", children: "Talla" }), _jsx("th", { className: "text-left py-2 px-3 font-medium", children: "Color" }), _jsx("th", { className: "text-right py-2 px-3 font-medium", children: "Precio" }), _jsx("th", { className: "text-right py-2 px-3 font-medium", children: "Stock" }), _jsx("th", { className: "text-center py-2 px-3 font-medium", children: "Estado" })] }) }), _jsx("tbody", { children: preview.map(row => (_jsxs("tr", { className: `border-b border-[#111111] ${row.valid ? '' : 'bg-[#EF4444]/5'}`, title: row.errors.join(' · '), children: [_jsx("td", { className: "py-2 px-3 text-[#4B5563]", children: row.row }), _jsx("td", { className: "py-2 px-3 font-mono text-[#9CA3AF]", children: row.sku || '—' }), _jsx("td", { className: "py-2 px-3 text-white max-w-[160px] truncate", children: row.nombre || '—' }), _jsx("td", { className: "py-2 px-3 text-[#9CA3AF]", children: row.talla || '—' }), _jsx("td", { className: "py-2 px-3 text-[#9CA3AF]", children: row.color || '—' }), _jsx("td", { className: "py-2 px-3 text-right text-white", children: row.precio > 0 ? `₡${row.precio.toLocaleString('es-CR')}` : '—' }), _jsx("td", { className: "py-2 px-3 text-right font-semibold text-white", children: row.stock }), _jsx("td", { className: "py-2 px-3 text-center", children: row.valid
                                                        ? _jsx(CheckCircle2, { className: "w-3.5 h-3.5 text-[#00FF88] mx-auto" })
                                                        : (_jsx("span", { title: row.errors.join(', '), children: _jsx(XCircle, { className: "w-3.5 h-3.5 text-[#EF4444] mx-auto" }) })) })] }, row.row))) })] }) }) }), error && (_jsxs("p", { className: "text-xs text-[#EF4444] mb-3 flex items-center gap-1.5", children: [_jsx(AlertCircle, { className: "w-3.5 h-3.5" }), error] })), imported ? (_jsxs("div", { className: "flex items-center gap-2 justify-center py-3 text-[#00FF88]", children: [_jsx(CheckCircle2, { className: "w-5 h-5" }), _jsxs("span", { className: "text-sm font-semibold", children: ["\u00A1", validRows, " productos importados!"] })] })) : (_jsxs("button", { onClick: () => setImported(true), disabled: validRows === 0, className: "w-full py-3 rounded-xl bg-[#3B82F6] text-white font-bold text-sm hover:bg-[#2563EB] transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed", children: [_jsx(Upload, { className: "w-4 h-4" }), "Importar ", validRows, " producto", validRows !== 1 ? 's' : ''] }))] })), _jsxs("button", { onClick: downloadTemplate, className: "w-full mt-3 py-2.5 rounded-lg border border-[#2A2A2A] text-[#6B7280] hover:text-white hover:border-[#3B82F6]/40 text-xs transition-colors flex items-center justify-center gap-2", children: [_jsx(FileSpreadsheet, { className: "w-3.5 h-3.5 text-[#3B82F6]" }), "Descargar plantilla Excel (.xlsx)"] })] }));
}
// ─── Vista previa de columnas de la plantilla ─────────────────────────────────
function TemplateColumnsPreview() {
    return (_jsxs("div", { className: "bg-[#111111] border border-[#1E1E1E] rounded-xl p-5", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "p-2 rounded-lg bg-[#F59E0B]/10", children: _jsx(Table2, { className: "w-5 h-5 text-[#F59E0B]" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-bold text-white", children: "Estructura de la plantilla" }), _jsx("p", { className: "text-xs text-[#6B7280]", children: "Columnas requeridas para importar productos" })] }), _jsxs("button", { onClick: downloadTemplate, className: "ml-auto flex items-center gap-1.5 text-xs text-[#00FF88] hover:underline", children: [_jsx(FileSpreadsheet, { className: "w-3.5 h-3.5" }), "Descargar plantilla"] })] }), _jsx("div", { className: "flex flex-wrap gap-2 mb-5", children: TEMPLATE_COLUMNS.map(col => (_jsxs("div", { className: `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${col.required
                        ? 'bg-[#00FF88]/5 border-[#00FF88]/20 text-[#00FF88]'
                        : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#9CA3AF]'}`, children: [_jsx("span", { className: "font-bold", children: col.key }), col.required && (_jsx("span", { className: "text-[#00FF88]/50 text-[10px]", children: "*" }))] }, col.key))) }), _jsx("div", { className: "overflow-x-auto rounded-lg border border-[#1E1E1E]", children: _jsxs("table", { className: "w-full text-xs", children: [_jsx("thead", { children: _jsx("tr", { className: "bg-[#1A1A1A] border-b border-[#2A2A2A]", children: TEMPLATE_COLUMNS.map(col => (_jsxs("th", { className: `text-left py-2 px-3 font-semibold whitespace-nowrap ${col.required ? 'text-[#00FF88]' : 'text-[#6B7280]'}`, children: [col.key, col.required && _jsx("span", { className: "text-[#EF4444] ml-0.5", children: "*" })] }, col.key))) }) }), _jsxs("tbody", { children: [EXAMPLE_ROWS.slice(0, 3).map((row, i) => (_jsx("tr", { className: "border-b border-[#111111] hover:bg-[#111111]", children: row.map((cell, j) => (_jsx("td", { className: "py-2 px-3 text-[#9CA3AF] whitespace-nowrap", children: typeof cell === 'number' && j === 3
                                            ? `₡${cell.toLocaleString('es-CR')}`
                                            : String(cell) }, j))) }, i))), _jsx("tr", { children: _jsx("td", { colSpan: TEMPLATE_COLUMNS.length, className: "py-2 px-3 text-center text-[#4B5563] text-xs italic", children: "\u2026 contin\u00FAa con el resto de tus productos" }) })] })] }) }), _jsxs("div", { className: "mt-3 flex items-center gap-4 text-xs text-[#6B7280]", children: [_jsxs("span", { children: [_jsx("span", { className: "text-[#00FF88] font-semibold", children: "*" }), " Columna requerida"] }), _jsx("span", { children: "\u00B7 Precio y Costo en colones (\u20A1), sin decimales" }), _jsx("span", { children: "\u00B7 Stock m\u00EDnimo sugerido: 3" })] })] }));
}
// ─── Página principal ─────────────────────────────────────────────────────────
export function InventoryImportExport() {
    return (_jsxs("div", { className: "h-full overflow-y-auto bg-[#0A0A0A] p-5 space-y-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-white", children: "Importar / Exportar" }), _jsx("p", { className: "text-sm text-[#6B7280] mt-0.5", children: "Gestiona datos de inventario con Excel" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [_jsx(ExportSection, {}), _jsx(ImportSection, {})] }), _jsx(TemplateColumnsPreview, {})] }));
}
