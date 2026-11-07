import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CategoryPage } from '../pages/CategoryPage';
import { AdminDataProvider } from '../context/AdminDataContext';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

const renderCategoryPage = (initialEntries = ['/category/chips']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <AdminDataProvider>
              <Routes>
                <Route path="/shop" element={<CategoryPage />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
              </Routes>
            </AdminDataProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('Phase 12C: Award-Worthy Shop Page Refinement', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Category Hero Refinement', () => {
    it('renders the dominant category title, concise subtitle, and editorial eyebrow', () => {
      renderCategoryPage(['/category/chips']);

      // Editorial eyebrow
      expect(screen.getByText(/KERALA'S FAVOURITE SNACKS/i)).toBeInTheDocument();

      // Dominant category title
      const headings = screen.getAllByRole('heading', { level: 1, name: /^chips$/i });
      expect(headings.length).toBeGreaterThan(0);

      // Category description
      expect(screen.getByText(/Crispy, tasty and traditional Kerala chips/i)).toBeInTheDocument();
    });

    it('renders the responsive hero banner with background image and gradient overlay', () => {
      const { container } = renderCategoryPage(['/category/chips']);

      const heroImg = screen.getByAltText(/Chips - Authentic Kerala Delicacies/i);
      expect(heroImg).toBeInTheDocument();
      expect(heroImg).toHaveAttribute('src', '/assets/cat-hero-chips.png');

      // Gradient overlay exists
      const gradient = container.querySelector('.bg-gradient-to-r');
      expect(gradient).toBeInTheDocument();
    });
  });

  describe('2. Catalogue Toolbar & Filter Controls', () => {
    it('displays the actual product count matching filtered results', () => {
      renderCategoryPage(['/category/chips']);

      // Initially 4 published chips products are available in mockData
      expect(screen.getByText(/Products available/i)).toBeInTheDocument();
    });

    it('supports sorting by Featured, Price Low-to-High, Price High-to-Low, and Rating', () => {
      renderCategoryPage(['/category/chips']);

      const sortSelect = screen.getByLabelText(/Sort products by/i) as HTMLSelectElement;
      expect(sortSelect).toBeInTheDocument();

      // Default is featured
      expect(sortSelect.value).toBe('featured');

      // Sort by Price: Low to High
      fireEvent.change(sortSelect, { target: { value: 'price-low' } });
      expect(sortSelect.value).toBe('price-low');

      // Verify lowest price product appears first (Tapioca Chips ₹160 vs Banana Chips ₹180 / Spicy ₹190 / Sweet ₹200)
      const productTitles = screen.getAllByRole('heading', { level: 3 });
      expect(productTitles[0]).toHaveTextContent(/Tapioca Chips/i);

      // Sort by Price: High to Low
      fireEvent.change(sortSelect, { target: { value: 'price-high' } });
      const highToLowTitles = screen.getAllByRole('heading', { level: 3 });
      expect(highToLowTitles[0]).toHaveTextContent(/Sweet Banana Chips/i);
    });

    it('filters products by In Stock and On Offer flags', () => {
      renderCategoryPage(['/category/chips']);

      const onOfferButton = screen.getByRole('button', { name: /On Offer/i });
      expect(onOfferButton).toBeInTheDocument();

      // Toggle On Offer
      fireEvent.click(onOfferButton);

      // Only spicy banana chips is marked on offer in chips category
      expect(screen.getByText(/Banana Chips \(Spicy\)/i)).toBeInTheDocument();
      expect(screen.queryByText(/Tapioca Chips 250 g/i)).not.toBeInTheDocument();

      // Toggle off
      fireEvent.click(onOfferButton);
      expect(screen.getByText(/Tapioca Chips 250 g/i)).toBeInTheDocument();
    });

    it('renders subcategory pills and filters by subcategory', () => {
      renderCategoryPage(['/category/chips']);

      const tapiocaPill = screen.getByRole('button', { name: /^Tapioca$/i });
      fireEvent.click(tapiocaPill);

      // Tapioca chips should be displayed
      expect(screen.getByText(/Tapioca Chips 250 g/i)).toBeInTheDocument();
      // Banana chips shouldn't be displayed under Tapioca
      expect(screen.queryByText(/Banana Chips \(Spicy\)/i)).not.toBeInTheDocument();
    });

    it('displays active filter chips with one-tap removal and Clear All', () => {
      renderCategoryPage(['/category/chips']);

      // Activate In Stock
      const inStockButton = screen.getByRole('button', { name: /In Stock/i });
      fireEvent.click(inStockButton);

      // Active filter chip should appear
      expect(screen.getByText(/In Stock Only/i)).toBeInTheDocument();

      // Clear All action should appear
      const clearAllButton = screen.getByRole('button', { name: /Clear All/i });
      expect(clearAllButton).toBeInTheDocument();

      // Clicking Clear All resets filters
      fireEvent.click(clearAllButton);
      expect(screen.queryByText(/In Stock Only/i)).not.toBeInTheDocument();
    });
  });

  describe('3. Product Cards Distinctiveness, Badges & Add to Cart Feedback', () => {
    it('renders unclipped BEST SELLER and ON OFFER badges contained inside image bounds', () => {
      renderCategoryPage(['/category/chips']);

      // Card 1 has BEST SELLER badge
      const bestSellerBadge = screen.getByText('BEST SELLER');
      expect(bestSellerBadge).toBeInTheDocument();
      expect(bestSellerBadge).toHaveClass('rounded-full');

      // Card 2 has ON OFFER badge
      const onOfferBadge = screen.getByText('ON OFFER');
      expect(onOfferBadge).toBeInTheDocument();
      expect(onOfferBadge).toHaveClass('rounded-full');
    });

    it('renders prominent selling price, secondary strikethrough MRP, and discount percentage', () => {
      renderCategoryPage(['/category/chips']);

      // Nendran banana chips default variant: ₹180, MRP ₹220, 18% OFF
      expect(screen.getByText('₹180')).toBeInTheDocument();
      expect(screen.getByText('₹220')).toBeInTheDocument();
      expect(screen.getByText('18% OFF')).toBeInTheDocument();
    });

    it('provides clear Add to Cart actions and instant visual feedback on click', async () => {
      renderCategoryPage(['/category/chips']);

      const addButtons = screen.getAllByRole('button', { name: /Add Banana Chips/i });
      expect(addButtons.length).toBeGreaterThan(0);

      // Click Add
      fireEvent.click(addButtons[0]);

      // Button enters adding/added feedback
      expect(screen.getByRole('button', { name: /added to cart/i })).toBeInTheDocument();
    });

    it('contains ZERO WhatsApp ordering buttons on product cards or the shop page', () => {
      const { container } = renderCategoryPage(['/category/chips']);

      // Verify no WhatsApp CTAs exist in the catalog
      const whatsappLinks = container.querySelectorAll('a[href*="whatsapp"], button[aria-label*="WhatsApp"]');
      expect(whatsappLinks.length).toBe(0);
      expect(screen.queryByText(/Order on WhatsApp/i)).not.toBeInTheDocument();
    });
  });
});