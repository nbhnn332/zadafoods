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
