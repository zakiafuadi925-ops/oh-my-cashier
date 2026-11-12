import React, { useState } from 'react';
import { Order } from '../../types';
import { formatRupiah } from '../../utils/format';
import { playSound } from '../../utils/audio';
import { X, Merge, Check, AlertCircle } from 'lucide-react';

interface MergeTableModalProps {
  currentTable: string;
  occupiedTablesWithOrders: { tableNumber: string; order: Order }[];
  onClose: () => void;
  onConfirmMerge: (sourceTable: string, targetTable: string) => void;
}

export const MergeTableModal: React.FC<MergeTableModalProps> = ({
  currentTable,
  occupiedTablesWithOrders,
  onClose,
  onConfirmMerge,
}) => {
  const currentOrder = occupiedTablesWithOrders.find((t) => t.tableNumber === currentTable)?.order;
  const otherOccupied = occupiedTablesWithOrders.filter((t) => t.tableNumber !== currentTable);

  const [selectedTarget, setSelectedTarget] = useState<string>(
    otherOccupied[0]?.tableNumber || ''
  );

  const targetOrder = otherOccupied.find((t) => t.tableNumber === selectedTarget)?.order;

  // Calculation if merged
  const combinedTotal = (currentOrder?.total || 0) + (targetOrder?.total || 0);
  const combinedItemsCount =
    (currentOrder?.items.length || 0) + (targetOrder?.items.length || 0);

  const handleExecuteMerge = () => {
    if (!selectedTarget) return;
    playSound('chime_ready');
    onConfirmMerge(currentTable, selectedTarget);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-700 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-950 text-slate-100 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-orange-400">
              <Merge className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Gabung Meja (Merge Tables)</h3>
              <p className="text-[11px] text-slate-400">
                Satukan tagihan dari dua meja terisi menjadi satu meja tunggal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {otherOccupied.length === 0 ? (
            <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
              <span>
                Tidak ada meja terisi lain saat ini. Fitur gabung meja memerlukan minimal 2 meja yang sedang aktif.
              </span>
            </div>
          ) : (
            <>
              {/* Visual Merge Representation */}
              <div className="grid grid-cols-2 gap-3">
                {/* Source Table */}
                <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs space-y-1">
                  <span className="text-[10px] font-bold text-rose-400 uppercase">Meja yang Digabung</span>
                  <div className="font-bold text-sm text-slate-100">{currentTable}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {currentOrder?.orderNumber} • {currentOrder?.items.length} item
                  </div>
                  <div className="font-mono font-bold text-rose-400">
                    {formatRupiah(currentOrder?.total || 0)}
                  </div>
                </div>

                {/* Target Table */}
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Meja Tujuan Gabung</span>
                  <div className="font-bold text-sm text-slate-100">{selectedTarget}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {targetOrder?.orderNumber} • {targetOrder?.items.length} item
                  </div>
                  <div className="font-mono font-bold text-emerald-400">
                    {formatRupiah(targetOrder?.total || 0)}
                  </div>
                </div>
              </div>

              {/* Target Picker */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Pilih Meja Terisi yang Ingin Digabungkan:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {otherOccupied.map((t) => (
                    <button
                      key={t.tableNumber}
                      type="button"
                      onClick={() => setSelectedTarget(t.tableNumber)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        selectedTarget === t.tableNumber
                          ? 'border-orange-500 bg-orange-500/20 text-orange-200 shadow-sm ring-1 ring-orange-400'
                          : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-100">{t.tableNumber}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{t.order.orderNumber}</div>
                      <div className="text-[11px] font-mono font-bold text-emerald-400">
                        {formatRupiah(t.order.total)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Combined Result Preview */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs flex items-center justify-between text-slate-300">
                <div>
                  <span className="text-[11px] text-slate-400 block">Hasil Setelah Penggabungan:</span>
                  <span className="font-bold text-slate-100">
                    Semua pesanan {currentTable} akan disatukan ke {selectedTarget}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                    Total {combinedItemsCount} hidangan menu
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Total Tagihan Gabungan:</span>
                  <span className="text-base font-black font-mono text-emerald-400">
                    {formatRupiah(combinedTotal)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!selectedTarget || otherOccupied.length === 0}
            onClick={handleExecuteMerge}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Konfirmasi Gabung ke {selectedTarget}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
