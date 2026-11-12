import React, { useState } from 'react';
import { Order, StoreSettings } from '../../types';
import { formatRupiah, formatDate } from '../../utils/format';
import { ReceiptModal } from '../POS/ReceiptModal';
import { SupervisorPinModal } from '../Auth/SupervisorPinModal';
import {
  Search,
  Receipt,
  FileSpreadsheet,
  Ban,
  Printer,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Check,
} from 'lucide-react';

interface TransactionHistoryProps {
  orders: Order[];
  settings: StoreSettings;
  onCancelOrder: (orderId: string) => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: 'Selesai' | 'Siap Diambil' | 'Diproses') => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  orders,
  settings,
  onCancelOrder,
  onUpdateOrderStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Selesai' | 'Pre-Order' | 'Dibatalkan'>('Semua');
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null);

  // Supervisor PIN modal state for voiding transaction
  const [orderToVoid, setOrderToVoid] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      o.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.pickupDate?.includes(searchQuery) ?? false);

    if (statusFilter === 'Semua') return matchesSearch;
    if (statusFilter === 'Pre-Order') return matchesSearch && (o.orderType === 'Pre-Order' || !!o.pickupDate);
    return matchesSearch && o.status === statusFilter;
  });

  const handleExportCSV = () => {
    let csv = 'No. Transaksi,Waktu,Pelanggan,Tipe,Metode,Subtotal,Diskon,PPN,Total,Status\n';
    orders.forEach((o) => {
      csv += `"${o.orderNumber}","${formatDate(o.createdAt)}","${o.customer?.name || 'Umum'}","${o.orderType}","${o.paymentMethod}",${o.subtotal},${o.discountNominal},${o.taxAmount},${o.total},"${o.status}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OhMyCashier_Riwayat_Transaksi_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top action bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <span>Riwayat Transaksi & Struk</span>
          </h2>
          <p className="text-xs text-slate-400">
            Daftar seluruh pesanan penjualan, cetak ulang struk, dan pembatalan pesanan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-emerald-400 hover:bg-slate-800 border border-emerald-700/60 rounded-xl text-xs font-bold transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Ekspor Excel/CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor order #0001, pelanggan, metode..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-slate-900 text-slate-100 placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl text-xs font-semibold border border-slate-800">
          {(['Semua', 'Selesai', 'Pre-Order', 'Dibatalkan'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === status
                  ? 'bg-orange-500 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders View: Mobile Cards (< 640px) vs Data Table (>= 640px) */}
      <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
        {/* Mobile View (< 640px): 1-Column Thumb-Friendly Cards */}
        <div className="block sm:hidden space-y-3 pb-6">
          {filteredOrders.length === 0 ? (
            <div className="bg-slate-800/60 p-8 rounded-2xl text-center text-slate-400 border border-slate-700">
              Tidak ada transaksi ditemukan.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isCancelled = order.status === 'Dibatalkan';
              return (
                <div
                  key={order.id}
                  className={`bg-slate-800 rounded-2xl border p-4 shadow-sm space-y-3 ${
                    isCancelled ? 'border-rose-900/60 bg-rose-950/20' : 'border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {order.orderNumber}
                      </span>
                      <p className="text-[11px] text-slate-400">{formatDate(order.createdAt)}</p>
                    </div>
                    <div>
                      {isCancelled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-950/80 border border-rose-800/60 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3 text-rose-400" />
                          Dibatalkan
                        </span>
                      ) : order.status === 'Diproses' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3 text-amber-400" />
                          Diproses
                        </span>
                      ) : order.status === 'Siap Diambil' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3 text-cyan-400" />
                          Siap Diambil
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Selesai
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pelanggan:</span>
                      <span className="font-semibold text-slate-200">
                        {order.customer ? order.customer.name : 'Umum'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tipe Pesanan:</span>
                      <span className="font-semibold text-slate-200">
                        {order.orderType}
                        {order.tableNumber ? ` (${order.tableNumber})` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Metode Bayar:</span>
                      <span className="font-semibold text-slate-200">{order.paymentMethod}</span>
                    </div>
                    <div className="pt-1 border-t border-slate-750">
                      <span className="text-slate-400 block mb-0.5">Item:</span>
                      <p className="text-slate-200 font-medium">
                        {order.items.map((i) => `${i.product.name} x${i.quantity}`).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Transaksi</span>
                      <span className="font-mono font-black text-base text-orange-400 tabular-nums">
                        {formatRupiah(order.total)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForReceipt(order)}
                        className="min-h-[44px] px-3 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-700/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
                      >
                        <Printer className="w-4 h-4 text-emerald-400" />
                        <span>Cetak Struk</span>
                      </button>

                      {!isCancelled && (
                        <button
                          type="button"
                          onClick={() => setOrderToVoid(order)}
                          className="min-h-[44px] px-3 bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-700/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
                          title="Batalkan Pesanan (Perlu PIN)"
                        >
                          <Ban className="w-4 h-4 text-rose-400" />
                          <span>Batal</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tablet & Desktop View (>= 640px): Full Detailed Table */}
        <div className="hidden sm:block bg-slate-800 rounded-2xl shadow-sm border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">No. Transaksi</th>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Pelanggan</th>
                  <th className="px-4 py-3">Tipe & Jadwal</th>
                  <th className="px-4 py-3">Item Pesanan</th>
                  <th className="px-4 py-3">Metode</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Tidak ada transaksi ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isCancelled = order.status === 'Dibatalkan';
                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-slate-700/40 transition-colors ${
                          isCancelled ? 'bg-rose-950/20' : ''
                        }`}
                      >
                        <td className="px-4 py-3.5 font-bold font-mono text-emerald-400">
                          {order.orderNumber}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-400">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-3.5">
                          {order.customer ? (
                            <div>
                              <span className="font-semibold text-slate-200 block">
                                {order.customer.name}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-medium">
                                {order.customer.tier}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Umum</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-medium text-slate-200">
                            {order.orderType}
                            {order.tableNumber ? ` (${order.tableNumber})` : ''}
                          </span>
                          {order.isSplitBill && (
                            <span className="block text-[10px] text-purple-300 font-bold mt-0.5">
                              Pisah Tagihan {order.splitBillPart ? `• ${order.splitBillPart}` : ''}
                            </span>
                          )}
                          {order.splitPayments && order.splitPayments.length > 0 && (
                            <span className="block text-[10px] text-emerald-400 font-mono mt-0.5">
                              {order.splitPayments.filter((p) => p.isPaid).length}/{order.splitPayments.length} Orang Lunas
                            </span>
                          )}
                          {order.pickupDate && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded mt-1">
                              <Calendar className="w-3 h-3 text-amber-400" />
                              <span>Ambil: {order.pickupDate} {order.pickupTime || ''}</span>
                            </div>
                          )}
                          {order.deliveryAddress && (
                            <div className="flex items-center gap-1 text-[10px] font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded mt-1 truncate max-w-[150px]">
                              <Truck className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span className="truncate">{order.deliveryAddress}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 max-w-[200px]">
                          <span className="truncate block text-slate-300">
                            {order.items.map((i) => `${i.product.name} x${i.quantity}`).join(', ')}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="bg-slate-900 border border-slate-700 text-slate-300 px-2 py-0.5 rounded font-medium">
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-right text-orange-400">
                          {formatRupiah(order.total)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {isCancelled ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-950/80 border border-rose-800/60 px-2 py-0.5 rounded-full">
                              <XCircle className="w-3 h-3 text-rose-400" />
                              Dibatalkan
                            </span>
                          ) : order.status === 'Diproses' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3 text-amber-400" />
                              Diproses
                            </span>
                          ) : order.status === 'Siap Diambil' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-full">
                              <Check className="w-3 h-3 text-cyan-400" />
                              Siap Diambil
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Selesai
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1">
                          {/* Pre-order status progression */}
                          {onUpdateOrderStatus && order.status === 'Diproses' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, 'Siap Diambil')}
                              className="px-2 py-1 text-[10px] font-bold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/60 rounded-lg transition-colors"
                              title="Tandai pesanan siap diambil"
                            >
                              Siap Diambil
                            </button>
                          )}
                          {onUpdateOrderStatus && order.status === 'Siap Diambil' && (
                            <button
                              onClick={() => onUpdateOrderStatus(order.id, 'Selesai')}
                              className="px-2 py-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/60 rounded-lg transition-colors"
                              title="Selesaikan pesanan"
                            >
                              Selesai
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedOrderForReceipt(order)}
                            className="p-1.5 text-emerald-400 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Cetak Ulang Struk"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {!isCancelled && (
                            <button
                              onClick={() => setOrderToVoid(order)}
                              className="p-1.5 text-rose-400 hover:bg-slate-700 rounded-lg transition-colors"
                              title="Batalkan Pesanan (Perlu PIN Supervisor)"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Supervisor PIN Authorization Modal for Voiding */}
      {orderToVoid && (
        <SupervisorPinModal
          correctPin={settings.supervisorPin || '1234'}
          actionTitle={`Otorisasi Pembatalan ${orderToVoid.orderNumber}`}
          actionDescription="Aksi pembatalan transaksi (void) memerlukan otorisasi PIN Manajer / Supervisor. Stok produk akan dikembalikan otomatis."
          onSuccess={() => {
            onCancelOrder(orderToVoid.id);
            setOrderToVoid(null);
          }}
          onClose={() => setOrderToVoid(null)}
        />
      )}

      {/* Struk Modal */}
      {selectedOrderForReceipt && (
        <ReceiptModal
          order={selectedOrderForReceipt}
          settings={settings}
          onClose={() => setSelectedOrderForReceipt(null)}
          onNewOrder={() => setSelectedOrderForReceipt(null)}
        />
      )}
    </div>
  );
};
