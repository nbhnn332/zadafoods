import React from 'react';
import { useFestival } from '../../context/FestivalContext';
import {
  CornerFlourish,
  FestivalMotif,
  ChristmasTreeMotif,
  FanousLanternMotif,
  NilavilakkuMotif,
  DiyaMotif,
  GiftBoxMotif,
  SnowAccumulationEdge,
  GoldenKonnaStrand,
  MosqueSilhouette,
  AkashKandilLantern
} from './FestivalMotifs';
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

      {/* Christmas Snow Scallop along Top Edge */}
      {preset === 'christmas' && (
        <div className="absolute top-0 inset-x-0 z-10 pointer-events-none overflow-hidden">
          <SnowAccumulationEdge />
        </div>
      )}

      {/* Onam Golden Konna strand hanging top-left */}
      {preset === 'onam' && !isSubtle && (
        <div className="absolute top-0 left-6 sm:left-12 z-10 pointer-events-none hidden sm:block">
          <GoldenKonnaStrand size={30} className="drop-shadow-sm" />
        </div>
      )}

      {/* Diwali Akash Kandil lantern hanging top-left */}
      {preset === 'diwali' && !isSubtle && (
        <div className="absolute top-1 left-6 sm:left-12 z-10 pointer-events-none hidden sm:block">
          <AkashKandilLantern size={28} color={accentColor} swing={true} className="drop-shadow-md" />
        </div>
      )}

      {/* Eid Arabian Mosque silhouette subtle bottom accent */}
      {preset === 'eid' && !isSubtle && (
        <div className="absolute bottom-0 inset-x-0 z-10 pointer-events-none flex justify-center opacity-25">
          <MosqueSilhouette height={28} color={accentColor} />
        </div>
      )}

      {/* Top-Right Corner Motif / Flourish */}
      <CornerFlourish
        preset={preset}
        position="top-right"
        size={flourishSize}
        color={accentColor}
      />

      {/* Top-Right Themed Illustration */}
      <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 flex items-center gap-1.5 drop-shadow-md">
        {preset === 'christmas' ? (
          <div className="flex items-center gap-1 bg-black/30 backdrop-blur-xs px-2 py-1 rounded-full border border-white/20">
            <ChristmasTreeMotif size={18} color="#22C55E" />
            <GiftBoxMotif size={16} color="#DC2626" ribbonColor="#FCD34D" />
          </div>
        ) : preset === 'eid' ? (
          <div className="flex items-center gap-1">
            <FanousLanternMotif size={22} color={accentColor} swing={true} />
          </div>
        ) : preset === 'onam' ? (
          <div className="flex items-center gap-1 bg-black/25 backdrop-blur-xs px-2 py-1 rounded-full border border-amber-300/30">
            <NilavilakkuMotif size={20} color="#F59E0B" animated={true} />
          </div>
        ) : preset === 'diwali' ? (
          <div className="flex items-center gap-1 bg-black/30 backdrop-blur-xs px-2 py-1 rounded-full border border-amber-400/40">
            <DiyaMotif size={20} color="#F59E0B" />
          </div>
        ) : (
          <FestivalMotif preset={preset} size={22} color={accentColor} />
        )}
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
        <div className="absolute bottom-3 right-4 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-black/50 backdrop-blur-xs text-amber-200 border border-amber-300/40 shadow-xs">
          <FestivalMotif preset={preset} size={14} color={accentColor} />
          <span>{effectiveTheme.announcementBadge}</span>
        </div>
      )}
    </div>
  );
};
