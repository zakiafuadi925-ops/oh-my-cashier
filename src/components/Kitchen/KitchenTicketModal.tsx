import React, { useRef, useState } from 'react';
import { CartItem, Customer, StoreSettings } from '../../types';
import { formatDate } from '../../utils/format';
import { Printer, Share2, X, ChefHat, Check, Copy } from 'lucide-react';

interface KitchenTicketModalProps {
  orderNumber: string;
  createdAt: string;
  cart: CartItem[];
  orderType: 'Dine In' | 'Take Away' | 'Delivery' | 'Pre-Order';
  tableNumber?: string;
  customer?: Customer;
  cashierName: string;
  kitchenNotes?: string;
  settings: StoreSettings;
  stationFilter?: 'Semua' | 'Dapur' | 'Barista';
  onClose: () => void;
}

export const KitchenTicketModal: React.FC<KitchenTicketModalProps> = ({
  orderNumber,
  createdAt,
  cart,
  orderType,
  tableNumber = '-',
  customer,
  cashierName,
  kitchenNotes,
  settings,
  stationFilter = 'Semua',
  onClose,
}) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [activeStation, setActiveStation] = useState<'Semua' | 'Dapur' | 'Barista'>(stationFilter);

  // Filter items based on station:
  // 'Barista' = Kopi & Minuman
  // 'Dapur' = Makanan Utama, Camilan & Snack, Dessert & Bakery, etc.
  const filteredItems = cart.filter((item) => {
    const isDrink = item.product.category.toLowerCase().includes('minuman') ||
                    item.product.category.toLowerCase().includes('kopi') ||
                    item.product.category.toLowerCase().includes('tea') ||
                    item.product.category.toLowerCase().includes('drink');
    if (activeStation === 'Barista') return isDrink;
    if (activeStation === 'Dapur') return !isDrink;
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const generateKOTText = (): string => {
    let txt = `================================\n`;
    txt += `*** TIKET DAPUR (KOT) ***\n`;
    txt += `${settings.storeName.toUpperCase()}\n`;
    txt += `Stasiun: ${activeStation.toUpperCase()}\n`;
    txt += `================================\n`;
    txt += `Nomor Tiket : ${orderNumber}\n`;
    txt += `Waktu Masuk : ${formatDate(createdAt)}\n`;
    txt += `Tipe Order  : ${orderType} ${orderType === 'Dine In' ? `[${tableNumber}]` : ''}\n`;
    txt += `Kasir       : ${cashierName.split(' ')[0]}\n`;
    if (customer) {
      txt += `Tamu        : ${customer.name}\n`;
    }
    txt += `--------------------------------\n`;
    filteredItems.forEach((item) => {
      txt += `[ ${item.quantity}x ] ${item.product.name.toUpperCase()}\n`;
      if (item.selectedVariants && item.selectedVariants.length > 0) {
        txt += `  * Varian: ${item.selectedVariants.map((v) => `${v.groupName}: ${v.optionName}`).join(', ')}\n`;
      }
      if (item.notes) {
        txt += `  ! Catatan: ${item.notes}\n`;
      }
      txt += `\n`;
    });
    if (kitchenNotes) {
      txt += `--------------------------------\n`;
      txt += `CATATAN ORDER: ${kitchenNotes}\n`;
    }
    txt += `================================\n`;
    txt += `OH MY CASHIER - KITCHEN SYSTEM\n`;
    return txt;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateKOTText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateKOTText());
    const link = document.createElement('a');
    link.href = `https://wa.me/?text=${text}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-800 text-slate-100">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide text-slate-100">Cetak Tiket Dapur (KOT)</h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Kitchen Order Ticket • Standar Printer Thermal 58/80mm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Station Tabs */}
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Stasiun:
          </span>
          <div className="flex items-center gap-1.5 flex-1">
            {(['Semua', 'Dapur', 'Barista'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setActiveStation(st)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeStation === st
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-slate-900 text-slate-300 border border-slate-700 hover:bg-slate-800'
                }`}
              >
                {st === 'Semua' && 'Semua Menu'}
                {st === 'Dapur' && '🍳 Dapur (Makanan)'}
                {st === 'Barista' && '☕ Barista (Minuman)'}
              </button>
            ))}
          </div>
        </div>

        {/* Thermal KOT Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950/70 flex justify-center">
          <div
            ref={ticketRef}
            className="w-full max-w-[340px] bg-white p-5 rounded-xl border border-gray-300 shadow-sm font-mono text-xs text-gray-900 select-all leading-tight print:shadow-none print:border-none print:w-full print:p-0 print:max-w-none"
            id="kot-printable-area"
          >
            {/* Thermal Print CSS */}
            <style>
              {`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #kot-printable-area, #kot-printable-area * {
                    visibility: visible;
                  }
                  #kot-printable-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: ${settings.paperWidth === '80mm' ? '72mm' : '48mm'};
                    font-size: 11px;
                    line-height: 1.25;
                    color: #000;
                    background: #fff;
                    padding: 0;
                    margin: 0;
                  }
                }
              `}
            </style>

            {/* KOT Header */}
            <div className="text-center border-b-2 border-dashed border-gray-800 pb-3 mb-3">
              <span className="inline-block px-2.5 py-0.5 bg-black text-white font-black text-sm tracking-widest rounded mb-1">
                TIKET DAPUR (KOT)
              </span>
              <h2 className="text-base font-black tracking-wider uppercase">
                {settings.storeName}
              </h2>
              <div className="text-[11px] font-bold text-gray-700 mt-1">
                STASIUN: [{activeStation.toUpperCase()}]
              </div>
            </div>

            {/* Big Table / Takeaway Highlight */}
            <div className="bg-gray-100 border border-gray-800 p-2 text-center rounded mb-3">
              <div className="text-[10px] uppercase font-bold text-gray-600">LOKASI / MEJA</div>
              <div className="text-xl font-black text-gray-950 tracking-wide">
                {orderType === 'Dine In' ? tableNumber.toUpperCase() : orderType.toUpperCase()}
              </div>
              <div className="text-[11px] font-bold text-gray-700 mt-0.5">
                Nomor Order: <span className="underline font-black">{orderNumber}</span>
              </div>
            </div>

            {/* Order Info */}
            <div className="border-b border-dashed border-gray-400 pb-2 mb-3 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Waktu Masuk:</span>
                <span className="font-bold">{formatDate(createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Kasir:</span>
                <span className="font-bold">{cashierName.split(' ')[0]}</span>
              </div>
              {customer && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tamu:</span>
                  <span className="font-bold">{customer.name}</span>
                </div>
              )}
            </div>

            {/* Items to Cook / Brew */}
            <div className="border-b-2 border-dashed border-gray-800 pb-3 mb-3 space-y-3">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                DAFTAR ITEM YANG HARUS DISIAPKAN:
              </div>

              {filteredItems.length === 0 ? (
                <div className="p-3 text-center text-gray-400 italic text-[11px]">
                  Tidak ada item untuk stasiun {activeStation}.
                </div>
              ) : (
                filteredItems.map((item, idx) => (
                  <div key={item.cartItemId || idx} className="border-b border-gray-200 pb-2 last:border-b-0">
                    <div className="flex items-start gap-2">
                      <span className="text-base font-black px-1.5 py-0.5 bg-gray-900 text-white rounded shrink-0">
                        {item.quantity}x
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black uppercase text-gray-950 leading-snug">
                          {item.product.name}
                        </div>

                        {/* Variants */}
                        {item.selectedVariants && item.selectedVariants.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.selectedVariants.map((v, vIdx) => (
                              <span
                                key={vIdx}
                                className="text-[10px] font-bold px-1.5 py-0.2 bg-gray-200 text-gray-800 rounded border border-gray-300"
                              >
                                {v.groupName}: {v.optionName}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Item Notes */}
                        {item.notes && (
                          <div className="mt-1 text-[11px] font-black text-amber-800 bg-amber-50 p-1 rounded border border-amber-300">
                            * {item.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Special Kitchen Notes */}
            {kitchenNotes && (
              <div className="border border-red-500 bg-red-50 p-2 rounded mb-3 text-[11px]">
                <div className="font-bold text-red-800 uppercase text-[10px]">
                  ⚠️ PERHATIAN KHUSUS DAPUR:
                </div>
                <div className="font-black text-red-950 mt-0.5">{kitchenNotes}</div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-[10px] text-gray-500 pt-1">
              <span>*** SELESAIKAN DENGAN HIGIENIS & TEPAT WAKTU ***</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Kirim WA Dapur</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-950/20 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Tiket Dapur (KOT)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
