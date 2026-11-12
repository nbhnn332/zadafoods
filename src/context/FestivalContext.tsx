import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { FestivalTheme, INITIAL_FESTIVAL_PRESETS } from '../types/festival';
import { SupabaseDataService } from '../lib/commerce/supabaseDataService';
import { useToast } from './ToastContext';

interface FestivalContextType {
  themes: FestivalTheme[];
  activeTheme: FestivalTheme | null;
  effectiveTheme: FestivalTheme | null;
  previewTheme: FestivalTheme | null;
  isFestivalActive: boolean;
  isLoading: boolean;
  activateTheme: (themeId: string) => Promise<{ success: boolean; error?: string }>;
  updateTheme: (theme: FestivalTheme) => Promise<{ success: boolean; error?: string }>;
  createCustomTheme: (theme: Omit<FestivalTheme, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; data?: FestivalTheme; error?: string }>;
  deleteTheme: (themeId: string) => Promise<{ success: boolean; error?: string }>;
  resetToDefault: () => Promise<{ success: boolean; error?: string }>;
  setPreviewTheme: (theme: FestivalTheme | null) => void;
  refreshThemes: () => Promise<void>;
}

const FestivalContext = createContext<FestivalContextType | undefined>(undefined);

export const isThemeWithinSchedule = (theme: FestivalTheme, currentDate = new Date()): boolean => {
  if (!theme.isActive) return false;
  if (theme.preset === 'default') return true;

  if (theme.startDate) {
    const start = new Date(theme.startDate);
    if (!isNaN(start.getTime()) && currentDate < start) {
      return false;
    }
  }

  if (theme.endDate) {
    const end = new Date(theme.endDate);
    if (!isNaN(end.getTime()) && currentDate > end) {
      return false;
    }
  }

  return true;
};

export const applyThemeToDocument = (theme: FestivalTheme | null, isFestivalActive: boolean) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (!isFestivalActive || !theme || theme.preset === 'default') {
    // Cleanly restore default ZaDa Foods brand tokens
    root.style.removeProperty('--brand-primary');
    root.style.removeProperty('--brand-primary-hover');
    root.style.removeProperty('--brand-secondary');
    root.style.removeProperty('--brand-deep');
    root.style.removeProperty('--brand-gold');
    root.style.removeProperty('--brand-muted-gold');
    root.style.removeProperty('--canvas');
    root.style.removeProperty('--canvas-subtle');
    root.style.removeProperty('--border-subtle');
    root.removeAttribute('data-festival-theme');
    root.removeAttribute('data-festival-intensity');
    document.body.removeAttribute('data-festival-theme');
    document.body.removeAttribute('data-festival-intensity');
    return;
  }

  // Active festival theme: set data attributes on root and body
  root.setAttribute('data-festival-theme', theme.preset);
  root.setAttribute('data-festival-intensity', theme.intensity || 'rich');
  document.body.setAttribute('data-festival-theme', theme.preset);
  document.body.setAttribute('data-festival-intensity', theme.intensity || 'rich');

  // Compute theme colors
  let primary = theme.accentColor || '#A67732';
  let primaryHover = theme.accentColor || '#8E6325';
  let secondary = '#072C20';
  let deep = '#031D16';
  let gold = theme.accentColor || '#A67732';
  let mutedGold = theme.badgeColor || '#D4B574';
  let canvas = theme.atmosphere?.pageBackground || '#FBF8F4';
  let canvasSubtle = theme.atmosphere?.sectionBackground || '#F7F3EB';
  let border = theme.atmosphere?.borderColor || '#EAE3D6';

  if (theme.preset === 'onam') {
    primary = '#CA8A04';
    primaryHover = '#A16207';
    secondary = '#1E293B';
    deep = '#0F172A';
    gold = '#EAB308';
    mutedGold = '#FEF08A';
    canvas = theme.atmosphere?.pageBackground || '#FFFDF5';
    canvasSubtle = '#FEFCE8';
    border = '#FDE047';
  } else if (theme.preset === 'eid') {
    primary = '#047857';
    primaryHover = '#065F46';
    secondary = '#064E3B';
    deep = '#022C22';
    gold = '#10B981';
    mutedGold = '#A7F3D0';
    canvas = theme.atmosphere?.pageBackground || '#F4FAF7';
    canvasSubtle = '#ECFDF5';
    border = '#A7F3D0';
  } else if (theme.preset === 'diwali') {
    primary = '#D97706';
    primaryHover = '#B45309';
    secondary = '#1C1917';
    deep = '#0C0A09';
    gold = '#F59E0B';
    mutedGold = '#FDE68A';
    canvas = theme.atmosphere?.pageBackground || '#FDFBF7';
    canvasSubtle = '#FFFBEB';
    border = '#FCD34D';
  } else if (theme.preset === 'christmas') {
    primary = '#15803D';
    primaryHover = '#166534';
    secondary = '#0F291E';
    deep = '#051B12';
    gold = '#22C55E';
    mutedGold = '#BBF7D0';
    canvas = theme.atmosphere?.pageBackground || '#FAFAF9';
    canvasSubtle = '#F0FDF4';
    border = '#86EFAC';
  } else if (theme.preset === 'new_year') {
    primary = '#B45309';
    primaryHover = '#92400E';
    secondary = '#1C1917';
    deep = '#0C0A09';
    gold = '#F59E0B';
    mutedGold = '#FEF3C7';
    canvas = theme.atmosphere?.pageBackground || '#FDFBF7';
    canvasSubtle = '#FFFBEB';
    border = '#FDE68A';
  }

  root.style.setProperty('--brand-primary', primary);
  root.style.setProperty('--brand-primary-hover', primaryHover);
  root.style.setProperty('--brand-secondary', secondary);
  root.style.setProperty('--brand-deep', deep);
  root.style.setProperty('--brand-gold', gold);
  root.style.setProperty('--brand-muted-gold', mutedGold);
  root.style.setProperty('--canvas', canvas);
  root.style.setProperty('--canvas-subtle', canvasSubtle);
  root.style.setProperty('--border-subtle', border);
};

