import React, { useState } from 'react';
import { Plus, Trash2, Edit2, X, Package, Sparkles, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { ImageUploadPreview } from '../../components/ImageUploadPreview';
import { useAdminData } from '../../context/AdminDataContext';
import { ComboBundle, ComboBundleItem } from '../../types';

export const AdminCombos: React.FC = () => {
  const {
    combos,
    products,
    addCombo,
    updateCombo,
    deleteCombo,
    toggleComboActive,
    featuredCombosSection,
    updateFeaturedCombosSection
  } = useAdminData();

  const [merchVisible, setMerchVisible] = useState(featuredCombosSection?.isVisible === true);
  const [merchTitle, setMerchTitle] = useState(featuredCombosSection?.title || 'Signature Kerala Combos');
  const [merchSubtitle, setMerchSubtitle] = useState(
    featuredCombosSection?.subtitle || 'Authentic Kerala pairings crafted together for festive gifting and everyday indulgence'
  );
  const [merchEyebrow, setMerchEyebrow] = useState(
    featuredCombosSection?.eyebrow || 'Curated Gift Bundles & Value Packs'
  );
  const [merchSelectedIds, setMerchSelectedIds] = useState<string[]>(featuredCombosSection?.comboIds || []);
  const [isSavingMerch, setIsSavingMerch] = useState(false);
  const [showMerchPanel, setShowMerchPanel] = useState(false);

  React.useEffect(() => {
    if (featuredCombosSection) {
      setMerchVisible(featuredCombosSection.isVisible === true);
      setMerchTitle(featuredCombosSection.title || 'Signature Kerala Combos');
      setMerchSubtitle(
        featuredCombosSection.subtitle || 'Authentic Kerala pairings crafted together for festive gifting and everyday indulgence'
      );
      setMerchEyebrow(featuredCombosSection.eyebrow || 'Curated Gift Bundles & Value Packs');
      setMerchSelectedIds(featuredCombosSection.comboIds || []);
    }
  }, [featuredCombosSection]);

  const handleSaveMerchandising = async () => {
    setIsSavingMerch(true);
    try {
      await updateFeaturedCombosSection({
        id: 'h0000000-0000-0000-0000-000000000005',
        isVisible: merchVisible,
        title: merchTitle.trim(),
        subtitle: merchSubtitle.trim(),
        eyebrow: merchEyebrow.trim(),
        comboIds: merchSelectedIds,
        maxCombos: 6
      });
    } finally {
      setIsSavingMerch(false);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboBundle | null>(null);
  const [showHelpGuide, setShowHelpGuide] = useState(true);

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
    setImageUrl('');
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
      {/* How Combo Builder Works Help Section */}
      <div className="bg-white rounded-card border border-[#EAE5DC] overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setShowHelpGuide((prev) => !prev)}
          className="w-full px-4 py-3 bg-[#FAF6EE] hover:bg-[#F5EEDD] flex items-center justify-between text-left transition-colors border-b border-[#EAE5DC]"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#072C20] text-amber-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#1C1917] flex items-center gap-1.5">
                <span>How Combo Builder Works</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
                  Store Administrator Guide
                </span>
              </h2>
              <p className="text-[11px] text-[#71717A]">
                Understand combo creation, automated savings math, variant selection, and checkout validation.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#072C20]">
            <span>{showHelpGuide ? 'Hide Guide' : 'Read Guide'}</span>
            {showHelpGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showHelpGuide && (
          <div className="p-5 space-y-5 text-xs text-[#2D2D2D] bg-white leading-relaxed">
            {/* Practical Example Box */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2.5">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-800 shrink-0" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-amber-950">
                  Practical Pricing &amp; Savings Example
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-center pt-1 font-mono text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-amber-200 shadow-2xs">
                  <span className="text-[10px] text-content-muted block font-sans">Product A</span>
                  <span className="font-bold text-content-primary">₹200</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-amber-200 shadow-2xs">
                  <span className="text-[10px] text-content-muted block font-sans">Product B</span>
                  <span className="font-bold text-content-primary">₹150</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-amber-200 shadow-2xs">
                  <span className="text-[10px] text-content-muted block font-sans">Product C</span>
                  <span className="font-bold text-content-primary">₹100</span>
                </div>
                <div className="p-2.5 bg-[#FAF6EE] rounded-lg border border-amber-300 shadow-2xs">
                  <span className="text-[10px] text-amber-800 block font-sans">Normal Combined</span>
                  <span className="font-bold text-[#072C20]">₹450</span>
                </div>
                <div className="p-2.5 bg-[#072C20] text-white rounded-lg border border-[#072C20] shadow-2xs">
                  <span className="text-[10px] text-amber-300 block font-sans">Admin Combo Price</span>
                  <span className="font-bold text-amber-300">₹399 (Save ₹51)</span>
                </div>
              </div>
              <p className="text-[11px] text-amber-900">
                Formula: Savings = Component Total (₹450) − Combo Price (₹399) = <strong>₹51 (11% OFF)</strong>.
                The system automatically displays this gold savings badge on both storefront cards and checkout.
              </p>
            </div>

            {/* Step-by-Step Workflow A through K */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#072C20] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">A</span>
                  <div>
                    <h4 className="font-bold text-content-primary text-xs">Creating a Combo</h4>
                    <p className="text-[11px] text-content-secondary">Click "+ Build New Combo" to open the combo configuration modal.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#072C20] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">B</span>
                  <div>
                    <h4 className="font-bold text-content-primary text-xs">Selecting Products</h4>
                    <p className="text-[11px] text-content-secondary">Pick any snacks or spices from your catalog (e.g. Banana Chips, Tapioca Wafers, Halwa).</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#072C20] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">C</span>
                  <div>
                    <h4 className="font-bold text-content-primary text-xs">Selecting Variants &amp; Pack Sizes</h4>
                    <p className="text-[11px] text-content-secondary">Choose the exact weight/pack (e.g. 250g, 500g, or 1kg pouch) for each item in the bundle.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#072C20] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">D</span>
                  <div>
                    <h4 className="font-bold text-content-primary text-xs">Setting Quantities</h4>
                    <p className="text-[11px] text-content-secondary">Configure how many units of each product are included in a single combo box.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#072C20] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">E</span>
                  <div>
                    <h4 className="font-bold text-content-primary text-xs">Setting Combo Price</h4>
                    <p className="text-[11px] text-content-secondary">Enter your special bundle price (e.g. ₹399) lower than the normal combined component sum.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#072C20] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">F</span>
                  <div>
                    <h4 className="font-bold text-content-primary text-xs">Automatic Savings Calculation</h4>
                    <p className="text-[11px] text-content-secondary">The system automatically calculates the discount percentage and currency savings in real-time.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#072C20] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">G</span>
                  <div>
                    <h4 className="font-bold text-content-primary text-xs">Setting Stock &amp; Availability Rules</h4>
                    <p className="text-[11px] text-content-secondary">Combo availability dynamically respects the underlying inventory of every individual component variant.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#072C20] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">H</span>
                  <div>
                    <h4 className="font-bold text-content-primary text-xs">Publishing &amp; Unpublishing</h4>
                    <p className="text-[11px] text-content-secondary">Toggle active status at any time to instantly feature or remove the bundle from the storefront.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#072C20] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">I</span>
                  <div>
                    <h4 className="font-bold text-content-primary text-xs">How Customers See the Combo</h4>
                    <p className="text-[11px] text-content-secondary">Customers view the combo card with included items, strike-through original price, and savings badge.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#072C20] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">J</span>
                  <div>
                    <h4 className="font-bold text-content-primary text-xs">How Customers Add to Cart</h4>
                    <p className="text-[11px] text-content-secondary">1-click Add to Cart bundles all components under the promotional combo price.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#072C20] text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">K</span>
                  <div>
                    <h4 className="font-bold text-content-primary text-xs">Checkout Validation</h4>
                    <p className="text-[11px] text-content-secondary">Authoritative server-side pricing engine verifies prices and deducts component inventory accurately.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Homepage Merchandising & Visibility Controls (Default strictly OFF) */}
      <div className="bg-white rounded-xl border border-border shadow-xs overflow-hidden">
        <div
          onClick={() => setShowMerchPanel(!showMerchPanel)}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-canvas-subtle transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${merchVisible ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-sm text-content-primary">
                  Homepage Combos Merchandising
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  merchVisible ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                }`}>
                  {merchVisible ? 'LIVE ON HOMEPAGE' : 'HOMEPAGE VISIBILITY OFF'}
                </span>
              </div>
              <p className="text-xs text-content-secondary mt-0.5">
                {merchVisible
                  ? `Featured on homepage (${merchSelectedIds.length} combos selected). Accessible at /combos and on homepage.`
                  : 'Section is hidden from homepage. Accessible exclusively via the dedicated /combos catalogue route.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-brand-primary">
              {showMerchPanel ? 'Hide Controls' : 'Configure Merchandising'}
            </span>
            {showMerchPanel ? <ChevronUp className="w-4 h-4 text-brand-primary" /> : <ChevronDown className="w-4 h-4 text-brand-primary" />}
          </div>
        </div>

        {showMerchPanel && (
          <div className="p-4 border-t border-border bg-[#FAF9F6]/50 space-y-4">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-border">
              <div>
                <label className="text-xs font-bold text-content-primary block cursor-pointer">
                  Feature Combos Section on Homepage
                </label>
                <span className="text-[11px] text-content-secondary block">
                  When toggled OFF (default), the combos section is completely omitted from the landing page.
                </span>
              </div>
              <input
                type="checkbox"
                checked={merchVisible}
                onChange={(e) => setMerchVisible(e.target.checked)}
                className="rounded text-brand-primary focus:ring-brand-primary w-5 h-5 cursor-pointer"
              />
            </div>

            {merchVisible && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-content-primary mb-1">
                      Section Eyebrow
                    </label>
                    <input
                      type="text"
                      value={merchEyebrow}
                      onChange={(e) => setMerchEyebrow(e.target.value)}
                      placeholder="e.g. Curated Gift Bundles & Value Packs"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-white focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-content-primary mb-1">
                      Section Heading
                    </label>
                    <input
                      type="text"
                      value={merchTitle}
                      onChange={(e) => setMerchTitle(e.target.value)}
                      placeholder="e.g. Signature Kerala Combos"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-white focus:outline-none focus:border-brand-primary font-serif font-bold text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-content-primary mb-1">
                    Section Subtitle
                  </label>
                  <input
                    type="text"
                    value={merchSubtitle}
                    onChange={(e) => setMerchSubtitle(e.target.value)}
                    placeholder="e.g. Authentic Kerala pairings crafted together for festive gifting..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-white focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-content-primary mb-1.5 uppercase tracking-wider">
                    Select Combos to Feature on Homepage (Max 6)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {combos.map((cb) => {
                      const isSelected = merchSelectedIds.includes(cb.id);
                      return (
                        <label
                          key={cb.id}
                          className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-amber-50 border-[#A67732] text-content-primary font-semibold'
                              : 'bg-white border-border text-content-secondary hover:bg-canvas'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMerchSelectedIds([...merchSelectedIds, cb.id]);
                              } else {
                                setMerchSelectedIds(merchSelectedIds.filter((id) => id !== cb.id));
                              }
                            }}
                            className="rounded text-brand-primary focus:ring-brand-primary w-4 h-4"
                          />
                          <div className="truncate flex-1">
                            <span className="text-xs block truncate">{cb.name}</span>
                            <span className="text-[10px] text-content-muted">₹{cb.comboPrice}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                type="button"
                onClick={handleSaveMerchandising}
                disabled={isSavingMerch}
                className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary-hover active:scale-[0.98] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                {isSavingMerch ? 'Saving...' : 'Save Merchandising Settings'}
              </button>
            </div>
          </div>
        )}
      </div>

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

              <ImageUploadPreview
                label="Combo Hamper Image"
                value={imageUrl}
                onChange={(url) => setImageUrl(url)}
                aspectRatio="16:9"
                placeholder="https://... or upload local image file"
                helpText="Widescreen or card banner showcasing the bundled snack pack."
              />

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
