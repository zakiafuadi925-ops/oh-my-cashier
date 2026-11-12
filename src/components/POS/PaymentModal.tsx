import React, { useState } from 'react';
import { Order, PaymentMethod } from '../../types';
import { formatRupiah } from '../../utils/format';
import { X, CheckCircle, Banknote, QrCode, CreditCard, Building2 } from 'lucide-react';

interface PaymentModalProps {
  orderData: Partial<Order>;
  totalAmount: number;
  onClose: () => void;
  onSuccess: (finalOrder: Order) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  orderData,
  totalAmount,
  onClose,
  onSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Tunai');
  const [cashAmount, setCashAmount] = useState<number>(totalAmount);
  const [qrisPaid, setQrisPaid] = useState<boolean>(false);
  const [referenceNo, setReferenceNo] = useState<string>('');

  const changeAmount = Math.max(0, cashAmount - totalAmount);
  const isCashSufficient = cashAmount >= totalAmount;

  const quickCashOptions = [
    { label: 'Uang Pas', value: totalAmount },
    { label: 'Rp 50.000', value: 50000 },
    { label: 'Rp 100.000', value: 100000 },
    { label: 'Rp 200.000', value: 200000 },
    { label: 'Rp 500.000', value: 500000 },
  ].filter((opt) => opt.value >= totalAmount || opt.label === 'Uang Pas');

