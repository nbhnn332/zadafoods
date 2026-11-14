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

interface FestivalSplashTheme {
  backgroundClass: string;
  backgroundStyle: React.CSSProperties;
  glowColor: string;
  glowPulseColor: string;
  accentGold: string;
  leafColor: string;
  plaqueBorder: string;
  badgeLabel?: string;
  particleColor: string;
  ornamentStyle: 'kerala_banana_leaf' | 'christmas_pine' | 'eid_crescent' | 'onam_konna' | 'diwali_diya' | 'new_year_starlight';
}

const FESTIVAL_SPLASH_THEMES: Record<FestivalPreset, FestivalSplashTheme> = {
  default: {
    backgroundClass: 'bg-[#072C20]',
    backgroundStyle: {
      background: 'radial-gradient(ellipse at 50% 45%, #0A3D2D 0%, #072C20 60%, #031A12 100%)'
    },
    glowColor: 'rgba(166, 119, 50, 0.40)',
    glowPulseColor: 'rgba(212, 175, 55, 0.25)',
    accentGold: '#A67732',
    leafColor: '#A67732',
    plaqueBorder: 'rgba(166, 119, 50, 0.45)',
    particleColor: '#D4AF37',
    ornamentStyle: 'kerala_banana_leaf'
  },
  christmas: {
    backgroundClass: 'bg-[#052014]',
    backgroundStyle: {
      background: 'radial-gradient(ellipse at 50% 45%, #0B3320 0%, #052014 65%, #02120B 100%)'
    },
    glowColor: 'rgba(212, 175, 55, 0.45)',
    glowPulseColor: 'rgba(220, 38, 38, 0.25)',
    accentGold: '#D4AF37',
    leafColor: '#D4AF37',
    plaqueBorder: 'rgba(212, 175, 55, 0.55)',
    badgeLabel: 'Christmas Celebration',
    particleColor: '#F3E8FF',
    ornamentStyle: 'christmas_pine'
  },
  eid: {
    backgroundClass: 'bg-[#06281E]',
    backgroundStyle: {
      background: 'radial-gradient(ellipse at 50% 45%, #0A382B 0%, #06281E 65%, #03150F 100%)'
    },
    glowColor: 'rgba(197, 160, 89, 0.45)',
    glowPulseColor: 'rgba(212, 181, 116, 0.25)',
    accentGold: '#C5A059',
    leafColor: '#C5A059',
    plaqueBorder: 'rgba(197, 160, 89, 0.55)',
    badgeLabel: 'Eid Festive Selection',
    particleColor: '#FDF6B2',
    ornamentStyle: 'eid_crescent'
  },
  onam: {
    backgroundClass: 'bg-[#0B2B1B]',
    backgroundStyle: {
      background: 'radial-gradient(ellipse at 50% 45%, #13422A 0%, #0B2B1B 65%, #051A10 100%)'
    },
    glowColor: 'rgba(202, 138, 4, 0.50)',
    glowPulseColor: 'rgba(234, 179, 8, 0.30)',
    accentGold: '#CA8A04',
    leafColor: '#CA8A04',
    plaqueBorder: 'rgba(202, 138, 4, 0.60)',
    badgeLabel: 'Onam Kasavu Edition',
    particleColor: '#FEF08A',
    ornamentStyle: 'onam_konna'
  },
  diwali: {
    backgroundClass: 'bg-[#180829]',
    backgroundStyle: {
      background: 'radial-gradient(ellipse at 50% 45%, #2D0F4A 0%, #180829 65%, #0D0317 100%)'
    },
    glowColor: 'rgba(245, 158, 11, 0.50)',
    glowPulseColor: 'rgba(251, 191, 36, 0.30)',
    accentGold: '#F59E0B',
    leafColor: '#F59E0B',
    plaqueBorder: 'rgba(245, 158, 11, 0.60)',
    badgeLabel: 'Deepavali Special',
    particleColor: '#FDE68A',
    ornamentStyle: 'diwali_diya'
  },
  new_year: {
    backgroundClass: 'bg-[#0B0E1E]',
    backgroundStyle: {
      background: 'radial-gradient(ellipse at 50% 45%, #151B38 0%, #0B0E1E 65%, #050711 100%)'
    },
    glowColor: 'rgba(226, 184, 85, 0.45)',
    glowPulseColor: 'rgba(253, 230, 138, 0.25)',
    accentGold: '#E2B855',
    leafColor: '#E2B855',
    plaqueBorder: 'rgba(226, 184, 85, 0.55)',
    badgeLabel: 'New Year Edition',
    particleColor: '#FEF9C3',
    ornamentStyle: 'new_year_starlight'
  },
  custom: {
    backgroundClass: 'bg-[#072C20]',
    backgroundStyle: {
      background: 'radial-gradient(ellipse at 50% 45%, #0A3D2D 0%, #072C20 60%, #031A12 100%)'
    },
    glowColor: 'rgba(166, 119, 50, 0.40)',
    glowPulseColor: 'rgba(212, 175, 55, 0.25)',
    accentGold: '#A67732',
    leafColor: '#A67732',
    plaqueBorder: 'rgba(166, 119, 50, 0.45)',
    particleColor: '#D4AF37',
    ornamentStyle: 'kerala_banana_leaf'
  }
};

