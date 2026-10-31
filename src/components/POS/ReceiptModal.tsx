import React, { useRef, useState } from 'react';
import { Order, StoreSettings } from '../../types';
import { formatRupiah, formatDate } from '../../utils/format';
import { Printer, Share2, Check, X, PlusCircle, Copy, ChefHat, Tag } from 'lucide-react';
import { KitchenTicketModal } from '../Kitchen/KitchenTicketModal';
import { CupLabelModal } from '../Kitchen/CupLabelModal';

interface ReceiptModalProps {
  order: Order;
  settings: StoreSettings;
  onClose: () => void;
  onNewOrder: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  settings,
  onClose,
  onNewOrder,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [showKOT, setShowKOT] = useState(false);
  const [showCupLabel, setShowCupLabel] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const generateReceiptText = (): string => {
    let txt = `*${settings.storeName.toUpperCase()}*\n`;
    txt += `${settings.branchName}\n`;
    txt += `${settings.address}\n`;
    txt += `Telp/WA: ${settings.phone}\n`;
    txt += `--------------------------------\n`;
    txt += `No. Transaksi: ${order.orderNumber}\n`;
    txt += `Waktu : ${formatDate(order.createdAt)}\n`;
    txt += `Kasir : ${order.cashierName}\n`;
    txt += `Tipe  : ${order.orderType} ${order.tableNumber ? `(${order.tableNumber})` : ''}\n`;
    if (order.customer) {
      txt += `Plggn : ${order.customer.name} (${order.customer.tier})\n`;
    }
    if (order.pickupDate) {
      txt += `Ambil : ${order.pickupDate} pk ${order.pickupTime || '-'}\n`;
    }
    if (order.deliveryAddress) {
      txt += `Alamat: ${order.deliveryAddress}\n`;
    }
    txt += `--------------------------------\n`;
    order.items.forEach((item) => {
      txt += `${item.product.name} x${item.quantity}\n`;
      if (item.selectedVariants && item.selectedVariants.length > 0) {
        txt += `  (${item.selectedVariants.map((v) => v.optionName).join(', ')})\n`;
      }
      if (item.notes) {
        txt += `  Catatan: ${item.notes}\n`;
      }
      txt += `  ${formatRupiah(item.unitPrice)} = ${formatRupiah(item.totalPrice)}\n`;
    });
    txt += `--------------------------------\n`;
    txt += `Subtotal  : ${formatRupiah(order.subtotal)}\n`;
    if (order.discountNominal > 0) {
      txt += `Diskon    : -${formatRupiah(order.discountNominal)}\n`;
    }
    if (order.taxAmount > 0) {
      txt += `PPN (${order.taxPercent}%) : ${formatRupiah(order.taxAmount)}\n`;
    }
    if (order.deliveryFee && order.deliveryFee > 0) {
      txt += `Ongkir    : ${formatRupiah(order.deliveryFee)}\n`;
    }
    txt += `TOTAL     : ${formatRupiah(order.total)}\n`;
    txt += `Bayar (${order.paymentMethod}) : ${formatRupiah(order.amountPaid)}\n`;
    if (order.paymentMethod === 'Tunai') {
      txt += `Kembali   : ${formatRupiah(order.changeAmount)}\n`;
    }
    txt += `--------------------------------\n`;
    txt += `${settings.receiptFooter}\n`;
    return txt;
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateReceiptText());
    const phone = order.customer?.phone?.replace(/\D/g, '') || '';
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateReceiptText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header toolbar */}
        <div className="p-3.5 border-b border-gray-100 flex items-center justify-between bg-emerald-700 text-white">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-200" />
            <h3 className="font-bold text-base">Struk Pembayaran</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Thermal Receipt Container */}
        <div className="p-4 overflow-y-auto bg-gray-100 flex-1 flex justify-center">
          <div
            id="thermal-receipt-print-area"
            ref={receiptRef}
            className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 w-full max-w-[340px] font-mono text-xs text-gray-800 leading-relaxed space-y-3"
            style={{ fontFamily: 'Courier New, Courier, monospace' }}
          >
            {/* Store Header */}
            <div className="text-center border-b border-dashed border-gray-300 pb-3 space-y-1">
              <h2 className="text-base font-black tracking-wide text-gray-900">{settings.storeName}</h2>
              <p className="text-[11px] text-gray-600">{settings.branchName}</p>
              <p className="text-[10px] text-gray-500 leading-tight">{settings.address}</p>
              <p className="text-[10px] text-gray-500">Telp: {settings.phone}</p>
            </div>

            {/* Meta Info */}
            <div className="text-[11px] space-y-0.5 border-b border-dashed border-gray-300 pb-2.5">
              <div className="flex justify-between">
                <span>No. Transaksi</span>
                <span className="font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir</span>
                <span>{order.cashierName.split(' ')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span>Tipe Order</span>
                <span className="font-semibold">{order.orderType} {order.tableNumber ? `(${order.tableNumber})` : ''}</span>
              </div>
              {order.customer && (
                <div className="flex justify-between">
                  <span>Pelanggan</span>
                  <span className="font-semibold">{order.customer.name} ({order.customer.tier})</span>
                </div>
              )}
              {order.pickupDate && (
                <div className="flex justify-between text-amber-800 font-bold">
                  <span>Jadwal Ambil</span>
                  <span>{order.pickupDate} pk {order.pickupTime || '-'}</span>
                </div>
              )}
              {order.deliveryAddress && (
                <div className="text-[10px] text-gray-600 pt-0.5">
                  <span className="font-semibold">Alamat:</span> {order.deliveryAddress}
                </div>
              )}
            </div>

            {/* Items list */}
            <div className="space-y-2 border-b border-dashed border-gray-300 pb-3">
              {order.items.map((item, idx) => (
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
                    <div className="text-[10px] text-gray-500 italic">
                      * {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-gray-300 pb-2.5">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatRupiah(order.subtotal)}</span>
              </div>
              {order.discountNominal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Diskon {order.discountPercent > 0 ? `(${order.discountPercent}%)` : ''}</span>
                  <span>-{formatRupiah(order.discountNominal)}</span>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>PPN ({order.taxPercent}%)</span>
                  <span>{formatRupiah(order.taxAmount)}</span>
                </div>
              )}
              {order.deliveryFee && order.deliveryFee > 0 && (
                <div className="flex justify-between text-blue-700">
                  <span>Ongkos Kirim</span>
                  <span>{formatRupiah(order.deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black pt-1 border-t border-gray-200">
                <span>TOTAL</span>
                <span>{formatRupiah(order.total)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-gray-300 pb-2.5">
              <div className="flex justify-between">
                <span>Metode Pembayaran</span>
                <span className="font-bold">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Bayar</span>
                <span>{formatRupiah(order.amountPaid)}</span>
              </div>
              {order.paymentMethod === 'Tunai' && (
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Kembali</span>
                  <span>{formatRupiah(order.changeAmount)}</span>
                </div>
              )}
            </div>

            {/* Footer Notice */}
            <div className="text-center text-[10px] text-gray-500 pt-1 whitespace-pre-line leading-tight">
              {settings.receiptFooter}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 bg-white border-t border-gray-200 space-y-2">
          {/* Quick Kitchen & Cup Label Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowKOT(true)}
              className="py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <ChefHat className="w-3.5 h-3.5 text-amber-700" />
              <span>Cetak KOT Dapur</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCupLabel(true)}
              className="py-2 px-3 bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-900 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Tag className="w-3.5 h-3.5 text-sky-700" />
              <span>Label Stiker Cup</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="py-2.5 px-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Kirim WhatsApp</span>
            </button>

            <button
              onClick={handleCopyText}
              className="py-2.5 px-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>

            <button
              onClick={onNewOrder}
              className="py-2.5 px-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Pesanan Baru</span>
            </button>
          </div>
        </div>
      </div>

      {showKOT && (
        <KitchenTicketModal
          orderNumber={order.orderNumber}
          createdAt={order.createdAt}
          cart={order.items}
          orderType={order.orderType}
          tableNumber={order.tableNumber}
          customer={order.customer}
          cashierName={order.cashierName}
          kitchenNotes={order.kitchenNotes || order.notes}
          settings={settings}
          onClose={() => setShowKOT(false)}
        />
      )}

      {showCupLabel && (
        <CupLabelModal
          orderNumber={order.orderNumber}
          createdAt={order.createdAt}
          cart={order.items}
          orderType={order.orderType}
          tableNumber={order.tableNumber}
          customerName={order.customer?.name}
          settings={settings}
          onClose={() => setShowCupLabel(false)}
        />
      )}
    </div>
  );
};
