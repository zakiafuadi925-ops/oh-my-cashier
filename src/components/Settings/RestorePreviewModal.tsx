import React from 'react';
import { OhMyCashierBackupData } from '../../types';
import { formatDate } from '../../utils/format';
import {
  X,
  Database,
  CheckCircle2,
  AlertTriangle,
  Package,
  Layers,
  Users,
  Boxes,
  Receipt,
  Clock,
  Store,
} from 'lucide-react';

interface RestorePreviewModalProps {
  backupData: OhMyCashierBackupData;
  onClose: () => void;
  onConfirmRestore: (data: OhMyCashierBackupData) => void;
}

export const RestorePreviewModal: React.FC<RestorePreviewModalProps> = ({
  backupData,
  onClose,
  onConfirmRestore,
}) => {
  const { metadata, exportedAt, data } = backupData;

  const handleConfirm = () => {
    onConfirmRestore(backupData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-100">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 text-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Konfirmasi Pemulihan Basis Data (.json)</h3>
              <p className="text-[11px] text-slate-400">
                Periksa rincian data cadangan sebelum mengganti data saat ini
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

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Metadata Card */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-orange-400" />
                <span>{metadata?.storeName || data?.settings?.storeName || 'Oh My Cashier'}</span>
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-semibold px-2 py-0.5 rounded-full">
                {metadata?.branchName || data?.settings?.branchName || 'Outlet'}
              </span>
            </div>

            <div className="text-[11px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800">
              <div className="flex justify-between">
                <span>Waktu Cadangan Dibuat:</span>
                <strong className="font-mono text-slate-200">{formatDate(exportedAt || new Date().toISOString())}</strong>
              </div>
              <div className="flex justify-between">
                <span>Versi Aplikasi:</span>
                <strong className="font-mono text-slate-200">{backupData.version || '1.26.6'}</strong>
              </div>
            </div>
          </div>

          {/* Counts Grid */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">
              Koleksi Data yang Akan Dipulihkan:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center gap-2.5">
                <Package className="w-4 h-4 text-orange-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Katalog Menu & Stok</span>
                  <strong className="font-mono text-slate-200">
                    {data.products?.length ?? metadata?.productsCount ?? 0} Produk
                  </strong>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Kategori Menu</span>
                  <strong className="font-mono text-slate-200">
                    {data.categories?.length ?? metadata?.categoriesCount ?? 0} Kategori
                  </strong>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center gap-2.5">
                <Users className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Basis Data Pelanggan</span>
                  <strong className="font-mono text-slate-200">
                    {data.customers?.length ?? metadata?.customersCount ?? 0} Pelanggan
                  </strong>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center gap-2.5">
                <Boxes className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Bahan Baku & Resep</span>
                  <strong className="font-mono text-slate-200">
                    {data.ingredients?.length ?? metadata?.ingredientsCount ?? 0} Bahan
                  </strong>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center gap-2.5">
                <Receipt className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Riwayat Transaksi</span>
                  <strong className="font-mono text-slate-200">
                    {data.orders?.length ?? metadata?.ordersCount ?? 0} Pesanan
                  </strong>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Status Shift Kasir</span>
                  <strong className="font-mono text-slate-200">
                    {data.shift?.status ? `Shift ${data.shift.status}` : 'Tersimpan'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Notice */}
          <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-bold block text-amber-300">Peringatan Penggantian Data</strong>
              <p className="text-[11px] leading-relaxed text-amber-200/90">
                Memulihkan berkas cadangan ini akan <b>mengganti seluruh basis data lokal</b> di perangkat ini dengan data yang ada di dalam berkas cadangan. Pastikan data terkini telah dicadangkan jika diperlukan.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-950/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Pulihkan Basis Data Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
