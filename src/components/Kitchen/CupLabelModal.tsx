import React, { useState } from 'react';
import { CartItem, StoreSettings } from '../../types';
import { formatDate } from '../../utils/format';
import { Tag, Printer, X, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';

interface CupLabelModalProps {
  orderNumber: string;
  createdAt: string;
  cart: CartItem[];
  orderType: string;
  tableNumber?: string;
  customerName?: string;
  settings: StoreSettings;
  onClose: () => void;
}

interface CupInstance {
  id: string;
  productName: string;
  cupIndex: number;
  totalCups: number;
  variantsText: string;
  notes?: string;
  tableNumber: string;
  orderNumber: string;
  time: string;
}

export const CupLabelModal: React.FC<CupLabelModalProps> = ({
  orderNumber,
  createdAt,
  cart,
  orderType,
  tableNumber = '-',
  customerName,
  settings,
  onClose,
}) => {
  const [activeLabelIndex, setActiveLabelIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Generate individual cup instances for drinks
  const drinkItems = cart.filter((item) => {
    const isDrink = item.product.category.toLowerCase().includes('minuman') ||
                    item.product.category.toLowerCase().includes('kopi') ||
                    item.product.category.toLowerCase().includes('tea') ||
                    item.product.unit.toLowerCase() === 'cup' ||
                    item.product.unit.toLowerCase() === 'botol';
    return isDrink;
  });

  const cupInstances: CupInstance[] = [];
  drinkItems.forEach((item) => {
    const variantsText = (item.selectedVariants || [])
      .map((v) => `${v.groupName}: ${v.optionName}`)
      .join(' • ');

    for (let i = 1; i <= item.quantity; i++) {
      cupInstances.push({
        id: `${item.cartItemId}-cup-${i}`,
        productName: item.product.name,
        cupIndex: i,
        totalCups: item.quantity,
        variantsText: variantsText || 'Standar',
        notes: item.notes,
        tableNumber: orderType === 'Dine In' ? tableNumber : orderType,
        orderNumber,
        time: formatDate(createdAt).split(' ')[1] || '12:00',
      });
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const currentLabel = cupInstances[activeLabelIndex];

  const handleCopy = () => {
    if (!currentLabel) return;
    const txt = `[LABEL CUP ${activeLabelIndex + 1}/${cupInstances.length}]\n${settings.storeName}\n${currentLabel.productName}\n${currentLabel.variantsText}\n${currentLabel.notes ? `* ${currentLabel.notes} *\n` : ''}${currentLabel.tableNumber} | ${currentLabel.orderNumber} | ${currentLabel.time}`;
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-sky-600 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-700 flex items-center justify-center shadow-inner">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">Cetak Label Stiker Cup (TSPL)</h3>
              <p className="text-[11px] text-sky-100 font-medium">
                Ukuran Standar Label Cup 40x30mm / 50x30mm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-sky-100 hover:text-white hover:bg-sky-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col items-center justify-center">
          {cupInstances.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <Tag className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="font-bold text-sm text-gray-700">Tidak Ada Item Minuman</p>
              <p className="text-xs text-gray-400 mt-1">
                Pesanan ini tidak memiliki menu berlabel cup/minuman untuk dicetak.
              </p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center space-y-4">
              {/* Pagination bar */}
              <div className="flex items-center justify-between w-full max-w-[320px] px-1 text-xs">
                <span className="font-semibold text-gray-600">
                  Label Cup: <b>{activeLabelIndex + 1}</b> dari <b>{cupInstances.length}</b>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={activeLabelIndex === 0}
                    onClick={() => setActiveLabelIndex((p) => Math.max(0, p - 1))}
                    className="p-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={activeLabelIndex === cupInstances.length - 1}
                    onClick={() => setActiveLabelIndex((p) => Math.min(cupInstances.length - 1, p + 1))}
                    className="p-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Physical Cup Label Simulation (40x30mm / 50x30mm) */}
              <div
                id="cuplabel-printable-area"
                className="w-full max-w-[320px] aspect-[4/3] bg-white border-2 border-dashed border-gray-400 p-4 rounded-xl shadow-md flex flex-col justify-between font-mono text-xs select-all text-gray-900 leading-tight print:shadow-none print:border-none print:aspect-auto print:max-w-none print:p-0"
              >
                <style>
                  {`
                    @media print {
                      body * {
                        visibility: hidden;
                      }
                      #cuplabel-printable-area, #cuplabel-printable-area * {
                        visibility: visible;
                      }
                      #cuplabel-printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 50mm;
                        height: 30mm;
                        font-size: 10px;
                        line-height: 1.15;
                        color: #000;
                        background: #fff;
                        padding: 1.5mm;
                        margin: 0;
                      }
                    }
                  `}
                </style>

                {/* Top: Store Name & Order */}
                <div className="flex items-center justify-between border-b border-gray-400 pb-1 text-[10px]">
                  <span className="font-black truncate uppercase">{settings.storeName}</span>
                  <span className="font-bold text-gray-600 shrink-0">
                    {currentLabel.orderNumber} ({activeLabelIndex + 1}/{cupInstances.length})
                  </span>
                </div>

                {/* Middle: Product Name & Variants */}
                <div className="my-1.5 flex-1 flex flex-col justify-center">
                  <div className="text-sm font-black uppercase text-gray-950 leading-tight">
                    {currentLabel.productName}
                  </div>
                  <div className="text-[11px] font-bold text-gray-800 mt-1 bg-gray-100 px-1 py-0.5 rounded border border-gray-300">
                    {currentLabel.variantsText}
                  </div>
                  {currentLabel.notes && (
                    <div className="text-[10px] font-black text-amber-800 mt-0.5">
                      * {currentLabel.notes}
                    </div>
                  )}
                </div>

                {/* Bottom: Table, Customer, Time */}
                <div className="border-t border-gray-400 pt-1 flex items-center justify-between text-[10px] font-bold">
                  <span className="bg-black text-white px-1.5 py-0.2 rounded font-black uppercase">
                    {currentLabel.tableNumber}
                  </span>
                  {customerName && <span className="truncate max-w-[90px]">{customerName}</span>}
                  <span className="text-gray-600">{currentLabel.time} WIB</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 text-center">
                Kompatibel dengan printer label thermal (Zijiang, Xprinter, Panda, Bluetooth Barcode Printer).
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between gap-2">
          <button
            onClick={handleCopy}
            disabled={cupInstances.length === 0}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tersalin' : 'Salin Data'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-semibold transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              disabled={cupInstances.length === 0}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-40"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Label Stiker</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
