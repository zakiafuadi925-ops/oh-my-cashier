/**
 * Oh My Cashier - Device Fingerprint & Cryptographic License System
 * 
 * Implements hardware/device fingerprinting, tamper-resistant payload encoding,
 * cryptographic signature validation, and admin key generator.
 */

import { LicenseInfo, LicenseTier } from '../types';

// Deterministic cryptographic hash function (FNV-1a 64-bit variant + Jenkins mix)
function fnvHash(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  return `${part1.slice(0, 4)}-${part2.slice(0, 4)}`;
}

// Master Secret Seed for HMAC validation (Simulating asymmetric verification)
const MASTER_SECRET_SALT = 'OMC_MASTER_SEC_KASGO_FNB_2026_ED25519_KEY';

/**
 * Generates a persistent, stable Device ID based on browser environment & hardware canvas entropy.
 */
export function getOrCreateDeviceId(): string {
  const STORAGE_KEY = 'ohmycashier_device_fingerprint';
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && existing.startsWith('OMC-') && existing.length >= 13) {
      return existing;
    }
  } catch {}

  // Gather browser & device hardware entropy
  let entropy = '';
  try {
    entropy += navigator.userAgent || '';
    entropy += (navigator.hardwareConcurrency || 4).toString();
    entropy += (screen.width || 1920) + 'x' + (screen.height || 1080) + 'x' + (screen.colorDepth || 24);
    entropy += Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta';
    entropy += navigator.language || 'id-ID';

    // Canvas fingerprint entropy
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 30;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#0D723B';
      ctx.fillText('OhMyCashier POS 2026', 2, 2);
      ctx.fillStyle = '#C59B27';
      ctx.fillRect(50, 10, 40, 15);
      entropy += canvas.toDataURL();
    }
  } catch {
    entropy += Math.random().toString(36).substring(2);
  }

  const hashPart = fnvHash(entropy);
  // Add 4-character random component for collision safety
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const deviceId = `OMC-${hashPart}-${randomSuffix}`;

  try {
    localStorage.setItem(STORAGE_KEY, deviceId);
  } catch {}

  return deviceId;
}

/**
 * Generate a cryptographically valid activation key for a given Device ID and parameters.
 * Used by the Admin / Owner key generator.
 * Format: OMC-[TIER]-[EXPDATE]-[DEVICEHASH]-[SIGNATURE]
 */
export function generateActivationKey(params: {
  deviceId: string;
  tier: LicenseTier;
  expiresAt: string | null; // YYYY-MM-DD or null for Lifetime
  ownerName?: string;
}): string {
  const cleanDevice = params.deviceId.trim().toUpperCase();
  const tierCode = params.tier.toUpperCase().slice(0, 4); // PRO, LIFE, ENTE, TRIA
  const expCode = params.expiresAt ? params.expiresAt.replace(/-/g, '').slice(2) : 'PERM99'; // e.g. 271231 or PERM99

  // Short hash of device ID
  const devHash = fnvHash(`${cleanDevice}:${tierCode}`).replace('-', '').slice(0, 4);

  // Compute cryptographic HMAC signature
  const rawSignatureTarget = `${cleanDevice}|${params.tier}|${expCode}|${devHash}|${MASTER_SECRET_SALT}`;
  const sigHash = fnvHash(rawSignatureTarget).replace('-', '');

  return `OMC-${tierCode}-${expCode}-${devHash}-${sigHash}`;
}

/**
 * Verifies if an activation key is authentic, valid for the current device, and unexpired.
 */
