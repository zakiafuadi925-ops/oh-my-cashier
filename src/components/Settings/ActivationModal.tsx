import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Copy,
  Check,
  Smartphone,
  Calendar,
  Lock,
  Sparkles,
  ExternalLink,
  RefreshCw,
  X,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { LicenseInfo, LicenseTier } from '../../types';
import {
  verifyActivationKey,
  generateActivationKey,
  saveLicenseInfo,
} from '../../utils/license';
import { playSound } from '../../utils/audio';
import { SupervisorPinModal } from '../Auth/SupervisorPinModal';

interface ActivationModalProps {
  licenseInfo: LicenseInfo;
  onUpdateLicense: (newLicense: LicenseInfo) => void;
  onClose: () => void;
  supervisorPin: string;
  storeName: string;
}

export const ActivationModal: React.FC<ActivationModalProps> = ({
  licenseInfo,
  onUpdateLicense,
  onClose,
  supervisorPin,
  storeName,
}) => {
  const [activeTab, setActiveTab] = useState<'activate' | 'keygen'>('activate');
  const [inputKey, setInputKey] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedDevice, setCopiedDevice] = useState(false);

  // Keygen Admin states (Protected by Supervisor PIN)
  const [isKeygenUnlocked, setIsKeygenUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [targetDeviceId, setTargetDeviceId] = useState(licenseInfo.deviceId);
  const [genTier, setGenTier] = useState<LicenseTier>('Lifetime');
  const [genExpOption, setGenExpOption] = useState<'1month' | '1year' | 'lifetime'>('lifetime');
  const [generatedKeyResult, setGeneratedKeyResult] = useState<string | null>(null);
  const [copiedGenKey, setCopiedGenKey] = useState(false);

  const handleCopyDeviceId = () => {
    navigator.clipboard.writeText(licenseInfo.deviceId);
    setCopiedDevice(true);
    playSound('beep');
    setTimeout(() => setCopiedDevice(false), 2000);
  };

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const key = inputKey.trim().toUpperCase();
    if (!key) {
      setErrorMsg('Masukkan kode lisensi aktivasi.');
      playSound('beep');
      return;
    }

    const result = verifyActivationKey(key, licenseInfo.deviceId);
    if (!result.isValid) {
      setErrorMsg(result.errorMessage || 'Kunci aktivasi tidak valid.');
      playSound('beep');
      return;
    }

    // Success
    const updated: LicenseInfo = {
      isActivated: true,
      deviceId: licenseInfo.deviceId,
      licenseKey: key,
      tier: result.tier,
      activatedAt: new Date().toISOString(),
      expiresAt: result.expiresAt,
      registeredStore: storeName,
    };

    saveLicenseInfo(updated);
    onUpdateLicense(updated);
    playSound('chime_ready');
    setSuccessMsg(`Aktivasi Berhasil! Lisensi ${result.tier} aktif pada perangkat ini.`);
  };

  const handleGenerateKey = () => {
    let expDate: string | null = null;
    if (genExpOption === '1month') {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      expDate = d.toISOString().slice(0, 10);
    } else if (genExpOption === '1year') {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      expDate = d.toISOString().slice(0, 10);
    } // lifetime is null

    const key = generateActivationKey({
      deviceId: targetDeviceId,
      tier: genTier,
      expiresAt: expDate,
    });

    setGeneratedKeyResult(key);
    playSound('chime_ready');
  };

  const handleApplyGeneratedKeyDirectly = () => {
    if (!generatedKeyResult) return;
    setInputKey(generatedKeyResult);
    setActiveTab('activate');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh] border border-zinc-800">
        {/* Header - Oh My Zsh Terminal aesthetic */}
        <div className="p-4 sm:p-5 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner text-rose-500">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-mono text-xs font-black">➜</span>
                <h3 className="font-bold text-sm sm:text-base text-zinc-100 font-mono tracking-tight">lisensi@omc-pos</h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold tracking-wider ${
                    licenseInfo.isActivated
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  git:({licenseInfo.isActivated ? `pro-${licenseInfo.tier.toLowerCase()} ✔` : 'trial ✗'})
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                ~/.oh-my-cashier/license-verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-200 bg-zinc-100 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('activate')}
            className={`flex-1 py-3 px-4 text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'activate'
                ? 'border-rose-600 text-rose-600 bg-white font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-rose-600" />
            <span>Aktivasi Perangkat</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isKeygenUnlocked) {
                setShowPinModal(true);
              } else {
                setActiveTab('keygen');
              }
            }}
            className={`flex-1 py-3 px-4 text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'keygen'
                ? 'border-rose-600 text-rose-600 bg-white font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-zinc-600" />
            <span>Generator Kunci (Owner)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {activeTab === 'activate' ? (
            <>
              {/* Current Status Box */}
              <div
                className={`p-4 rounded-2xl border ${
                  licenseInfo.isActivated
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {licenseInfo.isActivated ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm font-mono text-zinc-100 flex items-center gap-2">
                        <span>{licenseInfo.isActivated ? `PRO LICENSE (${licenseInfo.tier})` : 'TRIAL MODE'}</span>
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                        {licenseInfo.isActivated
                          ? licenseInfo.expiresAt
                            ? `expires: ${licenseInfo.expiresAt}`
                            : 'status: lifetime-permanent (unlimited)'
                          : 'status: limited-trial (aktivasi diperlukan untuk transaksi tanpa batas)'}
                      </p>
                    </div>
                  </div>
                  {licenseInfo.isActivated && (
                    <Award className="w-6 h-6 text-amber-400 shrink-0" />
                  )}
                </div>

                {licenseInfo.licenseKey && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-800 font-mono text-xs flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">Kunci Aktif:</span>
                    <span className="font-bold text-emerald-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 select-all">
                      {licenseInfo.licenseKey}
                    </span>
                  </div>
                )}
              </div>

              {/* Hardware Device Fingerprint Card */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 font-mono">
                    <span className="text-emerald-400">➜</span>
                    <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                    <span>ID Perangkat (Hardware Fingerprint):</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyDeviceId}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg hover:bg-zinc-800 active:scale-95 transition-all font-mono"
                  >
                    {copiedDevice ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin ID</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono font-bold text-sm text-cyan-300 bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-800 select-all tracking-wider">
                  {licenseInfo.deviceId}
                </div>
                <p className="text-[11px] text-zinc-400 mt-2 font-mono">
                  Berikan ID di atas ke administrator untuk di-generate menjadi kunci aktivasi resmi.
                </p>
              </div>

              {/* Form Input Key */}
              <form onSubmit={handleActivate} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1">
                    Masukkan Kunci Aktivasi:
                  </label>
                  <input
                    type="text"
                    value={inputKey}
                    onChange={(e) => {
                      setInputKey(e.target.value.toUpperCase());
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Contoh: OMC-LIFE-PERM99-8A1C-7F2B..."
                    className="w-full px-3.5 py-2.5 font-mono text-xs sm:text-sm font-bold border border-zinc-300 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 uppercase tracking-widest text-zinc-900"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-xs font-semibold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer font-mono"
                >
                  <span className="text-emerald-300 font-bold">➜</span>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Validasi & Aktifkan Lisensi</span>
                </button>
              </form>
            </>
          ) : (
            /* Keygen Section (Admin / Developer tool) */
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-zinc-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-zinc-100 font-mono">➜ Generator Kunci Lisensi (Supervisor)</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Membuat kunci aktivasi berotentikasi digital dengan algoritma kriptografi yang terikat erat ke Device ID target.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-zinc-700">
                      Target Device ID Kasir:
                    </label>
                    <button
                      type="button"
                      onClick={() => setTargetDeviceId(licenseInfo.deviceId)}
                      className="text-[10px] text-rose-600 font-semibold underline hover:text-rose-700"
                    >
                      Pakai Device ID Ini
                    </button>
                  </div>
                  <input
                    type="text"
                    value={targetDeviceId}
                    onChange={(e) => setTargetDeviceId(e.target.value.toUpperCase())}
                    placeholder="Contoh: OMC-B38E-71A2-9901"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl font-mono text-xs font-bold text-zinc-800 outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">
                      Tipe Paket Lisensi:
                    </label>
                    <select
                      value={genTier}
                      onChange={(e) => setGenTier(e.target.value as LicenseTier)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="Lifetime">Lifetime (Seumur Hidup)</option>
                      <option value="Pro">Pro (Tahunan / Bulanan)</option>
                      <option value="Enterprise">Enterprise Multi-Outlet</option>
                      <option value="Trial">Trial Tambahan</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1">
                      Masa Berlaku:
                    </label>
                    <select
                      value={genExpOption}
                      onChange={(e) => setGenExpOption(e.target.value as any)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="lifetime">Permanen (Tanpa Batas)</option>
                      <option value="1year">1 Tahun (365 Hari)</option>
                      <option value="1month">1 Bulan (30 Hari)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateKey}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow flex items-center justify-center gap-1.5 cursor-pointer font-mono"
                >
                  <span className="text-emerald-300">➜</span>
                  <Key className="w-3.5 h-3.5 text-amber-300" />
                  <span>Generate Kunci Lisensi</span>
                </button>
              </div>

              {generatedKeyResult && (
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                    <span className="font-mono text-emerald-400">➜ Kunci Aktivasi Resmi Dibuat:</span>
                    <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-mono font-bold">
                      {genTier}
                    </span>
                  </div>

                  <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 font-mono font-black text-xs text-emerald-400 break-all select-all tracking-wider text-center">
                    {generatedKeyResult}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedKeyResult);
                        setCopiedGenKey(true);
                        setTimeout(() => setCopiedGenKey(false), 2000);
                      }}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer font-mono"
                    >
                      {copiedGenKey ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedGenKey ? 'Tersalin!' : 'Salin Kunci'}</span>
                    </button>
                    {targetDeviceId === licenseInfo.deviceId && (
                      <button
                        type="button"
                        onClick={handleApplyGeneratedKeyDirectly}
                        className="py-2 px-3 bg-zinc-900 border border-zinc-700 text-zinc-200 hover:bg-zinc-800 rounded-lg text-xs font-bold font-mono cursor-pointer"
                      >
                        Terapkan ke Sini
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span className="text-[11px] text-zinc-500">oh-my-cashier security-core v1.26</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl font-bold text-zinc-200 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Supervisor PIN Modal for Keygen protection */}
      {showPinModal && (
        <SupervisorPinModal
          correctPin={supervisorPin || '1234'}
          actionTitle="Otorisasi Akses Generator Kunci"
          actionDescription="Halaman pembuatan kunci aktivasi hanya dapat diakses oleh Pemilik / Supervisor toko."
          onSuccess={() => {
            setIsKeygenUnlocked(true);
            setShowPinModal(false);
            setActiveTab('keygen');
          }}
          onClose={() => setShowPinModal(false)}
        />
      )}
    </div>
  );
};
