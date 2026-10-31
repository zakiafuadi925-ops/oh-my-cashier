import React, { useState } from 'react';
import { Shift, ShiftCashEntry } from '../../types';
import { formatRupiah, formatDate } from '../../utils/format';
import {
  Clock,
  Banknote,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  FileText,
  UserCheck,
  Plus,
  Minus,
  X,
} from 'lucide-react';

interface ShiftManagementProps {
  shift: Shift;
  onAddCashEntry: (entry: ShiftCashEntry) => void;
  onCloseShift: (actualCash: number) => void;
  onStartNewShift: (cashierName: string, initialCash: number) => void;
}

export const ShiftManagement: React.FC<ShiftManagementProps> = ({
  shift,
  onAddCashEntry,
  onCloseShift,
  onStartNewShift,
}) => {
  // Modal for Cash In / Cash Out
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<'Kas Masuk' | 'Kas Keluar'>('Kas Masuk');
  const [entryAmount, setEntryAmount] = useState<number>(50000);
  const [entryReason, setEntryReason] = useState('');

  // Modal for Closing Shift
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [actualCashCounted, setActualCashCounted] = useState<number>(shift.expectedCash);

  // Modal for New Shift
  const [isNewShiftModalOpen, setIsNewShiftModalOpen] = useState(false);
  const [newCashierName, setNewCashierName] = useState('Ahmad Fauzi (Kasir)');
  const [newInitialCash, setNewInitialCash] = useState<number>(200000);

  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryReason.trim() || entryAmount <= 0) return;
    const newEntry: ShiftCashEntry = {
      id: `entry-${Date.now()}`,
      time: new Date().toISOString(),
      type: entryType,
      amount: Number(entryAmount),
      reason: entryReason.trim(),
    };
    onAddCashEntry(newEntry);
    setEntryModalOpen(false);
    setEntryReason('');
  };

  const handleCloseShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCloseShift(actualCashCounted);
    setIsCloseModalOpen(false);
  };

  const handleStartNewShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartNewShift(newCashierName, newInitialCash);
    setIsNewShiftModalOpen(false);
  };

  const discrepancy = actualCashCounted - shift.expectedCash;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold font-mono">➜</span>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-mono">
              <Clock className="w-5 h-5 text-orange-500" />
              <span>shift@cashier // Manajemen Shift</span>
            </h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded font-mono font-bold tracking-wider ${
                shift.status === 'Open'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              git:({shift.status === 'Open' ? 'shift:open ✔' : 'shift:closed ✗'})
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            ~/.oh-my-cashier/shift-drawer • Rekonsiliasi uang kas di laci kasir, kas masuk & keluar operasional.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {shift.status === 'Open' ? (
            <>
              <button
                onClick={() => {
                  setEntryType('Kas Masuk');
                  setEntryModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-emerald-400 hover:bg-slate-800 border border-emerald-800/60 rounded-xl text-xs font-bold transition-colors font-mono cursor-pointer"
              >
                <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                <span>+ Kas Masuk</span>
              </button>

              <button
                onClick={() => {
                  setEntryType('Kas Keluar');
                  setEntryModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-amber-400 hover:bg-slate-800 border border-amber-800/60 rounded-xl text-xs font-bold transition-colors font-mono cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4 text-amber-400" />
                <span>- Kas Keluar</span>
              </button>

              <button
                onClick={() => {
                  setActualCashCounted(shift.expectedCash);
                  setIsCloseModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors font-mono cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Tutup Shift</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsNewShiftModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm transition-colors font-mono cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Buka Shift Baru</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Cashier Info Card */}
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-700 text-orange-400 flex items-center justify-center font-bold text-lg">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono font-bold flex items-center gap-1">
                <span className="text-emerald-400">➜</span> Kasir Bertugas
              </span>
              <h3 className="text-base font-black text-slate-100 font-mono">{shift.cashierName}</h3>
              <p className="text-xs text-slate-400 font-mono">
                Mulai: {formatDate(shift.startTime)}
                {shift.endTime && ` • Ditutup: ${formatDate(shift.endTime)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-mono">Modal Awal Kas:</span>
              <span className="text-lg font-mono font-black text-slate-100">
                {formatRupiah(shift.initialCash)}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-mono font-semibold">
              <span>Penjualan Tunai</span>
              <Banknote className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-mono font-black text-slate-100">
              {formatRupiah(shift.cashSales)}
            </div>
            <p className="text-[11px] text-slate-400">Penerimaan cash transaksi kasir</p>
          </div>

          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-400 font-mono font-semibold">
              <span>Penjualan Non-Tunai</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-mono font-black text-slate-100">
              {formatRupiah(shift.nonCashSales)}
            </div>
            <p className="text-[11px] text-slate-400">QRIS, Kartu Debit & Transfer Bank</p>
          </div>

          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-blue-400 font-mono font-semibold">
              <span>Kas Masuk (+ Masuk)</span>
              <ArrowDownRight className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-mono font-black text-blue-400">
              +{formatRupiah(shift.cashIn)}
            </div>
            <p className="text-[11px] text-slate-400">Uang receh tambahan / modal lain</p>
          </div>

          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-amber-400 font-mono font-semibold">
              <span>Kas Keluar (- Keluar)</span>
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-mono font-black text-amber-400">
              -{formatRupiah(shift.cashOut)}
            </div>
            <p className="text-[11px] text-slate-400">Beli es batu, gas, bensin operasional</p>
          </div>
        </div>

        {/* Expected Cash in Drawer banner - Oh My Zsh Obsidian Dark */}
        <div className="bg-slate-950 p-5 rounded-2xl text-white border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">➜</span>
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Total Uang Kas Seharusnya di Laci (Expected Cash)
              </span>
            </div>
            <div className="text-3xl font-mono font-black tracking-tight mt-1 text-emerald-400">
              {formatRupiah(shift.expectedCash)}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Rumus: Modal Awal ({formatRupiah(shift.initialCash)}) + Tunai ({formatRupiah(shift.cashSales)}) + Masuk ({formatRupiah(shift.cashIn)}) - Keluar ({formatRupiah(shift.cashOut)})
            </p>
          </div>

          {shift.status === 'Closed' && shift.actualCash !== undefined && (
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-right">
              <span className="text-xs text-slate-400 block font-mono">Fisik Kas Dihitung:</span>
              <span className="text-xl font-mono font-bold block text-white">{formatRupiah(shift.actualCash)}</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded inline-block mt-1 font-mono ${
                  shift.discrepancy === 0
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : shift.discrepancy! > 0
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
              >
                {shift.discrepancy === 0
                  ? 'Pas (Seimbang)'
                  : shift.discrepancy! > 0
                  ? `Selisih Lebih: +${formatRupiah(shift.discrepancy!)}`
                  : `Selisih Kurang: ${formatRupiah(shift.discrepancy!)}`}
              </span>
            </div>
          )}
        </div>

        {/* Cash In / Out Entries Log */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-700 bg-slate-950 flex items-center justify-between">
            <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Log Mutasi Kas Masuk & Kas Keluar Shift Ini</span>
            </h4>
            <span className="text-xs text-slate-400 font-mono">{shift.entries.length} catatan</span>
          </div>

          <div className="divide-y divide-slate-700/60">
            {shift.entries.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Belum ada mutasi kas tambahan selama shift ini.
              </div>
            ) : (
              shift.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-700/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold border ${
                        entry.type === 'Kas Masuk'
                          ? 'bg-blue-950/80 text-blue-300 border-blue-800/60'
                          : 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                      }`}
                    >
                      {entry.type === 'Kas Masuk' ? (
                        <Plus className="w-4 h-4" />
                      ) : (
                        <Minus className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-slate-200">{entry.reason}</span>
                      <p className="text-[10px] text-slate-400">{formatDate(entry.time)}</p>
                    </div>
                  </div>

                  <span
                    className={`font-mono font-bold text-sm ${
                      entry.type === 'Kas Masuk' ? 'text-blue-400' : 'text-amber-400'
                    }`}
                  >
                    {entry.type === 'Kas Masuk' ? '+' : '-'}
                    {formatRupiah(entry.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Add Cash In / Cash Out */}
      {entryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-sm w-full p-4 space-y-3 text-slate-100">
            <h4 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
              {entryType === 'Kas Masuk' ? (
                <ArrowDownRight className="w-4 h-4 text-emerald-400" />
              ) : (
                <ArrowUpRight className="w-4 h-4 text-amber-400" />
              )}
              <span>Catat {entryType}</span>
            </h4>

            <form onSubmit={handleEntrySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg outline-none font-mono font-bold text-sm text-slate-100 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Keterangan / Alasan</label>
                <input
                  type="text"
                  required
                  value={entryReason}
                  onChange={(e) => setEntryReason(e.target.value)}
                  placeholder={
                    entryType === 'Kas Masuk'
                      ? 'Contoh: Tambah uang koin kembalian'
                      : 'Contoh: Beli es batu kristal / gas elpiji'
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg outline-none text-slate-100 placeholder-slate-500 focus:border-orange-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEntryModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 border border-slate-700 rounded-lg font-bold text-slate-300 hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-sm"
                >
                  Simpan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Close Shift & Reconcile */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 text-slate-100">
            <h4 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span>Tutup Shift & Rekonsiliasi Kas</span>
            </h4>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Penjualan Shift:</span>
                <span className="font-bold font-mono text-slate-200">
                  {formatRupiah(shift.cashSales + shift.nonCashSales)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Uang Kas Seharusnya di Laci:</span>
                <span className="font-bold font-mono text-emerald-400">
                  {formatRupiah(shift.expectedCash)}
                </span>
              </div>
            </div>

            <form onSubmit={handleCloseShiftSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Hitung Uang Fisik di Laci Kasir (Rp) *
                </label>
                <input
                  type="number"
                  required
                  value={actualCashCounted}
                  onChange={(e) => setActualCashCounted(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg outline-none font-mono font-black text-lg text-slate-100 focus:border-orange-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Hitung seluruh lembar uang fisik di laci kasir dan masukkan totalnya.
                </p>
              </div>

              {/* Discrepancy indicator */}
              <div className="p-3 rounded-xl border border-slate-800 flex items-center justify-between bg-slate-950">
                <span className="font-semibold text-slate-300">Hasil Selisih:</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    discrepancy === 0
                      ? 'text-emerald-400'
                      : discrepancy > 0
                      ? 'text-cyan-400'
                      : 'text-rose-400'
                  }`}
                >
                  {discrepancy === 0
                    ? 'Tepat Seimbang (Rp 0)'
                    : discrepancy > 0
                    ? `Lebih +${formatRupiah(discrepancy)}`
                    : `Kurang ${formatRupiah(discrepancy)}`}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 border border-slate-700 rounded-xl font-bold text-slate-300 hover:bg-slate-700"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Konfirmasi Tutup Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Start New Shift */}
      {isNewShiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-sm w-full p-4 space-y-3 text-slate-100">
            <h4 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Buka Shift Kasir Baru</span>
            </h4>

            <form onSubmit={handleStartNewShiftSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Nama Kasir Bertugas</label>
                <input
                  type="text"
                  required
                  value={newCashierName}
                  onChange={(e) => setNewCashierName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg outline-none text-slate-100 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Modal Awal Uang Kas (Rp)
                </label>
                <input
                  type="number"
                  required
                  value={newInitialCash}
                  onChange={(e) => setNewInitialCash(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg outline-none font-mono font-bold text-slate-100 focus:border-orange-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewShiftModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 border border-slate-700 rounded-lg font-bold text-slate-300 hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-sm"
                >
                  Mulai Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