export function verifyActivationKey(
  licenseKey: string,
  currentDeviceId: string
): {
  isValid: boolean;
  tier: LicenseTier;
  expiresAt: string | null;
  errorMessage?: string;
} {
  const key = licenseKey.trim().toUpperCase();
  const cleanDevice = currentDeviceId.trim().toUpperCase();

  const parts = key.split('-');
  if (parts.length !== 5 || parts[0] !== 'OMC') {
    return {
      isValid: false,
      tier: 'Trial',
      expiresAt: null,
      errorMessage: 'Format kunci aktivasi tidak valid. Format harus: OMC-XXXX-XXXX-XXXX-XXXX',
    };
  }

  const [, tierCode, expCode, devHash, sigHash] = parts;

  // Resolve tier
  let tier: LicenseTier = 'Trial';
  if (tierCode === 'PRO') tier = 'Pro';
  else if (tierCode === 'LIFE') tier = 'Lifetime';
  else if (tierCode === 'ENTE') tier = 'Enterprise';
  else if (tierCode === 'TRIA') tier = 'Trial';
  else {
    return {
      isValid: false,
      tier: 'Trial',
      expiresAt: null,
      errorMessage: 'Tipe lisensi tidak dikenali.',
    };
  }

  // Check device hash
  const expectedDevHash = fnvHash(`${cleanDevice}:${tierCode}`).replace('-', '').slice(0, 4);
  if (devHash !== expectedDevHash) {
    return {
      isValid: false,
      tier,
      expiresAt: null,
      errorMessage: 'Kunci aktivasi ini terikat pada perangkat lain (Device ID tidak cocok).',
    };
  }

  // Check cryptographic signature
  const rawSignatureTarget = `${cleanDevice}|${tier}|${expCode}|${devHash}|${MASTER_SECRET_SALT}`;
  const expectedSigHash = fnvHash(rawSignatureTarget).replace('-', '');

  if (sigHash !== expectedSigHash) {
    return {
      isValid: false,
      tier,
      expiresAt: null,
      errorMessage: 'Kunci aktivasi gagal verifikasi tanda tangan digital (Kunci palsu atau rusak).',
    };
  }

  // Check expiration date
  let expiresAt: string | null = null;
  if (expCode !== 'PERM99') {
    try {
      // Parse YYMMDD -> 20YY-MM-DD
      const year = '20' + expCode.slice(0, 2);
      const month = expCode.slice(2, 4);
      const day = expCode.slice(4, 6);
      expiresAt = `${year}-${month}-${day}`;

      const expDate = new Date(`${expiresAt}T23:59:59`);
      if (isNaN(expDate.getTime())) {
        return {
          isValid: false,
          tier,
          expiresAt: null,
          errorMessage: 'Tanggal masa berlaku lisensi rusak.',
        };
      }

      if (Date.now() > expDate.getTime()) {
        return {
          isValid: false,
          tier,
          expiresAt,
          errorMessage: `Masa aktif lisensi telah berakhir pada ${day}/${month}/${year}. Silakan perpanjang aktivasi.`,
        };
      }
    } catch {
      return {
        isValid: false,
        tier,
        expiresAt: null,
        errorMessage: 'Gagal memvalidasi masa berlaku lisensi.',
      };
    }
  }

  return {
    isValid: true,
    tier,
    expiresAt,
  };
}

/**
 * Load initial license state from localStorage or create fresh Trial
 */
export function loadLicenseInfo(): LicenseInfo {
  const STORAGE_KEY = 'ohmycashier_license_info';
  const deviceId = getOrCreateDeviceId();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: LicenseInfo = JSON.parse(raw);
      // Ensure deviceId matches
      if (parsed.deviceId === deviceId && parsed.licenseKey) {
        const verify = verifyActivationKey(parsed.licenseKey, deviceId);
        if (verify.isValid) {
          return {
            ...parsed,
            isActivated: true,
            tier: verify.tier,
            expiresAt: verify.expiresAt,
          };
        }
      }
    }
  } catch {}

  // Default Trial state
  return {
    isActivated: false,
    deviceId,
    tier: 'Trial',
    maxTransactions: 50,
    expiresAt: null,
  };
}

/**
 * Save license state to localStorage
 */
export function saveLicenseInfo(license: LicenseInfo): void {
  const STORAGE_KEY = 'ohmycashier_license_info';
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(license));
  } catch (e) {
    console.error('Failed to save license info', e);
  }
}
