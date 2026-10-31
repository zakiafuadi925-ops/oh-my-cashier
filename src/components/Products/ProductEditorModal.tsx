import React, { useState, useEffect } from 'react';
import { Product, ProductVariantGroup, VariantOption, Ingredient } from '../../types';
import { formatRupiah } from '../../utils/format';
import {
  X,
  Package,
  Layers,
  Boxes,
  Plus,
  Trash2,
  Sparkles,
  Barcode,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface ProductEditorModalProps {
  isOpen: boolean;
  product: Product | null; // null for new product
  categories: string[];
  ingredients?: Ingredient[];
  onSave: (product: Product) => void;
  onDelete?: (productId: string) => void;
  onClose: () => void;
  onAddCategory?: (newCategory: string) => void;
}

export const ProductEditorModal: React.FC<ProductEditorModalProps> = ({
  isOpen,
  product,
  categories,
  ingredients = [],
  onSave,
  onDelete,
  onClose,
  onAddCategory,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'variants' | 'recipe'>('info');

  // Basic Info Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Kopi & Minuman');
  const [customCategory, setCustomCategory] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [price, setPrice] = useState<number>(20000);
  const [costPrice, setCostPrice] = useState<number>(8000);
  const [stock, setStock] = useState<number>(50);
  const [unit, setUnit] = useState('cup');
  const [barcode, setBarcode] = useState('');

  // Variants State
  const [variantGroups, setVariantGroups] = useState<ProductVariantGroup[]>([]);

  // Recipe State (Bill of Materials)
  const [recipeItems, setRecipeItems] = useState<{ ingredientId: string; amount: number; unit: string }[]>([]);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronize state when product changes
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setCategory(product.category || categories[1] || 'Kopi & Minuman');
      setPrice(product.price ?? 20000);
      setCostPrice(product.costPrice ?? 8000);
      setStock(product.stock ?? 50);
      setUnit(product.unit || 'cup');
      setBarcode(product.barcode || '');
      setVariantGroups(product.variantGroups ? JSON.parse(JSON.stringify(product.variantGroups)) : []);
      setRecipeItems(product.ingredients ? JSON.parse(JSON.stringify(product.ingredients)) : []);
    } else {
      setName('');
      setCategory(categories[1] || 'Kopi & Minuman');
      setPrice(20000);
      setCostPrice(8000);
      setStock(50);
      setUnit('cup');
      setBarcode(`899${Math.floor(1000000 + Math.random() * 9000000)}`);
      setVariantGroups([]);
      setRecipeItems([]);
    }
    setActiveTab('info');
    setIsAddingNewCategory(false);
    setCustomCategory('');
    setShowDeleteConfirm(false);
    setErrorMsg(null);
  }, [product, isOpen]);

  if (!isOpen) return null;

  // Calculate estimated Cost Price from recipe if items are added
  const estimatedHPPFromRecipe = recipeItems.reduce((sum, item) => {
    const ing = ingredients.find((i) => i.id === item.ingredientId);
    if (!ing) return sum;
    return sum + item.amount * (ing.costPerUnit || 0);
  }, 0);

  const handleGenerateBarcode = () => {
    setBarcode(`899${Math.floor(1000000 + Math.random() * 9000000)}`);
  };

  // Add new variant group
  const handleAddVariantGroup = () => {
    const newGroup: ProductVariantGroup = {
      id: `vg-${Date.now()}`,
      name: 'Pilihan Varian',
      required: false,
      options: [
        { id: `vo-${Date.now()}-1`, name: 'Reguler', extraPrice: 0 },
        { id: `vo-${Date.now()}-2`, name: 'Large (+Rp 5.000)', extraPrice: 5000 },
      ],
    };
    setVariantGroups((prev) => [...prev, newGroup]);
  };

  const handleRemoveVariantGroup = (groupId: string) => {
    setVariantGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const handleUpdateGroupName = (groupId: string, newName: string) => {
    setVariantGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, name: newName } : g))
    );
  };

  const handleToggleGroupRequired = (groupId: string) => {
    setVariantGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, required: !g.required } : g))
    );
  };

  const handleAddOption = (groupId: string) => {
    const newOption: VariantOption = {
      id: `vo-${Date.now()}`,
      name: 'Opsi Baru',
      extraPrice: 0,
    };
    setVariantGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, options: [...g.options, newOption] } : g
      )
    );
  };

  const handleRemoveOption = (groupId: string, optionId: string) => {
    setVariantGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, options: g.options.filter((o) => o.id !== optionId) }
          : g
      )
    );
  };

  const handleUpdateOption = (
    groupId: string,
    optionId: string,
    field: 'name' | 'extraPrice',
    value: any
  ) => {
    setVariantGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          options: g.options.map((o) =>
            o.id === optionId ? { ...o, [field]: value } : o
          ),
        };
      })
    );
  };

  // Recipe item actions
  const handleAddRecipeIngredient = () => {
    if (ingredients.length === 0) return;
    const defaultIng = ingredients[0];
    setRecipeItems((prev) => [
      ...prev,
      {
        ingredientId: defaultIng.id,
        amount: defaultIng.unit === 'kg' ? 0.02 : defaultIng.unit === 'liter' ? 0.15 : 1,
        unit: defaultIng.unit,
      },
    ]);
  };

  const handleRemoveRecipeIngredient = (index: number) => {
    setRecipeItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateRecipeIngredient = (
    index: number,
    field: 'ingredientId' | 'amount',
    val: any
  ) => {
    setRecipeItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        if (field === 'ingredientId') {
          const matchedIng = ingredients.find((i) => i.id === val);
          return {
            ...item,
            ingredientId: val,
            unit: matchedIng ? matchedIng.unit : item.unit,
          };
        }
        return { ...item, [field]: Number(val) };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama menu makanan/minuman wajib diisi');
      return;
    }

    let finalCategory = category;
    if (isAddingNewCategory && customCategory.trim()) {
      finalCategory = customCategory.trim();
      if (onAddCategory) {
        onAddCategory(finalCategory);
      }
    }

    const updatedProduct: Product = {
      id: product?.id || `prod-${Date.now()}`,
      name: name.trim(),
      category: finalCategory,
      price: Number(price) || 0,
      costPrice: Number(costPrice) || 0,
      stock: Number(stock) || 0,
      unit: unit.trim() || 'cup',
      barcode: barcode.trim() || `899${Date.now()}`,
      variantGroups: variantGroups.length > 0 ? variantGroups : undefined,
      ingredients: recipeItems.length > 0 ? recipeItems : undefined,
    };

    onSave(updatedProduct);
    onClose();
  };

  const margin = price - costPrice;
  const marginPercent = price > 0 ? Math.round((margin / price) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col my-auto border border-gray-100 animate-in fade-in zoom-in-95 max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-emerald-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-inner">
              <Package className="w-4 h-4 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                {product ? `Edit Menu: ${product.name}` : 'Tambah Menu Makanan & Minuman Baru'}
              </h3>
              <p className="text-[11px] text-emerald-100">
                Kelola nama, harga, stok, varian, dan resep bahan baku langsung dari aplikasi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-5 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'info'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>1. Info & Harga</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('variants')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'variants'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Varian & Topping</span>
            {variantGroups.length > 0 && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                {variantGroups.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recipe')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'recipe'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>3. Resep Bahan (BOM)</span>
            {recipeItems.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                {recipeItems.length}
              </span>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="mx-5 mt-3 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Content (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* TAB 1: INFO & HARGA */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div>
                <label className="font-bold text-gray-800 block mb-1">
                  Nama Menu Makanan / Minuman <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Contoh: Kopi Susu Aren Oh My Cashier, Mie Goreng Telur, Croissant Butter..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold text-gray-900 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-gray-800">Kategori Menu</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
                      className="text-[10px] text-emerald-700 font-bold hover:underline"
                    >
                      {isAddingNewCategory ? 'Pilih dari List' : '+ Buat Kategori Baru'}
                    </button>
                  </div>

                  {isAddingNewCategory ? (
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Ketik kategori baru, e.g. Dessert, Snack..."
                      className="w-full px-3 py-2 border border-emerald-400 bg-emerald-50/40 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  ) : (
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                    >
                      {categories
                        .filter((c) => c !== 'Semua')
                        .map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="font-bold text-gray-800 block mb-1">Satuan Porsi</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                  >
                    <option value="cup">Cup / Gelas</option>
                    <option value="porsi">Porsi</option>
                    <option value="pcs">Pcs / Buah</option>
                    <option value="botol">Botol</option>
                    <option value="piring">Piring / Mangkok</option>
                    <option value="paket">Paket</option>
                  </select>
                </div>
              </div>

              {/* Price & Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                <div>
                  <label className="font-bold text-gray-800 block mb-1">
                    Harga Jual ke Pelanggan (Rp) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-xs">
                      Rp
                    </span>
                    <input
                      type="number"
                      required
                      min={0}
                      step={500}
                      value={price || ''}
                      onChange={(e) => setPrice(Number(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-sm bg-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-gray-800">Modal / HPP (Rp)</label>
                    {estimatedHPPFromRecipe > 0 && (
                      <button
                        type="button"
                        onClick={() => setCostPrice(Math.round(estimatedHPPFromRecipe))}
                        className="text-[10px] text-blue-700 font-bold hover:underline"
                        title="Gunakan total HPP yang dihitung dari bahan baku"
                      >
                        Pakai HPP Resep: {formatRupiah(Math.round(estimatedHPPFromRecipe))}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-xs">
                      Rp
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={costPrice || ''}
                      onChange={(e) => setCostPrice(Number(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm bg-white"
                    />
                  </div>
                </div>

                {/* Profit Margin indicator */}
                <div className="sm:col-span-2 flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-emerald-900 font-semibold">Estimasi Margin Laba Bersih:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-emerald-800 text-sm">
                      +{formatRupiah(Math.max(0, margin))}
                    </span>
                    <span className="bg-emerald-700 text-white font-extrabold text-[11px] px-2 py-0.5 rounded-full">
                      {marginPercent}% Margin
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock and Barcode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-gray-800">Stok Menu Saat Ini</label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setStock(0)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-colors ${
                          stock === 0 ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        Set Habis (0)
                      </button>
                      <button
                        type="button"
                        onClick={() => setStock(50)}
                        className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        Set 50
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm font-bold"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    {stock <= 0
                      ? '⚠️ Produk akan berstatus "Habis" dan tidak bisa dipilih kasir.'
                      : `Tersedia ${stock} ${unit} untuk dipesan pelanggan.`}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-gray-800">Barcode / SKU Produk</label>
                    <button
                      type="button"
                      onClick={handleGenerateBarcode}
                      className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Buat Otomatis</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Barcode className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="899..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VARIAN & TOPPING (MODIFIER) */}
          {activeTab === 'variants' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Kelola Varian & Opsi Tambahan</h4>
                  <p className="text-[11px] text-gray-500">
                    Contoh: Ukuran cup (Regular/Large), Tingkat Kemanisan, atau Extra Topping dengan biaya tambahan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariantGroup}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Kelompok Varian</span>
                </button>
              </div>

              {variantGroups.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center space-y-2 bg-gray-50/50">
                  <Layers className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="font-bold text-gray-600 text-xs">Belum ada varian untuk menu ini</p>
                  <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                    Produk akan dijual dalam 1 ukuran / tipe standar. Klik "Tambah Kelompok Varian" jika menu ini memiliki opsi ukuran, level pedas, es, atau topping.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddVariantGroup}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold rounded-xl text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buat Varian Pertama</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {variantGroups.map((group, gIndex) => (
                    <div
                      key={group.id}
                      className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 flex items-center gap-2">
                          <span className="font-bold text-gray-500 text-xs">#{gIndex + 1}</span>
                          <input
                            type="text"
                            value={group.name}
                            onChange={(e) => handleUpdateGroupName(group.id, e.target.value)}
                            placeholder="Nama Kelompok (e.g. Ukuran Cup, Suhu, Level Gula)..."
                            className="font-bold text-gray-900 bg-white border border-gray-300 px-2.5 py-1 rounded-lg text-xs flex-1 outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={group.required}
                            onChange={() => handleToggleGroupRequired(group.id)}
                            className="rounded text-emerald-700 focus:ring-emerald-500"
                          />
                          <span>Wajib Dipilih</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariantGroup(group.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Hapus Kelompok Varian"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Options list */}
                      <div className="space-y-2 pl-4 border-l-2 border-emerald-300">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Daftar Opsi & Tambahan Harga:
                        </span>
                        {group.options.map((option) => (
                          <div key={option.id} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={option.name}
                              onChange={(e) =>
                                handleUpdateOption(group.id, option.id, 'name', e.target.value)
                              }
                              placeholder="Nama Opsi (e.g. Less Sugar, Large, Extra Boba)"
                              className="flex-1 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <div className="relative w-32 shrink-0">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
                                +Rp
                              </span>
                              <input
                                type="number"
                                min={0}
                                step={500}
                                value={option.extraPrice}
                                onChange={(e) =>
                                  handleUpdateOption(
                                    group.id,
                                    option.id,
                                    'extraPrice',
                                    Number(e.target.value) || 0
                                  )
                                }
                                placeholder="0"
                                className="w-full pl-8 pr-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(group.id, option.id)}
                              className="text-gray-400 hover:text-red-500 p-1"
                              title="Hapus Opsi"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => handleAddOption(group.id)}
                          className="mt-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Tambah Opsi Pilihan</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RESEP BAHAN BAKU (BOM) */}
          {activeTab === 'recipe' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Resep Menu & Pengurangan Stok Bahan</h4>
                  <p className="text-[11px] text-gray-500">
                    Setiap menu ini terjual di kasir, stok bahan baku mentah akan terpotong secara otomatis.
                  </p>
                </div>
                {ingredients.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAddRecipeIngredient}
                    className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Hubungkan Bahan Baku</span>
                  </button>
                )}
              </div>

              {ingredients.length === 0 ? (
                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs">
                  <p className="font-bold mb-1">Belum Ada Data Bahan Baku di Sistem</p>
                  <p className="text-[11px] text-amber-800">
                    Anda dapat menambahkan daftar bahan mentah (seperti Biji Kopi, Susu UHT, Sirup, Tepung) di tab <b>"Bahan Baku"</b> pada sidebar terlebih dahulu.
                  </p>
                </div>
              ) : recipeItems.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center space-y-2 bg-gray-50/50">
                  <Boxes className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="font-bold text-gray-600 text-xs">Belum ada bahan baku yang dihubungkan ke menu ini</p>
                  <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                    Hubungkan bahan seperti kopi, susu, atau sirup agar stok inventaris dapur berkurang otomatis saat order diselesaikan di kasir.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddRecipeIngredient}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 hover:bg-blue-200 font-bold rounded-xl text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Hubungkan Bahan Sekarang</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-600">
                      <thead className="bg-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-3 py-2 rounded-l-lg">Bahan Baku</th>
                          <th className="px-3 py-2 text-right">Takaran Per Porsi</th>
                          <th className="px-3 py-2 text-right">Biaya Satuan</th>
                          <th className="px-3 py-2 text-right">Subtotal Modal</th>
                          <th className="px-2 py-2 text-center rounded-r-lg">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recipeItems.map((item, idx) => {
                          const ing = ingredients.find((i) => i.id === item.ingredientId);
                          const subCost = ing ? (ing.costPerUnit || 0) * item.amount : 0;

                          return (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2.5">
                                <select
                                  value={item.ingredientId}
                                  onChange={(e) =>
                                    handleUpdateRecipeIngredient(idx, 'ingredientId', e.target.value)
                                  }
                                  className="w-full px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs outline-none font-medium"
                                >
                                  {ingredients.map((ingItem) => (
                                    <option key={ingItem.id} value={ingItem.id}>
                                      {ingItem.name} ({ingItem.unit})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <input
                                    type="number"
                                    min={0.001}
                                    step={0.001}
                                    value={item.amount}
                                    onChange={(e) =>
                                      handleUpdateRecipeIngredient(idx, 'amount', e.target.value)
                                    }
                                    className="w-20 px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-right outline-none"
                                  />
                                  <span className="text-gray-500 font-semibold text-[11px] w-8 text-left">
                                    {ing?.unit || item.unit}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-right font-mono text-gray-500">
                                {ing ? formatRupiah(ing.costPerUnit) : '-'}
                              </td>
                              <td className="px-3 py-2.5 text-right font-mono font-bold text-gray-800">
                                {formatRupiah(Math.round(subCost))}
                              </td>
                              <td className="px-2 py-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRecipeIngredient(idx)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                                  title="Hapus Bahan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Box */}
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-900 block text-xs">Total Modal Bahan (HPP Resep):</span>
                      <span className="text-[11px] text-blue-700">
                        {recipeItems.length} bahan baku akan berkurang setiap 1 {unit} pesanan dibuat.
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-extrabold text-blue-950 text-sm block">
                        {formatRupiah(Math.round(estimatedHPPFromRecipe))}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCostPrice(Math.round(estimatedHPPFromRecipe))}
                        className="text-[10px] text-blue-700 underline font-bold"
                      >
                        Pasang sebagai Modal (HPP)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              {product && onDelete && (
                showDeleteConfirm ? (
                  <div className="flex items-center gap-1.5 bg-red-50 p-1.5 rounded-xl border border-red-200">
                    <span className="text-[11px] text-red-700 font-bold px-1">Yakin hapus?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(product.id);
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
                    >
                      Ya, Hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2 py-1 bg-white border border-gray-300 text-gray-600 rounded-lg text-xs font-bold"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Menu</span>
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-700/20 flex items-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Perubahan Menu</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
