import React, { useState } from 'react';
import { Plus, Trash2, Edit2, X, Package, Sparkles } from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { ComboBundle, ComboBundleItem } from '../../types';

export const AdminCombos: React.FC = () => {
  const { combos, products, addCombo, updateCombo, deleteCombo, toggleComboActive } = useAdminData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboBundle | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [comboPrice, setComboPrice] = useState<number>(450);
  const [selectedItems, setSelectedItems] = useState<ComboBundleItem[]>([]);

  // Item selector helpers
  const [pickerProductId, setPickerProductId] = useState(products[0]?.id || '');
  const [pickerVariantId, setPickerVariantId] = useState(products[0]?.variants[0]?.id || '');
  const [pickerQty, setPickerQty] = useState<number>(1);

  // Calculate original component total price
  const originalTotalPrice = selectedItems.reduce((sum, item) => {
    const prod = products.find((p) => p.id === item.productId);
    const variant = prod?.variants.find((v) => v.id === item.variantId);
    return sum + (variant ? variant.sellingPrice * item.quantity : 0);
  }, 0);

  const discountPercent =
    originalTotalPrice > 0
      ? Math.max(0, Math.round(((originalTotalPrice - comboPrice) / originalTotalPrice) * 100))
      : 0;

  const openCreateModal = () => {
    setEditingCombo(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=600&q=80');
    setComboPrice(450);
    setSelectedItems([]);
    setIsModalOpen(true);
  };

  const openEditModal = (cb: ComboBundle) => {
    setEditingCombo(cb);
    setName(cb.name);
    setSlug(cb.slug);
    setDescription(cb.description);
    setImageUrl(cb.imageUrl);
    setComboPrice(cb.comboPrice);
    setSelectedItems([...cb.items]);
    setIsModalOpen(true);
  };

  const handleAddItemToCombo = () => {
    const prod = products.find((p) => p.id === pickerProductId);
    const variant = prod?.variants.find((v) => v.id === pickerVariantId);
    if (!prod || !variant) return;

    const existingIdx = selectedItems.findIndex((it) => it.variantId === pickerVariantId);
    if (existingIdx > -1) {
      const updated = [...selectedItems];
      updated[existingIdx].quantity += pickerQty;
      setSelectedItems(updated);
    } else {
      setSelectedItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          variantId: variant.id,
          quantity: pickerQty,
          productName: prod.name,
          variantLabel: variant.weightLabel
        }
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveCombo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedItems.length === 0) return;

    const bundleSlug = slug.trim() || name.toLowerCase().replace(/\s+/g, '-');

    if (editingCombo) {
      updateCombo(editingCombo.id, {
        name,
        slug: bundleSlug,
        description,
        imageUrl,
        originalPrice: originalTotalPrice,
        comboPrice,
        discountPercent,
        items: selectedItems
      });
    } else {
      addCombo({
        name,
        slug: bundleSlug,
        description,
        imageUrl,
        originalPrice: originalTotalPrice,
        comboPrice,
        discountPercent,
        isActive: true,
        items: selectedItems
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif text-content-primary">
            Curated Combo Packs & Hampers
          </h1>
          <p className="text-xs text-content-muted mt-0.5">
            Assemble multi-product snack boxes, calculate bundle savings, and feature them on the storefront.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-3.5 py-2 rounded-btn bg-brand-primary text-white text-xs font-bold flex items-center gap-1.5 hover:bg-brand-primary-hover shadow-sm self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Build New Combo</span>
        </button>
      </div>

      {/* Combos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {combos.map((cb) => (
          <div
            key={cb.id}
            className="bg-white rounded-card border border-border-subtle shadow-subtle overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 bg-canvas">
                <img src={cb.imageUrl} alt={cb.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-pill bg-brand-gold text-white font-bold text-xs shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Save {cb.discountPercent}%</span>
                  </span>
                  <button
                    onClick={() => toggleComboActive(cb.id)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      cb.isActive ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-white/80'
                    }`}
                  >
                    {cb.isActive ? 'Active' : 'Disabled'}
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-serif font-bold text-base text-content-primary">{cb.name}</h3>
                  <p className="text-xs text-content-muted mt-0.5">{cb.description}</p>
                </div>

                {/* Bundle Component Items */}
                <div className="space-y-1.5 pt-2 border-t border-border-subtle/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-content-secondary">
                    Included in Hamper:
                  </p>
                  <div className="space-y-1">
                    {cb.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-content-primary">
                        <span className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-brand-primary" />
                          <span>{it.productName}</span>
                          <span className="text-content-muted">({it.variantLabel})</span>
                        </span>
                        <span className="font-bold">x{it.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Price Footer & Actions */}
            <div className="p-4 bg-canvas-subtle border-t border-border-subtle flex items-center justify-between">
              <div>
                <span className="text-lg font-bold text-content-primary">₹{cb.comboPrice}</span>
                <span className="text-xs text-content-muted line-through ml-2">₹{cb.originalPrice}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(cb)}
                  className="p-1.5 rounded text-content-muted hover:text-brand-primary hover:bg-white border border-border-subtle"
                  title="Edit combo"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete combo "${cb.name}"?`)) {
                      deleteCombo(cb.id);
                    }
                  }}
                  className="p-1.5 rounded text-content-muted hover:text-rose-600 hover:bg-white border border-border-subtle"
                  title="Delete combo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Combo Builder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-card max-w-2xl w-full p-6 shadow-elevated space-y-4 my-8 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h2 className="font-serif text-lg font-bold text-content-primary">
                {editingCombo ? 'Edit Combo Bundle' : 'Build Custom Combo Bundle'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-content-muted hover:text-content-primary rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCombo} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-content-primary block mb-1">Bundle Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Malabar Evening Crunch Pack"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-content-primary block mb-1">Slug</label>
                  <input
                    type="text"
                    placeholder="malabar-evening-crunch"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-content-primary block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Highlights of this combo pack..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-content-primary block mb-1">Image URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
                />
              </div>

              {/* Component Variant Selector */}
              <div className="pt-2 border-t border-border-subtle space-y-2">
                <h3 className="font-bold text-content-primary uppercase text-[10px] tracking-wider">
                  Select Products to Include
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-canvas-subtle p-2.5 rounded-card items-center">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-content-muted block mb-0.5">Product</label>
                    <select
                      value={pickerProductId}
                      onChange={(e) => {
                        setPickerProductId(e.target.value);
                        const p = products.find((pr) => pr.id === e.target.value);
                        if (p && p.variants[0]) setPickerVariantId(p.variants[0].id);
                      }}
                      className="w-full px-2 py-1.5 border border-border-subtle rounded text-xs bg-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-content-muted block mb-0.5">Pack Variant</label>
                    <select
                      value={pickerVariantId}
                      onChange={(e) => setPickerVariantId(e.target.value)}
                      className="w-full px-2 py-1.5 border border-border-subtle rounded text-xs bg-white"
                    >
                      {products
                        .find((p) => p.id === pickerProductId)
                        ?.variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.weightLabel} (₹{v.sellingPrice})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="w-16">
                      <label className="text-[10px] text-content-muted block mb-0.5">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={pickerQty}
                        onChange={(e) => setPickerQty(Math.max(1, Number(e.target.value)))}
                        className="w-full px-2 py-1.5 border border-border-subtle rounded text-xs font-bold text-center"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddItemToCombo}
                      className="px-3 py-1.5 bg-brand-secondary text-white font-bold rounded text-xs hover:bg-black"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Selected Items List */}
                <div className="space-y-1.5">
                  {selectedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 border border-border-subtle rounded text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-content-primary">{item.productName}</span>
                        <span className="text-content-muted">({item.variantLabel})</span>
                        <span className="px-1.5 py-0.2 bg-canvas-subtle rounded font-bold">Qty: {item.quantity}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-500 hover:text-rose-700 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing & Calculated Savings */}
              <div className="p-3 bg-canvas-subtle rounded-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-content-secondary font-semibold">Total Retail Value of Components:</span>
                  <span className="font-bold text-content-primary">₹{originalTotalPrice}</span>
                </div>

                <div className="flex items-center justify-between">
                  <label className="font-bold text-content-primary">Special Bundle Selling Price (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={comboPrice}
                    onChange={(e) => setComboPrice(Number(e.target.value))}
                    className="w-28 px-3 py-1.5 border border-border-subtle rounded text-xs font-bold text-right"
                  />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border-subtle/60 text-emerald-700 font-bold">
                  <span>Customer Savings:</span>
                  <span>{discountPercent}% OFF (Save ₹{Math.max(0, originalTotalPrice - comboPrice)})</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-btn border border-border-subtle font-semibold hover:bg-canvas-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedItems.length === 0}
                  className="px-4 py-2 rounded-btn bg-brand-primary text-white font-bold hover:bg-brand-primary-hover shadow-sm disabled:opacity-50"
                >
                  Save Combo Bundle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
