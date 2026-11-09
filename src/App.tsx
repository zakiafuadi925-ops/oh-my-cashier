import React, { useState, useEffect } from 'react';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_CUSTOMERS,
  INITIAL_INGREDIENTS,
  INITIAL_ORDERS,
  INITIAL_SHIFT,
  INITIAL_SETTINGS,
} from './mockData';
import {
  Product,
  Customer,
  Ingredient,
  Order,
  Shift,
  ShiftCashEntry,
  StoreSettings,
  KitchenStatus,
  OhMyCashierBackupData,
  LicenseInfo,
} from './types';
import { loadLicenseInfo } from './utils/license';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { POSView } from './components/POS/POSView';
import { KitchenDisplayView } from './components/Kitchen/KitchenDisplayView';
import { TransactionHistory } from './components/Transactions/TransactionHistory';
import { ProductManagement } from './components/Products/ProductManagement';
import { IngredientsView } from './components/Inventory/IngredientsView';
import { ShiftManagement } from './components/Shift/ShiftManagement';
import { ReportsView } from './components/Reports/ReportsView';
import { SettingsView } from './components/Settings/SettingsView';
import { ReceiptModal } from './components/POS/ReceiptModal';
import { ActivationModal } from './components/Settings/ActivationModal';
import { safeLoad, safeSave } from './lib/storage';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('pos');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [cartCount, setCartCount] = useState<number>(() => {
    try {
      const saved =
        localStorage.getItem('omc_active_cart') ||
        localStorage.getItem('ohmycashier_active_cart') ||
        localStorage.getItem('kasgo_active_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed)
          ? parsed.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)
          : 0;
      }
    } catch {}
    return 0;
  });

  // Application Data States (persisted to browser localStorage via Zod-validated omc_ keys)
  const [products, setProducts] = useState<Product[]>(() =>
    safeLoad('omc_products', INITIAL_PRODUCTS)
  );
  const [categories, setCategories] = useState<string[]>(() =>
    safeLoad('omc_categories', INITIAL_CATEGORIES)
  );
  const [customers, setCustomers] = useState<Customer[]>(() =>
    safeLoad('omc_customers', INITIAL_CUSTOMERS)
  );
  const [ingredients, setIngredients] = useState<Ingredient[]>(() =>
    safeLoad('omc_ingredients', INITIAL_INGREDIENTS)
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    safeLoad('omc_orders', INITIAL_ORDERS)
  );
  const [activeShift, setActiveShift] = useState<Shift>(() =>
    safeLoad('omc_shift', INITIAL_SHIFT)
  );
  const [settings, setSettings] = useState<StoreSettings>(() =>
    safeLoad('omc_settings', INITIAL_SETTINGS)
  );
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo>(() => loadLicenseInfo());

  // Sync state changes to localStorage with Zod validation
  useEffect(() => {
    safeSave('omc_products', products);
  }, [products]);

  useEffect(() => {
    safeSave('omc_categories', categories);
  }, [categories]);

  useEffect(() => {
    safeSave('omc_customers', customers);
  }, [customers]);

  useEffect(() => {
    safeSave('omc_ingredients', ingredients);
  }, [ingredients]);

  useEffect(() => {
    safeSave('omc_orders', orders);
  }, [orders]);

  useEffect(() => {
    safeSave('omc_shift', activeShift);
  }, [activeShift]);

  useEffect(() => {
    safeSave('omc_settings', settings);
  }, [settings]);

  // Test receipt modal from Settings
  const [testReceiptOrder, setTestReceiptOrder] = useState<Order | null>(null);
  const [isGlobalLicenseModalOpen, setIsGlobalLicenseModalOpen] = useState<boolean>(false);

  // Handler: When an order is successfully completed in POS
  const handleOrderCompleted = (newOrder: Order) => {
    // 1. Add to orders list
    setOrders((prev) => [newOrder, ...prev]);

    // 2. Reduce product stocks
    setProducts((prev) =>
      prev.map((prod) => {
        const itemInOrder = newOrder.items.find((item) => item.product.id === prod.id);
        if (itemInOrder) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - itemInOrder.quantity),
          };
        }
        return prod;
      })
    );

    // 2b. Automatically deduct raw ingredients based on Recipe / BOM
    setIngredients((prevIngs) => {
      const updated = [...prevIngs];
      newOrder.items.forEach((cartItem) => {
        const recipe = cartItem.product.ingredients;
        if (recipe && recipe.length > 0) {
          recipe.forEach((rec) => {
            const ingIndex = updated.findIndex((i) => i.id === rec.ingredientId);
            if (ingIndex !== -1) {
              const deduct = rec.amount * cartItem.quantity;
              const newStock = Math.max(0, +(updated[ingIndex].stock - deduct).toFixed(3));
              updated[ingIndex] = {
                ...updated[ingIndex],
                stock: newStock,
              };
            }
          });
        }
      });
      return updated;
    });

    // 3. Update shift metrics
    if (activeShift.status === 'Open') {
      setActiveShift((prev) => {
        const isCash = newOrder.paymentMethod === 'Tunai';
        const newCashSales = isCash ? prev.cashSales + newOrder.total : prev.cashSales;
        const newNonCashSales = !isCash ? prev.nonCashSales + newOrder.total : prev.nonCashSales;
        const newExpectedCash = isCash ? prev.expectedCash + newOrder.total : prev.expectedCash;

        return {
          ...prev,
          cashSales: newCashSales,
          nonCashSales: newNonCashSales,
          expectedCash: newExpectedCash,
        };
      });
    }

    // 4. Update customer loyalty if customer is attached
    if (newOrder.customer) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === newOrder.customer?.id) {
            const addedPoints = Math.floor(newOrder.total / 10000); // 1 point per Rp 10.000
            return {
              ...c,
              totalOrders: c.totalOrders + 1,
              totalSpent: c.totalSpent + newOrder.total,
              points: c.points + addedPoints,
            };
          }
          return c;
        })
      );
    }
  };

  // Handler: Void / Cancel order
  const handleCancelOrder = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || targetOrder.status === 'Dibatalkan') return;

    // Rollback stock
    setProducts((prev) =>
      prev.map((prod) => {
        const ordered = targetOrder.items.find((i) => i.product.id === prod.id);
        if (ordered) {
          return {
            ...prod,
            stock: prod.stock + ordered.quantity,
          };
        }
        return prod;
      })
    );

    // Rollback ingredients
    setIngredients((prevIngs) => {
      const updated = [...prevIngs];
      targetOrder.items.forEach((cartItem) => {
        const recipe = cartItem.product.ingredients;
        if (recipe && recipe.length > 0) {
          recipe.forEach((rec) => {
            const ingIndex = updated.findIndex((i) => i.id === rec.ingredientId);
            if (ingIndex !== -1) {
              const addBack = rec.amount * cartItem.quantity;
              const newStock = +(updated[ingIndex].stock + addBack).toFixed(3);
              updated[ingIndex] = {
                ...updated[ingIndex],
                stock: newStock,
              };
            }
          });
        }
      });
      return updated;
    });

    // Rollback shift if cash
    if (targetOrder.paymentMethod === 'Tunai' && activeShift.status === 'Open') {
      setActiveShift((prev) => ({
        ...prev,
        cashSales: Math.max(0, prev.cashSales - targetOrder.total),
        expectedCash: Math.max(0, prev.expectedCash - targetOrder.total),
      }));
    }

    // Set status to cancelled
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'Dibatalkan' } : o))
    );
  };

  // Handler: Update order status (for Pre-Order lifecycle: Diproses -> Siap Diambil -> Selesai)
  const handleUpdateOrderStatus = (
    orderId: string,
    newStatus: 'Selesai' | 'Siap Diambil' | 'Diproses'
  ) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  // Handler: Update Kitchen status (KDS lifecycle: Antre -> Dimasak -> Siap Saji -> Selesai)
  const handleUpdateKitchenStatus = (orderId: string, newStatus: KitchenStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        // Also sync overall order status if ready or completed
        let overallStatus = o.status;
        if (newStatus === 'Siap Saji') {
          overallStatus = o.orderType === 'Pre-Order' ? 'Siap Diambil' : 'Diproses';
        } else if (newStatus === 'Selesai') {
          overallStatus = 'Selesai';
        }
        return {
          ...o,
          kitchenStatus: newStatus,
          status: overallStatus,
        };
      })
    );
  };

  // Handler: Toggle kitchen item check in checklist
  const handleToggleKitchenItemCheck = (orderId: string, cartItemId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const current = o.completedItemIds || [];
        const next = current.includes(cartItemId)
          ? current.filter((id) => id !== cartItemId)
          : [...current, cartItemId];
        return { ...o, completedItemIds: next };
      })
    );
  };

  // Handler: Move Table (Pindah Meja)
  const handleMoveTable = (fromTable: string, toTable: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (
          o.orderType === 'Dine In' &&
          o.tableNumber === fromTable &&
          o.status !== 'Selesai' &&
          o.status !== 'Dibatalkan'
        ) {
          return {
            ...o,
            tableNumber: toTable,
            notes: o.notes ? `${o.notes} (Pindah dari ${fromTable})` : `Pindah dari ${fromTable}`,
          };
        }
        return o;
      })
    );
  };

  // Handler: Merge Tables (Gabung Meja)
  const handleMergeTables = (sourceTable: string, targetTable: string) => {
    const sourceOrder = orders.find(
      (o) =>
        o.orderType === 'Dine In' &&
        o.tableNumber === sourceTable &&
        o.status !== 'Selesai' &&
        o.status !== 'Dibatalkan'
    );
    const targetOrder = orders.find(
      (o) =>
        o.orderType === 'Dine In' &&
        o.tableNumber === targetTable &&
        o.status !== 'Selesai' &&
        o.status !== 'Dibatalkan'
    );

    if (!sourceOrder || !targetOrder) return;

    // Combine items
    const mergedItems = [...targetOrder.items, ...sourceOrder.items];
    const newSubtotal = mergedItems.reduce((acc, it) => acc + it.totalPrice, 0);
    const taxRate = settings.enableTax ? settings.taxRate : 0;
    const newTax = Math.round(newSubtotal * (taxRate / 100));
    const newTotal = newSubtotal + newTax;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === targetOrder.id) {
          return {
            ...o,
            items: mergedItems,
            subtotal: newSubtotal,
            taxAmount: newTax,
            total: newTotal,
            notes: o.notes
              ? `${o.notes} (Gabungan dari ${sourceTable})`
              : `Gabungan dari ${sourceTable}`,
          };
        }
        if (o.id === sourceOrder.id) {
          return {
            ...o,
            status: 'Dibatalkan',
            notes: `Tagihan digabung ke ${targetTable}`,
          };
        }
        return o;
      })
    );
  };

  // Handler: Hold Order To Table (Simpan Meja / Open Bill)
  const handleHoldOrderToTable = (holdOrder: Order) => {
    // 1. Add to orders
    setOrders((prev) => [holdOrder, ...prev]);

    // 2. Reduce product stocks
    setProducts((prev) =>
      prev.map((prod) => {
        const itemInOrder = holdOrder.items.find((item) => item.product.id === prod.id);
        if (itemInOrder) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - itemInOrder.quantity),
          };
        }
        return prod;
      })
    );

    // 3. Deduct raw ingredients
    setIngredients((prevIngs) => {
      const updated = [...prevIngs];
      holdOrder.items.forEach((cartItem) => {
        const recipe = cartItem.product.ingredients;
        if (recipe && recipe.length > 0) {
          recipe.forEach((rec) => {
            const ingIndex = updated.findIndex((i) => i.id === rec.ingredientId);
            if (ingIndex !== -1) {
              const deduct = rec.amount * cartItem.quantity;
              const newStock = Math.max(0, +(updated[ingIndex].stock - deduct).toFixed(3));
              updated[ingIndex] = {
                ...updated[ingIndex],
                stock: newStock,
              };
            }
          });
        }
      });
      return updated;
    });
  };

  // Handler: Pay Sub-Bill from Split Bill
  const handlePaySubBill = (paidOrder: Order, remainingOrder?: Order) => {
    // Record paid sub-order into orders
    setOrders((prev) => {
      let nextOrders = [paidOrder, ...prev];
      if (remainingOrder) {
        // Update the parent active order with remaining items
        nextOrders = nextOrders.map((o) =>
          o.id === paidOrder.parentOrderId
            ? {
                ...o,
                items: remainingOrder.items,
                subtotal: remainingOrder.subtotal,
                taxAmount: remainingOrder.taxAmount,
                total: remainingOrder.total,
              }
            : o
        );
      } else if (paidOrder.parentOrderId) {
        // If no remaining items, mark parent master order as Selesai
        nextOrders = nextOrders.map((o) =>
          o.id === paidOrder.parentOrderId ? { ...o, status: 'Selesai', kitchenStatus: 'Selesai' } : o
        );
      }
      return nextOrders;
    });

    // Update shift metrics
    if (activeShift.status === 'Open') {
      setActiveShift((prev) => {
        const isCash = paidOrder.paymentMethod === 'Tunai';
        const newCashSales = isCash ? prev.cashSales + paidOrder.total : prev.cashSales;
        const newNonCashSales = !isCash ? prev.nonCashSales + paidOrder.total : prev.nonCashSales;
        const newExpectedCash = isCash ? prev.expectedCash + paidOrder.total : prev.expectedCash;
        return {
          ...prev,
          cashSales: newCashSales,
          nonCashSales: newNonCashSales,
          expectedCash: newExpectedCash,
        };
      });
    }
  };

  // Handler: Complete Equal Split Progress
  const handleCompleteEqualSplit = (updatedMasterOrder: Order) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedMasterOrder.id ? updatedMasterOrder : o))
    );

    // If all guests paid, register total into shift
    if (updatedMasterOrder.status === 'Selesai' && activeShift.status === 'Open') {
      const paidPersons = updatedMasterOrder.splitPayments || [];
      const cashSum = paidPersons
        .filter((p) => p.isPaid && p.paymentMethod === 'Tunai')
        .reduce((sum, p) => sum + p.amount, 0);
      const nonCashSum = paidPersons
        .filter((p) => p.isPaid && p.paymentMethod !== 'Tunai')
        .reduce((sum, p) => sum + p.amount, 0);

      setActiveShift((prev) => ({
        ...prev,
        cashSales: prev.cashSales + cashSum,
        nonCashSales: prev.nonCashSales + nonCashSum,
        expectedCash: prev.expectedCash + cashSum,
      }));
    }
  };

  // Product CRUD
  const handleAddProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
    if (!categories.includes(newProd.category)) {
      setCategories((prev) => [...prev, newProd.category]);
    }
  };

  const handleUpdateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleAddCategory = (cat: string) => {
    if (!categories.includes(cat)) {
      setCategories((prev) => [...prev, cat]);
    }
  };

  const handleDeleteCategory = (cat: string) => {
    setCategories((prev) => prev.filter((c) => c !== cat));
  };

  const handleAdjustStock = (productId: string, newStock: number, _reason: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );
  };

  // Ingredient Handlers
  const handleAddIngredient = (ing: Ingredient) => {
    setIngredients((prev) => [ing, ...prev]);
  };

  const handleUpdateIngredient = (updated: Ingredient) => {
    setIngredients((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleDeleteIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const handleRestockIngredient = (id: string, additionalAmount: number) => {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, stock: i.stock + additionalAmount } : i))
    );
  };

  // Customer handler
  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
  };

  // Shift Handlers
  const handleAddCashEntry = (entry: ShiftCashEntry) => {
    setActiveShift((prev) => {
      const isCashIn = entry.type === 'Kas Masuk';
      const newCashIn = isCashIn ? prev.cashIn + entry.amount : prev.cashIn;
      const newCashOut = !isCashIn ? prev.cashOut + entry.amount : prev.cashOut;
      const newExpected = isCashIn
        ? prev.expectedCash + entry.amount
        : prev.expectedCash - entry.amount;

      return {
        ...prev,
        cashIn: newCashIn,
        cashOut: newCashOut,
        expectedCash: newExpected,
        entries: [entry, ...prev.entries],
      };
    });
  };

  const handleCloseShift = (actualCash: number) => {
    setActiveShift((prev) => ({
      ...prev,
      actualCash,
      discrepancy: actualCash - prev.expectedCash,
      endTime: new Date().toISOString(),
      status: 'Closed',
    }));
  };

  const handleStartNewShift = (cashierName: string, initialCash: number) => {
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      cashierName,
      startTime: new Date().toISOString(),
      initialCash,
      cashSales: 0,
      nonCashSales: 0,
      cashIn: 0,
      cashOut: 0,
      expectedCash: initialCash,
      status: 'Open',
      entries: [],
    };
    setActiveShift(newShift);
  };

  // Handler: Restore Complete Database (.json)
  const handleRestoreFullDatabase = (backup: OhMyCashierBackupData) => {
    if (!backup?.data) return;

    const {
      products: restoredProducts,
      categories: restoredCategories,
      customers: restoredCustomers,
      ingredients: restoredIngredients,
      orders: restoredOrders,
      shift: restoredShift,
      settings: restoredSettings,
    } = backup.data;

    if (restoredProducts) setProducts(restoredProducts);
    if (restoredCategories) setCategories(restoredCategories);
    if (restoredCustomers) setCustomers(restoredCustomers);
    if (restoredIngredients) setIngredients(restoredIngredients);
    if (restoredOrders) setOrders(restoredOrders);
    if (restoredShift) setActiveShift(restoredShift);
    if (restoredSettings) setSettings(restoredSettings);

    try {
      if (restoredProducts) safeSave('omc_products', restoredProducts);
      if (restoredCategories) safeSave('omc_categories', restoredCategories);
      if (restoredCustomers) safeSave('omc_customers', restoredCustomers);
      if (restoredIngredients) safeSave('omc_ingredients', restoredIngredients);
      if (restoredOrders) safeSave('omc_orders', restoredOrders);
      if (restoredShift) safeSave('omc_shift', restoredShift);
      if (restoredSettings) safeSave('omc_settings', restoredSettings);
    } catch (e) {
      console.error('Failed to sync restored backup to localStorage', e);
    }
  };

  const activeKitchenCount = orders.filter(
    (o) => (o.kitchenStatus || 'Antre') !== 'Selesai' && o.status !== 'Dibatalkan'
  ).length;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-50 overflow-hidden select-none">
      {/* Top Application Header */}
      <Header
        settings={settings}
        activeShift={activeShift}
        onOpenShiftTab={() => setCurrentTab('shift')}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        licenseInfo={licenseInfo}
        onOpenLicenseModal={() => setIsGlobalLicenseModalOpen(true)}
      />

      {/* Main Layout: Sidebar + Dynamic View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar (Desktop & Tablet) & Mobile Bottom Nav / Drawer */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setIsMobileMenuOpen(false);
          }}
          cartCount={cartCount}
          kitchenCount={activeKitchenCount}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onOpenMobile={() => setIsMobileMenuOpen(true)}
        />

        {/* Dynamic View Canvas: pb-16 on mobile (< 768px) to prevent bottom nav bar overlap */}
        <main className="flex-1 flex flex-col overflow-hidden relative pb-16 md:pb-0 bg-slate-900 text-slate-100">
          {currentTab === 'pos' && (
            <POSView
              products={products}
              categories={categories}
              customers={customers}
              settings={settings}
              activeShift={activeShift}
              orders={orders}
              onCartCountChange={setCartCount}
              onOrderCompleted={handleOrderCompleted}
              onAddCustomer={handleAddCustomer}
              onHoldOrderToTable={handleHoldOrderToTable}
              onMoveTable={handleMoveTable}
              onMergeTables={handleMergeTables}
              onPaySubBill={handlePaySubBill}
              onCompleteEqualSplit={handleCompleteEqualSplit}
              licenseInfo={licenseInfo}
              onOpenLicenseModal={() => setIsGlobalLicenseModalOpen(true)}
            />
          )}

          {currentTab === 'kitchen' && (
            <KitchenDisplayView
              orders={orders}
              settings={settings}
              onUpdateKitchenStatus={handleUpdateKitchenStatus}
              onToggleKitchenItemCheck={handleToggleKitchenItemCheck}
              onNavigateToPOS={() => setCurrentTab('pos')}
            />
          )}

          {currentTab === 'history' && (
            <TransactionHistory
              orders={orders}
              settings={settings}
              onCancelOrder={handleCancelOrder}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}

          {currentTab === 'products' && (
            <ProductManagement
              products={products}
              categories={categories}
              supervisorPin={settings.supervisorPin}
              ingredients={ingredients}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onAdjustStock={handleAdjustStock}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {currentTab === 'ingredients' && (
            <IngredientsView
              ingredients={ingredients}
              products={products}
              orders={orders}
              onAddIngredient={handleAddIngredient}
              onUpdateIngredient={handleUpdateIngredient}
              onDeleteIngredient={handleDeleteIngredient}
              onRestock={handleRestockIngredient}
            />
          )}

          {currentTab === 'shift' && (
            <ShiftManagement
              shift={activeShift}
              onAddCashEntry={handleAddCashEntry}
              onCloseShift={handleCloseShift}
              onStartNewShift={handleStartNewShift}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              orders={orders}
              products={products}
              customers={customers}
              ingredients={ingredients}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              ordersCount={orders.length}
              products={products}
              categories={categories}
              customers={customers}
              ingredients={ingredients}
              orders={orders}
              activeShift={activeShift}
              onUpdateSettings={setSettings}
              onRestoreFullDatabase={handleRestoreFullDatabase}
              licenseInfo={licenseInfo}
              onUpdateLicense={setLicenseInfo}
              onTestPrint={() => {
                if (orders.length > 0) {
                  setTestReceiptOrder(orders[0]);
                }
              }}
              onResetData={() => {
                localStorage.clear();
                setProducts(INITIAL_PRODUCTS);
                setCategories(INITIAL_CATEGORIES);
                setCustomers(INITIAL_CUSTOMERS);
                setIngredients(INITIAL_INGREDIENTS);
                setOrders(INITIAL_ORDERS);
                setActiveShift(INITIAL_SHIFT);
                setSettings(INITIAL_SETTINGS);
              }}
            />
          )}
        </main>
      </div>

      {/* Test Print Modal */}
      {testReceiptOrder && (
        <ReceiptModal
          order={testReceiptOrder}
          settings={settings}
          onClose={() => setTestReceiptOrder(null)}
          onNewOrder={() => setTestReceiptOrder(null)}
        />
      )}

      {/* Global License Activation Modal */}
      {isGlobalLicenseModalOpen && (
        <ActivationModal
          licenseInfo={licenseInfo}
          onUpdateLicense={setLicenseInfo}
          onClose={() => setIsGlobalLicenseModalOpen(false)}
          supervisorPin={settings.supervisorPin || '1234'}
          storeName={settings.storeName || 'Oh My Cashier'}
        />
      )}
    </div>
  );
};
