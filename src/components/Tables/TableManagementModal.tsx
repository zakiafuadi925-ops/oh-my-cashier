import React, { useState } from 'react';
import { Order, StoreSettings } from '../../types';
import { formatRupiah, formatDate } from '../../utils/format';
import { playSound } from '../../utils/audio';
import {
  X,
  LayoutGrid,
  Users,
  Clock,
  ArrowRightLeft,
  Merge,
  Split,
  Banknote,
  Printer,
  ChefHat,
  Search,
  CheckCircle,
  PlusCircle,
  UtensilsCrossed,
} from 'lucide-react';
import { MoveTableModal } from './MoveTableModal';
import { MergeTableModal } from './MergeTableModal';
import { SplitBillModal } from './SplitBillModal';

interface TableManagementModalProps {
  orders: Order[];
  settings: StoreSettings;
  cashierName: string;
  onClose: () => void;
  onSelectTableForPOS: (tableNumber: string) => void;
  onMoveTable: (fromTable: string, toTable: string) => void;
  onMergeTables: (sourceTable: string, targetTable: string) => void;
  onPaySubBill: (paidOrder: Order, remainingOrder?: Order) => void;
  onCompleteEqualSplit: (updatedMasterOrder: Order) => void;
  onDirectCheckoutTable?: (order: Order) => void;
  onPrintPreBill?: (order: Order) => void;
  onPrintKOT?: (order: Order) => void;
}