/** Deterministic ambient floating particles coordinates around the central crest */
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
  // Scene 3: 'botanical' (850 - 1250ms)
  // Scene 4: 'tagline' (1250 - 1800ms)
  // Scene 5: 'exit' (1800ms+ -> cross-fade exit)
  const [scenePhase, setScenePhase] = useState<'arrival' | 'logo' | 'botanical' | 'tagline' | 'exit'>('arrival');
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState<boolean>(false);

  // Active theme configuration
  const themeConfig = useMemo<FestivalSplashTheme>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const forcedTheme = searchParams.get('theme') || searchParams.get('festival');
      if (forcedTheme === 'default' || forcedTheme === 'none') {
        return FESTIVAL_SPLASH_THEMES.default;
      }
      if (forcedTheme && FESTIVAL_SPLASH_THEMES[forcedTheme as FestivalPreset]) {
        return FESTIVAL_SPLASH_THEMES[forcedTheme as FestivalPreset];
      }
    }
    if (isFestivalActive && effectiveTheme && effectiveTheme.preset !== 'default' && FESTIVAL_SPLASH_THEMES[effectiveTheme.preset]) {
      return FESTIVAL_SPLASH_THEMES[effectiveTheme.preset];
    }
    return FESTIVAL_SPLASH_THEMES.default;
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
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('zada_splash_shown', 'true');
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }

    const unmountDelay = isReducedMotion ? 100 : 650;
    setTimeout(() => {
      setShouldMount(false);
      onComplete?.();
    }, unmountDelay);
  }, [isExiting, isReducedMotion, onComplete]);

  // Listen for programmatic re-triggering (e.g. QA, developer testing)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const triggerHandler = () => {
      setShouldMount(true);
      setIsExiting(false);
      setMinTimeElapsed(false);
      setScenePhase('tagline');
    };
    window.addEventListener('trigger-zada-splash', triggerHandler);
    return () => window.removeEventListener('trigger-zada-splash', triggerHandler);
  }, []);

  // Keyboard navigation: Escape key immediately dismisses splash
  useEffect(() => {
    if (!shouldMount || isExiting) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleExit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shouldMount, isExiting, handleExit]);

  // Choreographed animation sequence timer
  useEffect(() => {
    if (!shouldMount) return;

    if (isReducedMotion) {
      // In reduced motion mode, show brand reveal directly, then dismiss after brief delay
      setScenePhase('tagline');
      setMinTimeElapsed(true);
      const timer = setTimeout(() => {
        handleExit();
      }, 500);
      return () => clearTimeout(timer);
    }

    // Scene 2: Logo Reveal at 250ms
    const tLogo = setTimeout(() => {
      setScenePhase(prev => (prev === 'arrival' ? 'logo' : prev));
    }, 250);

    // Scene 3: Kerala Botanicals at 550ms
    const tBotanical = setTimeout(() => {
      setScenePhase(prev => (prev === 'logo' || prev === 'arrival' ? 'botanical' : prev));
    }, 550);

    // Scene 4: Brand Statement at 850ms
    const tTagline = setTimeout(() => {
      setScenePhase(prev => (prev !== 'exit' ? 'tagline' : prev));
    }, 850);

    // Scene 5: Min display duration complete
    const tMinDuration = setTimeout(() => {
      setMinTimeElapsed(true);
    }, minDisplayDuration);

    return () => {
      clearTimeout(tLogo);
      clearTimeout(tBotanical);
      clearTimeout(tTagline);
      clearTimeout(tMinDuration);
    };
  }, [shouldMount, isReducedMotion, minDisplayDuration, handleExit]);

  // Once minimum duration has elapsed AND app is ready, trigger Scene 5 exit transition
  useEffect(() => {
    if (!shouldMount || !minTimeElapsed || isExiting) return;

    // If app is still loading festival/admin data, wait for it
    if (isLoading) return;

    // Ready to transition smoothly to storefront
    setScenePhase('exit');
    const exitTimer = setTimeout(() => {
      handleExit();
    }, 150);

    return () => clearTimeout(exitTimer);
  }, [shouldMount, minTimeElapsed, isLoading, isExiting, handleExit]);

  if (!shouldMount) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ZaDa Foods Brand Loading Experience"
      data-splash-phase={scenePhase}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none overflow-hidden transition-all ease-out duration-700 ${
        themeConfig.backgroundClass
      } ${
        isExiting
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100 pointer-events-auto'
      }`}
      style={themeConfig.backgroundStyle}
      onClick={handleExit}
    >
      {/* Background Ambient Radial Golden Glow (Scene 1) */}
      <div
        className="absolute w-[340px] sm:w-[500px] md:w-[680px] h-[340px] sm:h-[500px] md:h-[680px] rounded-full pointer-events-none blur-3xl animate-splash-arrival-glow transition-transform duration-1000"
        style={{
          background: `radial-gradient(circle, ${themeConfig.glowColor} 0%, ${themeConfig.glowPulseColor} 45%, transparent 75%)`,
          transform: isExiting ? 'scale(1.15)' : 'scale(1)'
        }}
      />

      {/* Floating Starlight / Kerala Spice Dust Ambient Particles */}
      {!isReducedMotion && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {AMBIENT_PARTICLES.map(particle => (
            <div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                top: particle.top,
                left: particle.left,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: themeConfig.particleColor,
                boxShadow: `0 0 8px ${themeConfig.particleColor}`,
                animation: `splashParticleDrift ${particle.duration} ease-in-out infinite`,
                animationDelay: particle.delay
              }}
            />
          ))}
        </div>
      )}

      {/* Skip Button (Accessible top-right corner) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleExit();
        }}
        className="absolute top-5 right-6 z-20 px-3 py-1.5 rounded-full text-[11px] font-sans font-medium tracking-widest text-[#FBF8F4]/50 hover:text-[#FBF8F4] bg-black/20 hover:bg-black/40 border border-white/10 backdrop-blur-sm transition-all active:scale-95 cursor-pointer uppercase"
        title="Skip intro (or press Esc)"
      >
        Skip <span className="hidden sm:inline opacity-60 text-[9px] lowercase font-normal">(esc)</span>
      </button>

      {/* Center Cinematic Stage Container */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 max-w-lg w-full">
        {/* SVG Drawing Circular / Ornamental Frame (Scene 1 & 3) */}
        <div className="relative flex items-center justify-center">
          <svg
            className="w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] pointer-events-none"
            viewBox="0 0 360 360"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Subtle Golden Ring */}
            <circle
              cx="180"
              cy="180"
              r="160"
              stroke={themeConfig.accentGold}
              strokeWidth="1.2"
              strokeOpacity="0.45"
              className={isReducedMotion ? '' : 'animate-splash-stroke-draw'}
            />

            {/* Inner Concentric Ornamental Ring */}
            <circle
              cx="180"
              cy="180"
              r="144"
              stroke={themeConfig.accentGold}
              strokeWidth="0.8"
              strokeDasharray="4 6"
              strokeOpacity="0.3"
            />

            {/* Quadrant Diamond Accent Accents */}
            <g fill={themeConfig.accentGold} fillOpacity="0.8">
              <polygon points="180,16 183,20 180,24 177,20" />
              <polygon points="180,336 183,340 180,344 177,340" />
              <polygon points="16,180 20,183 24,180 20,177" />
              <polygon points="336,180 340,183 344,180 340,177" />
            </g>

            {/* Kerala Botanical Banana Leaf Curvature (Scene 3) */}
            <g
              stroke={themeConfig.leafColor}
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
              strokeOpacity={scenePhase === 'arrival' ? '0' : '0.9'}
              className={isReducedMotion || scenePhase === 'arrival' ? '' : 'animate-splash-botanical'}
              style={{ transition: 'stroke-opacity 0.6s ease' }}
            >
              {/* Left Sweeping Arching Botanical Leaf Motif */}
              <path d="M 64 210 C 58 175, 75 125, 118 96 C 102 120, 100 160, 108 190" />
              <path d="M 76 172 C 86 166, 96 162, 106 160" strokeWidth="1.0" strokeOpacity="0.6" />
              <path d="M 85 145 C 95 140, 104 137, 112 135" strokeWidth="1.0" strokeOpacity="0.6" />
              <path d="M 98 120 C 106 117, 114 114, 120 112" strokeWidth="1.0" strokeOpacity="0.6" />

              {/* Right Sweeping Arching Botanical Leaf Motif (Mirrored) */}
              <path d="M 296 210 C 302 175, 285 125, 242 96 C 258 120, 260 160, 252 190" />
              <path d="M 284 172 C 274 166, 264 162, 254 160" strokeWidth="1.0" strokeOpacity="0.6" />
              <path d="M 275 145 C 265 140, 256 137, 248 135" strokeWidth="1.0" strokeOpacity="0.6" />
              <path d="M 262 120 C 254 117, 246 114, 240 112" strokeWidth="1.0" strokeOpacity="0.6" />
            </g>
          </svg>

          {/* Central Luxury Warm Ivory Crest / Logo Card (Scene 2) */}
          <div
            className={`absolute flex flex-col items-center justify-center transition-all duration-700 ${
              scenePhase === 'arrival' && !isReducedMotion
                ? 'opacity-0 scale-90 translate-y-3'
                : 'opacity-100 scale-100 translate-y-0'
            }`}
          >
            <div
              className="relative px-7 sm:px-9 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-b from-[#FFFDF9] via-[#FBF8F4] to-[#F5EFE6] shadow-[0_16px_45px_rgba(0,0,0,0.5),0_0_35px_rgba(166,119,50,0.25)] border overflow-hidden flex items-center justify-center animate-splash-logo-reveal"
              style={{
                borderColor: themeConfig.plaqueBorder
              }}
            >
              {/* Golden Light Sheen Sweep Overlay (Scene 2) */}
              {!isReducedMotion && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-10">
                  <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-amber-200/50 to-transparent skew-x-[-25deg] animate-splash-sheen" />
                </div>
              )}

              {/* Official Existing ZaDa Foods Brand Logo */}
              <img
                src="/assets/logo.svg"
                alt="ZaDa Foods"
                className="h-11 sm:h-13 md:h-15 w-auto max-w-[200px] sm:max-w-[240px] object-contain select-none pointer-events-none drop-shadow-sm"
              />
            </div>

            {/* Optional Active Festival Pill Badge */}
            {themeConfig.badgeLabel && (
              <div
                className={`mt-2.5 px-3 py-0.5 rounded-full text-[10px] sm:text-[11px] font-sans font-semibold tracking-wider uppercase bg-black/40 border border-[#D4AF37]/40 text-[#D4AF37] shadow-sm transition-opacity duration-500 ${
                  scenePhase === 'arrival' && !isReducedMotion ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {themeConfig.badgeLabel}
              </div>
            )}
          </div>
        </div>

        {/* Brand Statement / Tagline Section (Scene 4) */}
        <div
          className={`flex flex-col items-center justify-center mt-4 sm:mt-6 transition-all duration-700 ${
            scenePhase === 'arrival' || scenePhase === 'logo'
              ? 'opacity-0 translate-y-3'
              : 'opacity-100 translate-y-0 animate-splash-tagline'
          }`}
        >
          {/* Ornate Gold Filigree Center Divider */}
          <div className="flex items-center gap-3 w-48 sm:w-60 mb-2.5">
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

          {/* Official Tagline in Elegant Typography */}
          <p
            className="splash-tagline font-serif italic sm:not-italic font-medium text-xs sm:text-sm tracking-[0.20em] sm:tracking-[0.26em] uppercase text-center px-4 max-w-sm drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]"
            style={{
              color: '#FBF8F4',
              textShadow: '0 0 16px rgba(212, 175, 55, 0.65), 0 2px 10px rgba(0, 0, 0, 0.95)'
            }}
          >
            Authentic Kerala Flavours, Rooted in Tradition
          </p>

          {/* Subtle Branded Loading Pulse Indicator (Only if extended loading occurs) */}
          {isLoading && minTimeElapsed && (
            <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 border border-white/10 text-[11px] text-[#A67732] font-sans animate-splash-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A67732] animate-ping" />
              <span>Preparing your Kerala experience...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
