import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Flame,
  Leaf,
  HeartHandshake,
  Clock
} from 'lucide-react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Footer } from '../components/Footer';
import { useAdminData } from '../context/AdminDataContext';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export const OurStoryPage: React.FC = () => {
  const { settings, storeContent } = useAdminData();
  const aboutPage = storeContent.find((p) => p.slug === 'about' || p.slug === 'our-story');

  const defaultHeroTitle = 'Rooted in Kerala. Crafted with Care.';
  const displayHeroTitle =
    aboutPage?.title &&
    aboutPage.title !== 'Our Kerala Heritage & Pure Flavors' &&
    aboutPage.title !== 'Preserving the Art of Traditional Kerala Delicacies'
      ? aboutPage.title
      : defaultHeroTitle;

  const craftsmanshipPillars = [
    {
      icon: Leaf,
      title: '100% Pure Coconut Oil',
      description:
        'Cold-pressed coconut oil extracted using traditional methods, retaining the natural nutrients and authentic aroma that defines Kerala cooking.'
    },
    {
      icon: Sparkles,
      title: 'Farm-Direct Nendran Bananas & Spices',
      description:
        'Harvested at peak maturity from trusted grower collectives across Wayanad and Malabar alongside heritage regional spices, prepared with utmost care.'
    },
    {
      icon: Flame,
      title: 'Small-Batch Heritage Cooking',
      description:
        'Our traditional Kerala whole spices, stone-ground blends, and slow-cooked delicacies are prepared with generational skill in heavy cookware.'
    },
    {
      icon: Clock,
      title: 'Zero Chemical Preservatives',
      description:
        'Pure, unadulterated food sealed immediately after processing in multi-barrier pouches, locking in natural freshness without artificial additives.'
    }
  ];

  const brandPrinciples = [
    {
      number: '01',
      title: 'Authenticity Over Speed',
      detail: 'Traditional recipes handed down through generations, cooked with patience rather than industrial shortcuts.'
    },
    {
      number: '02',
      title: 'Ingredient Integrity',
      detail: 'Pure whole spices, stone-ground masalas, cold-pressed coconut oil, and regional staples. What is on the label is strictly what is inside.'
    },
    {
      number: '03',
      title: 'Farmer Partnerships',
      detail: 'Direct relationships with local farming families, supporting sustainable regional agriculture and equitable farmgate pricing.'
    },
    {
      number: '04',
      title: 'Rigorous Food Safety',
      detail: 'Certified production protocols, hygienic small-batch handling, and verified FSSAI regulatory compliance across every batch.'
    }
  ];

  return (
    <div className="min-h-screen bg-canvas pb-24 md:pb-16 text-content-primary">
      <Header />

      <main className="max-w-5xl mx-auto px-4 pt-4 sm:pt-6 space-y-10 sm:space-y-16">
        {/* 1. Hero Section: Editorial Headline & Kerala Roots (Strictly Zero Images) */}
        <section className="relative rounded-3xl bg-[#072C20] text-white p-6 sm:p-12 md:p-16 text-center overflow-hidden shadow-md">
          {/* Subtle CSS Decorative Ambient Gradients (No Images) */}
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#A67732]/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/30 pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4 sm:space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-[#FAD982]/30 text-[#FAD982] text-xs font-extrabold uppercase tracking-widest shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#FAD982]" />
              EST. KERALA, INDIA • HERITAGE FLAVOURS
            </span>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
              {displayHeroTitle}
              <span className="block text-xl sm:text-2xl font-normal text-amber-200 mt-1">
                Authentic Kerala Flavours, Rooted in Tradition.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-stone-200 leading-relaxed max-w-xl mx-auto font-sans font-normal">
              Bringing authentic Kerala whole spices, stone-ground blends, cold-pressed oils, and traditional culinary essentials from regional farms and heritage kitchens directly to your home.
            </p>
          </div>
        </section>

        {/* 2. Our Heritage Section (Authoritative Content from Database) */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#A67732]">
              OUR HERITAGE & ORIGINS
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              {aboutPage?.title && aboutPage.title !== 'Our Kerala Heritage & Pure Flavors'
                ? aboutPage.title
                : 'Preserving the Art of Traditional Kerala Delicacies'}
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-[#EAE5DC] p-6 sm:p-10 shadow-2xs space-y-6 text-content-secondary leading-relaxed text-sm sm:text-base">
            {aboutPage?.content && aboutPage.content !== 'Content is being updated by our editorial team.' ? (
              <MarkdownRenderer content={aboutPage.content} />
            ) : (
              <>
                <p>
                  In the fragrant kitchens of Kerala, food has never been about shortcuts. From the rhythmic hand-slicing of raw Nendran bananas harvested in the lush foothills of Wayanad, to the gentle slow simmering of caramelized jaggery and whole cashews in heavy brass urulis, great flavours require patience, respect, and generational skill.
                </p>
                <p>
                  ZaDa Foods was founded to honour these culinary traditions. In an era where mass manufacturing frequently replaces pure cold-pressed coconut oil with hydrogenated fats and artificial enhancers, we remain committed to traditional small-batch preparation that lets genuine Kerala ingredients shine.
                </p>
                <blockquote className="border-l-4 border-[#A67732] pl-4 sm:pl-6 py-2 my-4 bg-[#FAF7F2] rounded-r-xl font-serif text-base sm:text-lg text-[#072C20] italic font-semibold">
                  "We believe authentic flavour starts at the farm gate. When the bananas are freshly harvested and the oil is pure, nothing needs to be masked."
                </blockquote>
                <p>
                  From our signature crispy banana chips seasoned with coarse sea salt, to our Kozhikode black and cashew halwas cooked over hours, every ZaDa Foods delicacy is prepared with the same integrity we demand for our own families.
                </p>
              </>
            )}
          </div>
        </section>

        {/* 3. Craftsmanship & Production Practices */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#A67732]">
              THE KITCHEN STANDARD
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              How We Craft Our Delicacies
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {craftsmanshipPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="bg-white rounded-2xl border border-[#EAE5DC] p-6 shadow-2xs hover:border-[#D4A373]/60 transition-all space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#072C20]/10 flex items-center justify-center text-[#072C20]">
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#1C1917]">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Core Brand Principles */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#A67732]">
              OUR COMMITMENTS
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              Four Uncompromising Principles
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {brandPrinciples.map((principle) => (
              <div
                key={principle.number}
                className="bg-white rounded-2xl border border-[#EAE5DC] p-5 shadow-2xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-[#A67732] block mb-1">
                    {principle.number}
                  </span>
                  <h3 className="font-serif font-bold text-sm text-[#1C1917]">
                    {principle.title}
                  </h3>
                  <p className="text-xs text-content-secondary mt-1.5 leading-relaxed">
                    {principle.detail}
                  </p>
                </div>
                <div className="pt-2 border-t border-border-subtle flex items-center gap-1.5 text-[11px] font-semibold text-[#072C20]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Verified Standard</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Production Transparency & Kitchen Location */}
        <section className="bg-white rounded-3xl border border-[#EAE5DC] p-6 sm:p-10 shadow-2xs space-y-6">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#A67732]">
              ORIGIN & COMPLIANCE
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              Rooted in Kozhikode & Punalur, Kerala
            </h2>
            <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
              Every package is processed, batch-tested, and nitrogen-sealed in our hygienic certified packaging facilities adhering to central and state FSSAI safety codes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-canvas-subtle border border-border-subtle space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#072C20]">
                <MapPin className="w-4 h-4 text-[#A67732]" />
                <span>Facility Location</span>
              </div>
              <p className="text-content-secondary leading-relaxed text-[11px]">
                Malabar Heritage Snackworks<br />
                Wayanad Road, Kozhikode<br />
                Kerala, India - 673001
              </p>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EAE5DC]/60">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-content-muted font-semibold uppercase">FSSAI Certified</p>
                <p className="font-bold text-[#1C1917] font-mono mt-0.5">{settings.fssaiNumber || '21326145000345'}</p>
                <p className="text-[10px] text-content-muted mt-0.5">Central Food Safety License</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EAE5DC]/60">
              <HeartHandshake className="w-4 h-4 text-[#A67732]" />
              <div>
                <p className="text-[10px] text-content-muted font-semibold uppercase">Customer Care</p>
                <p className="font-bold text-[#1C1917] mt-0.5">{settings.supportPhone || '+91 75939 59235'}</p>
                <p className="text-[10px] text-content-muted mt-0.5">{settings.supportEmail || 'care@zadafoods.com'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Closing CTA: Links to Shop and Bulk Orders */}
        <section className="rounded-3xl bg-[#072C20] text-white p-8 sm:p-12 text-center space-y-5 shadow-sm">
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-white">
              Experience Authentic Kerala Flavours
            </h3>
            <p className="text-xs sm:text-sm text-stone-200">
              Explore our freshly fried banana chips, Kozhikode halwas, and festive sweet hampers delivered straight to your doorstep.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/shop"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#A67732] hover:bg-[#8F6428] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Explore The Shop</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/bulk-orders"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
            >
              <HeartHandshake className="w-4 h-4 text-[#FAD982]" />
              <span>Bulk & Corporate Enquiries</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};
