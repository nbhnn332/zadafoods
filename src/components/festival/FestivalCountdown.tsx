import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useFestival } from '../../context/FestivalContext';
import { FestivalMotif } from './FestivalMotifs';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeLeft(targetIso?: string): TimeLeft {
  if (!targetIso) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const difference = new Date(targetIso).getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isExpired: false
  };
}

interface FestivalCountdownProps {
  className?: string;
  inline?: boolean;
}

export const FestivalCountdown: React.FC<FestivalCountdownProps> = ({
  className = '',
  inline = false
}) => {
  const { effectiveTheme, isFestivalActive } = useFestival();

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(effectiveTheme?.countdown?.targetDate)
  );

  useEffect(() => {
    if (!effectiveTheme?.countdown?.enabled || !effectiveTheme.countdown.targetDate) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(effectiveTheme.countdown?.targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [effectiveTheme?.countdown?.targetDate, effectiveTheme?.countdown?.enabled]);

  if (!effectiveTheme || !isFestivalActive || effectiveTheme.preset === 'default') {
    return null;
  }

  if (effectiveTheme.placements?.countdownTimer === false) {
    return null;
  }

  if (!effectiveTheme.countdown?.enabled || timeLeft.isExpired) {
    return null;
  }

  const { preset, accentColor } = effectiveTheme;
  const label = effectiveTheme.countdown.label || `${effectiveTheme.name} Offer Ends In`;

  if (inline) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 text-white backdrop-blur-xs border text-xs font-semibold ${className}`}
        style={{ borderColor: `${accentColor}60` }}
        aria-label={`Countdown timer: ${label}`}
      >
        <FestivalMotif preset={preset} size={14} color={accentColor} />
        <span className="text-[11px] text-amber-200">{label}:</span>
        <span className="font-mono font-bold tracking-wider">
          {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-3 sm:p-4 bg-white/95 backdrop-blur-xs border shadow-xs max-w-md mx-auto ${className}`}
      style={{ borderColor: `${accentColor}40` }}
      aria-label={`Countdown: ${label}`}
    >
      <div className="flex items-center justify-center gap-1.5 mb-2 text-xs font-bold text-stone-800">
        <Clock className="w-3.5 h-3.5" style={{ color: accentColor }} />
        <span>{label}</span>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { val: timeLeft.days, unit: 'Days' },
          { val: timeLeft.hours, unit: 'Hours' },
          { val: timeLeft.minutes, unit: 'Mins' },
          { val: timeLeft.seconds, unit: 'Secs' }
        ].map((item, idx) => (
          <div
            key={idx}
            className="rounded-xl py-1.5 px-1 bg-stone-50 border border-stone-200/80 shadow-2xs"
          >
            <span
              className="block font-mono font-black text-base sm:text-lg leading-tight"
              style={{ color: accentColor }}
            >
              {String(item.val).padStart(2, '0')}
            </span>
            <span className="block text-[9px] font-semibold uppercase tracking-wider text-stone-500">
              {item.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
