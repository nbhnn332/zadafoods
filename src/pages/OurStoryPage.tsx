import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Flame,
  HeartHandshake,
  Clock,
  UtensilsCrossed,
  Store,
  Phone,
  Mail,
  Award
} from 'lucide-react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Footer } from '../components/Footer';
import { useAdminData } from '../context/AdminDataContext';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export const OurStoryPage: React.FC = () => {
  const { settings, storeContent } = useAdminData();
  const aboutPage = storeContent.find((p) => p.slug === 'about' || p.slug === 'our-story');

  const defaultHeroTitle = 'ZaDa Foods — Authentic Arabian Taste.';
  const displayHeroTitle =
    aboutPage?.title &&
    !aboutPage.title.toLowerCase().includes('kerala') &&
    !aboutPage.title.toLowerCase().includes('chips')
      ? aboutPage.title
      : defaultHeroTitle;

  const displayStoryHeading =
    aboutPage?.title &&
    !aboutPage.title.toLowerCase().includes('kerala') &&
    !aboutPage.title.toLowerCase().includes('chips')
      ? aboutPage.title
      : 'Crafted for Taste, Tradition & Togetherness';

  const missionPillars = [
    {
      number: '01',
      title: 'Authentic Taste First',
      description:
        'Bring genuine Arabian flavours and time-honoured spice traditions into modern homes with uncompromising authenticity.',
      icon: Sparkles
    },
    {
      number: '02',
      title: 'Convenience Without Compromise',
      description:
        'Make elaborate festive dishes like authentic Mandhi effortless to prepare at home, without sacrificing aroma, texture, or quality.',
      icon: Clock
    },
    {
      number: '03',
      title: 'Made for Sharing',
      description:
        'Create foods that inspire families, friends, and communities to gather, celebrate milestones, and create lasting memories together.',
      icon: HeartHandshake
    },
    {
      number: '04',
      title: 'Quality You Can Trust',
      description:
        'Source the finest whole spices, aged basmati rice, and natural ingredients with strict hygiene and standards you are proud to serve.',
      icon: ShieldCheck
    }
  ];

  const offerings = [
    {
      title: 'Signature Mandhi Kit',
      description:
        'A complete, easy-to-use kit crafted with authentic Arabian spices and premium aged basmati rice, allowing anyone to prepare fragrant, restaurant-style Mandhi at home.',
      icon: Flame,
      tag: 'Arabian Heritage'
    },
    {
      title: 'Curated Feasts & Combo Packs',
      description:
        'Thoughtfully paired culinary bundles and banquet kits designed for memorable family gatherings, weekend feasts, and festive dining.',
      icon: UtensilsCrossed,
      tag: 'Celebration Bundles'
    },
    {
      title: 'Cakes & Special Orders',
      description:
        'Freshly baked celebration cakes, festive dessert boxes, and custom orders prepared for family milestones, weddings, and holidays.',
      icon: Award,
      tag: 'Celebrations'
    },
    {
      title: 'Retail & Hospitality Supply',
      description:
        'Supplying homes, restaurants, caterers, and retail partners with bulk food packs, specialty Mandhi kits, and wholesale celebration orders.',
      icon: Store,
      tag: 'B2B & Retail'
    }
  ];

  const differentiators = [
    {
      title: 'Authentic Arabian Culinary Roots',
      detail:
        'Inspired by centuries-old Arabian cooking traditions, balanced spice profiles, and slow-cooking techniques that evoke authentic banquet feasts.'
    },
    {
      title: 'Premium Quality Ingredients',
      detail:
        'We carefully choose every spice, grain, and aromatic to ensure consistent flavour, rich aroma, and perfect texture in every pack.'
    },
    {
      title: 'No Unnecessary Additives',
      detail:
        'We focus on real spices, natural seasonings, and honest preparation methods without overloading our products with artificial preservatives.'
    },
    {
      title: 'Convenient, Home-Friendly Solutions',
      detail:
        'Our kits and specialties are designed for real homes and busy kitchens, offering royal dining experiences without complicated cooking.'
    },
    {
      title: 'Crafted with Passion & Tradition',
      detail:
        'Every recipe is tested, perfected, and prepared with the same care and respect we would put into food for our own loved ones.'
    },
    {
      title: 'Flavours Made for Celebrations',
      detail:
        'From weekday family dinners to Eid gatherings, milestone anniversaries, and festive celebrations, our food is made to be shared.'
    }
  ];

  const supportPhone = settings.supportPhone || '+91 94003 55207';
  const secondaryPhone = settings.secondaryPhone || '+91 75939 59235';
  const supportEmail = settings.supportEmail || 'care@zadafoods.com';
  const fssaiNumber = settings.fssaiNumber || '21326145000345';

  return (
    <div className="min-h-screen bg-canvas pb-24 md:pb-16 text-content-primary">
      <Header />

      <main className="max-w-5xl mx-auto px-4 pt-4 sm:pt-6 space-y-10 sm:space-y-16">
        {/* 1. Hero Section: Editorial Headline (Strictly Zero Images) */}
        <section className="relative rounded-3xl bg-[#072C20] text-white p-6 sm:p-12 md:p-16 text-center overflow-hidden shadow-md">
          {/* Subtle CSS Decorative Ambient Gradients (No Images) */}
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#A67732]/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/30 pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4 sm:space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-[#FAD982]/30 text-[#FAD982] text-xs font-extrabold uppercase tracking-widest shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#FAD982]" />
              ABOUT ZADA FOODS • AUTHENTIC ARABIAN TASTE
            </span>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
              {displayHeroTitle}
              <span className="block text-lg sm:text-2xl font-normal text-amber-200 mt-2">
                Authentic Arabian Taste | Made for Sharing
              </span>
            </h1>

            <p className="text-sm sm:text-base text-stone-200 leading-relaxed max-w-xl mx-auto font-sans font-normal">
              ZaDa Foods was born from a passion for authentic flavours, quality ingredients, and the warmth of shared tables. Inspired by the timeless culinary heritage of Arabian cuisine, we bring thoughtfully crafted dining experiences to every family gathering.
            </p>
          </div>
        </section>

        {/* 2. Our Story Narrative */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#A67732]">
              OUR STORY
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              {displayStoryHeading}
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-[#EAE5DC] p-6 sm:p-10 shadow-2xs space-y-6 text-content-secondary leading-relaxed text-sm sm:text-base">
            {aboutPage?.content &&
            aboutPage.content !== 'Content is being updated by our editorial team.' &&
            !aboutPage.content.toLowerCase().includes('kerala') &&
            !aboutPage.content.toLowerCase().includes('chips') ? (
              <MarkdownRenderer content={aboutPage.content} />
            ) : (
              <>
                <p>
                  ZaDa Foods was founded on a singular passion: bringing the rich, aromatic authenticity of Arabian cuisine into family homes. We believe great food is the cornerstone of connection, celebrations, and cherished memories.
                </p>
                <p>
                  From our signature Mandhi Kit to our curated celebration feast bundles, each product is meticulously developed with pure spices, authentic recipes, and convenient home preparation in mind.
                </p>
                <blockquote className="border-l-4 border-[#A67732] pl-4 sm:pl-6 py-2 my-4 bg-[#FAF7F2] rounded-r-xl font-serif text-base sm:text-lg text-[#072C20] italic font-semibold">
                  "We believe great food brings people closer — whether it's a family dinner, a celebration, or a joyous gathering of friends."
                </blockquote>
              </>
            )}
          </div>
        </section>

        {/* 3. Our Vision & Mission */}
        <section className="space-y-8">
          {/* Vision Banner */}
          <div className="rounded-2xl bg-[#072C20] text-white p-6 sm:p-8 relative overflow-hidden shadow-sm">
            <div className="max-w-2xl mx-auto text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#FAD982]">
                OUR VISION
              </span>
              <p className="font-serif text-lg sm:text-2xl font-bold leading-relaxed text-white">
                "To become a trusted household food brand celebrated for authentic Arabian taste, delivering culinary excellence, convenience, and togetherness across every home."
              </p>
            </div>
          </div>

          {/* Mission 4 Pillars */}
          <div className="space-y-4">
            <div className="text-center max-w-2xl mx-auto space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-[#A67732]">
                OUR MISSION
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1917]">
                Four Guiding Principles
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {missionPillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.number}
                    className="bg-white rounded-2xl border border-[#EAE5DC] p-5 shadow-2xs flex flex-col justify-between space-y-3 hover:border-[#D4A373]/60 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-[#A67732]">
                          {pillar.number}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-[#072C20]/10 flex items-center justify-center text-[#072C20]">
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <h4 className="font-serif font-bold text-sm text-[#1C1917]">
                        {pillar.title}
                      </h4>
                      <p className="text-xs text-content-secondary mt-1.5 leading-relaxed">
                        {pillar.description}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-border-subtle flex items-center gap-1.5 text-[11px] font-semibold text-[#072C20]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>ZaDa Standard</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. What We Offer */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#A67732]">
              WHAT WE OFFER
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              Signature Collections & Offerings
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {offerings.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white rounded-2xl border border-[#EAE5DC] p-6 shadow-2xs hover:border-[#D4A373]/60 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#072C20]/10 flex items-center justify-center text-[#072C20]">
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FAF7F2] text-[#A67732] border border-[#EAE5DC]">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#1C1917]">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. What Makes ZaDa Foods Different */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#A67732]">
              THE ZADA DIFFERENCE
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              What Makes ZaDa Foods Different
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {differentiators.map((diff, idx) => (
              <div
                key={diff.title}
                className="bg-white rounded-2xl border border-[#EAE5DC] p-5 shadow-2xs space-y-2 hover:border-[#D4A373]/60 transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#A67732]">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <h3 className="font-serif font-bold text-sm text-[#1C1917]">
                    {diff.title}
                  </h3>
                </div>
                <p className="text-xs text-content-secondary leading-relaxed pl-5">
                  {diff.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Authenticity, Verified Compliance & Support */}
        <section className="bg-white rounded-3xl border border-[#EAE5DC] p-6 sm:p-10 shadow-2xs space-y-6">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#A67732]">
              AUTHENTICITY & STANDARDS
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              Certified Quality, Transparent Service
            </h2>
            <p className="text-xs sm:text-sm text-content-secondary leading-relaxed">
              Every package is crafted with utmost care, adhering to strict food safety protocols and high quality standards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* FSSAI Registration */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FAF7F2] border border-[#EAE5DC]">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-content-muted font-semibold uppercase tracking-wider">
                  FSSAI Certified
                </p>
                <p className="font-bold text-[#1C1917] font-mono mt-0.5 text-sm">
                  {fssaiNumber}
                </p>
                <p className="text-[10px] text-content-muted mt-0.5">
                  Food Safety Standards Authority of India
                </p>
              </div>
            </div>

            {/* Official Support Hotline */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FAF7F2] border border-[#EAE5DC]">
              <Phone className="w-5 h-5 text-[#A67732] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-content-muted font-semibold uppercase tracking-wider">
                  Customer Hotlines
                </p>
                <a
                  href={`tel:${supportPhone.replace(/\s+/g, '')}`}
                  className="block font-bold text-[#1C1917] hover:text-[#A67732] transition-colors text-xs sm:text-sm mt-0.5"
                >
                  {supportPhone}
                </a>
                <a
                  href={`tel:${secondaryPhone.replace(/\s+/g, '')}`}
                  className="block font-bold text-[#1C1917] hover:text-[#A67732] transition-colors text-xs sm:text-sm mt-0.5"
                >
                  {secondaryPhone}
                </a>
              </div>
            </div>

            {/* Verified Email */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FAF7F2] border border-[#EAE5DC]">
              <Mail className="w-5 h-5 text-[#A67732] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-content-muted font-semibold uppercase tracking-wider">
                  Support Email
                </p>
                <a
                  href={`mailto:${supportEmail}`}
                  className="block font-bold text-[#1C1917] hover:text-[#A67732] transition-colors text-xs sm:text-sm mt-0.5"
                >
                  {supportEmail}
                </a>
                <p className="text-[10px] text-content-muted mt-0.5">
                  Direct Inquiries & Assistance
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Closing Brand Statement & CTA */}
        <section className="rounded-3xl bg-[#072C20] text-white p-8 sm:p-12 text-center space-y-6 shadow-sm">
          <div className="max-w-xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#FAD982]">
              CLOSING BRAND STATEMENT
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-white">
              ZaDa Foods — Authentic Arabian Taste.
            </h3>
            <p className="text-sm sm:text-base font-serif italic text-amber-200">
              Crafted for Memorable Food Experiences | Made for Sharing
            </p>
            <p className="text-xs sm:text-sm text-stone-200 pt-1">
              Explore our signature Mandhi kits, curated feast collections, and celebration bundles.
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
