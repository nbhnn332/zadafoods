import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Package
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Product } from '../../types';

export const AdminHandpicked: React.FC = () => {
  const { products, handpickedSection, updateHandpickedSection } = useAdminData();
  const { isSuperAdmin, hasPermission } = useAuth();
  const { showToast } = useToast();

  const canManage = isSuperAdmin || hasPermission('cms.homepage') || hasPermission('cms.sections');

  // Form states initialized from authoritative context
  const [title, setTitle] = useState(handpickedSection.title || 'Traditional Sweets & Specialties');
  const [subtitle, setSubtitle] = useState(handpickedSection.subtitle || 'Slow-cooked authentic delicacies, regional staples & specialty treats');
  const [badge, setBadge] = useState(handpickedSection.badge || 'Handpicked For You');
  const [isVisible, setIsVisible] = useState(handpickedSection.isVisible !== false);
  const [selectedIds, setSelectedIds] = useState<string[]>(handpickedSection.productIds || []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if context updates remotely
  useEffect(() => {
    setTitle(handpickedSection.title || 'Traditional Sweets & Specialties');
    setSubtitle(handpickedSection.subtitle || 'Slow-cooked authentic delicacies, regional staples & specialty treats');
    setBadge(handpickedSection.badge || 'Handpicked For You');
    setIsVisible(handpickedSection.isVisible !== false);
    setSelectedIds(handpickedSection.productIds || []);
  }, [handpickedSection]);

  // Derived list of selected Product objects in exact ordering
  const selectedProducts: Product[] = selectedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  // Catalog products available to be added
  const availableProducts = products.filter((p) => {
    const isAlreadySelected = selectedIds.includes(p.id);
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categorySlug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categorySlug === selectedCategory;

    return !isAlreadySelected && matchesSearch && matchesCategory;
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      showToast('Permission Denied', 'Administrator permissions required to update homepage sections.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateHandpickedSection({
        id: handpickedSection.id || 'h0000000-0000-0000-0000-000000000001',
        title: title.trim(),
        subtitle: subtitle.trim(),
        badge: badge.trim(),
        isVisible,
        productIds: selectedIds
      });

      if (res.success) {
        showToast('Section Saved', 'Handpicked for You section successfully saved to Supabase.', 'success');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Unique categories for catalog filter
  const categoriesList = Array.from(new Set(products.map((p) => p.categorySlug))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-serif text-content-primary">
              Handpicked For You
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              Homepage Editorial
            </span>
          </div>
          <p className="text-xs text-content-muted mt-0.5">
            Curate the featured products showcased in the luxury dark green editorial banner on the homepage. Storefront strictly renders your chosen list.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-btn bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover disabled:opacity-50 shadow-subtle transition-all self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving to Database...' : 'Save Section'}</span>
        </button>
      </div>

      {/* Main Configuration Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-card p-5 border border-border-subtle shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <h2 className="font-serif font-bold text-sm text-content-primary">
              Section Settings &amp; Visibility
            </h2>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs font-semibold text-content-secondary">
                {isVisible ? 'Section Enabled' : 'Section Hidden'}
              </span>
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-content-primary block mb-1">
                Eyebrow Badge Text *
              </label>
              <input
                type="text"
                required
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. Handpicked For You"
                className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
              />
              <p className="text-[11px] text-content-muted mt-1">Small gold uppercase header tag.</p>
            </div>

            <div>
              <label className="font-bold text-content-primary block mb-1">
                Main Headline *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Traditional Sweets & Specialties"
                className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs font-serif font-bold"
              />
              <p className="text-[11px] text-content-muted mt-1">Editorial section headline.</p>
            </div>

            <div>
              <label className="font-bold text-content-primary block mb-1">
                Section Subtitle
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Slow-cooked authentic delicacies..."
                className="w-full px-3 py-2 border border-border-subtle rounded-input text-xs"
              />
              <p className="text-[11px] text-content-muted mt-1">Short descriptive story subtitle.</p>
            </div>
          </div>
        </div>

        {/* Selected Products Grid & Ordering */}
        <div className="bg-white rounded-card p-5 border border-border-subtle shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <h2 className="font-serif font-bold text-sm text-content-primary">
                Selected Products ({selectedProducts.length})
              </h2>
              <p className="text-[11px] text-content-muted">
                These products will appear on the homepage in the exact order shown. (Recommended: 4 products).
              </p>
            </div>
            {selectedProducts.length === 0 && (
              <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                Section is currently hidden (0 products selected)
              </span>
            )}
          </div>

          {selectedProducts.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-border-subtle rounded-xl space-y-2">
              <Package className="w-8 h-8 mx-auto text-content-muted" />
              <p className="text-xs font-semibold text-content-secondary">
                No products currently selected for this section.
              </p>
              <p className="text-[11px] text-content-muted">
                Browse the catalog below and click "+ Add to Handpicked" to curate your collection.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {selectedProducts.map((prod, idx) => (
                <div
                  key={prod.id}
                  className="p-3 border border-border-subtle rounded-xl bg-canvas-subtle/50 flex flex-col justify-between space-y-3 relative group hover:border-brand-primary transition-all"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={prod.images?.[0]?.imageUrl || '/assets/prod-banana-chips-hero.png'}
                      alt={prod.name}
                      className="w-14 h-14 rounded-lg object-cover bg-white border border-border-subtle shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <p className="text-xs font-bold text-content-primary truncate mt-0.5" title={prod.name}>
                        {prod.name}
                      </p>
                      <p className="text-[10px] text-content-muted capitalize truncate">
                        {prod.categorySlug}
                      </p>
                      <p className="text-[11px] font-semibold text-brand-primary mt-1">
                        ₹{prod.variants?.[0]?.sellingPrice || 0}
                      </p>
                    </div>
                  </div>

                  {/* Ordering and Remove Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle/70">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        title="Move Left/Up"
                        className="p-1 rounded text-content-muted hover:text-content-primary hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === selectedProducts.length - 1}
                        title="Move Right/Down"
                        className="p-1 rounded text-content-muted hover:text-content-primary hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(prod.id)}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded text-xs flex items-center gap-1"
                      title="Remove from handpicked section"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-semibold">Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Editorial Storefront Preview */}
        <div className="bg-[#072C20] rounded-2xl p-6 text-white space-y-4 shadow-elevated">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4B574]">
              {badge || 'Handpicked For You'}
            </span>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/70">
              Live Storefront Preview
            </span>
          </div>

          <div>
            <h3 className="font-serif font-bold text-xl text-white">
              {title || 'Traditional Sweets & Specialties'}
            </h3>
            <p className="text-xs text-white/60 mt-0.5">
              {subtitle || 'Slow-cooked authentic delicacies, regional staples & specialty treats'}
            </p>
          </div>

          {selectedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {selectedProducts.map((p) => (
                <div key={p.id} className="bg-white/10 p-2.5 rounded-xl border border-white/10 text-center space-y-1.5">
                  <img
                    src={p.images?.[0]?.imageUrl || '/assets/prod-banana-chips-hero.png'}
                    alt={p.name}
                    className="w-full h-24 object-cover rounded-lg bg-black/20"
                  />
                  <p className="text-xs font-bold text-white truncate">{p.name}</p>
                  <p className="text-[11px] font-semibold text-[#D4B574]">
                    ₹{p.variants?.[0]?.sellingPrice || 0}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/50 italic py-4 text-center">
              Section will be hidden on storefront until at least 1 product is selected.
            </p>
          )}
        </div>

        {/* Catalog Product Picker */}
        <div className="bg-white rounded-card p-5 border border-border-subtle shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
            <div>
              <h2 className="font-serif font-bold text-sm text-content-primary">
                Add Products from Catalog
              </h2>
              <p className="text-[11px] text-content-muted">
                Search published catalog items to include in the Handpicked For You section.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-content-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search catalog..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 text-xs rounded-input border border-border-subtle"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-input border border-border-subtle text-content-primary bg-white"
              >
                <option value="all">All Categories</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1">
            {availableProducts.map((p) => (
              <div
                key={p.id}
                className="p-3 border border-border-subtle rounded-xl bg-canvas flex items-center justify-between gap-2 hover:bg-canvas-subtle/70 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={p.images?.[0]?.imageUrl || '/assets/prod-banana-chips-hero.png'}
                    alt={p.name}
                    className="w-10 h-10 rounded-lg object-cover bg-white border border-border-subtle shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-content-primary truncate" title={p.name}>
                      {p.name}
                    </p>
                    <p className="text-[10px] text-content-muted capitalize truncate">
                      {p.categorySlug} • ₹{p.variants?.[0]?.sellingPrice || 0}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  data-testid={`add-handpicked-${p.id}`}
                  onClick={() => handleAddProduct(p.id)}
                  className="px-2.5 py-1 rounded bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            ))}

            {availableProducts.length === 0 && (
              <div className="col-span-full text-center py-6 text-xs text-content-muted">
                No matching available products found in catalog.
              </div>
            )}
          </div>
        </div>

        {/* Footer Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-btn bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary-hover disabled:opacity-50 shadow-subtle flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Handpicked Section'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
