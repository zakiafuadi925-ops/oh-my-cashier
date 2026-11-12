import React from 'react';
import {
  ShoppingCart,
  Receipt,
  Package,
  Boxes,
  Clock,
  BarChart3,
  Settings,
  ChefHat,
  X,
  MoreHorizontal,
  Zap,
  Palette,
} from 'lucide-react';
import { AppTheme } from '../types';

export type NavTab =
  | 'pos'
  | 'kitchen'
  | 'history'
  | 'products'
  | 'ingredients'
  | 'shift'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  cartCount: number;
  kitchenCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenMobile?: () => void;
  theme?: AppTheme;
  onToggleTheme?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  cartCount,
  kitchenCount = 0,
  isMobileOpen = false,
  onCloseMobile,
  onOpenMobile,
  theme = 'cyberpunk',
  onToggleTheme,
}) => {
  const menuItems = [
    {
      id: 'pos' as NavTab,
      label: 'Kasir & POS',
      sublabel: 'Order Baru',
      icon: ShoppingCart,
      badge: cartCount > 0 ? cartCount : undefined,
    },
    {
      id: 'kitchen' as NavTab,
      label: 'Layar Dapur (KDS)',
      sublabel: 'Antrean & Tiket',
      icon: ChefHat,
      badge: kitchenCount > 0 ? kitchenCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    },
    {
      id: 'history' as NavTab,
      label: 'Riwayat Transaksi',
      sublabel: 'Daftar Struk',
      icon: Receipt,
    },
    {
      id: 'products' as NavTab,
      label: 'Produk & Menu',
      sublabel: 'Katalog & Stok',
      icon: Package,
    },
    {
      id: 'ingredients' as NavTab,
      label: 'Bahan Baku',
      sublabel: 'Mentah & Olahan',
      icon: Boxes,
    },
    {
      id: 'shift' as NavTab,
      label: 'Manajemen Shift',
      sublabel: 'Kas & Rekonsiliasi',
      icon: Clock,
    },
    {
      id: 'reports' as NavTab,
      label: 'Laporan & Margin',
      sublabel: 'Omset & Profit',
      icon: BarChart3,
    },
    {
      id: 'settings' as NavTab,
      label: 'Pengaturan Toko',
      sublabel: 'Printer & Backup',
      icon: Settings,
    },
  ];

  // Mobile Bottom Nav items (4 main tasks + 1 more drawer trigger)
  const mobileNavItems: { id: NavTab | 'more'; label: string; icon: any; badge?: number }[] = [
    { id: 'pos', label: 'Kasir', icon: ShoppingCart, badge: cartCount > 0 ? cartCount : undefined },
    { id: 'kitchen', label: 'Dapur', icon: ChefHat, badge: kitchenCount > 0 ? kitchenCount : undefined },
    { id: 'history', label: 'Riwayat', icon: Receipt },
    { id: 'shift', label: 'Shift', icon: Clock },
    { id: 'more', label: 'Lainnya', icon: MoreHorizontal },
  ];

  return (
    <>
      {/* ======================================================== */}
      {/* 1. DESKTOP & TABLET SIDEBAR (md:flex, hidden on mobile) */}
      {/* ======================================================== */}
      <aside className="hidden md:flex md:w-20 lg:w-60 bg-slate-950 border-r border-slate-800 flex-col justify-between shrink-0 select-none shadow-md">
        <div className="py-3 px-2 lg:px-3 space-y-1">
          <div className="px-2 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 hidden lg:flex items-center gap-1.5">
            <span className="text-orange-500 font-black">#</span>
            <span>oh-my-cashier // menu</span>
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all relative min-h-[44px] ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-950/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                }`}
                title={item.label}
              >
                <div className="relative shrink-0 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {item.badge !== undefined && (
                    <span
                      className={`lg:hidden absolute -top-1.5 -right-2 font-mono text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs ${
                        isActive
                          ? 'bg-slate-950 text-orange-300 border border-orange-500/40'
                          : item.badgeColor || 'bg-slate-800 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="hidden lg:flex flex-col flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate flex items-center gap-1.5">
                      {isActive && <span className="text-white font-mono text-xs font-black">➜</span>}
                      <span>{item.label}</span>
                    </span>
                    {item.badge !== undefined && (
                      <span
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? 'bg-slate-950 text-orange-300 border border-orange-500/40'
                            : item.badgeColor || 'bg-slate-800 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] truncate font-mono ${
                      isActive ? 'text-orange-100' : 'text-slate-400'
                    }`}
                  >
                    {item.sublabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Desktop Sidebar Theme Switcher */}
        {onToggleTheme && (
          <div className="px-2 lg:px-3 py-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onToggleTheme}
              title={theme === 'cyberpunk' ? 'Ganti ke Tema Slate' : 'Ganti ke Tema Cyberpunk Zack'}
              className={`w-full flex items-center justify-center lg:justify-between px-2.5 py-2 rounded-xl border text-xs font-mono transition-all min-h-[40px] select-none active:scale-95 ${
                theme === 'cyberpunk'
                  ? 'bg-[#111827] text-[#8b5cf6] border-[#8b5cf6]/70 hover:border-[#8b5cf6] cyberpunk-glow-purple ring-1 ring-[#8b5cf6]/40'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                {theme === 'cyberpunk' ? (
                  <Zap className="w-4 h-4 text-[#10b981] fill-[#10b981] animate-pulse shrink-0" />
                ) : (
                  <Palette className="w-4 h-4 text-orange-400 shrink-0" />
                )}
                <span className="hidden lg:inline font-bold text-xs text-slate-100">
                  {theme === 'cyberpunk' ? 'Cyberpunk' : 'Slate Dark'}
                </span>
              </div>
              <span className={`hidden lg:inline text-[10px] font-bold px-1.5 py-0.5 rounded ${
                theme === 'cyberpunk'
                  ? 'bg-[#8b5cf6]/20 text-[#8b5cf6]'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {theme === 'cyberpunk' ? 'ZACK' : 'SLATE'}
              </span>
            </button>
          </div>
        )}

        {/* Desktop Footer stamp */}
        <div className="p-3 border-t border-slate-800 text-center lg:text-left bg-slate-950/80 font-mono">
          <div className="hidden lg:block">
            <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span className="text-emerald-400">➜</span>
              <span>oh-my-cashier</span>
            </p>
            <p className="text-[10px] text-slate-400">v1.26.6 • {theme === 'cyberpunk' ? 'cyberpunk zack theme' : 'unified slate theme'}</p>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MOBILE DRAWER OVERLAY (Shown when hamburger tapped)  */}
      {/* ======================================================== */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-950/80 backdrop-blur-xs flex animate-in fade-in duration-150">
          <div className="w-72 max-w-[85vw] bg-slate-950 text-slate-100 h-full flex flex-col justify-between shadow-2xl border-r border-slate-800 animate-in slide-in-from-left duration-200">
            <div>
              {/* Drawer Header */}
              <div className="p-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 flex items-center justify-center shrink-0 shadow-xs ring-1 ring-orange-500/40">
                    <img src="/logo.png" alt="Oh My Cashier Logo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="font-bold text-sm sm:text-base block leading-tight text-white tracking-tight flex items-center gap-1.5 font-mono">
                      <span className="text-emerald-400">➜</span>
                      <span>oh-my-cashier</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block">zsh-inspired pos terminal</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Menu Items */}
              <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)]">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(item.id);
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all min-h-[48px] active:scale-98 ${
                        isActive
                          ? 'bg-orange-500 text-white shadow-md font-bold'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold truncate flex items-center gap-1.5">
                            {isActive && <span className="font-mono text-xs font-black">➜</span>}
                            <span>{item.label}</span>
                          </span>
                          {item.badge !== undefined && (
                            <span
                              className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                                isActive
                                  ? 'bg-slate-950 text-orange-300 border border-orange-500/40'
                                  : item.badgeColor || 'bg-slate-800 text-slate-200 border border-slate-700'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-xs truncate block font-mono ${
                            isActive ? 'text-orange-100' : 'text-slate-400'
                          }`}
                        >
                          {item.sublabel}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Drawer Cyberpunk / Slate Theme Switcher */}
            {onToggleTheme && (
              <div className="p-3 border-t border-slate-800 bg-slate-950/90">
                <button
                  type="button"
                  onClick={() => {
                    onToggleTheme();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-mono transition-all min-h-[48px] shadow-sm active:scale-98 select-none ${
                    theme === 'cyberpunk'
                      ? 'bg-[#111827] text-[#8b5cf6] border-[#8b5cf6]/70 cyberpunk-glow-purple ring-1 ring-[#8b5cf6]/40'
                      : 'bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      theme === 'cyberpunk'
                        ? 'bg-[#0b0f19] border-[#8b5cf6]/50'
                        : 'bg-slate-800 border-slate-700'
                    }`}>
                      {theme === 'cyberpunk' ? (
                        <Zap className="w-4 h-4 text-[#10b981] fill-[#10b981] animate-pulse" />
                      ) : (
                        <Palette className="w-4 h-4 text-orange-400" />
                      )}
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-xs sm:text-sm text-slate-100 leading-tight">
                        {theme === 'cyberpunk' ? 'Tema: Cyberpunk (Zack)' : 'Tema: Slate Dark'}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        {theme === 'cyberpunk' ? 'Ungu elektrik & Hijau neon' : 'Slate netral & Oranye'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-bold font-mono px-2 py-1 rounded-md border ${
                      theme === 'cyberpunk'
                        ? 'bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {theme === 'cyberpunk' ? '⚡ AKTIF' : 'GANTI'}
                    </span>
                  </div>
                </button>
              </div>
            )}

            {/* Drawer Bottom Version */}
            <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/80 text-xs font-mono text-slate-400">
              <span className="font-semibold block text-slate-200 text-xs sm:text-sm flex items-center gap-1.5">
                <span className="text-emerald-400">➜</span>
                <span>oh-my-cashier mobile</span>
              </span>
              <span className="text-[10px] text-slate-400">robbyrussell inspired theme • v1.26.6</span>
            </div>
          </div>

          {/* Clickable Backdrop area */}
          <div className="flex-1" onClick={onCloseMobile} />
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MOBILE BOTTOM NAVIGATION BAR (< 768px, Thumb-Friendly)*/}
      {/* ======================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-1 py-1 flex items-center justify-around shadow-lg min-h-[58px]">
        {mobileNavItems.map((nav) => {
          const Icon = nav.icon;
          const isActive = nav.id === 'more' ? isMobileOpen : currentTab === nav.id;

          return (
            <button
              key={nav.id}
              type="button"
              onClick={() => {
                if (nav.id === 'more') {
                  if (onOpenMobile) onOpenMobile();
                } else {
                  onSelectTab(nav.id as NavTab);
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all min-h-[48px] relative ${
                isActive
                  ? 'text-orange-500 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-orange-500 stroke-[2.5]' : 'text-slate-400'}`} />
                {nav.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 bg-orange-500 text-white font-mono text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {nav.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-mono mt-0.5 leading-tight ${isActive ? 'font-bold text-orange-400' : 'text-slate-400'}`}>
                {nav.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-0.5" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
