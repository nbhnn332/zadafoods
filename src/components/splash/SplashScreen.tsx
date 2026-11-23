import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFestival } from '../../context/FestivalContext';
import { FestivalPreset } from '../../types/festival';

interface SplashScreenProps {
  /** Optional override to force display even if already shown in session */
  forceShow?: boolean;
  /** Optional callback fired when splash finishes exit transition */
  onComplete?: () => void;
  /** Minimum display duration in ms before transition can commence (default 1800ms) */
  minDisplayDuration?: number;
}

interface LuxurySplashTheme {
  backgroundClass: string;
  backgroundStyle: React.CSSProperties;
  glowColor: string;
  accentGold: string;
  richGold: string;
  plaqueBorder: string;
  badgeLabel?: string;
  particleColor: string;
}

const LUXURY_SPLASH_THEMES: Record<FestivalPreset, LuxurySplashTheme> = {
  default: {
    backgroundClass: 'bg-[#FBF8F2]',
    backgroundStyle: {
      background: 'radial-gradient(ellipse at 50% 42%, #FFFFFF 0%, #FBF8F2 50%, #F2E7D5 100%)'
    },
    glowColor: 'rgba(184, 134, 59, 0.18)',
    accentGold: '#B8863B',
    richGold: '#916322',
    plaqueBorder: 'rgba(184, 134, 59, 0.35)',
    particleColor: '#B8863B'
  },
  eid: {
    backgroundClass: 'bg-[#FBF8F2]',
    backgroundStyle: {
      background: 'radial-gradient(ellipse at 50% 42%, #FFFFFF 0%, #FAF6EE 50%, #EFE5D0 100%)'
    },
    glowColor: 'rgba(184, 134, 59, 0.22)',
    accentGold: '#B8863B',
    richGold: '#8C5E1E',
    plaqueBorder: 'rgba(184, 134, 59, 0.45)',
    badgeLabel: 'Eid Festive Selection',
    particleColor: '#B8863B'
  },
  christmas: {
    backgroundClass: 'bg-[#FBF8F2]',
    backgroundStyle: {
      background: 'radial-gradient(ellipse at 50% 42%, #FFFFFF 0%, #FBF7F0 50%, #F3EAE0 100%)'
    },
    glowColor: 'rgba(184, 134, 59, 0.20)',
    accentGold: '#C59A45',
    richGold: '#966D26',
    plaqueBorder: 'rgba(197, 154, 69, 0.45)',
    badgeLabel: 'Christmas Celebration',
    particleColor: '#C59A45'
  },
  onam: {
    backgroundClass: 'bg-[#FBF8F2]',
    backgroundStyle: {
      background: 'radial-gradient(ellipse at 50% 42%, #FFFFFF 0%, #FAF5EA 50%, #F1E6CC 100%)'
    },
    glowColor: 'rgba(202, 138, 4, 0.20)',
    accentGold: '#B8863B',
    richGold: '#8F6428',
    plaqueBorder: 'rgba(184, 134, 59, 0.45)',
    badgeLabel: 'Festive Kasavu Edition',
    particleColor: '#CA8A04'
  },
  diwali: {
    backgroundClass: 'bg-[#FBF8F2]',
    backgroundStyle: {
      background: 'radial-gradient(ellipse at 50% 42%, #FFFFFF 0%, #FAF5EE 50%, #F2E5D4 100%)'
    },
    glowColor: 'rgba(217, 119, 6, 0.20)',
    accentGold: '#B8863B',
    richGold: '#916322',
    plaqueBorder: 'rgba(217, 119, 6, 0.40)',
    badgeLabel: 'Deepavali Special',
    particleColor: '#D97706'
  },
  new_year: {
    backgroundClass: 'bg-[#FBF8F2]',
    backgroundStyle: {
      background: 'radial-gradient(ellipse at 50% 42%, #FFFFFF 0%, #F9F7F3 50%, #EDE7DD 100%)'
    },
    glowColor: 'rgba(184, 134, 59, 0.20)',
    accentGold: '#B8863B',
    richGold: '#916322',
    plaqueBorder: 'rgba(184, 134, 59, 0.40)',
    badgeLabel: 'New Year Edition',
    particleColor: '#B8863B'
  },
  custom: {
    backgroundClass: 'bg-[#FBF8F2]',
    backgroundStyle: {
      background: 'radial-gradient(ellipse at 50% 42%, #FFFFFF 0%, #FBF8F2 50%, #F2E7D5 100%)'
    },
    glowColor: 'rgba(184, 134, 59, 0.18)',
    accentGold: '#B8863B',
    richGold: '#916322',
    plaqueBorder: 'rgba(184, 134, 59, 0.35)',
    particleColor: '#B8863B'
  }
};

