import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useFestival } from '../../context/FestivalContext';
import { FestivalMotif, DiyaMotif, NilavilakkuMotif } from './FestivalMotifs';

export const FestivalAtmosphere: React.FC = () => {
  const { effectiveTheme, isFestivalActive } = useFestival();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isThemeActive = Boolean(effectiveTheme && isFestivalActive && effectiveTheme.preset !== 'default');
  const intensity = effectiveTheme?.intensity || 'balanced';

  // Generate deterministic particle descriptors for performance
  const particleCount =
    intensity === 'subtle' ? 10 :
    intensity === 'balanced' || intensity === 'moderate' ? 18 :
    intensity === 'rich' ? 28 : 40;

  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => {
      // Deterministic pseudo-randomness based on index
      const left = `${((i * 37) % 96) + 2}%`;
      const duration = 6 + ((i * 3) % 8); // 6s - 14s
      const delay = -((i * 1.5) % 10); // staggered starting offsets
      const size = 6 + ((i * 2) % 10); // 6px - 16px
      const opacityVal = 0.4 + ((i * 7) % 50) / 100;
      return { id: i, left, duration, delay, size, opacityVal };
    });
  }, [particleCount]);

  if (isAdminRoute || !isThemeActive || !effectiveTheme) {
    return null;
  }

  const { preset, accentColor, atmosphere, placements } = effectiveTheme;

  if (placements?.ambientBackground === false) {
    return null;
  }

  const showParticles = placements?.fallingParticles !== false && atmosphere?.enableFloatingParticles !== false;

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

      {/* 2. Atmospheric Ambient Corner Glows (Balanced, Rich & Grand) */}
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

      {/* 3. Floating / Falling Festival Particles */}
      {showParticles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {preset === 'christmas' && (
            // Gentle Snowfall across storefront
            particles.map((p) => (
              <div
                key={p.id}
                className="particle-snow absolute -top-4 rounded-full bg-white blur-[0.4px]"
                style={{
                  left: p.left,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  opacity: p.opacityVal,
                  boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)',
                  ['--fall-duration' as any]: `${p.duration}s`,
                  ['--fall-delay' as any]: `${p.delay}s`
                }}
              />
            ))
          )}

          {preset === 'onam' && (
            // Falling Kerala Marigold & Kasavu Petals
            particles.map((p) => {
              const isOrange = p.id % 2 === 0;
              return (
                <div
                  key={p.id}
                  className="particle-petal absolute -top-4"
                  style={{
                    left: p.left,
                    width: `${p.size * 1.2}px`,
                    height: `${p.size * 0.8}px`,
                    backgroundColor: isOrange ? '#EA580C' : '#EAB308',
                    borderRadius: '50% 0 50% 50%',
                    opacity: p.opacityVal * 0.85,
                    ['--fall-duration' as any]: `${p.duration * 1.1}s`,
                    ['--fall-delay' as any]: `${p.delay}s`
                  }}
                />
              );
            })
          )}

          {preset === 'diwali' && (
            // Golden Sparks & Glowing Embers rising upwards
            particles.map((p) => (
              <div
                key={p.id}
                className="particle-ember absolute -bottom-4 rounded-full"
                style={{
                  left: p.left,
                  width: `${p.size * 0.7}px`,
                  height: `${p.size * 0.7}px`,
                  backgroundColor: p.id % 3 === 0 ? '#F59E0B' : '#FCD34D',
                  boxShadow: '0 0 8px #F59E0B',
                  opacity: p.opacityVal * 0.8,
                  ['--fall-duration' as any]: `${p.duration * 0.9}s`,
                  ['--fall-delay' as any]: `${p.delay}s`
                }}
              />
            ))
          )}

          {preset === 'eid' && (
            // Twinkling Golden Stars & Subtle Night Sky Glimmer
            particles.map((p) => (
              <div
                key={p.id}
                className="particle-star absolute"
                style={{
                  left: p.left,
                  top: `${(p.id * 19) % 90}%`,
                  width: `${p.size * 0.8}px`,
                  height: `${p.size * 0.8}px`,
                  backgroundColor: '#FDE047',
                  borderRadius: '50%',
                  boxShadow: '0 0 6px #FDE047',
                  opacity: p.opacityVal * 0.75,
                  ['--fall-duration' as any]: `${2 + (p.id % 4)}s`,
                  ['--fall-delay' as any]: `${p.delay}s`
                }}
              />
            ))
          )}

          {preset === 'new_year' && (
            // Champagne Confetti & Golden Sparkles
            particles.map((p) => (
              <div
                key={p.id}
                className="particle-snow absolute -top-4"
                style={{
                  left: p.left,
                  width: `${p.size * 0.9}px`,
                  height: `${p.size * 0.9}px`,
                  backgroundColor: p.id % 2 === 0 ? '#D4AF37' : '#E2E8F0',
                  transform: `rotate(${p.id * 45}deg)`,
                  opacity: p.opacityVal,
                  boxShadow: '0 0 4px #D4AF37',
                  ['--fall-duration' as any]: `${p.duration}s`,
                  ['--fall-delay' as any]: `${p.delay}s`
                }}
              />
            ))
          )}
        </div>
      )}

      {/* 4. Side Gutter Festive Embellishments (Rich & Grand on large screens) */}
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
  const isGrand = intensity === 'grand' || intensity === 'festive';

  return (
    <div className={`relative flex items-center justify-center ${className}`} aria-hidden="true">
      {/* Left Ornamental Line */}
      <div
        className="flex-1 h-px max-w-xs transition-colors"
        style={{
          background: `linear-gradient(to left, ${accentColor}, transparent)`
        }}
      />

      {/* Center Festive Icon */}
      <div className="mx-4 flex items-center gap-2">
        {preset === 'onam' ? (
          <NilavilakkuMotif size={22} color={accentColor} />
        ) : preset === 'diwali' ? (
          <DiyaMotif size={20} color={accentColor} />
        ) : (
          <FestivalMotif preset={preset} size={20} color={accentColor} />
        )}
        {isGrand && (
          <span className="text-[10px] font-serif font-bold uppercase tracking-widest" style={{ color: accentColor }}>
            {effectiveTheme.name}
          </span>
        )}
      </div>

      {/* Right Ornamental Line */}
      <div
        className="flex-1 h-px max-w-xs transition-colors"
        style={{
          background: `linear-gradient(to right, ${accentColor}, transparent)`
        }}
      />
    </div>
  );
};
