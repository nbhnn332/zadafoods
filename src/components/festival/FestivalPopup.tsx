import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFestival } from '../../context/FestivalContext';
import { FestivalMotif, CornerFlourish } from './FestivalMotifs';

export const FestivalPopup: React.FC = () => {
  const { effectiveTheme, isFestivalActive } = useFestival();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!effectiveTheme || !isFestivalActive || effectiveTheme.preset === 'default') {
      setIsOpen(false);
      return;
    }

    if (effectiveTheme.placements?.promotionalPopup === false) {
      setIsOpen(false);
      return;
    }

    const popupConfig = effectiveTheme.popup;
    if (!popupConfig || !popupConfig.enabled) {
      setIsOpen(false);
      return;
    }

    const storageKey = `zada_festival_popup_seen_${effectiveTheme.id}`;

    if (popupConfig.frequency === 'once_per_day') {
      const lastSeen = localStorage.getItem(storageKey);
      if (lastSeen) {
        const lastDate = new Date(lastSeen).toDateString();
        const today = new Date().toDateString();
        if (lastDate === today) return;
      }
    } else if (popupConfig.frequency === 'once_per_session') {
      if (sessionStorage.getItem(storageKey)) {
        return;
      }
    }

    // Delay slightly (1.2s) for smooth entrance after page load
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [effectiveTheme?.id, effectiveTheme?.popup?.enabled, isFestivalActive]);

  if (!isOpen || !effectiveTheme || !effectiveTheme.popup) {
    return null;
  }

  const { preset, accentColor, popup } = effectiveTheme;

  const handleDismiss = () => {
    setIsOpen(false);
    const storageKey = `zada_festival_popup_seen_${effectiveTheme.id}`;
    try {
      if (popup.frequency === 'once_per_day') {
        localStorage.setItem(storageKey, new Date().toISOString());
      } else {
        sessionStorage.setItem(storageKey, 'true');
      }
    } catch {}
  };

  const handleCopyCoupon = () => {
    if (!popup.couponCode) return;
    navigator.clipboard.writeText(popup.couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="festival-popup-title"
    >
      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden bg-white text-stone-900 border shadow-2xl animate-in zoom-in-95 duration-300"
        style={{ borderColor: `${accentColor}60` }}
      >
        {/* Decorative corner flourishes */}
        <CornerFlourish preset={preset} position="top-left" size={48} color={accentColor} />
        <CornerFlourish preset={preset} position="bottom-right" size={48} color={accentColor} />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label="Close festival promotion"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header Art Bar */}
        <div
          className="p-6 pb-5 text-white text-center relative overflow-hidden"
          style={{
            backgroundColor: '#072C20',
            borderBottom: `3px solid ${accentColor}`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 pointer-events-none" />

          {/* Central Motif Glow */}
          <div className="relative z-10 flex flex-col items-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2.5 shadow-md border"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: `${accentColor}80`
              }}
            >
              <FestivalMotif preset={preset} size={30} color={accentColor} />
            </div>

            {popup.discountBadge && (
              <span
                className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-stone-900 shadow-xs mb-1"
                style={{ backgroundColor: effectiveTheme.badgeColor || '#FDE68A' }}
              >
                <Sparkles className="w-3 h-3" />
                <span>{popup.discountBadge}</span>
              </span>
            )}

            <h3
              id="festival-popup-title"
              className="font-serif font-bold text-lg sm:text-xl text-white mt-1 drop-shadow-xs"
            >
              {popup.title}
            </h3>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 text-center space-y-4">
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
            {popup.description}
          </p>

          {/* Coupon Code Pill */}
          {popup.couponCode && (
            <div
              className="inline-flex items-center justify-between gap-3 p-2 pl-3 rounded-xl bg-stone-50 border border-dashed border-stone-300 max-w-xs mx-auto shadow-2xs"
            >
              <div className="text-left">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-stone-500">
                  Festival Coupon Code
                </span>
                <span className="font-mono font-black text-sm tracking-widest text-stone-900">
                  {popup.couponCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCoupon}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all flex items-center gap-1 shadow-xs"
                style={{ backgroundColor: accentColor }}
                aria-label={`Copy coupon code ${popup.couponCode}`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <Link
              to={popup.ctaLink || '/shop'}
              onClick={handleDismiss}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              style={{ backgroundColor: accentColor }}
            >
              <span>{popup.ctaText || 'Shop Festive Specials'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors"
            >
              Continue to Site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
