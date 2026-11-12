import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminFestivals } from '../pages/admin/AdminFestivals';
import { ProductCard } from '../components/ProductCard';
import { FestivalAnnouncementBar } from '../components/festival/FestivalAnnouncementBar';
import { FestivalHeroOverlay } from '../components/festival/FestivalHeroOverlay';
import { FestivalSectionHeader } from '../components/festival/FestivalSectionHeader';
import { FestivalAtmosphere, FestivalDivider } from '../components/festival/FestivalAtmosphere';
import { FestivalCountdown } from '../components/festival/FestivalCountdown';
import { FestivalPopup } from '../components/festival/FestivalPopup';
import { FestivalPromotionSection } from '../components/festival/FestivalPromotionSection';
import { FestivalFooterDecoration } from '../components/festival/FestivalFooterDecoration';
import { FestivalProvider, isThemeWithinSchedule } from '../context/FestivalContext';
import { AdminDataProvider } from '../context/AdminDataContext';
import { INITIAL_PRODUCTS } from '../data/mockData';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { ToastContainer } from '../components/ToastContainer';
import { INITIAL_FESTIVAL_PRESETS, FestivalTheme } from '../types/festival';
import * as supabaseModule from '../lib/supabase';

const mockTestProduct = {
  ...INITIAL_PRODUCTS[0],
  id: 'prod-1',
  name: 'Wayanad Banana Chips'
};

