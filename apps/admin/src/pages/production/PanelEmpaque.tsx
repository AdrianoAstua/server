import { useState } from 'react';
import {
  Package, Scan, Tag, Printer, CheckCircle, QrCode, Barcode,
  X, Clock, User, MapPin
} from 'lucide-react';

// ─── Mock Data ──────────────────────────────────────────────────────────────

interface ScannedPiece {
  id: string;
  barcode: string;
  productType: string;
  orderNumber: string;
  description: string;
}

interface PackageRecord {
  id: string;
  packageNumber: string;
  orderNumber: string;
  clientName: string;
  pieces: number;
  deliveryType: string;
  packedAt: string;
  status: 'EMPACADO' | 'LISTO_PARA_ENTREGA';
}

const mockRecentPackages: PackageRecord[] = [
  { id: '1', packageNumber: 'PKG-202604-0012', orderNumber: 'VB-202604-0008', clientName: 'DEPORTES MAX', pieces: 5, deliveryType: 'Envio', packedAt: '07 abr 2026 14:23', status: 'LISTO_PARA_ENTREGA' },
  { id: '2', packageNumber: 'PKG-202604-0011', orderNumber: 'VB-202604-0007', clientName: 'TEAM CYCLING CR', pieces: 3, deliveryType: 'Retiro en sucursal', packedAt: '07 abr 2026 13:45', status: 'EMPACADO' },
  { id: '3', packageNumber: 'PKG-202604-0010', orderNumber: 'VB-202604-0006', clientName: 'MARIA LOPEZ', pieces: 2, deliveryType: 'Tienda', packedAt: '07 abr 2026 11:30', status: 'LISTO_PARA_ENTREGA' },
  { id: '4', packageNumber: 'PKG-202604-0009', orderNumber: 'VB-202604-0005', clientName: 'CLUB NATACION HEREDIA', pieces: 8, deliveryType: 'Envio', packedAt: '07 abr 2026 10:15', status: 'LISTO_PARA_ENTREGA' },
  { id: '5', packageNumber: 'PKG-202604-0008', orderNumber: 'VB-202604-0004', clientName: 'RUNNERS SAN JOSE', pieces: 4, deliveryType: 'Retiro en sucursal', packedAt: '06 abr 2026 17:50', status: 'LISTO_PARA_ENTREGA' },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function PanelEmpaque() {
  const [scanInput, setScanInput] = useState('');
  const [scannedPieces, setScannedPieces] = useState<ScannedPiece[]>([
    { id: '1', barcode: 'VB-L-001-CYC-BLK', productType: 'Jersey Ciclismo', orderNumber: 'VB-202604-0001', description: 'Jersey Pro Fit - Negro - Talla M' },
    { id: '2', barcode: 'VB-L-002-CYC-BLK', productType: 'Culotte Ciclismo', orderNumber: 'VB-202604-0001', description: 'Culotte Bib Pro - Negro - Talla M' },
  ]);
  const [showLabel, setShowLabel] = useState(false);
  const [packed, setPacked] = useState(false);

  const currentOrder = 'VB-202604-0001';
  const currentClient = 'COOPERSAIN';
  const deliveryType = 'Retiro en sucursal';

  const handleScan = () => {
    if (!scanInput.trim()) return;
    const newPiece: ScannedPiece = {
      id: String(scannedPieces.length + 1),
      barcode: scanInput.trim(),
      productType: 'Medias Ciclismo',
      orderNumber: currentOrder,
      description: `Medias Pro Compress - Negro - Talla L`,
    };
    setScannedPieces([...scannedPieces, newPiece]);
    setScanInput('');
  };

  const removePiece = (id: string) => {
    setScannedPieces(scannedPieces.filter(p => p.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleScan();
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0A0A0A] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#00FF88]/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-[#00FF88]" />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">Panel de Empaque</h1>
            <p className="text-[#6B7280] text-sm">Escanea piezas aprobadas y genera etiquetas</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#6B7280]">
          <Clock className="w-4 h-4" />
          <span>7 abril 2026 — 15:30</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Scanner + Pieces */}
        <div className="space-y-4">
          {/* Scan Input */}
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
            <label className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider mb-2 block">
              Escanear pieza aprobada para empacar
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <input
                  type="text"
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escanear o escribir codigo de barras..."
                  className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder-[#4B5563] focus:outline-none focus:border-[#00FF88]/50 focus:ring-1 focus:ring-[#00FF88]/20"
                  autoFocus
                />
              </div>
              <button
                onClick={handleScan}
                className="px-4 py-2.5 bg-[#00FF88]/10 text-[#00FF88] rounded-lg text-sm font-medium hover:bg-[#00FF88]/20 transition-colors border border-[#00FF88]/20"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Current Package */}
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Paquete en Armado</h3>
              <span className="text-xs bg-[#00FF88]/10 text-[#00FF88] px-2 py-0.5 rounded-full border border-[#00FF88]/20">
                {scannedPieces.length} piezas
              </span>
            </div>

            <div className="mb-3 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#6B7280]" />
                <span className="text-white font-mono">{currentOrder}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#6B7280]" />
                <span className="text-[#9CA3AF]">{currentClient}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#6B7280]" />
                <span className="text-[#9CA3AF]">{deliveryType}</span>
              </div>
            </div>

            {scannedPieces.length === 0 ? (
              <div className="text-center py-8 text-[#4B5563] text-sm">
                Escanea una pieza para comenzar el paquete
              </div>
            ) : (
              <div className="space-y-2">
                {scannedPieces.map((piece, idx) => (
                  <div
                    key={piece.id}
                    className="flex items-center gap-3 bg-[#0A0A0A] rounded-lg p-3 border border-[#1E1E1E]"
                  >
                    <span className="text-[#4B5563] text-xs font-mono w-5">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{piece.description}</p>
                      <p className="text-[#6B7280] text-xs font-mono">{piece.barcode}</p>
                    </div>
                    <button
                      onClick={() => removePiece(piece.id)}
                      className="text-[#4B5563] hover:text-red-400 transition-colors p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowLabel(true)}
                disabled={scannedPieces.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#222222] transition-colors border border-[#2A2A2A] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Tag className="w-4 h-4" />
                Generar Etiqueta de Paquete
              </button>
              <button
                onClick={() => setPacked(true)}
                disabled={scannedPieces.length === 0 || !showLabel}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00FF88]/10 text-[#00FF88] rounded-lg text-sm font-medium hover:bg-[#00FF88]/20 transition-colors border border-[#00FF88]/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                Marcar como Empacado
              </button>
            </div>

            {packed && (
              <div className="mt-3 p-3 bg-[#00FF88]/5 border border-[#00FF88]/20 rounded-lg text-center">
                <CheckCircle className="w-5 h-5 text-[#00FF88] mx-auto mb-1" />
                <p className="text-[#00FF88] text-sm font-medium">Paquete marcado como EMPACADO</p>
                <p className="text-[#6B7280] text-xs mt-0.5">Orden movida a siguiente etapa</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Label Preview + Recent */}
        <div className="space-y-4">
          {/* Label Preview */}
          {showLabel && (
            <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-sm">Vista Previa de Etiqueta</h3>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] text-[#9CA3AF] rounded-lg text-xs font-medium hover:text-white hover:bg-[#222222] transition-colors border border-[#2A2A2A]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir
                </button>
              </div>

              {/* Label Card */}
              <div className="bg-white rounded-xl p-6 text-black mx-auto max-w-sm">
                <div className="text-center space-y-3">
                  {/* Brand */}
                  <p className="text-lg font-bold tracking-[0.3em] text-black">V O N E B</p>

                  <div className="border-t border-gray-200 pt-3">
                    {/* Order number */}
                    <p className="text-2xl font-bold font-mono text-black">{currentOrder}</p>
                    {/* Client */}
                    <p className="text-base font-semibold text-gray-700 mt-1">{currentClient}</p>
                  </div>

                  <div className="border-t border-gray-200 pt-3 space-y-1">
                    <p className="text-sm text-gray-600">{scannedPieces.length} piezas</p>
                    <p className="text-sm text-gray-600">{deliveryType}</p>
                  </div>

                  {/* QR + Barcode placeholder */}
                  <div className="border-t border-gray-200 pt-3 flex items-center justify-center gap-6">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-16 h-16 border-2 border-gray-300 rounded-lg flex items-center justify-center">
                        <QrCode className="w-10 h-10 text-gray-400" />
                      </div>
                      <span className="text-[10px] text-gray-400">QR</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-24 h-16 border-2 border-gray-300 rounded-lg flex items-center justify-center">
                        <Barcode className="w-16 h-10 text-gray-400" />
                      </div>
                      <span className="text-[10px] text-gray-400">BARCODE</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 pt-2 border-t border-gray-200">7 abril 2026</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Packages */}
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
            <h3 className="text-white font-semibold text-sm mb-3">Paquetes Recientes</h3>
            <div className="space-y-2">
              {mockRecentPackages.map(pkg => (
                <div
                  key={pkg.id}
                  className="flex items-center gap-3 bg-[#0A0A0A] rounded-lg p-3 border border-[#1E1E1E]"
                >
                  <Package className="w-4 h-4 text-[#4B5563] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-mono">{pkg.packageNumber}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        pkg.status === 'LISTO_PARA_ENTREGA'
                          ? 'bg-[#00FF88]/10 text-[#00FF88]'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {pkg.status === 'LISTO_PARA_ENTREGA' ? 'Listo' : 'Empacado'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#6B7280] mt-0.5">
                      <span>{pkg.clientName}</span>
                      <span>·</span>
                      <span>{pkg.pieces} piezas</span>
                      <span>·</span>
                      <span>{pkg.deliveryType}</span>
                    </div>
                  </div>
                  <span className="text-[#4B5563] text-xs whitespace-nowrap">{pkg.packedAt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
