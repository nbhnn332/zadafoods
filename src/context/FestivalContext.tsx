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
  const body = document.body;

  const defaultTokens = {
    pageBg: '#FBF8F4',
    surface: '#FFFFFF',
    surfaceSubtle: '#F7F3EB',
    headerBg: '#072C20',
    headerText: '#FFFFFF',
    headerBorder: '#0A3D2D',
    sectionBg: '#F7F3EB',
    primary: '#A67732',
    primaryHover: '#8E6325',
    secondary: '#072C20',
    secondaryHover: '#0C3D2D',
    accent: '#D4B574',
    heading: '#041914',
    text: '#4A4F48',
    textMuted: '#787F76',
    border: '#EAE3D6',
    buttonBg: '#A67732',
    buttonText: '#FFFFFF',
    buttonSecondaryBg: '#072C20',
    buttonSecondaryText: '#FFFFFF',
    badgeBg: '#F4EADA',
    badgeText: '#8E6325',
    badgeBorder: '#D4B574',
    footerBg: '#031D16',
    footerText: '#E5E7EB'
  };

  const setCssTokens = (t: typeof defaultTokens) => {
    root.style.setProperty('--color-page-bg', t.pageBg);
    root.style.setProperty('--color-surface', t.surface);
    root.style.setProperty('--color-surface-subtle', t.surfaceSubtle);
    root.style.setProperty('--color-header-bg', t.headerBg);
    root.style.setProperty('--color-header-text', t.headerText);
    root.style.setProperty('--color-header-border', t.headerBorder);
    root.style.setProperty('--color-section-bg', t.sectionBg);
    root.style.setProperty('--color-primary', t.primary);
    root.style.setProperty('--color-primary-hover', t.primaryHover);
    root.style.setProperty('--color-secondary', t.secondary);
    root.style.setProperty('--color-secondary-hover', t.secondaryHover);
    root.style.setProperty('--color-accent', t.accent);
    root.style.setProperty('--color-heading', t.heading);
    root.style.setProperty('--color-text', t.text);
    root.style.setProperty('--color-text-muted', t.textMuted);
    root.style.setProperty('--color-border', t.border);
    root.style.setProperty('--color-button-bg', t.buttonBg);
    root.style.setProperty('--color-button-text', t.buttonText);
    root.style.setProperty('--color-button-secondary-bg', t.buttonSecondaryBg);
    root.style.setProperty('--color-button-secondary-text', t.buttonSecondaryText);
    root.style.setProperty('--color-badge-bg', t.badgeBg);
    root.style.setProperty('--color-badge-text', t.badgeText);
    root.style.setProperty('--color-badge-border', t.badgeBorder);
    root.style.setProperty('--color-footer-bg', t.footerBg);
    root.style.setProperty('--color-footer-text', t.footerText);

    // Backward-compatibility aliases
    root.style.setProperty('--canvas', t.pageBg);
    root.style.setProperty('--canvas-subtle', t.sectionBg);
    root.style.setProperty('--surface', t.surface);
    root.style.setProperty('--brand-primary', t.primary);
    root.style.setProperty('--brand-primary-hover', t.primaryHover);
    root.style.setProperty('--brand-secondary', t.secondary);
    root.style.setProperty('--brand-deep', t.footerBg);
    root.style.setProperty('--brand-gold', t.accent);
    root.style.setProperty('--brand-muted-gold', t.accent);
    root.style.setProperty('--content-primary', t.heading);
    root.style.setProperty('--content-secondary', t.text);
    root.style.setProperty('--border-subtle', t.border);
  };

  if (!isFestivalActive || !theme || theme.preset === 'default') {
    // Cleanly remove inline overrides so :root stylesheet tokens apply
    const allTokens = [
      '--color-page-bg', '--color-surface', '--color-surface-subtle',
      '--color-header-bg', '--color-header-text', '--color-header-border',
      '--color-section-bg', '--color-primary', '--color-primary-hover',
      '--color-secondary', '--color-secondary-hover', '--color-accent',
      '--color-heading', '--color-text', '--color-text-muted',
      '--color-border', '--color-button-bg', '--color-button-text',
      '--color-button-secondary-bg', '--color-button-secondary-text',
      '--color-badge-bg', '--color-badge-text', '--color-badge-border',
      '--color-footer-bg', '--color-footer-text',
      '--brand-primary', '--brand-primary-hover', '--brand-secondary',
      '--brand-deep', '--brand-gold', '--brand-muted-gold',
      '--canvas', '--canvas-subtle', '--surface', '--content-primary',
      '--content-secondary', '--border-subtle'
    ];
    allTokens.forEach((prop) => root.style.removeProperty(prop));
    root.removeAttribute('data-festival-theme');
    root.removeAttribute('data-festival-intensity');
    body.removeAttribute('data-festival-theme');
    body.removeAttribute('data-festival-intensity');
    return;
  }

  // Active festival theme
  root.setAttribute('data-festival-theme', theme.preset);
  root.setAttribute('data-festival-intensity', theme.intensity || 'balanced');
  body.setAttribute('data-festival-theme', theme.preset);
  body.setAttribute('data-festival-intensity', theme.intensity || 'balanced');

  let tokens = { ...defaultTokens };

  if (theme.preset === 'onam') {
    tokens = {
      pageBg: '#FAF5EA', // Warm Kerala Kasavu ivory cream
      surface: '#FFFDF9', // Lustrous silk card surface
      surfaceSubtle: '#F3EBD6',
      headerBg: '#0D3B22', // Kerala coconut-grove deep green
      headerText: '#FFFDF9',
      headerBorder: '#194E31',
      sectionBg: '#F4EBD4', // Kasavu-gold alternating section
      primary: '#C88A10', // Traditional Kasavu golden yellow
      primaryHover: '#A87008',
      secondary: '#0D3B22', // Kerala plantain green
      secondaryHover: '#092B19',
      accent: '#D4AF37', // Muted temple gold
      heading: '#172C15', // Deep botanical evergreen typography
      text: '#384534',
      textMuted: '#687763',
      border: '#DFCF9F', // Kasavu woven border
      buttonBg: '#C88A10',
      buttonText: '#FFFFFF',
      buttonSecondaryBg: '#0D3B22',
      buttonSecondaryText: '#FFFDF9',
      badgeBg: '#FDF2D4',
      badgeText: '#946304',
      badgeBorder: '#E5C77A',
      footerBg: '#082816', // Midnight Kerala backwaters green
      footerText: '#F0E8D0'
    };
  } else if (theme.preset === 'diwali') {
    tokens = {
      pageBg: '#140C24', // Deep royal plum night canvas
      surface: '#22143A', // Velvety royal plum card surface
      surfaceSubtle: '#2D1C4C',
      headerBg: '#10091E', // Imperial plum night
      headerText: '#FFF7ED',
      headerBorder: '#361F58',
      sectionBg: '#1D1133', // Illuminated midnight violet section
      primary: '#F59E0B', // Radiant warm saffron diya gold
      primaryHover: '#D97706',
      secondary: '#E06D14', // Festive terracotta diya orange
      secondaryHover: '#C25409',
      accent: '#FFD700', // Festive sparkler gold
      heading: '#FEF3C7', // Luminous candlelit heading
      text: '#E2D9F3', // Soft readable lavender-cream body
      textMuted: '#A898C8',
      border: '#4C3270', // Rich jewel-tone border
      buttonBg: '#F59E0B',
      buttonText: '#140C24',
      buttonSecondaryBg: '#7C2D12',
      buttonSecondaryText: '#FEF3C7',
      badgeBg: '#421D12',
      badgeText: '#FBBF24',
      badgeBorder: '#F59E0B',
      footerBg: '#0B0614', // Obsidian plum footer
      footerText: '#DDD2F2'
    };
  } else if (theme.preset === 'eid') {
    tokens = {
      pageBg: '#F1F7F4', // Pristine pearl ivory with subtle jade mist
      surface: '#FFFFFF', // Marble card surface
      surfaceSubtle: '#E2EEE7',
      headerBg: '#043224', // Malabar royal emerald
      headerText: '#FFFFFF',
      headerBorder: '#084A36',
      sectionBg: '#E5F0E9', // Silken pale jade section
      primary: '#055C41', // Deep jewel emerald
      primaryHover: '#034430',
      secondary: '#C5A059', // Arabian champagne gold
      secondaryHover: '#A8833E',
      accent: '#D4AF37',
      heading: '#03251B', // Deep forest emerald typography
      text: '#284239', // Deep jade-slate body
      textMuted: '#5C776D',
      border: '#B6D8C8', // Fine jade filigree border
      buttonBg: '#055C41',
      buttonText: '#FFFFFF',
      buttonSecondaryBg: '#C5A059',
      buttonSecondaryText: '#03251B',
      badgeBg: '#DDF0E6',
      badgeText: '#044A34',
      badgeBorder: '#97CBB3',
      footerBg: '#021F16', // Deepest oasis night
      footerText: '#DCEFE6'
    };
  } else if (theme.preset === 'christmas') {
    tokens = {
      pageBg: '#F6F4EF', // Snow cream soft winter ivory
      surface: '#FFFFFF', // Crisp snow card surface
      surfaceSubtle: '#EBF2EE',
      headerBg: '#0F3523', // Alpine spruce green
      headerText: '#FFFFFF',
      headerBorder: '#194B34',
      sectionBg: '#E8EFEA', // Spruce-mist alternating section
      primary: '#801826', // Royal burgundy velvet
      primaryHover: '#65101D',
      secondary: '#0F3523', // Pine evergreen
      secondaryHover: '#0A2518',
      accent: '#D4AF37', // Warm champagne gold
      heading: '#16271D', // Deep holly evergreen heading
      text: '#36453C',
      textMuted: '#697A70',
      border: '#C4D7CC', // Winter pine frost border
      buttonBg: '#801826',
      buttonText: '#FFFFFF',
      buttonSecondaryBg: '#0F3523',
      buttonSecondaryText: '#FFFFFF',
      badgeBg: '#FCEBEF',
      badgeText: '#801826',
      badgeBorder: '#E8A2AF',
      footerBg: '#081E14', // Deep midnight forest
      footerText: '#E0EAE3'
    };
  } else if (theme.preset === 'new_year') {
    tokens = {
      pageBg: '#0B1120', // Midnight celestial navy sky
      surface: '#141C33', // Star-chamber card surface
      surfaceSubtle: '#1C2747',
      headerBg: '#070B16', // Deepest space navy
      headerText: '#F8FAFC',
      headerBorder: '#202D4E',
      sectionBg: '#10172C', // Midnight starlight section
      primary: '#D4AF37', // Champagne gold celebration
      primaryHover: '#B89328',
      secondary: '#94A3B8', // Platinum silver
      secondaryHover: '#64748B',
      accent: '#E2C974',
      heading: '#F8FAFC', // Diamond white heading
      text: '#CBD5E1', // Silver-gray readable body
      textMuted: '#7E8DA5',
      border: '#2A3A63', // Silvered constellation border
      buttonBg: '#D4AF37',
      buttonText: '#0B1120',
      buttonSecondaryBg: '#1E293B',
      buttonSecondaryText: '#F8FAFC',
      badgeBg: '#282008',
      badgeText: '#E2C974',
      badgeBorder: '#D4AF37',
      footerBg: '#04070E', // Deep cosmos footer
      footerText: '#94A3B8'
    };
  } else if (theme.preset === 'custom') {
    tokens = {
      ...defaultTokens,
      pageBg: theme.atmosphere?.pageBackground || defaultTokens.pageBg,
      sectionBg: theme.atmosphere?.sectionBackground || defaultTokens.sectionBg,
      primary: theme.accentColor || defaultTokens.primary,
      primaryHover: theme.accentColor || defaultTokens.primaryHover,
      buttonBg: theme.accentColor || defaultTokens.buttonBg,
      badgeText: theme.badgeColor || defaultTokens.badgeText,
      border: theme.atmosphere?.borderColor || defaultTokens.border
    };
  }

  setCssTokens(tokens);
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