const renderWithAllProviders = (ui: React.ReactElement, initialEntries = ['/admin/festivals']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <AdminDataProvider>
              <FestivalProvider>
                {ui}
                <ToastContainer />
              </FestivalProvider>
            </AdminDataProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('ZaDa Foods — Festival Theme & Seasonal Decoration System', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(supabaseModule, 'isSupabaseConfigured').mockReturnValue(false);
    localStorage.setItem(
      'zada_auth_user',
      JSON.stringify({
        id: 'usr-superadmin-root',
        email: 'admin.zadafoods.superad@gmail.com',
        fullName: 'ZaDa Super Administrator',
        role: 'superadmin',
        status: 'active',
        permissions: ['cms.homepage', 'cms.hero_banners', 'cms.festivals']
      })
    );
  });

  describe('1. Festival Presets & Initialization', () => {
    it('initializes with all 6 required festival presets and default ZaDa theme', () => {
      renderWithAllProviders(<AdminFestivals />);

      expect(screen.getByText(/Festival Themes & Seasonal Promotions/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Default ZaDa Theme/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Diwali Festival of Lights/i)).toBeInTheDocument();
      expect(screen.getByText(/Christmas & Holiday Season/i)).toBeInTheDocument();
      expect(screen.getByText(/New Year Celebrations/i)).toBeInTheDocument();
      expect(screen.getByText(/Onam Harvest Festival/i)).toBeInTheDocument();
      expect(screen.getByText(/Eid Mubarak Celebrations/i)).toBeInTheDocument();
    });

    it('identifies Default ZaDa Theme as initial active state', () => {
      renderWithAllProviders(<AdminFestivals />);
      expect(screen.getByText('Active Standard Storefront')).toBeInTheDocument();
    });
  });

  describe('2. Admin Festival Theme Activation & Deactivation', () => {
    it('allows administrator to select and activate the Diwali festival theme', async () => {
      renderWithAllProviders(<AdminFestivals />);

      // Click Diwali Preset card
      const diwaliBtn = screen.getByRole('button', { name: /Diwali Festival of Lights/i });
      fireEvent.click(diwaliBtn);

      // Verify theme settings section switches to Diwali
      expect(screen.getByText(/Theme Settings: Diwali Festival of Lights/i)).toBeInTheDocument();

      // Click Publish & Activate
      const activateBtn = screen.getByRole('button', { name: /Publish & Activate/i });
      fireEvent.click(activateBtn);

      await waitFor(() => {
        expect(screen.getByText(/Festival Theme Activated/i)).toBeInTheDocument();
        expect(screen.getByText('Active Festive Theme')).toBeInTheDocument();
      });

      // Verify persistence in localStorage
      const savedThemes: FestivalTheme[] = JSON.parse(localStorage.getItem('zada_festival_themes') || '[]');
      const diwaliSaved = savedThemes.find((t) => t.preset === 'diwali');
      expect(diwaliSaved?.isActive).toBe(true);
    });

    it('allows one-click restoration of the Default ZaDa Theme', async () => {
      // Start with Christmas active
      const christmasActiveThemes = INITIAL_FESTIVAL_PRESETS.map((t) => ({
        ...t,
        isActive: t.preset === 'christmas'
      }));
      localStorage.setItem('zada_festival_themes', JSON.stringify(christmasActiveThemes));

      renderWithAllProviders(<AdminFestivals />);

      const restoreBtn = screen.getByRole('button', { name: /Restore Default ZaDa/i });
      fireEvent.click(restoreBtn);

      const confirmBtn = await screen.findByRole('button', { name: /Confirm Restore Default/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByText(/Active Standard Storefront/i)).toBeInTheDocument();
      });

      const savedThemes: FestivalTheme[] = JSON.parse(localStorage.getItem('zada_festival_themes') || '[]');
      const defaultSaved = savedThemes.find((t) => t.preset === 'default');
      expect(defaultSaved?.isActive).toBe(true);
    });
  });

  describe('3. Festival Storefront Decorative Elements', () => {
    it('renders Diwali announcement bar with greeting, motif, and coupon code', async () => {
      const diwaliActive = INITIAL_FESTIVAL_PRESETS.map((t) => ({
        ...t,
        isActive: t.preset === 'diwali'
      }));
      localStorage.setItem('zada_festival_themes', JSON.stringify(diwaliActive));

      renderWithAllProviders(<FestivalAnnouncementBar />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByText(/Shubh Deepavali/i)).toBeInTheDocument();
      expect(screen.getByText(/Diwali Special/i)).toBeInTheDocument();
      expect(screen.getByText('DIWALI20')).toBeInTheDocument();
    });

    it('renders hero banner overlay with corner flourishes when active', () => {
      const onamActive = INITIAL_FESTIVAL_PRESETS.map((t) => ({
        ...t,
        isActive: t.preset === 'onam',
        intensity: 'moderate'
      }));
      localStorage.setItem('zada_festival_themes', JSON.stringify(onamActive));

      const { container } = renderWithAllProviders(<FestivalHeroOverlay />);

      // Corner flourishes are rendered via SVG paths
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('renders discrete "Festive Pick" badge on product card without obstructing product info', () => {
      const eidActive = INITIAL_FESTIVAL_PRESETS.map((t) => ({
        ...t,
        isActive: t.preset === 'eid',
        featuredProductIds: ['prod-1']
      }));
      localStorage.setItem('zada_festival_themes', JSON.stringify(eidActive));

      renderWithAllProviders(<ProductCard product={mockTestProduct} />);

      expect(screen.getByText('FESTIVE PICK')).toBeInTheDocument();
      // Verifies core purchase action remains intact
      expect(screen.getByRole('button', { name: /Add Wayanad Banana Chips to cart/i })).toBeInTheDocument();
      expect(screen.getByText('Wayanad Banana Chips')).toBeInTheDocument();
    });

    it('decorates section headers with subtle flanking festival motifs', () => {
      const xmasActive = INITIAL_FESTIVAL_PRESETS.map((t) => ({
        ...t,
        isActive: t.preset === 'christmas'
      }));
      localStorage.setItem('zada_festival_themes', JSON.stringify(xmasActive));

      const { container } = renderWithAllProviders(
        <FestivalSectionHeader>
          <h2>Handcrafted Kerala Halwa</h2>
        </FestivalSectionHeader>
      );

      expect(screen.getByText('Handcrafted Kerala Halwa')).toBeInTheDocument();
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBe(2); // Flanking motifs left and right
    });

    it('renders zero festival decorations when Default ZaDa theme is active', () => {
      renderWithAllProviders(<FestivalAnnouncementBar />);
      expect(screen.queryByRole('banner')).toBeNull();

      const { container } = renderWithAllProviders(<FestivalHeroOverlay />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('4. Schedule Activation & Expiry Rules', () => {
    it('respects start and end date scheduling correctly', () => {
      const testTheme: FestivalTheme = {
        ...INITIAL_FESTIVAL_PRESETS[1], // Diwali
        isActive: true,
        startDate: '2026-11-01T00:00:00Z',
        endDate: '2026-11-15T23:59:59Z'
      };

      // Before start date
      const beforeDate = new Date('2026-10-25T00:00:00Z');
      expect(isThemeWithinSchedule(testTheme, beforeDate)).toBe(false);

      // Within schedule
      const duringDate = new Date('2026-11-05T00:00:00Z');
      expect(isThemeWithinSchedule(testTheme, duringDate)).toBe(true);

      // After expiry date
      const afterDate = new Date('2026-11-20T00:00:00Z');
      expect(isThemeWithinSchedule(testTheme, afterDate)).toBe(false);
    });
  });

  describe('5. Decorative Intensity & Placements Control', () => {
    it('allows changing decorative intensity to subtle, moderate, and festive', async () => {
      renderWithAllProviders(<AdminFestivals />);

      const festiveIntensityBtn = screen.getByRole('button', { name: /^festive$/i });
      fireEvent.click(festiveIntensityBtn);

      const saveBtn = screen.getByRole('button', { name: /Save Theme Changes/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/Theme Updated/i)).toBeInTheDocument();
      });
    });

    it('does not render announcement bar if its placement toggle is disabled', () => {
      const diwaliBarDisabled = INITIAL_FESTIVAL_PRESETS.map((t) => ({
        ...t,
        isActive: t.preset === 'diwali',
        placements: {
          heroBanners: true,
          promoBanners: true,
          productCards: true,
          categorySections: true,
          announcementBar: false
        }
      }));
      localStorage.setItem('zada_festival_themes', JSON.stringify(diwaliBarDisabled));

      renderWithAllProviders(<FestivalAnnouncementBar />);
      expect(screen.queryByRole('banner')).toBeNull();
    });
  });

  describe('6. Custom Campaign Creation without Code Changes', () => {
    it('allows creating, saving, and managing a brand new custom seasonal campaign', async () => {
      renderWithAllProviders(<AdminFestivals />);

      const newCampaignBtn = screen.getByRole('button', { name: /New Campaign/i });
      fireEvent.click(newCampaignBtn);

      expect(screen.getByText(/Create Custom Festival or Campaign/i)).toBeInTheDocument();

      const nameInput = screen.getByPlaceholderText(/e\.g\. Kerala Monsoon Festival/i);
      fireEvent.change(nameInput, { target: { value: 'Kerala Monsoon Mela' } });

      const couponInput = screen.getByPlaceholderText(/e\.g\. MONSOON15/i);
      fireEvent.change(couponInput, { target: { value: 'MONSOON20' } });

      await waitFor(() => {
        expect(nameInput).toHaveValue('Kerala Monsoon Mela');
      });

      const submitBtn = screen.getByRole('button', { name: /Create Campaign/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Campaign Created/i)).toBeInTheDocument();
        expect(screen.getByText('Kerala Monsoon Mela')).toBeInTheDocument();
      });

      const savedThemes: FestivalTheme[] = JSON.parse(localStorage.getItem('zada_festival_themes') || '[]');
      expect(savedThemes.some((t) => t.name === 'Kerala Monsoon Mela' && t.preset === 'custom')).toBe(true);
    });
  });

  describe('7. Immersive Visual Design Systems & Atmosphere', () => {
    it('renders distinct atmospheric background patterns and ornamental section dividers for active festival', () => {
      const diwaliActive = INITIAL_FESTIVAL_PRESETS.map((t) => ({
        ...t,
        isActive: t.preset === 'diwali'
      }));
      localStorage.setItem('zada_festival_themes', JSON.stringify(diwaliActive));

      const { container } = renderWithAllProviders(
        <div>
          <FestivalAtmosphere />
          <FestivalDivider />
          <FestivalFooterDecoration />
        </div>
      );

      // Section divider & footer rendered with Diwali motif and text
      expect(screen.getAllByText(/Diwali Festival of Lights/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Wishing you a joyous/i)).toBeInTheDocument();
      // SVG motifs are present in atmosphere and divider
      expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
    });

    it('renders clean standard dividers without decorations when Default ZaDa theme is active', () => {
      const { container } = renderWithAllProviders(
        <div>
          <FestivalAtmosphere />
          <FestivalDivider />
          <FestivalFooterDecoration />
        </div>
      );

      expect(screen.queryByText(/Wishing you a joyous/i)).toBeNull();
      // An ordinary hr is rendered
      expect(container.querySelector('hr')).toBeInTheDocument();
    });
  });

  describe('8. 4-Level Visual Intensity Calibration', () => {
    it('supports all 4 visual intensity levels: subtle, balanced, rich, grand', async () => {
      renderWithAllProviders(<AdminFestivals />);

      const levels = ['subtle', 'balanced', 'rich', 'grand'];
      for (const lvl of levels) {
        const btn = screen.getByRole('button', { name: new RegExp(`^${lvl}$`, 'i') });
        expect(btn).toBeInTheDocument();
        fireEvent.click(btn);
      }
    });
  });

  describe('9. Product Badges Lifecycle & Specific Labels', () => {
    it('renders specific badge labels: Festive Special, Gift Recommendation, Festival Bestseller, Limited Collection', () => {
      const diwaliActive = INITIAL_FESTIVAL_PRESETS.map((t) => ({
        ...t,
        isActive: t.preset === 'diwali',
        productBadges: {
          'prod-1': 'festive_special' as const,
          'prod-2': 'gift_recommendation' as const,
          'prod-3': 'festival_bestseller' as const,
          'prod-4': 'limited_collection' as const
        }
      }));
      localStorage.setItem('zada_festival_themes', JSON.stringify(diwaliActive));

      // 1. Festive Special
      const { unmount: u1 } = renderWithAllProviders(<ProductCard product={mockTestProduct} />);
      expect(screen.getByText(/Festive Special/i)).toBeInTheDocument();
      u1();

      // 2. Gift Recommendation
      const prod2 = { ...INITIAL_PRODUCTS[1], id: 'prod-2', name: 'Kozhikode Halwa' };
      const { unmount: u2 } = renderWithAllProviders(<ProductCard product={prod2} />);
      expect(screen.getByText(/Gift Recommendation/i)).toBeInTheDocument();
      u2();

      // 3. Festival Bestseller
      const prod3 = { ...INITIAL_PRODUCTS[2], id: 'prod-3', name: 'Cashew Halwa' };
      const { unmount: u3 } = renderWithAllProviders(<ProductCard product={prod3} />);
      expect(screen.getByText(/Festival Bestseller/i)).toBeInTheDocument();
      u3();

      // 4. Limited Festive Collection
      const prod4 = { ...INITIAL_PRODUCTS[3], id: 'prod-4', name: 'Jackfruit Chips' };
      const { unmount: u4 } = renderWithAllProviders(<ProductCard product={prod4} />);
      expect(screen.getByText(/Limited Festive Collection/i)).toBeInTheDocument();
      u4();
    });
  });

  describe('10. Countdown Timer & Promotional Popups', () => {
    it('renders festive countdown timer with days, hours, minutes and seconds', () => {
      const diwaliActive = INITIAL_FESTIVAL_PRESETS.map((t) => ({
        ...t,
        isActive: t.preset === 'diwali',
        countdown: {
          enabled: true,
          targetDate: new Date(Date.now() + 86400000 * 5).toISOString(),
          label: 'Diwali Festive Savings End In'
        }
      }));
      localStorage.setItem('zada_festival_themes', JSON.stringify(diwaliActive));

      renderWithAllProviders(<FestivalCountdown />);

      expect(screen.getByText(/Diwali Festive Savings End In/i)).toBeInTheDocument();
      expect(screen.getByText(/Days/i)).toBeInTheDocument();
      expect(screen.getByText(/Hours/i)).toBeInTheDocument();
      expect(screen.getByText(/Mins/i)).toBeInTheDocument();
      expect(screen.getByText(/Secs/i)).toBeInTheDocument();
    });

    it('renders promotional split campaign banners when configured', () => {
      const diwaliActive = INITIAL_FESTIVAL_PRESETS.map((t) => ({
        ...t,
        isActive: t.preset === 'diwali'
      }));
      localStorage.setItem('zada_festival_themes', JSON.stringify(diwaliActive));

      renderWithAllProviders(<FestivalPromotionSection />);

      expect(screen.getByText(/Curations & Hampers/i)).toBeInTheDocument();
      expect(screen.getByText(/Royal Diwali Sweet & Savoury Curation/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Order Diwali Boxes/i })).toBeInTheDocument();
    });

    it('renders first-visit promotional popup with coupon and dismiss action', () => {
      vi.useFakeTimers();
      const diwaliActive = INITIAL_FESTIVAL_PRESETS.map((t) => ({
        ...t,
        isActive: t.preset === 'diwali'
      }));
      localStorage.setItem('zada_festival_themes', JSON.stringify(diwaliActive));

      renderWithAllProviders(<FestivalPopup />);

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Shubh Deepavali Exclusive Offer/i)).toBeInTheDocument();
      expect(screen.getByText('DIWALI20')).toBeInTheDocument();

      const closeBtn = screen.getByRole('button', { name: /Close festival promotion/i });
      fireEvent.click(closeBtn);
      expect(screen.queryByRole('dialog')).toBeNull();
      vi.useRealTimers();
    });
  });

  describe('11. Admin Device Preview Frame Switcher', () => {
    it('allows toggling between Desktop, Tablet, and Mobile visual preview frames', () => {
      renderWithAllProviders(<AdminFestivals />);

      const desktopBtn = screen.getByRole('button', { name: /Desktop Preview/i });
      const tabletBtn = screen.getByRole('button', { name: /Tablet Preview/i });
      const mobileBtn = screen.getByRole('button', { name: /Mobile Preview/i });

      expect(desktopBtn).toBeInTheDocument();
      expect(tabletBtn).toBeInTheDocument();
      expect(mobileBtn).toBeInTheDocument();

      fireEvent.click(tabletBtn);
      fireEvent.click(mobileBtn);
      fireEvent.click(desktopBtn);
    });
  });
});
