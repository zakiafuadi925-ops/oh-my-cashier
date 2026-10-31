import React, { useState } from 'react';
import { Product, SelectedVariant, CartItem } from '../../types';
import { formatRupiah } from '../../utils/format';
import { X, Plus, Minus, Check } from 'lucide-react';

interface ProductVariantModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export const ProductVariantModal: React.FC<ProductVariantModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<SelectedVariant[]>(() => {
    // Select the first option for required variant groups by default
    const defaults: SelectedVariant[] = [];
    product.variantGroups?.forEach((group) => {
      if (group.options.length > 0) {
        defaults.push({
          groupName: group.name,
          optionName: group.options[0].name,
          extraPrice: group.options[0].extraPrice,
        });
      }
    });
    return defaults;
  });
  const [notes, setNotes] = useState('');

  const handleSelectOption = (groupName: string, optionName: string, extraPrice: number) => {
    setSelectedVariants((prev) => {
      const filtered = prev.filter((v) => v.groupName !== groupName);
      return [...filtered, { groupName, optionName, extraPrice }];
    });
  };

  const extraTotal = selectedVariants.reduce((sum, v) => sum + v.extraPrice, 0);
  const unitPrice = product.price + extraTotal;
  const totalPrice = unitPrice * quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cartItemId = `${product.id}-${Date.now()}`;
    onAddToCart({
      cartItemId,
      product,
      quantity,
      selectedVariants,
      unitPrice,
      totalPrice,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div>
            <h3 className="font-bold text-slate-100 text-lg leading-tight">{product.name}</h3>
            <p className="text-orange-400 font-semibold text-sm">
              Mulai {formatRupiah(product.price)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Variant Groups */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 flex-1">
          {product.variantGroups && product.variantGroups.length > 0 ? (
            product.variantGroups.map((group) => {
              const currentSelected = selectedVariants.find((v) => v.groupName === group.name);
              return (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {group.name}
                      {group.required && <span className="text-rose-500 ml-1">*</span>}
                    </label>
                    <span className="text-[11px] text-slate-400">Pilih salah satu</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {group.options.map((opt) => {
                      const isSelected = currentSelected?.optionName === opt.name;
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => handleSelectOption(group.name, opt.name, opt.extraPrice)}
                          className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'border-orange-500 bg-orange-500/15 text-orange-200 ring-1 ring-orange-500/30'
                              : 'border-slate-800 hover:border-slate-700 text-slate-300 bg-slate-950/70 hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium text-xs truncate">{opt.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-orange-400 shrink-0 ml-1" />}
                          </div>
                          {opt.extraPrice > 0 ? (
                            <span className="text-[11px] font-semibold text-orange-400 mt-1">
                              +{formatRupiah(opt.extraPrice)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 mt-1">Gratis</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 italic">Produk standar tanpa pilihan varian khusus.</p>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Catatan Pesanan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: jangan terlalu manis, bungkus terpisah..."
              className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Quantity selector */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-300">Jumlah Pesanan</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-bold text-slate-100">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-100 hover:bg-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Footer Submit */}
          <button
            type="submit"
            className="w-full mt-2 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-between px-4 shadow-md shadow-orange-950/20 active:scale-98 transition-all cursor-pointer"
          >
            <span>Tambahkan ke Pesanan</span>
            <span className="font-mono text-base">{formatRupiah(totalPrice)}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
