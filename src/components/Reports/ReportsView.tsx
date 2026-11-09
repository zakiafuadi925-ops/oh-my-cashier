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
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Top Header */}
      <div className="p-4 bg-white border-b border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-700" />
            <span>Laporan Penjualan, Margin & Batch Expiry</span>
          </h2>
          <p className="text-xs text-gray-500">
            Analisis omset penjualan, keuntungan bersih HPP, loyalitas pelanggan, dan evaluasi kedaluwarsa bahan baku.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Ekspor Laporan (Excel/CSV)</span>
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs text-emerald-700 font-bold">
              <span>Total Omset Penjualan</span>
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="text-2xl font-mono font-black text-gray-900">
              {formatRupiah(totalOmset)}
            </div>
            <p className="text-[11px] text-gray-400">{validOrders.length} transaksi selesai</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs text-blue-700 font-bold">
              <span>Laba Kotor (Gross Profit)</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-2xl font-mono font-black text-emerald-700">
              {formatRupiah(totalProfit)}
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold">
              {overallMarginPercent}% Margin dari Omset
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs text-purple-700 font-bold">
              <span>Rata-Rata Transaksi (AOV)</span>
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="text-2xl font-mono font-black text-gray-900">
              {formatRupiah(averageOrderValue)}
            </div>
            <p className="text-[11px] text-gray-400">Total HPP modal: {formatRupiah(totalCost)}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs text-amber-700 font-bold">
              <span>Aset Stok Bahan Baku</span>
              <Boxes className="w-4 h-4" />
            </div>
            <div className="text-2xl font-mono font-black text-gray-900">
              {formatRupiah(totalIngredientsAssetValue)}
            </div>
            <p className="text-[11px] text-amber-700 font-semibold">
              {nearingExpiryCount > 0 ? `⚠️ ${nearingExpiryCount} batch mendekati expired` : 'Semua batch aman'}
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-200 bg-white px-2 rounded-t-2xl overflow-x-auto">
          <button
            onClick={() => setActiveReportTab('sales')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeReportTab === 'sales'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Laporan Penjualan Per Produk</span>
          </button>

          <button
            onClick={() => setActiveReportTab('margin')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeReportTab === 'margin'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Laporan Margin HPP Produk</span>
          </button>

          <button
            onClick={() => setActiveReportTab('loyalty')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeReportTab === 'loyalty'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Customer Loyalty ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveReportTab('expiry')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeReportTab === 'expiry'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>Laporan Batch & Expiry Bahan</span>
          </button>
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-b-2xl shadow-sm border border-gray-200 overflow-hidden">
          {activeReportTab === 'sales' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Peringkat</th>
                    <th className="px-4 py-3">Nama Menu Produk</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3 text-center">Jumlah Terjual</th>
                    <th className="px-4 py-3 text-right">Total Omset</th>
                    <th className="px-4 py-3 text-right">Kontribusi Omset</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productReportList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-gray-400">
                        Belum ada data penjualan tercatat.
                      </td>
                    </tr>
                  ) : (
                    productReportList.map((row, idx) => {
                      const share = totalOmset > 0 ? (row.totalSales / totalOmset) * 100 : 0;
                      return (
                        <tr key={row.product.id} className="hover:bg-gray-50/80">
                          <td className="px-4 py-3 font-mono font-bold text-gray-400">
                            #{idx + 1}
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900">
                            {row.product.name}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{row.product.category}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-gray-900">
                            {row.quantitySold} {row.product.unit}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-800">
                            {formatRupiah(row.totalSales)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-gray-700">
                            <span className="bg-gray-100 px-2 py-0.5 rounded font-semibold text-[11px]">
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
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
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
                <tbody className="divide-y divide-gray-100">
                  {productReportList.map((row) => {
                    const unitMargin = row.product.price - row.product.costPrice;
                    const marginPct =
                      row.product.price > 0
                        ? Math.round((unitMargin / row.product.price) * 100)
                        : 0;

                    return (
                      <tr key={row.product.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3 font-bold text-gray-900">
                          {row.product.name}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-800">
                          {formatRupiah(row.product.price)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-500">
                          {formatRupiah(row.product.costPrice)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-emerald-700">
                          +{formatRupiah(unitMargin)}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-gray-800">
                          {row.quantitySold}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-black text-emerald-800">
                          {formatRupiah(row.profit)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
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
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Nama Pelanggan</th>
                    <th className="px-4 py-3">No. Kontak</th>
                    <th className="px-4 py-3">Status Tier</th>
                    <th className="px-4 py-3 text-center">Poin Loyalitas</th>
                    <th className="px-4 py-3 text-center">Total Order</th>
                    <th className="px-4 py-3 text-right">Total Belanja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3 font-bold text-gray-900">{c.name}</td>
                      <td className="px-4 py-3 font-mono text-gray-500">{c.phone}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            c.tier === 'VIP'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : c.tier === 'Member'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {c.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700">
                        {c.points} Pts
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-gray-800">
                        {c.totalOrders}x
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-gray-900">
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
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
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
                <tbody className="divide-y divide-gray-100">
                  {ingredients.map((ing) => {
                    const days = getDaysUntilExpiry(ing.expiryDate);
                    const isExp = days !== null && days <= 0;
                    const isWarning = days !== null && days <= 7 && days > 0;
                    const val = ing.stock * ing.costPerUnit;

                    return (
                      <tr
                        key={ing.id}
                        className={`hover:bg-gray-50/80 transition-colors ${
                          isExp ? 'bg-red-50/40' : isWarning ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-bold text-gray-900">{ing.name}</td>
                        <td className="px-4 py-3 text-gray-500">{ing.category}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-gray-700">
                          {ing.batchNumber || '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{ing.supplier || '-'}</td>
                        <td className="px-4 py-3 font-mono font-medium">{ing.expiryDate || '-'}</td>
                        <td className="px-4 py-3 text-center font-bold">
                          {days !== null ? (
                            <span
                              className={`${
                                isExp ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-700'
                              }`}
                            >
                              {days <= 0 ? 'Kedaluwarsa' : `${days} hari`}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-right text-gray-800">
                          {ing.stock} {ing.unit}
                        </td>
                        <td className="px-4 py-3 font-mono text-right text-gray-700">
                          {formatRupiah(val)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isExp ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              Kedaluwarsa
                            </span>
                          ) : isWarning ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" />
                              Segera Pakai
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
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
