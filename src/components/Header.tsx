import React, { useState, useEffect } from 'react';
import { StoreSettings, Shift, LicenseInfo } from '../types';
import { Clock, Store, UserCheck, Wifi, Menu, Key, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  settings: StoreSettings;
  activeShift: Shift;
  onOpenShiftTab: () => void;
  onToggleMobileMenu?: () => void;
  licenseInfo?: LicenseInfo;
  onOpenLicenseModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeShift,
  onOpenShiftTab,
  onToggleMobileMenu,
  licenseInfo,
  onOpenLicenseModal,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-slate-950 text-slate-100 border-b border-slate-800 px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-md">
      {/* Brand & Outlet info */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 -ml-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            title="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Mac/Linux terminal window buttons indicator */}
        <div className="hidden lg:flex items-center gap-1.5 mr-1 text-slate-600 select-none">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/90 inline-block shadow-xs" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/90 inline-block shadow-xs" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/90 inline-block shadow-xs" />
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden shadow-xs shrink-0 flex items-center justify-center ring-1 ring-orange-500/40">
            <img
              src="/logo.png"
              alt="Oh My Cashier Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Oh My Zsh prompt arrow ➜ and directory ~ */}
              <div className="flex items-center font-mono font-bold text-xs sm:text-sm select-none">
                <span className="text-emerald-400 mr-1 font-black">➜</span>
                <span className="text-cyan-400 mr-1.5 font-semibold hidden xs:inline">~</span>
              </div>
              <span className="font-bold text-slate-50 tracking-tight text-xs sm:text-sm md:text-base truncate max-w-[120px] xs:max-w-[170px] sm:max-w-none">
                {settings.storeName}
              </span>

              {/* Oh My Zsh Git branch style license indicator */}
              {licenseInfo && (
                <button
                  type="button"
                  onClick={onOpenLicenseModal}
                  title={licenseInfo.isActivated ? `Lisensi ${licenseInfo.tier} Aktif` : 'Aplikasi dalam Mode Trial - Klik untuk Aktivasi'}
                  className={`font-mono text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1 border transition-all ${
                    licenseInfo.isActivated
                      ? 'bg-slate-900 text-cyan-400 border-cyan-800/80 hover:bg-slate-800'
                      : 'bg-slate-900 text-orange-400 border-orange-800/80 hover:bg-slate-800 animate-pulse'
                  }`}
                >
                  <span className="text-slate-500">git:(</span>
                  <span className={licenseInfo.isActivated ? 'text-emerald-400 font-bold' : 'text-orange-400 font-bold'}>
                    {licenseInfo.isActivated ? licenseInfo.tier.toLowerCase() : 'trial'}
                  </span>
                  <span className={licenseInfo.isActivated ? 'text-emerald-400' : 'text-orange-500 font-bold'}>
                    {licenseInfo.isActivated ? ' ✔' : ' ✗'}
                  </span>
                  <span className="text-slate-500">)</span>
                </button>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-mono flex items-center gap-1.5 truncate max-w-[140px] xs:max-w-[180px] sm:max-w-none">
              <span className="text-slate-500">branch:</span>
              <span className="text-slate-300 font-medium truncate">{settings.branchName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Center - Live Clock (Oh My Zsh terminal prompt style) */}
      <div className="hidden md:flex items-center gap-2 text-xs font-mono font-medium text-slate-300 bg-slate-900/90 px-3.5 py-1.5 rounded-lg border border-slate-800 shadow-inner">
        <span className="text-orange-500 font-bold">zsh:</span>
        <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span className="text-slate-400">
          {currentTime.toLocaleDateString('id-ID', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
        </span>
        <span className="text-slate-700">|</span>
        <span className="font-bold text-emerald-400 tracking-wider">
          {currentTime.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      </div>

      {/* Right - Shift info & quick status */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
          <span className="font-semibold text-[11px]">connected</span>
        </div>

        <button
          onClick={onOpenShiftTab}
          className="flex items-center gap-1.5 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-700/80 transition-all min-h-[36px] sm:min-h-[40px] shrink-0 shadow-sm active:scale-95"
          title="Klik untuk melihat detail shift kasir"
        >
          <span className="text-orange-400 font-bold">➜</span>
          <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-bold text-[11px] sm:text-xs truncate max-w-[70px] xs:max-w-none text-slate-100">
            {activeShift.cashierName.split(' ')[0]}
          </span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">[open]</span>
        </button>
      </div>
    </header>
  );
};
