import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { AdminCMS } from '../pages/admin/AdminCMS';
import { CheckoutPage } from '../pages/CheckoutPage';
import { CartPage } from '../pages/CartPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { AdminDataProvider } from '../context/AdminDataContext';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { FestivalProvider } from '../context/FestivalContext';
import { HomepageBanner } from '../types';

const renderWithProviders = (ui: React.ReactElement, initialEntries = ['/'], path = '/') => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ToastProvider>
        <AuthProvider>
          <AdminDataProvider>
            <CartProvider>
              <FestivalProvider>
                <Routes>
                  <Route path={path} element={ui} />
                  <Route path="*" element={ui} />
                </Routes>
              </FestivalProvider>
            </CartProvider>
          </AdminDataProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('Phase 31: Banner Source-of-Truth Repair & Customer-Silent WhatsApp Checkout', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Device-Isolated Hero Banners (Admin CMS)', () => {
    it('separates desktop and mobile banners into Section A and Section B with locked target devices', async () => {
      const mockBanners: HomepageBanner[] = [
        {
          id: 'ban-desk-1',
          title: 'Widescreen Desktop Hero Banner',
          subtitle: 'Crafted for laptops and large displays',
          backgroundColor: '#072C20',
          textColor: '#FFFFFF',
          linkUrl: '/category/chips',
          displayOrder: 1,
          isActive: true,
          deviceTarget: 'desktop',
          badgeText: 'desktop',
          createdAt: new Date().toISOString()
        },
        {
          id: 'ban-mob-1',
          title: 'Handheld Mobile Hero Banner',
          subtitle: 'Crafted for touchscreens and smartphone displays',
          backgroundColor: '#38220F',
          textColor: '#FFFFFF',
          linkUrl: '/category/sweets',
          displayOrder: 1,
          isActive: true,
          deviceTarget: 'mobile',
          badgeText: 'mobile',
          createdAt: new Date().toISOString()
        }
      ];

      localStorage.setItem('zada_admin_banners', JSON.stringify(mockBanners));
      renderWithProviders(<AdminCMS />, ['/admin/cms?tab=banners']);

      // 1. Verify Subnavigation showing Section A and Section B tabs
      expect(screen.getByTestId('tab-desktop-banners')).toBeInTheDocument();
      expect(screen.getByTestId('tab-mobile-banners')).toBeInTheDocument();
      expect(screen.getByTestId('tab-all-banners')).toBeInTheDocument();

      // 2. Default view: Desktop section shows desktop banner and does NOT show mobile banner
      expect(screen.getByText('Section A: Desktop Hero Banners')).toBeInTheDocument();
      expect(screen.getAllByText('Widescreen Desktop Hero Banner').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('Handheld Mobile Hero Banner')).not.toBeInTheDocument();

      // 3. Switch to Mobile tab: Mobile section shows mobile banner and does NOT show desktop banner
      fireEvent.click(screen.getByTestId('tab-mobile-banners'));
      expect(screen.getByText('Section B: Mobile Hero Banners')).toBeInTheDocument();
      expect(screen.getAllByText('Handheld Mobile Hero Banner').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('Widescreen Desktop Hero Banner')).not.toBeInTheDocument();
    });

    it('locks device target in modal based on section and validates direct image URLs', async () => {
      renderWithProviders(<AdminCMS />, ['/admin/cms?tab=banners']);

      // Click Add Desktop Banner
      const addDesktopBtn = screen.getByTestId('add-desktop-banner-btn');
      fireEvent.click(addDesktopBtn);

      // Verify modal is open and shows locked desktop target
      expect(screen.getByText(/Target Display Device: Desktop Storefront/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Locked/i).length).toBeGreaterThanOrEqual(1);

      // Verify direct image URL placeholder (Zero file uploads)
      const imgInput = screen.getByPlaceholderText(/Leave empty for Pure CSS \(zero images\)/i);
      expect(imgInput).toBeInTheDocument();
    });
  });

  describe('2. Storefront Hero Rendering Rules', () => {
    it('desktop viewport strictly renders desktop-targeted banners only', () => {
      window.innerWidth = 1024;

      const mockBanners: HomepageBanner[] = [
        {
          id: 'desk-only',
          title: 'Only For Desktop Viewers',
          subtitle: 'Never on phone',
          backgroundColor: '#072C20',
          textColor: '#FFFFFF',
          linkUrl: '/category/chips',
          displayOrder: 1,
          isActive: true,
          deviceTarget: 'desktop',
          badgeText: 'desktop',
          createdAt: new Date().toISOString()
        },
        {
          id: 'mob-only',
          title: 'Only For Mobile Viewers',
          subtitle: 'Never on laptop',
          backgroundColor: '#38220F',
          textColor: '#FFFFFF',
          linkUrl: '/category/chips',
          displayOrder: 1,
          isActive: true,
          deviceTarget: 'mobile',
          badgeText: 'mobile',
          createdAt: new Date().toISOString()
        }
      ];

      localStorage.setItem('zada_admin_banners', JSON.stringify(mockBanners));
      renderWithProviders(<HomePage />, ['/']);

      // Desktop banner should be present, mobile banner should be excluded
      expect(screen.getByText('Only For Desktop Viewers')).toBeInTheDocument();
      expect(screen.queryByText('Only For Mobile Viewers')).not.toBeInTheDocument();
    });

    it('renders deliberate image-free CSS hero when no active banners exist for that device', () => {
      localStorage.setItem('zada_admin_banners', JSON.stringify([]));
      renderWithProviders(<HomePage />, ['/']);

      // Deliberate image-free CSS hero headline
      expect(screen.getByText(/Crafted with Care\. Rooted in Kerala\./i)).toBeInTheDocument();
      expect(screen.getByText(/Bring Home the Soul of Kerala\./i)).toBeInTheDocument();
    });
  });

  describe('3. Customer-Silent WhatsApp Checkout Flow', () => {
    it('completely eliminates customer-facing WhatsApp language across Cart and Checkout', () => {
      localStorage.setItem('zada_admin_settings', JSON.stringify({
        checkoutMode: 'WHATSAPP',
        whatsAppDestinationNumber: '917593959235'
      }));

      // Cart Page: neutral ecommerce buttons only
      renderWithProviders(<CartPage />, ['/cart?demo=true']);
      expect(screen.getByRole('button', { name: /Proceed to Checkout/i })).toBeInTheDocument();
      expect(screen.queryByText(/Direct WhatsApp Ordering/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Order on WhatsApp/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Send Order on WhatsApp/i)).not.toBeInTheDocument();
    });

    it('in WhatsApp mode, collects guest delivery address and opens neutral confirmation modal silently', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      localStorage.setItem('zada_admin_settings', JSON.stringify({
        checkoutMode: 'WHATSAPP',
        whatsAppDestinationNumber: '917593959235'
      }));

      renderWithProviders(<CheckoutPage />, ['/checkout?demo=true']);

      // 1. Shows neutral concierge assurance card (NO "Direct WhatsApp Ordering")
      expect(screen.getByText(/Order Verification & Concierge Service/i)).toBeInTheDocument();
      expect(screen.queryByText(/Direct WhatsApp Ordering/i)).not.toBeInTheDocument();

      // 2. Submit button is professional "Place Order" (NO "Send Order on WhatsApp")
      const placeOrderBtn = screen.getByRole('button', { name: /Place Order/i });
      expect(placeOrderBtn).toBeInTheDocument();
      expect(placeOrderBtn.textContent).not.toContain('WhatsApp');

      // 3. Click Place Order
      fireEvent.click(placeOrderBtn);

      // 4. Silently opened WhatsApp in background with order summary and address
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/917593959235?text='),
        '_blank',
        'noopener,noreferrer'
      );

      // 5. Displays professional neutral order confirmation modal
      expect(screen.getByText(/Order Request Received — Verifying Details/i)).toBeInTheDocument();
      expect(screen.getByText(/ORDER PENDING VERIFICATION/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Continue Shopping/i })).toBeInTheDocument();
    });

    it('PDP Buy Now routes to /checkout rather than bypassing delivery address collection', () => {
      localStorage.setItem('zada_admin_settings', JSON.stringify({
        checkoutMode: 'WHATSAPP',
        whatsAppDestinationNumber: '917593959235'
      }));

      renderWithProviders(<ProductDetailPage />, ['/product/banana-chips-nendran'], '/product/:slug');

      const buyNowBtn = screen.getByRole('button', { name: /Buy Now/i });
      expect(buyNowBtn).toBeInTheDocument();
      // Should NOT have customer-facing WhatsApp label
      expect(buyNowBtn.textContent).not.toContain('WhatsApp');
    });
  });
});
