import React, { useState, useEffect } from 'react';
import {
  Product,
  CartItem,
  Customer,
  Order,
  StoreSettings,
  Shift,
  LicenseInfo,
} from '../../types';
import { formatRupiah } from '../../utils/format';
import { playSound } from '../../utils/audio';
import { ProductVariantModal } from './ProductVariantModal';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { PreBillModal } from './PreBillModal';
import { SupervisorPinModal } from '../Auth/SupervisorPinModal';
import { KitchenTicketModal } from '../Kitchen/KitchenTicketModal';
import { CupLabelModal } from '../Kitchen/CupLabelModal';
import { TableManagementModal } from '../Tables/TableManagementModal';
import { SplitBillModal } from '../Tables/SplitBillModal';
import {
  Search,
  ShoppingCart,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Tag,
  CreditCard,
  User,
  Coffee,
  Check,
  Percent,
  Calendar,
  Clock,
  Truck,
  FileText,
  Share2,
  Camera,
  Volume2,
  ShieldAlert,
  Info,
  Layers,
  ChefHat,
  LayoutGrid,
  Split,
  BookmarkCheck,
  Key,
  ArrowRightLeft,
  Merge,
  ArrowRight,
} from 'lucide-react';

interface POSViewProps {
  products: Product[];
  categories: string[];
  customers: Customer[];
  settings: StoreSettings;
  activeShift: Shift;
  orders?: Order[];
  onCartCountChange?: (count: number) => void;
  onOrderCompleted: (order: Order) => void;
  onAddCustomer: (customer: Customer) => void;
  onHoldOrderToTable?: (order: Order) => void;
  onMoveTable?: (fromTable: string, toTable: string) => void;
  onMergeTables?: (sourceTable: string, targetTable: string) => void;
  onPaySubBill?: (paidOrder: Order, remainingOrder?: Order) => void;
  onCompleteEqualSplit?: (updatedMasterOrder: Order) => void;
  licenseInfo?: LicenseInfo;
  onOpenLicenseModal?: () => void;
}