export const TableManagementModal: React.FC<TableManagementModalProps> = ({
  orders,
  settings,
  cashierName,
  onClose,
  onSelectTableForPOS,
  onMoveTable,
  onMergeTables,
  onPaySubBill,
  onCompleteEqualSplit,
  onDirectCheckoutTable,
  onPrintPreBill,
  onPrintKOT,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'occupied' | 'empty'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [movingTable, setMovingTable] = useState<string | null>(null);
  const [mergingTable, setMergingTable] = useState<string | null>(null);
  const [splittingOrder, setSplittingOrder] = useState<Order | null>(null);

  // Generate 20 standard tables
  const allTables = Array.from({ length: 20 }, (_, i) => `Meja ${(i + 1).toString().padStart(2, '0')}`);

  // Find active occupied tables: Dine In orders that are 'Diproses' or 'Draft' and not completed
  const activeDineInOrders = orders.filter(
    (o) =>
      o.orderType === 'Dine In' &&
      o.tableNumber &&
      o.status !== 'Selesai' &&
      o.status !== 'Dibatalkan'
  );

  // Map tableNumber -> Order
  const tableOrderMap: Record<string, Order> = {};
  activeDineInOrders.forEach((o) => {
    if (o.tableNumber) {
      tableOrderMap[o.tableNumber] = o;
    }
  });

  const occupiedTableNumbers = Object.keys(tableOrderMap);
  const totalOccupied = occupiedTableNumbers.length;
  const totalEmpty = 20 - totalOccupied;
  const totalOpenBillRp = activeDineInOrders.reduce((sum, o) => sum + o.total, 0);

  // Filter tables
  const filteredTables = allTables.filter((tbl) => {
    const isOccupied = !!tableOrderMap[tbl];
    if (filterType === 'occupied' && !isOccupied) return false;
    if (filterType === 'empty' && isOccupied) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTable = tbl.toLowerCase().includes(q);
      const order = tableOrderMap[tbl];
      const matchCustomer = order?.customer?.name.toLowerCase().includes(q);
      const matchOrderNum = order?.orderNumber.toLowerCase().includes(q);
      return matchTable || matchCustomer || matchOrderNum;
    }
    return true;
  });

  // Calculate elapsed minutes since order creation
  const getElapsedMinutes = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / (60 * 1000));
    return mins < 1 ? 'Baru saja' : `${mins} mnt lalu`;
  };

  const occupiedTablesWithOrders = occupiedTableNumbers.map((tbl) => ({
    tableNumber: tbl,
    order: tableOrderMap[tbl],
  }));

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-zinc-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header - Oh My Zsh Terminal Style */}
        <div className="p-4 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500 shadow-inner">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-mono font-bold">➜</span>
                <h3 className="font-bold text-sm sm:text-base text-zinc-100 font-mono">tables@dine-in // Denah Meja</h3>
                <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-mono font-bold">
                  git:(table-map ✔)
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                ~/.oh-my-cashier/floor-plan • meja terisi, pindah meja, gabung meja, open bill, & split bill
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Metric Bar */}
        <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 font-mono">
          <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 flex items-center gap-3 text-zinc-200">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-sm">
              20
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 font-semibold uppercase">Total Meja</span>
              <div className="text-xs font-bold text-zinc-200">20 Kapasitas</div>
            </div>
          </div>

          <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 flex items-center gap-3 text-zinc-200">
            <div className="w-9 h-9 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 flex items-center justify-center font-bold text-sm">
              {totalOccupied}
            </div>
            <div>
              <span className="text-[10px] text-rose-400 font-semibold uppercase">Meja Terisi</span>
              <div className="text-xs font-bold text-rose-300">{totalOccupied} Meja Aktif</div>
            </div>
          </div>

          <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 flex items-center gap-3 text-zinc-200">
            <div className="w-9 h-9 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center justify-center font-bold text-sm">
              {totalEmpty}
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase">Meja Kosong</span>
              <div className="text-xs font-bold text-emerald-300">{totalEmpty} Tersedia</div>
            </div>
          </div>

          <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 flex items-center gap-3 text-zinc-200">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 text-emerald-400 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 font-semibold uppercase">Total Open Bill</span>
              <div className="text-xs font-bold font-mono text-emerald-400">
                {formatRupiah(totalOpenBillRp)}
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-4 py-2.5 bg-zinc-100 border-b border-zinc-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 font-mono">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-zinc-950 text-white shadow-2xs'
                  : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-200'
              }`}
            >
              Semua ({allTables.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('occupied')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'occupied'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-200'
              }`}
            >
              Terisi ({totalOccupied})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('empty')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'empty'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-200'
              }`}
            >
              Kosong ({totalEmpty})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor meja / tamu..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-lg outline-none focus:ring-1 focus:ring-rose-500 font-mono"
            />
          </div>
        </div>

        {/* Table Grid Floor View */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100/60">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredTables.map((tbl) => {
              const order = tableOrderMap[tbl];
              const isOccupied = !!order;

              if (isOccupied) {
                // Occupied Table Card
                return (
                  <div
                    key={tbl}
                    className="bg-white rounded-xl border-2 border-red-300 shadow-sm overflow-hidden flex flex-col hover:border-red-500 transition-all"
                  >
                    {/* Header */}
                    <div className="p-2.5 bg-red-50 border-b border-red-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="font-bold text-xs text-red-900">{tbl}</span>
                      </div>
                      <span className="text-[10px] text-red-700 font-mono font-semibold flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-red-500" />
                        {getElapsedMinutes(order.createdAt)}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-2.5 space-y-1.5 flex-1 text-xs">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-gray-500">Order:</span>
                        <span className="font-mono font-bold text-gray-800">{order.orderNumber}</span>
                      </div>

                      {order.customer && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-gray-500">Tamu:</span>
                          <span className="font-semibold text-gray-800 truncate max-w-[100px]">
                            {order.customer.name}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-gray-500">Menu:</span>
                        <span className="font-mono text-gray-700">{order.items.length} item</span>
                      </div>

                      {order.kitchenStatus && (
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[10px] text-gray-400">Dapur:</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                              order.kitchenStatus === 'Antre'
                                ? 'bg-amber-100 text-amber-800'
                                : order.kitchenStatus === 'Dimasak'
                                ? 'bg-blue-100 text-blue-800'
                                : order.kitchenStatus === 'Siap Saji'
                                ? 'bg-emerald-100 text-emerald-800 animate-bounce'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {order.kitchenStatus}
                          </span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[11px] text-gray-500 font-medium">Tagihan:</span>
                        <span className="font-mono font-black text-xs text-red-700">
                          {formatRupiah(order.total)}
                        </span>
                      </div>
                    </div>

                    {/* Table Quick Operations */}
                    <div className="p-2 bg-gray-50 border-t border-gray-200 grid grid-cols-2 gap-1 text-[11px]">
                      {/* Buka di POS */}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTableForPOS(tbl);
                          onClose();
                        }}
                        className="py-1 px-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-center"
                        title="Buka pesanan meja ini di kasir"
                      >
                        Buka POS
                      </button>

                      {/* Pisah Tagihan (Split Bill) */}
                      <button
                        type="button"
                        onClick={() => setSplittingOrder(order)}
                        className="py-1 px-1 bg-purple-700 hover:bg-purple-800 text-white rounded font-bold flex items-center justify-center gap-0.5"
                        title="Pisah tagihan meja ini"
                      >
                        <Split className="w-3 h-3" />
                        <span>Split</span>
                      </button>

                      {/* Pindah Meja */}
                      <button
                        type="button"
                        onClick={() => setMovingTable(tbl)}
                        className="py-1 px-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded font-semibold flex items-center justify-center gap-0.5"
                        title="Pindahkan tamu ke meja lain"
                      >
                        <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                        <span>Pindah</span>
                      </button>

                      {/* Gabung Meja */}
                      <button
                        type="button"
                        onClick={() => setMergingTable(tbl)}
                        className="py-1 px-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded font-semibold flex items-center justify-center gap-0.5"
                        title="Gabungkan tagihan dengan meja lain"
                      >
                        <Merge className="w-3 h-3 text-emerald-600" />
                        <span>Gabung</span>
                      </button>
                    </div>
                  </div>
                );
              }

              // Available Empty Table Card
              return (
                <div
                  key={tbl}
                  onClick={() => {
                    onSelectTableForPOS(tbl);
                    onClose();
                  }}
                  className="bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50/40 cursor-pointer transition-all p-3 flex flex-col justify-between min-h-[160px] group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="font-bold text-xs text-gray-800 group-hover:text-emerald-800">
                        {tbl}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-semibold">
                      Kosong
                    </span>
                  </div>

                  <div className="text-center py-4 text-gray-400 group-hover:text-emerald-700 transition-colors">
                    <UtensilsCrossed className="w-8 h-8 mx-auto mb-1 stroke-1" />
                    <span className="text-[11px] block font-medium">Siap Digunakan</span>
                  </div>

                  <button
                    type="button"
                    className="w-full py-1.5 bg-gray-100 group-hover:bg-emerald-700 text-gray-600 group-hover:text-white rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Mulai Pesanan</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Meja Kosong
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Meja Terisi (Open Bill)
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Sub-Modals */}
      {movingTable && (
        <MoveTableModal
          currentTable={movingTable}
          activeOrder={tableOrderMap[movingTable]}
          occupiedTables={occupiedTableNumbers}
          onClose={() => setMovingTable(null)}
          onConfirmMove={onMoveTable}
        />
      )}

      {mergingTable && (
        <MergeTableModal
          currentTable={mergingTable}
          occupiedTablesWithOrders={occupiedTablesWithOrders}
          onClose={() => setMergingTable(null)}
          onConfirmMerge={onMergeTables}
        />
      )}

      {splittingOrder && (
        <SplitBillModal
          order={splittingOrder}
          settings={settings}
          cashierName={cashierName}
          onClose={() => setSplittingOrder(null)}
          onPaySubBill={(paidOrder, remOrder) => {
            onPaySubBill(paidOrder, remOrder);
            setSplittingOrder(null);
          }}
          onCompleteEqualSplit={(updatedMaster) => {
            onCompleteEqualSplit(updatedMaster);
            setSplittingOrder(null);
          }}
        />
      )}
    </div>
  );
};
