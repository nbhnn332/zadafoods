import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star,
  ShoppingCart,
  Minus,
  Plus,
  Leaf,
  ChevronDown,
  ChevronUp,
  Zap,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ProductVariant } from '../types';
import { useCart } from '../context/CartContext';
import { useAdminData } from '../context/AdminDataContext';
import { useToast } from '../context/ToastContext';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { products, reviews, addReview } = useAdminData();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const product = products.find((p) => p.slug === slug);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product?.variants?.find((v) => v.weightValue === 250) ||
    product?.variants?.find((v) => v.isDefault) ||
    product?.variants?.[0] || {
      id: 'var-default',
      productId: product?.id || 'prod-1',
      sku: 'ZDF-DEF',
      weightValue: 250,
      weightUnit: 'g',
      weightLabel: '250 g',
      sellingPrice: 180,
      mrp: 220,
      discountPercentage: 18,
      stockQuantity: 100,
      lowStockThreshold: 10,
      isDefault: true
    }
  );

  useEffect(() => {
    if (product?.variants?.length) {
      const v250 = product.variants.find((v) => v.weightValue === 250);
      const def = product.variants.find((v) => v.isDefault);
      setSelectedVariant(v250 || def || product.variants[0]);
    }
  }, [product]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(typeof window !== 'undefined' && window.innerWidth > 0 && window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Dynamic gallery images derived authoritatively from product data and approved assets
  const isBananaChips = Boolean(product?.slug?.includes('banana-chips'));
  const isCashewHalwa = Boolean(product?.slug?.includes('cashew-halwa'));

  const galleryImages = useMemo(() => {
    if (isBananaChips) {
      return [
        { id: 'pdp-1', imageUrl: '/assets/prod-banana-chips-hero.png', thumbUrl: '/assets/pdp-thumb-1.png', altText: 'Crisp Nendran banana chips in a traditional bowl' },
        { id: 'pdp-2', imageUrl: '/assets/pdp-thumb-2.png', thumbUrl: '/assets/pdp-thumb-2.png', altText: 'Fresh banana chips bowl' },
        { id: 'pdp-3', imageUrl: '/assets/pdp-thumb-3.png', thumbUrl: '/assets/pdp-thumb-3.png', altText: 'ZaDa Foods banana chips pouch packaging' },
        { id: 'pdp-4', imageUrl: '/assets/pdp-thumb-4.png', thumbUrl: '/assets/pdp-thumb-4.png', altText: 'Crispy wafer-thin chips' },
        { id: 'pdp-5', imageUrl: '/assets/pdp-thumb-5.png', thumbUrl: '/assets/pdp-thumb-5.png', altText: 'Raw green Nendran bananas with chips' },
      ];
    }
    if (isCashewHalwa) {
      return [
        { id: 'ch-1', imageUrl: '/assets/prod-cashew-halwa.png', thumbUrl: '/assets/prod-cashew-halwa.png', altText: 'Authentic Kozhikode Cashew Halwa' },
        { id: 'ch-2', imageUrl: '/assets/cart-cashew-halwa.png', thumbUrl: '/assets/cart-cashew-halwa.png', altText: 'Cashew Halwa sliced with whole dry fruits' },
        { id: 'ch-3', imageUrl: '/assets/cat-halwa.png', thumbUrl: '/assets/cat-halwa.png', altText: 'Heritage Pure Ghee Halwa' },
      ];
    }
    if (product?.images && product.images.length > 0) {
      return product.images.map((img, i) => ({
        id: img.id || `img-${i}`,
        imageUrl: img.imageUrl,
        thumbUrl: img.imageUrl,
        altText: img.altText || product.name
      }));
    }
    // Clean fallback matching product's category, never mismatching products
    return [
      { id: 'pdp-default', imageUrl: `/assets/cat-${product?.categorySlug || 'chips'}.png`, thumbUrl: `/assets/cat-${product?.categorySlug || 'chips'}.png`, altText: product?.name || 'Product' }
    ];
  }, [product?.slug, isBananaChips, isCashewHalwa, product?.images, product?.name, product?.categorySlug]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product?.id]);

  const currentHeroImage = galleryImages[activeImageIndex]?.imageUrl || galleryImages[0]?.imageUrl;

  // Accordion toggle states - closed by default matching Screen 3 reference
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  // Inline Review Form State
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewerName, setReviewerName] = useState('Numan Sidique');
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newFeedback, setNewFeedback] = useState('');

  const handleInlineReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !newFeedback.trim()) return;

    addReview({
      productId: product.id,
      reviewerName,
      rating: newRating,
      reviewTitle: newTitle,
      reviewText: newFeedback,
      isVerifiedPurchase: true
    });

    setIsReviewFormOpen(false);
    setNewTitle('');
    setNewFeedback('');
    showToast('Review Submitted', 'Thank you for your feedback! It will appear after moderation.', 'success');
  };

  const toggleAccordion = (name: string) => {
    setOpenAccordion(openAccordion === name ? null : name);
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (selectedVariant.stockQuantity <= 0) {
      showToast('Out of Stock', 'This pack size is currently unavailable.', 'error');
      return;
    }
    addToCart(product, selectedVariant, quantity);
    showToast('Added to Cart', `${quantity} × ${product.name} (${selectedVariant.weightLabel}) added to your cart.`, 'success');
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (selectedVariant.stockQuantity <= 0) {
      showToast('Out of Stock', 'This pack size is currently unavailable.', 'error');
      return;
    }

    setIsBuyingNow(true);
    try {
      const buyNowItem = {
        productId: product.id,
        variantId: selectedVariant.id,
        productName: product.name,
        productSlug: product.slug,
        categorySlug: product.categorySlug,
        variantWeightLabel: selectedVariant.weightLabel,
        imageUrl: galleryImages[0]?.imageUrl || product.images?.[0]?.imageUrl || '',
        unitPrice: selectedVariant.sellingPrice,
        mrp: selectedVariant.mrp,
        quantity,
        isCodEligible: product.isCodEligible,
        availableStock: selectedVariant.stockQuantity
      };
      navigate('/checkout', { state: { buyNowItem } });
    } catch {
      setIsBuyingNow(false);
    }
  };

  const incrementQuantity = () => {
    setQuantity((q) => Math.min(q + 1, selectedVariant.stockQuantity));
  };

  const decrementQuantity = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-canvas text-content-primary">
        <Header showBack={true} showSearch={false} />
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-4 border border-amber-200">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-content-primary mb-2">Product Unavailable</h1>
          <p className="text-content-muted text-sm max-w-md mb-6">
            This product is no longer active, has been archived, or does not exist in our catalog.
          </p>
          <button
            onClick={() => navigate('/category/all')}
            className="px-6 py-2.5 bg-brand-primary text-white font-medium rounded-btn text-sm hover:bg-brand-primary-hover shadow-sm transition-colors"
          >
            Explore All Snacks
          </button>
        </div>
      </div>
    );
  }

  const productReviews = reviews.filter(
    (r) => r.productId === product.id && r.isApproved
  );
  const actualReviewCount = productReviews.length;
  const averageRating = actualReviewCount > 0
    ? Number((productReviews.reduce((sum, r) => sum + r.rating, 0) / actualReviewCount).toFixed(1))
    : null;

  // Authoritative dynamic price calculations
  const mrp = selectedVariant.mrp;
  const sellingPrice = selectedVariant.sellingPrice;
  const savings = mrp > sellingPrice ? mrp - sellingPrice : 0;
  const calculatedDiscount = mrp > 0 && savings > 0
    ? Math.round((savings / mrp) * 100)
    : (selectedVariant.discountPercentage || 0);

  return (
    <div className="min-h-screen bg-canvas pb-32 md:pb-16 text-content-primary">
      {/* Header: compact on mobile matching Screen 3; full navigation on desktop */}
      <Header
        showBack={true}
        showSearch={false}
        hideLogo={true}
        showWishlist={true}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 lg:pt-6">
        {/* Breadcrumb Navigation on Desktop */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 text-xs text-[#71717A] mb-4">
          <Link to="/" className="hover:text-[#A67732] transition-colors">Home</Link>
          <span>/</span>
          <Link to={`/category/${product.categorySlug || 'chips'}`} className="hover:text-[#A67732] transition-colors capitalize">
            {product.categorySlug ? product.categorySlug.replace('-', ' ') : 'Snacks'}
          </Link>
          <span>/</span>
          <span className="text-[#1C1917] font-semibold truncate max-w-xs">Details: {product.name}</span>
        </nav>

        {/* Balanced Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-12 items-start">
          
          {/* Column 1: Image Gallery */}
          <section className="lg:col-span-6 space-y-3" aria-label="Product Gallery">
            {/* Main Hero Image */}
            <div className="relative rounded-2xl overflow-hidden bg-white border border-[#EAE5DC] shadow-xs aspect-[4/3] flex items-center justify-center">
              <img
                src={currentHeroImage}
                alt={product.name}
                className="w-full h-full object-cover transition-opacity duration-200"
              />
              {/* Pagination Counter Badge */}
              {galleryImages.length > 1 && (
                <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-xs font-semibold tracking-wide">
                  {activeImageIndex + 1}/{galleryImages.length}
                </span>
              )}
            </div>

            {/* Thumbnail Strip */}
            <div className="grid grid-cols-5 gap-2 sm:gap-2.5" role="tablist" aria-label="Product thumbnails">
              {galleryImages.map((img, idx) => {
                const isActive = activeImageIndex === idx;
                return (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIndex(idx)}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`View image ${idx + 1} of ${galleryImages.length}: ${img.altText}`}
                    className={`aspect-square rounded-xl overflow-hidden bg-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A67732] ${
                      isActive
                        ? 'border-2 border-[#A67732] ring-2 ring-[#A67732]/25 shadow-xs'
                        : 'border border-[#EAE5DC] opacity-75 hover:opacity-100 hover:border-[#A67732]/50'
                    }`}
                  >
                    <img
                      src={img.thumbUrl}
                      alt={img.altText}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </section>

          {/* Column 2: Product Information & Purchase Controls */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-5">
            {/* Header: Title, Category Badges & Rating */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FAF6EE] text-[#A67732] border border-[#A67732]/25">
                  Authentic Kerala {isCashewHalwa ? 'Halwa' : 'Specialty'}
                </span>
                {product.isBestseller && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Bestseller
                  </span>
                )}
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1C1917] tracking-tight leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-2 text-xs sm:text-sm">
                {actualReviewCount > 0 ? (
                  <>
                    <div className="flex items-center gap-1 text-[#F59E0B] font-bold">
                      <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                      <span className="text-[#1C1917] font-bold">{averageRating}</span>
                    </div>
                    <span className="text-[#D4D4D8]">•</span>
                    <button
                      type="button"
                      onClick={() => setOpenAccordion('reviews')}
                      className="text-[#71717A] hover:text-[#A67732] transition-colors underline-offset-2 hover:underline"
                    >
                      ({actualReviewCount} {actualReviewCount === 1 ? 'review' : 'reviews'})
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpenAccordion('reviews')}
                    className="text-[#71717A] hover:text-[#A67732] transition-colors underline-offset-2 hover:underline text-xs"
                  >
                    No reviews yet • Be the first to review
                  </button>
                )}
              </div>

              <p className="text-sm sm:text-base text-[#52525B] leading-relaxed pt-1">
                {product.description}
              </p>

              {/* Authoritative Pricing Display */}
              <div className="space-y-1 pt-2">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-bold text-[#1C1917]">
                    ₹{sellingPrice}
                  </span>
                  {savings > 0 && (
                    <>
                      <span className="text-base sm:text-lg text-[#9CA3AF] line-through font-medium">
                        ₹{mrp}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FFE4E6] text-[#E11D48] text-xs font-bold tracking-wide">
                        {calculatedDiscount}% OFF
                      </span>
                      <span className="text-xs font-semibold text-emerald-700">
                        Save ₹{savings}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-[#A1A1AA]">
                  Inclusive of all taxes • Free shipping across India on orders above ₹499
                </p>
              </div>
            </section>

            {/* Pack Size Variant Selector */}
            <section className="space-y-2 pt-1" aria-labelledby="pack-size-heading">
              <div className="flex items-center justify-between">
                <h2 id="pack-size-heading" className="text-xs sm:text-sm font-bold text-[#1C1917] uppercase tracking-wider">
                  Select Pack Size
                </h2>
                <span className="text-xs text-[#71717A]">
                  Selected: <strong className="text-[#1C1917]">{selectedVariant.weightLabel}</strong>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-3" role="radiogroup" aria-label="Pack sizes">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant.id === v.id;
                  const isOutOfStock = v.stockQuantity <= 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={isOutOfStock}
                      onClick={() => setSelectedVariant(v)}
                      className={`py-2 px-2.5 rounded-xl text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A67732] ${
                        isSelected
                          ? 'border-2 border-[#A67732] bg-[#FAF6EE] shadow-xs'
                          : 'border border-[#EAE5DC] bg-white hover:border-[#A67732]/40 hover:bg-[#FAF6EE]/30'
                      } ${isOutOfStock ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                    >
                      <p className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-[#1C1917]' : 'text-[#3F3F46]'}`}>
                        {v.weightLabel}
                      </p>
                      <p className={`text-xs font-semibold mt-0.5 ${isSelected ? 'text-[#A67732]' : 'text-[#71717A]'}`}>
                        ₹{v.sellingPrice}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Quantity Stepper & Stock Indicator */}
            <section className="flex items-center gap-4 sm:gap-6 pt-1" aria-label="Quantity and availability">
              {/* Stepper Controls */}
              <div className="inline-flex items-center border border-[#EAE5DC] rounded-xl bg-white shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1 || selectedVariant.stockQuantity <= 0}
                  className="w-11 h-11 flex items-center justify-center text-[#52525B] hover:bg-[#FAF6EE] hover:text-[#1C1917] active:bg-[#F0EBE0] transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A67732]"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4 stroke-[2.5]" />
                </button>
                <span className="w-10 sm:w-12 text-center font-bold text-sm sm:text-base text-[#1C1917]" aria-live="polite">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={incrementQuantity}
                  disabled={quantity >= selectedVariant.stockQuantity || selectedVariant.stockQuantity <= 0}
                  className="w-11 h-11 flex items-center justify-center text-[#52525B] hover:bg-[#FAF6EE] hover:text-[#1C1917] active:bg-[#F0EBE0] transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A67732]"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Authoritative Stock Status Badge */}
              {selectedVariant.stockQuantity > 0 ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span>In Stock</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  <span>Out of Stock</span>
                </div>
              )}
            </section>

            {/* Exactly Two Primary Purchase Actions: Add to Cart (Secondary) & Buy Now (Primary) */}
            <section className="pt-1" aria-label="Purchase Actions">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* 1. Add to Cart: secondary styling (white bg, gold border, gold text) */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={selectedVariant.stockQuantity <= 0}
                  className="h-11 sm:h-12 px-3 sm:px-4 rounded-xl bg-white border-2 border-[#A67732] text-[#A67732] hover:bg-[#FAF6EE] active:scale-[0.99] text-xs sm:text-sm md:text-base font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A67732]"
                >
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
                  <span>Add to Cart</span>
                </button>

                {/* 2. Buy Now: primary styling (solid gold bg, white text) */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isBuyingNow || selectedVariant.stockQuantity <= 0}
                  className="h-11 sm:h-12 px-3 sm:px-4 rounded-xl bg-[#A67732] hover:bg-[#8F6428] active:scale-[0.99] text-white text-xs sm:text-sm md:text-base font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A67732]"
                >
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2] fill-current" />
                  <span>{isBuyingNow ? 'Proceeding...' : 'Buy Now'}</span>
                </button>
              </div>
            </section>

            {/* Premium Trust & USP Strip */}
            <section className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-[#EAE5DC] py-2.5 my-1 border-y border-[#EAE5DC] text-center bg-white/50 rounded-xl" aria-label="Key Product Features">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#52525B] px-2">
                <Leaf className="w-4 h-4 text-[#A67732] shrink-0" />
                <span>{product.isPreservativeFree ? 'Zero Preservatives' : 'Freshly Prepared'}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#52525B] px-2">
                <svg className="w-4 h-4 text-[#A67732] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
                <span>{isCashewHalwa ? 'Pure Ghee Preparation' : (product.isCoconutOilMade ? 'Made with coconut oil' : 'Traditional Recipe')}</span>
              </div>
              <div className="hidden sm:flex items-center justify-center gap-2 text-xs font-semibold text-[#52525B] px-2">
                <ShieldCheck className="w-4 h-4 text-[#A67732] shrink-0" />
                <span>Airtight Fresh Pack</span>
              </div>
            </section>

            {/* Expandable Accordions: Ingredients, Nutrition, Reviews */}
            <section className="space-y-2 pt-1" aria-label="Detailed Product Information">
              {/* 1. Ingredients Accordion */}
              <div className="border border-[#EAE5DC] rounded-xl bg-white overflow-hidden shadow-xs transition-colors">
                <button
                  type="button"
                  onClick={() => toggleAccordion('ingredients')}
                  aria-expanded={openAccordion === 'ingredients'}
                  className="w-full py-3 px-4 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-[#1C1917] hover:bg-[#FAF6EE]/40 transition-colors"
                >
                  <span>Ingredients</span>
                  {openAccordion === 'ingredients' ? (
                    <ChevronUp className="w-4 h-4 text-[#71717A]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#71717A]" />
                  )}
                </button>
                {openAccordion === 'ingredients' && (
                  <div className="px-4 pb-3.5 text-xs sm:text-sm text-[#52525B] leading-relaxed border-t border-[#EAE5DC]/60 pt-2.5">
                    {product.ingredients || 'Fresh authentic ingredients prepared following heritage Kerala culinary standards.'}
                  </div>
                )}
              </div>

              {/* 2. Nutrition Information Accordion */}
              <div className="border border-[#EAE5DC] rounded-xl bg-white overflow-hidden shadow-xs transition-colors">
                <button
                  type="button"
                  onClick={() => toggleAccordion('nutrition')}
                  aria-expanded={openAccordion === 'nutrition'}
                  className="w-full py-3 px-4 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-[#1C1917] hover:bg-[#FAF6EE]/40 transition-colors"
                >
                  <span>Nutrition Information</span>
                  {openAccordion === 'nutrition' ? (
                    <ChevronUp className="w-4 h-4 text-[#71717A]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#71717A]" />
                  )}
                </button>
                {openAccordion === 'nutrition' && (
                  <div className="px-4 pb-3.5 space-y-2.5 border-t border-[#EAE5DC]/60 pt-2.5">
                    {product.nutritionFacts ? (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="p-2.5 bg-[#FAF6EE]/80 rounded-lg border border-[#EAE5DC]/60">
                            <span className="text-[#71717A] block text-[11px]">Energy</span>
                            <span className="font-bold text-[#1C1917] text-sm">{product.nutritionFacts.calories}</span>
                          </div>
                          <div className="p-2.5 bg-[#FAF6EE]/80 rounded-lg border border-[#EAE5DC]/60">
                            <span className="text-[#71717A] block text-[11px]">Protein</span>
                            <span className="font-bold text-[#1C1917] text-sm">{product.nutritionFacts.protein}</span>
                          </div>
                          <div className="p-2.5 bg-[#FAF6EE]/80 rounded-lg border border-[#EAE5DC]/60">
                            <span className="text-[#71717A] block text-[11px]">Carbohydrates</span>
                            <span className="font-bold text-[#1C1917] text-sm">{product.nutritionFacts.carbs}</span>
                          </div>
                          <div className="p-2.5 bg-[#FAF6EE]/80 rounded-lg border border-[#EAE5DC]/60">
                            <span className="text-[#71717A] block text-[11px]">Total Fat</span>
                            <span className="font-bold text-[#1C1917] text-sm">{product.nutritionFacts.fat}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#71717A]">
                          *Values per 100g standard serving based on traditional preparation standards.
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-[#71717A] italic">
                        Detailed nutritional breakdown for this authentic batch is being certified. Typical values will be published shortly.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Customer Reviews Accordion */}
              <div className="border border-[#EAE5DC] rounded-xl bg-white overflow-hidden shadow-xs transition-colors">
                <button
                  type="button"
                  onClick={() => toggleAccordion('reviews')}
                  aria-expanded={openAccordion === 'reviews'}
                  className="w-full py-3 px-4 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-[#1C1917] hover:bg-[#FAF6EE]/40 transition-colors"
                >
                  <span>Customer Reviews ({actualReviewCount})</span>
                  {openAccordion === 'reviews' ? (
                    <ChevronUp className="w-4 h-4 text-[#71717A]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#71717A]" />
                  )}
                </button>
                {openAccordion === 'reviews' && (
                  <div className="px-4 pb-4 space-y-3.5 border-t border-[#EAE5DC]/60 pt-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-[#1C1917]">
                        Verified Customer Feedback ({actualReviewCount})
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
                        className="text-xs text-[#A67732] font-bold hover:underline"
                      >
                        {isReviewFormOpen ? 'Cancel' : '+ Write a Review'}
                      </button>
                    </div>

                    {/* Inline Review Form */}
                    {isReviewFormOpen && (
                      <form onSubmit={handleInlineReviewSubmit} className="space-y-2.5 bg-[#FAF6EE]/70 p-3.5 rounded-xl border border-[#EAE5DC] text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-[#1C1917]">Your Name</label>
                          <input
                            type="text"
                            required
                            value={reviewerName}
                            onChange={(e) => setReviewerName(e.target.value)}
                            className="w-full mt-1 p-2 border border-[#EAE5DC] rounded-lg bg-white text-xs text-[#1C1917] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A67732]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#1C1917]">Rating</label>
                          <select
                            value={newRating}
                            onChange={(e) => setNewRating(Number(e.target.value))}
                            className="w-full mt-1 p-2 border border-[#EAE5DC] rounded-lg bg-white text-xs text-[#1C1917] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A67732]"
                          >
                            <option value={5}>5 Stars — Exceptional Taste & Freshness</option>
                            <option value={4}>4 Stars — Very Good Quality</option>
                            <option value={3}>3 Stars — Average</option>
                            <option value={2}>2 Stars — Below Expectations</option>
                            <option value={1}>1 Star — Poor</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#1C1917]">Review Title</label>
                          <input
                            type="text"
                            required
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Authentic aroma and crispness"
                            className="w-full mt-1 p-2 border border-[#EAE5DC] rounded-lg bg-white text-xs text-[#1C1917] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A67732]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#1C1917]">Review</label>
                          <textarea
                            required
                            value={newFeedback}
                            onChange={(e) => setNewFeedback(e.target.value)}
                            placeholder="Share details on texture, aroma and packaging..."
                            rows={3}
                            className="w-full mt-1 p-2 border border-[#EAE5DC] rounded-lg bg-white text-xs text-[#1C1917] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A67732]"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#A67732] hover:bg-[#8F6428] text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                        >
                          Submit Review
                        </button>
                      </form>
                    )}

                    {/* Review List */}
                    {productReviews.length === 0 ? (
                      <div className="p-4 bg-[#FAF6EE]/50 rounded-lg text-center text-xs text-[#71717A] space-y-1">
                        <p className="font-semibold text-[#1C1917]">No reviews yet</p>
                        <p>Be the first to share your experience with this Kerala delicacy!</p>
                      </div>
                    ) : (
                      productReviews.map((rev) => (
                        <div key={rev.id} className="p-3 rounded-lg bg-[#FAF6EE]/50 border border-[#EAE5DC]/50 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#1C1917]">{rev.reviewerName}</span>
                            <div className="flex items-center text-[#F59E0B]">
                              {Array.from({ length: rev.rating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                              ))}
                            </div>
                          </div>
                          {rev.reviewTitle && (
                            <p className="text-xs font-semibold text-[#1C1917]">{rev.reviewTitle}</p>
                          )}
                          <p className="text-xs text-[#52525B] leading-relaxed">{rev.reviewText}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />

      {/* Mobile Sticky Purchase Bar — only on mobile viewports (< 768px) */}
      {isMobileScreen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#FBF8F4]/96 backdrop-blur-md border-t border-[#EAE3D6]/70 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]"
             style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Price display */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-lg text-[#1C1917]">₹{sellingPrice}</span>
                {savings > 0 && (
                  <span className="text-xs text-[#9CA3AF] line-through">₹{mrp}</span>
                )}
              </div>
              {savings > 0 && (
                <span className="text-[10px] font-bold text-[#E84C30]">{calculatedDiscount}% OFF · Save ₹{savings}</span>
              )}
            </div>
            {/* Add to Cart */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={selectedVariant.stockQuantity <= 0}
              className="h-11 px-4 rounded-xl bg-white border-2 border-[#A67732] text-[#A67732] font-bold text-sm flex items-center gap-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden xs:inline">Add</span>
            </button>
            {/* Buy Now */}
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isBuyingNow || selectedVariant.stockQuantity <= 0}
              className="h-11 px-5 rounded-xl bg-[#A67732] hover:bg-[#8E6325] text-white font-bold text-sm flex items-center gap-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-sm"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{isBuyingNow ? 'Going...' : 'Buy Now'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
