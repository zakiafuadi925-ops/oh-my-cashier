import React, { useState } from 'react';
import { ShieldAlert, X, Delete, Check } from 'lucide-react';

interface SupervisorPinModalProps {
  correctPin: string;
  actionTitle: string;
  actionDescription?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const SupervisorPinModal: React.FC<SupervisorPinModalProps> = ({
  correctPin,
  actionTitle,
  actionDescription,
  onSuccess,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const next = pin + digit;
      setPin(next);
      setError(false);
      if (next === correctPin) {
        setTimeout(() => {
          onSuccess();
        }, 150);
      } else if (next.length >= correctPin.length) {
        setError(true);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-xs w-full overflow-hidden p-5 flex flex-col items-center animate-in fade-in zoom-in-95">
        {/* Close */}
        <div className="w-full flex justify-between items-center mb-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <h4 className="font-bold text-slate-100 text-sm text-center">{actionTitle}</h4>
        <p className="text-[11px] text-slate-400 text-center mt-1">
          {actionDescription || 'Masukkan 4 digit PIN Manajer / Supervisor untuk melanjutkan aksi ini.'}
        </p>

        {/* PIN Indicators */}
        <div className="my-4 flex items-center gap-2.5">
          {Array.from({ length: correctPin.length }).map((_, i) => {
            const isFilled = i < pin.length;
            return (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full transition-all ${
                  error
                    ? 'bg-rose-500 scale-110 shadow-sm shadow-rose-500/50'
                    : isFilled
                    ? 'bg-orange-500 scale-105 shadow-sm shadow-orange-500/50'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-[11px] font-bold text-rose-400 mb-2 animate-bounce">
            PIN Salah! Silakan periksa kembali.
          </p>
        )}

        <p className="text-[10px] text-slate-400 mb-3">Masukkan 4 digit PIN otorisasi supervisor</p>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="py-3 rounded-xl bg-slate-950/70 hover:bg-slate-800 active:bg-slate-700 text-slate-100 font-bold text-base border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="py-3 rounded-xl bg-slate-950/70 hover:bg-slate-800 active:bg-slate-700 text-slate-100 font-bold text-base border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 font-semibold flex items-center justify-center border border-slate-700 transition-colors cursor-pointer"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
