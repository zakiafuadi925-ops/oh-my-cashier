import React, { useRef } from 'react';
import { CartItem, Customer, StoreSettings } from '../../types';
import { formatRupiah, formatDate } from '../../utils/format';
import { Printer, Share2, X, FileText, Check } from 'lucide-react';

interface PreBillModalProps {
  cart: CartItem[];
  orderType: 'Dine In' | 'Take Away' | 'Delivery' | 'Pre-Order';
  tableNumber: string;
  customer?: Customer;
  subtotal: number;
  discountNominal: number;
  discountPercent: number;
  taxAmount: number;
  taxPercent: number;
  deliveryFee?: number;
  deliveryAddress?: string;
  pickupDate?: string;
  pickupTime?: string;
  grandTotal: number;
  cashierName: string;
  settings: StoreSettings;
  onClose: () => void;
}

export const PreBillModal: React.FC<PreBillModalProps> = ({
  cart,
  orderType,
  tableNumber,
  customer,
  subtotal,
  discountNominal,
  discountPercent,
  taxAmount,
  taxPercent,
  deliveryFee = 0,
  deliveryAddress,
  pickupDate,
  pickupTime,
  grandTotal,
  cashierName,
  settings,
  onClose,
}) => {
  const billRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  const handlePrint = () => {
    window.print();
  };

  const generatePreBillText = (): string => {
    let txt = `*${settings.storeName.toUpperCase()}*\n`;
    txt += `*** TAGIHAN SEMENTARA / PROFORMA ***\n`;
    txt += `(Bukan Bukti Pembayaran Sah)\n`;
    txt += `--------------------------------\n`;
    txt += `Waktu : ${formatDate(new Date().toISOString())}\n`;
    txt += `Kasir : ${cashierName.split(' ')[0]}\n`;
    txt += `Tipe  : ${orderType} ${orderType === 'Dine In' ? `(${tableNumber})` : ''}\n`;
    if (customer) {
      txt += `Plggn : ${customer.name} (${customer.tier})\n`;
    }
    if (pickupDate) {
      txt += `Ambil : ${pickupDate} pk ${pickupTime || '-'}\n`;
    }
    if (deliveryAddress) {
      txt += `Alamat: ${deliveryAddress}\n`;
    }
    txt += `--------------------------------\n`;
    cart.forEach((item) => {
      txt += `${item.product.name} x${item.quantity}\n`;
      if (item.selectedVariants && item.selectedVariants.length > 0) {
        txt += `  (${item.selectedVariants.map((v) => v.optionName).join(', ')})\n`;
      }
      if (item.notes) {
        txt += `  * ${item.notes}\n`;
      }
      txt += `  ${formatRupiah(item.unitPrice)} = ${formatRupiah(item.totalPrice)}\n`;
    });
    txt += `--------------------------------\n`;
    txt += `Subtotal   : ${formatRupiah(subtotal)}\n`;
    if (discountNominal > 0) {
      txt += `Diskon     : -${formatRupiah(discountNominal)}\n`;
    }
    if (taxAmount > 0) {
      txt += `PPN (${taxPercent}%)  : ${formatRupiah(taxAmount)}\n`;
    }
    if (deliveryFee > 0) {
      txt += `Ongkir     : ${formatRupiah(deliveryFee)}\n`;
    }
    txt += `TOTAL BILL : ${formatRupiah(grandTotal)}\n`;
    txt += `--------------------------------\n`;
    txt += `Silakan bawa lembar tagihan ini ke kasir untuk proses pembayaran.\n`;
    txt += `Terima Kasih!\n`;
    return txt;
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generatePreBillText());
    const phone = customer?.phone?.replace(/\D/g, '') || '';
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatePreBillText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight text-slate-100">Cetak Tagihan Sementara (Pre-Bill)</h3>
              <p className="text-[11px] text-slate-400">Diserahkan ke meja tamu sebelum pembayaran</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Area Container */}
        <div className="p-4 overflow-y-auto bg-slate-950/70 flex-1 flex justify-center">
          <div
            id="thermal-receipt-print-area"
            ref={billRef}
            className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 w-full max-w-[340px] font-mono text-xs text-gray-800 leading-relaxed space-y-3"
            style={{ fontFamily: 'Courier New, Courier, monospace' }}
          >
            {/* Header */}
            <div className="text-center border-b border-dashed border-gray-300 pb-2.5 space-y-1">
              <h2 className="text-base font-black tracking-wide text-gray-900">{settings.storeName}</h2>
              <div className="bg-amber-100 text-amber-900 text-[10px] font-black py-0.5 px-2 rounded inline-block">
                *** TAGIHAN SEMENTARA / PRE-BILL ***
              </div>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest block pt-0.5">
                (Bukan Bukti Pembayaran Sah)
              </p>
            </div>

            {/* Meta */}
            <div className="text-[11px] space-y-0.5 border-b border-dashed border-gray-300 pb-2">
              <div className="flex justify-between">
                <span>Waktu Cetak</span>
                <span>{formatDate(new Date().toISOString())}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir/Server</span>
                <span>{cashierName.split(' ')[0]}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900">
                <span>Tipe / Meja</span>
                <span>
                  {orderType} {orderType === 'Dine In' ? `(${tableNumber})` : ''}
                </span>
              </div>
              {customer && (
                <div className="flex justify-between">
                  <span>Pelanggan</span>
                  <span className="font-semibold">{customer.name} ({customer.tier})</span>
                </div>
              )}
              {pickupDate && (
                <div className="flex justify-between text-amber-800 font-bold">
                  <span>Jadwal Ambil</span>
                  <span>{pickupDate} pk {pickupTime || '-'}</span>
                </div>
              )}
              {deliveryAddress && (
                <div className="text-[10px] text-gray-600 pt-0.5">
                  <span className="font-semibold">Alamat:</span> {deliveryAddress}
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="space-y-2 border-b border-dashed border-gray-300 pb-2.5">
              {cart.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span className="truncate pr-2">{item.product.name}</span>
                    <span className="shrink-0">{formatRupiah(item.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>
                      {item.quantity} x {formatRupiah(item.unitPrice)}
                    </span>
                    {item.selectedVariants && item.selectedVariants.length > 0 && (
                      <span className="italic">
                        {item.selectedVariants.map((v) => v.optionName).join(', ')}
                      </span>
                    )}
                  </div>
                  {item.notes && (
                    <div className="text-[10px] text-gray-500 italic">* {item.notes}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Subtotal & Total */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-gray-300 pb-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              {discountNominal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Diskon {discountPercent > 0 ? `(${discountPercent}%)` : ''}</span>
                  <span>-{formatRupiah(discountNominal)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>PPN ({taxPercent}%)</span>
                  <span>{formatRupiah(taxAmount)}</span>
                </div>
              )}
              {deliveryFee > 0 && (
                <div className="flex justify-between text-blue-700 font-medium">
                  <span>Ongkos Kirim</span>
                  <span>+{formatRupiah(deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black pt-1 border-t border-gray-200 text-gray-900">
                <span>TOTAL TAGIHAN</span>
                <span className="text-amber-800">{formatRupiah(grandTotal)}</span>
              </div>
            </div>

            {/* Instruction for Guest */}
            <div className="text-center text-[10px] text-gray-500 pt-1 leading-snug">
              Silakan bawa lembar tagihan ini ke kasir untuk melakukan pembayaran (Tunai, QRIS, atau Kartu).
              <br />
              <span className="font-bold text-gray-700">Terima Kasih!</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 grid grid-cols-3 gap-2">
          <button
            onClick={handlePrint}
            className="py-2.5 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Bill</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Kirim WA</span>
          </button>

          <button
            onClick={handleCopy}
            className="py-2.5 px-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <FileText className="w-4 h-4" />}
            <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
