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
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-700 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-950 text-slate-100 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-orange-400">
              <ArrowRightLeft className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Pindah Meja (Transfer Table)</h3>
              <p className="text-[11px] text-slate-400">
                Pindahkan pesanan aktif dari {currentTable} ke meja kosong lain
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
          {/* Current Order Summary */}
          {activeOrder && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span>Pesanan Aktif:</span>
                <span className="font-mono font-bold text-slate-200">{activeOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Jumlah Item:</span>
                <span className="font-mono text-slate-300">{activeOrder.items.length} menu</span>
              </div>
              <div className="flex justify-between items-center font-bold text-slate-100 pt-1 border-t border-slate-800">
                <span>Total Tagihan:</span>
                <span className="font-mono text-orange-400 font-bold">{formatRupiah(activeOrder.total)}</span>
              </div>
            </div>
          )}

          {/* Visual Route */}
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="px-3.5 py-2 bg-slate-800 text-slate-100 border border-slate-700 rounded-xl font-bold text-sm text-center">
              <span className="text-[10px] uppercase block text-slate-400">Asal</span>
              {currentTable}
            </div>
            <ArrowRightLeft className="w-5 h-5 text-slate-500" />
            <div className="px-3.5 py-2 bg-orange-500/20 text-orange-300 border border-orange-500/40 rounded-xl font-bold text-sm text-center">
              <span className="text-[10px] uppercase block text-orange-400">Tujuan</span>
              {selectedTarget || 'Pilih Meja'}
            </div>
          </div>

          {/* Target Table Picker */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Pilih Meja Tujuan (Tersedia):
            </label>

            {availableTables.length === 0 ? (
              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
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
                        ? 'bg-orange-500 text-white border-orange-500 shadow-md ring-1 ring-orange-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
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
            disabled={!selectedTarget || availableTables.length === 0}
            onClick={handleExecuteMove}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Konfirmasi Pindah Meja</span>
          </button>
        </div>
      </div>
    </div>
  );
};
