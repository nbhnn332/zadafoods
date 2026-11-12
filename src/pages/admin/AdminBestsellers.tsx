import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Package,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Product } from '../../types';

export const AdminBestsellers: React.FC = () => {
  const { products, bestsellerSection, updateBestsellerSection } = useAdminData();
  const { isSuperAdmin, hasPermission } = useAuth();
  const { showToast } = useToast();

  const canManage = isSuperAdmin || hasPermission('cms.homepage') || hasPermission('cms.sections');

  // Form states initialized from authoritative context
  const [title, setTitle] = useState(bestsellerSection.title || 'Bestsellers');
  const [subtitle, setSubtitle] = useState(
    bestsellerSection.subtitle || 'Our most celebrated Kerala snacks, traditional spices & sweets'
  );
  const [badge, setBadge] = useState(bestsellerSection.badge || 'Customer Favourites');
  const [isVisible, setIsVisible] = useState(bestsellerSection.isVisible !== false);
  const [maxProducts, setMaxProducts] = useState(bestsellerSection.maxProducts || 4);
  const [selectedIds, setSelectedIds] = useState<string[]>(bestsellerSection.productIds || []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when context updates remotely
  useEffect(() => {
    setTitle(bestsellerSection.title || 'Bestsellers');
    setSubtitle(
      bestsellerSection.subtitle || 'Our most celebrated Kerala snacks, traditional spices & sweets'
    );
    setBadge(bestsellerSection.badge || 'Customer Favourites');
    setIsVisible(bestsellerSection.isVisible !== false);
    setMaxProducts(bestsellerSection.maxProducts || 4);
    setSelectedIds(bestsellerSection.productIds || []);
  }, [bestsellerSection]);

  // Derived list of selected Product objects in exact curated order
  // Filter out any deleted or unpublished products to ensure clean display
  const selectedProducts: Product[] = selectedIds
    .map((id) => products.find((p) => p.id === id && p.isPublished))
    .filter((p): p is Product => Boolean(p));

  // Catalog products available to be added
  const availableProducts = products.filter((p) => {
    const isAlreadySelected = selectedIds.includes(p.id);
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categorySlug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categorySlug === selectedCategory;

    return !isAlreadySelected && p.isPublished && matchesSearch && matchesCategory;
  });

  const handleAddProduct = (productId: string) => {
    if (selectedIds.includes(productId)) return;
    setSelectedIds((prev) => [...prev, productId]);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedIds((prev) => prev.filter((id) => id !== productId));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setSelectedIds((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
      return updated;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedIds.length - 1) return;
    setSelectedIds((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
      return updated;
    });
  };

  const handleSave = async () => {
    if (!canManage) {
      showToast('Permission Denied', 'You do not have permission to modify bestseller settings.', 'error');
      return;
    }

    setIsSaving(true);
    const result = await updateBestsellerSection({
      id: bestsellerSection.id || 'h0000000-0000-0000-0000-000000000002',
      title: title.trim(),
      subtitle: subtitle.trim(),
      badge: badge.trim(),
      isVisible,
      maxProducts: Number(maxProducts) || 4,
      productIds: selectedIds
    });
    setIsSaving(false);

    if (result.success) {
      showToast('Bestsellers Saved', 'Bestsellers collection and ordering saved to database.', 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-content-primary flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>Bestseller Management</span>
          </h1>
          <p className="text-xs text-content-muted mt-1">
            Explicitly curate the products that appear in the &quot;Bestsellers&quot; homepage section. Newly created products are NEVER automatically enrolled.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || !canManage}
          className="px-4 py-2 rounded-btn bg-[#A67732] hover:bg-[#8F6428] text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving to Database...' : 'Save Bestsellers'}</span>
        </button>
      </div>

      {/* Configuration & Controls Card */}
      <div className="bg-white rounded-card border border-border-subtle p-4 sm:p-5 shadow-2xs space-y-4">
        <h2 className="font-bold text-sm text-content-primary">Section Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Section Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-medium focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Badge / Eyebrow Text
            </label>
            <input
              type="text"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-medium focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Max Displayed Products
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={maxProducts}
              onChange={(e) => setMaxProducts(Math.max(1, parseInt(e.target.value, 10) || 4))}
              className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-medium focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Section Visibility
            </label>
            <div className="pt-1.5 flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={(e) => setIsVisible(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
              <span className="text-xs font-medium text-content-primary">
                {isVisible ? 'Visible on Storefront' : 'Hidden from Storefront'}
              </span>
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Section Subtitle
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-medium focus:ring-1 focus:ring-brand-primary"
            />
          </div>
        </div>
      </div>

      {/* Main Curated Grid & Catalog Picker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Currently Selected Bestsellers (Ordered) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-content-primary flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Curated Bestsellers ({selectedProducts.length} selected, max {maxProducts} shown)</span>
            </h2>
            <span className="text-[11px] text-content-muted">
              Use arrows to reorder storefront priority
            </span>
          </div>

          {selectedProducts.length === 0 ? (
            <div className="p-8 bg-white rounded-card border border-dashed border-border-subtle text-center space-y-2">
              <Package className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-xs font-bold text-content-primary">No Bestsellers Curated</p>
              <p className="text-[11px] text-content-muted max-w-sm mx-auto">
                No products are currently in the bestseller collection. Select products from the catalog on the right to add them.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedProducts.map((prod, index) => {
                const variant = prod.variants[0];
                const isOverLimit = index >= maxProducts;

                return (
                  <div
                    key={prod.id}
                    className={`p-3 bg-white rounded-xl border flex items-center justify-between gap-3 shadow-2xs transition-all ${
                      isOverLimit ? 'opacity-50 border-dashed border-stone-300' : 'border-border-subtle'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="w-12 h-12 rounded-lg bg-stone-50 overflow-hidden shrink-0 border border-border-subtle">
                        {prod.images[0]?.imageUrl ? (
                          <img
                            src={prod.images[0].imageUrl}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                            No Img
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-content-primary truncate">
                          {prod.name}
                        </p>
                        <p className="text-[11px] text-content-muted">
                          {prod.categorySlug} • ₹{variant?.sellingPrice || 0}
                          {isOverLimit && (
                            <span className="ml-2 text-amber-700 font-semibold">
                              (Exceeds max display limit of {maxProducts})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        title="Move Up"
                        className="p-1.5 rounded-lg border border-border-subtle hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none text-content-secondary"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === selectedProducts.length - 1}
                        title="Move Down"
                        className="p-1.5 rounded-lg border border-border-subtle hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none text-content-secondary"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveProduct(prod.id)}
                        title="Remove from Bestsellers (does NOT delete product)"
                        className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Catalog Product Picker */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="font-bold text-sm text-content-primary flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-primary" />
            <span>Add Products From Catalog</span>
          </h2>

          <div className="p-3 bg-white rounded-card border border-border-subtle shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-border-subtle rounded-input text-xs font-medium focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 border border-border-subtle rounded-input text-xs bg-white font-medium"
              >
                <option value="all">All Categories</option>
                <option value="chips">Chips</option>
                <option value="spices">Spices & Blends</option>
                <option value="traditional-ingredients">Traditional Ingredients</option>
                <option value="sweets">Sweets</option>
                <option value="halwa">Halwa</option>
              </select>
            </div>

            <div className="max-h-[460px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-border-subtle/40">
              {availableProducts.length === 0 ? (
                <p className="text-xs text-content-muted text-center py-6">
                  No additional published products matching filters.
                </p>
              ) : (
                availableProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="pt-2 first:pt-0 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-content-primary truncate">
                        {prod.name}
                      </p>
                      <p className="text-[10px] text-content-muted">
                        {prod.categorySlug} • ₹{prod.variants[0]?.sellingPrice || 0}
                      </p>
                    </div>

                    <button
                      onClick={() => handleAddProduct(prod.id)}
                      className="px-2.5 py-1 rounded-btn bg-brand-primary/10 hover:bg-brand-primary hover:text-white text-brand-primary text-[11px] font-bold transition-all shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Storefront Preview */}
      <div className="bg-[#FAF8F5] rounded-card border border-[#EAE3D6] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#A67732]" />
            <h3 className="font-serif font-bold text-sm text-[#1C1917]">
              Storefront Appearance Preview
            </h3>
          </div>
          <span className="text-[11px] text-stone-500 font-medium">
            Status: {isVisible ? '🟢 Active on Homepage' : '🔴 Hidden on Homepage'}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#EAE3D6] shadow-xs space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A67732]">
              {badge}
            </span>
            <h2 className="font-serif font-bold text-xl text-[#1C1917] mt-0.5">
              {title}
            </h2>
            <p className="text-xs text-[#71717A] mt-0.5">{subtitle}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {selectedProducts.slice(0, maxProducts).map((prod) => (
              <div
                key={prod.id}
                className="bg-[#FAF8F5] rounded-xl p-3 border border-[#EAE3D6] flex flex-col justify-between"
              >
                <div className="aspect-square rounded-lg bg-stone-100 overflow-hidden mb-2">
                  {prod.images[0]?.imageUrl ? (
                    <img
                      src={prod.images[0].imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
                      No Image
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-xs text-[#1C1917] truncate">{prod.name}</p>
                  <p className="text-[11px] font-semibold text-[#A67732] mt-0.5">
                    ₹{prod.variants[0]?.sellingPrice || 0}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
