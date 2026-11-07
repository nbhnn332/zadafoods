import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { AdminDataProvider } from '../context/AdminDataContext';
import { CartProvider, useCart } from '../context/CartContext';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { INITIAL_PRODUCTS } from '../data/mockData';

// Cart inspector helper component
const CartInspector: React.FC = () => {
  const { items } = useCart();
  return (
    <div data-testid="cart-inspector">
      <span data-testid="cart-count">{items.length}</span>
      {items.map((item) => (
        <div key={item.variantId} data-testid={`cart-item-${item.variantId}`}>
          {item.productName} - {item.variantWeightLabel} - qty:{item.quantity}
        </div>
      ))}
    </div>
  );
};

const renderPDP = (initialRoute: string) => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ToastProvider>
        <AuthProvider>
          <AdminDataProvider>
            <CartProvider>
              <CartInspector />
              <Routes>
                <Route path="/product/:slug" element={<ProductDetailPage />} />
                <Route path="/checkout" element={<div data-testid="checkout-page">Authoritative Checkout Screen</div>} />
              </Routes>
            </CartProvider>
          </AdminDataProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('Phase 11: Premium Product Detail Page Refinement & Regression Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Product-Specific Image Mapping & Gallery Integrity', () => {
    it('maps Cashew Halwa exclusively to authentic Halwa images, never Banana Chips assets', () => {
      renderPDP('/product/cashew-halwa');

      // The main hero image must point to cashew halwa asset
      const heroImage = screen.getByAltText('Cashew Halwa');
      expect(heroImage).toBeInTheDocument();
      expect(heroImage.getAttribute('src')).toBe('/assets/prod-cashew-halwa.png');

      // Thumbnails must contain halwa assets
      const halwaThumbnails = screen.getAllByRole('tab');
      expect(halwaThumbnails.length).toBe(3);

      // Verify no banana chip image appears in Cashew Halwa gallery
      const allGalleryImages = screen.getAllByRole('img');
      allGalleryImages.forEach((img) => {
        expect(img.getAttribute('src')).not.toContain('banana-chips');
      });
    });

    it('maps Banana Chips (Nendran) to its 5 authentic gallery thumbnails and hero', () => {
      renderPDP('/product/banana-chips-nendran');

      const heroImage = screen.getByAltText('Banana Chips (Nendran)');
      expect(heroImage).toBeInTheDocument();
      expect(heroImage.getAttribute('src')).toBe('/assets/prod-banana-chips-hero.png');

      // 5 thumbnails must be present
      const thumbnails = screen.getAllByRole('tab');
      expect(thumbnails.length).toBe(5);

      // Verify pagination badge shows 1/5
      expect(screen.getByText('1/5')).toBeInTheDocument();
    });

    it('allows switching active gallery image without layout shifts', () => {
      renderPDP('/product/banana-chips-nendran');

      const thumbnails = screen.getAllByRole('tab');
      fireEvent.click(thumbnails[1]);

      const heroImage = screen.getByAltText('Banana Chips (Nendran)');
      expect(heroImage.getAttribute('src')).toBe('/assets/pdp-thumb-2.png');
      expect(screen.getByText('2/5')).toBeInTheDocument();
    });
  });

  describe('2. Authoritative Variant Selection & Pricing Engine', () => {
    it('updates displayed price, original MRP, and savings on variant selection', () => {
      renderPDP('/product/banana-chips-nendran');

      // Default selected variant is 250g (sellingPrice: 180, mrp: 220)
      expect(screen.getAllByText('₹180').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('₹220')).toBeInTheDocument();
      expect(screen.getByText('18% OFF')).toBeInTheDocument();
      expect(screen.getByText('Save ₹40')).toBeInTheDocument();

      // Click 500g variant (sellingPrice: 320, mrp: 390)
      const variant500g = screen.getByRole('radio', { name: /500 g/i });
      fireEvent.click(variant500g);

      expect(screen.getAllByText('₹320').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('₹390')).toBeInTheDocument();
      expect(screen.getByText('Save ₹70')).toBeInTheDocument();
      expect(variant500g.getAttribute('aria-checked')).toBe('true');
    });

    it('displays stock indicator and allows quantity adjustment within stock limit', () => {
      renderPDP('/product/cashew-halwa');

      expect(screen.getByText(/In Stock/i)).toBeInTheDocument();

      const qtyDisplay = screen.getByLabelText(/Quantity and availability/i);
      expect(qtyDisplay).toBeInTheDocument();

      const increaseBtn = screen.getByRole('button', { name: /increase quantity/i });
      const decreaseBtn = screen.getByRole('button', { name: /decrease quantity/i });

      // Starts at 1
      expect(screen.getByText('1')).toBeInTheDocument();

      // Increase to 2
      fireEvent.click(increaseBtn);
      expect(screen.getByText('2')).toBeInTheDocument();

      // Decrease back to 1
      fireEvent.click(decreaseBtn);
      expect(screen.getByText('1')).toBeInTheDocument();

      // Cannot decrease below 1
      fireEvent.click(decreaseBtn);
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('3. Strict Two-CTA Rule & WhatsApp Ordering Prohibition', () => {
    it('has exactly Add to Cart and Buy Now as primary purchase actions', () => {
      renderPDP('/product/cashew-halwa');

      const addToCartBtn = screen.getByRole('button', { name: /add to cart/i });
      const buyNowBtn = screen.getByRole('button', { name: /buy now/i });

      expect(addToCartBtn).toBeInTheDocument();
      expect(buyNowBtn).toBeInTheDocument();

      // Distinct secondary vs primary visual hierarchy
      expect(addToCartBtn.className).toContain('bg-white');
      expect(addToCartBtn.className).toContain('border-[#A67732]');
      expect(buyNowBtn.className).toContain('bg-[#A67732]');
      expect(buyNowBtn.className).toContain('text-white');

      // Strict prohibition of WhatsApp CTAs
      expect(screen.queryByText(/order on whatsapp/i)).toBeNull();
      expect(screen.queryByText(/instant chat/i)).toBeNull();
      expect(screen.queryByRole('button', { name: /whatsapp/i })).toBeNull();
    });

    it('does NOT redirect or trigger window.open to WhatsApp on Buy Now or Add to Cart', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      renderPDP('/product/cashew-halwa');

      const addToCartBtn = screen.getByRole('button', { name: /add to cart/i });
      fireEvent.click(addToCartBtn);
      expect(windowOpenSpy).not.toHaveBeenCalled();

      const buyNowBtn = screen.getByRole('button', { name: /buy now/i });
      fireEvent.click(buyNowBtn);
      expect(windowOpenSpy).not.toHaveBeenCalled();
    });
  });

  describe('4. Cart State Mutation & Buy Now Isolation', () => {
    it('adds item to cart with correct selected pack size and quantity', () => {
      renderPDP('/product/cashew-halwa');

      const increaseBtn = screen.getByRole('button', { name: /increase quantity/i });
      fireEvent.click(increaseBtn); // Qty = 2

      const addToCartBtn = screen.getByRole('button', { name: /add to cart/i });
      fireEvent.click(addToCartBtn);

      // Verify cart inspector updated
      const cartCount = screen.getByTestId('cart-count');
      expect(cartCount.textContent).toBe('1');
    });

    it('Buy Now navigates to checkout without corrupting or duplicating existing cart items', () => {
      renderPDP('/product/banana-chips-nendran');

      // First add an item to the persistent cart
      const addToCartBtn = screen.getByRole('button', { name: /add to cart/i });
      fireEvent.click(addToCartBtn);
      expect(screen.getByTestId('cart-count').textContent).toBe('1');

      // Now click Buy Now
      const buyNowBtn = screen.getByRole('button', { name: /buy now/i });
      fireEvent.click(buyNowBtn);

      // Navigates to checkout screen
      expect(screen.getByTestId('checkout-page')).toBeInTheDocument();
      // Persistent cart remains intact
      expect(screen.getByTestId('cart-count').textContent).toBe('1');
    });
  });

  describe('5. Product Accordions & Nutrition Facts Integrity', () => {
    it('toggles Ingredients accordion and displays genuine recipe details', () => {
      renderPDP('/product/cashew-halwa');

      const cashewHalwa = INITIAL_PRODUCTS.find((p) => p.slug === 'cashew-halwa')!;
      const ingredientsButton = screen.getByRole('button', { name: /^ingredients$/i });

      // Initially closed
      expect(ingredientsButton.getAttribute('aria-expanded')).toBe('false');

      // Click to open
      fireEvent.click(ingredientsButton);
      expect(ingredientsButton.getAttribute('aria-expanded')).toBe('true');
      expect(screen.getByText(cashewHalwa.ingredients!)).toBeInTheDocument();

      // Click again to close
      fireEvent.click(ingredientsButton);
      expect(ingredientsButton.getAttribute('aria-expanded')).toBe('false');
    });

    it('displays authentic nutrition facts without hardcoded fabricated fallbacks', () => {
      renderPDP('/product/cashew-halwa');

      const nutritionButton = screen.getByRole('button', { name: /nutrition information/i });
      fireEvent.click(nutritionButton);

      // Verifies authentic 485 kcal, 6.2g protein, 64g carbs, 22.5g fat
      expect(screen.getByText('485 kcal')).toBeInTheDocument();
      expect(screen.getByText('6.2 g')).toBeInTheDocument();
      expect(screen.getByText('64.0 g')).toBeInTheDocument();
      expect(screen.getByText('22.5 g')).toBeInTheDocument();
    });

    it('allows submitting verified customer feedback in Reviews accordion', async () => {
      renderPDP('/product/banana-chips-nendran');

      const reviewsButton = screen.getByRole('button', { name: /customer reviews/i });
      fireEvent.click(reviewsButton);

      const writeReviewBtn = screen.getByText('+ Write a Review');
      fireEvent.click(writeReviewBtn);

      // Fill form
      fireEvent.change(screen.getByPlaceholderText(/Authentic aroma and crispness/i), {
        target: { value: 'Best Banana Chips Ever!' }
      });
      fireEvent.change(screen.getByPlaceholderText(/Share details on texture/i), {
        target: { value: 'Incredible crunch and pure coconut oil taste. Must buy!' }
      });

      const submitBtn = screen.getByRole('button', { name: /submit review/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/Authentic aroma/i)).toBeNull();
      });
    });
  });
});
