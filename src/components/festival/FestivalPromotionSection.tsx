import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFestival } from '../../context/FestivalContext';
import { FestivalMotif, CornerFlourish } from './FestivalMotifs';

interface FestivalPromotionSectionProps {
  className?: string;
}

export const FestivalPromotionSection: React.FC<FestivalPromotionSectionProps> = ({
  className = 'my-8 sm:my-10'
}) => {
  const { effectiveTheme, isFestivalActive } = useFestival();

  if (!effectiveTheme || !isFestivalActive || effectiveTheme.preset === 'default') {
    return null;
  }

  if (effectiveTheme.placements?.promoBanners === false) {
    return null;
  }

  const promotions = effectiveTheme.promotions || [];
  if (promotions.length === 0) {
    return null;
  }

  const { preset, accentColor } = effectiveTheme;

  return (
    <section className={`space-y-4 ${className}`} aria-labelledby="festival-promotions-heading">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FestivalMotif preset={preset} size={20} color={accentColor} />
          <h2
            id="festival-promotions-heading"
            className="font-serif font-bold text-lg sm:text-2xl text-[#1C1917]"
          >
            {effectiveTheme.name} Curations & Hampers
          </h2>
        </div>
        <Link
          to="/shop"
          className="text-xs sm:text-sm font-bold hover:underline flex items-center gap-1"
          style={{ color: accentColor }}
        >
          <span>View All Hampers</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div
        className={`grid gap-4 ${
          promotions.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
        }`}
      >
        {promotions.map((promo) => (
          <div
            key={promo.id}
            className="relative rounded-2xl sm:rounded-3xl overflow-hidden p-6 sm:p-8 text-white flex flex-col justify-between border shadow-sm transition-all duration-300 hover:shadow-md group"
            style={{
              backgroundColor: promo.backgroundColor || '#072C20',
              borderColor: `${promo.accentColor || accentColor}50`
            }}
          >
            {/* Corner flourishes */}
            <CornerFlourish
              preset={preset}
              position="top-right"
              size={40}
              color={promo.accentColor || accentColor}
            />
            <CornerFlourish
              preset={preset}
              position="bottom-left"
              size={40}
              color={promo.accentColor || accentColor}
            />

            <div className="relative z-10 space-y-2.5 max-w-lg">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-stone-900 shadow-2xs"
                  style={{ backgroundColor: effectiveTheme.badgeColor || '#FDE68A' }}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{promo.badge || 'Festive Curation'}</span>
                </span>
                {promo.tagline && (
                  <span className="text-[11px] font-serif tracking-wide text-stone-300 uppercase">
                    {promo.tagline}
                  </span>
                )}
              </div>

              <h3 className="font-serif font-bold text-xl sm:text-2xl leading-tight text-white drop-shadow-xs">
                {promo.title}
              </h3>

              <p className="text-xs sm:text-sm text-stone-200/90 leading-relaxed font-normal">
                {promo.subtitle}
              </p>
            </div>

            <div className="relative z-10 pt-5">
              <Link
                to={promo.ctaLink || '/shop'}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-stone-900 text-xs sm:text-sm font-bold shadow-sm transition-transform active:scale-[0.99] group-hover:translate-x-1"
                style={{ backgroundColor: effectiveTheme.badgeColor || '#FDE68A' }}
              >
                <span>{promo.ctaText || 'Order Now'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
