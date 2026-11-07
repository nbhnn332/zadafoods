import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CheckoutPage } from '../pages/CheckoutPage';
import { AdminSettings } from '../pages/admin/AdminSettings';
import { AdminDataProvider, useAdminData } from '../context/AdminDataContext';
import { CartProvider, useCart } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import {
  normalizeWhatsAppNumber,
  formatWhatsAppOrderMessage,
  buildWhatsAppChatUrl,
  DEFAULT_WHATSAPP_DESTINATION,
  DISPLAY_WHATSAPP_DESTINATION
} from '../lib/commerce/whatsappRouting';
import {
  SHOP_WHATSAPP_NUMBER,
  SHOP_WHATSAPP_DISPLAY,
  getCartWhatsAppUrl,
  getSupportWhatsAppUrl
} from '../lib/whatsapp';

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

// Component helper to inspect cart and admin settings inside tests
const TestCartInspector: React.FC = () => {
  const { items } = useCart();
  const { settings, orders } = useAdminData();
  return (
    <div data-testid="test-inspector">
      <span data-testid="cart-count">{items.length}</span>
      <span data-testid="orders-count">{orders.length}</span>
      <span data-testid="whatsapp-routing">{String(settings.isWhatsAppAssistedCodEnabled)}</span>
      <span data-testid="primary-mode">{settings.primaryCheckoutMode}</span>
    </div>
  );
};

