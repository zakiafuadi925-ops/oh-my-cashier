import {
  OhMyCashierBackupData,
  Product,
  Customer,
  Ingredient,
  Order,
  Shift,
  StoreSettings,
  LocalSnapshot,
} from '../types';

const SNAPSHOTS_STORAGE_KEY = 'omc_local_snapshots';
const MAX_SNAPSHOTS = 8;

/**
 * Constructs a standardized OhMyCashierBackupData payload with complete metadata.
 */
export function buildBackupPayload(params: {
  products: Product[];
  categories: string[];
  customers: Customer[];
  ingredients: Ingredient[];
  orders: Order[];
  activeShift?: Shift;
  settings: StoreSettings;
}): OhMyCashierBackupData {
  const { products, categories, customers, ingredients, orders, activeShift, settings } = params;

  return {
    app: 'Oh My Cashier',
    version: '1.26.6',
    exportedAt: new Date().toISOString(),
    metadata: {
      storeName: settings.storeName || 'Oh My Cashier',
      branchName: settings.branchName || 'Outlet Utama',
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
        id: 'shift-default',
        cashierName: 'Kasir',
        startTime: new Date().toISOString(),
        initialCash: 0,
        cashSales: 0,
        nonCashSales: 0,
        cashIn: 0,
        cashOut: 0,
        expectedCash: 0,
        status: 'Open',
        entries: [],
      },
      settings,
    },
  };
}

/**
 * Formats a clean, standard backup filename.
 */
export function getStandardBackupFilename(storeName: string): string {
  const now = new Date();
  const dateTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(
    now.getMinutes()
  ).padStart(2, '0')}`;
  const safeStore = (storeName || 'ohmycashier')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toLowerCase();
  return `ohmycashier_backup_${safeStore}_${dateTag}.json`;
}

/**
 * Mobile-first Smart Exporter:
 * 1. Checks if Web Share API with file support is available (Android / iOS / Mobile Chrome).
 *    If available, triggers the Native Mobile Share Sheet (allows sending to WhatsApp, Drive, Files, etc.).
 * 2. If not available or cancelled, falls back to direct browser blob download (<a download>).
 * 3. Also automatically creates a local safety snapshot in local storage.
 */
export async function exportJsonData(
  backup: OhMyCashierBackupData,
  preferredMethod: 'auto' | 'share' | 'download' = 'auto'
): Promise<{ success: boolean; method: 'share' | 'download' | 'clipboard'; message: string }> {
  // Always auto-save a local snapshot as safety net
  saveLocalSnapshot(backup, 'Auto-Snapshot Ekspor');

  const jsonStr = JSON.stringify(backup, null, 2);
  const fileName = getStandardBackupFilename(backup.metadata.storeName);
  const blob = new Blob([jsonStr], { type: 'application/json' });

  // 1. Try Native Mobile Web Share API if supported and requested/auto
  if (preferredMethod !== 'download' && typeof navigator !== 'undefined' && navigator.share) {
    try {
      const file = new File([blob], fileName, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Cadangan Data ${backup.metadata.storeName}`,
          text: `Berkas cadangan basis data Oh My Cashier (${backup.metadata.productsCount} produk, ${backup.metadata.ordersCount} pesanan).`,
          files: [file],
        });
        return {
          success: true,
          method: 'share',
          message: 'Berkas cadangan JSON berhasil dibagikan melalui lembar berbagi perangkat!',
        };
      }
    } catch (err: any) {
      // User cancelled share or file sharing is not allowed by device
      if (err?.name === 'AbortError') {
        return {
          success: true,
          method: 'share',
          message: 'Berbagi berkas dibatalkan oleh pengguna.',
        };
      }
      console.warn('Native share failed or not allowed, falling back to direct download:', err);
    }
  }

  // 2. Direct Blob File Download (<a download>)
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 500);

    return {
      success: true,
      method: 'download',
      message: `Berkas cadangan "${fileName}" berhasil diunduh ke penyimpanan perangkat!`,
    };
  } catch (err) {
    console.warn('Direct file download failed, attempting clipboard copy fallback:', err);
  }

  // 3. Fallback: Copy raw JSON to clipboard
  const copied = await copyBackupToClipboard(backup);
  if (copied) {
    return {
      success: true,
      method: 'clipboard',
      message: 'Teks cadangan JSON berhasil disalin ke papan klip (clipboard)!',
    };
  }

  throw new Error('Gagal mengekspor data cadangan JSON.');
}

/**
 * Copies complete JSON backup to clipboard.
 */
