import { z } from 'zod';
import {
  Product,
  Customer,
  Order,
  Ingredient,
  Shift,
  StoreSettings,
  CartItem,
} from '../types';

export interface StorageData {
  omc_products: Product[];
  omc_categories: string[];
  omc_customers: Customer[];
  omc_orders: Order[];
  omc_ingredients: Ingredient[];
  omc_shift: Shift;
  omc_settings: StoreSettings;
  omc_active_cart: CartItem[];
}

// Zod Schemas for runtime safety
const ProductVariantOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  extraPrice: z.number().default(0),
});

const ProductVariantGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  required: z.boolean().default(false),
  options: z.array(ProductVariantOptionSchema).default([]),
});

const ProductIngredientRefSchema = z.object({
  ingredientId: z.string(),
  amount: z.number().nonnegative(),
  unit: z.string().max(20),
});

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  category: z.string().max(100),
  price: z.number().nonnegative(),
  costPrice: z.number().nonnegative().default(0),
  stock: z.number().int().default(0),
  unit: z.string().max(30).default('pcs'),
  barcode: z.string().max(100).default(''),
  imageUrl: z.string().optional(),
  variantGroups: z.array(ProductVariantGroupSchema).optional(),
  ingredients: z.array(ProductIngredientRefSchema).optional(),
});

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  phone: z.string().max(50).default(''),
  email: z.string().optional(),
  tier: z.enum(['Reguler', 'VIP', 'Member']).default('Reguler'),
  points: z.number().int().nonnegative().default(0),
  totalOrders: z.number().int().nonnegative().default(0),
  totalSpent: z.number().nonnegative().default(0),
});

export const SelectedVariantSchema = z.object({
  groupName: z.string(),
  optionName: z.string(),
  extraPrice: z.number().default(0),
});

export const CartItemSchema = z.object({
  cartItemId: z.string(),
  product: ProductSchema,
  quantity: z.number().int().positive().default(1),
  selectedVariants: z.array(SelectedVariantSchema).default([]),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  notes: z.string().optional(),
});

export const OrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  createdAt: z.string(),
  items: z.array(CartItemSchema).default([]),
  subtotal: z.number().nonnegative().default(0),
  discountPercent: z.number().default(0),
  discountNominal: z.number().nonnegative().default(0),
  taxPercent: z.number().default(0),
  taxAmount: z.number().nonnegative().default(0),
  serviceCharge: z.number().nonnegative().default(0),
  deliveryFee: z.number().nonnegative().optional(),
  deliveryAddress: z.string().optional(),
  pickupDate: z.string().optional(),
  pickupTime: z.string().optional(),
  isPreOrder: z.boolean().optional(),
  preBillPrinted: z.boolean().optional(),
  total: z.number().nonnegative().default(0),
  totalCost: z.number().nonnegative().default(0),
  grossProfit: z.number().default(0),
  paymentMethod: z.enum(['Tunai', 'QRIS', 'Debit', 'Transfer']).default('Tunai'),
  amountPaid: z.number().nonnegative().default(0),
  changeAmount: z.number().nonnegative().default(0),
  orderType: z.enum(['Dine In', 'Take Away', 'Delivery', 'Pre-Order']).default('Dine In'),
  tableNumber: z.string().optional(),
  customer: CustomerSchema.optional(),
  cashierName: z.string().default('Kasir'),
  status: z.enum(['Selesai', 'Dibatalkan', 'Draft', 'Siap Diambil', 'Diproses']).default('Selesai'),
  notes: z.string().optional(),
  kitchenStatus: z.enum(['Antre', 'Dimasak', 'Siap Saji', 'Selesai']).optional(),
  completedItemIds: z.array(z.string()).optional(),
  kitchenNotes: z.string().optional(),
  kotPrinted: z.boolean().optional(),
  isSplitBill: z.boolean().optional(),
  parentOrderId: z.string().optional(),
  splitBillType: z.enum(['per_item', 'equal']).optional(),
  splitBillPart: z.string().optional(),
});

export const IngredientSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['Bahan Mentah', 'Bahan Olahan']).default('Bahan Mentah'),
  stock: z.number().nonnegative().default(0),
  unit: z.string().max(20).default('kg'),
  costPerUnit: z.number().nonnegative().default(0),
  minStock: z.number().nonnegative().default(0),
  notes: z.string().optional(),
  supplier: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
});

