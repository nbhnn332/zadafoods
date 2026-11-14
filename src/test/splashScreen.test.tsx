import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SplashScreen } from '../components/splash/SplashScreen';
import { FestivalContext, FALLBACK_FESTIVAL_CONTEXT } from '../context/FestivalContext';
import { FestivalTheme } from '../types/festival';

const mockFestivalTheme = (preset: any = 'default', name: string = 'Default'): FestivalTheme => ({
  id: 'theme-test',
  name,
  preset,
  greeting: 'Warm Festive Greetings',
  isActive: true,
  intensity: 'balanced',
  accentColor: '#D4AF37',
  featuredProductIds: [],
  placements: {
    heroBanners: true,
    promoBanners: true,
    productCards: true,
    categorySections: true,
    announcementBar: true
  },
  promotions: [],
  atmosphere: {},
  popup: { enabled: false, title: '', description: '', frequency: 'once_per_session' },
  countdown: { enabled: false, targetDate: '', label: '' },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

describe('SplashScreen Cinematic Brand Reveal Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it('renders splash screen on cold start when sessionStorage is empty', () => {
    render(<SplashScreen minDisplayDuration={1800} />);

    // Check dialog wrapper
    const dialog = screen.getByRole('dialog', { name: /ZaDa Foods Brand Loading Experience/i });
    expect(dialog).toBeInTheDocument();

    // Check official ZaDa Foods logo
    const logoImg = screen.getByAltText('ZaDa Foods');
    expect(logoImg).toBeInTheDocument();
    expect(logoImg).toHaveAttribute('src', '/assets/logo.svg');

    // Check official brand statement / tagline
    expect(screen.getByText(/Authentic Kerala Flavours, Rooted in Tradition/i)).toBeInTheDocument();

    // Check accessible skip button
    expect(screen.getByRole('button', { name: /Skip/i })).toBeInTheDocument();
  });

  it('does not render if zada_splash_shown is already set in sessionStorage', () => {
    window.sessionStorage.setItem('zada_splash_shown', 'true');
    const { container } = render(<SplashScreen />);
    expect(container.firstChild).toBeNull();
  });

  it('renders despite sessionStorage if forceShow is true', () => {
    window.sessionStorage.setItem('zada_splash_shown', 'true');
    render(<SplashScreen forceShow={true} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByAltText('ZaDa Foods')).toBeInTheDocument();
  });

  it('dismisses when Escape key is pressed and stores session flag', () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} minDisplayDuration={2000} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Press Escape
    act(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    // Advance unmount timer
    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(window.sessionStorage.getItem('zada_splash_shown')).toBe('true');
    expect(onComplete).toHaveBeenCalled();
  });

  it('dismisses when Skip button is clicked', () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} minDisplayDuration={2000} />);

    const skipBtn = screen.getByRole('button', { name: /Skip/i });
    act(() => {
      fireEvent.click(skipBtn);
    });

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(window.sessionStorage.getItem('zada_splash_shown')).toBe('true');
    expect(onComplete).toHaveBeenCalled();
  });

  it('adapts to Christmas festival theme', () => {
    const christmasTheme = mockFestivalTheme('christmas', 'Christmas Magic');
    render(
      <FestivalContext.Provider
        value={{
          ...FALLBACK_FESTIVAL_CONTEXT,
          isFestivalActive: true,
          effectiveTheme: christmasTheme,
          activeTheme: christmasTheme
        }}
      >
        <SplashScreen forceShow={true} />
      </FestivalContext.Provider>
    );

    expect(screen.getByText(/Christmas Celebration/i)).toBeInTheDocument();
    expect(screen.getByAltText('ZaDa Foods')).toBeInTheDocument();
    expect(screen.getByText(/Authentic Kerala Flavours, Rooted in Tradition/i)).toBeInTheDocument();
  });

  it('adapts to Eid festival theme', () => {
    const eidTheme = mockFestivalTheme('eid', 'Eid Celebration');
    render(
      <FestivalContext.Provider
        value={{
          ...FALLBACK_FESTIVAL_CONTEXT,
          isFestivalActive: true,
          effectiveTheme: eidTheme,
          activeTheme: eidTheme
        }}
      >
        <SplashScreen forceShow={true} />
      </FestivalContext.Provider>
    );

    expect(screen.getByText(/Eid Festive Selection/i)).toBeInTheDocument();
  });

  it('adapts to Onam festival theme', () => {
    const onamTheme = mockFestivalTheme('onam', 'Onam Celebration');
    render(
      <FestivalContext.Provider
        value={{
          ...FALLBACK_FESTIVAL_CONTEXT,
          isFestivalActive: true,
          effectiveTheme: onamTheme,
          activeTheme: onamTheme
        }}
      >
        <SplashScreen forceShow={true} />
      </FestivalContext.Provider>
    );

    expect(screen.getByText(/Onam Kasavu Edition/i)).toBeInTheDocument();
  });

  it('adapts to Diwali festival theme', () => {
    const diwaliTheme = mockFestivalTheme('diwali', 'Diwali Celebration');
    render(
      <FestivalContext.Provider
        value={{
          ...FALLBACK_FESTIVAL_CONTEXT,
          isFestivalActive: true,
          effectiveTheme: diwaliTheme,
          activeTheme: diwaliTheme
        }}
      >
        <SplashScreen forceShow={true} />
      </FestivalContext.Provider>
    );

    expect(screen.getByText(/Deepavali Special/i)).toBeInTheDocument();
  });

  it('progresses through choreographed scenes and exits after min duration', () => {
    const onComplete = vi.fn();
    render(<SplashScreen minDisplayDuration={1500} onComplete={onComplete} />);

    // Fast forward minDisplayDuration (1500ms)
    act(() => {
      vi.advanceTimersByTime(1600);
    });

    // Fast forward exit timer (150ms)
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Fast forward unmount transition (650ms)
    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(window.sessionStorage.getItem('zada_splash_shown')).toBe('true');
    expect(onComplete).toHaveBeenCalled();
  });
});
