import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { CategoryPage } from '../pages/CategoryPage';
import { ContentPage } from '../pages/ContentPage';
import { BulkEnquiriesPage } from '../pages/BulkEnquiriesPage';
import { AdminDataProvider, useAdminData } from '../context/AdminDataContext';
import { CartProvider } from '../context/CartContext';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';

// Helper component to trigger dynamic banner update from CMS
const BannerMutator: React.FC = () => {
  const { addBanner } = useAdminData();
  return (
    <button
      data-testid="add-cms-banner"
      onClick={() =>
        addBanner({
          title: 'Special Malabar Diwali Delicacies',
          subtitle: 'Freshly prepared pure ghee Cashew Halwa and Neyyappam.',
          imageUrl: '/assets/cat-halwa.png',
          linkUrl: '/category/halwa',
          displayOrder: 0,
          isActive: true
        })
      }
    >
      Add Dynamic Banner
    </button>
  );
};

const renderApp = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ToastProvider>
        <AuthProvider>
          <AdminDataProvider>
            <CartProvider>
              <BannerMutator />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<CategoryPage />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/our-story" element={<ContentPage forcedSlug="about" />} />
                <Route path="/about" element={<ContentPage forcedSlug="about" />} />
                <Route path="/bulk-orders" element={<BulkEnquiriesPage />} />
                <Route path="/bulk-enquiries" element={<BulkEnquiriesPage />} />
              </Routes>
            </CartProvider>
          </AdminDataProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('Phase 12: Simplified Navigation & Premium Homepage Refinement', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Simplified Primary Navigation (Strict 4-Destination Requirement)', () => {
    it('renders ONLY the four approved primary destinations on desktop navigation', () => {
      renderApp('/');

      // Locate desktop navigation bar specifically
      const desktopNav = screen.getByRole('navigation', { name: 'Main Navigation' });
      expect(desktopNav).toBeInTheDocument();

      // Check the 4 mandatory primary destinations inside the desktop header
      const homeLink = within(desktopNav).getByRole('link', { name: /^home$/i });
      const shopLink = within(desktopNav).getByRole('link', { name: /^shop$/i });
      const storyLink = within(desktopNav).getByRole('link', { name: /^our story$/i });
      const bulkLink = within(desktopNav).getByRole('link', { name: /^bulk orders$/i });

      expect(homeLink).toBeInTheDocument();
      expect(shopLink).toBeInTheDocument();
      expect(storyLink).toBeInTheDocument();
      expect(bulkLink).toBeInTheDocument();

      // Verify category links are REMOVED from the desktop header navigation
      expect(within(desktopNav).queryByRole('link', { name: /^snacks & chips$/i })).toBeNull();
      expect(within(desktopNav).queryByRole('link', { name: /^halwa$/i })).toBeNull();
      expect(within(desktopNav).queryByRole('link', { name: /^sweets$/i })).toBeNull();
      expect(within(desktopNav).queryByRole('link', { name: /^gift packs$/i })).toBeNull();
    });

    it('navigates to the main shop catalogue when clicking Shop', async () => {
      renderApp('/');

      const desktopNav = screen.getByRole('navigation', { name: 'Main Navigation' });
      const shopLink = within(desktopNav).getByRole('link', { name: /^shop$/i });
      fireEvent.click(shopLink);

      await waitFor(() => {
        expect(screen.getByText(/Shop by Category|Snacks/i)).toBeInTheDocument();
      });
    });

    it('navigates to verified Our Story page when clicking Our Story', async () => {
      renderApp('/');

      const desktopNav = screen.getByRole('navigation', { name: 'Main Navigation' });
      const storyLink = within(desktopNav).getByRole('link', { name: /^our story$/i });
      fireEvent.click(storyLink);

      await waitFor(() => {
        expect(screen.getByText(/Our Kerala Heritage & Pure Flavors/i)).toBeInTheDocument();
        expect(screen.getByText(/Wayanad/i)).toBeInTheDocument();
      });
    });

    it('navigates to Bulk Orders enquiry destination when clicking Bulk Orders', async () => {
      renderApp('/');

      const desktopNav = screen.getByRole('navigation', { name: 'Main Navigation' });
      const bulkLink = within(desktopNav).getByRole('link', { name: /^bulk orders$/i });
      fireEvent.click(bulkLink);

      await waitFor(() => {
        expect(screen.getByText(/Corporate & Wedding Gifting/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Your Name/i)).toBeInTheDocument();
      });
    });
  });

  describe('2. Homepage Content Hierarchy & Conversion Architecture', () => {
    it('renders all key sections in a coherent, conversion-focused sequence', () => {
      renderApp('/');

      // 1. Hero banner with Shop Now CTA
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /shop now/i })).toBeInTheDocument();

      // 2. Brand quality / USP highlights
      expect(screen.getByText(/Zero Artificial/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Cold-Pressed/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Wayanad/i).length).toBeGreaterThanOrEqual(1);

      // 3. Shop by Category
      expect(screen.getByRole('heading', { name: /shop by category/i })).toBeInTheDocument();

      // 4. Bestsellers
      expect(screen.getByRole('heading', { name: /bestsellers/i })).toBeInTheDocument();

      // 5. Traditional Sweets & Specialties (Additional Featured Collections)
      expect(screen.getByRole('heading', { name: /traditional sweets & specialties/i })).toBeInTheDocument();

      // 6. Our Story Teaser
      expect(screen.getByRole('heading', { name: /pure ingredients, generational craft/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /read our story/i })).toBeInTheDocument();

      // 7. Bulk Orders CTA
      expect(screen.getByRole('heading', { name: /planning a festive gathering/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /request bulk quote/i })).toBeInTheDocument();

      // 8. Clean Comprehensive Footer
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      expect(screen.getByText(/FSSAI Lic\. No:/i)).toBeInTheDocument();
    });
  });

  describe('3. Dynamic CMS Banner Updates on Homepage', () => {
    it('dynamically reflects new or edited banners saved via Admin CMS', async () => {
      renderApp('/');

      // Initially renders default hero banner
      expect(screen.getByText(/Authentic Kerala Flavours Delivered to Your Home/i)).toBeInTheDocument();

      // Simulate admin CMS adding a new active banner
      const addBannerBtn = screen.getByTestId('add-cms-banner');
      fireEvent.click(addBannerBtn);

      // Homepage immediately updates to show the CMS-configured banner
      await waitFor(() => {
        expect(screen.getByText('Special Malabar Diwali Delicacies')).toBeInTheDocument();
        expect(screen.getByText(/Freshly prepared pure ghee Cashew Halwa/i)).toBeInTheDocument();
      });
    });
  });

  describe('4. Working Bulk Orders Submission', () => {
    it('submits a bulk order enquiry and shows confirmation feedback', async () => {
      renderApp('/bulk-orders');

      // Fill in enquiry form
      fireEvent.change(screen.getByPlaceholderText(/Your Name/i), { target: { value: 'Rahul Menon' } });
      fireEvent.change(screen.getByPlaceholderText(/Company or Family Name/i), { target: { value: 'Kerala IT Hub' } });
      fireEvent.change(screen.getByPlaceholderText(/name@company\.com/i), { target: { value: 'rahul@keralait.org' } });
      fireEvent.change(screen.getByPlaceholderText(/98765 43210/i), { target: { value: '+91 98470 12345' } });
      fireEvent.change(screen.getByPlaceholderText(/Mention required delivery date/i), {
        target: { value: 'Need 100 festive gift boxes delivered to Kochi office by next week.' }
      });

      const submitBtn = screen.getByRole('button', { name: /submit bulk enquiry/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Enquiry Received!/i)).toBeInTheDocument();
        expect(screen.getByText(/Rahul Menon/i)).toBeInTheDocument();
      });
    });
  });
});
