import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, MessageCircle, ChevronLeft, ChevronRight, Sparkles, Shield, Check } from 'lucide-react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Footer } from '../components/Footer';
import { ProductCard } from '../components/ProductCard';
import { useAdminData } from '../context/AdminDataContext';
import { normalizeWhatsAppNumber } from '../lib/commerce/whatsappRouting';
import { Category } from '../types';
import { FestivalHeroOverlay } from '../components/festival/FestivalHeroOverlay';
import { FestivalSectionHeader } from '../components/festival/FestivalSectionHeader';
import { FestivalAtmosphere, FestivalDivider } from '../components/festival/FestivalAtmosphere';
import { FestivalPromotionSection } from '../components/festival/FestivalPromotionSection';
import { FestivalPopup } from '../components/festival/FestivalPopup';
import { FestivalFooterDecoration } from '../components/festival/FestivalFooterDecoration';

interface CategoryRailItemProps {
  category: Category;
  isMobile?: boolean;
}

const CategoryRailItem: React.FC<CategoryRailItemProps> = ({ category, isMobile }) => {
  const [imgError, setImgError] = useState(false);

  if (isMobile) {
    return (
      <Link
        to={`/category/${category.slug}`}
        className="group flex flex-col items-center shrink-0 w-[110px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A67732] rounded-2xl p-1 transition-all"
      >
        {/* Soft Circular Image Container (88–100px range, exactly 92px) */}
        <div className="w-[92px] h-[92px] rounded-full p-1 bg-white border border-[#EAE3D6] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-center transition-all duration-300 group-hover:border-[#A67732] group-hover:scale-105 group-active:scale-95">
          <div className="w-full h-full rounded-full overflow-hidden bg-[#FAF6EE] flex items-center justify-center">
            {imgError || !category.imageUrl ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAF6EE] text-[#A67732]">
                <span className="font-serif text-2xl font-bold select-none">
                  {category.name.charAt(0).toUpperCase()}
                </span>
              </div>
            ) : (
              <img
                src={category.imageUrl}
                alt={category.name}
                className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={() => setImgError(true)}
              />
            )}
          </div>
        </div>

        {/* Category Label: 2-line natural wrap, no ellipsis truncation */}
        <span className="mt-2 text-xs font-semibold text-[#1C1917] group-hover:text-[#A67732] text-center leading-snug line-clamp-2 h-[2.5rem] flex items-center justify-center transition-colors px-1 w-full break-words">
          {category.name}
        </span>
      </Link>
    );
  }

  return (
    <Link
      to={`/category/${category.slug}`}
      className="group flex flex-col items-center text-center p-2 rounded-2xl hover:bg-white/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A67732]"
    >
      <div className="w-20 h-20 rounded-full p-1 bg-white border border-[#EAE3D6] shadow-xs flex items-center justify-center group-hover:border-[#A67732] group-hover:scale-105 transition-all">
        <div className="w-full h-full rounded-full overflow-hidden bg-[#FAF6EE] flex items-center justify-center">
          {imgError || !category.imageUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#FAF6EE] text-[#A67732]">
              <span className="font-serif text-2xl font-bold select-none">
                {category.name.charAt(0).toUpperCase()}
              </span>
            </div>
          ) : (
            <img
              src={category.imageUrl}
              alt={category.name}
              className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          )}
        </div>
      </div>
      <span className="text-xs font-semibold text-[#1C1917] mt-2 group-hover:text-[#A67732] transition-colors leading-snug line-clamp-2 h-[2.5rem] flex items-center justify-center px-1 w-full break-words">
        {category.name}
      </span>
    </Link>
  );
};

