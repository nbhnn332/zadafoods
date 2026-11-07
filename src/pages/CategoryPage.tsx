import React, { useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowUpDown, Check, X, Sparkles, AlertCircle } from 'lucide-react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Footer } from '../components/Footer';
import { ProductCard } from '../components/ProductCard';
import { INITIAL_CATEGORIES } from '../data/mockData';
import { useAdminData } from '../context/AdminDataContext';

type SortOption = 'featured' | 'price-low' | 'price-high' | 'rating';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { products, categories, categoryBanners } = useAdminData();

  const activeCategories = categories && categories.length > 0 ? categories : INITIAL_CATEGORIES;
  const currentCategory = activeCategories.find((c) => c.slug === (slug || 'chips')) || activeCategories[0];

  // Dynamic Category Banner matching current category
  const categoryBanner = useMemo(() => {
    return categoryBanners.find(
      (b) =>
        (b.categorySlug === currentCategory.slug || b.categoryId === currentCategory.id) &&
        b.isActive
    );
  }, [categoryBanners, currentCategory]);

  const bannerTitle = categoryBanner?.title || currentCategory.name;
  const bannerSubtitle = categoryBanner?.subtitle || currentCategory.description || 'Authentic Kerala delicacies crafted with farm-fresh ingredients.';
  const bannerEyebrow = categoryBanner?.eyebrow || "KERALA'S FAVOURITE SELECTION";
  const bannerBgColor = categoryBanner?.backgroundColor || '#072C20';
  const bannerTextColor = categoryBanner?.textColor || '#FFFFFF';
  const bannerImageUrl = categoryBanner?.imageUrl || '';
  
  // State for interactive catalogue toolbar
  const [activeSubcategory, setActiveSubcategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [onOfferOnly, setOnOfferOnly] = useState<boolean>(false);

  // Reset active subcategory when route slug changes
  React.useEffect(() => {
    setActiveSubcategory('all');
  }, [slug]);

  const query = searchParams.get('q')?.toLowerCase() || '';

  // Dynamic Subcategory pills fetched from authoritative store state
  const subcategoryPills = useMemo(() => {
    const rawSubs = (currentCategory.subcategories || [])
      .filter((s) => s.isActive !== false && s.slug !== 'all')
      .sort((a, b) => a.displayOrder - b.displayOrder);

    if (rawSubs.length === 0) {
      return [];
    }

    return [
      { id: 'all', label: 'All', subcategoryId: 'all' },
      ...rawSubs.map((s) => ({
        id: s.slug,
        label: s.name,
        subcategoryId: s.id
      }))
    ];
  }, [currentCategory]);

  // Filter & sort logic
  const displayedProducts = useMemo(() => {
    let list = products.filter((p) => {
      if (!p.isPublished) return false;

      // Category matching
      const matchesCategory = p.categorySlug === currentCategory.slug || p.categoryId === currentCategory.id;
      if (!matchesCategory && !query) return false;

      // Search query filter
      if (query) {
        const matchesQuery =
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.categorySlug.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // Dynamic subcategory filter
      if (activeSubcategory !== 'all') {
        const targetSub = subcategoryPills.find((s) => s.id === activeSubcategory);
        if (targetSub) {
          const matchesSubId = p.subcategoryId === targetSub.subcategoryId;
          const matchesSubSlug =
            p.subcategoryId === targetSub.id ||
            p.slug.toLowerCase().includes(targetSub.id) ||
            p.name.toLowerCase().includes(targetSub.label.toLowerCase());
          if (!matchesSubId && !matchesSubSlug) return false;
        }
      }

      // In Stock filter
      if (inStockOnly) {
        const hasStock = p.variants.some((v) => v.stockQuantity > 0);
        if (!hasStock) return false;
      }

      // On Offer filter
      if (onOfferOnly) {
        if (!p.isOnOffer) return false;
      }

      return true;
    });

    // Sort order using default variant price shown on the card
    const getDefaultPrice = (p: typeof list[0]) => (p.variants.find(v => v.isDefault) || p.variants[0]).sellingPrice;

    if (sortBy === 'price-low') {
      list.sort((a, b) => getDefaultPrice(a) - getDefaultPrice(b));
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => getDefaultPrice(b) - getDefaultPrice(a));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.averageRating - a.averageRating);
    } else if (sortBy === 'featured') {
      list.sort((a, b) => {
        if (a.isBestseller && !b.isBestseller) return -1;
        if (!a.isBestseller && b.isBestseller) return 1;
        return 0;
      });
    }

    return list;
  }, [products, currentCategory, query, activeSubcategory, subcategoryPills, inStockOnly, onOfferOnly, sortBy]);

  // Active filters count
  const hasActiveFilters = activeSubcategory !== 'all' || inStockOnly || onOfferOnly || Boolean(query);

  const handleClearAllFilters = () => {
    setActiveSubcategory('all');
    setInStockOnly(false);
    setOnOfferOnly(false);
    setSortBy('featured');
    if (query) {
      searchParams.delete('q');
      setSearchParams(searchParams);
    }
  };

  const clearSearch = () => {
    searchParams.delete('q');
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-canvas pb-24 md:pb-16 text-content-primary">
      {/* Header with authentic mobile header matching Screen 2 and desktop header */}
      <Header
        title={currentCategory.name}
        subtitle={`${displayedProducts.length} ${displayedProducts.length === 1 ? 'product' : 'products'}`}
        showBack={true}
        showSearch={true}
      />

      <main className="max-w-6xl mx-auto px-4 pt-3 space-y-4">
        {/* Category Navigation Bar: Obvious active states for cross-category discovery */}
        <section className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 scroll-smooth" aria-label="Category navigation">
          {activeCategories.map((cat) => {
            const isCurrent = cat.slug === currentCategory.slug;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveSubcategory('all');
                  navigate(`/category/${cat.slug}`);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                  isCurrent
                    ? 'bg-[#07382A] text-white shadow-xs border border-[#07382A]'
                    : 'bg-white text-content-primary border border-[#EAE5DC] hover:bg-[#F9F7F3] hover:border-brand-primary/40'
                }`}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {cat.name}
              </button>
            );
          })}
        </section>

        {/* Dynamic Category Hero Banner: CSS-first styling, zero-image default, responsive */}
        <section
          style={{
            backgroundColor: bannerBgColor,
            color: bannerTextColor
          }}
          className="relative rounded-2xl overflow-hidden shadow-sm h-44 sm:h-52 md:h-56 max-h-[240px] flex items-center transition-colors"
        >
          {/* Optional genuine background image if provided */}
          {bannerImageUrl ? (
            <img
              src={bannerImageUrl}
              alt={`${bannerTitle} - Authentic Kerala Delicacies`}
              className="absolute inset-0 w-full h-full object-cover object-right sm:object-center opacity-65 transition-opacity"
              loading="eager"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : null}

          {/* Controlled Gradient Overlay guaranteeing 100% text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent pointer-events-none" />

          {/* Subtle CSS Decorative Shape / Pattern Accent (Zero Images) */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />

          {/* Content Container */}
          <div className="relative z-10 px-5 sm:px-8 py-4 sm:py-6 max-w-xl">
            {bannerEyebrow && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-[#FAD982] text-[10px] sm:text-xs font-extrabold uppercase tracking-widest mb-1.5 shadow-2xs">
                <Sparkles className="w-3 h-3 text-[#FAD982]" />
                {bannerEyebrow}
              </span>
            )}
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight" style={{ color: bannerTextColor }}>
              {bannerTitle}
            </h1>
            <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm line-clamp-2 max-w-md font-sans opacity-90" style={{ color: bannerTextColor }}>
              {bannerSubtitle}
            </p>
          </div>
        </section>

        {/* Subcategory Filter Pills (when category has subcategories) */}
        {subcategoryPills.length > 1 && (
          <section className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 scroll-smooth" aria-label="Subcategory filters">
            {subcategoryPills.map((pill) => {
              const isActive = activeSubcategory === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setActiveSubcategory(pill.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                    isActive
                      ? 'bg-[#A67732] text-white shadow-xs font-bold border border-[#A67732]'
                      : 'bg-white text-content-primary border border-[#EAE5DC] hover:bg-[#F9F7F3] hover:border-brand-primary/40'
                  }`}
                  aria-pressed={isActive}
                >
                  {pill.label}
                </button>
              );
            })}
          </section>
        )}

        {/* Upgraded Catalogue Toolbar: Real-time Count, Sort Control, In Stock & On Offer Filters */}
        <section className="bg-white border border-[#EAE5DC] rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          {/* Result Count */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1C1917]">
            <span className="font-bold text-sm text-[#07382A]">{displayedProducts.length}</span>
            <span className="text-content-secondary">
              {displayedProducts.length === 1 ? 'Product available' : 'Products available'}
            </span>
          </div>

          {/* Controls: In Stock, On Offer & Sort Dropdown */}
          <div className="flex items-center flex-wrap gap-2">
            {/* In Stock Toggle */}
            <button
              type="button"
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                inStockOnly
                  ? 'bg-[#07382A] text-white border-[#07382A] shadow-xs'
                  : 'bg-white text-content-secondary border-[#EAE5DC] hover:bg-[#F9F7F3]'
              }`}
              aria-pressed={inStockOnly}
            >
              {inStockOnly && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              <span>In Stock</span>
            </button>

            {/* On Offer Toggle */}
            <button
              type="button"
              onClick={() => setOnOfferOnly(!onOfferOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                onOfferOnly
                  ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-xs'
                  : 'bg-white text-content-secondary border-[#EAE5DC] hover:bg-[#F9F7F3]'
              }`}
              aria-pressed={onOfferOnly}
            >
              {onOfferOnly && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              <span>On Offer</span>
            </button>

            {/* Sort Dropdown */}
            <div className="relative flex items-center">
              <label htmlFor="shop-sort-select" className="sr-only">
                Sort products by
              </label>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#EAE5DC] text-xs font-semibold text-[#1C1917] hover:border-brand-primary transition-colors cursor-pointer shadow-2xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#71717A] pointer-events-none" />
                <select
                  id="shop-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent border-none text-xs font-semibold text-[#1C1917] focus:outline-none cursor-pointer pr-1"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Active Filter Chips with One-Tap Dismiss and Clear All */}
        {hasActiveFilters && (
          <section className="flex items-center flex-wrap gap-2 pt-0.5">
            <span className="text-xs font-medium text-content-muted">Active Filters:</span>

            {query && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF6EE] border border-[#EAE5DC] text-xs font-medium text-[#1C1917]">
                Search: "{query}"
                <button
                  onClick={clearSearch}
                  className="p-0.5 hover:text-rose-600 transition-colors"
                  aria-label="Remove search filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {activeSubcategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF6EE] border border-[#EAE5DC] text-xs font-medium text-[#1C1917]">
                Subcategory: {subcategoryPills.find(s => s.id === activeSubcategory)?.label}
                <button
                  onClick={() => setActiveSubcategory('all')}
                  className="p-0.5 hover:text-rose-600 transition-colors"
                  aria-label="Remove subcategory filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {inStockOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF6EE] border border-[#EAE5DC] text-xs font-medium text-[#1C1917]">
                In Stock Only
                <button
                  onClick={() => setInStockOnly(false)}
                  className="p-0.5 hover:text-rose-600 transition-colors"
                  aria-label="Remove In Stock filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {onOfferOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF6EE] border border-[#EAE5DC] text-xs font-medium text-[#1C1917]">
                On Offer Only
                <button
                  onClick={() => setOnOfferOnly(false)}
                  className="p-0.5 hover:text-rose-600 transition-colors"
                  aria-label="Remove On Offer filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleClearAllFilters}
              className="text-xs font-bold text-[#A67732] hover:text-[#8F6428] underline underline-offset-2 ml-1 cursor-pointer transition-colors"
            >
              Clear All
            </button>
          </section>
        )}

        {/* Responsive Product Grid: 4-col desktop, 2/3-col tablet, 2-col mobile */}
        {displayedProducts.length > 0 ? (
          <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 items-stretch pt-1">
            {displayedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} compactButton={false} />
            ))}
          </section>
        ) : (
          /* High-Empathy Empty State */
          <section className="bg-white rounded-2xl border border-[#EAE5DC] p-8 text-center my-6 max-w-md mx-auto shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#FAF6EE] flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-[#A67732]" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1C1917]">
              {activeSubcategory !== 'all'
                ? `No products found in ${subcategoryPills.find((s) => s.id === activeSubcategory)?.label || 'this subcategory'}`
                : 'No products found'}
            </h3>
            <p className="text-xs text-content-secondary mt-1 max-w-xs mx-auto">
              {activeSubcategory !== 'all'
                ? `There are currently no products under this subcategory. Try viewing all ${currentCategory.name} products.`
                : "We couldn't find any items matching your active filter criteria. Try adjusting or clearing your filters."}
            </p>
            <button
              onClick={handleClearAllFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-[#07382A] text-white text-xs font-bold hover:bg-[#072C20] transition-colors shadow-xs"
            >
              Clear All Filters
            </button>
          </section>
        )}
      </main>

      <Footer />

      <BottomNav />
    </div>
  );
};