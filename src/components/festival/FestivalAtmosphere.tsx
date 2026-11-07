import React from 'react';
import { useFestival } from '../../context/FestivalContext';
import { FestivalMotif } from './FestivalMotifs';

export const FestivalAtmosphere: React.FC = () => {
  const { effectiveTheme, isFestivalActive } = useFestival();

  if (!effectiveTheme || !isFestivalActive || effectiveTheme.preset === 'default') {
    return null;
  }

  const { preset, intensity, accentColor, atmosphere, placements } = effectiveTheme;

  if (placements?.ambientBackground === false) {
    return null;
  }

  const opacity =
    intensity === 'subtle'
      ? 0.02
      : intensity === 'balanced' || intensity === 'moderate'
      ? 0.04
      : intensity === 'rich'
      ? 0.07
      : 0.1; // grand

  const patternType = atmosphere?.patternType || (
    preset === 'diwali' ? 'rangoli' :
    preset === 'christmas' ? 'snowflakes' :
    preset === 'new_year' ? 'stars' :
    preset === 'onam' ? 'pookalam' :
    preset === 'eid' ? 'arabesque' : 'stars'
  );

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden transition-opacity duration-700 ease-in-out"
      aria-hidden="true"
      style={{
        backgroundColor: atmosphere?.pageBackground || undefined
      }}
    >
      {/* 1. Subtle SVG Pattern Tile Overlay */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          opacity: opacity,
          backgroundImage: getPatternDataUri(patternType, accentColor),
          backgroundRepeat: 'repeat',
          backgroundSize: patternType === 'snowflakes' ? '120px 120px' : '90px 90px'
        }}
      />

      {/* 2. Delicate Atmospheric Corner Glows (Balanced, Rich & Grand) */}
      {intensity !== 'subtle' && (
        <>
          <div
            className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl transition-all duration-700 pointer-events-none"
            style={{
              backgroundColor: accentColor,
              opacity: intensity === 'grand' ? 0.08 : 0.04
            }}
          />
          <div
            className="absolute top-1/2 -left-32 w-80 h-80 rounded-full blur-3xl transition-all duration-700 pointer-events-none"
            style={{
              backgroundColor: accentColor,
              opacity: intensity === 'grand' ? 0.06 : 0.03
            }}
          />
        </>
      )}

      {/* 3. Side Gutter Festive Embellishments (Rich & Grand on large screens) */}
      {(intensity === 'rich' || intensity === 'grand' || intensity === 'festive') && (
        <div className="hidden xl:flex flex-col justify-between absolute inset-y-12 left-4 right-4 pointer-events-none opacity-40">
          <div className="flex justify-between">
            <FestivalMotif preset={preset} size={28} color={accentColor} />
            <FestivalMotif preset={preset} size={28} color={accentColor} />
          </div>
          <div className="flex justify-between">
            <FestivalMotif preset={preset} size={24} color={accentColor} />
            <FestivalMotif preset={preset} size={24} color={accentColor} />
          </div>
          <div className="flex justify-between">
            <FestivalMotif preset={preset} size={28} color={accentColor} />
            <FestivalMotif preset={preset} size={28} color={accentColor} />
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// Subtle SVG Background Patterns encoded as clean Data URIs
// ----------------------------------------------------------------------
function getPatternDataUri(type: string, color: string): string {
  const encColor = encodeURIComponent(color || '#D97706');

  if (type === 'snowflakes') {
    return `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 10V110M10 60H110M25 25L95 95M95 25L25 95' stroke='${encColor}' stroke-width='0.8' stroke-linecap='round' stroke-dasharray='4 8'/%3E%3Ccircle cx='60' cy='60' r='3' fill='${encColor}'/%3E%3C/svg%3E")`;
  }

  if (type === 'rangoli' || type === 'pookalam') {
    return `url("data:image/svg+xml,%3Csvg width='90' height='90' viewBox='0 0 90 90' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='45' cy='45' r='20' stroke='${encColor}' stroke-width='0.8' stroke-dasharray='2 3'/%3E%3Ccircle cx='45' cy='45' r='10' stroke='${encColor}' stroke-width='0.6'/%3E%3Cpath d='M45 15V75M15 45H75M24 24L66 66M66 24L24 66' stroke='${encColor}' stroke-width='0.6'/%3E%3Ccircle cx='45' cy='45' r='2' fill='${encColor}'/%3E%3C/svg%3E")`;
  }

  if (type === 'arabesque') {
    return `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='40,10 70,40 40,70 10,40' stroke='${encColor}' stroke-width='0.8' fill='none'/%3E%3Cpolygon points='40,20 60,40 40,60 20,40' stroke='${encColor}' stroke-width='0.5' stroke-dasharray='2 2' fill='none'/%3E%3Ccircle cx='40' cy='40' r='2' fill='${encColor}'/%3E%3C/svg%3E")`;
  }

  // Default: Stars / Sparkles
  return `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 25L42 35L52 37L42 39L40 49L38 39L28 37L38 35Z' fill='${encColor}' fill-opacity='0.6'/%3E%3Ccircle cx='20' cy='20' r='1' fill='${encColor}'/%3E%3Ccircle cx='60' cy='60' r='1' fill='${encColor}'/%3E%3C/svg%3E")`;
}

// ----------------------------------------------------------------------
// Ornamental Section Divider between Storefront Sections
// ----------------------------------------------------------------------
interface FestivalDividerProps {
  className?: string;
}

export const FestivalDivider: React.FC<FestivalDividerProps> = ({ className = 'my-8 sm:my-10' }) => {
  const { effectiveTheme, isFestivalActive } = useFestival();

  if (!effectiveTheme || !isFestivalActive || effectiveTheme.preset === 'default') {
    return <hr className={`border-[#EAE5DC] ${className}`} />;
  }

  if (effectiveTheme.placements?.sectionDividers === false) {
    return <hr className={`border-[#EAE5DC] ${className}`} />;
  }

  const { preset, accentColor, intensity } = effectiveTheme;

  return (
    <div className={`relative flex items-center justify-center ${className}`} aria-hidden="true">
      {/* Left Ornamental Line */}
      <div
        className="flex-1 h-px transition-all"
        style={{
          background: `linear-gradient(to right, transparent, ${accentColor}80, ${accentColor})`
        }}
      />

      {/* Center Motif with Flourish */}
      <div
        className="mx-3 sm:mx-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 border shadow-2xs backdrop-blur-xs transition-transform hover:scale-105"
        style={{ borderColor: `${accentColor}40` }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
        <FestivalMotif preset={preset} size={18} color={accentColor} />
        {intensity !== 'subtle' && (
          <span className="text-[10px] font-serif font-semibold tracking-wider uppercase text-stone-700 hidden sm:inline">
            {effectiveTheme.name}
          </span>
        )}
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
      </div>

      {/* Right Ornamental Line */}
      <div
        className="flex-1 h-px transition-all"
        style={{
          background: `linear-gradient(to left, transparent, ${accentColor}80, ${accentColor})`
        }}
      />
    </div>
  );
};
