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
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xs w-full overflow-hidden p-5 flex flex-col items-center animate-in fade-in zoom-in-95">
        {/* Close */}
        <div className="w-full flex justify-between items-center mb-2">
          <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <h4 className="font-bold text-gray-900 text-sm text-center">{actionTitle}</h4>
        <p className="text-[11px] text-gray-500 text-center mt-1">
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
                    ? 'bg-red-500 scale-110'
                    : isFilled
                    ? 'bg-emerald-700 scale-105'
                    : 'bg-gray-200'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-[11px] font-bold text-red-600 mb-2 animate-bounce">
            PIN Salah! Silakan periksa kembali.
          </p>
        )}

        <p className="text-[10px] text-gray-400 mb-3">Masukkan 4 digit PIN otorisasi supervisor</p>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="py-3 rounded-xl bg-gray-50 hover:bg-emerald-50 active:bg-emerald-100 text-gray-800 font-bold text-base border border-gray-200 transition-colors"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-xs border border-gray-200"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="py-3 rounded-xl bg-gray-50 hover:bg-emerald-50 active:bg-emerald-100 text-gray-800 font-bold text-base border border-gray-200"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold flex items-center justify-center border border-gray-200"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
