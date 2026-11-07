import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Leaf, MessageCircle, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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
        
        {/* 2. Hero Banner / Slideshow: Smooth Transitions, Zero Image Fallback, Pause on Hover */}
        {activeBanners.length === 0 ? (
          /* Pure CSS Image-Free Fallback: Never resurrects deleted banners */
          <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-[#EAE5DC] bg-[#072C20] text-white p-6 sm:p-12 md:p-16 text-center">
            {/* Festival Decorative Overlay */}
            <FestivalHeroOverlay />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/40 pointer-events-none" />
            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#A67732]/20 blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-2xl mx-auto space-y-3 sm:space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-[#A67732]/30 text-amber-200 border border-amber-300/30">
                <Sparkles className="w-3.5 h-3.5 text-[#FAD982]" />
                Authentic Malabar Delicacies
              </span>
              <h1 className="font-serif font-bold text-2xl sm:text-4xl lg:text-5xl leading-tight text-white drop-shadow-sm">
                Crafted with Care. Rooted in Kerala.
                <span className="block text-lg sm:text-2xl font-medium text-amber-200 mt-1">
                  Authentic Kerala Flavours, Rooted in Tradition.
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-stone-200 line-clamp-3 sm:line-clamp-2 max-w-lg mx-auto leading-relaxed">
                Pure Kerala spices, authentic spice blends, and traditional ingredients delivered directly from regional farms to your kitchen.
              </p>
              <div className="pt-2 sm:pt-3">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#A67732] hover:bg-[#8F6428] active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <span>Explore All Products</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
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
            className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-[#EAE5DC] bg-[#072C20] min-h-[240px] sm:min-h-[300px] lg:min-h-[360px]"
            aria-roledescription="carousel"
            aria-label="Promotional Hero Banners"
          >
            {/* Festival Decorative Corner Flourishes & Motifs */}
            <FestivalHeroOverlay />

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

            {/* Slideshow Previous / Next Navigation Controls (Shown when multiple banners exist) */}
            {activeBanners.length > 1 && (
              <>
                <button
                  onClick={handlePrevSlide}
                  className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white backdrop-blur-xs transition-colors border border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={handleNextSlide}
                  className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white/90 hover:text-white backdrop-blur-xs transition-colors border border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Slideshow Indicator Dots */}
                <div
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/10"
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

        {/* 3. Brand Quality & Heritage Highlights (USP Strip) */}
        <section className="py-1" aria-label="Brand Quality Standards">
          <div className="grid grid-cols-3 divide-x divide-[#E5DFD4] text-center bg-white/60 rounded-2xl py-3 border border-[#EAE5DC]/80 shadow-xs">
            <div className="flex items-center justify-center gap-2 sm:gap-3 px-2">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#A67732] stroke-[1.8] shrink-0" />
              <span className="text-[11px] sm:text-xs font-semibold text-[#1C1917] leading-tight text-left">
                Authentic Kerala<br />Spices & Blends
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 sm:gap-3 px-2">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-[#A67732] stroke-[1.8] shrink-0" />
              <span className="text-[11px] sm:text-xs font-semibold text-[#1C1917] leading-tight text-left">
                Pure Traditional<br />Ingredients & Oils
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 sm:gap-3 px-2">
              <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-[#A67732] stroke-[1.8] shrink-0" />
              <span className="text-[11px] sm:text-xs font-semibold text-[#1C1917] leading-tight text-left">
                Zero Artificial<br />Additives
              </span>
            </div>
          </div>
        </section>

        {/* Festival Section Separator */}
        <FestivalDivider />

        {/* 4. Shop by Category: Enhanced Tile Clarity & Balanced Grid */}
        <section className="space-y-3" aria-labelledby="category-heading">
          <div className="flex items-center justify-between">
            <div>
              <FestivalSectionHeader>
                <h2 id="category-heading" className="font-serif font-bold text-lg sm:text-2xl text-[#1C1917]">
                  Shop by Category
                </h2>
              </FestivalSectionHeader>
              <p className="text-xs text-[#71717A] mt-0.5">Explore authentic Kerala spices, spice blends, traditional ingredients & regional essentials</p>
            </div>
            <Link
              to="/shop"
              className="text-xs sm:text-sm font-bold text-[#A67732] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-5 lg:grid-cols-10 gap-2 sm:gap-3">
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
                      (e.currentTarget as HTMLImageElement).src = '/assets/cat-chips.png';
                    }}
                  />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-[#1C1917] mt-1.5 group-hover:text-[#A67732] transition-colors truncate w-full px-0.5">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 5. Bestsellers: Standardized Card Heights & Clean Badges */}
        <section className="space-y-3" aria-labelledby="bestsellers-heading">
          <div className="flex items-center justify-between">
            <div>
              <FestivalSectionHeader>
                <h2 id="bestsellers-heading" className="font-serif font-bold text-lg sm:text-2xl text-[#1C1917]">
                  Bestsellers
                </h2>
              </FestivalSectionHeader>
              <p className="text-xs text-[#71717A] mt-0.5">Customer favorites shipped fresh daily</p>
            </div>
            <Link
              to="/shop"
              className="text-xs sm:text-sm font-bold text-[#A67732] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 4-Item Responsive Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 items-stretch">
            {bestsellers.map((prod) => (
              <ProductCard key={prod.id} product={prod} compactButton={false} />
            ))}
          </div>
        </section>

        {/* 6. Additional Featured Collections (Heritage Kerala Treats) */}
        {featuredSweets.length > 0 && (
          <section className="space-y-3" aria-labelledby="featured-heading">
            <div className="flex items-center justify-between">
              <div>
                <FestivalSectionHeader>
                  <h2 id="featured-heading" className="font-serif font-bold text-lg sm:text-2xl text-[#1C1917]">
                    Traditional Sweets & Specialties
                  </h2>
                </FestivalSectionHeader>
                <p className="text-xs text-[#71717A] mt-0.5">Slow-cooked authentic delicacies, regional staples & specialty treats</p>
              </div>
              <Link
                to="/shop"
                className="text-xs sm:text-sm font-bold text-[#A67732] hover:underline flex items-center gap-1"
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
          </section>
        )}

        {/* 7. Our Story Teaser: Clean Mobile Stacking */}
        <section className="relative rounded-2xl sm:rounded-3xl bg-[#FAF6EE] border border-[#EAE5DC] p-5 sm:p-8 lg:p-10 overflow-hidden shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-2.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-[#A67732]/15 text-[#A67732] border border-[#A67732]/30">
                Our Kerala Heritage
              </span>
              <h2 className="font-serif font-bold text-xl sm:text-2xl lg:text-3xl text-[#1C1917] leading-snug">
                Pure Ingredients, Generational Craft
              </h2>
              <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed max-w-2xl">
                Every creation from ZaDa Foods celebrates Kerala's rich spice legacy and authentic regional cuisine. From Malabar black pepper and aromatic spices to pure cold-pressed coconut oil and slow-cooked heritage treats—no preservatives, no shortcuts, just pure Kerala flavours rooted in tradition.
              </p>
              <div className="pt-2">
                <Link
                  to="/our-story"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#072C20] hover:bg-[#041914] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
                >
                  <span>Read Our Story</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="md:col-span-4 flex items-center justify-center">
              <div className="relative w-full max-w-[260px] sm:max-w-xs aspect-[4/3] sm:aspect-square rounded-2xl overflow-hidden border border-[#EAE5DC] bg-white shadow-xs mx-auto">
                <img
                  src="/assets/prod-banana-chips-hero.png"
                  alt="Traditional Kerala chips preparation"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Festival Promotional Split Banners & Curations */}
        <FestivalPromotionSection />

        {/* 8. Bulk Orders & Gifting CTA: Clean Mobile Stacking */}
        <section className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#072C20] to-[#0A3D2D] text-white p-5 sm:p-8 lg:p-10 shadow-sm border border-emerald-950/40">
          <div className="max-w-2xl space-y-3">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
              Corporate & Wedding Celebrations
            </span>
            <h2 className="font-serif font-bold text-xl sm:text-2xl lg:text-3xl leading-snug text-white">
              Planning a Festive Gathering or Corporate Event?
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-normal">
              Custom-branded Kerala delicacy hampers, festive gift boxes, and bulk snack orders tailored for special occasions with door-to-door delivery across India.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
              <Link
                to="/bulk-orders"
                className="px-5 py-2.5 rounded-xl bg-[#A67732] hover:bg-[#8F6428] text-white text-xs sm:text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Request Bulk Quote</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
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
