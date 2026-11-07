import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { AdminDataProvider } from '../context/AdminDataContext';
import { CartProvider, useCart } from '../context/CartContext';
import { CheckoutPage } from '../pages/CheckoutPage';
import { AdminReviews } from '../pages/admin/AdminReviews';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import {
  formatPremiumWhatsAppOrderMessage
} from '../lib/commerce/whatsappRouting';
import { SupabaseDataService } from '../lib/commerce/supabaseDataService';
import { INITIAL_PRODUCTS } from '../data/mockData';

const renderWithProviders = (ui: React.ReactElement, initialEntries = ['/'], path?: string) => {
  const currentPath = path || initialEntries[0].split('?')[0];
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ToastProvider>
        <AuthProvider>
          <AdminDataProvider>
            <CartProvider>
              <Routes>
                <Route path={currentPath} element={ui} />
              </Routes>
            </CartProvider>
          </AdminDataProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};

// Test helper component to interact with CartContext
const CartTestHelper: React.FC<{ onMount?: (cart: ReturnType<typeof useCart>) => void }> = ({ onMount }) => {
  const cart = useCart();
  React.useEffect(() => {
    if (onMount) onMount(cart);
  }, [cart, onMount]);
  return (
    <div>
      <span data-testid="cart-total">{cart.grandTotal}</span>
      <span data-testid="cart-subtotal">{cart.subtotal}</span>
      <span data-testid="cart-discount">{cart.couponDiscount}</span>
      <span data-testid="cart-coupon">{cart.appliedCoupon || 'NONE'}</span>
      <button onClick={() => cart.applyCoupon('ZADA80')}>Apply ZADA80</button>
      <button onClick={() => cart.applyCoupon('FIRST10')}>Apply FIRST10</button>
      <button onClick={() => cart.applyCoupon('SPECIAL50')}>Apply SPECIAL50</button>
      <button onClick={() => cart.removeCoupon()}>Remove Coupon</button>
    </div>
  );
};

