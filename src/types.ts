export interface VariantOption {
  id: string;
  name: string;
  extraPrice: number;
}

export interface ProductVariantGroup {
  id: string;
  name: string; // e.g. "Ukuran", "Level Pedas", "Suhu"
  required: boolean;
  options: VariantOption[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number; // HPP (Harga Pokok Penjualan)
  stock: number;
  unit: string; // pcs, porsi, botol, cup
  barcode: string;
  imageUrl?: string;
  variantGroups?: ProductVariantGroup[];
  ingredients?: { ingredientId: string; amount: number; unit: string }[];
}

export interface SelectedVariant {
  groupName: string;
  optionName: string;
  extraPrice: number;
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  selectedVariants: SelectedVariant[];
  unitPrice: number; // base price + variants extra
  totalPrice: number;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tier: 'Reguler' | 'VIP' | 'Member';
  points: number;
  totalOrders: number;
  totalSpent: number;
}

export type PaymentMethod = 'Tunai' | 'QRIS' | 'Debit' | 'Transfer';

export type KitchenStatus = 'Antre' | 'Dimasak' | 'Siap Saji' | 'Selesai';

export interface Order {
  id: string;
  orderNumber: string; // #0001
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  discountPercent: number;
  discountNominal: number;
  taxPercent: number;
  taxAmount: number;
  serviceCharge: number;
  deliveryFee?: number;
  deliveryAddress?: string;
  pickupDate?: string; // e.g. "2026-10-20"
  pickupTime?: string; // e.g. "14:00"
  isPreOrder?: boolean;
  preBillPrinted?: boolean;
  total: number;
  totalCost: number; // total HPP
  grossProfit: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeAmount: number;
  orderType: 'Dine In' | 'Take Away' | 'Delivery' | 'Pre-Order';
  tableNumber?: string;
  customer?: Customer;
  cashierName: string;
  status: 'Selesai' | 'Dibatalkan' | 'Draft' | 'Siap Diambil' | 'Diproses';
  notes?: string;
  kitchenStatus?: KitchenStatus;
  completedItemIds?: string[];
  kitchenNotes?: string;
  kotPrinted?: boolean;
  isSplitBill?: boolean;
  parentOrderId?: string;
  splitBillType?: 'per_item' | 'equal';
  splitBillPart?: string;
  splitPayments?: SplitPaymentPerson[];
}

export interface SplitPaymentPerson {
  guestIndex: number;
  guestName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  paidAt?: string;
  cashierName?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  category: 'Bahan Mentah' | 'Bahan Olahan';
  stock: number;
  unit: string; // kg, gram, liter, ml, pcs
  costPerUnit: number;
  minStock: number;
  notes?: string;
  batchNumber?: string;
  expiryDate?: string; // YYYY-MM-DD
  supplier?: string;
}

export interface ShiftCashEntry {
  id: string;
  time: string;
  type: 'Kas Masuk' | 'Kas Keluar';
  amount: number;
  reason: string;
}

export interface Shift {
  id: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  initialCash: number; // Modal awal
  cashSales: number;
  nonCashSales: number;
  cashIn: number;
  cashOut: number;
  expectedCash: number;
  actualCash?: number;
  discrepancy?: number;
  status: 'Open' | 'Closed';
  entries: ShiftCashEntry[];
}

export interface StoreSettings {
  storeName: string;
  branchName: string;
  address: string;
  phone: string;
  taxRate: number; // 11 for 11%
  enableTax: boolean;
  serviceRate: number; // 0 or 5
  enableService: boolean;
  receiptFooter: string;
  paperWidth: '58mm' | '80mm';
  printerType: 'ESC/POS' | 'TSPL';
  currencySymbol: string;
  supervisorPin: string;
}

export interface OhMyCashierBackupData {
  app: string;
  version: string;
  exportedAt: string;
  metadata: {
    storeName: string;
    branchName: string;
    productsCount: number;
    categoriesCount: number;
    customersCount: number;
    ingredientsCount: number;
    ordersCount: number;
  };
  data: {
    products: Product[];
    categories: string[];
    customers: Customer[];
    ingredients: Ingredient[];
    orders: Order[];
    shift: Shift;
    settings: StoreSettings;
  };
}

export type LicenseTier = 'Trial' | 'Pro' | 'Enterprise' | 'Lifetime';

export interface LicenseInfo {
  isActivated: boolean;
  deviceId: string;
  licenseKey?: string;
  tier: LicenseTier;
  activatedAt?: string;
  expiresAt?: string | null; // null = Lifetime permanent
  ownerName?: string;
  registeredStore?: string;
  maxTransactions?: number;
}

// UI Theme types
export type AppTheme = 'slate' | 'cyberpunk';

// Backward-compatible alias for existing imports
export type KasgoBackupData = OhMyCashierBackupData;