export const ShiftCashEntrySchema = z.object({
  id: z.string(),
  time: z.string(),
  type: z.enum(['Kas Masuk', 'Kas Keluar']),
  amount: z.number().nonnegative(),
  reason: z.string().optional(),
});

export const ShiftSchema = z.object({
  id: z.string(),
  cashierName: z.string().default('Kasir'),
  startTime: z.string(),
  endTime: z.string().optional(),
  initialCash: z.number().nonnegative().default(0),
  cashSales: z.number().nonnegative().default(0),
  nonCashSales: z.number().nonnegative().default(0),
  cashIn: z.number().nonnegative().default(0),
  cashOut: z.number().nonnegative().default(0),
  expectedCash: z.number().nonnegative().default(0),
  actualCash: z.number().nonnegative().optional(),
  discrepancy: z.number().optional(),
  status: z.enum(['Open', 'Closed']).default('Open'),
  entries: z.array(ShiftCashEntrySchema).optional().default([]),
});

export const StoreSettingsSchema = z.object({
  storeName: z.string().max(200).default('Oh My Cashier Cafe & Resto'),
  branchName: z.string().max(200).default('Outlet Utama'),
  address: z.string().max(500).default(''),
  phone: z.string().max(50).optional(),
  taxRate: z.number().default(11),
  enableTax: z.boolean().default(false),
  serviceRate: z.number().default(0),
  enableService: z.boolean().default(false),
  receiptFooter: z.string().max(500).optional(),
  paperWidth: z.enum(['58mm', '80mm']).default('58mm'),
  printerType: z.enum(['ESC/POS', 'TSPL']).default('ESC/POS'),
  currencySymbol: z.string().default('Rp'),
  supervisorPin: z.string().default('1234'),
  theme: z.enum(['slate', 'cyberpunk']).default('cyberpunk'),
});

// Map key to corresponding Zod Schema
const StorageSchemas: Record<keyof StorageData, z.ZodTypeAny> = {
  omc_products: z.array(ProductSchema),
  omc_categories: z.array(z.string()),
  omc_customers: z.array(CustomerSchema),
  omc_orders: z.array(OrderSchema),
  omc_ingredients: z.array(IngredientSchema),
  omc_shift: ShiftSchema,
  omc_settings: StoreSettingsSchema,
  omc_active_cart: z.array(CartItemSchema),
};

// Key migration lookup: omc_ -> ohmycashier_ -> kasgo_
function getFallbackKeys(key: string): string[] {
  const stripped = key.replace(/^omc_/, '');
  return [
    key,
    `ohmycashier_${stripped}`,
    `kasgo_${stripped}`,
  ];
}

/**
 * Safely loads and validates data from localStorage with Zod schema parsing.
 * Supports automatic fallback migration from legacy keys (ohmycashier_* and kasgo_*).
 */
export function safeLoad<T extends keyof StorageData>(
  key: T,
  fallback: StorageData[T]
): StorageData[T] {
  try {
    const candidateKeys = getFallbackKeys(key);
    let raw: string | null = null;
    let foundKey: string = key;

    for (const k of candidateKeys) {
      const item = localStorage.getItem(k);
      if (item) {
        raw = item;
        foundKey = k;
        break;
      }
    }

    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    const schema = StorageSchemas[key];
    if (!schema) {
      return parsed as StorageData[T];
    }

    const result = schema.safeParse(parsed);
    if (result.success) {
      // If found in legacy key, migrate to omc_
      if (foundKey !== key) {
        try {
          localStorage.setItem(key, JSON.stringify(result.data));
        } catch {}
      }
      return result.data as StorageData[T];
    }

    console.warn(`[storage] Validation warning for "${key}", using partial parsed data:`, result.error);
    return parsed as StorageData[T];
  } catch (error) {
    console.warn(`[storage] Failed to parse "${key}", using fallback:`, error);
    return fallback;
  }
}

/**
 * Safely saves data to localStorage with Zod validation.
 */
export function safeSave<T extends keyof StorageData>(
  key: T,
  data: StorageData[T]
): void {
  try {
    const schema = StorageSchemas[key];
    if (schema) {
      const result = schema.safeParse(data);
      if (result.success) {
        localStorage.setItem(key, JSON.stringify(result.data));
        return;
      }
      console.warn(`[storage] Validation failed for "${key}", saving raw:`, result.error);
    }
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`[storage] Failed to save "${key}":`, error);
  }
}

// Helpers for generic string/number/boolean items
export function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeSet<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`[storage] Failed to save "${key}":`, error);
  }
}