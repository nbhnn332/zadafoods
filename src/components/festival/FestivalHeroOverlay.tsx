import React from 'react';
import { useFestival } from '../../context/FestivalContext';
import { CornerFlourish, FestivalMotif } from './FestivalMotifs';
import { FestivalCountdown } from './FestivalCountdown';

export const FestivalHeroOverlay: React.FC = () => {
  const { effectiveTheme, isFestivalActive } = useFestival();

  if (!effectiveTheme || !isFestivalActive || effectiveTheme.preset === 'default') {
    return null;
  }

  if (effectiveTheme.placements?.heroBanners === false) {
    return null;
  }

  const { intensity, accentColor, preset } = effectiveTheme;
  const isSubtle = intensity === 'subtle';
  const isGrand = intensity === 'grand' || intensity === 'festive';

  const opacity = isSubtle ? 0.75 : 1.0;
  const flourishSize = isSubtle ? 36 : isGrand ? 56 : 46;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-2xl sm:rounded-3xl transition-opacity duration-300"
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Subtle festive perimeter glow or hairline border */}
      <div
        className="absolute inset-0 rounded-2xl sm:rounded-3xl border pointer-events-none"
        style={{
          borderColor: isSubtle ? `${accentColor}33` : `${accentColor}77`
        }}
      />

      {/* Top-Right Corner Flourish & Motif */}
      <CornerFlourish
        preset={preset}
        position="top-right"
        size={flourishSize}
        color={accentColor}
      />
      <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 flex items-center gap-1.5 drop-shadow-md">
        <FestivalMotif preset={preset} size={22} color={accentColor} />
      </div>

      {/* Bottom-Left Corner Flourish */}
      <CornerFlourish
        preset={preset}
        position="bottom-left"
        size={flourishSize}
        color={accentColor}
      />

      {/* Top-Left Corner Flourish for Grand */}
      {isGrand && (
        <CornerFlourish
          preset={preset}
          position="top-left"
          size={36}
          color={accentColor}
        />
      )}

      {/* Inline Countdown Display for Hero when active and placed */}
      {effectiveTheme.countdown?.enabled && (
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 hidden sm:flex items-center pointer-events-auto">
          <FestivalCountdown inline />
        </div>
      )}

      {/* Subtle festive badge pill when intensity is rich or grand */}
      {!effectiveTheme.countdown?.enabled && (intensity === 'rich' || isGrand) && effectiveTheme.announcementBadge && (
        <div className="absolute bottom-3 right-4 hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/40 backdrop-blur-xs text-amber-200 border border-amber-300/30">
          <FestivalMotif preset={preset} size={14} color={accentColor} />
          <span>{effectiveTheme.announcementBadge}</span>
        </div>
      )}
    </div>
  );
};
