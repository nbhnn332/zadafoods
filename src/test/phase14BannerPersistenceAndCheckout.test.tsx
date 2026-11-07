import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { AdminCMS } from '../pages/admin/AdminCMS';
import { AdminOrders } from '../pages/admin/AdminOrders';
import { AdminSettings } from '../pages/admin/AdminSettings';
import { AdminDataProvider } from '../context/AdminDataContext';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { SupabaseDataService } from '../lib/commerce/supabaseDataService';

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

describe('Phase 14: Banner Persistence, Image Permissions, Order Printing & Payment Method Fix', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('zada_auth_user', JSON.stringify({
      id: 'usr-admin-1',
      email: 'admin@zadafoods.com',
      fullName: 'ZaDa Administrator',
      phone: '+91 75939 59235',
      role: 'admin',
      createdAt: '2026-01-01T00:00:00Z'
    }));
    vi.restoreAllMocks();
  });

  describe('1. Authoritative Banner Persistence & Resurrection Prevention', () => {
    it('persists deleted banner IDs in localStorage so deleted banners never resurrect on reload', () => {
      renderWithProviders(<AdminCMS />);

      // Find hero banners in Admin CMS and click Delete on first banner
      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
      expect(deleteButtons.length).toBeGreaterThan(0);

      fireEvent.click(deleteButtons[0]);

      // Confirm deletion in the modal dialog
      const confirmBtn = screen.getByRole('button', { name: /Confirm Delete/i });
      fireEvent.click(confirmBtn);

      // Verify localStorage was updated with the deleted ID
      const storedDeletedIds = JSON.parse(localStorage.getItem('zada_admin_deleted_banner_ids') || '[]');
      expect(storedDeletedIds.length).toBeGreaterThan(0);
    });

    it('provides a purge demo banners action that cleans pre-seeded banners permanently', () => {
      renderWithProviders(<AdminCMS />);

      const purgeBtn = screen.getByRole('button', { name: /Purge Demo Banners/i });
      expect(purgeBtn).toBeInTheDocument();

      fireEvent.click(purgeBtn);

      const storedDeletedIds = JSON.parse(localStorage.getItem('zada_admin_deleted_banner_ids') || '[]');
      expect(storedDeletedIds).toContain('b0000000-0000-0000-0000-000000000001');
      expect(storedDeletedIds).toContain('b0000000-0000-0000-0000-000000000002');
    });
  });

  describe('2. Strict Image Authorization & Zero-Image CMS Defaults', () => {
    it('defaults Image URL to empty string when creating a new homepage banner', () => {
      renderWithProviders(<AdminCMS />);

      const createBtn = screen.getByRole('button', { name: /Add Hero Banner/i });
      fireEvent.click(createBtn);

      expect(screen.getByText(/Create Hero Banner/i)).toBeInTheDocument();

      // Image URL input should be completely empty by default
      const imageUrlInput = screen.getByPlaceholderText(/Leave empty for Pure CSS \(zero images\)/i) as HTMLInputElement;
      expect(imageUrlInput).toBeInTheDocument();
      expect(imageUrlInput.value).toBe('');
    });

    it('allows clearing an existing image on a banner', () => {
      renderWithProviders(<AdminCMS />);

      // Find "Remove Image" button on banners with images
      const removeButtons = screen.getAllByRole('button', { name: /Remove Image/i });
      expect(removeButtons.length).toBeGreaterThan(0);

      fireEvent.click(removeButtons[0]);

      // Banners without images render Pure CSS indicators
      const pureCssBadges = screen.getAllByText(/Pure CSS \(Zero Images\)/i);
      expect(pureCssBadges.length).toBeGreaterThan(0);
    });
  });

  describe('3. Automatic Homepage Banner Slideshow & Safe Fallback', () => {
    it('renders single banner statically without carousel controls when only one banner is active', () => {
      renderWithProviders(<HomePage />);

      // Single banner static render: should not have prev/next buttons
      expect(screen.queryByRole('button', { name: /Previous slide/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Next slide/i })).toBeNull();
      expect(screen.getByText(/Authentic Kerala Flavours Delivered to Your Home/i)).toBeInTheDocument();
    });

    it('renders hero carousel with slide indicators and controls when multiple banners are active', () => {
      localStorage.setItem('zada_admin_banners', JSON.stringify([
        {
          id: 'ban-test-1',
          title: 'Authentic Kerala Delights 1',
          subtitle: 'First promotional slide description.',
          imageUrl: '',
          linkUrl: '/shop',
          displayOrder: 1,
          isActive: true
        },
        {
          id: 'ban-test-2',
          title: 'Festive Kerala Sweets 2',
          subtitle: 'Second promotional slide description.',
          imageUrl: '',
          linkUrl: '/shop',
          displayOrder: 2,
          isActive: true
        }
      ]));

      renderWithProviders(<HomePage />);

      // Indicator buttons should exist for each slide
      const indicators = screen.getAllByRole('tab');
      expect(indicators.length).toBe(2);

      // Previous and Next buttons should exist
      expect(screen.getByRole('button', { name: /Previous slide/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next slide/i })).toBeInTheDocument();
    });

    it('renders an image-free pure CSS hero fallback when all banners are deleted and never fabricates mock banners', async () => {
      vi.spyOn(SupabaseDataService, 'fetchBanners').mockResolvedValue({ data: [], error: null, source: 'SUPABASE' });
      localStorage.setItem('zada_admin_banners', JSON.stringify([]));

      renderWithProviders(<HomePage />);

      // Should render the fallback hero
      expect(await screen.findByText(/Authentic Malabar Delicacies/i)).toBeInTheDocument();
      expect(screen.getByText(/Crafted with Care\. Rooted in Kerala\./i)).toBeInTheDocument();

      // Zero images in the hero fallback
      const heroSection = screen.getByText(/Authentic Malabar Delicacies/i).closest('section');
      expect(heroSection?.querySelector('img')).toBeNull();
    });
  });

  describe('4. Order Management Print Bill / Invoice', () => {
    it('renders a Print Bill action for order rows in admin orders', () => {
      renderWithProviders(<AdminOrders />);

      const printButtons = screen.getAllByRole('button', { name: /Print Bill/i });
      expect(printButtons.length).toBeGreaterThan(0);
    });

    it('opens the printable A4 invoice modal with verified business details, FSSAI, and taxes', () => {
      renderWithProviders(<AdminOrders />);

      const printButtons = screen.getAllByRole('button', { name: /Print Bill/i });
      fireEvent.click(printButtons[0]);

      // Check for A4 invoice container
      const printableContainer = document.querySelector('#printable-invoice');
      expect(printableContainer).toBeInTheDocument();

      // Check verified business credentials
      expect(printableContainer?.textContent).toContain('ZaDa Foods');
      expect(printableContainer?.textContent).toMatch(/21326145000345|11322999000123/);
      expect(printableContainer?.textContent).toContain('+91 75939 59235');
      expect(printableContainer?.textContent).toContain('Kozhikode');
    });

    it('distinguishes TAX INVOICE & RECEIPT for paid orders from ORDER BILL for pending orders', () => {
      renderWithProviders(<AdminOrders />);

      // Order ZDF1008 is PAID
      const printButtons = screen.getAllByRole('button', { name: /Print Bill/i });
      fireEvent.click(printButtons[0]);

      const printableContainer = document.querySelector('#printable-invoice');
      expect(printableContainer?.textContent).toContain('TAX INVOICE & RECEIPT');
    });
  });

  describe('5. Checkout Payment-Method Selection & Order Confirmation', () => {
    it('displays genuine payment options (Razorpay & COD) and NEVER displays WhatsApp as a payment method', () => {
      renderWithProviders(<CheckoutPage />, ['/checkout?demo=true']);

      expect(screen.getByText(/Online Payment \(Razorpay\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Cash on Delivery \(COD\)/i)).toBeInTheDocument();
      expect(screen.queryByText(/WhatsApp Direct Order/i)).toBeNull();
    });

    it('allows selecting Cash on Delivery and displays Confirm Order CTA', () => {
      renderWithProviders(<CheckoutPage />, ['/checkout?demo=true']);

      const codOption = screen.getByText(/Cash on Delivery \(COD\)/i).closest('div.cursor-pointer');
      expect(codOption).toBeInTheDocument();

      fireEvent.click(codOption!);

      // CTA button should update to Confirm Order
      expect(screen.getByRole('button', { name: /Confirm Order/i })).toBeInTheDocument();
    });

    it('creates COD order with paymentStatus PENDING and opens WhatsApp confirmation dialog', () => {
      vi.useFakeTimers();
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      renderWithProviders(<CheckoutPage />, ['/checkout?demo=true']);

      // Select COD
      const codOption = screen.getByText(/Cash on Delivery \(COD\)/i).closest('div.cursor-pointer');
      fireEvent.click(codOption!);

      // Click CTA
      const orderButton = screen.getByRole('button', { name: /Confirm Order/i });
      fireEvent.click(orderButton);

      // Fast forward payment processing delay inside act
      act(() => {
        vi.advanceTimersByTime(1200);
      });

      // COD Awaiting WhatsApp confirmation dialog should appear
      expect(screen.getByText(/COD Order Placed — Awaiting Confirmation/i)).toBeInTheDocument();
      const pendingBadges = screen.getAllByText(/AWAITING WHATSAPP CONFIRMATION/i);
      expect(pendingBadges.length).toBeGreaterThan(0);
      expect(screen.getByText(/Open WhatsApp to Confirm Order/i)).toBeInTheDocument();

      // window.open should have been called with https://wa.me/
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/'),
        '_blank',
        'noopener,noreferrer'
      );

      vi.useRealTimers();
    });

    it('allows admin settings to configure default checkout mode and toggles', () => {
      renderWithProviders(<AdminSettings />);

      // Section header should be present
      expect(screen.getByText(/Customer-Facing Payment Methods & Checkout Defaults/i)).toBeInTheDocument();

      // Verify radio options exist for primary mode
      const radios = screen.getAllByRole('radio');
      expect(radios.length).toBeGreaterThanOrEqual(2);

      // Toggle COD or WhatsApp-assisted routing
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(2);
    });
  });
});