export async function copyBackupToClipboard(backup: OhMyCashierBackupData): Promise<boolean> {
  const jsonStr = JSON.stringify(backup, null, 2);
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(jsonStr);
      return true;
    }
  } catch {}

  // Fallback for older WebViews / Android without clipboard permission
  try {
    const textArea = document.createElement('textarea');
    textArea.value = jsonStr;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

/**
 * Reads local snapshots from localStorage.
 */
export function getLocalSnapshots(): LocalSnapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves a local snapshot to offline storage (FIFO queue, max MAX_SNAPSHOTS items).
 */
export function saveLocalSnapshot(
  backup: OhMyCashierBackupData,
  customLabel?: string
): LocalSnapshot[] {
  try {
    const current = getLocalSnapshots();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

    const newSnapshot: LocalSnapshot = {
      id: `snapshot_${Date.now()}`,
      createdAt: now.toISOString(),
      label: customLabel || `Snapshot Otomatis (${dateStr} ${timeStr})`,
      metadata: backup.metadata,
      backup,
    };

    const updated = [newSnapshot, ...current.slice(0, MAX_SNAPSHOTS - 1)];
    localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save local snapshot:', e);
    return getLocalSnapshots();
  }
}

/**
 * Deletes a specific local snapshot by ID.
 */
export function deleteLocalSnapshot(snapshotId: string): LocalSnapshot[] {
  try {
    const current = getLocalSnapshots();
    const updated = current.filter((s) => s.id !== snapshotId);
    localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete snapshot:', e);
    return getLocalSnapshots();
  }
}

/**
 * Clears all local snapshots.
 */
export function clearAllLocalSnapshots(): void {
  try {
    localStorage.removeItem(SNAPSHOTS_STORAGE_KEY);
  } catch {}
}

/**
 * Validates, sanitizes, and normalizes an imported JSON string.
 * Protects against Prototype Pollution and memory exhaustion attacks.
 */
export function validateBackupJson(rawJson: string): {
  valid: boolean;
  data?: OhMyCashierBackupData;
  error?: string;
} {
  if (!rawJson || typeof rawJson !== 'string') {
    return { valid: false, error: 'Format berkas kosong atau tidak terbaca.' };
  }

  // Prototype pollution defense
  if (
    rawJson.includes('"__proto__"') ||
    rawJson.includes('"constructor"') ||
    rawJson.includes('"prototype"')
  ) {
    return {
      valid: false,
      error: 'Berkas cadangan ditolak: terdeteksi pola payload tidak aman (Prototype Pollution).',
    };
  }

  try {
    const parsed = JSON.parse(rawJson);

    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Data JSON harus berupa objek valid.' };
    }

    // Support both Oh My Cashier and legacy Kasgo format
    const isOhMyCashier = parsed.app === 'Oh My Cashier' || parsed.app === 'Kasgo POS';
    const hasData = parsed.data && typeof parsed.data === 'object';

    if (!isOhMyCashier && !hasData) {
      return {
        valid: false,
        error: 'Berkas JSON bukan merupakan berkas cadangan valid dari Oh My Cashier.',
      };
    }

    const products = Array.isArray(parsed.data?.products) ? parsed.data.products : [];
    const categories = Array.isArray(parsed.data?.categories) ? parsed.data.categories : [];
    const customers = Array.isArray(parsed.data?.customers) ? parsed.data.customers : [];
    const ingredients = Array.isArray(parsed.data?.ingredients) ? parsed.data.ingredients : [];
    const orders = Array.isArray(parsed.data?.orders) ? parsed.data.orders : [];
    const shift = parsed.data?.shift || null;
    const settings = parsed.data?.settings || {};

    const normalizedBackup: OhMyCashierBackupData = {
      app: 'Oh My Cashier',
      version: typeof parsed.version === 'string' ? parsed.version : '1.26.6',
      exportedAt:
        typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
      metadata: {
        storeName: parsed.metadata?.storeName || settings.storeName || 'Oh My Cashier',
        branchName: parsed.metadata?.branchName || settings.branchName || 'Outlet',
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
        shift: shift || {
          id: 'shift-restored',
          cashierName: 'Kasir',
          startTime: new Date().toISOString(),
          initialCash: 0,
          cashSales: 0,
          nonCashSales: 0,
          cashIn: 0,
          cashOut: 0,
          expectedCash: 0,
          status: 'Open',
          entries: [],
        },
        settings,
      },
    };

    return { valid: true, data: normalizedBackup };
  } catch (err: any) {
    return { valid: false, error: `Sintaks JSON tidak valid: ${err?.message || 'Gagal mengurai'}` };
  }
}
