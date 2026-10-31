import React, { useState } from 'react';
import { Order, CartItem, StoreSettings, PaymentMethod, SplitPaymentPerson } from '../../types';
import { formatRupiah, formatDate } from '../../utils/format';
import { playSound } from '../../utils/audio';
import {
  X,
  Split,
  Users,
  UtensilsCrossed,
  Printer,
  Check,
  CreditCard,
  Banknote,
  QrCode,
  Building2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Receipt,
  RotateCcw,
} from 'lucide-react';

interface SplitBillModalProps {
  order: Order;
  settings: StoreSettings;
  cashierName: string;
  onClose: () => void;
  onPaySubBill: (paidOrder: Order, remainingOrder?: Order) => void;
  onCompleteEqualSplit: (updatedMasterOrder: Order) => void;
}

interface ItemAllocation {
  cartItemId: string;
  billIndex: number; // 0 = Bill A, 1 = Bill B, 2 = Bill C, etc.
  quantity: number;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({
  order,
  settings,
  cashierName,
  onClose,
  onPaySubBill,
  onCompleteEqualSplit,
}) => {
  const [splitMode, setSplitMode] = useState<'per_item' | 'equal'>('per_item');

  // ==========================================
  // MODE 1: SPLIT PER ITEM STATES
  // ==========================================
  const [numBills, setNumBills] = useState<number>(2);
  const [billNames, setBillNames] = useState<string[]>(['Tagihan A', 'Tagihan B', 'Tagihan C', 'Tagihan D']);
  
  // Mapping of item allocation: which item & how many are assigned to which bill
  // We initialize by placing all items in Bill A (index 0)
  const [allocations, setAllocations] = useState<Record<string, number[]>>(() => {
    const init: Record<string, number[]> = {};
    order.items.forEach((item) => {
      // array of quantities assigned to [bill 0, bill 1, bill 2, bill 3]
      const counts = [item.quantity, 0, 0, 0];
      init[item.cartItemId] = counts;
    });
    return init;
  });

  const [activePaymentSubBill, setActivePaymentSubBill] = useState<number | null>(null);
  const [subBillPaymentMethod, setSubBillPaymentMethod] = useState<PaymentMethod>('Tunai');
  const [subBillCashAmount, setSubBillCashAmount] = useState<number>(0);
  const [printedSubBill, setPrintedSubBill] = useState<number | null>(null);

  // Move 1 unit of an item from one bill to another
  const moveItemUnit = (cartItemId: string, fromBill: number, toBill: number) => {
    setAllocations((prev) => {
      const current = prev[cartItemId] ? [...prev[cartItemId]] : [0, 0, 0, 0];
      if ((current[fromBill] || 0) <= 0) return prev;
      current[fromBill] = (current[fromBill] || 0) - 1;
      current[toBill] = (current[toBill] || 0) + 1;
      return { ...prev, [cartItemId]: current };
    });
  };

  // Move all units of an item to a target bill
  const moveAllUnits = (cartItemId: string, toBill: number) => {
    const origItem = order.items.find((i) => i.cartItemId === cartItemId);
    if (!origItem) return;
    setAllocations((prev) => {
      const newCounts = [0, 0, 0, 0];
      newCounts[toBill] = origItem.quantity;
      return { ...prev, [cartItemId]: newCounts };
    });
  };

  // Reset all allocations back to Bill A
  const resetAllocations = () => {
    const init: Record<string, number[]> = {};
    order.items.forEach((item) => {
      init[item.cartItemId] = [item.quantity, 0, 0, 0];
    });
    setAllocations(init);
  };

  // Calculate items in each sub-bill
  const getSubBillItems = (billIdx: number): CartItem[] => {
    const result: CartItem[] = [];
    order.items.forEach((item) => {
      const qty = allocations[item.cartItemId]?.[billIdx] || 0;
      if (qty > 0) {
        result.push({
          ...item,
          quantity: qty,
          totalPrice: item.unitPrice * qty,
        });
      }
    });
    return result;
  };

  const getSubBillCalculation = (billIdx: number) => {
    const items = getSubBillItems(billIdx);
    const subtotal = items.reduce((acc, it) => acc + it.totalPrice, 0);
    const taxRate = settings.enableTax ? settings.taxRate : 0;
    const taxAmount = Math.round(subtotal * (taxRate / 100));
    const total = subtotal + taxAmount;
    return { items, subtotal, taxAmount, total };
  };

  // Handle paying one of the sub-bills
  const handleExecuteSubBillPayment = (billIdx: number) => {
    const { items, subtotal, taxAmount, total } = getSubBillCalculation(billIdx);
    if (items.length === 0) return;

    const paidSubOrder: Order = {
      ...order,
      id: `${order.id}-split-${billIdx + 1}-${Date.now().toString().slice(-4)}`,
      orderNumber: `${order.orderNumber}-${String.fromCharCode(65 + billIdx)}`,
      createdAt: new Date().toISOString(),
      items,
      subtotal,
      discountPercent: 0,
      discountNominal: 0,
      taxPercent: settings.enableTax ? settings.taxRate : 0,
      taxAmount,
      total,
      amountPaid: subBillPaymentMethod === 'Tunai' ? Math.max(total, subBillCashAmount) : total,
      changeAmount: subBillPaymentMethod === 'Tunai' ? Math.max(0, subBillCashAmount - total) : 0,
      paymentMethod: subBillPaymentMethod,
      status: 'Selesai',
      isSplitBill: true,
      parentOrderId: order.id,
      splitBillType: 'per_item',
      splitBillPart: `${billNames[billIdx]} (${billIdx + 1}/${numBills})`,
    };

    // Calculate remaining items that are NOT in this paid bill
    const remainingItems: CartItem[] = [];
    order.items.forEach((item) => {
      const paidQty = allocations[item.cartItemId]?.[billIdx] || 0;
      const leftQty = item.quantity - paidQty;
      if (leftQty > 0) {
        remainingItems.push({
          ...item,
          quantity: leftQty,
          totalPrice: item.unitPrice * leftQty,
        });
      }
    });

    let remainingOrder: Order | undefined = undefined;
    if (remainingItems.length > 0) {
      const remSubtotal = remainingItems.reduce((acc, it) => acc + it.totalPrice, 0);
      const remTax = Math.round(remSubtotal * ((settings.enableTax ? settings.taxRate : 0) / 100));
      remainingOrder = {
        ...order,
        id: `${order.id}-rem-${Date.now().toString().slice(-4)}`,
        items: remainingItems,
        subtotal: remSubtotal,
        taxAmount: remTax,
        total: remSubtotal + remTax,
        status: 'Diproses',
        notes: `Sisa pisah tagihan dari ${order.orderNumber}`,
      };
    }

    playSound('chime_ready');
    onPaySubBill(paidSubOrder, remainingOrder);
  };

  // ==========================================
  // MODE 2: SPLIT EQUALLY (BY PERSON) STATES
  // ==========================================
  const [numPersons, setNumPersons] = useState<number>(2);
  const [splitPayments, setSplitPayments] = useState<SplitPaymentPerson[]>(() => {
    // If order already has split payments saved, use them
    if (order.splitPayments && order.splitPayments.length > 0) {
      return order.splitPayments;
    }
    const perPerson = Math.round(order.total / 2);
    return [
      {
        guestIndex: 1,
        guestName: 'Tamu 1',
        amount: perPerson,
        paymentMethod: 'Tunai',
        isPaid: false,
      },
      {
        guestIndex: 2,
        guestName: 'Tamu 2',
        amount: order.total - perPerson,
        paymentMethod: 'QRIS',
        isPaid: false,
      },
    ];
  });

  const [payingGuestIdx, setPayingGuestIdx] = useState<number | null>(null);
  const [guestCashAmount, setGuestCashAmount] = useState<number>(0);
  const [guestPayMethod, setGuestPayMethod] = useState<PaymentMethod>('Tunai');

  // When changing number of persons in equal split
  const handleUpdateNumPersons = (newCount: number) => {
    if (newCount < 2 || newCount > 10) return;
    setNumPersons(newCount);
    const baseAmount = Math.floor(order.total / newCount);
    const remainder = order.total - baseAmount * newCount;

    const newPayments: SplitPaymentPerson[] = [];
    for (let i = 1; i <= newCount; i++) {
      // Last person gets the remaining odd rupiah so sum is 100% exact
      const amount = i === newCount ? baseAmount + remainder : baseAmount;
      newPayments.push({
        guestIndex: i,
        guestName: `Tamu ${i}`,
        amount,
        paymentMethod: i % 2 === 1 ? 'Tunai' : 'QRIS',
        isPaid: false,
      });
    }
    setSplitPayments(newPayments);
  };

  const handlePayGuest = (guestIdx: number) => {
    setSplitPayments((prev) =>
      prev.map((p) => {
        if (p.guestIndex === guestIdx) {
          return {
            ...p,
            isPaid: true,
            paymentMethod: guestPayMethod,
            paidAt: new Date().toISOString(),
            cashierName,
          };
        }
        return p;
      })
    );

    playSound('chime_ready');
    setPayingGuestIdx(null);
  };

  // Check how many guests paid in equal split
  const paidGuestsCount = splitPayments.filter((p) => p.isPaid).length;
  const totalPaidAmount = splitPayments
    .filter((p) => p.isPaid)
    .reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = Math.max(0, order.total - totalPaidAmount);
  const isAllGuestsPaid = paidGuestsCount === splitPayments.length && splitPayments.length > 0;

  const handleSaveEqualSplit = () => {
    const updatedMaster: Order = {
      ...order,
      splitPayments,
      splitBillType: 'equal',
      isSplitBill: true,
      status: isAllGuestsPaid ? 'Selesai' : order.status,
    };
    onCompleteEqualSplit(updatedMaster);
  };

  const escapeHtml = (str: unknown): string => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // Thermal print handler for individual sub-bill or guest slip (XSS-safe & pop-up blocker proof)
  const handlePrintSlip = (title: string, contentHtml: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapeHtml(title)}</title>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 0; padding: 15px; width: 58mm; color: #000; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 3px 0; }
            @media print { body { width: 58mm; padding: 0; } }
          </style>
        </head>
        <body>
          ${contentHtml}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Print slip failed', err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 backdrop-blur-xs">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-700 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-950 text-slate-100 border-b border-slate-800 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-orange-400">
              <Split className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-100">Pisah Tagihan (Split Bill)</h3>
                <span className="text-xs bg-slate-900 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                  {order.tableNumber || 'Order'} • {order.orderNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pilih metode pemisahan pembayaran per menu atau bagi sama rata per orang
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection: Per Menu vs Sama Rata */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSplitMode('per_item')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                splitMode === 'per_item'
                  ? 'bg-orange-500 text-white shadow-orange-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Pisah per Menu (Custom Items)</span>
            </button>
            <button
              type="button"
              onClick={() => setSplitMode('equal')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                splitMode === 'equal'
                  ? 'bg-orange-500 text-white shadow-orange-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Pisah Sama Rata (Equal Split)</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Total Tagihan Meja: <strong className="text-orange-400 font-bold">{formatRupiah(order.total)}</strong>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ======================================================== */}
          {/* MODE 1: PISAH PER MENU (SPLIT BY ITEMS)                  */}
          {/* ======================================================== */}
          {splitMode === 'per_item' && (
            <div className="space-y-4">
              {/* Controls: Number of bills & Reset */}
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-300">Jumlah Tagihan (Sub-Bills):</span>
                  <div className="flex gap-1">
                    {[2, 3, 4].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setNumBills(count)}
                        className={`px-3 py-1 text-xs rounded-lg font-bold transition-colors ${
                          numBills === count
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {count} Tagihan
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetAllocations}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-100 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset ke Tagihan A</span>
                </button>
              </div>

              {/* Grid of Sub-Bills */}
              <div className={`grid gap-3 ${numBills === 2 ? 'grid-cols-2' : numBills === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                {Array.from({ length: numBills }).map((_, billIdx) => {
                  const billLabel = billNames[billIdx];
                  const { items, subtotal, taxAmount, total } = getSubBillCalculation(billIdx);

                  return (
                    <div
                      key={billIdx}
                      className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col shadow-xs text-slate-200"
                    >
                      {/* Sub-Bill Header */}
                      <div className="bg-slate-950 p-2.5 border-b border-slate-700/80 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-100 block">{billLabel}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {items.reduce((sum, it) => sum + it.quantity, 0)} item hidangan
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-orange-400">
                            {formatRupiah(total)}
                          </span>
                        </div>
                      </div>

                      {/* Items List in this Sub-Bill */}
                      <div className="p-2 space-y-1.5 flex-1 min-h-[160px] max-h-[260px] overflow-y-auto divide-y divide-slate-700/60">
                        {order.items.map((cartItem) => {
                          const assignedQty = allocations[cartItem.cartItemId]?.[billIdx] || 0;
                          if (assignedQty === 0) return null;

                          return (
                            <div key={cartItem.cartItemId} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                              <div className="pr-1 flex-1">
                                <span className="font-semibold text-slate-100 block line-clamp-1">
                                  {cartItem.product.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {assignedQty}x @ {formatRupiah(cartItem.unitPrice)} = {formatRupiah(cartItem.unitPrice * assignedQty)}
                                </span>
                              </div>

                              {/* Transfer Buttons */}
                              <div className="flex items-center gap-1 shrink-0">
                                {billIdx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => moveItemUnit(cartItem.cartItemId, billIdx, billIdx - 1)}
                                    className="p-1 text-slate-400 hover:text-orange-400 hover:bg-slate-700 rounded transition-colors"
                                    title="Pindahkan 1 ke tagihan sebelumnya"
                                  >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <span className="font-mono font-bold text-xs px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-200">
                                  {assignedQty}
                                </span>
                                {billIdx < numBills - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => moveItemUnit(cartItem.cartItemId, billIdx, billIdx + 1)}
                                    className="p-1 text-slate-400 hover:text-orange-400 hover:bg-slate-700 rounded transition-colors"
                                    title="Pindahkan 1 ke tagihan berikutnya"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {items.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center py-6 text-slate-500">
                            <UtensilsCrossed className="w-6 h-6 mb-1 stroke-1" />
                            <span className="text-[11px]">Belum ada item di {billLabel}</span>
                          </div>
                        )}
                      </div>

                      {/* Sub-Bill Calculation Footer */}
                      <div className="p-2.5 bg-slate-950 border-t border-slate-700/80 space-y-1 text-xs">
                        <div className="flex justify-between text-slate-400 text-[11px]">
                          <span>Subtotal:</span>
                          <span className="font-mono text-slate-200">{formatRupiah(subtotal)}</span>
                        </div>
                        {settings.enableTax && (
                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>PPN ({settings.taxRate}%):</span>
                            <span className="font-mono text-slate-200">{formatRupiah(taxAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-slate-100 pt-1 border-t border-slate-800">
                          <span>Total {billLabel}:</span>
                          <span className="font-mono text-orange-400 font-bold">{formatRupiah(total)}</span>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 flex gap-1">
                          <button
                            type="button"
                            disabled={items.length === 0}
                            onClick={() => {
                              setActivePaymentSubBill(billIdx);
                              setSubBillCashAmount(total);
                            }}
                            className="flex-1 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg font-bold text-xs shadow-2xs flex items-center justify-center gap-1 transition-colors active:scale-95"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Bayar {billLabel}</span>
                          </button>
                          <button
                            type="button"
                            disabled={items.length === 0}
                            onClick={() => {
                              const content = `
                                <div class="center bold">${escapeHtml(settings.storeName)}</div>
                                <div class="center">${escapeHtml(order.tableNumber || '')} - ${escapeHtml(billLabel)}</div>
                                <div class="center">Pisah Tagihan (${billIdx + 1}/${numBills})</div>
                                <div class="line"></div>
                                ${items.map((it) => `
                                  <div class="row">
                                    <span>${it.quantity}x ${escapeHtml(it.product.name)}</span>
                                    <span>${formatRupiah(it.totalPrice)}</span>
                                  </div>
                                `).join('')}
                                <div class="line"></div>
                                <div class="row"><span>Subtotal:</span><span>${formatRupiah(subtotal)}</span></div>
                                ${settings.enableTax ? `<div class="row"><span>PPN ${settings.taxRate}%:</span><span>${formatRupiah(taxAmount)}</span></div>` : ''}
                                <div class="row bold"><span>Total:</span><span>${formatRupiah(total)}</span></div>
                                <div class="line"></div>
                                <div class="center">Terima kasih atas kunjungan Anda</div>
                              `;
                              handlePrintSlip(`${order.tableNumber || ''} - ${billLabel}`, content);
                            }}
                            className="px-2 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-slate-200 transition-colors"
                            title="Cetak Struk Thermal Sub-Bill"
                          >
                            <Printer className="w-3.5 h-3.5 text-orange-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sub-Bill Payment Modal Overlay */}
              {activePaymentSubBill !== null && (
                <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden p-5 animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h4 className="font-bold text-slate-100 text-sm">
                          Bayar {billNames[activePaymentSubBill]} • {order.tableNumber}
                        </h4>
                        <p className="text-xs text-slate-400">Pilih metode bayar untuk sub-tagihan ini</p>
                      </div>
                      <button
                        onClick={() => setActivePaymentSubBill(null)}
                        className="p-1 rounded text-slate-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Total info */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center mb-4">
                      <span className="text-xs text-slate-400 font-medium">Tagihan Harus Dibayar:</span>
                      <div className="text-2xl font-black font-mono text-orange-400">
                        {formatRupiah(getSubBillCalculation(activePaymentSubBill).total)}
                      </div>
                    </div>

                    {/* Method Selector */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {(['Tunai', 'QRIS', 'Debit', 'Transfer'] as PaymentMethod[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setSubBillPaymentMethod(m)}
                          className={`p-2 rounded-lg text-xs font-bold border flex items-center gap-2 transition-colors ${
                            subBillPaymentMethod === m
                              ? 'border-orange-500 bg-orange-500/20 text-orange-200'
                              : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {m === 'Tunai' && <Banknote className="w-4 h-4 text-emerald-400" />}
                          {m === 'QRIS' && <QrCode className="w-4 h-4 text-blue-400" />}
                          {m === 'Debit' && <CreditCard className="w-4 h-4 text-purple-400" />}
                          {m === 'Transfer' && <Building2 className="w-4 h-4 text-amber-400" />}
                          <span>{m}</span>
                        </button>
                      ))}
                    </div>

                    {/* Cash Quick options if Tunai */}
                    {subBillPaymentMethod === 'Tunai' && (
                      <div className="space-y-2 mb-4">
                        <label className="text-xs text-slate-400 font-medium block">Nominal Uang Diterima:</label>
                        <input
                          type="number"
                          value={subBillCashAmount || ''}
                          onChange={(e) => setSubBillCashAmount(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg font-mono font-bold text-sm text-right outline-none focus:border-orange-500"
                        />
                        <div className="flex justify-between text-xs text-slate-400 pt-1">
                          <span>Kembalian:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {formatRupiah(
                              Math.max(
                                0,
                                subBillCashAmount - getSubBillCalculation(activePaymentSubBill).total
                              )
                            )}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setActivePaymentSubBill(null)}
                        className="flex-1 py-2 border border-slate-700 rounded-lg font-bold text-xs text-slate-300 hover:bg-slate-800 transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleExecuteSubBillPayment(activePaymentSubBill);
                          setActivePaymentSubBill(null);
                        }}
                        className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-xs shadow-md transition-colors active:scale-95"
                      >
                        Konfirmasi Lunas & Cetak
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* MODE 2: PISAH SAMA RATA (SPLIT EQUALLY BY PERSON)        */}
          {/* ======================================================== */}
          {splitMode === 'equal' && (
            <div className="space-y-4">
              {/* Controls: Number of persons */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-100 block">Bagi Rata ke Berapa Orang?</span>
                  <span className="text-[11px] text-slate-400">
                    Sistem membagi total tagihan meja secara adil per individu
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {[2, 3, 4, 5, 6].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => handleUpdateNumPersons(count)}
                      className={`w-9 h-9 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                        numPersons === count
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Meja</span>
                  <div className="text-sm font-black font-mono text-slate-100">{formatRupiah(order.total)}</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-emerald-400 uppercase font-semibold">Sudah Dibayar</span>
                  <div className="text-sm font-black font-mono text-emerald-400">{formatRupiah(totalPaidAmount)}</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-amber-400 uppercase font-semibold">Sisa Belum Bayar</span>
                  <div className="text-sm font-black font-mono text-amber-300">{formatRupiah(remainingAmount)}</div>
                </div>
              </div>

              {/* List of Persons */}
              <div className="space-y-2">
                {splitPayments.map((person) => (
                  <div
                    key={person.guestIndex}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      person.isPaid
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                          person.isPaid
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {person.isPaid ? <Check className="w-4 h-4" /> : person.guestIndex}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={person.guestName}
                            disabled={person.isPaid}
                            onChange={(e) => {
                              const newName = e.target.value;
                              setSplitPayments((prev) =>
                                prev.map((p) =>
                                  p.guestIndex === person.guestIndex ? { ...p, guestName: newName } : p
                                )
                              );
                            }}
                            className="font-bold text-xs text-slate-100 bg-transparent border-b border-transparent hover:border-slate-600 focus:border-orange-500 outline-none px-0.5"
                          />
                          {person.isPaid && (
                            <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span>Lunas ({person.paymentMethod})</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Nominal: <strong className="text-slate-100">{formatRupiah(person.amount)}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {person.isPaid ? (
                        <button
                          type="button"
                          onClick={() => {
                            const content = `
                              <div class="center bold">${escapeHtml(settings.storeName)}</div>
                              <div class="center">${escapeHtml(order.tableNumber || 'Meja')} • Order ${escapeHtml(order.orderNumber)}</div>
                              <div class="center bold">BUKTI BAYAR PISAH TAGIHAN</div>
                              <div class="line"></div>
                              <div class="row"><span>Nama Tamu:</span><span>${escapeHtml(person.guestName)}</span></div>
                              <div class="row"><span>Metode:</span><span>${escapeHtml(person.paymentMethod)}</span></div>
                              <div class="row"><span>Status:</span><span>LUNAS</span></div>
                              <div class="row bold"><span>Total Bayar:</span><span>${formatRupiah(person.amount)}</span></div>
                              <div class="line"></div>
                              <div class="center">${person.paidAt ? formatDate(person.paidAt) : ''}</div>
                              <div class="center">Terima kasih atas kunjungannya</div>
                            `;
                            handlePrintSlip(`Struk ${escapeHtml(person.guestName)}`, content);
                          }}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg text-slate-200 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 text-orange-400" />
                          <span>Cetak Slip</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setPayingGuestIdx(person.guestIndex);
                            setGuestCashAmount(person.amount);
                            setGuestPayMethod(person.paymentMethod);
                          }}
                          className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-2xs transition-colors active:scale-95"
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          <span>Bayar Sekarang</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Bayar Tamu Individu */}
              {payingGuestIdx !== null && (
                <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl max-w-sm w-full p-4 animate-in zoom-in-95 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-sm text-slate-100">
                        Bayar Tamu {payingGuestIdx} ({splitPayments.find((p) => p.guestIndex === payingGuestIdx)?.guestName})
                      </h4>
                      <button onClick={() => setPayingGuestIdx(null)} className="text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400">Nominal yang Dibayar:</span>
                      <div className="text-xl font-black font-mono text-orange-400">
                        {formatRupiah(splitPayments.find((p) => p.guestIndex === payingGuestIdx)?.amount || 0)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {(['Tunai', 'QRIS', 'Debit', 'Transfer'] as PaymentMethod[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setGuestPayMethod(m)}
                          className={`p-1.5 text-xs font-bold rounded-lg border transition-colors ${
                            guestPayMethod === m
                              ? 'bg-orange-500/20 border-orange-500 text-orange-200'
                              : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    {guestPayMethod === 'Tunai' && (
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Uang Diterima:</label>
                        <input
                          type="number"
                          value={guestCashAmount}
                          onChange={(e) => setGuestCashAmount(Number(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg font-mono font-bold text-xs text-right outline-none focus:border-orange-500"
                        />
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setPayingGuestIdx(null)}
                        className="flex-1 py-1.5 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePayGuest(payingGuestIdx)}
                        className="flex-1 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-md transition-colors active:scale-95"
                      >
                        Selesaikan
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-slate-400">
          <div className="text-xs">
            {splitMode === 'per_item'
              ? 'Tiap sub-tagihan yang dibayar akan menghasilkan nomor struk unik bertingkat (misal: #0004-A, #0004-B)'
              : `${paidGuestsCount} dari ${splitPayments.length} orang telah menyelesaikan pembayaran`}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl shadow-2xs transition-colors"
            >
              Tutup
            </button>

            {splitMode === 'equal' && (
              <button
                type="button"
                onClick={() => {
                  handleSaveEqualSplit();
                  onClose();
                }}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-colors active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Progres Pisah Tagihan</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
