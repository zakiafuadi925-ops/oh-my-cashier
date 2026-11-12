import React, { useState } from 'react';
import { Product, Ingredient } from '../../types';
import { formatRupiah } from '../../utils/format';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Barcode,
  Layers,
  X,
  RefreshCw,
  Boxes,
  Check,
  FolderPlus,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { ProductEditorModal } from './ProductEditorModal';
import { SupervisorPinModal } from '../Auth/SupervisorPinModal';

interface ProductManagementProps {
  products: Product[];
  categories: string[];
  supervisorPin?: string;
  ingredients?: Ingredient[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onAdjustStock: (productId: string, newStock: number, reason: string) => void;
  onAddCategory?: (category: string) => void;
  onDeleteCategory?: (category: string) => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  categories,
  supervisorPin = '1234',
  ingredients = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAdjustStock,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Full Editor Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Quick Inline Edit state
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlinePrice, setInlinePrice] = useState<number>(0);
  const [inlineCostPrice, setInlineCostPrice] = useState<number>(0);
  const [inlineStock, setInlineStock] = useState<number>(0);

  // Stock Adjust Modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('Restok Pembelian Baru');

  // Category Management Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  // Delete modal state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery);
    const matchesStock =
      stockFilter === 'all'
        ? true
        : stockFilter === 'low'
        ? p.stock > 0 && p.stock <= 10
        : p.stock <= 0;
    return matchesCategory && matchesSearch && matchesStock;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setIsEditorOpen(true);
  };

  const startInlineEdit = (p: Product) => {
    setInlineEditingId(p.id);
    setInlinePrice(p.price);
    setInlineCostPrice(p.costPrice);
    setInlineStock(p.stock);
  };

  const saveInlineEdit = (p: Product) => {
    onUpdateProduct({
      ...p,
      price: Number(inlinePrice) || p.price,
      costPrice: Number(inlineCostPrice) || p.costPrice,
      stock: Number(inlineStock) || 0,
    });
    setInlineEditingId(null);
  };

  const handleToggleStockStatus = (p: Product) => {
    const newStock = p.stock > 0 ? 0 : 50;
    onUpdateProduct({
      ...p,
      stock: newStock,
    });
  };

  const handleStockAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    const finalStock = Math.max(0, adjustingProduct.stock + adjustAmount);
    onAdjustStock(adjustingProduct.id, finalStock, adjustReason);
    setAdjustingProduct(null);
  };

  const handleAddNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatInput.trim()) return;
    if (onAddCategory) {
      onAddCategory(newCatInput.trim());
    }
    setNewCatInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <span>Katalog & Manajemen Menu Makanan & Minuman</span>
          </h2>
          <p className="text-xs text-slate-400">
            Edit menu, harga jual, modal HPP, varian, dan resep bahan baku secara langsung.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-700 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-emerald-400" />
            <span>Kelola Kategori</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Menu Baru</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama menu, barcode..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-slate-900 text-slate-100 placeholder-slate-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Status Stok:</span>
            <div className="flex gap-1 bg-slate-900 p-1 rounded-xl text-xs font-semibold border border-slate-800">
              <button
                onClick={() => setStockFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  stockFilter === 'all'
                    ? 'bg-orange-500 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                Semua ({products.length})
              </button>
              <button
                onClick={() => setStockFilter('low')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  stockFilter === 'low'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60 font-bold'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                Menipis (≤10)
              </button>
              <button
                onClick={() => setStockFilter('out')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  stockFilter === 'out'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60 font-bold'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                Habis
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white font-bold shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-slate-900 border border-slate-700 hover:border-emerald-500/50 px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Kategori</span>
          </button>
        </div>
      </div>

      {/* Product List: Mobile Cards (< 640px) vs Data Table (>= 640px) */}
      <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
        {/* Mobile View (< 640px): 1-Column Thumb-Friendly Cards */}
        <div className="block sm:hidden space-y-3 pb-6">
          {filteredProducts.length === 0 ? (
            <div className="bg-slate-800/60 p-8 rounded-2xl text-center text-slate-400 border border-slate-700">
              Tidak ada produk sesuai filter pencarian.
            </div>
          ) : (
            filteredProducts.map((p) => {
              const margin = p.price - p.costPrice;
              const marginPercent = p.price > 0 ? Math.round((margin / p.price) * 100) : 0;
              const isLow = p.stock > 0 && p.stock <= 10;
              const isOut = p.stock <= 0;

              return (
                <div
                  key={p.id}
                  className="bg-slate-800 rounded-2xl border border-slate-700 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{p.name}</h4>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-medium text-slate-300 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-md">
                          {p.category}
                        </span>
                        {p.barcode && (
                          <span className="text-[10px] font-mono text-slate-400">
                            #{p.barcode}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                        isOut
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800/60'
                          : isLow
                          ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                      }`}
                    >
                      {isOut ? 'Habis (0)' : `${p.stock} ${p.unit}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Harga Jual</span>
                      <span className="font-mono font-bold text-orange-400 tabular-nums">
                        {formatRupiah(p.price)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Modal (HPP)</span>
                      <span className="font-mono text-slate-400 tabular-nums">
                        {formatRupiah(p.costPrice)}
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-700 flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Margin Laba:</span>
                      <span className="font-mono font-bold text-emerald-400 tabular-nums">
                        +{formatRupiah(margin)} ({marginPercent}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAdjustingProduct(p);
                        setAdjustAmount(0);
                        setAdjustReason('Restock');
                      }}
                      className="min-h-[44px] px-3 bg-slate-900 hover:bg-slate-850 text-amber-300 border border-amber-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
                    >
                      <Boxes className="w-4 h-4 text-amber-400" />
                      <span>Atur Stok</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(p)}
                        className="min-h-[44px] px-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setProductToDelete(p)}
                        className="min-h-[44px] min-w-[44px] bg-slate-900 hover:bg-slate-800 border border-rose-800/60 text-rose-400 rounded-xl flex items-center justify-center transition-colors active:scale-95"
                        title="Hapus menu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tablet & Desktop View (>= 640px): Full Data Table */}
        <div className="hidden sm:block bg-slate-800 rounded-2xl shadow-sm border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Nama Menu / Produk</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Barcode</th>
                  <th className="px-4 py-3 text-right">Harga Jual</th>
                  <th className="px-4 py-3 text-right">Modal (HPP)</th>
                  <th className="px-4 py-3 text-right">Margin Laba</th>
                  <th className="px-4 py-3 text-center">Stok</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Tidak ada produk sesuai filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isInline = inlineEditingId === p.id;
                    const margin = (isInline ? inlinePrice : p.price) - (isInline ? inlineCostPrice : p.costPrice);
                    const currentPrice = isInline ? inlinePrice : p.price;
                    const marginPercent = currentPrice > 0 ? Math.round((margin / currentPrice) * 100) : 0;
                    const isLow = p.stock > 0 && p.stock <= 10;
                    const isOut = p.stock <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-700/40 transition-colors">
                        {/* Name & Badges */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-100 text-sm">{p.name}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {p.variantGroups && p.variantGroups.length > 0 && (
                              <span className="text-[10px] text-emerald-300 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.2 rounded font-semibold flex items-center gap-1">
                                <Layers className="w-2.5 h-2.5" />
                                {p.variantGroups.length} Varian ({p.variantGroups.map((vg) => vg.name).join(', ')})
                              </span>
                            )}
                            {p.ingredients && p.ingredients.length > 0 && (
                              <span className="text-[10px] text-cyan-300 bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.2 rounded font-semibold flex items-center gap-1">
                                <Boxes className="w-2.5 h-2.5" />
                                {p.ingredients.length} Bahan Baku Terikat
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3.5">
                          <span className="bg-slate-900 border border-slate-700 text-slate-300 px-2 py-0.5 rounded font-medium">
                            {p.category}
                          </span>
                        </td>

                        {/* Barcode */}
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                          {p.barcode}
                        </td>

                        {/* Harga Jual */}
                        <td className="px-4 py-3.5 text-right font-mono">
                          {isInline ? (
                            <input
                              type="number"
                              step={500}
                              value={inlinePrice}
                              onChange={(e) => setInlinePrice(Number(e.target.value) || 0)}
                              className="w-24 px-2 py-1 text-right font-bold text-xs border border-orange-500 rounded bg-slate-950 text-slate-100 outline-none"
                            />
                          ) : (
                            <span
                              onClick={() => startInlineEdit(p)}
                              className="font-bold text-orange-400 hover:text-orange-300 cursor-pointer hover:underline"
                              title="Klik untuk edit cepat harga"
                            >
                              {formatRupiah(p.price)}
                            </span>
                          )}
                        </td>

                        {/* Modal HPP */}
                        <td className="px-4 py-3.5 text-right font-mono text-slate-400">
                          {isInline ? (
                            <input
                              type="number"
                              step={500}
                              value={inlineCostPrice}
                              onChange={(e) => setInlineCostPrice(Number(e.target.value) || 0)}
                              className="w-24 px-2 py-1 text-right text-xs border border-slate-700 rounded bg-slate-950 text-slate-100 outline-none"
                            />
                          ) : (
                            formatRupiah(p.costPrice)
                          )}
                        </td>

                        {/* Margin */}
                        <td className="px-4 py-3.5 text-right font-medium">
                          <span className="text-emerald-400 font-mono">+{formatRupiah(margin)}</span>
                          <span className="text-[10px] text-slate-400 block">({marginPercent}%)</span>
                        </td>

                        {/* Stok */}
                        <td className="px-4 py-3.5 text-center">
                          {isInline ? (
                            <input
                              type="number"
                              value={inlineStock}
                              onChange={(e) => setInlineStock(Number(e.target.value) || 0)}
                              className="w-16 px-1 py-1 text-center font-bold text-xs border border-orange-500 rounded bg-slate-950 text-slate-100 outline-none"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleStockStatus(p)}
                              title="Klik untuk ubah cepat status Stok Habis / Tersedia"
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs transition-all hover:scale-105 border ${
                                isOut
                                  ? 'bg-rose-950/80 text-rose-300 border-rose-800/60'
                                  : isLow
                                  ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                              }`}
                            >
                              <span>{p.stock <= 0 ? 'Habis (0)' : `${p.stock} ${p.unit}`}</span>
                            </button>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1">
                          {isInline ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => saveInlineEdit(p)}
                                className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Simpan</span>
                              </button>
                              <button
                                onClick={() => setInlineEditingId(null)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-bold"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setAdjustingProduct(p);
                                  setAdjustAmount(0);
                                }}
                                className="p-1.5 text-emerald-400 hover:bg-slate-700 rounded-lg transition-colors"
                                title="Penyesuaian Stok / Opname"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(p)}
                                className="p-1.5 text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors"
                                title="Edit Lengkap (Nama, Varian, Resep, Harga)"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setProductToDelete(p)}
                                className="p-1.5 text-rose-400 hover:bg-slate-700 rounded-lg transition-colors"
                                title="Hapus Menu"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Full Product Editor Modal (Shared with POS) */}
      <ProductEditorModal
        isOpen={isEditorOpen}
        product={editingProduct}
        categories={categories}
        ingredients={ingredients}
        onSave={(updated) => {
          if (editingProduct) {
            onUpdateProduct(updated);
          } else {
            onAddProduct(updated);
          }
        }}
        onDelete={(id) => onDeleteProduct(id)}
        onClose={() => setIsEditorOpen(false)}
        onAddCategory={onAddCategory}
      />

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl max-w-sm w-full p-4 space-y-3">
            <h4 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>Penyesuaian Stok Produk</span>
            </h4>
            <p className="text-xs text-slate-400">
              Ubah stok produk <b>{adjustingProduct.name}</b>. Stok saat ini:{' '}
              <span className="font-bold text-slate-200">
                {adjustingProduct.stock} {adjustingProduct.unit}
              </span>
            </p>

            <form onSubmit={handleStockAdjustmentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Penambahan (+) atau Pengurangan (-) Stok
                </label>
                <input
                  type="number"
                  required
                  value={adjustAmount || ''}
                  onChange={(e) => setAdjustAmount(Number(e.target.value) || 0)}
                  placeholder="Contoh: +20 atau -5"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg outline-none font-mono font-bold text-sm text-slate-100 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Alasan Penyesuaian</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg outline-none text-slate-100 text-xs focus:border-orange-500"
                >
                  <option value="Restok Pembelian Baru">Restok Pembelian Baru</option>
                  <option value="Koreksi Fisik Opname">Koreksi Fisik Opname</option>
                  <option value="Produk Rusak / Basi">Produk Rusak / Basi</option>
                  <option value="Sampel / Tester Promosi">Sampel / Tester Promosi</option>
                </select>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Stok Baru Akhir:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {Math.max(0, adjustingProduct.stock + adjustAmount)} {adjustingProduct.unit}
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="flex-1 py-2 bg-slate-800 border border-slate-700 rounded-lg font-bold text-slate-300 hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-sm"
                >
                  Terapkan Penyesuaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Safe, in-app without window.confirm) */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl max-w-sm w-full p-4 space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-slate-100 text-base">Hapus Menu Ini?</h4>
              <p className="text-xs text-slate-400 mt-1">
                Menu <b>"{productToDelete.name}"</b> akan dihapus dari daftar menu makanan/minuman kasir.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2 bg-slate-800 border border-slate-700 rounded-xl font-bold text-slate-300 hover:bg-slate-700 text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm"
              >
                Ya, Hapus Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-2xl shadow-2xl max-w-md w-full p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-emerald-400" />
                <span>Kelola Kategori Menu</span>
              </h4>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleAddNewCategory} className="flex gap-2">
              <input
                type="text"
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                placeholder="Nama kategori baru, e.g. Dessert, Pastry..."
                className="flex-1 text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl outline-none text-slate-100 placeholder-slate-500 focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={!newCatInput.trim()}
                className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm"
              >
                + Tambah
              </button>
            </form>

            {/* Categories List */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {categories.map((cat) => {
                const count = cat === 'Semua' ? products.length : products.filter((p) => p.category === cat).length;
                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs"
                  >
                    <span className="font-semibold text-slate-200">{cat}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700">
                        {count} menu
                      </span>
                      {cat !== 'Semua' && onDeleteCategory && (
                        <button
                          type="button"
                          onClick={() => onDeleteCategory(cat)}
                          className="text-slate-400 hover:text-rose-400 p-1"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