export const FestivalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [themes, setThemes] = useState<FestivalTheme[]>(() => {
    try {
      const saved = localStorage.getItem('zada_festival_themes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_FESTIVAL_PRESETS;
  });

  const [previewTheme, setPreviewTheme] = useState<FestivalTheme | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync themes from Supabase / Canonical storage on mount
  const refreshThemes = async () => {
    setIsLoading(true);
    try {
      const res = await SupabaseDataService.fetchFestivalThemes();
      if (res.data && res.data.length > 0) {
        setThemes((prev) => {
          // If a theme was activated in state during initial mount, preserve its active status
          const activeInPrev = prev.find((t) => t.isActive && t.preset !== 'default');
          if (activeInPrev) {
            return res.data!.map((t) => ({
              ...t,
              isActive: t.id === activeInPrev.id
            }));
          }
          return res.data!;
        });
      }
    } catch (err) {
      console.warn('[FestivalContext] Error refreshing festival themes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    SupabaseDataService.fetchFestivalThemes().then((res) => {
      if (isMounted && res.data && res.data.length > 0) {
        setThemes((prev) => {
          const activeInPrev = prev.find((t) => t.isActive && t.preset !== 'default');
          if (activeInPrev) {
            return res.data!.map((t) => ({
              ...t,
              isActive: t.id === activeInPrev.id
            }));
          }
          return res.data!;
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute currently active theme (respecting start/end schedule)
  const activeTheme = useMemo(() => {
    const candidate = themes.find((t) => t.isActive && t.preset !== 'default');
    if (candidate && isThemeWithinSchedule(candidate)) {
      return candidate;
    }
    return themes.find((t) => t.preset === 'default') || INITIAL_FESTIVAL_PRESETS[0];
  }, [themes]);

  // Effective theme in current view: preview theme takes precedence
  const effectiveTheme = useMemo(() => {
    if (previewTheme) return previewTheme;
    return activeTheme;
  }, [previewTheme, activeTheme]);

  const isFestivalActive = useMemo(() => {
    if (!effectiveTheme) return false;
    if (effectiveTheme.preset === 'default') return false;
    if (previewTheme) return true;
    return isThemeWithinSchedule(effectiveTheme);
  }, [effectiveTheme, previewTheme]);

  // Apply complete visual transformation across document root whenever effective theme changes
  useEffect(() => {
    applyThemeToDocument(effectiveTheme, isFestivalActive);
  }, [effectiveTheme, isFestivalActive]);

  // Activate a festival theme (deactivates others)
  const activateTheme = async (themeId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const target = themes.find((t) => t.id === themeId);
      if (!target) return { success: false, error: 'Theme not found' };

      const updated = themes.map((t) => ({
        ...t,
        isActive: t.id === themeId,
        updatedAt: new Date().toISOString()
      }));

      setThemes(updated);
      try {
        localStorage.setItem('zada_festival_themes', JSON.stringify(updated));
      } catch {}

      await SupabaseDataService.setActiveFestivalTheme(themeId);
      setPreviewTheme(null);

      showToast(
        'Festival Theme Activated',
        `"${target.name}" is now live on the storefront.`,
        'success'
      );
      return { success: true };
    } catch (err: any) {
      showToast('Activation Error', err?.message || 'Failed to activate festival theme.', 'error');
      return { success: false, error: err?.message };
    }
  };

  // Update theme settings (intensity, greeting, coupon, colors, placements, schedule)
  const updateTheme = async (theme: FestivalTheme): Promise<{ success: boolean; error?: string }> => {
    try {
      const timestamp = new Date().toISOString();
      const updatedTheme = { ...theme, updatedAt: timestamp };
      const nextThemes = themes.map((t) => (t.id === theme.id ? updatedTheme : t));
      setThemes(nextThemes);

      try {
        localStorage.setItem('zada_festival_themes', JSON.stringify(nextThemes));
      } catch {}

      await SupabaseDataService.saveFestivalTheme(updatedTheme);

      if (previewTheme && previewTheme.id === theme.id) {
        setPreviewTheme(updatedTheme);
      }

      showToast('Theme Updated', `Settings saved for "${theme.name}".`, 'success');
      return { success: true };
    } catch (err: any) {
      showToast('Update Error', err?.message || 'Failed to update festival theme.', 'error');
      return { success: false, error: err?.message };
    }
  };

  // Create custom seasonal theme/campaign without code changes
  const createCustomTheme = async (
    themeData: Omit<FestivalTheme, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; data?: FestivalTheme; error?: string }> => {
    try {
      const timestamp = new Date().toISOString();
      const newId = `theme-custom-${Date.now()}`;
      const newTheme: FestivalTheme = {
        ...themeData,
        id: newId,
        preset: 'custom',
        createdAt: timestamp,
        updatedAt: timestamp
      };

      setThemes((prev) => {
        const nextThemes = [...prev, newTheme];
        try {
          localStorage.setItem('zada_festival_themes', JSON.stringify(nextThemes));
        } catch {}
        return nextThemes;
      });

      await SupabaseDataService.saveFestivalTheme(newTheme);

      showToast('Campaign Created', `Custom campaign "${newTheme.name}" created.`, 'success');
      return { success: true, data: newTheme };
    } catch (err: any) {
      showToast('Creation Error', err?.message || 'Failed to create custom campaign.', 'error');
      return { success: false, error: err?.message };
    }
  };

  // Delete custom campaign
  const deleteTheme = async (themeId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const target = themes.find((t) => t.id === themeId);
      if (!target) return { success: false, error: 'Theme not found' };

      // Cannot delete default preset
      if (target.preset === 'default') {
        return { success: false, error: 'Cannot delete the Default ZaDa Theme.' };
      }

      const nextThemes = themes.filter((t) => t.id !== themeId);
      // If deleted theme was active, fallback to default
      if (target.isActive) {
        const defaultIndex = nextThemes.findIndex((t) => t.preset === 'default');
        if (defaultIndex !== -1) {
          nextThemes[defaultIndex].isActive = true;
        }
      }

      setThemes(nextThemes);
      try {
        localStorage.setItem('zada_festival_themes', JSON.stringify(nextThemes));
      } catch {}

      await SupabaseDataService.deleteFestivalTheme(themeId);

      if (previewTheme && previewTheme.id === themeId) {
        setPreviewTheme(null);
      }

      showToast('Theme Deleted', `"${target.name}" removed from festival manager.`, 'info');
      return { success: true };
    } catch (err: any) {
      showToast('Delete Error', err?.message || 'Failed to delete theme.', 'error');
      return { success: false, error: err?.message };
    }
  };

  // One-click authoritative restore Default ZaDa Brand Theme
  const resetToDefault = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Immediately deactivate all seasonal festival overrides in state
      const updated = themes.map((t) => ({
        ...t,
        isActive: t.preset === 'default',
        updatedAt: new Date().toISOString()
      }));
      setThemes(updated);
      setPreviewTheme(null);

      // 2. Clear stale local storage states and record default
      try {
        localStorage.setItem('zada_festival_themes', JSON.stringify(updated));
        localStorage.setItem('zada_active_theme', 'theme-default');
      } catch {}

      // 3. Immediately reset document CSS variables to canonical brand defaults
      applyThemeToDocument(null, false);

      // 4. Persist to Supabase
      await SupabaseDataService.setActiveFestivalTheme('theme-default');

      // 5. Broadcast instant theme reset across all windows/tabs
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('zada-theme-changed', { detail: { theme: 'default' } }));
      }

      showToast(
        'Default Theme Restored',
        'Clean ZaDa Foods brand theme restored and active across the storefront.',
        'success'
      );

      return { success: true };
    } catch (err: any) {
      showToast('Reset Notice', err?.message || 'Error restoring default theme.', 'warning');
      return { success: false, error: err?.message };
    }
  };

  return (
    <FestivalContext.Provider
      value={{
        themes,
        activeTheme,
        effectiveTheme,
        previewTheme,
        isFestivalActive,
        isLoading,
        activateTheme,
        updateTheme,
        createCustomTheme,
        deleteTheme,
        resetToDefault,
        setPreviewTheme,
        refreshThemes
      }}
    >
      {children}
    </FestivalContext.Provider>
  );
};

export const FALLBACK_FESTIVAL_CONTEXT: FestivalContextType = {
  themes: INITIAL_FESTIVAL_PRESETS,
  activeTheme: INITIAL_FESTIVAL_PRESETS[0],
  effectiveTheme: INITIAL_FESTIVAL_PRESETS[0],
  previewTheme: null,
  isFestivalActive: false,
  isLoading: false,
  activateTheme: async () => ({ success: true }),
  updateTheme: async () => ({ success: true }),
  createCustomTheme: async () => ({ success: true }),
  deleteTheme: async () => ({ success: true }),
  resetToDefault: async () => ({ success: true }),
  setPreviewTheme: () => {},
  refreshThemes: async () => {}
};

export const useFestival = (): FestivalContextType => {
  const context = useContext(FestivalContext);
  if (!context) {
    return FALLBACK_FESTIVAL_CONTEXT;
  }
  return context;
};
