import React from 'react';
import { useFestival } from '../../context/FestivalContext';
import { FestivalMotif } from './FestivalMotifs';
import { FestivalProductBadgeType, FESTIVAL_BADGE_LABELS } from '../../types/festival';

interface FestivalCardBadgeProps {
  productId: string;
  isOffer?: boolean;
}

export const FestivalCardBadge: React.FC<FestivalCardBadgeProps> = ({ productId, isOffer }) => {
  const { effectiveTheme, isFestivalActive } = useFestival();

  if (!effectiveTheme || !isFestivalActive || effectiveTheme.preset === 'default') {
    return null;
  }

  if (effectiveTheme.placements?.productCards === false) {
    return null;
  }

  // Check explicit productBadge assignment first
  const assignedBadge: FestivalProductBadgeType | undefined = effectiveTheme.productBadges?.[productId];
  const isFeatured = effectiveTheme.featuredProductIds?.includes(productId);

  if (!assignedBadge && !isFeatured && !isOffer) {
    return null;
  }

  let badgeText = 'FESTIVE PICK';
  if (assignedBadge && FESTIVAL_BADGE_LABELS[assignedBadge]) {
    badgeText = FESTIVAL_BADGE_LABELS[assignedBadge];
  } else if (isFeatured) {
    badgeText = 'FESTIVE PICK';
  } else if (isOffer) {
    badgeText = 'SEASONAL';
  }

  const badgeBg = effectiveTheme.badgeColor || '#FDE68A';

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-stone-900 shadow-xs border border-amber-400/40 whitespace-nowrap animate-in fade-in duration-300"
      style={{ backgroundColor: badgeBg }}
      title={`${effectiveTheme.name} — ${badgeText}`}
    >
      <FestivalMotif preset={effectiveTheme.preset} size={11} color={effectiveTheme.accentColor} />
      <span>{badgeText}</span>
    </span>
  );
};