/** Floating warm gold ambient micro-particles */
const AMBIENT_PARTICLES = [
  { id: 1, top: '22%', left: '32%', size: 3, delay: '0.1s', duration: '3.2s' },
  { id: 2, top: '18%', left: '65%', size: 4, delay: '0.6s', duration: '2.8s' },
  { id: 3, top: '28%', left: '78%', size: 2.5, delay: '0.3s', duration: '3.6s' },
  { id: 4, top: '38%', left: '22%', size: 3.5, delay: '0.8s', duration: '3.0s' },
  { id: 5, top: '48%', left: '16%', size: 2, delay: '0.2s', duration: '4.0s' },
  { id: 6, top: '55%', left: '84%', size: 3, delay: '1.0s', duration: '3.4s' },
  { id: 7, top: '65%', left: '26%', size: 4, delay: '0.5s', duration: '2.9s' },
  { id: 8, top: '70%', left: '72%', size: 2.5, delay: '0.7s', duration: '3.5s' },
  { id: 9, top: '78%', left: '42%', size: 3, delay: '0.4s', duration: '3.1s' },
  { id: 10, top: '82%', left: '58%', size: 2, delay: '0.9s', duration: '3.7s' },
  { id: 11, top: '30%', left: '48%', size: 2.5, delay: '1.2s', duration: '3.3s' },
  { id: 12, top: '62%', left: '50%', size: 3.5, delay: '1.1s', duration: '2.7s' }
];

