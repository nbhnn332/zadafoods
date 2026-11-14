import React from 'react';
import { useFestival } from '../../context/FestivalContext';
import { FestivalMotif } from './FestivalMotifs';

export const FestivalFooterDecoration: React.FC = () => {
  const { effectiveTheme, isFestivalActive } = useFestival();

  if (!effectiveTheme || !isFestivalActive || effectiveTheme.preset === 'default') {
    return null;
  }

  if (effectiveTheme.placements?.footerMotif === false) {
    return null;
  }

  const { preset, accentColor, name } = effectiveTheme;

  return (
    <div
      className="w-full py-4 px-4 text-center border-t transition-colors relative overflow-hidden"
      style={{
        backgroundColor: 'var(--color-footer-bg, #072C20)',
        borderColor: `${accentColor}60`
      }}
      aria-label={`${name} Footer Celebration`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 text-xs text-amber-200">
        <FestivalMotif preset={preset} size={16} color={accentColor} />
        <span className="font-serif font-medium tracking-wide">
          Wishing you a joyous {name} from the entire ZaDa Foods family
        </span>
        <FestivalMotif preset={preset} size={16} color={accentColor} />
      </div>
    </div>
  );
};
