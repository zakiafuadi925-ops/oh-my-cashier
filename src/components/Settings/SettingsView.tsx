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
  AppTheme,
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
  Palette,
  Zap,
  Sparkles,
  Share2,
  Copy,
  Clipboard,
  Trash2,
  History,
  HardDrive,
} from 'lucide-react';
import { SupervisorPinModal } from '../Auth/SupervisorPinModal';
import { RestorePreviewModal } from './RestorePreviewModal';
import { ActivationModal } from './ActivationModal';
import { PasteJsonModal } from './PasteJsonModal';
import {
  buildBackupPayload,
  exportJsonData,
  copyBackupToClipboard,
  getLocalSnapshots,
  saveLocalSnapshot,
  deleteLocalSnapshot,
  validateBackupJson,
} from '../../utils/mobileStorage';
import { LocalSnapshot } from '../../types';

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
  theme?: AppTheme;
  onThemeChange?: (newTheme: AppTheme) => void;
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
  theme = 'cyberpunk',
  onThemeChange,
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
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [localSnapshots, setLocalSnapshots] = useState<LocalSnapshot[]>(() => getLocalSnapshots());
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const getCurrentBackupPayload = () => {
    return buildBackupPayload({
      products,
      categories,
      customers,
      ingredients,
      orders,
      activeShift,
      settings: formData,
    });
  };

  const handleExportBackup = async (method: 'auto' | 'share' | 'download' = 'auto') => {
    try {
      setIsExporting(true);
      const backup = getCurrentBackupPayload();
      const result = await exportJsonData(backup, method);
      setLocalSnapshots(getLocalSnapshots());
      playSound('chime_ready');
      showToast(result.message);
    } catch (err: any) {
      console.error(err);
      showToast('Gagal mengekspor data cadangan JSON.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyJson = async () => {
    try {
      const backup = getCurrentBackupPayload();
      const success = await copyBackupToClipboard(backup);
      if (success) {
        playSound('beep');
        showToast('Teks cadangan JSON berhasil disalin ke papan klip (clipboard)!');
      } else {
        showToast('Gagal menyalin data ke clipboard.');
      }
    } catch (err) {
      showToast('Gagal menyalin data ke clipboard.');
    }
  };

  const handleCreateManualSnapshot = () => {
    try {
      const backup = getCurrentBackupPayload();
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const updated = saveLocalSnapshot(backup, `Snapshot Manual (${timeStr})`);
      setLocalSnapshots(updated);
      playSound('chime_ready');
      showToast('Snapshot lokal berhasil disimpan secara offline!');
    } catch {
      showToast('Gagal membuat snapshot lokal.');
    }
  };

  const handleDeleteSnapshot = (id: string) => {
    const updated = deleteLocalSnapshot(id);
    setLocalSnapshots(updated);
    playSound('beep');
    showToast('Snapshot lokal berhasil dihapus.');
  };

  const handleRestoreSnapshot = (snapshot: LocalSnapshot) => {
    setPendingRestoreData(snapshot.backup);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        const validation = validateBackupJson(text);
        if (!validation.valid || !validation.data) {
          throw new Error(validation.error || 'Format berkas cadangan JSON tidak valid.');
        }

        setPendingRestoreData(validation.data);
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
      // Auto-save a safety snapshot of current data before overwriting
      try {
        const currentBackup = getCurrentBackupPayload();
        const updated = saveLocalSnapshot(currentBackup, 'Auto-Snapshot Sebelum Restore');
        setLocalSnapshots(updated);
      } catch (e) {
        console.warn('Failed to take pre-restore snapshot:', e);
      }

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
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-mono">
            <span className="text-emerald-400 font-bold">➜</span>
            <Settings className="w-5 h-5 text-orange-400" />
            <span>Pengaturan Toko & Printer Struk</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            ~/.oh-my-cashier/config.json • profil outlet, pajak PPN, format nota kasir, dan printer thermal.
          </p>
        </div>

        {savedSuccess && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>git:(config-saved ✔)</span>
          </span>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto max-w-4xl space-y-4">
        {/* Card 0: Tema Antarmuka (Cyberpunk / Slate) */}
        {onThemeChange && (
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Palette className="w-4 h-4 text-orange-400" />
                <span>Tema & Tampilan Antarmuka (UI Theme)</span>
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
                Mode:{' '}
                <strong className={theme === 'cyberpunk' ? 'text-[#8b5cf6]' : 'text-orange-400'}>
                  {theme === 'cyberpunk' ? 'Cyberpunk (Zack)' : 'Slate Neutral'}
                </strong>
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Pilih gaya visual antarmuka sistem kasir. Perubahan tema langsung tersinkronisasi ke seluruh layar POS, KDS, dan laporan.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Option 1: Cyberpunk Zack */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  onThemeChange('cyberpunk');
                  playSound('beep');
                  showToast('Tema Cyberpunk Zack diaktifkan');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onThemeChange('cyberpunk');
                    playSound('beep');
                  }
                }}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all relative select-none ${
                  theme === 'cyberpunk'
                    ? 'bg-[#0b0f19] border-[#8b5cf6] ring-2 ring-[#8b5cf6]/40 cyberpunk-glow-purple shadow-lg'
                    : 'bg-slate-900/80 border-slate-700 hover:border-slate-500 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#111827] border border-[#8b5cf6]/60 flex items-center justify-center text-[#8b5cf6]">
                      <Zap className="w-4 h-4 text-[#10b981] fill-[#10b981]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#f3f4f6] flex items-center gap-1.5">
                        Cyberpunk (Zack)
                      </h4>
                      <span className="text-[10px] font-mono text-[#9ca3af]">Config: colors.zack</span>
                    </div>
                  </div>
                  {theme === 'cyberpunk' && (
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#8b5cf6]/20 text-[#8b5cf6] border border-[#8b5cf6]/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] inline-block" />
                      Aktif
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-[#9ca3af] leading-relaxed mb-3">
                  Gelap pekat, kontainer navy malam, aksen ungu elektrik (highlight & ikon), serta indikator hijau neon.
                </p>

                {/* Color swatches */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-[#1f2937]">
                  <span className="text-[10px] text-slate-500 font-mono mr-1">Palet:</span>
                  <span className="w-4 h-4 rounded-full border border-slate-700 bg-[#0b0f19] shadow-xs" title="darkBg: #0b0f19" />
                  <span className="w-4 h-4 rounded-full border border-slate-700 bg-[#111827] shadow-xs" title="cardBg: #111827" />
                  <span className="w-4 h-4 rounded-full border border-slate-600 bg-[#1f2937] shadow-xs" title="border: #1f2937" />
                  <span className="w-4 h-4 rounded-full border border-purple-400 bg-[#8b5cf6] shadow-xs" title="accentPurple: #8b5cf6" />
                  <span className="w-4 h-4 rounded-full border border-emerald-400 bg-[#10b981] shadow-xs" title="accentGreen: #10b981" />
                </div>
              </div>

              {/* Option 2: Slate Dark Classic */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  onThemeChange('slate');
                  playSound('beep');
                  showToast('Tema Slate Neutral diaktifkan');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onThemeChange('slate');
                    playSound('beep');
                  }
                }}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all relative select-none ${
                  theme === 'slate'
                    ? 'bg-slate-900 border-orange-500 ring-2 ring-orange-500/40 shadow-lg'
                    : 'bg-slate-900/80 border-slate-700 hover:border-slate-500 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-orange-400">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        Slate Dark Neutral
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">Standar Slate & Orange</span>
                    </div>
                  </div>
                  {theme === 'slate' && (
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      Aktif
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  Warna Slate seimbang dan minimalis dengan aksen tombol aksi oranye kontras khas Oh My Cashier.
                </p>

                {/* Color swatches */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 font-mono mr-1">Palet:</span>
                  <span className="w-4 h-4 rounded-full border border-slate-700 bg-slate-900 shadow-xs" title="Slate 900: #0f172a" />
                  <span className="w-4 h-4 rounded-full border border-slate-700 bg-slate-800 shadow-xs" title="Slate 800: #1e293b" />
                  <span className="w-4 h-4 rounded-full border border-slate-600 bg-slate-700 shadow-xs" title="Slate 700: #334155" />
                  <span className="w-4 h-4 rounded-full border border-orange-400 bg-orange-500 shadow-xs" title="Brand Orange: #f97316" />
                  <span className="w-4 h-4 rounded-full border border-emerald-400 bg-emerald-500 shadow-xs" title="Status Green: #10b981" />
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card 1: Profil Usaha */}
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2 border-b border-slate-700/80 pb-3">
              <Store className="w-4 h-4 text-orange-400" />
              <span>Profil Usaha & Outlet</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Nama Toko / Resto *</label>
                <input
                  type="text"
                  required
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Nama Cabang / Outlet</label>
                <input
                  type="text"
                  value={formData.branchName}
                  onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="font-bold text-slate-300 block mb-1">Alamat Lengkap Toko</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">No. WhatsApp / Telepon</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Pengaturan Printer Thermal */}
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-orange-400" />
                <span>Pengaturan Printer Thermal Struk (ESC/POS & TSPL)</span>
              </h3>
              <button
                type="button"
                onClick={onTestPrint}
                className="text-xs font-bold text-slate-200 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg border border-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer font-mono"
              >
                <Printer className="w-3.5 h-3.5 text-orange-400" />
                <span>Tes Cetak Nota</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Ukuran Kertas Kasir</label>
                <select
                  value={formData.paperWidth}
                  onChange={(e) =>
                    setFormData({ ...formData, paperWidth: e.target.value as '58mm' | '80mm' })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg outline-none text-slate-100 text-xs font-semibold focus:border-orange-500"
                >
                  <option value="58mm">58 mm (Printer Portabel Kecil)</option>
                  <option value="80mm">80 mm (Printer Desktop Standard)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Protokol Driver Printer</label>
                <select
                  value={formData.printerType}
                  onChange={(e) =>
                    setFormData({ ...formData, printerType: e.target.value as 'ESC/POS' | 'TSPL' })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg outline-none text-slate-100 text-xs font-semibold focus:border-orange-500"
                >
                  <option value="ESC/POS">ESC / POS (Standar Thermal Kasir)</option>
                  <option value="TSPL">TSPL (Label & Barcode Thermal)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Status Koneksi Bluetooth</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 rounded-lg border border-slate-700 text-slate-200 font-mono font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <Bluetooth className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs">BT-Printer (Siap)</span>
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1 text-xs">
                Pesan Penutup Nota (Receipt Footer)
              </label>
              <textarea
                rows={3}
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg outline-none text-xs focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono text-slate-100"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Pesan ini akan dicetak di bagian paling bawah struk pembayaran pelanggan.
              </p>
            </div>
          </div>

          {/* Card 3: Pajak & Biaya Layanan */}
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2 border-b border-slate-700/80 pb-3">
              <Percent className="w-4 h-4 text-orange-400" />
              <span>Pajak (PPN) & Biaya Layanan</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block">Terapkan Pajak Resto (PPN)</span>
                  <span className="text-[11px] text-slate-400">Tambahkan PPN {formData.taxRate}% ke setiap pesanan</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enableTax}
                  onChange={(e) => setFormData({ ...formData, enableTax: e.target.checked })}
                  className="w-4 h-4 text-orange-500 accent-orange-500 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Tarif PPN (%)</label>
                <input
                  type="number"
                  disabled={!formData.enableTax}
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg outline-none font-mono disabled:bg-slate-900 disabled:text-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Card: Lisensi & Kunci Aktivasi Perangkat */}
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Key className="w-4 h-4 text-orange-400" />
                <span>Lisensi & Kunci Aktivasi Perangkat</span>
              </h3>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded font-mono font-bold tracking-wider flex items-center gap-1 ${
                  licenseInfo.isActivated
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950/60 text-amber-300 border border-amber-800/80'
                }`}
              >
                {licenseInfo.isActivated ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>git:(pro-{licenseInfo.tier.toLowerCase()} ✔)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    <span>git:(trial-mode ✗)</span>
                  </>
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-700 space-y-1.5 text-slate-200">
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <span className="text-emerald-400">➜</span> ID Perangkat (Device ID):
                </span>
                <span className="font-mono font-bold text-xs sm:text-sm text-cyan-300 block select-all tracking-wide">
                  {licenseInfo.deviceId}
                </span>
                <p className="text-[10px] text-slate-400 font-mono">
                  Kriptografi SHA-256 terikat erat ke hardware ID perangkat kasir ini.
                </p>
              </div>

              <div className="flex flex-col justify-between p-3.5 bg-slate-900 rounded-xl border border-slate-700 space-y-2">
                <div>
                  <span className="font-bold text-slate-100 font-mono block">Status Fitur:</span>
                  <span className="text-[11px] text-slate-300 font-mono">
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
                  className="w-full py-2 px-3 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white rounded-lg font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono"
                >
                  <span className="text-emerald-300 font-bold">➜</span>
                  <Key className="w-3.5 h-3.5 text-amber-200" />
                  <span>{licenseInfo.isActivated ? 'Kelola / Perpanjang Lisensi' : 'Masukkan Kunci Aktivasi'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: Keamanan & PIN Supervisor */}
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2 border-b border-slate-700/80 pb-3">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              <span>Keamanan & PIN Otorisasi Supervisor</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  PIN Supervisor / Manajer (4 Digit)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={formData.supervisorPin || '1234'}
                  onChange={(e) => setFormData({ ...formData, supervisorPin: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg outline-none font-mono font-bold text-sm tracking-widest focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  PIN ini diminta saat kasir membatalkan transaksi (void), menghapus produk, atau mereset data.
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-700 flex flex-col justify-center text-slate-300 font-mono">
                <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                  <span>✔</span> Proteksi Supervisor Aktif
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                  Setiap pembatalan transaksi di Riwayat Pesanan otomatis mewajibkan otorisasi PIN manajer ini untuk mencegah kecurangan (fraud).
                </p>
              </div>
            </div>
          </div>

          {/* Card 5: Cadangan & Pemulihan Basis Data Lengkap (.json) */}
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-orange-400" />
                <span>Cadangan & Pemulihan Basis Data Lengkap (.json)</span>
              </h3>
              <span className="text-[10px] bg-slate-950 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded border border-slate-700">
                oh-my-cashier v1.26.6
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              ~/.oh-my-cashier/backup • Cadangkan seluruh data operasional toko Anda (katalog produk, resep bahan baku, pelanggan, riwayat transaksi, shift kasir, dan pengaturan) ke dalam satu berkas format <b>.json</b>.
            </p>

            {/* Live Database Snapshot Pills */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-700 text-center text-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono">Menu</span>
                <strong className="font-mono text-orange-400 font-bold">{products.length}</strong>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-700 text-center text-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono">Kategori</span>
                <strong className="font-mono text-cyan-400 font-bold">{categories.length}</strong>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-700 text-center text-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono">Pelanggan</span>
                <strong className="font-mono text-purple-400 font-bold">{customers.length}</strong>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-700 text-center text-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono">Bahan Baku</span>
                <strong className="font-mono text-amber-400 font-bold">{ingredients.length}</strong>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-700 text-center text-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono">Transaksi</span>
                <strong className="font-mono text-emerald-400 font-bold">{orders.length}</strong>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-700 text-center text-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono">Shift</span>
                <strong className="font-mono text-orange-300 font-bold">{activeShift?.status || 'Open'}</strong>
              </div>
            </div>

            {/* Error banner if file parsing failed */}
            {importError && (
              <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center justify-between font-mono">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{importError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setImportError(null)}
                  className="text-rose-400 hover:text-rose-300 font-bold text-xs"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* Action Grid: Export & Import */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Export Button Card */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-700 space-y-3 flex flex-col justify-between text-slate-200">
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-100 font-mono">
                    <span className="text-emerald-400">➜</span>
                    <Download className="w-4 h-4 text-orange-400" />
                    <span>Ekspor Cadangan Lengkap (.json)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Mendukung ekspor langsung ke WhatsApp, Google Drive, File Manager (Android), atau unduh berkas offline.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  {/* Share / Save to Device */}
                  <button
                    type="button"
                    onClick={() => handleExportBackup('share')}
                    disabled={isExporting}
                    className="w-full py-2 px-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer font-mono active:scale-95"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Bagikan / Simpan ke Perangkat (.json)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleExportBackup('download')}
                      disabled={isExporting}
                      className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-mono text-[11px] font-semibold rounded-lg border border-slate-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-cyan-400" />
                      <span>Unduh File</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyJson}
                      className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-mono text-[11px] font-semibold rounded-lg border border-slate-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3 h-3 text-purple-400" />
                      <span>Salin JSON</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Import Button Card */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-700 space-y-3 flex flex-col justify-between text-slate-200">
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-100 font-mono">
                    <span className="text-emerald-400">➜</span>
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Pulihkan Basis Data (.json)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Pilih berkas .json atau tempel teks langsung (sangat praktis saat menerima data lewat WhatsApp di HP).
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json,text/plain,*/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 border border-slate-700 shadow-2xs transition-colors cursor-pointer font-mono active:scale-95"
                  >
                    <FileJson className="w-4 h-4 text-cyan-400" />
                    <span>Pilih Berkas Cadangan (.json)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPasteModal(true)}
                    className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-850 text-cyan-300 font-mono text-[11px] font-semibold rounded-lg border border-cyan-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>Tempel Teks JSON (Tanpa Berkas)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Offline Snapshots Section */}
            <div className="mt-3 p-3.5 bg-slate-950 rounded-xl border border-slate-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-400" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 font-mono">
                      Riwayat Snapshot Lokal (Offline Auto-Snapshots)
                    </h4>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Cadangan otomatis tersimpan di memori perangkat, siap dipulihkan seketika tanpa koneksi internet
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateManualSnapshot}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] font-mono font-semibold rounded-lg border border-emerald-500/30 flex items-center gap-1 shrink-0 cursor-pointer self-start sm:self-auto"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>+ Buat Snapshot Sekarang</span>
                </button>
              </div>

              {localSnapshots.length === 0 ? (
                <div className="py-4 text-center font-mono text-[11px] text-slate-500">
                  Belum ada snapshot lokal. Snapshot akan otomatis disimpan saat Anda melakukan ekspor atau pemulihan data.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {localSnapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">●</span>
                          <span className="font-semibold text-slate-200 truncate block">
                            {snap.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {snap.metadata.productsCount} Menu • {snap.metadata.ordersCount} Transaksi •{' '}
                          {new Date(snap.createdAt).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRestoreSnapshot(snap)}
                          className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Pulihkan
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSnapshot(snap.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer transition-colors"
                          title="Hapus Snapshot Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Factory Reset Section */}
            {onResetData && (
              <div className="pt-3 border-t border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  Ingin menghapus seluruh transaksi demo dan kembali ke data awal toko?
                </span>
                <button
                  type="button"
                  onClick={() => setShowResetPinModal(true)}
                  className="text-xs font-bold text-rose-300 hover:text-rose-200 bg-rose-500/20 hover:bg-rose-500/30 px-3 py-1.5 rounded-lg border border-rose-500/30 transition-colors flex items-center gap-1 shrink-0 cursor-pointer font-mono"
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
              className="py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-colors cursor-pointer font-mono active:scale-95"
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

        {/* Paste JSON Text Modal */}
        {showPasteModal && (
          <PasteJsonModal
            onClose={() => setShowPasteModal(false)}
            onConfirmJson={(data) => {
              setPendingRestoreData(data);
              setShowPasteModal(false);
            }}
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
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-slate-100 px-4 py-2 rounded-full text-xs font-semibold shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
