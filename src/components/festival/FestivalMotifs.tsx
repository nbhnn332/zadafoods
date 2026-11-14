import React from 'react';
import { FestivalPreset } from '../../types/festival';

interface MotifProps {
  className?: string;
  size?: number;
  color?: string;
}

// ----------------------------------------------------------------------
// 1. DIWALI MOTIFS: Diya, Marigold, Gold Filigree
// ----------------------------------------------------------------------
export const DiyaMotif: React.FC<MotifProps> = ({ className = '', size = 20, color = '#D97706' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    {/* Diya Flame with gentle glow */}
    <path
      d="M12 2C12 2 14.5 5 14.5 7.5C14.5 8.88 13.38 10 12 10C10.62 10 9.5 8.88 9.5 7.5C9.5 5 12 2 12 2Z"
      fill="#F59E0B"
    />
    <path
      d="M12 4.5C12 4.5 13.2 6.2 13.2 7.5C13.2 8.16 12.66 8.7 12 8.7C11.34 8.7 10.8 8.16 10.8 7.5C10.8 6.2 12 4.5 12 4.5Z"
      fill="#FDE68A"
    />
    {/* Diya Clay/Brass Lamp Base */}
    <path
      d="M4 11C4 11 5.5 18 12 18C18.5 18 20 11 20 11H4Z"
      fill={color}
    />
    {/* Diya Rim */}
    <path
      d="M3 10.5C3 9.95 3.45 9.5 4 9.5H20C20.55 9.5 21 9.95 21 10.5C21 11.05 20.55 11.5 20 11.5H4C3.45 11.5 3 11.05 3 10.5Z"
      fill="#B45309"
    />
    {/* Base Stand */}
    <path
      d="M9 18H15V19.5C15 20.05 14.55 20.5 14 20.5H10C9.45 20.5 9 20.05 9 19.5V18Z"
      fill="#92400E"
    />
  </svg>
);

export const MarigoldMotif: React.FC<MotifProps> = ({ className = '', size = 20, color = '#F59E0B' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" fill={color} fillOpacity="0.2" />
    <path
      d="M12 4C13.5 6 13.5 8 12 10C10.5 8 10.5 6 12 4ZM12 20C13.5 18 13.5 16 12 14C10.5 16 10.5 18 12 20ZM4 12C6 10.5 8 10.5 10 12C8 13.5 6 13.5 4 12ZM20 12C18 10.5 16 10.5 14 12C16 13.5 18 13.5 20 12Z"
      fill="#D97706"
    />
    <path
      d="M6.34 6.34C8.46 7.05 9.17 8.46 8.46 10.58C7.05 9.87 6.34 8.46 6.34 6.34ZM17.66 17.66C15.54 16.95 14.83 15.54 15.54 13.42C16.95 14.13 17.66 15.54 17.66 17.66ZM6.34 17.66C7.05 15.54 8.46 14.83 10.58 15.54C9.87 16.95 8.46 17.66 6.34 17.66ZM17.66 6.34C16.95 8.46 15.54 9.17 13.42 8.46C14.13 7.05 15.54 6.34 17.66 6.34Z"
      fill="#F59E0B"
    />
    <circle cx="12" cy="12" r="2.5" fill="#B45309" />
  </svg>
);

// ----------------------------------------------------------------------
// 2. CHRISTMAS MOTIFS: Snowflake, Pine Branch, Star
// ----------------------------------------------------------------------
export const SnowflakeMotif: React.FC<MotifProps> = ({ className = '', size = 20, color = '#15803D' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    <path
      d="M12 2V22M2 12H22M4.93 4.93L19.07 19.07M19.07 4.93L4.93 19.07"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    {/* Delicate crystal arms */}
    <path
      d="M12 5L10 3M12 5L14 3M12 19L10 21M12 19L14 21M5 12L3 10M5 12L3 14M19 12L21 10M19 12L21 14"
      stroke={color}
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <circle cx="12" cy="12" r="1.5" fill={color} />
  </svg>
);

export const PineBranchMotif: React.FC<MotifProps> = ({ className = '', size = 20, color = '#165B33' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    <path
      d="M3 21C7 17 14 10 21 3"
      stroke="#78350F"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M8 16L6 13M12 12L9 10M16 8L13 6M11 17L13 15M15 13L17 11M19 9L21 7"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Red Christmas berries */}
    <circle cx="12" cy="16" r="1.8" fill="#DC2626" />
    <circle cx="14" cy="18" r="1.5" fill="#EF4444" />
  </svg>
);

// ----------------------------------------------------------------------
// 3. NEW YEAR MOTIFS: Champagne Stars & Sparkling Confetti
// ----------------------------------------------------------------------
export const ChampagneStarMotif: React.FC<MotifProps> = ({ className = '', size = 20, color = '#D4AF37' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    {/* Large Star */}
    <path
      d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
      fill={color}
    />
    {/* Small Accent Star */}
    <path
      d="M18 16L18.8 19L22 19.8L18.8 20.6L18 24L17.2 20.6L14 19.8L17.2 19L18 16Z"
      fill="#F59E0B"
    />
    {/* Tiny Sparkle Dot */}
    <circle cx="6" cy="18" r="1.5" fill="#FDE68A" />
  </svg>
);

// ----------------------------------------------------------------------
// 4. ONAM MOTIFS: Pookalam Mandala & Kasavu Gold Flourish
// ----------------------------------------------------------------------
export const PookalamMotif: React.FC<MotifProps> = ({ className = '', size = 20, color = '#CA8A04' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    {/* Outer Floral Ring */}
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1" strokeDasharray="2 2" />
    <circle cx="12" cy="12" r="7.5" fill="#FEF08A" fillOpacity="0.4" />
    {/* Pookalam 8-Petal Blossom */}
    <path
      d="M12 5C13 8 13 8 12 11C11 8 11 8 12 5ZM12 19C13 16 13 16 12 13C11 16 11 16 12 19ZM5 12C8 13 8 13 11 12C8 11 8 11 5 12ZM19 12C16 13 16 13 13 12C16 11 16 11 19 12Z"
      fill="#EA580C"
    />
    <path
      d="M7.05 7.05C9.5 8.5 9.5 8.5 10.5 10.5C8.5 9.5 8.5 9.5 7.05 7.05ZM16.95 16.95C14.5 15.5 14.5 15.5 13.5 13.5C15.5 14.5 15.5 14.5 16.95 16.95ZM7.05 16.95C8.5 14.5 8.5 14.5 10.5 13.5C9.5 15.5 9.5 15.5 7.05 16.95ZM16.95 7.05C15.5 9.5 15.5 9.5 13.5 10.5C14.5 8.5 14.5 8.5 16.95 7.05Z"
      fill="#EAB308"
    />
    <circle cx="12" cy="12" r="2.2" fill="#B45309" />
  </svg>
);

// ----------------------------------------------------------------------
// 5. EID MOTIFS: Crescent Moon, Star & Islamic Geometric Arabesque
// ----------------------------------------------------------------------
export const CrescentMotif: React.FC<MotifProps> = ({ className = '', size = 20, color = '#047857' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    {/* Elegant Crescent Moon */}
    <path
      d="M13.5 3C8.25 3 4 7.25 4 12.5C4 17.75 8.25 22 13.5 22C16.8 22 19.7 20.3 21.4 17.7C19.9 18.5 18.1 19 16.2 19C11.5 19 7.7 15.2 7.7 10.5C7.7 7.2 9.6 4.4 12.4 3.2C12.8 3.1 13.1 3.05 13.5 3Z"
      fill={color}
    />
    {/* 5-pointed Star */}
    <path
      d="M17.5 5L18.4 7.2L20.8 7.3L18.9 8.8L19.5 11.2L17.5 9.8L15.5 11.2L16.1 8.8L14.2 7.3L16.6 7.2L17.5 5Z"
      fill="#F59E0B"
    />
  </svg>
);

// ----------------------------------------------------------------------
// 6. CUSTOM / CELEBRATION MOTIF
// ----------------------------------------------------------------------
export const CelebrationMotif: React.FC<MotifProps> = ({ className = '', size = 20, color = '#A67732' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    <path
      d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
      fill={color}
    />
    <circle cx="18" cy="6" r="1.8" fill="#F59E0B" />
    <circle cx="6" cy="18" r="1.4" fill="#FDE68A" />
  </svg>
);

// ----------------------------------------------------------------------
// 7. CORNER FLOURISH: Discreet ornamental bracket for banners & cards
// ----------------------------------------------------------------------
interface CornerFlourishProps {
  preset: FestivalPreset;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
  size?: number;
  color?: string;
}

export const CornerFlourish: React.FC<CornerFlourishProps> = ({
  preset,
  position = 'top-right',
  className = '',
  size = 40,
  color
}) => {
  if (preset === 'default') return null;

  const defaultColor =
    color ||
    (preset === 'diwali'
      ? '#D97706'
      : preset === 'christmas'
      ? '#15803D'
      : preset === 'new_year'
      ? '#D4AF37'
      : preset === 'onam'
      ? '#CA8A04'
      : preset === 'eid'
      ? '#047857'
      : '#A67732');

  const getRotationClass = () => {
    switch (position) {
      case 'top-left':
        return 'rotate-0';
      case 'top-right':
        return 'rotate-90';
      case 'bottom-right':
        return 'rotate-180';
      case 'bottom-left':
        return '-rotate-90';
    }
  };

  return (
    <div
      className={`absolute pointer-events-none transition-transform duration-300 ${getRotationClass()} ${className}`}
      style={{
        width: size,
        height: size,
        top: position.includes('top') ? 0 : 'auto',
        bottom: position.includes('bottom') ? 0 : 'auto',
        left: position.includes('left') ? 0 : 'auto',
        right: position.includes('right') ? 0 : 'auto'
      }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        {/* Subtle decorative corner flourish */}
        <path
          d="M2 38V12C2 6.47715 6.47715 2 12 2H38"
          stroke={defaultColor}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeDasharray="4 2"
        />
        <circle cx="2" cy="38" r="2" fill={defaultColor} />
        <circle cx="38" cy="2" r="2" fill={defaultColor} />
        <circle cx="12" cy="12" r="3" fill={defaultColor} fillOpacity="0.4" />
      </svg>
    </div>
  );
};

// ----------------------------------------------------------------------
// 8. UNIFIED MOTIF RESOLVER
// ----------------------------------------------------------------------
interface FestivalMotifProps {
  preset: FestivalPreset;
  size?: number;
  className?: string;
  color?: string;
}

export const FestivalMotif: React.FC<FestivalMotifProps> = ({
  preset,
  size = 20,
  className = '',
  color
}) => {
  switch (preset) {
    case 'diwali':
      return <DiyaMotif size={size} className={className} color={color} />;
    case 'christmas':
      return <SnowflakeMotif size={size} className={className} color={color} />;
    case 'new_year':
      return <ChampagneStarMotif size={size} className={className} color={color} />;
    case 'onam':
      return <PookalamMotif size={size} className={className} color={color} />;
    case 'eid':
      return <CrescentMotif size={size} className={className} color={color} />;
    case 'custom':
      return <CelebrationMotif size={size} className={className} color={color} />;
    case 'default':
    default:
      return null;
  }
};

// ----------------------------------------------------------------------
// 9. EXTENDED IMMERSIVE FESTIVAL ILLUSTRATIONS & ANIMATED MOTIFS
// ----------------------------------------------------------------------

export const SantaSleighMotif: React.FC<{ className?: string; width?: number; height?: number }> = ({
  className = '',
  width = 90,
  height = 24
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 100 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block ${className}`}
    aria-hidden="true"
  >
    {/* Reindeer 1 */}
    <path d="M4 12C6 9 8 7 11 8C13 9 14 11 13 13C12 15 9 16 7 15L4 18L3 17L5 14L4 12Z" fill="#E2E8F0" />
    <path d="M11 6L13 3M11 5L9 3M12 6L14 7" stroke="#F59E0B" strokeWidth="1" strokeLinecap="round" />
    <circle cx="2.5" cy="12.5" r="1.1" fill="#EF4444" />
    {/* Reindeer 2 */}
    <path d="M22 13C24 10 26 8 29 9C31 10 32 12 31 14C30 16 27 17 25 16L22 19L21 18L23 15L22 13Z" fill="#CBD5E1" />
    <path d="M29 7L31 4M29 6L27 4" stroke="#F59E0B" strokeWidth="1" strokeLinecap="round" />
    {/* Reins */}
    <path d="M4 14C12 17 22 16 45 18" stroke="#FDE68A" strokeWidth="0.8" strokeDasharray="2 1" />
    {/* Santa Sleigh */}
    <path d="M48 18C52 14 62 14 70 17C73 18 75 20 74 22C73 24 68 25 54 24L48 18Z" fill="#DC2626" />
    {/* Golden Sleigh Trim */}
    <path d="M45 22C45 22 55 26 78 24C82 23 84 20 83 18C82 17 80 18 78 19C74 21 54 22 45 22Z" fill="#F59E0B" />
    {/* Sleigh Runner */}
    <path d="M44 26C55 27 75 27 82 25C84 24 85 22 84 21" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    {/* Santa Figure */}
    <circle cx="60" cy="13" r="3" fill="#FEE2E2" />
    <path d="M57 13C57 10 63 10 63 13" fill="#DC2626" />
    <path d="M56 14C57 17 63 17 64 14C63 16 57 16 56 14Z" fill="#FFFFFF" />
    <circle cx="56.5" cy="10.5" r="1.2" fill="#FFFFFF" />
    {/* Gift sack in back of sleigh */}
    <circle cx="68" cy="14" r="4.5" fill="#15803D" />
    <path d="M66 10C67 9 70 9 71 10" stroke="#F59E0B" strokeWidth="1" />
  </svg>
);

export const FanousLanternMotif: React.FC<MotifProps & { swing?: boolean }> = ({
  className = '',
  size = 28,
  color = '#C5A059',
  swing = false
}) => (
  <svg
    width={size}
    height={size * 1.5}
    viewBox="0 0 24 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${swing ? 'animate-fanous-swing' : ''} ${className}`}
    aria-hidden="true"
  >
    {/* Hanging Chain */}
    <path d="M12 0V8" stroke={color} strokeWidth="1" strokeDasharray="1 1" />
    <circle cx="12" cy="8" r="1.5" stroke={color} strokeWidth="0.8" fill="none" />
    {/* Lantern Cap */}
    <path d="M7 11C7 9.5 9 8.5 12 8.5C15 8.5 17 9.5 17 11L19 14H5L7 11Z" fill={color} />
    {/* Glass Chamber with geometric lines */}
    <path d="M5 14L7 25H17L19 14H5Z" fill="#043224" fillOpacity="0.4" stroke={color} strokeWidth="0.8" />
    <path d="M12 14V25M8 18H16M9 22H15" stroke={color} strokeWidth="0.6" strokeDasharray="2 1" />
    {/* Glowing Light inside */}
    <circle cx="12" cy="19.5" r="3" fill="#FDE047" fillOpacity="0.8" />
    {/* Lantern Base & Tassel */}
    <path d="M7 25L9 28H15L17 25H7Z" fill={color} />
    <path d="M12 28V34M10.5 34H13.5" stroke={color} strokeWidth="0.8" />
  </svg>
);

export const NilavilakkuMotif: React.FC<MotifProps & { animated?: boolean }> = ({
  className = '',
  size = 26,
  color = '#C88A10',
  animated = true
}) => (
  <svg
    width={size}
    height={size * 1.4}
    viewBox="0 0 24 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    {/* Animated Golden Flame */}
    <path
      d="M12 1C12 1 14 3.5 14 5.5C14 6.88 13.1 8 12 8C10.9 8 10 6.88 10 5.5C10 3.5 12 1 12 1Z"
      fill="#F59E0B"
      className={animated ? 'animate-diya-flame' : ''}
    />
    <path
      d="M12 3C12 3 13 4.5 13 5.5C13 6.05 12.55 6.5 12 6.5C11.45 6.5 11 6.05 11 5.5C11 4.5 12 3 12 3Z"
      fill="#FEF08A"
      className={animated ? 'animate-diya-flame' : ''}
    />
    {/* Top Pinnacle */}
    <circle cx="12" cy="8.5" r="1.5" fill={color} />
    {/* Oil Well Bowl */}
    <path d="M4 11C4 11 6 15 12 15C18 15 20 11 20 11H4Z" fill={color} />
    <ellipse cx="12" cy="11" rx="8" ry="1.5" fill="#EAB308" />
    {/* Pillar */}
    <path d="M11 15H13V26H11V15Z" fill={color} />
    <circle cx="12" cy="20.5" r="2.5" fill="#EAB308" />
    {/* Base Stand */}
    <path d="M6 26H18L19 31C19 32 17 33 12 33C7 33 5 32 5 31L6 26Z" fill={color} />
    <ellipse cx="12" cy="26" rx="6" ry="1.2" fill="#EAB308" />
  </svg>
);

export const GiftBoxMotif: React.FC<MotifProps & { ribbonColor?: string }> = ({
  className = '',
  size = 22,
  color = '#801826',
  ribbonColor = '#D4AF37'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    {/* Bow on Top */}
    <path d="M9 4C7.5 4 6 5 6 6.5C6 8 8 8 9.5 8H12V5.5C12 4.5 10.5 4 9 4Z" fill={ribbonColor} />
    <path d="M15 4C16.5 4 18 5 18 6.5C18 8 16 8 14.5 8H12V5.5C12 4.5 13.5 4 15 4Z" fill={ribbonColor} />
    <circle cx="12" cy="8" r="1.5" fill="#B45309" />
    {/* Box Lid */}
    <rect x="3" y="8" width="18" height="4" rx="1" fill={color} />
    <rect x="10.5" y="8" width="3" height="4" fill={ribbonColor} />
    {/* Box Body */}
    <rect x="4" y="12" width="16" height="10" rx="1" fill={color} fillOpacity="0.9" />
    <rect x="10.5" y="12" width="3" height="10" fill={ribbonColor} />
    <rect x="4" y="15" width="16" height="2" fill={ribbonColor} fillOpacity="0.8" />
  </svg>
);

export const ChristmasTreeMotif: React.FC<MotifProps> = ({ className = '', size = 24, color = '#0F3523' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    {/* Star on top */}
    <path d="M12 1L13 3.5L15.5 4L13.5 5.5L14 8L12 6.5L10 8L10.5 5.5L8.5 4L11 3.5L12 1Z" fill="#F59E0B" />
    {/* Tier 1 */}
    <path d="M12 4L8 9H16L12 4Z" fill={color} />
    {/* Tier 2 */}
    <path d="M12 8L6.5 14H17.5L12 8Z" fill={color} />
    {/* Tier 3 */}
    <path d="M12 13L5 19H19L12 13Z" fill={color} />
    {/* Trunk */}
    <rect x="10.5" y="19" width="3" height="4" rx="0.5" fill="#78350F" />
    {/* Baubles */}
    <circle cx="10" cy="7" r="0.8" fill="#EF4444" />
    <circle cx="13" cy="11" r="1" fill="#F59E0B" />
    <circle cx="8" cy="16" r="1.2" fill="#EF4444" />
    <circle cx="15" cy="17" r="1.1" fill="#3B82F6" />
  </svg>
);

export const ChristmasLightsString: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`w-full overflow-hidden flex items-center justify-around pointer-events-none select-none ${className}`} aria-hidden="true">
    {[
      { color: '#EF4444', tw: 'twinkle-1' },
      { color: '#F59E0B', tw: 'twinkle-2' },
      { color: '#10B981', tw: 'twinkle-3' },
      { color: '#3B82F6', tw: 'twinkle-1' },
      { color: '#EC4899', tw: 'twinkle-2' },
      { color: '#FCD34D', tw: 'twinkle-3' },
      { color: '#EF4444', tw: 'twinkle-1' },
      { color: '#10B981', tw: 'twinkle-2' },
      { color: '#F59E0B', tw: 'twinkle-3' },
      { color: '#3B82F6', tw: 'twinkle-1' },
      { color: '#FCD34D', tw: 'twinkle-2' },
      { color: '#10B981', tw: 'twinkle-3' },
    ].map((light, idx) => (
      <div key={idx} className="flex flex-col items-center">
        <div className="w-5 sm:w-8 h-1 border-b border-emerald-900/60 rounded-b-full -mb-0.5" />
        <div className="w-1.5 h-1 bg-stone-700 rounded-t-xs" />
        <div
          className={`w-2 h-2.5 sm:w-2.5 sm:h-3 rounded-full ${light.tw}`}
          style={{
            backgroundColor: light.color,
            boxShadow: `0 0 6px ${light.color}`
          }}
        />
      </div>
    ))}
  </div>
);

// ----------------------------------------------------------------------
// 10. ADVANCED CULTURAL MOTIFS & ARCHITECTURAL FLOURISHES
// ----------------------------------------------------------------------

export const SnowAccumulationEdge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 120 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`w-full h-3 sm:h-4 overflow-visible pointer-events-none ${className}`}
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <path
      d="M0 0C6 0 10 7 18 7C26 7 28 2 36 2C44 2 46 8 54 8C62 8 66 1 74 1C82 1 84 6 92 6C100 6 104 2 112 2C116 2 118 4 120 4V0H0Z"
      fill="#FFFFFF"
      fillOpacity="0.95"
    />
    <path
      d="M0 1C6 1 10 8 18 8C26 8 28 3 36 3C44 3 46 9 54 9C62 9 66 2 74 2C82 2 84 7 92 7C100 7 104 3 112 3C116 3 118 5 120 5"
      stroke="#C4D7CC"
      strokeWidth="0.8"
      strokeOpacity="0.6"
    />
  </svg>
);

export const GoldenKonnaStrand: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 36 }) => (
  <svg
    width={size}
    height={size * 1.6}
    viewBox="0 0 36 58"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block ${className}`}
    aria-hidden="true"
  >
    <path d="M18 0C18 15 12 32 10 54" stroke="#15803D" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M15 14C22 18 26 26 28 36" stroke="#15803D" strokeWidth="0.9" strokeLinecap="round" />
    <circle cx="16" cy="10" r="4" fill="#FACC15" />
    <circle cx="15.5" cy="9.5" r="2.2" fill="#FEF08A" />
    <circle cx="21" cy="18" r="4.5" fill="#EAB308" />
    <circle cx="20" cy="17" r="2.5" fill="#FEF08A" />
    <circle cx="13" cy="22" r="5" fill="#FACC15" />
    <circle cx="12" cy="21" r="2.8" fill="#FEF08A" />
    <circle cx="25" cy="28" r="4" fill="#EAB308" />
    <circle cx="24.5" cy="27.5" r="2.2" fill="#FEF08A" />
    <circle cx="14" cy="34" r="4.5" fill="#FACC15" />
    <circle cx="13.5" cy="33.5" r="2.4" fill="#FEF08A" />
    <circle cx="11" cy="44" r="3.5" fill="#EAB308" />
    <circle cx="10" cy="52" r="2.5" fill="#FACC15" />
  </svg>
);

export const MosqueSilhouette: React.FC<{ className?: string; height?: number; color?: string }> = ({
  className = '',
  height = 36,
  color = '#C5A059'
}) => (
  <svg
    viewBox="0 0 160 36"
    height={height}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`overflow-visible ${className}`}
    aria-hidden="true"
  >
    <path d="M12 36V12L14 8L16 12V36H12Z" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="0.8" />
    <circle cx="14" cy="6" r="1.5" fill={color} />
    <path d="M30 36V22C30 16 38 14 42 10C46 14 54 16 54 22V36H30Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="0.8" />
    <path d="M58 36V18C58 8 72 4 80 0C88 4 102 8 102 18V36H58Z" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1" />
    <path d="M80 0V4" stroke={color} strokeWidth="1.2" />
    <circle cx="80" cy="0" r="1.5" fill={color} />
    <path d="M106 36V22C106 16 114 14 118 10C122 14 130 16 130 22V36H106Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="0.8" />
    <path d="M144 36V12L146 8L148 12V36H144Z" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="0.8" />
    <circle cx="146" cy="6" r="1.5" fill={color} />
  </svg>
);

export const AkashKandilLantern: React.FC<MotifProps & { swing?: boolean }> = ({
  className = '',
  size = 32,
  color = '#F59E0B',
  swing = false
}) => (
  <svg
    width={size}
    height={size * 1.5}
    viewBox="0 0 32 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block ${swing ? 'animate-fanous-swing' : ''} ${className}`}
    aria-hidden="true"
  >
    <path d="M16 0V6" stroke={color} strokeWidth="1" />
    <polygon points="16,6 26,16 16,26 6,16" fill="#DC2626" stroke={color} strokeWidth="1" />
    <polygon points="16,10 22,16 16,22 10,16" fill="#F59E0B" />
    <polygon points="6,16 0,20 6,24" fill={color} />
    <polygon points="26,16 32,20 26,24" fill={color} />
    <polygon points="16,6 20,0 24,6" fill={color} />
    <path d="M10 26V42M13 26V46M16 26V48M19 26V46M22 26V42" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const ChristmasWreathMotif: React.FC<MotifProps> = ({ className = '', size = 26, color = '#15803D' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block shrink-0 ${className}`}
    aria-hidden="true"
  >
    <circle cx="14" cy="14" r="10" stroke={color} strokeWidth="3" strokeDasharray="3 1.5" />
    <circle cx="14" cy="14" r="7" stroke="#166534" strokeWidth="1.5" />
    <circle cx="8" cy="9" r="1.5" fill="#EF4444" />
    <circle cx="20" cy="10" r="1.5" fill="#EF4444" />
    <circle cx="9" cy="19" r="1.5" fill="#EF4444" />
    <circle cx="19" cy="18" r="1.5" fill="#EF4444" />
    <path d="M11 6C9 5 8 7 9 8C10 9 12 7 14 8C16 7 18 9 19 8C20 7 19 5 17 6C15 7 14 8 14 8C14 8 13 7 11 6Z" fill="#DC2626" />
    <path d="M13 8L10 13M15 8L18 13" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const SnowmanMotif: React.FC<MotifProps> = ({ className = '', size = 28 }) => (
  <svg
    width={size}
    height={size * 1.3}
    viewBox="0 0 24 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block ${className}`}
    aria-hidden="true"
  >
    <rect x="7" y="2" width="10" height="6" rx="1" fill="#1C1917" />
    <rect x="5" y="7" width="14" height="1.8" rx="0.5" fill="#1C1917" />
    <rect x="7" y="6" width="10" height="1.2" fill="#DC2626" />
    <circle cx="12" cy="13" r="4.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />
    <circle cx="10.5" cy="12" r="0.6" fill="#1C1917" />
    <circle cx="13.5" cy="12" r="0.6" fill="#1C1917" />
    <polygon points="12,13 15,14 12,14.5" fill="#EA580C" />
    <path d="M8 17C10 16 14 16 16 17L17 21H14L14 17.5" fill="#DC2626" />
    <circle cx="12" cy="23" r="7" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />
    <circle cx="12" cy="20" r="0.7" fill="#1C1917" />
    <circle cx="12" cy="23" r="0.7" fill="#1C1917" />
    <circle cx="12" cy="26" r="0.7" fill="#1C1917" />
  </svg>
);
