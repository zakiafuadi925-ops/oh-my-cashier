import React, { useState, useEffect } from 'react';
import { Order, StoreSettings, KitchenStatus } from '../../types';
import { formatDate } from '../../utils/format';
import { playSound } from '../../utils/audio';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Volume2,
  VolumeX,
  Search,
  Printer,
  Tag,
  Coffee,
  Utensils,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { KitchenTicketModal } from './KitchenTicketModal';
import { CupLabelModal } from './CupLabelModal';

interface KitchenDisplayViewProps {
  orders: Order[];
  settings: StoreSettings;
  onUpdateKitchenStatus: (orderId: string, newStatus: KitchenStatus) => void;
  onToggleKitchenItemCheck: (orderId: string, cartItemId: string) => void;
  onNavigateToPOS?: () => void;
}

export const KitchenDisplayView: React.FC<KitchenDisplayViewProps> = ({
  orders,
  settings,
  onUpdateKitchenStatus,
  onToggleKitchenItemCheck,
  onNavigateToPOS,
}) => {
  const [stationFilter, setStationFilter] = useState<'Semua' | 'Dapur' | 'Barista'>('Semua');
  const [statusFilter, setStatusFilter] = useState<KitchenStatus | 'Semua Aktif'>('Semua Aktif');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(Date.now());

  // Printing Modals
  const [selectedOrderForKOT, setSelectedOrderForKOT] = useState<Order | null>(null);
  const [selectedOrderForCup, setSelectedOrderForCup] = useState<Order | null>(null);

  // Live timer tick every 5 seconds to update elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Filter orders for KDS
  // Non-void orders with active or recent kitchen status
  const validOrders = orders.filter((o) => o.status !== 'Dibatalkan');

  const filteredOrders = validOrders.filter((order) => {
    const currentKitchenStatus: KitchenStatus = order.kitchenStatus || 'Antre';

    // Status filter
    if (statusFilter === 'Semua Aktif') {
      if (currentKitchenStatus === 'Selesai') return false;
    } else {
      if (currentKitchenStatus !== statusFilter) return false;
    }

    // Station filter
    if (stationFilter !== 'Semua') {
      const hasDrink = order.items.some((i) =>
        i.product.category.toLowerCase().includes('minuman') ||
        i.product.category.toLowerCase().includes('kopi') ||
        i.product.category.toLowerCase().includes('tea') ||
        i.product.unit.toLowerCase() === 'cup'
      );
      const hasFood = order.items.some((i) =>
        !i.product.category.toLowerCase().includes('minuman') &&
        !i.product.category.toLowerCase().includes('kopi') &&
        !i.product.category.toLowerCase().includes('tea')
      );

      if (stationFilter === 'Barista' && !hasDrink) return false;
      if (stationFilter === 'Dapur' && !hasFood) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchOrderNum = order.orderNumber.toLowerCase().includes(q);
      const matchTable = (order.tableNumber || '').toLowerCase().includes(q);
      const matchCust = (order.customer?.name || '').toLowerCase().includes(q);
      const matchType = order.orderType.toLowerCase().includes(q);
      const matchItem = order.items.some((i) => i.product.name.toLowerCase().includes(q));
      if (!matchOrderNum && !matchTable && !matchCust && !matchType && !matchItem) {
        return false;
      }
    }

    return true;
  });

  // Calculate stats
  const activeOrders = validOrders.filter((o) => (o.kitchenStatus || 'Antre') !== 'Selesai');
  const countAntre = activeOrders.filter((o) => (o.kitchenStatus || 'Antre') === 'Antre').length;
  const countDimasak = activeOrders.filter((o) => o.kitchenStatus === 'Dimasak').length;
  const countSiapSaji = activeOrders.filter((o) => o.kitchenStatus === 'Siap Saji').length;

  // Average wait time in active orders (minutes)
  const avgWaitMins = activeOrders.length > 0
    ? Math.round(
        activeOrders.reduce((acc, o) => {
          const diff = Math.max(0, (now - new Date(o.createdAt).getTime()) / 60000);
          return acc + diff;
        }, 0) / activeOrders.length
      )
    : 0;

  const handleAdvanceStatus = (order: Order) => {
    const current = order.kitchenStatus || 'Antre';
    let next: KitchenStatus = 'Dimasak';

    if (current === 'Antre') {
      next = 'Dimasak';
      if (soundEnabled) playSound('beep');
    } else if (current === 'Dimasak') {
      next = 'Siap Saji';
      if (soundEnabled) playSound('chime_ready');
    } else if (current === 'Siap Saji') {
      next = 'Selesai';
      if (soundEnabled) playSound('beep');
    }

    onUpdateKitchenStatus(order.id, next);
  };

  const getElapsedMinutes = (createdAt: string): number => {
    return Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60000));
  };

  const formatElapsed = (createdAt: string): string => {
    const totalSec = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 1000));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top KDS Header */}
      <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                Layar Dapur & Antrean (KDS)
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                Live Kitchen
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pantau antrean pesanan masak dan racik barista secara langsung
            </p>
          </div>
        </div>

        {/* Quick KDS Actions & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Station Selector */}
          <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700">
            <button
              onClick={() => setStationFilter('Semua')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                stationFilter === 'Semua'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStationFilter('Dapur')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                stationFilter === 'Dapur'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Dapur</span>
            </button>
            <button
              onClick={() => setStationFilter('Barista')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                stationFilter === 'Barista'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Barista</span>
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-colors ${
              soundEnabled
                ? 'bg-emerald-950 border-emerald-600/50 text-emerald-300 hover:bg-emerald-900'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title={soundEnabled ? 'Suara Dapur Aktif' : 'Suara Dapur Senyap'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Audio ON' : 'Audio MUTE'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar & Status Tabs */}
      <div className="bg-slate-950/80 px-3 sm:px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'Semua Aktif', label: 'Semua Aktif', count: activeOrders.length },
              { id: 'Antre', label: '⏳ Antre', count: countAntre },
              { id: 'Dimasak', label: '🔥 Dimasak', count: countDimasak },
              { id: 'Siap Saji', label: '✅ Siap Saji', count: countSiapSaji },
              { id: 'Selesai', label: '📦 Selesai', count: validOrders.filter((o) => o.kitchenStatus === 'Selesai').length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as KitchenStatus | 'Semua Aktif')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-slate-800 text-amber-400 border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  statusFilter === tab.id
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Live Wait Stats & Search */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>
              Rata-rata tunggu: <b className="text-white">{avgWaitMins} menit</b>
            </span>
          </div>

          <div className="relative w-40 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari meja/order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Main KDS Grid Display */}
      <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
        {filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <div className="w-20 h-20 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-4 text-slate-500 shadow-inner">
              <ChefHat className="w-10 h-10 text-amber-500/60" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Dapur Tenang & Terkendali
            </h3>
            <p className="text-xs text-slate-400 max-w-md mb-5">
              {statusFilter === 'Semua Aktif'
                ? 'Semua pesanan saat ini sudah selesai dimasak dan disajikan. Pesanan baru dari kasir akan muncul di layar ini secara otomatis.'
                : `Tidak ada pesanan dengan status '${statusFilter}'.`}
            </p>
            {onNavigateToPOS && (
              <button
                onClick={onNavigateToPOS}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Utensils className="w-4 h-4" />
                <span>Buka Kasir & Buat Pesanan Baru</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => {
              const currentStatus: KitchenStatus = order.kitchenStatus || 'Antre';
              const elapsedMins = getElapsedMinutes(order.createdAt);
              const elapsedText = formatElapsed(order.createdAt);

              // Timing urgency status
              const isUrgent = elapsedMins >= 20;
              const isWarning = elapsedMins >= 10 && elapsedMins < 20;

              // Items to show based on station
              const items = order.items.filter((item) => {
                const isDrink =
                  item.product.category.toLowerCase().includes('minuman') ||
                  item.product.category.toLowerCase().includes('kopi') ||
                  item.product.category.toLowerCase().includes('tea') ||
                  item.product.unit.toLowerCase() === 'cup';
                if (stationFilter === 'Barista') return isDrink;
                if (stationFilter === 'Dapur') return !isDrink;
                return true;
              });

              const completedIds = order.completedItemIds || [];
              const hasDrinks = order.items.some((i) =>
                i.product.category.toLowerCase().includes('minuman') ||
                i.product.category.toLowerCase().includes('kopi')
              );

              return (
                <div
                  key={order.id}
                  className={`flex flex-col bg-slate-950 rounded-2xl border transition-all duration-200 overflow-hidden shadow-lg ${
                    currentStatus === 'Siap Saji'
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                      : isUrgent
                      ? 'border-red-500 ring-2 ring-red-500/30 animate-pulse'
                      : isWarning
                      ? 'border-amber-500'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Ticket Header */}
                  <div
                    className={`p-3 border-b flex items-start justify-between ${
                      currentStatus === 'Siap Saji'
                        ? 'bg-emerald-950/80 border-emerald-800/80'
                        : isUrgent
                        ? 'bg-red-950/80 border-red-900/80'
                        : isWarning
                        ? 'bg-amber-950/50 border-amber-900/50'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white tracking-wide">
                          {order.orderType === 'Dine In'
                            ? order.tableNumber || 'Meja -'
                            : order.orderType}
                        </span>
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-800 text-slate-300">
                          {order.orderNumber}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {order.customer ? order.customer.name : 'Tamu Reguler'} •{' '}
                        {formatDate(order.createdAt).split(' ')[1]}
                      </div>
                    </div>

                    {/* Timer Badge */}
                    <div
                      className={`px-2.5 py-1 rounded-lg font-mono text-xs font-black flex items-center gap-1.5 shadow-sm ${
                        isUrgent
                          ? 'bg-red-600 text-white'
                          : isWarning
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-emerald-900/60 text-emerald-300 border border-emerald-600/40'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsedText}</span>
                    </div>
                  </div>

                  {/* Order / Kitchen Notes Alert */}
                  {(order.kitchenNotes || order.notes) && (
                    <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 text-[11px] text-amber-300 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span className="truncate">{order.kitchenNotes || order.notes}</span>
                    </div>
                  )}

                  {/* Item List (Checklist style) */}
                  <div className="flex-1 p-3 space-y-2.5 overflow-y-auto max-h-72">
                    {items.map((item) => {
                      const isChecked = completedIds.includes(item.cartItemId);
                      const isDrinkItem =
                        item.product.category.toLowerCase().includes('minuman') ||
                        item.product.category.toLowerCase().includes('kopi') ||
                        item.product.unit.toLowerCase() === 'cup';

                      return (
                        <div
                          key={item.cartItemId}
                          onClick={() => onToggleKitchenItemCheck(order.id, item.cartItemId)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer select-none ${
                            isChecked
                              ? 'bg-slate-900/50 border-slate-800 text-slate-500 line-through'
                              : 'bg-slate-900 border-slate-800/80 hover:border-slate-700 text-slate-100'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            {/* Checkbox button */}
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                isChecked
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                  : 'border-slate-600 hover:border-amber-400'
                              }`}
                            >
                              {isChecked && <CheckCircle2 className="w-4 h-4" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="font-black text-sm text-white">
                                  {item.quantity}x {item.product.name}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                    isDrinkItem
                                      ? 'bg-sky-950 text-sky-300 border border-sky-800'
                                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                                  }`}
                                >
                                  {isDrinkItem ? 'Barista' : 'Dapur'}
                                </span>
                              </div>

                              {/* Variants */}
                              {item.selectedVariants && item.selectedVariants.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.selectedVariants.map((v, vIdx) => (
                                    <span
                                      key={vIdx}
                                      className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded border border-slate-700"
                                    >
                                      {v.groupName}: {v.optionName}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Item Notes */}
                              {item.notes && (
                                <div className="text-[11px] font-bold text-amber-400 mt-1">
                                  * {item.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Card Bottom / Action Buttons */}
                  <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
                    {/* Primary Status Advance Button (Thumb friendly, min-h-[48px]) */}
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(order)}
                      className={`w-full min-h-[48px] py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                        currentStatus === 'Antre'
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          : currentStatus === 'Dimasak'
                          ? 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                          : currentStatus === 'Siap Saji'
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                          : 'bg-slate-700 hover:bg-slate-600 text-white'
                      }`}
                    >
                      {currentStatus === 'Antre' && (
                        <>
                          <Flame className="w-4 h-4" />
                          <span>Mulai Masak</span>
                        </>
                      )}
                      {currentStatus === 'Dimasak' && (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Tandai Siap Saji 🔔</span>
                        </>
                      )}
                      {currentStatus === 'Siap Saji' && (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Disajikan / Selesai ✓</span>
                        </>
                      )}
                      {currentStatus === 'Selesai' && (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>Kembalikan ke Antrean</span>
                        </>
                      )}
                    </button>

                    {/* Secondary Actions: Print KOT & Print Cup Label */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForKOT(order)}
                        className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                        title="Cetak Tiket KOT Thermal"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" />
                        <span>Cetak KOT</span>
                      </button>

                      {hasDrinks && (
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForCup(order)}
                          className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                          title="Cetak Label Stiker Cup"
                        >
                          <Tag className="w-3.5 h-3.5 text-sky-400" />
                          <span>Stiker Cup</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* KOT Modal */}
      {selectedOrderForKOT && (
        <KitchenTicketModal
          orderNumber={selectedOrderForKOT.orderNumber}
          createdAt={selectedOrderForKOT.createdAt}
          cart={selectedOrderForKOT.items}
          orderType={selectedOrderForKOT.orderType}
          tableNumber={selectedOrderForKOT.tableNumber}
          customer={selectedOrderForKOT.customer}
          cashierName={selectedOrderForKOT.cashierName}
          kitchenNotes={selectedOrderForKOT.kitchenNotes || selectedOrderForKOT.notes}
          settings={settings}
          stationFilter={stationFilter}
          onClose={() => setSelectedOrderForKOT(null)}
        />
      )}

      {/* Cup Label Modal */}
      {selectedOrderForCup && (
        <CupLabelModal
          orderNumber={selectedOrderForCup.orderNumber}
          createdAt={selectedOrderForCup.createdAt}
          cart={selectedOrderForCup.items}
          orderType={selectedOrderForCup.orderType}
          tableNumber={selectedOrderForCup.tableNumber}
          customerName={selectedOrderForCup.customer?.name}
          settings={settings}
          onClose={() => setSelectedOrderForCup(null)}
        />
      )}
    </div>
  );
};
