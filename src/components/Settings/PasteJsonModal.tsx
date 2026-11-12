import React, { useState, useEffect } from 'react';
import { OhMyCashierBackupData } from '../../types';
import { validateBackupJson } from '../../utils/mobileStorage';
import { X, Clipboard, CheckCircle2, AlertCircle, FileText, ArrowRight, Sparkles } from 'lucide-react';
import { playSound } from '../../utils/audio';

interface PasteJsonModalProps {
  onClose: () => void;
  onConfirmJson: (data: OhMyCashierBackupData) => void;
}

export const PasteJsonModal: React.FC<PasteJsonModalProps> = ({ onClose, onConfirmJson }) => {
  const [rawText, setRawText] = useState('');
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    data?: OhMyCashierBackupData;
    error?: string;
  }>({ valid: false });

  useEffect(() => {
    if (!rawText.trim()) {
      setValidationResult({ valid: false });
      return;
    }
    const result = validateBackupJson(rawText);
    setValidationResult(result);
  }, [rawText]);

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator?.clipboard?.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          setRawText(clipText);
          playSound('beep');
        }
      }
    } catch {
      alert('Izin membaca clipboard tidak tersedia di peramban ini. Silakan tempel secara manual pada kolom teks di bawah.');
    }
  };

  const handleProceed = () => {
    if (!validationResult.valid || !validationResult.data) return;
    playSound('chime_ready');
    onConfirmJson(validationResult.data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 text-slate-100">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Clipboard className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 font-mono flex items-center gap-1.5">
                <span className="text-emerald-400">➜</span>
                <span>Tempel Teks Cadangan (.json)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Impor data tanpa berkas fisik (berguna di HP/Tablet Android)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-orange-400" />
              <span>Salinan Teks JSON Cadangan:</span>
            </label>
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 font-mono text-xs rounded-lg border border-slate-700 flex items-center gap-1 transition-colors active:scale-95 cursor-pointer"
            >
              <Clipboard className="w-3 h-3" />
              <span>Tempel dari Clipboard</span>
            </button>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder='Tempelkan teks JSON lengkap di sini, misal: {"app":"Oh My Cashier","version":"1.26.6","data":{...}}'
            rows={8}
            className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl font-mono text-xs text-slate-200 placeholder-slate-600 outline-none resize-none shadow-inner"
          />

          {/* Real-time Status Card */}
          {rawText.trim() && (
            <div
              className={`p-3 rounded-xl border text-xs font-mono transition-all ${
                validationResult.valid
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {validationResult.valid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold">Format JSON Terverifikasi Valid!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="font-bold">{validationResult.error || 'JSON tidak valid'}</span>
                  </>
                )}
              </div>

              {validationResult.valid && validationResult.data && (
                <div className="mt-2.5 pt-2 border-t border-emerald-500/20 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-slate-900/80 px-2 py-1 rounded">
                    <span className="text-slate-400 block">Toko:</span>
                    <strong className="text-white truncate block">
                      {validationResult.data.metadata.storeName}
                    </strong>
                  </div>
                  <div className="bg-slate-900/80 px-2 py-1 rounded">
                    <span className="text-slate-400 block">Menu:</span>
                    <strong className="text-orange-400">
                      {validationResult.data.metadata.productsCount} item
                    </strong>
                  </div>
                  <div className="bg-slate-900/80 px-2 py-1 rounded">
                    <span className="text-slate-400 block">Transaksi:</span>
                    <strong className="text-emerald-400">
                      {validationResult.data.metadata.ordersCount} nota
                    </strong>
                  </div>
                  <div className="bg-slate-900/80 px-2 py-1 rounded">
                    <span className="text-slate-400 block">Pelanggan:</span>
                    <strong className="text-purple-400">
                      {validationResult.data.metadata.customersCount} orang
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setRawText('')}
            disabled={!rawText}
            className="px-3 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 disabled:opacity-40 cursor-pointer"
          >
            Bersihkan
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded-xl border border-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleProceed}
              disabled={!validationResult.valid}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-mono font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>Lanjut ke Pratinjau</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
