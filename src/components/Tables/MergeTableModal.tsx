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
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Merge className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Gabung Meja (Merge Tables)</h3>
              <p className="text-[11px] text-emerald-100">
                Satukan tagihan dari dua meja terisi menjadi satu meja tunggal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {otherOccupied.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
              <span>
                Tidak ada meja terisi lain saat ini. Fitur gabung meja memerlukan minimal 2 meja yang sedang aktif.
              </span>
            </div>
          ) : (
            <>
              {/* Visual Merge Representation */}
              <div className="grid grid-cols-2 gap-3">
                {/* Source Table */}
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1">
                  <span className="text-[10px] font-bold text-red-700 uppercase">Meja yang Digabung</span>
                  <div className="font-bold text-sm text-gray-800">{currentTable}</div>
                  <div className="text-[11px] text-gray-500 font-mono">
                    {currentOrder?.orderNumber} • {currentOrder?.items.length} item
                  </div>
                  <div className="font-mono font-bold text-red-700">
                    {formatRupiah(currentOrder?.total || 0)}
                  </div>
                </div>

                {/* Target Table */}
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Meja Tujuan Gabung</span>
                  <div className="font-bold text-sm text-gray-800">{selectedTarget}</div>
                  <div className="text-[11px] text-gray-500 font-mono">
                    {targetOrder?.orderNumber} • {targetOrder?.items.length} item
                  </div>
                  <div className="font-mono font-bold text-emerald-700">
                    {formatRupiah(targetOrder?.total || 0)}
                  </div>
                </div>
              </div>

              {/* Target Picker */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
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
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm ring-2 ring-emerald-300'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="font-bold text-xs">{t.tableNumber}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{t.order.orderNumber}</div>
                      <div className="text-[11px] font-mono font-bold text-emerald-700">
                        {formatRupiah(t.order.total)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Combined Result Preview */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-gray-500 block">Hasil Setelah Penggabungan:</span>
                  <span className="font-bold text-gray-800">
                    Semua pesanan {currentTable} akan disatukan ke {selectedTarget}
                  </span>
                  <span className="text-[10px] text-gray-500 block mt-0.5 font-mono">
                    Total {combinedItemsCount} hidangan menu
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 block">Total Tagihan Gabungan:</span>
                  <span className="text-base font-black font-mono text-emerald-700">
                    {formatRupiah(combinedTotal)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!selectedTarget || otherOccupied.length === 0}
            onClick={handleExecuteMerge}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Konfirmasi Gabung ke {selectedTarget}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
