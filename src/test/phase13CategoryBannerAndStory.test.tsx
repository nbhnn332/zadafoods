import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CategoryPage } from '../pages/CategoryPage';
import { OurStoryPage } from '../pages/OurStoryPage';
import { AdminCMS } from '../pages/admin/AdminCMS';
import { AdminDataProvider } from '../context/AdminDataContext';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

const renderWithProviders = (ui: React.ReactElement, initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <AdminDataProvider>
              {ui}
            </AdminDataProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('Phase 13: Category Banner CMS, Premium Category UI & Our Story Redesign', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      'zada_auth_user',
      JSON.stringify({
        id: 'usr-admin-1',
        email: 'admin@zadafoods.com',
        fullName: 'ZaDa Administrator',
        phone: '+91 75939 59235',
        role: 'admin',
        createdAt: '2026-01-01T00:00:00Z'
      })
    );
  });

  describe('1. Category Banner CMS Administration (AdminCMS)', () => {
    it('renders the Category Banners management tab in Admin CMS', () => {
      renderWithProviders(<AdminCMS />);

      const tabButton = screen.getByRole('button', { name: /Category Banners/i });
      expect(tabButton).toBeInTheDocument();

      fireEvent.click(tabButton);
      expect(screen.getByText(/Category-Specific Storefront Banners/i)).toBeInTheDocument();
      expect(screen.getByText(/Zero-image CSS-driven banners rendered on/i)).toBeInTheDocument();
    });

    it('lists all categories with their banner status, eyebrow, and theme preview swatch', () => {
      renderWithProviders(<AdminCMS />);
      fireEvent.click(screen.getByRole('button', { name: /Category Banners/i }));

      // Categories should be listed with their slug indicators
      expect(screen.getByText('/chips')).toBeInTheDocument();
      expect(screen.getByText('/sweets')).toBeInTheDocument();
      expect(screen.getByText('/halwa')).toBeInTheDocument();

      // Active status badges should be visible
      const activeBadges = screen.getAllByText(/Active \(Live\)/i);
      expect(activeBadges.length).toBeGreaterThan(0);
    });

    it('opens banner editor modal with live storefront preview and styling presets', () => {
      renderWithProviders(<AdminCMS />);
      fireEvent.click(screen.getByRole('button', { name: /Category Banners/i }));

      // Find edit button for Sweets using unique slug badge
      const sweetsSlug = screen.getByText('/sweets');
      const sweetsCard = sweetsSlug.closest('div.bg-white') as HTMLElement;
      expect(sweetsCard).toBeInTheDocument();

      const editBtn = within(sweetsCard).getByRole('button', { name: /Edit/i });
      fireEvent.click(editBtn);

      // Modal title
      expect(screen.getByText(/Edit Category Banner/i)).toBeInTheDocument();

      // Theme presets should be available
      expect(screen.getByText(/Festive Burgundy/i)).toBeInTheDocument();
      expect(screen.getByText(/Royal Malabar/i)).toBeInTheDocument();

      // Storefront Live Preview container should be visible
      expect(screen.getByText(/Live Storefront Banner Preview/i)).toBeInTheDocument();
    });

    it('allows editing title, subtitle, eyebrow, and saving changes', () => {
      renderWithProviders(<AdminCMS />);
      fireEvent.click(screen.getByRole('button', { name: /Category Banners/i }));

      const chipsSlug = screen.getByText('/chips');
      const chipsCard = chipsSlug.closest('div.bg-white') as HTMLElement;
      const editBtn = within(chipsCard).getByRole('button', { name: /Edit/i });
      fireEvent.click(editBtn);

      // Update eyebrow
      const eyebrowInput = screen.getByDisplayValue(/KERALA'S FAVOURITE SNACKS/i);
      fireEvent.change(eyebrowInput, { target: { value: 'ARTISAN COCONUT OIL CRUNCH' } });

      // Save changes
      const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(saveBtn);

      // Modal closes and changes persist
      expect(screen.queryByText(/Edit Category Banner/i)).toBeNull();
      expect(screen.getByText('ARTISAN COCONUT OIL CRUNCH')).toBeInTheDocument();
    });

    it('supports unpublishing and publishing a category banner', () => {
      renderWithProviders(<AdminCMS />);
      fireEvent.click(screen.getByRole('button', { name: /Category Banners/i }));

      const sweetsSlug = screen.getByText('/sweets');
      const sweetsCard = sweetsSlug.closest('div.bg-white') as HTMLElement;
      const toggleBtn = within(sweetsCard).getByRole('button', { name: /Active \(Live\)/i });

      // Toggle to draft/unpublished
      fireEvent.click(toggleBtn);
      expect(within(sweetsCard).getByText(/Draft \(Hidden\)/i)).toBeInTheDocument();

      // Toggle back to active
      const activateBtn = within(sweetsCard).getByRole('button', { name: /Draft \(Hidden\)/i });
      fireEvent.click(activateBtn);
      expect(within(sweetsCard).getByText(/Active \(Live\)/i)).toBeInTheDocument();
    });

    it('allows restoring sensible defaults for category banners', () => {
      renderWithProviders(<AdminCMS />);
      fireEvent.click(screen.getByRole('button', { name: /Category Banners/i }));

      const restoreButtons = screen.getAllByRole('button', { name: /Restore Defaults/i });
      expect(restoreButtons.length).toBeGreaterThan(0);
      fireEvent.click(restoreButtons[0]);

      // Category remains present
      expect(screen.getByText('/chips')).toBeInTheDocument();
      expect(screen.getByText('/sweets')).toBeInTheDocument();
    });
  });

  describe('2. Dynamic Category Banner Storefront Rendering (CategoryPage)', () => {
    it('renders category-specific banner title, eyebrow, and description for /category/sweets', () => {
      renderWithProviders(
        <Routes>
          <Route path="/shop" element={<CategoryPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
        </Routes>,
        ['/category/sweets']
      );

      // Custom Sweets banner content from mockData/CMS
      expect(screen.getByText(/HERITAGE MALABAR RECIPES/i)).toBeInTheDocument();
      const sweetsHeadings = screen.getAllByRole('heading', { level: 1, name: /Traditional Sweets/i });
      expect(sweetsHeadings.length).toBeGreaterThan(0);
      expect(screen.getByText(/Authentic festival delicacies, traditional Neyyappam/i)).toBeInTheDocument();
    });

    it('renders zero images in the category banner when imageUrl is empty (no broken img tags)', () => {
      renderWithProviders(
        <Routes>
          <Route path="/category/:slug" element={<CategoryPage />} />
        </Routes>,
        ['/category/sweets']
      );

      // Sweets banner has empty imageUrl by default - ensure no banner img is rendered
      const bannerImg = screen.queryByAltText(/Traditional Sweets - Authentic Kerala Delicacies/i);
      expect(bannerImg).toBeNull();

      // Chips banner with genuine asset still renders safely
      const { unmount } = renderWithProviders(
        <Routes>
          <Route path="/category/:slug" element={<CategoryPage />} />
        </Routes>,
        ['/category/chips']
      );
      expect(screen.getByAltText(/Chips - Authentic Kerala Delicacies/i)).toBeInTheDocument();
      unmount();
    });

    it('provides category switcher navigation pills to browse all categories smoothly', () => {
      renderWithProviders(
        <Routes>
          <Route path="/category/:slug" element={<CategoryPage />} />
        </Routes>,
        ['/category/chips']
      );

      // Verify category switcher buttons
      expect(screen.getByRole('button', { name: /^Chips$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Sweets$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Halwa$/i })).toBeInTheDocument();
    });

    it('handles unpublished banners gracefully with an image-free branded fallback', () => {
      // Pre-seed localStorage with inactive chips banner
      const banners = [{
        id: 'cat-ban-chips',
        categoryId: 'cat-chips',
        categorySlug: 'chips',
        title: 'Chips',
        subtitle: 'Traditional chips',
        eyebrow: 'SNACKS',
        isActive: false, // inactive
        displayOrder: 1,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01'
      }];
      localStorage.setItem('zada_admin_category_banners', JSON.stringify(banners));

      renderWithProviders(
        <Routes>
          <Route path="/category/:slug" element={<CategoryPage />} />
        </Routes>,
        ['/category/chips']
      );

      // Fallback renders category name and description without crashing
      const fallbackHeadings = screen.getAllByRole('heading', { level: 1, name: /Chips/i });
      expect(fallbackHeadings.length).toBeGreaterThan(0);
      // No hero img should be rendered for inactive banner
      expect(screen.queryByAltText(/Chips - Authentic Kerala Delicacies/i)).toBeNull();
    });
  });

  describe('3. Editorial Our Story Redesign (OurStoryPage)', () => {
    it('strictly renders ZERO <img> tags in the editorial story content', () => {
      const { container } = renderWithProviders(<OurStoryPage />, ['/our-story']);

      const mainContent = container.querySelector('main');
      expect(mainContent).toBeInTheDocument();
      const imagesInMain = mainContent?.querySelectorAll('img') || [];
      expect(imagesInMain.length).toBe(0);
    });

    it('renders the editorial hero, brand heritage, and founding narrative', () => {
      renderWithProviders(<OurStoryPage />, ['/our-story']);

      expect(screen.getByText(/EST\. KERALA, INDIA • HERITAGE FLAVOURS/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1, name: /Rooted in Kerala/i })).toBeInTheDocument();
      expect(screen.getByText(/Preserving the Art of Traditional Kerala Delicacies/i)).toBeInTheDocument();
      expect(screen.getByText(/OUR HERITAGE & ORIGINS/i)).toBeInTheDocument();
    });

    it('displays the 4 Pillars of Craftsmanship with pure CSS styling', () => {
      renderWithProviders(<OurStoryPage />, ['/our-story']);

      expect(screen.getByText(/100% Pure Coconut Oil/i)).toBeInTheDocument();
      expect(screen.getByText(/Farm-Direct Nendran Bananas/i)).toBeInTheDocument();
      expect(screen.getByText(/Small-Batch Heritage Cooking/i)).toBeInTheDocument();
      expect(screen.getByText(/Zero Chemical Preservatives/i)).toBeInTheDocument();
    });

    it('displays the 4 Guiding Principles', () => {
      renderWithProviders(<OurStoryPage />, ['/our-story']);

      expect(screen.getByText(/Authenticity Over Speed/i)).toBeInTheDocument();
      expect(screen.getByText(/Ingredient Integrity/i)).toBeInTheDocument();
      expect(screen.getByText(/Farmer Partnerships/i)).toBeInTheDocument();
      expect(screen.getByText(/Rigorous Food Safety/i)).toBeInTheDocument();
    });

    it('displays verified FSSAI registration and customer care helpline', () => {
      renderWithProviders(<OurStoryPage />, ['/our-story']);

      expect(screen.getAllByText(/21326145000345|11322999000123/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/\+91 75939 59235/i).length).toBeGreaterThan(0);
    });

    it('renders dual conversion action CTAs to Shop All Delicacies and Corporate Bulk Orders', () => {
      renderWithProviders(<OurStoryPage />, ['/our-story']);

      const shopLink = screen.getByRole('link', { name: /Explore The Shop/i });
      expect(shopLink).toBeInTheDocument();
      expect(shopLink).toHaveAttribute('href', '/shop');

      const bulkLink = screen.getByRole('link', { name: /Bulk & Corporate Enquiries/i });
      expect(bulkLink).toBeInTheDocument();
      expect(bulkLink).toHaveAttribute('href', '/bulk-orders');
    });
  });
});
