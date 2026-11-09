import React, { useState, useRef } from 'react';
import {
  StoreSettings,
  Product,
  Customer,
  Ingredient,
  Order,
  Shift,
  OhMyCashierBackupData,
  LicenseInfo,
} from '../../types';
import { playSound } from '../../utils/audio';
import {
  Settings,
  Store,
  Printer,
  FileText,
  Percent,
  CheckCircle2,
  Save,
  Bluetooth,
  ShieldAlert,
  Database,
  Download,
  Upload,
  AlertCircle,
  FileJson,
  RotateCcw,
  Package,
  Users,
  Boxes,
  Receipt,
  Clock,
  Key,
  ShieldCheck,
  Smartphone,
  Award,
} from 'lucide-react';
import { SupervisorPinModal } from '../Auth/SupervisorPinModal';
import { RestorePreviewModal } from './RestorePreviewModal';
import { ActivationModal } from './ActivationModal';

interface SettingsViewProps {
  settings: StoreSettings;
  onUpdateSettings: (newSettings: StoreSettings) => void;
  onTestPrint: () => void;
  ordersCount?: number;
  onResetData?: () => void;
  products?: Product[];
  categories?: string[];
  customers?: Customer[];
  ingredients?: Ingredient[];
  orders?: Order[];
  activeShift?: Shift;
  onRestoreFullDatabase?: (backup: OhMyCashierBackupData) => void;
  licenseInfo: LicenseInfo;
  onUpdateLicense: (newLicense: LicenseInfo) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onTestPrint,
  ordersCount,
  onResetData,
  products = [],
  categories = [],
  customers = [],
  ingredients = [],
  orders = [],
  activeShift,
  onRestoreFullDatabase,
  licenseInfo,
  onUpdateLicense,
}) => {
  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetPinModal, setShowResetPinModal] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Backup & Restore states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingRestoreData, setPendingRestoreData] = useState<OhMyCashierBackupData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleExportBackup = () => {
    try {
      const backup: OhMyCashierBackupData = {
        app: 'Oh My Cashier',
        version: '1.26.6',
        exportedAt: new Date().toISOString(),
        metadata: {
          storeName: formData.storeName,
          branchName: formData.branchName,
          productsCount: products.length,
          categoriesCount: categories.length,
          customersCount: customers.length,
          ingredientsCount: ingredients.length,
          ordersCount: orders.length,
        },
        data: {
          products,
          categories,
          customers,
          ingredients,
          orders,
          shift: activeShift || {
            id: 'shift-1',
            cashierName: 'Ahmad Fauzi (Kasir)',
            startTime: new Date().toISOString(),
            initialCash: 500000,
            cashSales: 0,
            nonCashSales: 0,
            cashIn: 0,
            cashOut: 0,
            expectedCash: 500000,
            status: 'Open',
            entries: [],
          },
          settings: formData,
        },
      };

      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const now = new Date();
      const dateTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const safeStore = (formData.storeName || 'ohmycashier').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      link.href = url;
      link.download = `ohmycashier_backup_${safeStore}_${dateTag}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      playSound('chime_ready');
      showToast('Berkas cadangan basis data (.json) berhasil diekspor & diunduh!');
    } catch (err) {
      console.error(err);
      showToast('Gagal membuat berkas cadangan');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Defense against memory exhaustion DoS (limit max JSON backup size to 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setImportError('Ukuran berkas melebihi batas aman (Maksimum 15 MB).');
      playSound('beep');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;

        // Prototype pollution detection & denial
        if (text.includes('"__proto__"') || text.includes('"constructor"') || text.includes('"prototype"')) {
          throw new Error('Berkas cadangan ditolak: terdeteksi pola payload tidak aman (Prototype Pollution hazard).');
        }

        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Format berkas tidak valid.');
        }

        // Deep prototype safety check
        const hasPrototypePollution = (obj: any): boolean => {
          if (!obj || typeof obj !== 'object') return false;
          for (const key of Object.getOwnPropertyNames(obj)) {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') return true;
            if (typeof obj[key] === 'object' && hasPrototypePollution(obj[key])) return true;
          }
          return false;
        };

        if (hasPrototypePollution(parsed)) {
          throw new Error('Berkas terdeteksi memiliki struktur objek berbahaya.');
        }

        let validBackup: OhMyCashierBackupData;
        if (parsed.data && parsed.data.products && Array.isArray(parsed.data.products)) {
          validBackup = parsed as OhMyCashierBackupData;
        } else if (Array.isArray(parsed.products) || Array.isArray(parsed.orders)) {
          validBackup = {
            app: typeof parsed.app === 'string' ? parsed.app : 'Oh My Cashier',
            version: typeof parsed.version === 'string' ? parsed.version : '1.26.6',
            exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
            metadata: {
              storeName: typeof parsed.settings?.storeName === 'string' ? parsed.settings.storeName : 'Oh My Cashier',
              branchName: typeof parsed.settings?.branchName === 'string' ? parsed.settings.branchName : 'Cabang',
              productsCount: Array.isArray(parsed.products) ? parsed.products.length : 0,
              categoriesCount: Array.isArray(parsed.categories) ? parsed.categories.length : 0,
              customersCount: Array.isArray(parsed.customers) ? parsed.customers.length : 0,
              ingredientsCount: Array.isArray(parsed.ingredients) ? parsed.ingredients.length : 0,
              ordersCount: Array.isArray(parsed.orders) ? parsed.orders.length : 0,
            },
            data: {
              products: Array.isArray(parsed.products) ? parsed.products : [],
              categories: Array.isArray(parsed.categories) ? parsed.categories : [],
              customers: Array.isArray(parsed.customers) ? parsed.customers : [],
              ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
              orders: Array.isArray(parsed.orders) ? parsed.orders : [],
              shift: parsed.shift || ({} as any),
              settings: parsed.settings || formData,
            },
          };
        } else {
          throw new Error('Berkas JSON tidak berisi struktur data Oh My Cashier / Kasgo yang sah.');
        }

        setPendingRestoreData(validBackup);
        setImportError(null);
      } catch (err: any) {
        setImportError(err.message || 'Gagal membaca berkas cadangan JSON.');
        playSound('beep');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = (restoreData: OhMyCashierBackupData) => {
    if (onRestoreFullDatabase) {
      onRestoreFullDatabase(restoreData);
      setFormData(restoreData.data.settings || formData);
      playSound('chime_ready');
      showToast('Seluruh basis data berhasil dipulihkan dari berkas .json!');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Top Header */}
      <div className="p-4 bg-white border-b border-zinc-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2 font-mono">
            <span className="text-emerald-500 font-bold">➜</span>
            <Settings className="w-5 h-5 text-rose-600" />
            <span>Pengaturan Toko & Printer Struk</span>
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            ~/.oh-my-cashier/config.json • profil outlet, pajak PPN, format nota kasir, dan printer thermal.
          </p>
        </div>

        {savedSuccess && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>git:(config-saved ✔)</span>
          </span>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto max-w-4xl space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card 1: Profil Usaha */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Store className="w-4 h-4 text-rose-600" />
              <span>Profil Usaha & Outlet</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Nama Toko / Resto *</label>
                <input
                  type="text"
                  required
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Nama Cabang / Outlet</label>
                <input
                  type="text"
                  value={formData.branchName}
                  onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="font-bold text-zinc-700 block mb-1">Alamat Lengkap Toko</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">No. WhatsApp / Telepon</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Pengaturan Printer Thermal */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-rose-600" />
                <span>Pengaturan Printer Thermal Struk (ESC/POS & TSPL)</span>
              </h3>
              <button
                type="button"
                onClick={onTestPrint}
                className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer font-mono"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Tes Cetak Nota</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Ukuran Kertas Kasir</label>
                <select
                  value={formData.paperWidth}
                  onChange={(e) =>
                    setFormData({ ...formData, paperWidth: e.target.value as '58mm' | '80mm' })
                  }
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none bg-white text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                >
                  <option value="58mm">58 mm (Printer Portabel Kecil)</option>
                  <option value="80mm">80 mm (Printer Desktop Standard)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Protokol Driver Printer</label>
                <select
                  value={formData.printerType}
                  onChange={(e) =>
                    setFormData({ ...formData, printerType: e.target.value as 'ESC/POS' | 'TSPL' })
                  }
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none bg-white text-xs font-semibold focus:ring-2 focus:ring-rose-500"
                >
                  <option value="ESC/POS">ESC / POS (Standar Thermal Kasir)</option>
                  <option value="TSPL">TSPL (Label & Barcode Thermal)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Status Koneksi Bluetooth</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-950 rounded-lg border border-zinc-800 text-zinc-200 font-mono font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <Bluetooth className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs">BT-Printer (Siap)</span>
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-zinc-700 block mb-1 text-xs">
                Pesan Penutup Nota (Receipt Footer)
              </label>
              <textarea
                rows={3}
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none text-xs focus:ring-2 focus:ring-rose-500 font-mono"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Pesan ini akan dicetak di bagian paling bawah struk pembayaran pelanggan.
              </p>
            </div>
          </div>

          {/* Card 3: Pajak & Biaya Layanan */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Percent className="w-4 h-4 text-rose-600" />
              <span>Pajak (PPN) & Biaya Layanan</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl border border-zinc-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-zinc-800 block">Terapkan Pajak Resto (PPN)</span>
                  <span className="text-[11px] text-zinc-400">Tambahkan PPN {formData.taxRate}% ke setiap pesanan</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enableTax}
                  onChange={(e) => setFormData({ ...formData, enableTax: e.target.checked })}
                  className="w-4 h-4 text-rose-600 accent-rose-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Tarif PPN (%)</label>
                <input
                  type="number"
                  disabled={!formData.enableTax}
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none font-mono disabled:bg-zinc-100 focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Card: Lisensi & Kunci Aktivasi Perangkat */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <Key className="w-4 h-4 text-rose-600" />
                <span>Lisensi & Kunci Aktivasi Perangkat</span>
              </h3>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded font-mono font-bold tracking-wider flex items-center gap-1 ${
                  licenseInfo.isActivated
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
              >
                {licenseInfo.isActivated ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>git:(pro-{licenseInfo.tier.toLowerCase()} ✔)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                    <span>git:(trial-mode ✗)</span>
                  </>
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1.5 text-zinc-200">
                <span className="text-[11px] font-mono text-zinc-400 block flex items-center gap-1">
                  <span className="text-emerald-400">➜</span> ID Perangkat (Device ID):
                </span>
                <span className="font-mono font-bold text-xs sm:text-sm text-cyan-300 block select-all tracking-wide">
                  {licenseInfo.deviceId}
                </span>
                <p className="text-[10px] text-zinc-400 font-mono">
                  Kriptografi SHA-256 terikat erat ke hardware ID perangkat kasir ini.
                </p>
              </div>

              <div className="flex flex-col justify-between p-3.5 bg-zinc-900 rounded-xl border border-zinc-800 space-y-2">
                <div>
                  <span className="font-bold text-zinc-100 font-mono block">Status Fitur:</span>
                  <span className="text-[11px] text-zinc-300 font-mono">
                    {licenseInfo.isActivated
                      ? licenseInfo.expiresAt
                        ? `Pro License (Berlaku s/d ${licenseInfo.expiresAt})`
                        : 'Lifetime Permanent License (Tanpa Batasan)'
                      : 'Trial Mode (Batas hingga 50 transaksi)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowActivationModal(true)}
                  className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-lg font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono"
                >
                  <span className="text-emerald-300 font-bold">➜</span>
                  <Key className="w-3.5 h-3.5 text-amber-300" />
                  <span>{licenseInfo.isActivated ? 'Kelola / Perpanjang Lisensi' : 'Masukkan Kunci Aktivasi'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: Keamanan & PIN Supervisor */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2 border-b border-zinc-100 pb-3">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Keamanan & PIN Otorisasi Supervisor</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">
                  PIN Supervisor / Manajer (4 Digit)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={formData.supervisorPin || '1234'}
                  onChange={(e) => setFormData({ ...formData, supervisorPin: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg outline-none font-mono font-bold text-sm tracking-widest focus:ring-2 focus:ring-rose-500"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  PIN ini diminta saat kasir membatalkan transaksi (void), menghapus produk, atau mereset data.
                </p>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex flex-col justify-center text-zinc-300 font-mono">
                <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                  <span>✔</span> Proteksi Supervisor Aktif
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5 font-sans">
                  Setiap pembatalan transaksi di Riwayat Pesanan otomatis mewajibkan otorisasi PIN manajer ini untuk mencegah kecurangan (fraud).
                </p>
              </div>
            </div>
          </div>

          {/* Card 5: Cadangan & Pemulihan Basis Data Lengkap (.json) */}
          <div className="bg-white p-5 rounded-2xl border-2 border-zinc-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-rose-600" />
                <span>Cadangan & Pemulihan Basis Data Lengkap (.json)</span>
              </h3>
              <span className="text-[10px] bg-zinc-950 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded border border-zinc-800">
                oh-my-cashier v1.26.6
              </span>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed font-mono">
              ~/.oh-my-cashier/backup • Cadangkan seluruh data operasional toko Anda (katalog produk, resep bahan baku, pelanggan, riwayat transaksi, shift kasir, dan pengaturan) ke dalam satu berkas format <b>.json</b>.
            </p>

            {/* Live Database Snapshot Pills */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
              <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800 text-center text-zinc-200">
                <span className="text-[10px] text-zinc-400 block font-mono">Menu</span>
                <strong className="font-mono text-rose-400 font-bold">{products.length}</strong>
              </div>
              <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800 text-center text-zinc-200">
                <span className="text-[10px] text-zinc-400 block font-mono">Kategori</span>
                <strong className="font-mono text-cyan-400 font-bold">{categories.length}</strong>
              </div>
              <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800 text-center text-zinc-200">
                <span className="text-[10px] text-zinc-400 block font-mono">Pelanggan</span>
                <strong className="font-mono text-purple-400 font-bold">{customers.length}</strong>
              </div>
              <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800 text-center text-zinc-200">
                <span className="text-[10px] text-zinc-400 block font-mono">Bahan Baku</span>
                <strong className="font-mono text-amber-400 font-bold">{ingredients.length}</strong>
              </div>
              <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800 text-center text-zinc-200">
                <span className="text-[10px] text-zinc-400 block font-mono">Transaksi</span>
                <strong className="font-mono text-emerald-400 font-bold">{orders.length}</strong>
              </div>
              <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800 text-center text-zinc-200">
                <span className="text-[10px] text-zinc-400 block font-mono">Shift</span>
                <strong className="font-mono text-rose-300 font-bold">{activeShift?.status || 'Open'}</strong>
              </div>
            </div>

            {/* Error banner if file parsing failed */}
            {importError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between font-mono">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{importError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setImportError(null)}
                  className="text-rose-500 hover:text-rose-700 font-bold text-xs"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* Action Grid: Export & Import */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Export Button Card */}
              <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 flex flex-col justify-between text-zinc-200">
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs text-zinc-100 font-mono">
                    <span className="text-emerald-400">➜</span>
                    <Download className="w-4 h-4 text-rose-400" />
                    <span>Ekspor Cadangan Lengkap (.json)</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Unduh satu berkas JSON berisi seluruh basis data aplikasi secara instan untuk disimpan sebagai arsip cadangan.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer font-mono"
                >
                  <FileJson className="w-4 h-4" />
                  <span>Unduh Cadangan (.json)</span>
                </button>
              </div>

              {/* Import Button Card */}
              <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 flex flex-col justify-between text-zinc-200">
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs text-zinc-100 font-mono">
                    <span className="text-emerald-400">➜</span>
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Pulihkan Basis Data dari Berkas (.json)</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    Pilih berkas cadangan JSON yang pernah diunduh sebelumnya untuk memulihkan seluruh data toko ke perangkat ini.
                  </p>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 border border-zinc-700 shadow-2xs transition-colors cursor-pointer font-mono"
                  >
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Pilih Berkas Cadangan (.json)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Factory Reset Section */}
            {onResetData && (
              <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-400">
                  Ingin menghapus seluruh transaksi demo dan kembali ke data awal toko?
                </span>
                <button
                  type="button"
                  onClick={() => setShowResetPinModal(true)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors flex items-center gap-1 shrink-0 cursor-pointer font-mono"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset ke Data Bawaan (Perlu PIN)</span>
                </button>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="py-3 px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-colors cursor-pointer font-mono"
            >
              <span className="text-emerald-300 font-bold">➜</span>
              <Save className="w-4 h-4" />
              <span>Simpan Seluruh Pengaturan</span>
            </button>
          </div>
        </form>

        {/* Supervisor PIN confirmation modal for reset */}
        {showResetPinModal && onResetData && (
          <SupervisorPinModal
            correctPin={formData.supervisorPin || '1234'}
            actionTitle="Otorisasi Reset Data Toko"
            actionDescription="Peringatan: Seluruh data penjualan dan perubahan produk akan dihapus dan dikembalikan ke data awal. Masukkan PIN Supervisor untuk melanjutkan."
            onSuccess={() => {
              setShowResetPinModal(false);
              onResetData();
            }}
            onClose={() => setShowResetPinModal(false)}
          />
        )}

        {/* Restore Preview Modal */}
        {pendingRestoreData && (
          <RestorePreviewModal
            backupData={pendingRestoreData}
            onClose={() => setPendingRestoreData(null)}
            onConfirmRestore={handleConfirmRestore}
          />
        )}

        {/* License Activation & Keygen Modal */}
        {showActivationModal && (
          <ActivationModal
            licenseInfo={licenseInfo}
            onUpdateLicense={onUpdateLicense}
            onClose={() => setShowActivationModal(false)}
            supervisorPin={formData.supervisorPin || '1234'}
            storeName={formData.storeName || 'Oh My Cashier'}
          />
        )}

        {/* Floating Toast Notification */}
        {toastMsg && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl border border-gray-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