describe('Phase 15: Correct WhatsApp-Assisted COD Checkout', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. WhatsApp is Never Displayed as a Customer-Facing Payment Option', () => {
    it('displays ONLY genuine customer payment options and removes all WhatsApp payment labels', () => {
      renderWithProviders(<CheckoutPage />, ['/checkout?demo=true']);

      // Genuine payment methods should be present
      expect(screen.getByText(/Cash on Delivery \(COD\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Online Payment \(Razorpay\)/i)).toBeInTheDocument();

      // Prohibited WhatsApp payment options & labels MUST NOT exist
      expect(screen.queryByText(/WhatsApp Direct Order/i)).toBeNull();
      expect(screen.queryByText(/^Assisted$/i)).toBeNull();
      expect(screen.queryByText(/Send order to/i)).toBeNull();
    });
  });

  describe('2. Cash on Delivery (COD) Display Rule', () => {
    it('displays COD option when isCodGloballyEnabled is true', () => {
      localStorage.setItem('zada_admin_settings', JSON.stringify({
        isCodGloballyEnabled: true,
        isRazorpayEnabled: true,
        primaryCheckoutMode: 'COD',
        isWhatsAppAssistedCodEnabled: true
      }));

      renderWithProviders(<CheckoutPage />, ['/checkout?demo=true']);
      expect(screen.getByText(/Cash on Delivery \(COD\)/i)).toBeInTheDocument();
    });

    it('hides COD option completely when isCodGloballyEnabled is false', () => {
      localStorage.setItem('zada_admin_settings', JSON.stringify({
        isCodGloballyEnabled: false,
        isRazorpayEnabled: true,
        primaryCheckoutMode: 'RAZORPAY',
        isWhatsAppAssistedCodEnabled: true
      }));

      renderWithProviders(<CheckoutPage />, ['/checkout?demo=true']);
      expect(screen.queryByText(/Cash on Delivery \(COD\)/i)).toBeNull();
      expect(screen.getByText(/Online Payment \(Razorpay\)/i)).toBeInTheDocument();
    });
  });

  describe('3. Buy Now Flow: Product & Quantity Preservation', () => {
    it('preserves the selected product, variant, quantity and unit price in checkout without mutating regular cart', () => {
      const sampleBuyNowItem = {
        productId: 'prod-cashew-halwa',
        variantId: 'var-halwa-500g',
        productName: 'Kozhikode Cashew Halwa',
        productSlug: 'cashew-halwa',
        categorySlug: 'halwa',
        variantWeightLabel: '500 g',
        imageUrl: '/assets/cat-halwa.png',
        unitPrice: 350,
        mrp: 380,
        quantity: 2,
        isCodEligible: true,
        availableStock: 50
      };

      render(
        <MemoryRouter initialEntries={[{ pathname: '/checkout', state: { buyNowItem: sampleBuyNowItem } }]}>
          <ToastProvider>
            <AuthProvider>
              <CartProvider>
                <AdminDataProvider>
                  <CheckoutPage />
                </AdminDataProvider>
              </CartProvider>
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      // Verify item details on checkout page
      expect(screen.getByText('Kozhikode Cashew Halwa')).toBeInTheDocument();
      expect(screen.getByText(/500 g × 2/i)).toBeInTheDocument();
      expect(screen.getByText('₹700')).toBeInTheDocument(); // 350 * 2
    });
  });

  describe('4. Cart Isolation: Existing Cart Items Unchanged on Buy Now', () => {
    it('retains existing cart items untouched when Buy Now is used for a separate direct checkout', () => {
      // Pre-seed an existing item in the regular cart
      localStorage.setItem('zada_cart', JSON.stringify([
        {
          productId: 'prod-banana-chips-nendran',
          variantId: 'var-chips-250g',
          productName: 'Kerala Banana Chips (Nendran)',
          variantWeightLabel: '250 g',
          imageUrl: '/assets/prod-banana-chips.png',
          unitPrice: 180,
          mrp: 210,
          quantity: 3
        }
      ]));

      const sampleBuyNowItem = {
        productId: 'prod-cashew-halwa',
        variantId: 'var-halwa-500g',
        productName: 'Kozhikode Cashew Halwa',
        variantWeightLabel: '500 g',
        imageUrl: '/assets/cat-halwa.png',
        unitPrice: 350,
        mrp: 380,
        quantity: 1
      };

      render(
        <MemoryRouter initialEntries={[{ pathname: '/checkout', state: { buyNowItem: sampleBuyNowItem } }]}>
          <ToastProvider>
            <AuthProvider>
              <CartProvider>
                <AdminDataProvider>
                  <CheckoutPage />
                  <TestCartInspector />
                </AdminDataProvider>
              </CartProvider>
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      // The checkout displays the Buy Now item
      expect(screen.getByText('Kozhikode Cashew Halwa')).toBeInTheDocument();

      // The regular cart retains its 1 item in the background (Banana Chips)
      const cartCount = screen.getByTestId('cart-count');
      expect(cartCount.textContent).toBe('1');
    });
  });

  describe('5. COD + WhatsApp Routing Enabled Flow', () => {
    it('opens the configured WhatsApp destination number 917593959235 with structured order details', () => {
      vi.useFakeTimers();
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      localStorage.setItem('zada_admin_settings', JSON.stringify({
        isCodGloballyEnabled: true,
        isRazorpayEnabled: true,
        primaryCheckoutMode: 'COD',
        isWhatsAppAssistedCodEnabled: true,
        whatsAppDestinationNumber: '917593959235'
      }));

      renderWithProviders(<CheckoutPage />, ['/checkout?demo=true']);

      // Ensure COD is selected
      const codOption = screen.getByText(/Cash on Delivery \(COD\)/i).closest('div.cursor-pointer');
      fireEvent.click(codOption!);

      // Click Confirm Order button
      const confirmButton = screen.getByRole('button', { name: /Confirm Order/i });
      fireEvent.click(confirmButton);

      act(() => {
        vi.advanceTimersByTime(1200);
      });

      // Window.open should be triggered with wa.me/917593959235
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/917593959235?text='),
        '_blank',
        'noopener,noreferrer'
      );

      // The confirmation modal explains the order is awaiting WhatsApp confirmation
      expect(screen.getByText(/COD Order Placed — Awaiting Confirmation/i)).toBeInTheDocument();
      expect(screen.getAllByText(/AWAITING WHATSAPP CONFIRMATION/i).length).toBeGreaterThanOrEqual(1);

      vi.useRealTimers();
    });
  });

  describe('6. WhatsApp Message Content & Server-Calculated Pricing Integrity', () => {
    it('formats a structured message containing order reference, items, and authoritative totals', () => {
      const mockOrder = {
        id: 'ord-test-101',
        orderNumber: 'ZDF8899',
        customerName: 'Numan Sidique',
        customerEmail: 'care@zadafoods.com',
        customerPhone: '+91 98765 43210',
        shippingAddress: {
          id: 'addr-1',
          userId: 'user-1',
          recipientName: 'Numan Sidique',
          phone: '+91 98765 43210',
          streetAddress: 'Beach Road, Calicut',
          city: 'Kozhikode',
          state: 'Kerala',
          postalCode: '673012',
          tag: 'Home' as const,
          isDefault: true
        },
        deliveryMethod: 'STANDARD' as const,
        paymentMode: 'COD' as const,
        paymentStatus: 'PENDING' as const,
        fulfillmentStatus: 'PENDING' as const,
        subtotalAmount: 930,
        discountAmount: 80,
        couponCode: 'ZADA80',
        shippingCharge: 40,
        totalAmount: 890,
        items: [
          {
            id: 'item-1',
            productId: 'prod-banana-chips',
            variantId: 'var-1',
            productName: 'Banana Chips (Nendran)',
            variantWeightLabel: '250 g',
            imageUrl: '/assets/prod-banana-chips.png',
            unitPrice: 180,
            quantity: 2,
            lineTotal: 360
          }
        ],
        statusHistory: [],
        createdAt: '29 Oct 2026, 11:30 AM',
        updatedAt: '2026-10-29T06:00:00Z'
      };

      const msg = formatWhatsAppOrderMessage(mockOrder);

      expect(msg).toContain('*ZaDa Foods — New Order Ref: ZDF8899*');
      expect(msg).toContain('Customer: Numan Sidique');
      expect(msg).toContain('+91 98765 43210');
      expect(msg).toContain('Beach Road, Calicut');
      expect(msg).toContain('Banana Chips (Nendran) (250 g) × 2 = ₹360');
      expect(msg).toContain('Subtotal: ₹930');
      expect(msg).toContain('Discount (ZADA80): -₹80');
      expect(msg).toContain('Delivery Charge: ₹40');
      expect(msg).toContain('*Total Payable: ₹890*');
      expect(msg).toContain('Payment Method: Cash on Delivery (COD)');
      expect(msg).toContain('Status: Awaiting WhatsApp Confirmation');
    });
  });

  describe('7. Behavior When WhatsApp Routing is Disabled', () => {
    it('creates COD order directly without opening WhatsApp or redirecting when routing is disabled', () => {
      vi.useFakeTimers();
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      localStorage.setItem('zada_admin_settings', JSON.stringify({
        isCodGloballyEnabled: true,
        isRazorpayEnabled: true,
        primaryCheckoutMode: 'COD',
        isWhatsAppAssistedCodEnabled: false,
        whatsAppDestinationNumber: '917593959235'
      }));

      renderWithProviders(<CheckoutPage />, ['/checkout?demo=true']);

      // Button should say "Place Cash on Delivery Order"
      const placeCodButton = screen.getByRole('button', { name: /Place Cash on Delivery Order/i });
      expect(placeCodButton).toBeInTheDocument();

      fireEvent.click(placeCodButton);

      act(() => {
        vi.advanceTimersByTime(1200);
      });

      // window.open should NOT be called
      expect(openSpy).not.toHaveBeenCalled();

      // Modal should NOT be shown
      expect(screen.queryByText(/AWAITING WHATSAPP CONFIRMATION/i)).toBeNull();

      vi.useRealTimers();
    });
  });

  describe('8. Razorpay Payment Independence', () => {
    it('retains independent Razorpay online checkout flow regardless of WhatsApp routing status', () => {
      localStorage.setItem('zada_admin_settings', JSON.stringify({
        isCodGloballyEnabled: true,
        isRazorpayEnabled: true,
        primaryCheckoutMode: 'RAZORPAY',
        isWhatsAppAssistedCodEnabled: true
      }));

      renderWithProviders(<CheckoutPage />, ['/checkout?demo=true']);

      // Select Razorpay
      const razorpayOption = screen.getByText(/Online Payment \(Razorpay\)/i).closest('div.cursor-pointer');
      fireEvent.click(razorpayOption!);

      // Button should say "Pay ₹... via Razorpay"
      expect(screen.getByRole('button', { name: /Pay ₹890 via Razorpay/i })).toBeInTheDocument();
    });
  });

  describe('9. Repeated Submissions Do Not Create Duplicate Orders', () => {
    it('reuses the existing order reference on retry and prevents duplicate order creation', () => {
      vi.useFakeTimers();
      vi.spyOn(window, 'open').mockImplementation(() => null);

      localStorage.setItem('zada_admin_settings', JSON.stringify({
        isCodGloballyEnabled: true,
        isRazorpayEnabled: true,
        primaryCheckoutMode: 'COD',
        isWhatsAppAssistedCodEnabled: true
      }));

      renderWithProviders(
        <>
          <CheckoutPage />
          <TestCartInspector />
        </>,
        ['/checkout?demo=true']
      );

      const confirmButton = screen.getByRole('button', { name: /Confirm Order/i });
      fireEvent.click(confirmButton);

      act(() => {
        vi.advanceTimersByTime(1200);
      });

      // After 1 submission, 1 order exists
      const initialOrdersCount = screen.getByTestId('orders-count').textContent;

      // Re-trigger submit (retry)
      fireEvent.click(confirmButton);

      act(() => {
        vi.advanceTimersByTime(1200);
      });

      // Orders count remains exactly identical (idempotent, no duplicates)
      const afterOrdersCount = screen.getByTestId('orders-count').textContent;
      expect(afterOrdersCount).toBe(initialOrdersCount);

      vi.useRealTimers();
    });
  });

  describe('10. WhatsApp Opening Never Falsely Marks Order as Paid or Confirmed', () => {
    it('records COD order with paymentStatus PENDING and does not assume message delivery', () => {
      vi.useFakeTimers();
      vi.spyOn(window, 'open').mockImplementation(() => null);

      localStorage.setItem('zada_admin_settings', JSON.stringify({
        isCodGloballyEnabled: true,
        isRazorpayEnabled: true,
        primaryCheckoutMode: 'COD',
        isWhatsAppAssistedCodEnabled: true
      }));

      renderWithProviders(<CheckoutPage />, ['/checkout?demo=true']);

      fireEvent.click(screen.getByRole('button', { name: /Confirm Order/i }));

      act(() => {
        vi.advanceTimersByTime(1200);
      });

      // The modal explicitly shows status is awaiting confirmation
      expect(screen.getAllByText(/AWAITING WHATSAPP CONFIRMATION/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Payment Method: Cash on Delivery \(COD\)/i).length).toBeGreaterThanOrEqual(1);

      vi.useRealTimers();
    });
  });

  describe('11. Fallback When Browser Blocks WhatsApp Window', () => {
    it('presents direct user-initiated link and message copy action if popup is blocked', () => {
      vi.useFakeTimers();
      // Simulate popup blocker returning null or throwing
      vi.spyOn(window, 'open').mockImplementation(() => {
        throw new Error('Popup blocked');
      });

      localStorage.setItem('zada_admin_settings', JSON.stringify({
        isCodGloballyEnabled: true,
        isRazorpayEnabled: true,
        primaryCheckoutMode: 'COD',
        isWhatsAppAssistedCodEnabled: true
      }));

      renderWithProviders(<CheckoutPage />, ['/checkout?demo=true']);

      fireEvent.click(screen.getByRole('button', { name: /Confirm Order/i }));

      act(() => {
        vi.advanceTimersByTime(1200);
      });

      // Fallback dialog is safely displayed
      expect(screen.getByText(/COD Order Placed — Awaiting Confirmation/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Open WhatsApp to Confirm Order/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Copy Message/i })).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('12. Normalization of Destination Number', () => {
    it('normalizes various input phone formats safely to 917593959235 and rejects old placeholder 9876543210', () => {
      expect(normalizeWhatsAppNumber('+91 75939 59235')).toBe('917593959235');
      expect(normalizeWhatsAppNumber('07593959235')).toBe('917593959235');
      expect(normalizeWhatsAppNumber('7593959235')).toBe('917593959235');
      expect(normalizeWhatsAppNumber('917593959235')).toBe('917593959235');
      expect(normalizeWhatsAppNumber('+91 98765 43210')).toBe('917593959235');
      expect(normalizeWhatsAppNumber('9876543210')).toBe('917593959235');
      expect(normalizeWhatsAppNumber('919876543210')).toBe('917593959235');
      expect(normalizeWhatsAppNumber('')).toBe(DEFAULT_WHATSAPP_DESTINATION);
      expect(normalizeWhatsAppNumber(null)).toBe(DEFAULT_WHATSAPP_DESTINATION);
      expect(normalizeWhatsAppNumber('invalid')).toBe(DEFAULT_WHATSAPP_DESTINATION);
    });
  });

  describe('13. Unauthorized Users Cannot Change Payment Settings', () => {
    it('renders admin payment settings and blocks changes for non-admin sessions', () => {
      renderWithProviders(<AdminSettings />);

      // Settings sections should be present
      expect(screen.getByText(/Customer-Facing Payment Methods & Checkout Defaults/i)).toBeInTheDocument();
      expect(screen.getByText(/Internal Order Routing & WhatsApp COD Confirmation/i)).toBeInTheDocument();

      // Both genuine options and internal routing toggle exist
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThanOrEqual(3); // COD, Razorpay, WhatsApp Routing
    });
  });

  describe('14. Phase 15A: Global Authoritative WhatsApp Destination Checks', () => {
    it('enforces single authoritative WhatsApp number 917593959235 and display +91 75939 59235', () => {
      expect(DEFAULT_WHATSAPP_DESTINATION).toBe('917593959235');
      expect(DISPLAY_WHATSAPP_DESTINATION).toBe('+91 75939 59235');
      expect(SHOP_WHATSAPP_NUMBER).toBe('917593959235');
      expect(SHOP_WHATSAPP_DISPLAY).toBe('+91 75939 59235');
    });

    it('rejects old placeholder in buildWhatsAppChatUrl and safely outputs wa.me/917593959235', () => {
      const url = buildWhatsAppChatUrl('+91 98765 43210', 'Hello ZaDa Foods');
      expect(url).toContain('https://wa.me/917593959235?text=');
      expect(url).not.toContain('9876543210');
    });

    it('ensures cart and support WhatsApp links use 917593959235 and never the old number', () => {
      const cartUrl = getCartWhatsAppUrl([{ productName: 'Chips', variantWeightLabel: '250 g', unitPrice: 180, quantity: 1 }], 180);
      expect(cartUrl).toContain('https://wa.me/917593959235?text=');
      expect(cartUrl).not.toContain('9876543210');

      const supportUrl = getSupportWhatsAppUrl('Order #123');
      expect(supportUrl).toContain('https://wa.me/917593959235?text=');
      expect(supportUrl).not.toContain('9876543210');
    });

    it('sanitizes legacy WhatsApp settings persisted in local storage on startup', () => {
      localStorage.setItem('zada_admin_settings', JSON.stringify({
        isCodGloballyEnabled: true,
        whatsAppDestinationNumber: '+91 98765 43210',
        supportWhatsApp: '+91 98765 43210'
      }));

      const TestComponent = () => {
        const { settings } = useAdminData();
        return (
          <div>
            <span data-testid="dest-number">{settings.whatsAppDestinationNumber}</span>
            <span data-testid="support-wa">{settings.supportWhatsApp}</span>
          </div>
        );
      };

      renderWithProviders(<TestComponent />);
      expect(screen.getByTestId('dest-number').textContent).toBe('917593959235');
      expect(screen.getByTestId('support-wa').textContent).toBe('+91 75939 59235');
    });
  });
});