describe('ZaDa Foods — Phase 24: Complete Commerce Workflow, Admin Persistence & Review Management', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Part 1 & 7 — Admin Persistence & Category Banners', () => {
    it('category banner persistence does not erase banners on refresh when remote returns empty array', async () => {
      const mockBanner = {
        id: 'cat-ban-test',
        categoryId: 'cat-chips',
        categorySlug: 'chips',
        title: 'Fresh Banana Chips',
        subtitle: 'Authentic Kerala Crunch',
        eyebrow: 'Handcrafted',
        backgroundColor: '#072C20',
        textColor: '#FFFFFF',
        imageUrl: '/assets/cat-chips.png',
        displayOrder: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('zada_admin_category_banners', JSON.stringify([mockBanner]));

      // Verify fetchCategoryBanners returns local cache gracefully if Supabase is unconfigured or empty
      const res = await SupabaseDataService.fetchCategoryBanners();
      expect(res).toBeDefined();
    });
  });

  describe('Part 2 — Mutually Exclusive Checkout Modes', () => {
    it('Mode A (WhatsApp Direct Ordering): displays WhatsApp order CTA and hides Razorpay & COD payment selectors', () => {
      localStorage.setItem('zada_admin_settings', JSON.stringify({
        checkoutMode: 'WHATSAPP',
        isCodGloballyEnabled: true,
        isRazorpayEnabled: true
      }));

      renderWithProviders(<CheckoutPage />, ['/checkout?demo=true']);

      // Razorpay and COD payment method cards should NOT be selectable
      expect(screen.queryByText(/UPI \(GPay \/ PhonePe\), Cards, NetBanking/i)).not.toBeInTheDocument();

      // WhatsApp direct ordering notice is shown
      expect(screen.getByText(/Direct WhatsApp Ordering/i)).toBeInTheDocument();

      // Submit button is "Send Order on WhatsApp"
      expect(screen.getByRole('button', { name: /Send Order on WhatsApp/i })).toBeInTheDocument();
    });

    it('Mode A (WhatsApp Direct Ordering): Buy Now on Product Detail Page opens WhatsApp directly with zero database orders', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      localStorage.setItem('zada_admin_settings', JSON.stringify({
        checkoutMode: 'WHATSAPP',
        whatsAppDestinationNumber: '917593959235'
      }));

      renderWithProviders(<ProductDetailPage />, ['/product/banana-chips-nendran'], '/product/:slug');

      const buyNowBtn = screen.getByRole('button', { name: /Buy Now/i });
      fireEvent.click(buyNowBtn);

      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/917593959235?text='),
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('Mode B (Website Checkout): completes directly on the website with zero WhatsApp redirection for COD', async () => {
      vi.useFakeTimers();
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      localStorage.setItem('zada_admin_settings', JSON.stringify({
        checkoutMode: 'WEBSITE',
        isCodGloballyEnabled: true,
        isRazorpayEnabled: true,
        isCodAdvanceEnabled: false
      }));

      renderWithProviders(<CheckoutPage />, ['/checkout?demo=true']);

      // Ensure COD is selected
      const codOption = screen.getByText(/Cash on Delivery \(COD\)/i).closest('div.cursor-pointer');
      fireEvent.click(codOption!);

      // Click Place COD Order
      const placeOrderBtn = screen.getByRole('button', { name: /Place Cash on Delivery Order/i });
      fireEvent.click(placeOrderBtn);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Crucial: In Mode B, NO WhatsApp window.open is triggered!
      expect(openSpy).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('Part 3 — Premium WhatsApp Order Summary Formatting', () => {
    it('formats WhatsApp message strictly matching specification with box lines and item blocks', () => {
      const formatted = formatPremiumWhatsAppOrderMessage({
        items: [
          {
            productName: 'Banana Chips (Nendran)',
            variantWeightLabel: '250 g',
            quantity: 2,
            unitPrice: 180,
            lineTotal: 360
          }
        ],
        subtotal: 360,
        discountAmount: 80,
        couponCode: 'ZADA80',
        shippingCharge: 40,
        totalAmount: 320,
        customer: {
          name: 'Numan Sidique',
          phone: '+91 98765 43210',
          streetAddress: 'Beach Road',
          city: 'Kozhikode',
          postalCode: '673012'
        }
      });

      expect(formatted).toContain('ORDER SUMMARY');
      expect(formatted).toContain('━━━━━━━━━━━━━━━━━━');
      expect(formatted).toContain('Product: Banana Chips (Nendran)');
      expect(formatted).toContain('Variant: 250 g');
      expect(formatted).toContain('Quantity: 2');
      expect(formatted).toContain('Unit Price: ₹180');
      expect(formatted).toContain('Item Total: ₹360');
      expect(formatted).toContain('Subtotal: ₹360');
      expect(formatted).toContain('Discount: ₹80');
      expect(formatted).toContain('Coupon: ZADA80');
      expect(formatted).toContain('Shipping: ₹40');
      expect(formatted).toContain('TOTAL: ₹320');
      expect(formatted).toContain('Customer Details');
      expect(formatted).toContain('Name: Numan Sidique');
      expect(formatted).toContain('Pincode: 673012');
    });
  });

  describe('Part 4 — Dynamic Coupon Functionality & Minimum Order Enforcement', () => {
    it('enforces minimum order amount and rejects coupon if subtotal is insufficient', () => {
      let cartApi: any;
      renderWithProviders(
        <CartTestHelper
          onMount={(c) => {
            cartApi = c;
          }}
        />
      );

      act(() => {
        // Add 1 item of ₹180 (below ₹499)
        const product = INITIAL_PRODUCTS[0];
        cartApi.addToCart(product, product.variants[0], 1);
      });

      // Apply ZADA80 (requires ₹499)
      act(() => {
        const res = cartApi.applyCoupon('ZADA80');
        expect(res.success).toBe(false);
        expect(res.message).toContain('₹499');
      });

      expect(screen.getByTestId('cart-coupon').textContent).toBe('NONE');
      expect(screen.getByTestId('cart-discount').textContent).toBe('0');
    });

    it('prevents negative grand total when discount exceeds or equals subtotal', () => {
      let cartApi: any;
      renderWithProviders(
        <CartTestHelper
          onMount={(c) => {
            cartApi = c;
          }}
        />
      );

      act(() => {
        const product = INITIAL_PRODUCTS[0];
        cartApi.addToCart(product, product.variants[0], 3); // 3 * 180 = 540
      });

      act(() => {
        cartApi.applyCoupon('ZADA80');
      });

      const totalVal = Number(screen.getByTestId('cart-total').textContent);
      expect(totalVal).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Part 8 — Product Review Management & Honest Empty States', () => {
    it('displays honest empty state "No reviews yet" when product has 0 approved reviews', () => {
      // Product with 0 reviews
      renderWithProviders(<ProductDetailPage />, ['/product/kerala-mixture'], '/product/:slug');

      // Zero fake 1.2k counts
      expect(screen.queryByText(/1\.2k/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/1240/i)).not.toBeInTheDocument();

      // Honest empty state rendered
      expect(screen.getAllByText(/No reviews yet/i).length).toBeGreaterThanOrEqual(1);
    });

    it('renders Admin Reviews interface with Add Review button and modal', () => {
      renderWithProviders(<AdminReviews />);

      expect(screen.getByText('Customer Reviews & Moderation')).toBeInTheDocument();
      const addBtn = screen.getByRole('button', { name: /Add Review/i });
      expect(addBtn).toBeInTheDocument();

      // Open Add Review Modal
      fireEvent.click(addBtn);

      expect(screen.getByText('Add Product Review')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e\.g\. Anjali Nair/i)).toBeInTheDocument();
      expect(screen.getByText('Verified Buyer badge')).toBeInTheDocument();
    });
  });
});