export const HomePage: React.FC = () => {
  const { products, categories, banners, settings } = useAdminData();

  // Bestsellers & Featured Collections from authoritative database/store state
  const bestsellers = products.filter((p) => p.isBestseller && p.isPublished).slice(0, 4);
  const featuredSweets = products.filter((p) => !p.isBestseller && p.isPublished).slice(0, 4);

  // Authoritative active banners dynamically managed from Admin CMS
  const activeBanners = useMemo(() => {
    return (banners || [])
      .filter((b) => b.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [banners]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Keep currentSlide within valid bounds if activeBanners array changes
  useEffect(() => {
    if (currentSlide >= activeBanners.length && activeBanners.length > 0) {
      setCurrentSlide(0);
    }
  }, [activeBanners.length, currentSlide]);

  // Automatic slideshow timer: advances every 5.5s
  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;

    // Respect prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const interval = setInterval(() => {
      // Pause rotation if page/tab is currently hidden
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }
      setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [activeBanners.length, isPaused]);

  // Tab visibility listener
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
  };

  return (
    <div className="min-h-screen bg-canvas pb-20 md:pb-0 text-content-primary relative">
      {/* Immersive Festival Atmosphere (Subtle background patterns & ambient glow) */}
      <FestivalAtmosphere />

      {/* Festival Welcome & Exclusive Discount Modal */}
      <FestivalPopup />

      {/* 1. Compact Unified Navigation */}
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-7 sm:pb-10 lg:pb-12 space-y-7 sm:space-y-10">

        {/* ── SECTION 1: Hero Banner / Slideshow ── */}
        {activeBanners.length === 0 ? (
          /* Pure CSS Fallback Hero — image-free, never shows broken images */
          <section className="relative min-h-[72vw] sm:min-h-[300px] lg:min-h-[400px] rounded-2xl overflow-hidden shadow-sm">
            {/* Forest green gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#031D16] via-[#072C20] to-[#0A3D2D]" />

            {/* Festival Decorative Overlay */}
            <FestivalHeroOverlay />

            {/* Decorative gold orbs */}
            <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[#A67732]/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-10 w-56 h-56 rounded-full bg-[#D4B574]/15 blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-[#A67732]/10 blur-2xl pointer-events-none" />

            {/* Gradient scrim */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/40 pointer-events-none" />

            <div className="relative z-10 flex items-center justify-center sm:justify-start h-full min-h-[inherit] p-6 sm:p-10 md:p-14">
              <div className="max-w-xl space-y-3 sm:space-y-4 text-center sm:text-left">
                {/* Gold eyebrow pill */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest bg-[#A67732]/30 text-amber-200 border border-amber-300/30">
                  <Sparkles className="w-3.5 h-3.5 text-[#FAD982]" />
                  The Essence of Kerala • Authentic Malabar Delicacies
                </span>

                {/* Headline */}
                <h1 className="font-serif font-bold text-2xl sm:text-4xl leading-tight text-white drop-shadow-sm">
                  Crafted with Care. Rooted in Kerala.
                  <span className="block text-lg sm:text-2xl font-medium text-amber-200 mt-1">
                    Bring Home the Soul of Kerala.
                  </span>
                </h1>

                {/* Description */}
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-md mx-auto sm:mx-0">
                  Pure Kerala spices, authentic spice blends, and traditional ingredients delivered directly from regional farms to your kitchen.
                </p>

                {/* CTA */}
                <div className="pt-1 sm:pt-2 flex justify-center sm:justify-start">
                  <Link
                    to="/shop"
                    aria-label="Shop Now"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#A67732] hover:bg-[#8F6428] active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    <span>Explore Our Collection</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* Automatic Rotating Hero Banner Slideshow */
          <section
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
            className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-[#EAE5DC] bg-gradient-to-br from-[#031D16] via-[#072C20] to-[#0A3D2D] min-h-[72vw] sm:min-h-[300px] lg:min-h-[400px]"
            aria-roledescription="carousel"
            aria-label="Promotional Hero Banners"
          >
            {/* Festival Decorative Corner Flourishes & Motifs */}
            <FestivalHeroOverlay />

            {/* Decorative gold orbs behind slides */}
            <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[#A67732]/15 blur-3xl pointer-events-none z-0" />
            <div className="absolute -bottom-16 -right-10 w-56 h-56 rounded-full bg-[#D4B574]/10 blur-3xl pointer-events-none z-0" />

            {activeBanners.map((slide, idx) => {
              const isCurrent = idx === currentSlide;
              const hasImage = !!(slide.imageUrl && slide.imageUrl.trim());
              return (
                <div
                  key={slide.id}
                  style={{
                    backgroundColor: slide.backgroundColor || '#072C20',
                    color: slide.textColor || '#FFFFFF'
                  }}
                  className={`absolute inset-0 flex items-center transition-opacity duration-700 ease-in-out ${
                    isCurrent ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                  aria-hidden={!isCurrent}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${idx + 1} of ${activeBanners.length}: ${slide.title}`}
                >
                  {/* Background Image: Rendered only if explicitly authorized */}
                  {hasImage ? (
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      className="absolute inset-0 w-full h-full object-cover object-right sm:object-[80%_center]"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}

                  {/* Gradient Scrim Overlay for 100% text readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent w-full sm:w-3/4 lg:w-3/5 pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent sm:hidden pointer-events-none" />

                  {/* Content Overlay */}
                  <div className="relative z-10 p-5 sm:p-8 lg:p-12 max-w-xl space-y-2.5 sm:space-y-3.5 text-white">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-[#A67732]/30 text-amber-200 border border-amber-300/30">
                      <Sparkles className="w-3 h-3 text-[#FAD982]" />
                      {slide.eyebrow || 'Fresh From Kerala'}
                    </span>
                    <h1 className="font-serif font-bold text-xl sm:text-3xl lg:text-4xl leading-tight text-white drop-shadow-sm">
                      {slide.title}
                    </h1>
                    {slide.subtitle && (
                      <p className="text-xs sm:text-sm text-white/90 line-clamp-3 sm:line-clamp-2 max-w-md leading-relaxed font-normal">
                        {slide.subtitle}
                      </p>
                    )}
                    <div className="pt-2 sm:pt-3">
                      <Link
                        to={slide.linkUrl || '/shop'}
                        className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-[#A67732] hover:bg-[#8F6428] active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all"
                        aria-label={slide.ctaText || 'Shop Now'}
                      >
                        <span>{slide.ctaText || 'Shop Now'}</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Slideshow Previous / Next — frosted glass circles */}
            {activeBanners.length > 1 && (
              <>
                <button
                  onClick={handlePrevSlide}
                  className="absolute bottom-3 right-12 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:left-4 z-20 w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all border border-white/20 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={handleNextSlide}
                  className="absolute bottom-3 right-3 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:right-4 z-20 w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all border border-white/20 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Pill-shaped indicator dots at bottom center */}
                <div
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10"
                  role="tablist"
                  aria-label="Slides"
                >
                  {activeBanners.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={() => setCurrentSlide(dotIdx)}
                      className={`transition-all rounded-full ${
                        dotIdx === currentSlide
                          ? 'w-5 h-1.5 bg-amber-400'
                          : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                      }`}
                      aria-label={`Go to slide ${dotIdx + 1}`}
                      aria-current={dotIdx === currentSlide ? 'true' : 'false'}
                      role="tab"
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* ── SECTION 2: Trust Strip (Brand Quality Standards) ── */}
        <section className="py-1" aria-label="Brand Quality Standards">
          {/* Responsive Brand Promise: 3 Stacked Rows on Mobile, 3 Columns on Desktop */}
          <div className="bg-white/80 border border-[#EAE3D6] rounded-2xl p-2 sm:p-0 sm:py-3.5 sm:px-4 shadow-2xs flex flex-col md:grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#EAE3D6]/70 md:divide-[#E5DFD4]">
            {/* Item 1 */}
            <div className="flex items-center md:justify-center gap-2.5 min-[360px]:gap-3 py-2 px-2 min-[360px]:px-2.5 md:py-0 md:px-4">
              <div className="w-7 h-7 min-[360px]:w-8 min-[360px]:h-8 md:w-9 md:h-9 rounded-full bg-[#FAF6EE] border border-[#EAE3D6]/80 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 min-[360px]:w-4 min-[360px]:h-4 text-[#A67732] stroke-[2]" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[11px] min-[360px]:text-xs font-semibold text-[#1C1917] leading-snug md:leading-tight break-words">
                  Authentic Wayanad Spices &amp; Heritage Blends
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-center md:justify-center gap-2.5 min-[360px]:gap-3 py-2 px-2 min-[360px]:px-2.5 md:py-0 md:px-4">
              <div className="w-7 h-7 min-[360px]:w-8 min-[360px]:h-8 md:w-9 md:h-9 rounded-full bg-[#FAF6EE] border border-[#EAE3D6]/80 flex items-center justify-center shrink-0">
                <Leaf className="w-3.5 h-3.5 min-[360px]:w-4 min-[360px]:h-4 text-[#A67732] stroke-[2]" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[11px] min-[360px]:text-xs font-semibold text-[#1C1917] leading-snug md:leading-tight break-words">
                  100% Pure Cold-Pressed Coconut Oil &amp; Ingredients
                </p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex items-center md:justify-center gap-2.5 min-[360px]:gap-3 py-2 px-2 min-[360px]:px-2.5 md:py-0 md:px-4">
              <div className="w-7 h-7 min-[360px]:w-8 min-[360px]:h-8 md:w-9 md:h-9 rounded-full bg-[#FAF6EE] border border-[#EAE3D6]/80 flex items-center justify-center shrink-0">
                <Shield className="w-3.5 h-3.5 min-[360px]:w-4 min-[360px]:h-4 text-[#A67732] stroke-[2]" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[11px] min-[360px]:text-xs font-semibold text-[#1C1917] leading-snug md:leading-tight break-words">
                  Zero Artificial Additives
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Festival Section Separator with controlled vertical whitespace */}
        <FestivalDivider className="my-2 sm:my-3 opacity-60" />

        {/* ── SECTION 3: Shop by Category — Clean Horizontal Rail on Mobile ── */}
        <section className="space-y-3" aria-labelledby="category-heading">
          <div className="flex items-center justify-between">
            <div>
              <FestivalSectionHeader>
                <h2 id="category-heading" className="font-serif font-bold text-lg sm:text-2xl text-[#1C1917]">
                  Shop by Category
                </h2>
              </FestivalSectionHeader>
              <p className="text-xs text-[#71717A] mt-0.5">Explore authentic Kerala spices, blends, traditional ingredients &amp; regional essentials</p>
            </div>
            <Link
              to="/shop"
              className="text-xs sm:text-sm font-bold text-[#A67732] hover:underline flex items-center gap-1 shrink-0"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {categories.length > 0 && (
            <>
              {/* Mobile: Horizontal Scrolling Category Rail (105-120px tile width, 88-100px images, natural 2-line wrap) */}
              <div className="md:hidden">
                <div className="flex items-start gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
                  {categories.map((cat) => (
                    <CategoryRailItem key={cat.id} category={cat} isMobile={true} />
                  ))}
                </div>
              </div>

              {/* Desktop: Dynamic Clean Circular Grid */}
              <div className="hidden md:grid grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {categories.slice(0, 12).map((cat) => (
                  <CategoryRailItem key={cat.id} category={cat} isMobile={false} />
                ))}
              </div>
            </>
          )}
        </section>

        {/* ── SECTION 4: Bestsellers — Warm Ivory Editorial Section ── */}
        <section
          className="space-y-4 bg-[#FAF7F2] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
          aria-labelledby="bestsellers-heading"
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                {/* Gold eyebrow */}
                <span className="inline-block text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#A67732] mb-1">
                  Customer Favourites
                </span>
                <FestivalSectionHeader>
                  <h2 id="bestsellers-heading" className="font-serif font-bold text-lg sm:text-2xl text-[#1C1917]">
                    Bestsellers
                  </h2>
                </FestivalSectionHeader>
                <p className="text-xs text-[#71717A] mt-0.5">Customer favorites shipped fresh daily</p>
              </div>
              <Link
                to="/shop"
                className="text-xs sm:text-sm font-bold text-[#A67732] hover:underline flex items-center gap-1 shrink-0"
              >
                <span>View All</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 2-col mobile, 4-col desktop */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 items-stretch">
              {bestsellers.map((prod) => (
                <ProductCard key={prod.id} product={prod} compactButton={false} />
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 5: Featured / Traditional Products — Deep Forest Editorial ── */}
        {featuredSweets.length > 0 && (
          <section
            className="space-y-4 bg-gradient-to-br from-[#031D16] to-[#072C20] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
            aria-labelledby="featured-heading"
          >
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  {/* Gold eyebrow */}
                  <span className="inline-block text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#D4B574] mb-1">
                    Handpicked For You
                  </span>
                  <FestivalSectionHeader>
                    <h2 id="featured-heading" className="font-serif font-bold text-lg sm:text-2xl text-white">
                      Traditional Sweets &amp; Specialties
                    </h2>
                  </FestivalSectionHeader>
                  <p className="text-xs text-white/60 mt-0.5">Slow-cooked authentic delicacies, regional staples &amp; specialty treats</p>
                </div>
                <Link
                  to="/shop"
                  className="text-xs sm:text-sm font-bold text-[#D4B574] hover:underline flex items-center gap-1 shrink-0"
                >
                  <span>Explore More</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 items-stretch">
                {featuredSweets.map((prod) => (
                  <ProductCard key={prod.id} product={prod} compactButton={false} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── SECTION 6: Our Story Teaser — Warm Ivory Artisanal Card ── */}
        <section
          className="rounded-2xl sm:rounded-3xl bg-[#FAF6EE] border border-[#EAE3D6] p-6 sm:p-10 lg:p-12 overflow-hidden relative shadow-xs"
          aria-label="Our Kerala Heritage"
        >
          {/* Subtle decorative gold orb */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#A67732]/10 blur-3xl pointer-events-none" />

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Text Content */}
              <div className="md:col-span-7 space-y-3 text-center md:text-left">
                {/* Gold eyebrow */}
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-widest bg-[#A67732]/15 text-[#A67732] border border-[#A67732]/25">
                  Our Kerala Heritage
                </span>
                {/* Large serif headline */}
                <h2 className="font-serif font-bold text-xl sm:text-2xl lg:text-3xl text-[#1C1917] leading-snug">
                  Pure Ingredients, Generational Craft
                  <span className="block text-sm sm:text-base font-normal text-[#A67732] mt-1">
                    Rooted in Kerala. Crafted for Every Kitchen.
                  </span>
                </h2>
                {/* Description */}
                <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed max-w-lg mx-auto md:mx-0">
                  Every creation from ZaDa Foods celebrates Kerala's rich spice legacy and authentic regional cuisine. From Malabar black pepper to slow-cooked heritage treats — no preservatives, no shortcuts, just pure Kerala flavours rooted in tradition.
                </p>
                <div className="pt-2 flex justify-center md:justify-start">
                  <Link
                    to="/our-story"
                    aria-label="Read Our Story"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#072C20] hover:bg-[#031D16] text-white active:scale-[0.99] text-xs sm:text-sm font-bold shadow-xs transition-all"
                  >
                    <span>Read Our Story</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Image — desktop only (hidden on mobile for clean text focus) */}
              <div className="hidden md:flex md:col-span-5 items-center justify-center">
                <div className="relative w-full max-w-[280px] aspect-[4/3] rounded-2xl overflow-hidden border border-[#EAE3D6] shadow-sm bg-white">
                  <img
                    src="/assets/prod-banana-chips-hero.png"
                    alt="Traditional Kerala chips preparation"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Festival Promotional Split Banners & Curations */}
        <FestivalPromotionSection />

        {/* ── SECTION 7: Bulk Orders / Gifting CTA — Premium Gifting Editorial ── */}
        <section className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#072C20] to-[#0A3D2D] text-white p-5 sm:p-8 lg:p-10 shadow-sm border border-emerald-950/40 overflow-hidden relative">
          {/* Decorative gold accent */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#A67732]/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-3.5">
            {/* Eyebrow */}
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/30">
              Corporate &amp; Wedding Gifting
            </span>

            {/* Headline */}
            <h2 className="font-serif font-bold text-xl sm:text-2xl lg:text-3xl leading-snug text-white">
              Planning a Festive Gathering or Corporate Event?
            </h2>

            {/* Sub-items list */}
            <ul className="space-y-1.5">
              {[
                'Corporate gifting hampers',
                'Wedding Kerala delicacy boxes',
                'Bulk spice orders',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs sm:text-sm text-white/80">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[2.5]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
              {/* Primary */}
              <Link
                to="/bulk-orders"
                aria-label="Request Bulk Quote"
                className="px-5 py-2.5 rounded-xl bg-[#A67732] hover:bg-[#8F6428] text-white text-xs sm:text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Discuss a Custom Order</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Secondary WhatsApp */}
              <a
                href={`https://wa.me/${normalizeWhatsAppNumber(settings.whatsAppDestinationNumber || settings.supportWhatsApp)}?text=${encodeURIComponent('Hello ZaDa Foods, I would like to enquire about bulk orders.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* Festival Footer Greeting Accent */}
      <FestivalFooterDecoration />

      {/* Official ZaDa Foods Footer Component */}
      <Footer />

      {/* Mobile Sticky Navigation */}
      <BottomNav />
    </div>
  );
};