  const handleCompletePayment = () => {
    if (selectedMethod === 'Tunai' && !isCashSufficient) {
      return;
    }

    const finalOrder: Order = {
      ...(orderData as Order),
      id: `ord-${Date.now()}`,
      orderNumber: `#${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      paymentMethod: selectedMethod,
      amountPaid: selectedMethod === 'Tunai' ? cashAmount : totalAmount,
      changeAmount: selectedMethod === 'Tunai' ? changeAmount : 0,
      status: orderData.status || (orderData.orderType === 'Pre-Order' ? 'Diproses' : 'Selesai'),
    };

    onSuccess(finalOrder);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 border border-slate-700 text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-slate-100">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-orange-400 uppercase tracking-wider">
              <span className="text-emerald-400">➜</span>
              <span>oh-my-cashier // checkout</span>
            </div>
            <h3 className="font-bold text-xl leading-tight text-slate-100">Total Tagihan</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-mono font-black text-orange-400">{formatRupiah(totalAmount)}</span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white ml-2 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5">
              <span className="text-orange-400">#</span>
              <span>Pilih Metode Pembayaran</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('Tunai')}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedMethod === 'Tunai'
                    ? 'border-orange-500 bg-orange-500/20 text-orange-200 ring-1 ring-orange-400 font-bold'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-400" />
                <span className="text-xs">Tunai</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('QRIS')}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedMethod === 'QRIS'
                    ? 'border-orange-500 bg-orange-500/20 text-orange-200 ring-1 ring-orange-400 font-bold'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium'
                }`}
              >
                <QrCode className="w-5 h-5 text-blue-400" />
                <span className="text-xs">QRIS</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('Debit')}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedMethod === 'Debit'
                    ? 'border-orange-500 bg-orange-500/20 text-orange-200 ring-1 ring-orange-400 font-bold'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium'
                }`}
              >
                <CreditCard className="w-5 h-5 text-purple-400" />
                <span className="text-xs">Debit / EDC</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('Transfer')}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedMethod === 'Transfer'
                    ? 'border-orange-500 bg-orange-500/20 text-orange-200 ring-1 ring-orange-400 font-bold'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium'
                }`}
              >
                <Building2 className="w-5 h-5 text-amber-400" />
                <span className="text-xs">Transfer</span>
              </button>
            </div>
          </div>

          {/* Cash Payment Details */}
          {selectedMethod === 'Tunai' && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Uang Tunai Diterima (Rp)
                </label>
                <input
                  type="number"
                  value={cashAmount || ''}
                  onChange={(e) => setCashAmount(Number(e.target.value) || 0)}
                  className="w-full text-xl font-mono font-bold px-3 py-2 border border-slate-700 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-slate-900 text-slate-100"
                  placeholder="0"
                />
              </div>

              {/* Quick Cash Presets */}
              <div className="flex flex-wrap gap-1.5">
                {quickCashOptions.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setCashAmount(opt.value)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Change / Kembalian Calculation */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Kembalian</span>
                  <span
                    className={`text-xl font-mono font-black ${
                      isCashSufficient ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isCashSufficient ? formatRupiah(changeAmount) : 'Uang Kurang!'}
                  </span>
                </div>
                {!isCashSufficient && (
                  <span className="text-xs font-semibold text-rose-300 bg-rose-950/60 border border-rose-800/80 px-2 py-1 rounded">
                    Kurang {formatRupiah(totalAmount - cashAmount)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* QRIS Payment Details */}
          {selectedMethod === 'QRIS' && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center text-center space-y-3">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 shadow-sm flex flex-col items-center">
                {/* Simulated QR Code SVG */}
                <div className="w-44 h-44 bg-white border border-gray-300 p-2 rounded-lg flex flex-col items-center justify-center relative">
                  <svg className="w-full h-full text-gray-900" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="10" y="10" width="25" height="25" fill="black" />
                    <rect x="15" y="15" width="15" height="15" fill="white" />
                    <rect x="18" y="18" width="9" height="9" fill="black" />
                    <rect x="65" y="10" width="25" height="25" fill="black" />
                    <rect x="70" y="15" width="15" height="15" fill="white" />
                    <rect x="73" y="18" width="9" height="9" fill="black" />
                    <rect x="10" y="65" width="25" height="25" fill="black" />
                    <rect x="15" y="70" width="15" height="15" fill="white" />
                    <rect x="18" y="73" width="9" height="9" fill="black" />
                    {/* Pattern blocks */}
                    <rect x="42" y="15" width="6" height="6" fill="black" />
                    <rect x="52" y="22" width="6" height="6" fill="black" />
                    <rect x="45" y="32" width="10" height="6" fill="black" />
                    <rect x="15" y="45" width="6" height="8" fill="black" />
                    <rect x="30" y="45" width="8" height="8" fill="black" />
                    <rect x="45" y="45" width="12" height="12" fill="black" />
                    <rect x="65" y="45" width="6" height="6" fill="black" />
                    <rect x="78" y="45" width="10" height="8" fill="black" />
                    <rect x="45" y="65" width="8" height="12" fill="black" />
                    <rect x="60" y="65" width="12" height="8" fill="black" />
                    <rect x="78" y="65" width="8" height="12" fill="black" />
                    <rect x="42" y="82" width="10" height="6" fill="black" />
                    <rect x="60" y="80" width="12" height="8" fill="black" />
                    <rect x="80" y="82" width="8" height="6" fill="black" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                      OH MY CASHIER
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-bold text-slate-400 mt-2 flex items-center gap-1 font-mono">
                  <span>NMID: ID1020304050607</span>
                </div>
              </div>

              <div className="text-xs text-slate-400 max-w-xs">
                Arahkan kamera e-wallet (GoPay, OVO, Dana, ShopeePay, BCA Mobile, Livin, dll.) ke kode QR di atas.
              </div>

              <button
                type="button"
                onClick={() => setQrisPaid(true)}
                className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  qrisPaid
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>{qrisPaid ? 'QRIS Terverifikasi Berhasil' : 'Simulasi Pembayaran QRIS Sukses'}</span>
              </button>
            </div>
          )}

          {/* Debit or Transfer Details */}
          {(selectedMethod === 'Debit' || selectedMethod === 'Transfer') && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {selectedMethod === 'Debit' ? 'Nomor Kartu / Approval Code EDC' : 'Nomor Referensi Transfer Bank'}
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="Contoh: BCA-88392019"
                  className="w-full text-sm px-3 py-2 border border-slate-700 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none bg-slate-900 text-slate-100"
                />
              </div>
              <p className="text-xs text-slate-400">
                Pastikan transaksi di mesin EDC atau mutasi m-banking telah sukses diverifikasi kasir.
              </p>
            </div>
          )}

          {/* Customer & Order Summary preview */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Pelanggan:</span>
              <span className="font-semibold text-slate-100">
                {orderData.customer ? orderData.customer.name : 'Pelanggan Umum'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tipe Pesanan:</span>
              <span className="font-semibold text-slate-100">
                {orderData.orderType} {orderData.tableNumber ? `(${orderData.tableNumber})` : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Jumlah Item:</span>
              <span className="font-semibold text-slate-100">
                {orderData.items?.reduce((s, i) => s + i.quantity, 0)} item
              </span>
            </div>
          </div>
        </div>

        {/* Footer Submit */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-sm transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={selectedMethod === 'Tunai' && !isCashSufficient}
            onClick={handleCompletePayment}
            className="flex-2 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:border disabled:border-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-950/20 active:scale-98 transition-all cursor-pointer"
          >
            <CheckCircle className="w-5 h-5 text-white" />
            <span>Selesaikan & Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
