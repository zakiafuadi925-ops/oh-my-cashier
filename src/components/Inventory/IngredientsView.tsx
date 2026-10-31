import React, { useState } from 'react';
import { Ingredient, Product, Order } from '../../types';
import { formatRupiah, formatDate } from '../../utils/format';
import {
  Boxes,
  Plus,
  Search,
  AlertCircle,
  RefreshCw,
  X,
  Calendar,
  Truck,
  FileSpreadsheet,
  Layers,
  UtensilsCrossed,
  Clock,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';

interface IngredientsViewProps {
  ingredients: Ingredient[];
  products?: Product[];
  orders?: Order[];
  onAddIngredient: (ing: Ingredient) => void;
  onUpdateIngredient: (ing: Ingredient) => void;
  onDeleteIngredient: (id: string) => void;
  onRestock: (id: string, additionalAmount: number) => void;
}

export const IngredientsView: React.FC<IngredientsViewProps> = ({
  ingredients,
  products = [],
  orders = [],
  onAddIngredient,
  onUpdateIngredient,
  onDeleteIngredient,
  onRestock,
}) => {
  const [activeTab, setActiveTab] = useState<'stok' | 'expiry' | 'recipes' | 'usage'>('stok');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | 'Bahan Mentah' | 'Bahan Olahan'>('Semua');
  const [expiryFilter, setExpiryFilter] = useState<'Semua' | 'Mendekati' | 'Aman'>('Semua');

  // Modal Add / Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Bahan Mentah' | 'Bahan Olahan'>('Bahan Mentah');
  const [stock, setStock] = useState<number>(10);
  const [unit, setUnit] = useState('kg');
  const [costPerUnit, setCostPerUnit] = useState<number>(50000);
  const [minStock, setMinStock] = useState<number>(5);
  const [notes, setNotes] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [supplier, setSupplier] = useState('');

  // Quick Restock Modal
  const [restockItem, setRestockItem] = useState<Ingredient | null>(null);
  const [restockQty, setRestockQty] = useState<number>(5);
  const [restockBatch, setRestockBatch] = useState('');
  const [restockExpiry, setRestockExpiry] = useState('');

  // Calculate days until expiry
  const getDaysUntilExpiry = (expDate?: string): number | null => {
    if (!expDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const exp = new Date(expDate);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Filtered ingredients
  const filtered = ingredients.filter((ing) => {
    const matchesSearch =
      ing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ing.batchNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (ing.supplier?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCat = categoryFilter === 'Semua' || ing.category === categoryFilter;

    if (expiryFilter === 'Mendekati') {
      const days = getDaysUntilExpiry(ing.expiryDate);
      return matchesSearch && matchesCat && days !== null && days <= 7;
    }
    if (expiryFilter === 'Aman') {
      const days = getDaysUntilExpiry(ing.expiryDate);
      return matchesSearch && matchesCat && (days === null || days > 7);
    }
    return matchesSearch && matchesCat;
  });

  // Calculate ingredient usage from completed orders
  const ingredientUsageMap = new Map<
    string,
    { ingredient: Ingredient; totalUsed: number; totalCost: number }
  >();

  const validOrders = orders.filter((o) => o.status === 'Selesai');
  validOrders.forEach((o) => {
    o.items.forEach((cartItem) => {
      const recipe = cartItem.product.ingredients;
      if (recipe && recipe.length > 0) {
        recipe.forEach((rec) => {
          const ing = ingredients.find((i) => i.id === rec.ingredientId);
          if (ing) {
            const current = ingredientUsageMap.get(ing.id) || {
              ingredient: ing,
              totalUsed: 0,
              totalCost: 0,
            };
            const used = rec.amount * cartItem.quantity;
            current.totalUsed += used;
            current.totalCost += used * ing.costPerUnit;
            ingredientUsageMap.set(ing.id, current);
          }
        });
      }
    });
  });

  const ingredientUsageList = Array.from(ingredientUsageMap.values());

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setCategory('Bahan Mentah');
    setStock(10);
    setUnit('kg');
    setCostPerUnit(50000);
    setMinStock(5);
    setNotes('');
    setBatchNumber(`LOT-${new Date().toISOString().slice(2, 7).replace('-', '')}`);
    const defaultExp = new Date();
    defaultExp.setMonth(defaultExp.getMonth() + 3);
    setExpiryDate(defaultExp.toISOString().slice(0, 10));
    setSupplier('Pemasok Terpercaya');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (ing: Ingredient) => {
    setEditingId(ing.id);
    setName(ing.name);
    setCategory(ing.category);
    setStock(ing.stock);
    setUnit(ing.unit);
    setCostPerUnit(ing.costPerUnit);
    setMinStock(ing.minStock);
    setNotes(ing.notes || '');
    setBatchNumber(ing.batchNumber || '');
    setExpiryDate(ing.expiryDate || '');
    setSupplier(ing.supplier || '');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      const existing = ingredients.find((i) => i.id === editingId);
      if (existing) {
        onUpdateIngredient({
          ...existing,
          name: name.trim(),
          category,
          stock: Number(stock),
          unit,
          costPerUnit: Number(costPerUnit),
          minStock: Number(minStock),
          notes: notes.trim() || undefined,
          batchNumber: batchNumber.trim() || undefined,
          expiryDate: expiryDate || undefined,
          supplier: supplier.trim() || undefined,
        });
      }
    } else {
      const newIng: Ingredient = {
        id: `ing-${Date.now()}`,
        name: name.trim(),
        category,
        stock: Number(stock),
        unit,
        costPerUnit: Number(costPerUnit),
        minStock: Number(minStock),
        notes: notes.trim() || undefined,
        batchNumber: batchNumber.trim() || undefined,
        expiryDate: expiryDate || undefined,
        supplier: supplier.trim() || undefined,
      };
      onAddIngredient(newIng);
    }
    setIsFormOpen(false);
  };

  const handleOpenRestock = (item: Ingredient) => {
    setRestockItem(item);
    setRestockQty(5);
    setRestockBatch(item.batchNumber || `LOT-${new Date().toISOString().slice(2, 7).replace('-', '')}`);
    setRestockExpiry(item.expiryDate || '');
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;
    onRestock(restockItem.id, restockQty);
    if (restockBatch || restockExpiry) {
      onUpdateIngredient({
        ...restockItem,
        stock: restockItem.stock + restockQty,
        batchNumber: restockBatch || restockItem.batchNumber,
        expiryDate: restockExpiry || restockItem.expiryDate,
      });
    }
    setRestockItem(null);
  };

  const handleExportExpiryCSV = () => {
    let csv = 'Nama Bahan,Kategori,No. Batch/Lot,Tanggal Kedaluwarsa,Sisa Hari,Stok,Satuan,Supplier,Status\n';
    ingredients.forEach((ing) => {
      const days = getDaysUntilExpiry(ing.expiryDate);
      let status = 'Aman';
      if (days !== null) {
        if (days <= 0) status = 'KEDALUWARSA';
        else if (days <= 7) status = 'Mendekati Kedaluwarsa (<=7 Hari)';
      }
      csv += `"${ing.name}","${ing.category}","${ing.batchNumber || '-'}","${ing.expiryDate || '-'}","${
        days !== null ? `${days} hari` : '-'
      }",${ing.stock},"${ing.unit}","${ing.supplier || '-'}","${status}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OhMyCashier_Laporan_Batch_Expiry_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Top Header */}
      <div className="p-4 bg-white border-b border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-700" />
            <span>Manajemen Bahan Baku, Resep & Batch Expiry</span>
          </h2>
          <p className="text-xs text-gray-500">
            Pemotongan stok resep otomatis, pelacakan tanggal kedaluwarsa batch, dan restok bahan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'expiry' && (
            <button
              onClick={handleExportExpiryCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Laporan Batch</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Bahan Baku</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="px-4 py-2.5 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('stok')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'stok'
                ? 'bg-white text-gray-900 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Daftar Stok Bahan ({ingredients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('expiry')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'expiry'
                ? 'bg-white text-amber-900 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>Laporan Batch & Kedaluwarsa</span>
          </button>

          <button
            onClick={() => setActiveTab('recipes')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'recipes'
                ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-600" />
            <span>Resep Menu (BOM)</span>
          </button>

          <button
            onClick={() => setActiveTab('usage')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'usage'
                ? 'bg-white text-blue-900 shadow-2xs font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-blue-600" />
            <span>Pemakaian Bahan Terjual</span>
          </button>
        </div>

        {/* Quick Search */}
        {activeTab !== 'usage' && (
          <div className="relative min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari bahan, batch, supplier..."
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white"
            />
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* TAB 1: DAFTAR STOK BAHAN */}
        {activeTab === 'stok' && (
          <div className="space-y-3">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <span className="text-xs text-gray-500 font-medium">Filter Kategori:</span>
              {(['Semua', 'Bahan Mentah', 'Bahan Olahan'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    categoryFilter === cat
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}

              <span className="text-xs text-gray-500 font-medium ml-3">Status Expired:</span>
              {(['Semua', 'Mendekati', 'Aman'] as const).map((exp) => (
                <button
                  key={exp}
                  onClick={() => setExpiryFilter(exp)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-colors ${
                    expiryFilter === exp
                      ? 'bg-amber-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {exp === 'Mendekati' ? '⚠️ Mendekati Expired (<7 Hari)' : exp}
                </button>
              ))}
            </div>

            {/* Ingredients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((item) => {
                const isCritical = item.stock <= item.minStock;
                const daysUntilExp = getDaysUntilExpiry(item.expiryDate);
                const isExpSoon = daysUntilExp !== null && daysUntilExp <= 7 && daysUntilExp > 0;
                const isExpired = daysUntilExp !== null && daysUntilExp <= 0;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl bg-white border shadow-2xs flex flex-col justify-between transition-all ${
                      isExpired
                        ? 'border-red-300 ring-2 ring-red-100 bg-red-50/20'
                        : isCritical || isExpSoon
                        ? 'border-amber-300 ring-2 ring-amber-100'
                        : 'border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            item.category === 'Bahan Mentah'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {item.category}
                        </span>

                        <div className="flex items-center gap-1">
                          {isExpired && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              Expired!
                            </span>
                          )}
                          {!isExpired && isExpSoon && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3 text-amber-700" />
                              Exp {daysUntilExp} Hari
                            </span>
                          )}
                          {isCritical && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              Stok Kritis
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>

                      {/* Batch & Supplier Tag */}
                      <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-gray-500">
                        {item.batchNumber && (
                          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded font-semibold text-gray-700">
                            Batch: {item.batchNumber}
                          </span>
                        )}
                        {item.supplier && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <Truck className="w-2.5 h-2.5" />
                            <span>{item.supplier}</span>
                          </span>
                        )}
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{item.notes}</p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-gray-500">Stok Tersedia:</span>
                        <span className="text-base font-bold font-mono text-gray-900">
                          {item.stock} {item.unit}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Kedaluwarsa (Exp):</span>
                        <span
                          className={`font-semibold ${
                            isExpired
                              ? 'text-red-700 font-bold'
                              : isExpSoon
                              ? 'text-amber-700 font-bold'
                              : 'text-gray-700'
                          }`}
                        >
                          {item.expiryDate || '-'}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Biaya / {item.unit}:</span>
                        <span className="font-mono font-medium text-gray-700">
                          {formatRupiah(item.costPerUnit)}
                        </span>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleOpenRestock(item)}
                          className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Restok Masuk</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: LAPORAN BATCH & KEDALUWARSA */}
        {activeTab === 'expiry' && (
          <div className="space-y-3">
            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Manajemen Siklus Kedaluwarsa Bahan (FIFO - First In First Out)</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Gunakan bahan dengan tanggal kedaluwarsa terdekat terlebih dahulu untuk meminimalkan *food waste* dan menjaga kesegaran rasa menu Oh My Cashier.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Nama Bahan Baku</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">No. Batch / Lot</th>
                    <th className="px-4 py-3">Pemasok / Supplier</th>
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
                    const assetVal = ing.stock * ing.costPerUnit;

                    return (
                      <tr
                        key={ing.id}
                        className={`hover:bg-gray-50/80 transition-colors ${
                          isExp ? 'bg-red-50/30' : isWarning ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-bold text-gray-900">{ing.name}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              ing.category === 'Bahan Mentah'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-purple-50 text-purple-700'
                            }`}
                          >
                            {ing.category}
                          </span>
                        </td>
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
                          {formatRupiah(assetVal)}
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
          </div>
        )}

        {/* TAB 3: RESEP MENU & BOM (BILL OF MATERIALS) */}
        {activeTab === 'recipes' && (
          <div className="space-y-3">
            <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
              <UtensilsCrossed className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Pemotongan Otomatis Bahan Baku Berdasarkan Resep Menu</p>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Setiap kali transaksi kasir berhasil, stok bahan baku di bawah ini otomatis terpotong sesuai takaran per porsi / cup. Jika transaksi dibatalkan (void), stok bahan otomatis dikembalikan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {products.map((prod) => {
                const recipe = prod.ingredients || [];
                // Calculate max portions possible
                let maxPortions = Infinity;
                if (recipe.length > 0) {
                  recipe.forEach((r) => {
                    const ing = ingredients.find((i) => i.id === r.ingredientId);
                    if (ing && r.amount > 0) {
                      const possible = Math.floor(ing.stock / r.amount);
                      if (possible < maxPortions) maxPortions = possible;
                    }
                  });
                } else {
                  maxPortions = prod.stock;
                }

                return (
                  <div
                    key={prod.id}
                    className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">
                          {prod.category}
                        </span>
                        <h4 className="font-bold text-sm text-gray-900">{prod.name}</h4>
                        <span className="font-mono text-emerald-700 font-bold">
                          {formatRupiah(prod.price)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block">Kapasitas Produksi:</span>
                        <span className="text-xs font-bold font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          ~{maxPortions === Infinity ? prod.stock : maxPortions} {prod.unit}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <span className="text-[11px] font-bold text-gray-700 block mb-1">
                        Komposisi Resep per 1 {prod.unit}:
                      </span>
                      {recipe.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic">
                          Belum ada resep bahan mentah terikat (hanya potong stok produk langsung).
                        </p>
                      ) : (
                        <div className="space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          {recipe.map((r, idx) => {
                            const ing = ingredients.find((i) => i.id === r.ingredientId);
                            return (
                              <div
                                key={idx}
                                className="flex justify-between items-center text-[11px]"
                              >
                                <span className="text-gray-700 font-medium">
                                  {ing?.name || 'Bahan Tak Dikenal'}
                                </span>
                                <span className="font-mono font-bold text-gray-900">
                                  {r.amount} {r.unit}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: PEMAKAIAN BAHAN TERKONSUMSI */}
        {activeTab === 'usage' && (
          <div className="space-y-3">
            <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
              <TrendingDown className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Rekapitulasi Pemakaian Bahan Baku Dari Penjualan Selesai</p>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  Dihitung otomatis dari total {validOrders.length} transaksi selesai di sistem Oh My Cashier.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Nama Bahan Baku</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3 text-right">Total Terpakai</th>
                    <th className="px-4 py-3 text-right">Estimasi Biaya HPP Bahan</th>
                    <th className="px-4 py-3 text-right">Sisa Stok Fisik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ingredientUsageList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        Belum ada data pemakaian bahan baku dari pesanan selesai.
                      </td>
                    </tr>
                  ) : (
                    ingredientUsageList.map(({ ingredient: ing, totalUsed, totalCost }) => (
                      <tr key={ing.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-gray-900">{ing.name}</td>
                        <td className="px-4 py-3 text-gray-500">{ing.category}</td>
                        <td className="px-4 py-3 font-mono font-bold text-right text-emerald-800">
                          {totalUsed.toFixed(2)} {ing.unit}
                        </td>
                        <td className="px-4 py-3 font-mono text-right text-gray-800">
                          {formatRupiah(totalCost)}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-right text-gray-900">
                          {ing.stock} {ing.unit}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Ingredient Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-700 text-white shrink-0">
              <h3 className="font-bold text-base">
                {editingId ? 'Edit Bahan Baku' : 'Tambah Bahan Baku Baru'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs overflow-y-auto flex-1">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Nama Bahan Baku *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Kopi Biji Arabika Gayo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tipe Kategori *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white text-xs font-semibold"
                  >
                    <option value="Bahan Mentah">Bahan Mentah</option>
                    <option value="Bahan Olahan">Bahan Olahan</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Satuan Dasar *</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white text-xs font-semibold"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="gram">gram</option>
                    <option value="liter">liter</option>
                    <option value="ml">ml (Mililiter)</option>
                    <option value="pcs">pcs (Satuan / Cup)</option>
                  </select>
                </div>
              </div>

              {/* Batch & Expiry Fields */}
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                <span className="font-bold text-amber-900 block text-xs">
                  Informasi Batch & Tanggal Kedaluwarsa (Expiry)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-600 block mb-0.5">
                      Nomor Batch / Lot
                    </label>
                    <input
                      type="text"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="LOT-2610A"
                      className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-lg font-mono text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600 block mb-0.5">
                      Tgl. Kedaluwarsa (Exp)
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-gray-300 rounded-lg font-mono text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-600 block mb-0.5">
                    Nama Pemasok (Supplier)
                  </label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Contoh: PT Diamond Cold Storage"
                    className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    {editingId ? 'Stok Fisik' : 'Stok Awal'} ({unit})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Batas Minimum Stok ({unit})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Biaya Modal Beli per {unit} (Rp)
                </label>
                <input
                  type="number"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Penyimpanan di chiller, suhu 2-4 C, dll."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl"
                >
                  {editingId ? 'Simpan Perubahan' : 'Simpan Bahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-4 space-y-3 animate-in fade-in">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-emerald-700" />
              <span>Restok Bahan: {restockItem.name}</span>
            </h4>
            <p className="text-xs text-gray-500">
              Stok saat ini: <b>{restockItem.stock} {restockItem.unit}</b>
            </p>

            <form onSubmit={handleRestockSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Jumlah Tambahan Masuk ({restockItem.unit}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none font-mono font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-0.5">No. Batch Masuk</label>
                  <input
                    type="text"
                    value={restockBatch}
                    onChange={(e) => setRestockBatch(e.target.value)}
                    placeholder="LOT-..."
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-0.5">Exp Date Baru</label>
                  <input
                    type="date"
                    value={restockExpiry}
                    onChange={(e) => setRestockExpiry(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 flex justify-between items-center">
                <span>Stok Setelah Ditambah:</span>
                <span className="font-mono font-bold text-emerald-800 text-sm">
                  {+(restockItem.stock + restockQty).toFixed(2)} {restockItem.unit}
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg"
                >
                  Konfirmasi Restok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
