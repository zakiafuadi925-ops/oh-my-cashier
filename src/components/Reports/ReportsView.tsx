import React, { useState } from 'react';
import { Order, Product, Customer, Ingredient } from '../../types';
import { formatRupiah } from '../../utils/format';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Award,
  FileSpreadsheet,
  PieChart,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Boxes,
} from 'lucide-react';

interface ReportsViewProps {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  ingredients?: Ingredient[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  orders,
  products,
  customers,
  ingredients = [],
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'sales' | 'margin' | 'loyalty' | 'expiry'>('sales');

  const validOrders = orders.filter((o) => o.status === 'Selesai');
  const totalOmset = validOrders.reduce((sum, o) => sum + o.total, 0);
  const totalCost = validOrders.reduce((sum, o) => sum + o.totalCost, 0);
  const totalProfit = validOrders.reduce((sum, o) => sum + o.grossProfit, 0);
  const averageOrderValue = validOrders.length > 0 ? Math.round(totalOmset / validOrders.length) : 0;
  const overallMarginPercent = totalOmset > 0 ? Math.round((totalProfit / totalOmset) * 100) : 0;

  // Total raw materials inventory asset value
  const totalIngredientsAssetValue = ingredients.reduce(
    (sum, ing) => sum + ing.stock * ing.costPerUnit,
    0
  );

  // Expiry calculation
  const getDaysUntilExpiry = (expDate?: string): number | null => {
    if (!expDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const exp = new Date(expDate);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nearingExpiryCount = ingredients.filter((ing) => {
    const days = getDaysUntilExpiry(ing.expiryDate);
    return days !== null && days <= 7;
  }).length;

  // Aggregate product sales
  const productSalesMap = new Map<
    string,
    { product: Product; quantitySold: number; totalSales: number; totalCost: number; profit: number }
  >();

  validOrders.forEach((o) => {
    o.items.forEach((item) => {
      const pid = item.product.id;
      const current = productSalesMap.get(pid) || {
        product: item.product,
        quantitySold: 0,
        totalSales: 0,
        totalCost: 0,
        profit: 0,
      };
      const costForItem = item.product.costPrice * item.quantity;
      const profitForItem = item.totalPrice - costForItem;

      current.quantitySold += item.quantity;
      current.totalSales += item.totalPrice;
      current.totalCost += costForItem;
      current.profit += profitForItem;
      productSalesMap.set(pid, current);
    });
  });

  const productReportList = Array.from(productSalesMap.values()).sort(
    (a, b) => b.totalSales - a.totalSales
  );

  const handleExportCSV = () => {
    let csv = '';
    if (activeReportTab === 'sales') {
      csv = 'Nama Produk,Kategori,Jumlah Terjual,Satuan,Total Penjualan,Kontribusi %\n';
      productReportList.forEach((row) => {
        const share = totalOmset > 0 ? ((row.totalSales / totalOmset) * 100).toFixed(1) : '0';
        csv += `"${row.product.name}","${row.product.category}",${row.quantitySold},"${row.product.unit}",${row.totalSales},"${share}%"\n`;
      });
    } else if (activeReportTab === 'margin') {
      csv = 'Nama Produk,Harga Jual,HPP Modal,Margin Per Unit,Unit Terjual,Total Laba Bersih,Margin %\n';
      productReportList.forEach((row) => {
        const unitMargin = row.product.price - row.product.costPrice;
        const marginPct =
          row.product.price > 0
            ? Math.round((unitMargin / row.product.price) * 100)
            : 0;
        csv += `"${row.product.name}",${row.product.price},${row.product.costPrice},${unitMargin},${row.quantitySold},${row.profit},"${marginPct}%"\n`;
      });
    } else if (activeReportTab === 'expiry') {
      csv = 'Nama Bahan Baku,Kategori,Batch/Lot,Tgl Expiry,Sisa Hari,Stok,Satuan,Biaya/Unit,Total Nilai Aset,Status\n';
      ingredients.forEach((ing) => {
        const days = getDaysUntilExpiry(ing.expiryDate);
        let status = 'Aman';
        if (days !== null) {
          if (days <= 0) status = 'Kedaluwarsa';
          else if (days <= 7) status = 'Mendekati Kedaluwarsa (<7 Hari)';
        }
        const val = ing.stock * ing.costPerUnit;
        csv += `"${ing.name}","${ing.category}","${ing.batchNumber || '-'}","${ing.expiryDate || '-'}","${
          days !== null ? `${days} hari` : '-'
        }",${ing.stock},"${ing.unit}",${ing.costPerUnit},${val},"${status}"\n`;
      });
    } else {
      csv = 'Nama Pelanggan,No. Telepon,Tier,Poin Loyalitas,Total Transaksi,Total Belanja\n';
      customers.forEach((c) => {
        csv += `"${c.name}","${c.phone}","${c.tier}",${c.points},${c.totalOrders},${c.totalSpent}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OhMyCashier_${activeReportTab}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>Laporan Penjualan, Margin & Batch Expiry</span>
          </h2>
          <p className="text-xs text-slate-400">
            Analisis omset penjualan, keuntungan bersih HPP, loyalitas pelanggan, dan evaluasi kedaluwarsa bahan baku.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Ekspor Laporan (Excel/CSV)</span>
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
              <span>Total Omset Penjualan</span>
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="text-2xl font-mono font-black text-slate-100">
              {formatRupiah(totalOmset)}
            </div>
            <p className="text-[11px] text-slate-400">{validOrders.length} transaksi selesai</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-cyan-400 font-bold">
              <span>Laba Kotor (Gross Profit)</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-2xl font-mono font-black text-emerald-400">
              {formatRupiah(totalProfit)}
            </div>
            <p className="text-[11px] text-emerald-400 font-semibold">
              {overallMarginPercent}% Margin dari Omset
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-purple-400 font-bold">
              <span>Rata-Rata Transaksi (AOV)</span>
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="text-2xl font-mono font-black text-slate-100">
              {formatRupiah(averageOrderValue)}
            </div>
            <p className="text-[11px] text-slate-400">Total HPP modal: {formatRupiah(totalCost)}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
              <span>Aset Stok Bahan Baku</span>
              <Boxes className="w-4 h-4" />
            </div>
            <div className="text-2xl font-mono font-black text-slate-100">
              {formatRupiah(totalIngredientsAssetValue)}
            </div>
            <p className="text-[11px] text-amber-300 font-semibold">
              {nearingExpiryCount > 0 ? `⚠️ ${nearingExpiryCount} batch mendekati expired` : 'Semua batch aman'}
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-700 bg-slate-950 px-2 rounded-t-2xl overflow-x-auto">
          <button
            onClick={() => setActiveReportTab('sales')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeReportTab === 'sales'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Laporan Penjualan Per Produk</span>
          </button>

          <button
            onClick={() => setActiveReportTab('margin')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeReportTab === 'margin'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Laporan Margin HPP Produk</span>
          </button>

          <button
            onClick={() => setActiveReportTab('loyalty')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeReportTab === 'loyalty'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Customer Loyalty ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveReportTab('expiry')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeReportTab === 'expiry'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Laporan Batch & Expiry Bahan</span>
          </button>
        </div>

        {/* Report Content */}
        <div className="bg-slate-800 rounded-b-2xl shadow-sm border border-slate-700 overflow-hidden">
          {activeReportTab === 'sales' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Peringkat</th>
                    <th className="px-4 py-3">Nama Menu Produk</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3 text-center">Jumlah Terjual</th>
                    <th className="px-4 py-3 text-right">Total Omset</th>
                    <th className="px-4 py-3 text-right">Kontribusi Omset</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {productReportList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        Belum ada data penjualan tercatat.
                      </td>
                    </tr>
                  ) : (
                    productReportList.map((row, idx) => {
                      const share = totalOmset > 0 ? (row.totalSales / totalOmset) * 100 : 0;
                      return (
                        <tr key={row.product.id} className="hover:bg-slate-700/40">
                          <td className="px-4 py-3 font-mono font-bold text-slate-400">
                            #{idx + 1}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-100">
                            {row.product.name}
                          </td>
                          <td className="px-4 py-3 text-slate-400">{row.product.category}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-slate-100">
                            {row.quantitySold} {row.product.unit}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-orange-400">
                            {formatRupiah(row.totalSales)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-300">
                            <span className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded font-semibold text-[11px]">
                              {share.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeReportTab === 'margin' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Nama Menu Produk</th>
                    <th className="px-4 py-3 text-right">Harga Jual</th>
                    <th className="px-4 py-3 text-right">HPP Modal</th>
                    <th className="px-4 py-3 text-right">Laba Bersih/Unit</th>
                    <th className="px-4 py-3 text-center">Unit Terjual</th>
                    <th className="px-4 py-3 text-right">Total Laba Bersih</th>
                    <th className="px-4 py-3 text-center">Margin (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {productReportList.map((row) => {
                    const unitMargin = row.product.price - row.product.costPrice;
                    const marginPct =
                      row.product.price > 0
                        ? Math.round((unitMargin / row.product.price) * 100)
                        : 0;

                    return (
                      <tr key={row.product.id} className="hover:bg-slate-700/40">
                        <td className="px-4 py-3 font-bold text-slate-100">
                          {row.product.name}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-200">
                          {formatRupiah(row.product.price)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-400">
                          {formatRupiah(row.product.costPrice)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-emerald-400">
                          +{formatRupiah(unitMargin)}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-200">
                          {row.quantitySold}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-black text-emerald-400">
                          {formatRupiah(row.profit)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            {marginPct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeReportTab === 'loyalty' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Nama Pelanggan</th>
                    <th className="px-4 py-3">No. Kontak</th>
                    <th className="px-4 py-3">Status Tier</th>
                    <th className="px-4 py-3 text-center">Poin Loyalitas</th>
                    <th className="px-4 py-3 text-center">Total Order</th>
                    <th className="px-4 py-3 text-right">Total Belanja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-700/40">
                      <td className="px-4 py-3 font-bold text-slate-100">{c.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{c.phone}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            c.tier === 'VIP'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                              : c.tier === 'Member'
                              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                              : 'bg-slate-900 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {c.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-emerald-400">
                        {c.points} Pts
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-200">
                        {c.totalOrders}x
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-orange-400">
                        {formatRupiah(c.totalSpent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeReportTab === 'expiry' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Nama Bahan Baku</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">No. Batch / Lot</th>
                    <th className="px-4 py-3">Pemasok</th>
                    <th className="px-4 py-3">Tgl. Kedaluwarsa</th>
                    <th className="px-4 py-3 text-center">Sisa Hari</th>
                    <th className="px-4 py-3 text-right">Stok Fisik</th>
                    <th className="px-4 py-3 text-right">Nilai Aset</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {ingredients.map((ing) => {
                    const days = getDaysUntilExpiry(ing.expiryDate);
                    const isExp = days !== null && days <= 0;
                    const isWarning = days !== null && days <= 7 && days > 0;
                    const val = ing.stock * ing.costPerUnit;

                    return (
                      <tr
                        key={ing.id}
                        className={`hover:bg-slate-700/40 transition-colors ${
                          isExp ? 'bg-rose-950/20' : isWarning ? 'bg-amber-950/20' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-bold text-slate-100">{ing.name}</td>
                        <td className="px-4 py-3 text-slate-400">{ing.category}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-300">
                          {ing.batchNumber || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{ing.supplier || '-'}</td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-300">{ing.expiryDate || '-'}</td>
                        <td className="px-4 py-3 text-center font-bold">
                          {days !== null ? (
                            <span
                              className={`${
                                isExp ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                              }`}
                            >
                              {days <= 0 ? 'Kedaluwarsa' : `${days} hari`}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-right text-slate-200">
                          {ing.stock} {ing.unit}
                        </td>
                        <td className="px-4 py-3 font-mono text-right text-slate-300">
                          {formatRupiah(val)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isExp ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-950/80 border border-rose-800/60 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3 text-rose-400" />
                              Kedaluwarsa
                            </span>
                          ) : isWarning ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3 text-amber-400" />
                              Segera Pakai
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Aman
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
