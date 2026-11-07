import React, { useState } from 'react';
import { Copy, Check, X, Eye } from 'lucide-react';
import { useFestival } from '../../context/FestivalContext';
import { FestivalMotif } from './FestivalMotifs';

export const FestivalAnnouncementBar: React.FC = () => {
  const { effectiveTheme, isFestivalActive, previewTheme, setPreviewTheme } = useFestival();
  const [copied, setCopied] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!effectiveTheme || !isFestivalActive || isDismissed) {
    return null;
  }

  if (!effectiveTheme.placements?.announcementBar) {
    return null;
  }

  const handleCopyCoupon = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!effectiveTheme.couponCode) return;
    navigator.clipboard.writeText(effectiveTheme.couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const badgeText = effectiveTheme.announcementBadge || `${effectiveTheme.name}`;
  const accent = effectiveTheme.accentColor || '#A67732';

  return (
    <div
      role="banner"
      aria-label="Festival Announcement"
      className="relative z-50 text-white text-xs py-2 px-3 sm:px-6 shadow-xs transition-colors duration-300"
      style={{
        backgroundColor: '#072C20',
        borderBottom: `2px solid ${accent}`
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Left / Center: Festive Greeting */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 overflow-hidden">
          {previewTheme && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-stone-900 shrink-0">
              <Eye className="w-3 h-3" />
              <span>PREVIEW MODE</span>
            </span>
          )}

          {/* Festival Motif */}
          <div className="shrink-0 flex items-center justify-center">
            <FestivalMotif preset={effectiveTheme.preset} size={18} color={accent} />
          </div>

          {/* Festival Badge */}
          {badgeText && (
            <span
              className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-stone-900 shrink-0"
              style={{ backgroundColor: effectiveTheme.badgeColor || '#FAD982' }}
            >
              {badgeText}
            </span>
          )}

          {/* Greeting text */}
          <span className="text-[11px] sm:text-xs font-medium text-stone-100 truncate">
            {effectiveTheme.greeting}
          </span>
        </div>

        {/* Right: Coupon Pill & Dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          {effectiveTheme.couponCode && (
            <button
              onClick={handleCopyCoupon}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all border border-white/20 hover:border-white/50 active:scale-95"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF'
              }}
              title="Click to copy coupon code"
            >
              <span>Code:</span>
              <span className="tracking-wider text-amber-300 underline underline-offset-2">
                {effectiveTheme.couponCode}
              </span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-stone-300" />
              )}
            </button>
          )}

          {/* Exit preview or dismiss */}
          {previewTheme ? (
            <button
              onClick={() => setPreviewTheme(null)}
              className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              Exit Preview
            </button>
          ) : (
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Dismiss festival announcement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