export const POSView: React.FC<POSViewProps> = ({
  products,
  categories,
  customers,
  settings,
  activeShift,
  orders = [],
  onCartCountChange,
  onOrderCompleted,
  onAddCustomer,
  onHoldOrderToTable,
  onMoveTable,
  onMergeTables,
  onPaySubBill,
  onCompleteEqualSplit,
  licenseInfo,
  onOpenLicenseModal,
}) => {
  // Mobile View state (< 768px): toggle between catalog and cart drawer/sheet
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);

  // Filtering state
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState<boolean>(false);

  // Cart state (persisted to localStorage so in-progress cart is safe on accidental refresh)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved =
        localStorage.getItem('omc_active_cart') ||
        localStorage.getItem('ohmycashier_active_cart') ||
        localStorage.getItem('kasgo_active_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [orderType, setOrderType] = useState<'Dine In' | 'Take Away' | 'Delivery' | 'Pre-Order'>(() => {
    try {
      return (
        (localStorage.getItem('omc_active_ordertype') ||
          localStorage.getItem('ohmycashier_active_ordertype') ||
          (localStorage.getItem('kasgo_active_ordertype') as any)) || 'Dine In'
      );
    } catch {
      return 'Dine In';
    }
  });
  const [tableNumber, setTableNumber] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('omc_active_table') ||
        localStorage.getItem('ohmycashier_active_table') ||
        localStorage.getItem('kasgo_active_table') ||
        'Meja 01'
      );
    } catch {
      return 'Meja 01';
    }
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(undefined);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customDiscountNominal, setCustomDiscountNominal] = useState<number>(0);

  // Delivery & Pre-order fields (Phase 2)
  const [deliveryFee, setDeliveryFee] = useState<number>(10000);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [pickupDate, setPickupDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [pickupTime, setPickupTime] = useState<string>('14:00');

  // Sync cart to localStorage and propagate count to parent (App.tsx / Sidebar badge)
  useEffect(() => {
    try {
      localStorage.setItem('omc_active_cart', JSON.stringify(cart));
      localStorage.setItem('omc_active_ordertype', orderType);
      localStorage.setItem('omc_active_table', tableNumber);
    } catch {}
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (onCartCountChange) onCartCountChange(totalItems);
  }, [cart, orderType, tableNumber, onCartCountChange]);

  // Pre-Bill Modal state
  const [showPreBill, setShowPreBill] = useState<boolean>(false);
  const [showKitchenTicket, setShowKitchenTicket] = useState<boolean>(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  // Beep sound effect for barcode scanner
  const playScannerBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1750, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  };

  // Camera Barcode Scanner Modal state
  const [showCameraScanner, setShowCameraScanner] = useState<boolean>(false);

  // Supervisor PIN for high discount (> 20%)
  const [pendingDiscountPercent, setPendingDiscountPercent] = useState<number | null>(null);

  // Sync active cart to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('ohmycashier_active_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  React.useEffect(() => {
    try {
      localStorage.setItem('ohmycashier_active_ordertype', orderType);
    } catch {}
  }, [orderType]);

  React.useEffect(() => {
    try {
      localStorage.setItem('ohmycashier_active_table', tableNumber);
    } catch {}
  }, [tableNumber]);

  // Prevent accidental tab close/refresh if cashier has items in cart
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (cart.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [cart.length]);

  // Modals state
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const calculatedDiscount =
    discountPercent > 0
      ? (subtotal * discountPercent) / 100
      : customDiscountNominal;
  const taxableAmount = Math.max(0, subtotal - calculatedDiscount);
  const taxAmount = settings.enableTax ? Math.round((taxableAmount * settings.taxRate) / 100) : 0;
  const effectiveDeliveryFee = orderType === 'Delivery' ? deliveryFee : 0;
  const grandTotal = taxableAmount + taxAmount + effectiveDeliveryFee;

  // Total HPP for profit tracking
  const totalCost = cart.reduce((sum, item) => sum + item.product.costPrice * item.quantity, 0);

  // Table & Split Bill states
  const [showTableModal, setShowTableModal] = useState<boolean>(false);
  const [showSplitBill, setShowSplitBill] = useState<boolean>(false);

  // Active occupied tables
  const activeDineInOrders = orders.filter(
    (o) =>
      o.orderType === 'Dine In' &&
      o.tableNumber &&
      o.status !== 'Selesai' &&
      o.status !== 'Dibatalkan'
  );
  const occupiedTablesCount = activeDineInOrders.length;
  const activeTableOrder = activeDineInOrders.find((o) => o.tableNumber === tableNumber);

  // Load existing occupied table order into cart
  const handleLoadTableOrderToCart = (ord: Order) => {
    setCart(ord.items);
    setSelectedCustomer(ord.customer);
    setOrderType('Dine In');
    setTableNumber(ord.tableNumber || tableNumber);
    showToast(`Pesanan ${ord.tableNumber} (${ord.orderNumber}) berhasil dimuat ke kasir!`);
  };

  // Hold order to table (Open Bill)
  const handleHoldOrderToTable = () => {
    if (cart.length === 0) return;
    if (orderType !== 'Dine In') return;

    const holdOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `#${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      items: cart,
      subtotal,
      discountPercent,
      discountNominal: calculatedDiscount,
      taxPercent: settings.enableTax ? settings.taxRate : 0,
      taxAmount,
      serviceCharge: 0,
      total: grandTotal,
      totalCost,
      grossProfit: grandTotal - totalCost,
      paymentMethod: 'Tunai',
      amountPaid: 0,
      changeAmount: 0,
      orderType: 'Dine In',
      tableNumber,
      customer: selectedCustomer,
      cashierName: activeShift.cashierName,
      status: 'Diproses',
      kitchenStatus: 'Antre',
      completedItemIds: [],
    };

    if (onHoldOrderToTable) {
      onHoldOrderToTable(holdOrder);
    } else {
      onOrderCompleted(holdOrder);
    }

    playSound('chime_order');
    showToast(`Pesanan tersimpan di ${tableNumber} (Open Bill) & dikirim ke Dapur!`);
    setCart([]);
    setSelectedCustomer(undefined);
    setDiscountPercent(0);
    setCustomDiscountNominal(0);
    try {
      localStorage.removeItem('ohmycashier_active_cart');
      localStorage.removeItem('kasgo_active_cart');
    } catch {}
  };

  // Share Delivery Order to Driver / WhatsApp (without window.open)
  const handleShareToDriver = () => {
    let msg = `*PESANAN PENGIRIMAN - ${settings.storeName.toUpperCase()}*\n`;
    msg += `Pelanggan: ${selectedCustomer?.name || 'Umum'} (${selectedCustomer?.phone || '-'})\n`;
    msg += `Alamat Tujuan: ${deliveryAddress || '-'}\n`;
    msg += `--------------------------------\n`;
    cart.forEach((item) => {
      msg += `- ${item.product.name} x${item.quantity}\n`;
      if (item.selectedVariants?.length) {
        msg += `  (${item.selectedVariants.map((v) => v.optionName).join(', ')})\n`;
      }
      if (item.notes) msg += `  * ${item.notes}\n`;
    });
    msg += `--------------------------------\n`;
    msg += `Ongkir : ${formatRupiah(deliveryFee)}\n`;
    msg += `Total Tagihan : ${formatRupiah(grandTotal)}\n`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
    showToast('Teks pesanan pengiriman dikirim ke kurir WhatsApp!');
  };

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const handleProductClick = (product: Product) => {
    if (product.stock <= 0) {
      showToast(`Stok ${product.name} telah habis!`);
      return;
    }
    // If product has variants, open variant modal
    if (product.variantGroups && product.variantGroups.length > 0) {
      setSelectedProductForVariant(product);
    } else {
      // Add directly to cart
      addToCart({
        cartItemId: `${product.id}-${Date.now()}`,
        product,
        quantity: 1,
        selectedVariants: [],
        unitPrice: product.price,
        totalPrice: product.price,
      });
      showToast(`+1 ${product.name}`);
    }
  };

  const addToCart = (newItem: CartItem) => {
    setCart((prev) => {
      // Look for identical item with same product and same variants
      const existingIdx = prev.findIndex(
        (item) =>
          item.product.id === newItem.product.id &&
          JSON.stringify(item.selectedVariants) === JSON.stringify(newItem.selectedVariants) &&
          item.notes === newItem.notes
      );

      if (existingIdx >= 0) {
        const copy = [...prev];
        const updated = { ...copy[existingIdx] };
        updated.quantity += newItem.quantity;
        updated.totalPrice = updated.quantity * updated.unitPrice;
        copy[existingIdx] = updated;
        return copy;
      } else {
        return [...prev, newItem];
      }
    });
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPrice: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const found = products.find((p) => p.barcode === barcodeInput.trim());
    if (found) {
      playScannerBeep();
      handleProductClick(found);
      setBarcodeInput('');
      setShowBarcodeScanner(false);
      showToast(`Berhasil scan barcode: ${found.name}`);
    } else {
      showToast(`Produk dengan barcode ${barcodeInput} tidak ditemukan!`);
    }
  };

  const handleScanBarcodeFromCamera = (barcode: string) => {
    const found = products.find((p) => p.barcode === barcode);
    if (found) {
      playScannerBeep();
      handleProductClick(found);
      setShowCameraScanner(false);
      showToast(`Berhasil memindai: ${found.name}`);
    } else {
      showToast(`Barcode ${barcode} tidak terdaftar di katalog produk.`);
    }
  };

  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = (order: Order) => {
    setIsPaymentOpen(false);
    setCart([]);
    setSelectedCustomer(undefined);
    setDiscountPercent(0);
    setCustomDiscountNominal(0);
    try {
      localStorage.removeItem('ohmycashier_active_cart');
      localStorage.removeItem('kasgo_active_cart');
    } catch {}
    const orderWithKitchen: Order = {
      ...order,
      kitchenStatus: order.kitchenStatus || 'Antre',
      completedItemIds: order.completedItemIds || [],
    };
    setCompletedOrder(orderWithKitchen);
    onOrderCompleted(orderWithKitchen);
    playSound('chime_order');
  };

  const handleNewOrder = () => {
    setCart([]);
    setSelectedCustomer(undefined);
    setDiscountPercent(0);
    setCustomDiscountNominal(0);
    try {
      localStorage.removeItem('ohmycashier_active_cart');
      localStorage.removeItem('kasgo_active_cart');
    } catch {}
    setCompletedOrder(null);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim() || '08...',
      tier: 'Member',
      points: 10,
      totalOrders: 0,
      totalSpent: 0,
    };
    onAddCustomer(newCust);
    setSelectedCustomer(newCust);
    setIsNewCustomerModalOpen(false);
    setNewCustName('');
    setNewCustPhone('');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-900 text-slate-100 relative">
      {/* ======================================================== */}
      {/* LEFT: Product Catalog & Search                           */}
      {/* Mobile (< 768px): Active when !isMobileCartOpen          */}
      {/* Tablet & Desktop (>= 768px): Visible side-by-side        */}
      {/* ======================================================== */}
      <div
        className={`flex-1 flex-col min-w-0 h-full border-r border-slate-800 bg-slate-900 ${
          isMobileCartOpen ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Top Filter & Search Bar */}
        <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-950">
          {/* Trial Notice Banner if not activated */}
          {licenseInfo && !licenseInfo.isActivated && (
            <div className="bg-orange-950/60 border border-orange-800/80 text-orange-200 px-3 py-1.5 rounded-xl text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0" />
                <span className="font-bold truncate text-[11px] sm:text-xs">Mode Demo / Trial</span>
                <span className="text-orange-300 text-[10px] hidden sm:inline">• Kuota demo hingga 50 transaksi</span>
              </div>
              {onOpenLicenseModal && (
                <button
                  type="button"
                  onClick={onOpenLicenseModal}
                  className="px-2 py-0.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-bold text-[10px] sm:text-xs rounded-lg flex items-center gap-1 shadow-2xs shrink-0 transition-colors"
                >
                  <Key className="w-3 h-3 text-orange-200" />
                  <span>Aktivasi</span>
                </button>
              )}
            </div>
          )}

          {/* Mobile Segmented View Switcher (< 768px) */}
          <div className="flex md:hidden items-center bg-slate-900 p-1 rounded-xl gap-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(false)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all min-h-[44px] flex items-center justify-center gap-1.5 ${
                !isMobileCartOpen
                  ? 'bg-orange-500 text-white shadow-2xs font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Coffee className="w-4 h-4 text-orange-200" />
              <span>Menu Katalog</span>
            </button>
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(true)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all min-h-[44px] flex items-center justify-center gap-1.5 ${
                isMobileCartOpen
                  ? 'bg-orange-500 text-white shadow-2xs font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingCart className="w-4 h-4 text-orange-200" />
              <span>Keranjang ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama menu, minuman, atau kode..."
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl focus:bg-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-slate-100 placeholder-slate-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-400 hover:text-slate-200 absolute right-3 top-1/2 -translate-y-1/2"
                >
                  Batal
                </button>
              )}
            </div>

            {/* Quick Barcode Scanner button */}
            <button
              onClick={() => setShowBarcodeScanner(!showBarcodeScanner)}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors shrink-0 ${
                showBarcodeScanner
                  ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                  : 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300'
              }`}
              title="Scan atau ketik Barcode"
            >
              <Barcode className="w-4 h-4 text-orange-400" />
              <span className="hidden sm:inline">Barcode</span>
            </button>
          </div>

          {/* Barcode input drawer if toggled */}
          {showBarcodeScanner && (
            <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-900 rounded-xl border border-slate-700 animate-in fade-in">
              <form onSubmit={handleBarcodeSubmit} className="flex-1 flex gap-2 min-w-[240px]">
                <input
                  type="text"
                  autoFocus
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode scanner atau ketik e.g. 8991001001..."
                  className="flex-1 text-xs px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg outline-none font-mono text-slate-100 placeholder-slate-500 focus:border-orange-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Cari
                </button>
              </form>

              <button
                type="button"
                onClick={() => setShowCameraScanner(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-650 text-slate-100 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                title="Buka pemindai kamera perangkat & simulasi laser barcode"
              >
                <Camera className="w-3.5 h-3.5 text-orange-400" />
                <span>Kamera & Scanner Simulator</span>
              </button>
            </div>
          )}

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count =
                cat === 'Semua'
                  ? products.length
                  : products.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-xs font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 hover:text-white'
                  }`}
                >
                  {isSelected && <span className="font-mono text-[10px]">➜</span>}
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-slate-950/40 text-orange-200' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 p-3 overflow-y-auto bg-slate-900">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
              <Coffee className="w-12 h-12 text-slate-600 stroke-1" />
              <p className="text-sm font-semibold text-slate-300">Tidak ada produk ditemukan</p>
              <p className="text-xs text-slate-500">Coba ubah kata kunci pencarian atau kategori.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 pb-24 md:pb-3">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= 10;
                const hasVariants = product.variantGroups && product.variantGroups.length > 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all relative group bg-slate-800 shadow-2xs select-none ${
                      isOutOfStock
                        ? 'opacity-60 border-slate-800 bg-slate-800 cursor-not-allowed'
                        : 'border-slate-700/80 hover:border-orange-500/70 hover:shadow-lg active:scale-98 cursor-pointer hover:bg-slate-700'
                    }`}
                  >
                    {/* Top Row: Category + Informative Stock Badge */}
                    <div className="flex items-center justify-between w-full mb-1 gap-1">
                      <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded-md truncate max-w-[80px] border border-slate-700">
                        {product.category}
                      </span>

                      {/* Informational Stock Status */}
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${
                          isOutOfStock
                            ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                            : isLowStock
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                        }`}
                      >
                        {isOutOfStock
                          ? 'Habis (0)'
                          : isLowStock
                          ? `Sisa ${product.stock}`
                          : `${product.stock} ${product.unit}`}
                      </span>
                    </div>

                    {/* Product Name */}
                    <div className="my-1">
                      <h4 className="font-bold text-slate-100 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-orange-400 transition-colors">
                        {product.name}
                      </h4>
                      <div className="flex flex-wrap gap-1 mt-0.5 font-mono">
                        {hasVariants && (
                          <span className="text-[10px] text-orange-400 font-medium flex items-center gap-0.5">
                            <Layers className="w-2.5 h-2.5" />
                            {product.variantGroups?.length} Varian
                          </span>
                        )}
                        {product.ingredients && product.ingredients.length > 0 && (
                          <span className="text-[10px] text-cyan-400 font-medium">
                            • BOM
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price and Action */}
                    <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between mt-auto">
                      <span className="font-black text-xs sm:text-sm text-orange-400 font-mono tabular-nums">
                        {formatRupiah(product.price)}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-1 rounded-md transition-colors ${
                          isOutOfStock
                            ? 'text-rose-400 bg-rose-950/40 border border-rose-800/60'
                            : 'text-orange-300 bg-orange-950/40 border border-orange-800/50 group-hover:bg-orange-500 group-hover:text-white'
                        }`}
                      >
                        {isOutOfStock ? 'Habis' : '+ Order'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile Floating Cart Summary Bar (Natural thumb reach, 48px touch target) */}
        {cart.length > 0 && !isMobileCartOpen && (
          <div className="md:hidden fixed bottom-2 left-3 right-3 sm:left-4 sm:right-4 z-30 animate-in slide-in-from-bottom duration-200">
            <div className="bg-slate-950 text-white rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-3 border border-slate-800">
              <div className="flex items-center gap-2.5 pl-2">
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 text-orange-400" />
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white font-mono text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-400">Total Tagihan</p>
                  <p className="font-mono font-bold text-sm text-orange-400 tabular-nums">
                    {formatRupiah(grandTotal)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(true)}
                className="min-h-[48px] px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0"
              >
                <span>Lihat Pesanan & Bayar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* RIGHT: Order Cart Sidebar                                */}
      {/* Mobile (< 768px): Full view when isMobileCartOpen is true */}
      {/* Tablet & Desktop (>= 768px): Permanent side-by-side panel */}
      {/* ======================================================== */}
      <div
        className={`w-full md:w-[340px] lg:w-[380px] xl:w-[420px] bg-slate-950 text-slate-100 flex flex-col h-full shrink-0 border-t md:border-t-0 md:border-l border-slate-800 shadow-xl ${
          isMobileCartOpen ? 'flex' : 'hidden md:flex'
        }`}
      >
        {/* Mobile Header Bar (< 768px) with return button */}
        <div className="md:hidden p-3 bg-slate-950 text-white border-b border-slate-800 flex items-center justify-between shrink-0 font-mono">
          <button
            type="button"
            onClick={() => setIsMobileCartOpen(false)}
            className="min-h-[44px] px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700 shadow-2xs"
          >
            <span className="text-orange-400 font-bold">←</span>
            <span>Kembali ke Menu</span>
          </button>
          <div className="text-right">
            <span className="text-xs font-bold block text-slate-100">Kolom Tagihan Kasir</span>
            <span className="text-[10px] text-orange-400">
              {cart.reduce((s, i) => s + i.quantity, 0)} item dipilih
            </span>
          </div>
        </div>

        {/* Cart Header & Order Type */}
        <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-950 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-100 text-sm">Pesanan Kasir</span>
              <span className="text-xs bg-orange-950/80 text-orange-300 border border-orange-800/80 font-bold font-mono px-2 py-0.5 rounded-full">
                {cart.reduce((s, i) => s + i.quantity, 0)} item
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
              >
                Kosongkan
              </button>
            )}
          </div>

          {/* 4 Order Types: Dine In / Take Away / Delivery / Pre-Order */}
          <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-xl text-[11px] font-semibold border border-slate-800">
            {(['Dine In', 'Take Away', 'Delivery', 'Pre-Order'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`py-1.5 px-1 rounded-lg transition-all truncate text-center ${
                  orderType === type
                    ? 'bg-orange-500 text-white shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Conditional Controls by Order Type */}
          {orderType === 'Dine In' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-medium shrink-0">Nomor Meja:</span>
                <select
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="text-xs font-bold px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 outline-none flex-1 focus:border-orange-500"
                >
                  {Array.from({ length: 20 }, (_, i) => {
                    const num = (i + 1).toString().padStart(2, '0');
                    const tblName = `Meja ${num}`;
                    const isOcc = activeDineInOrders.some((o) => o.tableNumber === tblName);
                    return (
                      <option key={num} value={tblName}>
                        {tblName} {isOcc ? '(🔴 Terisi)' : '(🟢 Kosong)'}
                      </option>
                    );
                  })}
                </select>

                <button
                  type="button"
                  onClick={() => setShowTableModal(true)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-800/60 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition-colors shadow-2xs"
                  title="Buka Denah & Manajemen Meja"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Denah</span>
                  {occupiedTablesCount > 0 && (
                    <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {occupiedTablesCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Occupied Table Alert & Quick Actions */}
              {activeTableOrder && (
                <div className="bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/70 text-xs space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span>{tableNumber} Terisi ({activeTableOrder.orderNumber})</span>
                    </span>
                    <span className="font-mono font-bold text-rose-300">
                      {formatRupiah(activeTableOrder.total)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>{activeTableOrder.items.length} menu dipesan</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleLoadTableOrderToCart(activeTableOrder)}
                        className="text-[10px] bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-bold px-2 py-0.5 rounded shadow-2xs"
                      >
                        Muat ke Kasir
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSplitBill(true)}
                        className="text-[10px] bg-purple-700 hover:bg-purple-600 text-white font-bold px-2 py-0.5 rounded flex items-center gap-0.5 shadow-2xs"
                      >
                        <Split className="w-3 h-3" />
                        <span>Pisah Tagihan</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pre-Order / Pick-up Date & Time */}
          {(orderType === 'Pre-Order' || orderType === 'Take Away') && (
            <div className="bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/70 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-200 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Jadwal Pengambilan (Tanggal Ambil)</span>
                </span>
                <span className="text-[10px] text-amber-300 bg-amber-900/60 px-1.5 py-0.2 rounded font-semibold border border-amber-700/60">
                  {orderType === 'Pre-Order' ? 'Pre-Order' : 'Take Away'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Tanggal Ambil</label>
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg font-mono text-[11px] font-medium text-slate-100 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Jam Ambil</label>
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg font-mono text-[11px] font-medium text-slate-100 outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Delivery Details & Ongkir */}
          {orderType === 'Delivery' && (
            <div className="bg-blue-950/40 p-2.5 rounded-xl border border-blue-800/70 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-200 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pengiriman & Ongkos Kirim</span>
                </span>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={handleShareToDriver}
                    className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-2xs"
                    title="Kirim detail pesanan ke kurir/ojol"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>Ke Kurir (WA)</span>
                  </button>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-[10px] text-slate-300 font-semibold">Biaya Ongkir (Rp)</label>
                  <div className="flex gap-1">
                    {[0, 10000, 15000].map((fee) => (
                      <button
                        key={fee}
                        type="button"
                        onClick={() => setDeliveryFee(fee)}
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold transition-colors ${
                          deliveryFee === fee
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-900 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {fee === 0 ? 'Gratis' : `${fee / 1000}rb`}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg font-mono font-bold text-xs text-slate-100 outline-none focus:border-blue-500"
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-300 font-semibold block mb-0.5">
                  Alamat Lengkap Pengantaran
                </label>
                <textarea
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Contoh: Jl. Melati No. 12, Pagar Hitam, Patokan depan indomaret..."
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-slate-100 outline-none focus:border-blue-500 placeholder-slate-500"
                />
              </div>
            </div>
          )}

          {/* Customer selection */}
          <div className="flex items-center justify-between gap-1 pt-0.5">
            <div className="flex items-center gap-1.5 flex-1 min-w-0 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedCustomer?.id || ''}
                onChange={(e) => {
                  const cust = customers.find((c) => c.id === e.target.value);
                  setSelectedCustomer(cust);
                }}
                className="text-xs font-medium bg-transparent border-0 text-slate-200 outline-none cursor-pointer truncate w-full"
              >
                <option value="" className="bg-slate-900 text-slate-200">Pelanggan Umum (Walk-in)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                    {c.name} ({c.tier} - {c.points} Poin)
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setIsNewCustomerModalOpen(true)}
              className="text-[11px] text-orange-400 hover:text-orange-300 font-bold shrink-0 bg-slate-900 px-2 py-1.5 rounded-lg border border-slate-800 hover:border-orange-500/60 transition-colors"
            >
              + Baru
            </button>
          </div>
        </div>

        {/* Cart Items List: min-h-0 enables proper vertical flex scrolling */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 bg-slate-950">
          {cart.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center text-slate-500 space-y-1">
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 mb-1 border border-slate-800">
                <Coffee className="w-5 h-5 text-slate-500" />
              </div>
              <p className="text-xs font-semibold text-slate-300">Keranjang Masih Kosong</p>
              <p className="text-[11px] text-slate-500">Pilih menu di sebelah kiri untuk menambah pesanan</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartItemId}
                className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <h5 className="font-bold text-slate-100 truncate">{item.product.name}</h5>
                    {item.selectedVariants && item.selectedVariants.length > 0 && (
                      <p className="text-[10px] text-slate-400 leading-tight">
                        {item.selectedVariants.map((v) => v.optionName).join(', ')}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-[10px] text-orange-400 italic">*{item.notes}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCartItem(item.cartItemId)}
                    className="text-slate-500 hover:text-rose-400 min-h-[40px] min-w-[40px] flex items-center justify-center -mr-1 -mt-1 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Hapus item dari pesanan"
                  >
                    <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-400" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono font-bold text-orange-400 tabular-nums">
                    {formatRupiah(item.totalPrice)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.cartItemId, -1)}
                      className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 hover:bg-slate-700 active:scale-95 shadow-2xs transition-all"
                      title="Kurangi qty"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-bold text-sm font-mono text-slate-100 tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.cartItemId, 1)}
                      className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 active:scale-95 shadow-2xs transition-all"
                      title="Tambah qty"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Calculation & Discounts Footer: shrink-0 guarantees visibility on all screens */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-2 text-xs shrink-0">
          {/* Quick Discount Buttons */}
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Percent className="w-3 h-3 text-orange-400" />
              Diskon:
            </span>
            <div className="flex gap-1">
              {[0, 10, 20, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    if (d > 20) {
                      setPendingDiscountPercent(d);
                    } else {
                      setDiscountPercent(d);
                      setCustomDiscountNominal(0);
                    }
                  }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono transition-colors ${
                    discountPercent === d && customDiscountNominal === 0
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                  title={d > 20 ? 'Diskon khusus memerlukan PIN supervisor' : undefined}
                >
                  {d === 0 ? 'Tanpa' : `${d}%`}
                  {d > 20 && ' 🔒'}
                </button>
              ))}
            </div>
          </div>

          {/* Breakdown numbers */}
          <div className="space-y-1 text-slate-300 text-xs pt-1 border-t border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-400">Subtotal</span>
              <span className="font-mono tabular-nums text-slate-200">{formatRupiah(subtotal)}</span>
            </div>
            {calculatedDiscount > 0 && (
              <div className="flex justify-between text-rose-400 font-medium">
                <span>Diskon {discountPercent > 0 ? `(${discountPercent}%)` : ''}</span>
                <span className="font-mono tabular-nums">-{formatRupiah(calculatedDiscount)}</span>
              </div>
            )}
            {settings.enableTax && (
              <div className="flex justify-between text-slate-400">
                <span>PPN ({settings.taxRate}%)</span>
                <span className="font-mono tabular-nums text-slate-200">{formatRupiah(taxAmount)}</span>
              </div>
            )}
            {effectiveDeliveryFee > 0 && (
              <div className="flex justify-between text-cyan-400">
                <span>Ongkos Kirim</span>
                <span className="font-mono tabular-nums">{formatRupiah(effectiveDeliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-800 font-black">
              <span className="text-sm font-bold tracking-tight flex items-center gap-1 font-mono text-slate-100">
                <span className="text-orange-500">➜</span>
                <span>TOTAL TAGIHAN</span>
              </span>
              <span className="text-lg font-mono text-orange-400 font-black tabular-nums">{formatRupiah(grandTotal)}</span>
            </div>
          </div>

          {/* Action Buttons: Responsive 2-Row Layout (Toolbar + Full-Width CTA) */}
          <div className="space-y-2 pt-1">
            {/* Row 1: Operational Action Toolbar */}
            <div className={`grid gap-1.5 ${orderType === 'Dine In' ? 'grid-cols-4' : 'grid-cols-2'}`}>
              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => setShowPreBill(true)}
                className="min-h-[42px] py-2 px-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-amber-300 border border-amber-800/60 font-bold rounded-xl text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-colors active:scale-95"
                title="Cetak lembar tagihan sementara untuk meja tamu sebelum bayar"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Bill</span>
              </button>

              <button
                type="button"
                disabled={cart.length === 0}
                onClick={() => setShowKitchenTicket(true)}
                className="min-h-[42px] py-2 px-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-sky-300 border border-sky-800/60 font-bold rounded-xl text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-colors active:scale-95"
                title="Cetak Tiket Dapur (KOT) untuk koki / barista sebelum bayar"
              >
                <ChefHat className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">KOT</span>
              </button>

              {orderType === 'Dine In' && (
                <>
                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={handleHoldOrderToTable}
                    className="min-h-[42px] py-2 px-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-blue-300 border border-blue-800/60 font-bold rounded-xl text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-colors active:scale-95"
                    title="Simpan pesanan ke meja ini sebagai Open Bill & kirim ke Dapur"
                  >
                    <BookmarkCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">Simpan</span>
                  </button>

                  <button
                    type="button"
                    disabled={cart.length === 0 && !activeTableOrder}
                    onClick={() => setShowSplitBill(true)}
                    className="min-h-[42px] py-2 px-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-purple-300 border border-purple-800/60 font-bold rounded-xl text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-colors active:scale-95"
                    title="Pisah tagihan per menu atau bagi sama rata per orang"
                  >
                    <Split className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">Split</span>
                  </button>
                </>
              )}
            </div>

            {/* Row 2: Full-Width Primary Checkout CTA */}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleCheckoutClick}
              className="w-full min-h-[48px] py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-extrabold rounded-xl text-sm flex items-center justify-between px-4 shadow-lg shadow-orange-950/40 active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 shrink-0 text-white" />
                <span className="tracking-wide">BAYAR SEKARANG</span>
              </div>
              <span className="font-mono text-base font-black tabular-nums">{formatRupiah(grandTotal)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Product Variant Modal */}
      {selectedProductForVariant && (
        <ProductVariantModal
          product={selectedProductForVariant}
          onClose={() => setSelectedProductForVariant(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* Pre-Bill Modal (Guest Proforma Bill) */}
      {showPreBill && (
        <PreBillModal
          cart={cart}
          orderType={orderType}
          tableNumber={tableNumber}
          customer={selectedCustomer}
          subtotal={subtotal}
          discountNominal={calculatedDiscount}
          discountPercent={discountPercent}
          taxAmount={taxAmount}
          taxPercent={settings.taxRate}
          deliveryFee={effectiveDeliveryFee}
          deliveryAddress={deliveryAddress}
          pickupDate={pickupDate}
          pickupTime={pickupTime}
          grandTotal={grandTotal}
          cashierName={activeShift.cashierName}
          settings={settings}
          onClose={() => setShowPreBill(false)}
        />
      )}

      {/* Kitchen Order Ticket (KOT) Modal directly from cart */}
      {showKitchenTicket && (
        <KitchenTicketModal
          orderNumber={`#DRAF-${Date.now().toString().slice(-4)}`}
          createdAt={new Date().toISOString()}
          cart={cart}
          orderType={orderType}
          tableNumber={tableNumber}
          customer={selectedCustomer}
          cashierName={activeShift.cashierName}
          settings={settings}
          onClose={() => setShowKitchenTicket(false)}
        />
      )}

      {/* Payment Modal */}
      {isPaymentOpen && (
        <PaymentModal
          totalAmount={grandTotal}
          orderData={{
            items: cart,
            subtotal,
            discountPercent,
            discountNominal: calculatedDiscount,
            taxPercent: settings.enableTax ? settings.taxRate : 0,
            taxAmount,
            serviceCharge: 0,
            deliveryFee: effectiveDeliveryFee,
            deliveryAddress: orderType === 'Delivery' ? deliveryAddress : undefined,
            pickupDate: orderType === 'Pre-Order' || orderType === 'Take Away' ? pickupDate : undefined,
            pickupTime: orderType === 'Pre-Order' || orderType === 'Take Away' ? pickupTime : undefined,
            isPreOrder: orderType === 'Pre-Order',
            total: grandTotal,
            totalCost,
            grossProfit: grandTotal - totalCost,
            orderType,
            tableNumber: orderType === 'Dine In' ? tableNumber : undefined,
            customer: selectedCustomer,
            cashierName: activeShift.cashierName,
            status: orderType === 'Pre-Order' ? 'Diproses' : 'Selesai',
          }}
          onClose={() => setIsPaymentOpen(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Completed Receipt Modal */}
      {completedOrder && (
        <ReceiptModal
          order={completedOrder}
          settings={settings}
          onClose={() => setCompletedOrder(null)}
          onNewOrder={handleNewOrder}
        />
      )}

      {/* Quick Add Customer Modal */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl max-w-sm w-full p-4 space-y-3">
            <h4 className="font-bold text-slate-100 text-sm">Tambah Pelanggan Baru</h4>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg outline-none text-slate-100 placeholder-slate-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">No. WhatsApp / Telepon</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="Contoh: 0812-3456-7890"
                  className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg outline-none text-slate-100 placeholder-slate-500 focus:border-orange-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="flex-1 py-2 text-xs font-bold border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera & Barcode Scanner Simulator Modal */}
      {showCameraScanner && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in">
            {/* Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Pemindai Barcode Kamera & Laser Scanner</h4>
                  <p className="text-[10px] text-slate-400">Scan via kamera gawai/webcam atau simulasi laser</p>
                </div>
              </div>
              <button
                onClick={() => setShowCameraScanner(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Viewfinder Area */}
            <div className="p-4 bg-black flex flex-col items-center justify-center relative overflow-hidden h-44 border-b border-slate-800">
              {/* Scanning Target frame */}
              <div className="w-48 h-24 border-2 border-orange-500 rounded-xl relative flex items-center justify-center bg-orange-950/20">
                {/* Laser line animation */}
                <div className="absolute left-2 right-2 h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-bounce" />
                <span className="text-[10px] font-mono font-bold text-orange-300 tracking-wider">
                  ARAHKAN BARCODE KE SINI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                Sensor kamera siap • Audio bip laser kasir aktif
              </p>
            </div>

            {/* Barcode Test Shelf */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2 bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  Uji Coba Cepat (Pilih Produk untuk Discan):
                </span>
                <span className="text-[10px] text-slate-500">Klik untuk memindai seketika</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {products.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleScanBarcodeFromCamera(p.barcode)}
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-800 hover:border-orange-500 hover:bg-slate-800 text-left flex items-center justify-between transition-all group"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-bold text-xs text-slate-200 block truncate">{p.name}</span>
                      <span className="font-mono text-[10px] text-orange-400 font-semibold">
                        {p.barcode}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-orange-500 group-hover:bg-orange-600 text-white px-2 py-1 rounded-md shrink-0">
                      Scan ⚡
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCameraScanner(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors"
              >
                Tutup Pemindai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supervisor PIN Modal for High Discount */}
      {pendingDiscountPercent !== null && (
        <SupervisorPinModal
          correctPin={settings.supervisorPin || '1234'}
          actionTitle={`Otorisasi Diskon Khusus ${pendingDiscountPercent}%`}
          actionDescription="Pemberian diskon di atas 20% mewajibkan persetujuan PIN Supervisor / Manajer."
          onSuccess={() => {
            setDiscountPercent(pendingDiscountPercent);
            setCustomDiscountNominal(0);
            showToast(`Diskon khusus ${pendingDiscountPercent}% berhasil disetujui!`);
            setPendingDiscountPercent(null);
          }}
          onClose={() => setPendingDiscountPercent(null)}
        />
      )}

      {/* Table Management Floor Map Modal */}
      {showTableModal && (
        <TableManagementModal
          orders={orders}
          settings={settings}
          cashierName={activeShift.cashierName}
          onClose={() => setShowTableModal(false)}
          onSelectTableForPOS={(tbl) => {
            setOrderType('Dine In');
            setTableNumber(tbl);
            const ord = activeDineInOrders.find((o) => o.tableNumber === tbl);
            if (ord) {
              handleLoadTableOrderToCart(ord);
            }
          }}
          onMoveTable={(fromTbl, toTbl) => {
            if (onMoveTable) onMoveTable(fromTbl, toTbl);
            if (tableNumber === fromTbl) setTableNumber(toTbl);
            showToast(`Pesanan berhasil dipindahkan dari ${fromTbl} ke ${toTbl}`);
          }}
          onMergeTables={(srcTbl, tgtTbl) => {
            if (onMergeTables) onMergeTables(srcTbl, tgtTbl);
            if (tableNumber === srcTbl) setTableNumber(tgtTbl);
            showToast(`Pesanan ${srcTbl} berhasil digabung ke ${tgtTbl}`);
          }}
          onPaySubBill={(paidOrder, remOrder) => {
            if (onPaySubBill) onPaySubBill(paidOrder, remOrder);
            showToast(`Sub-tagihan ${paidOrder.orderNumber} berhasil dibayar!`);
          }}
          onCompleteEqualSplit={(updatedMaster) => {
            if (onCompleteEqualSplit) onCompleteEqualSplit(updatedMaster);
            showToast(`Progres pisah tagihan berhasil disimpan!`);
          }}
        />
      )}

      {/* Split Bill Modal */}
      {showSplitBill && (
        <SplitBillModal
          order={
            activeTableOrder || {
              id: `ord-${Date.now()}`,
              orderNumber: `#${Math.floor(1000 + Math.random() * 9000)}`,
              createdAt: new Date().toISOString(),
              items: cart,
              subtotal,
              discountPercent,
              discountNominal: calculatedDiscount,
              taxPercent: settings.enableTax ? settings.taxRate : 0,
              taxAmount,
              serviceCharge: 0,
              total: grandTotal,
              totalCost,
              grossProfit: grandTotal - totalCost,
              paymentMethod: 'Tunai',
              amountPaid: grandTotal,
              changeAmount: 0,
              orderType: 'Dine In',
              tableNumber,
              customer: selectedCustomer,
              cashierName: activeShift.cashierName,
              status: 'Diproses',
              kitchenStatus: 'Antre',
            }
          }
          settings={settings}
          cashierName={activeShift.cashierName}
          onClose={() => setShowSplitBill(false)}
          onPaySubBill={(paidOrder, remOrder) => {
            if (onPaySubBill) onPaySubBill(paidOrder, remOrder);
            if (remOrder) {
              setCart(remOrder.items);
            } else {
              setCart([]);
            }
            setShowSplitBill(false);
            showToast(`Sub-bill ${paidOrder.orderNumber} berhasil dibayar!`);
          }}
          onCompleteEqualSplit={(updatedMaster) => {
            if (onCompleteEqualSplit) onCompleteEqualSplit(updatedMaster);
            setShowSplitBill(false);
            showToast(`Progres pisah tagihan tersimpan!`);
          }}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-slate-100 px-4 py-2 rounded-full text-xs font-semibold shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Info className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
