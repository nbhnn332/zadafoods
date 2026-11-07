import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, MessageCircle, ChevronLeft, ChevronRight, Sparkles, Shield, Check } from 'lucide-react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Footer } from '../components/Footer';
import { ProductCard } from '../components/ProductCard';
import { useAdminData } from '../context/AdminDataContext';
import { normalizeWhatsAppNumber } from '../lib/commerce/whatsappRouting';
import { FestivalHeroOverlay } from '../components/festival/FestivalHeroOverlay';
import { FestivalSectionHeader } from '../components/festival/FestivalSectionHeader';
import { FestivalAtmosphere, FestivalDivider } from '../components/festival/FestivalAtmosphere';
import { FestivalPromotionSection } from '../components/festival/FestivalPromotionSection';
import { FestivalPopup } from '../components/festival/FestivalPopup';
import { FestivalFooterDecoration } from '../components/festival/FestivalFooterDecoration';

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
                  className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-sm transition-all border border-white/20 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={handleNextSlide}
                  className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-sm transition-all border border-white/20 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
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

        {/* ── SECTION 2: Trust Strip ── */}
        <section className="py-1" aria-label="Brand Quality Standards">
          <div className="flex items-center justify-around gap-0 overflow-x-auto no-scrollbar bg-white/40 rounded-2xl py-3.5 px-2">
            {/* Item 1 */}
            <div className="flex flex-col items-center gap-1.5 px-3 sm:px-5 min-w-0 shrink-0 flex-1 text-center">
              <Sparkles className="w-5 h-5 text-[#A67732] stroke-[1.8] shrink-0" />
              <span className="text-[11px] sm:text-xs font-semibold text-[#1C1917] leading-tight whitespace-nowrap">
                Authentic Wayanad Spices<br />&amp; Heritage Blends
              </span>
            </div>
            {/* Separator */}
            <div className="hidden sm:block w-px h-8 bg-[#E5DFD4] shrink-0" aria-hidden="true" />
            {/* Item 2 */}
            <div className="flex flex-col items-center gap-1.5 px-3 sm:px-5 min-w-0 shrink-0 flex-1 text-center">
              <Leaf className="w-5 h-5 text-[#A67732] stroke-[1.8] shrink-0" />
              <span className="text-[11px] sm:text-xs font-semibold text-[#1C1917] leading-tight whitespace-nowrap">
                100% Pure Cold-Pressed<br />Coconut Oil &amp; Ingredients
              </span>
            </div>
            {/* Separator */}
            <div className="hidden sm:block w-px h-8 bg-[#E5DFD4] shrink-0" aria-hidden="true" />
            {/* Item 3 */}
            <div className="flex flex-col items-center gap-1.5 px-3 sm:px-5 min-w-0 shrink-0 flex-1 text-center">
              <Shield className="w-5 h-5 text-[#A67732] stroke-[1.8] shrink-0" />
              <span className="text-[11px] sm:text-xs font-semibold text-[#1C1917] leading-tight whitespace-nowrap">
                Zero Artificial<br />Additives
              </span>
            </div>
          </div>
        </section>

        {/* Festival Section Separator */}
        <FestivalDivider />

        {/* ── SECTION 3: Shop by Category — Editorial Asymmetric Layout ── */}
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
              {/* Mobile: Featured (first) category — full-width tall card */}
              <div className="md:hidden space-y-2">
                {/* Featured large card */}
                <Link
                  to={`/category/${categories[0].slug}`}
                  className="group relative block w-full h-40 rounded-2xl overflow-hidden bg-[#072C20] shadow-sm"
                >
                  <img
                    src={categories[0].imageUrl}
                    alt={categories[0].name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {/* Fallback forest green bg if image missing */}
                  <div className="absolute inset-0 bg-[#072C20]/30 group-hover:bg-[#072C20]/20 transition-colors" />
                  {/* Bottom overlay gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 to-transparent pointer-events-none" />
                  {/* Category name */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <span className="font-bold text-sm text-white drop-shadow-sm">{categories[0].name}</span>
                  </div>
                </Link>

                {/* Remaining categories — 2-column square grid */}
                <div className="grid grid-cols-2 gap-2">
                  {categories.slice(1, 9).map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      className="group relative block aspect-square rounded-2xl overflow-hidden bg-[#072C20] shadow-xs"
                    >
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {/* Fallback bg */}
                      <div className="absolute inset-0 bg-[#072C20]/20 group-hover:bg-[#072C20]/10 transition-colors" />
                      {/* Bottom gradient */}
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                      {/* Name overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-2.5 z-10">
                        <span className="font-semibold text-[11px] text-white drop-shadow-sm line-clamp-2 leading-tight">{cat.name}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Desktop: 5-col or 6-col grid */}
              <div className="hidden md:grid grid-cols-5 lg:grid-cols-10 gap-2 sm:gap-3">
                {categories.slice(0, 10).map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className="group flex flex-col items-center text-center p-2 sm:p-2.5 rounded-2xl bg-white border border-[#EAE5DC] shadow-xs hover:border-[#A67732] hover:shadow-sm transition-all"
                  >
                    <div className="w-14 h-12 sm:w-16 sm:h-14 overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform p-0.5">
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="w-full h-full object-contain filter drop-shadow-xs"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold text-[#1C1917] mt-1.5 group-hover:text-[#A67732] transition-colors truncate w-full px-0.5">
                      {cat.name}
                    </span>
                  </Link>
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

        {/* ── SECTION 6: Our Story Teaser — Forest Green Editorial ── */}
        <section
          className="bg-[#072C20] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 overflow-hidden relative"
          aria-label="Our Kerala Heritage"
        >
          {/* Subtle decorative orb */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#A67732]/10 blur-3xl pointer-events-none" />

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Text Content */}
              <div className="md:col-span-7 space-y-3 text-center md:text-left">
                {/* Gold eyebrow */}
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-widest bg-[#A67732]/20 text-[#D4B574] border border-[#A67732]/30">
                  Our Kerala Heritage
                </span>
                {/* Large serif headline */}
                <h2 className="font-serif font-bold text-xl sm:text-2xl lg:text-3xl text-white leading-snug">
                  Pure Ingredients, Generational Craft
                  <span className="block text-sm sm:text-base font-normal text-[#D4B574] mt-1">
                    Rooted in Kerala. Crafted for Every Kitchen.
                  </span>
                </h2>
                {/* Description */}
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed max-w-lg mx-auto md:mx-0">
                  Every creation from ZaDa Foods celebrates Kerala's rich spice legacy and authentic regional cuisine. From Malabar black pepper to slow-cooked heritage treats — no preservatives, no shortcuts, just pure Kerala flavours rooted in tradition.
                </p>
                <div className="pt-2 flex justify-center md:justify-start">
                  <Link
                    to="/our-story"
                    aria-label="Read Our Story"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/30 text-white hover:bg-white/10 active:scale-[0.99] text-xs sm:text-sm font-bold transition-all"
                  >
                    <span>Read Our Story</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Image — desktop only (hidden on mobile for clean text focus) */}
              <div className="hidden md:flex md:col-span-5 items-center justify-center">
                <div className="relative w-full max-w-[280px] aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-lg">
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
