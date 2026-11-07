import React from 'react';
import { useFestival } from '../../context/FestivalContext';
import { FestivalMotif } from './FestivalMotifs';

interface FestivalSectionHeaderProps {
  children?: React.ReactNode;
  className?: string;
}

export const FestivalSectionHeader: React.FC<FestivalSectionHeaderProps> = ({ children, className = '' }) => {
  const { effectiveTheme, isFestivalActive } = useFestival();

  if (!effectiveTheme || !isFestivalActive || effectiveTheme.preset === 'default' || !effectiveTheme.placements?.categorySections) {
    return <>{children}</>;
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <FestivalMotif preset={effectiveTheme.preset} size={16} color={effectiveTheme.accentColor} />
      {children}
      <FestivalMotif preset={effectiveTheme.preset} size={16} color={effectiveTheme.accentColor} />
    </div>
  );
};