export const SplashScreen: React.FC<SplashScreenProps> = ({
  forceShow = false,
  onComplete,
  minDisplayDuration = 1800
}) => {
  const { effectiveTheme, isFestivalActive, isLoading } = useFestival();

  // Check session storage gating
  const [shouldMount, setShouldMount] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (forceShow) return true;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has('splash') || searchParams.has('forceSplash')) return true;
      const shown = window.sessionStorage.getItem('zada_splash_shown');
      return shown !== 'true';
    } catch {
      return true;
    }
  });

  // Choreographed Scene Phases:
  // Scene 1: 'arrival' (0 - 400ms)
  // Scene 2: 'logo' (400 - 850ms)
  // Scene 3: 'geometry' (850 - 1250ms)
  // Scene 4: 'tagline' (1250 - 1800ms)
  // Scene 5: 'exit' (1800ms+ -> cross-fade exit)
  const [scenePhase, setScenePhase] = useState<'arrival' | 'logo' | 'geometry' | 'tagline' | 'exit'>('arrival');
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState<boolean>(false);

  // Active theme configuration
  const themeConfig = useMemo<LuxurySplashTheme>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const forcedTheme = searchParams.get('theme') || searchParams.get('festival');
      if (forcedTheme === 'default' || forcedTheme === 'none') {
        return LUXURY_SPLASH_THEMES.default;
      }
      if (forcedTheme && LUXURY_SPLASH_THEMES[forcedTheme as FestivalPreset]) {
        return LUXURY_SPLASH_THEMES[forcedTheme as FestivalPreset];
      }
    }
    if (isFestivalActive && effectiveTheme && effectiveTheme.preset !== 'default' && LUXURY_SPLASH_THEMES[effectiveTheme.preset]) {
      return LUXURY_SPLASH_THEMES[effectiveTheme.preset];
    }
    return LUXURY_SPLASH_THEMES.default;
  }, [isFestivalActive, effectiveTheme]);

  // Reduced motion preference
  const isReducedMotion = useMemo<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Dismiss / complete handler
  const handleExit = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setScenePhase('exit');

    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('zada_splash_shown', 'true');
      }
    } catch {}

    // Allow CSS transition to finish before unmounting
    const timer = setTimeout(() => {
      setShouldMount(false);
      if (onComplete) {
        onComplete();
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [isExiting, onComplete]);

  // Phase scheduling
  useEffect(() => {
    if (!shouldMount) return;

    if (isReducedMotion) {
      setScenePhase('tagline');
      setMinTimeElapsed(true);
      const timer = setTimeout(() => {
        handleExit();
      }, 800);
      return () => clearTimeout(timer);
    }

    // Sequence Choreography
    const tLogo = setTimeout(() => setScenePhase('logo'), 350);
    const tGeom = setTimeout(() => setScenePhase('geometry'), 800);
    const tTag = setTimeout(() => setScenePhase('tagline'), 1250);
    const tMin = setTimeout(() => {
      setMinTimeElapsed(true);
      if (!isLoading) {
        handleExit();
      }
    }, minDisplayDuration);

    return () => {
      clearTimeout(tLogo);
      clearTimeout(tGeom);
      clearTimeout(tTag);
      clearTimeout(tMin);
    };
  }, [shouldMount, isReducedMotion, minDisplayDuration, isLoading, handleExit]);

  // Ready listener: dismiss when app hydration completes and minDisplayDuration has elapsed
  useEffect(() => {
    if (minTimeElapsed && !isLoading && !isExiting) {
      handleExit();
    }
  }, [minTimeElapsed, isLoading, isExiting, handleExit]);

  // Accessible Escape Key to Dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleExit]);

  if (!shouldMount) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ZaDa Foods Brand Loading Experience"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700 ease-out select-none ${
        themeConfig.backgroundClass
      } ${isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={themeConfig.backgroundStyle}
    >
      {/* Ambient Radial Soft Glow */}
      <div
        className="absolute inset-0 pointer-events-none animate-splash-arrival-glow"
        style={{
          background: `radial-gradient(circle at 50% 48%, ${themeConfig.glowColor} 0%, rgba(251, 248, 242, 0) 65%)`
        }}
      />

      {/* Floating Ambient Micro-Glow Specks */}
      {!isReducedMotion && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {AMBIENT_PARTICLES.map((p) => (
            <span
              key={p.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                top: p.top,
                left: p.left,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: themeConfig.particleColor,
                opacity: 0.35,
                boxShadow: `0 0 8px ${themeConfig.particleColor}`,
                animation: `splashParticleDrift ${p.duration} ease-in-out infinite`,
                animationDelay: p.delay
              }}
            />
          ))}
        </div>
      )}

      {/* Accessible Skip Button (Top Right) */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <button
          type="button"
          onClick={handleExit}
          className="px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold tracking-wider uppercase transition-all duration-300 bg-white/70 hover:bg-white text-[#5B4030] hover:text-[#29231D] border border-[#B8863B]/30 shadow-xs hover:shadow-sm active:scale-95 flex items-center gap-1.5"
          aria-label="Skip splash screen"
        >
          <span>Skip</span>
          <span className="text-[10px] opacity-60">Esc</span>
        </button>
      </div>

      {/* Central Composition */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-lg px-6 w-full text-center">
        {/* Subtle Luxury SVG Arabian Geometric Framing Ring */}
        <div className="relative flex items-center justify-center w-64 h-64 sm:w-76 sm:h-76">
          <svg
            viewBox="0 0 360 360"
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="goldSheenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#B8863B" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#916322" stopOpacity="0.7" />
              </linearGradient>
            </defs>

            {/* Outer Subtle Concentric Ring */}
            <circle
              cx="180"
              cy="180"
              r="165"
              fill="none"
              stroke="url(#goldSheenGrad)"
              strokeWidth="0.8"
              strokeDasharray="4 6"
              strokeOpacity="0.4"
            />

            {/* Inner Refined Circular Accent Line */}
            <circle
              cx="180"
              cy="180"
              r="140"
              fill="none"
              stroke="#B8863B"
              strokeWidth="1.2"
              strokeOpacity={scenePhase === 'arrival' ? '0' : '0.65'}
              className={isReducedMotion || scenePhase === 'arrival' ? '' : 'animate-splash-stroke-draw'}
              style={{ transition: 'stroke-opacity 0.6s ease' }}
            />

            {/* Arabian 8-Point Geometric Star Accent */}
            <g
              stroke="#B8863B"
              strokeWidth="0.9"
              fill="none"
              strokeOpacity={scenePhase === 'arrival' ? '0' : '0.5'}
              style={{ transition: 'stroke-opacity 0.8s ease' }}
            >
              {/* Star Diamond 1 */}
              <polygon points="180,48 274,180 180,312 86,180" strokeDasharray="3 4" strokeOpacity="0.35" />
              {/* Star Diamond 2 (Rotated 45 deg) */}
              <polygon points="180,48 274,180 180,312 86,180" strokeDasharray="3 4" strokeOpacity="0.35" transform="rotate(45 180 180)" />
              {/* Fine Cardinal Corner Nodes */}
              <circle cx="180" cy="40" r="2.5" fill="#B8863B" />
              <circle cx="180" cy="320" r="2.5" fill="#B8863B" />
              <circle cx="40" cy="180" r="2.5" fill="#B8863B" />
              <circle cx="320" cy="180" r="2.5" fill="#B8863B" />
            </g>
          </svg>

          {/* Central Luxury Logo Plaque Card */}
          <div
            className={`absolute flex flex-col items-center justify-center transition-all duration-700 ${
              scenePhase === 'arrival' && !isReducedMotion
                ? 'opacity-0 scale-90 translate-y-3'
                : 'opacity-100 scale-100 translate-y-0'
            }`}
          >
            <div
              className="relative px-7 sm:px-9 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-b from-[#FFFFFF] via-[#FDFBF7] to-[#F5EFE6] shadow-[0_12px_36px_rgba(184,134,59,0.14),0_2px_12px_rgba(0,0,0,0.04)] border overflow-hidden flex items-center justify-center animate-splash-logo-reveal"
              style={{
                borderColor: themeConfig.plaqueBorder
              }}
            >
              {/* Soft Gold Light Sheen Sweep Overlay */}
              {!isReducedMotion && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-10">
                  <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-[#E8D2A6]/50 to-transparent skew-x-[-25deg] animate-splash-sheen" />
                </div>
              )}

              {/* Official Existing ZaDa Foods Brand Logo */}
              <img
                src="/assets/logo.svg"
                alt="ZaDa Foods"
                className="h-11 sm:h-13 md:h-15 w-auto max-w-[200px] sm:max-w-[240px] object-contain select-none pointer-events-none drop-shadow-xs"
              />
            </div>

            {/* Optional Active Festival Pill Badge */}
            {themeConfig.badgeLabel && (
              <div
                className={`mt-2.5 px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-sans font-semibold tracking-wider uppercase bg-white/90 border border-[#B8863B]/40 text-[#916322] shadow-xs transition-opacity duration-500 ${
                  scenePhase === 'arrival' && !isReducedMotion ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {themeConfig.badgeLabel}
              </div>
            )}
          </div>
        </div>

        {/* Brand Statement / Taglines Section */}
        <div
          className={`flex flex-col items-center justify-center mt-3 sm:mt-5 transition-all duration-700 ${
            scenePhase === 'arrival' || scenePhase === 'logo'
              ? 'opacity-0 translate-y-3'
              : 'opacity-100 translate-y-0 animate-splash-tagline'
          }`}
        >
          {/* Ornate Gold Filigree Center Divider */}
          <div className="flex items-center gap-3 w-48 sm:w-60 mb-2">
            <span
              className="h-[1px] flex-1"
              style={{
                background: `linear-gradient(to right, transparent, ${themeConfig.accentGold})`
              }}
            />
            <span
              className="w-1.5 h-1.5 rotate-45"
              style={{
                backgroundColor: themeConfig.accentGold,
                boxShadow: `0 0 6px ${themeConfig.accentGold}`
              }}
            />
            <span
              className="h-[1px] flex-1"
              style={{
                background: `linear-gradient(to left, transparent, ${themeConfig.accentGold})`
              }}
            />
          </div>

          {/* Primary Tagline in Elegant Typography */}
          <h2
            className="splash-tagline font-serif font-bold text-sm sm:text-base tracking-[0.18em] sm:tracking-[0.24em] uppercase text-center px-4 max-w-sm"
            style={{
              color: '#29231D',
              textShadow: '0 1px 2px rgba(184, 134, 59, 0.15)'
            }}
          >
            Authentic Arabian Taste
          </h2>

          {/* Supporting Brand Line */}
          <p
            className="font-sans text-[11px] sm:text-xs tracking-wider text-[#5B4030] mt-1 font-medium"
          >
            Crafted for Memorable Food Experiences
          </p>

          {/* Subtle Branded Loading Indicator */}
          {isLoading && minTimeElapsed && (
            <div className="mt-4 flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/80 border border-[#B8863B]/25 text-[11px] text-[#916322] font-sans shadow-2xs animate-splash-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B8863B] animate-ping" />
              <span>Preparing your authentic Arabian feast...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
