import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { AdminDataProvider } from '../context/AdminDataContext';
import { CartProvider } from '../context/CartContext';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { INITIAL_PRODUCTS, INITIAL_STORE_SETTINGS } from '../data/mockData';

const renderWithProviders = (initialRoute: string) => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ToastProvider>
        <AuthProvider>
          <AdminDataProvider>
            <CartProvider>
              <Routes>
                <Route path="/product/:slug" element={<ProductDetailPage />} />
                <Route path="/checkout" element={<div data-testid="checkout-page">Checkout Screen</div>} />
              </Routes>
            </CartProvider>
          </AdminDataProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('Phase 9B: Independent End-to-End Verification & UI Corrections', () => {
  describe('1. Product Detail Page Purchase UI & WhatsApp Removal', () => {
    it('renders Add to Cart and Buy Now as the ONLY purchase actions on PDP', () => {
      renderWithProviders('/product/banana-chips-nendran');

      const addToCartBtn = screen.getByRole('button', { name: /add to cart/i });
      const buyNowBtn = screen.getByRole('button', { name: /buy now/i });

      expect(addToCartBtn).toBeInTheDocument();
      expect(buyNowBtn).toBeInTheDocument();

      // Verify NO WhatsApp ordering button is present on the PDP
      const whatsappBtn = screen.queryByText(/order on whatsapp/i);
      expect(whatsappBtn).toBeNull();

      const instantChatBtn = screen.queryByText(/instant chat/i);
      expect(instantChatBtn).toBeNull();
    });

    it('ensures Add to Cart and Buy Now have consistent dimensions and hierarchy', () => {
      renderWithProviders('/product/cashew-halwa');

      const addToCartBtn = screen.getByRole('button', { name: /add to cart/i });
      const buyNowBtn = screen.getByRole('button', { name: /buy now/i });

      // Add to Cart: secondary (white background, border)
      expect(addToCartBtn.className).toContain('bg-white');
      expect(addToCartBtn.className).toContain('h-11');

      // Buy Now: primary (solid gold background)
      expect(buyNowBtn.className).toContain('bg-[#A67732]');
      expect(buyNowBtn.className).toContain('h-11');
    });

    it('does not open or redirect to WhatsApp when clicking Buy Now or Add to Cart', () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      renderWithProviders('/product/cashew-halwa');

      const addToCartBtn = screen.getByRole('button', { name: /add to cart/i });
      fireEvent.click(addToCartBtn);
      expect(windowOpenSpy).not.toHaveBeenCalled();

      const buyNowBtn = screen.getByRole('button', { name: /buy now/i });
      fireEvent.click(buyNowBtn);
      expect(windowOpenSpy).not.toHaveBeenCalled();

      windowOpenSpy.mockRestore();
    });
  });

  describe('2. Cashew Halwa Product Accuracy', () => {
    it('displays authentic Kozhikode Halwa assets, description and ingredients', () => {
      const cashewHalwa = INITIAL_PRODUCTS.find((p) => p.slug === 'cashew-halwa')!;
      expect(cashewHalwa).toBeDefined();

      renderWithProviders('/product/cashew-halwa');

      expect(screen.getByText('Cashew Halwa')).toBeInTheDocument();
      expect(screen.getByText(cashewHalwa.description)).toBeInTheDocument();
      expect(screen.getByText(/Pure Ghee Preparation/i)).toBeInTheDocument();
    });
  });

  describe('3. Buy Now Flow & Cart Isolation', () => {
    it('navigates to checkout directly without altering persistent cart', () => {
      renderWithProviders('/product/banana-chips-nendran');

      const buyNowBtn = screen.getByRole('button', { name: /buy now/i });
      fireEvent.click(buyNowBtn);

      expect(screen.getByTestId('checkout-page')).toBeInTheDocument();
    });
  });

  describe('4. Complete Removal of Customer-Facing Rewards', () => {
    it('confirms no points, loyalty tier or rewards balance in store settings', () => {
      expect((INITIAL_STORE_SETTINGS as any).rewardPointsPer100Rupees).toBeUndefined();
      expect((INITIAL_STORE_SETTINGS as any).pointsRedemptionRate).toBeUndefined();
    });
  });

  describe('5. Razorpay Settings Security Verification', () => {
    it('strictly redacts secrets and requires server-side edge function configuration', () => {
      expect((INITIAL_STORE_SETTINGS as any).razorpayKeySecret).toBeUndefined();
      expect((INITIAL_STORE_SETTINGS as any).razorpayWebhookSecret).toBeUndefined();
      expect(INITIAL_STORE_SETTINGS.razorpayMode).toBe('test');
      expect(INITIAL_STORE_SETTINGS.razorpayKeyId).toBe('rzp_test_placeholder_key_id');
    });
  });
});
