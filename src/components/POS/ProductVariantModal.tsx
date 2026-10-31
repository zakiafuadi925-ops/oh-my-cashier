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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
          <div>
            <h3 className="font-bold text-gray-900 text-lg leading-tight">{product.name}</h3>
            <p className="text-emerald-700 font-semibold text-sm">
              Mulai {formatRupiah(product.price)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-gray-500 shadow-xs border border-gray-200"
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
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      {group.name}
                      {group.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <span className="text-[11px] text-gray-400">Pilih salah satu</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {group.options.map((opt) => {
                      const isSelected = currentSelected?.optionName === opt.name;
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => handleSelectOption(group.name, opt.name, opt.extraPrice)}
                          className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium text-xs truncate">{opt.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />}
                          </div>
                          {opt.extraPrice > 0 ? (
                            <span className="text-[11px] font-semibold text-emerald-700 mt-1">
                              +{formatRupiah(opt.extraPrice)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 mt-1">Gratis</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-gray-500 italic">Produk standar tanpa pilihan varian khusus.</p>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Catatan Pesanan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: jangan terlalu manis, bungkus terpisah..."
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Quantity selector */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Jumlah Pesanan</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-bold text-gray-900">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-lg border border-emerald-600 bg-emerald-50 text-emerald-700 flex items-center justify-center hover:bg-emerald-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Footer Submit */}
          <button
            type="submit"
            className="w-full mt-2 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center justify-between px-4 shadow-md transition-colors"
          >
            <span>Tambahkan ke Pesanan</span>
            <span className="font-mono text-base">{formatRupiah(totalPrice)}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
