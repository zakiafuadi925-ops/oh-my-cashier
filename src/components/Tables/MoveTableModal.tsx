import React, { useState } from 'react';
import { Order } from '../../types';
import { formatRupiah } from '../../utils/format';
import { playSound } from '../../utils/audio';
import { X, ArrowRightLeft, Check, AlertCircle } from 'lucide-react';

interface MoveTableModalProps {
  currentTable: string;
  activeOrder?: Order;
  occupiedTables: string[];
  onClose: () => void;
  onConfirmMove: (fromTable: string, toTable: string) => void;
}

export const MoveTableModal: React.FC<MoveTableModalProps> = ({
  currentTable,
  activeOrder,
  occupiedTables,
  onClose,
  onConfirmMove,
}) => {
  // Available tables are Meja 01..20 excluding currentTable and other occupied tables
  const allTables = Array.from({ length: 20 }, (_, i) => `Meja ${(i + 1).toString().padStart(2, '0')}`);
  const availableTables = allTables.filter((t) => t !== currentTable && !occupiedTables.includes(t));

  const [selectedTarget, setSelectedTarget] = useState<string>(availableTables[0] || '');

  const handleExecuteMove = () => {
    if (!selectedTarget) return;
    playSound('chime_ready');
    onConfirmMove(currentTable, selectedTarget);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Pindah Meja (Transfer Table)</h3>
              <p className="text-[11px] text-emerald-100">
                Pindahkan pesanan aktif dari {currentTable} ke meja kosong lain
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
          {/* Current Order Summary */}
          {activeOrder && (
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs space-y-1">
              <div className="flex justify-between items-center text-gray-500">
                <span>Pesanan Aktif:</span>
                <span className="font-mono font-bold text-gray-700">{activeOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500">
                <span>Jumlah Item:</span>
                <span className="font-mono text-gray-700">{activeOrder.items.length} menu</span>
              </div>
              <div className="flex justify-between items-center font-bold text-gray-800 pt-1 border-t border-gray-200">
                <span>Total Tagihan:</span>
                <span className="font-mono text-emerald-700">{formatRupiah(activeOrder.total)}</span>
              </div>
            </div>
          )}

          {/* Visual Route */}
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="px-3.5 py-2 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl font-bold text-sm text-center">
              <span className="text-[10px] uppercase block text-emerald-700">Asal</span>
              {currentTable}
            </div>
            <ArrowRightLeft className="w-5 h-5 text-gray-400" />
            <div className="px-3.5 py-2 bg-blue-100 text-blue-900 border border-blue-300 rounded-xl font-bold text-sm text-center">
              <span className="text-[10px] uppercase block text-blue-700">Tujuan</span>
              {selectedTarget || 'Pilih Meja'}
            </div>
          </div>

          {/* Target Table Picker */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Pilih Meja Tujuan (Tersedia):
            </label>

            {availableTables.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Semua meja saat ini sedang terisi. Tidak ada meja kosong yang tersedia.</span>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                {availableTables.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTarget(t)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border text-center ${
                      selectedTarget === t
                        ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300'
                        : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
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
            disabled={!selectedTarget || availableTables.length === 0}
            onClick={handleExecuteMove}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Konfirmasi Pindah Meja</span>
          </button>
        </div>
      </div>
    </div>
  );
};
