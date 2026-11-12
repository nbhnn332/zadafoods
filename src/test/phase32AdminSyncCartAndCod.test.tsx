import React from 'react';
import { render, screen, fireEvent, waitFor, renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider, useCart } from '../context/CartContext';
import { AdminDataProvider } from '../context/AdminDataContext';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OurStoryPage } from '../pages/OurStoryPage';
import { ContentPage } from '../pages/ContentPage';
import { calculateAuthoritativeCart } from '../lib/commerce/pricingEngine';
import { INITIAL_PRODUCTS, INITIAL_COUPONS, INITIAL_STORE_SETTINGS } from '../data/mockData';

// Wrapper for hooks and pages
const AllProviders: React.FC<{ children: React.ReactNode; initialEntries?: string[] }> = ({
  children,
  initialEntries = ['/']
}) => (
  <MemoryRouter initialEntries={initialEntries}>
    <ToastProvider>
      <AuthProvider>
        <AdminDataProvider>
          <CartProvider>{children}</CartProvider>
        </AdminDataProvider>
      </AuthProvider>
    </ToastProvider>
  </MemoryRouter>
);

describe('Phase 32: Admin-to-Storefront Synchronisation, Cart Quantity Integrity & COD Fee Repair', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // =========================================================================
  // SECTION 1: CART QUANTITY INTEGRITY & HYDRATION IDEMPOTENCY
  // =========================================================================
  describe('1. Cart Quantity Integrity & Hydration Idempotency (Quantity 43 Bug Repair)', () => {
    it('adding a product once results in exactly quantity 1', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <AllProviders>{children}</AllProviders>
      });

      const product = INITIAL_PRODUCTS[0];
      const variant = product.variants[0];

      act(() => {
        result.current.addToCart(product, variant, 1);
      });

      expect(result.current.items.length).toBe(1);
      expect(result.current.items[0].quantity).toBe(1);
      expect(result.current.totalItemUnits).toBe(1);
    });

    it('clicking twice increases quantity by exactly two', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <AllProviders>{children}</AllProviders>
      });

      const product = INITIAL_PRODUCTS[0];
      const variant = product.variants[0];

      act(() => {
        result.current.addToCart(product, variant, 1);
        result.current.addToCart(product, variant, 1);
      });

      expect(result.current.items.length).toBe(1);
      expect(result.current.items[0].quantity).toBe(2);
      expect(result.current.totalItemUnits).toBe(2);
    });

    it('refreshing/re-mounting preserves existing quantity without auto-incrementing or compounding', () => {
      const product = INITIAL_PRODUCTS[0];
      const variant = product.variants[0];

      // Initial session: Add 1 item
      const { result: firstSession, unmount } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <AllProviders>{children}</AllProviders>
      });

      act(() => {
        firstSession.current.addToCart(product, variant, 1);
      });

      expect(firstSession.current.items[0].quantity).toBe(1);
      unmount();

      // Simulate 1st page refresh
      const { result: refresh1, unmount: unmount1 } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <AllProviders>{children}</AllProviders>
      });
      expect(refresh1.current.items[0].quantity).toBe(1);
      unmount1();

      // Simulate 2nd page refresh
      const { result: refresh2, unmount: unmount2 } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <AllProviders>{children}</AllProviders>
      });
      expect(refresh2.current.items[0].quantity).toBe(1);
      unmount2();

      // Simulate 3rd page refresh
      const { result: refresh3 } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <AllProviders>{children}</AllProviders>
      });
      expect(refresh3.current.items[0].quantity).toBe(1);
    });

    it('different variants and pack sizes remain separate cart lines', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <AllProviders>{children}</AllProviders>
      });

      const product = INITIAL_PRODUCTS[0];
      const variant1 = product.variants[0]; // 100g
      const variant2 = product.variants[1]; // 250g

      act(() => {
        result.current.addToCart(product, variant1, 1);
        result.current.addToCart(product, variant2, 2);
      });

      expect(result.current.items.length).toBe(2);
      expect(result.current.items[0].variantId).toBe(variant1.id);
      expect(result.current.items[0].quantity).toBe(1);
      expect(result.current.items[1].variantId).toBe(variant2.id);
      expect(result.current.items[1].quantity).toBe(2);
      expect(result.current.totalItemUnits).toBe(3);
    });

    it('guest cart merge on user login merges deterministically without compounding duplicate quantities', () => {
      const product = INITIAL_PRODUCTS[0];
      const variant = product.variants[1]; // 250g

      // Pre-seed user's cart in localStorage
      const userId = 'usr-test-sync';
      localStorage.setItem(
        `zada_user_cart_${userId}`,
        JSON.stringify([
          {
            productId: product.id,
            variantId: variant.id,
            productName: product.name,
            productSlug: product.slug,
            categorySlug: product.categorySlug,
            variantWeightLabel: variant.weightLabel,
            imageUrl: product.images[0]?.imageUrl || '',
            unitPrice: variant.sellingPrice,
            mrp: variant.mrp,
            quantity: 2,
            isCodEligible: true,
            availableStock: 50
          }
        ])
      );

      // Seed guest cart with the same item with quantity 2
      localStorage.setItem(
        'zada_guest_cart',
        JSON.stringify([
          {
            productId: product.id,
            variantId: variant.id,
            productName: product.name,
            productSlug: product.slug,
            categorySlug: product.categorySlug,
            variantWeightLabel: variant.weightLabel,
            imageUrl: product.images[0]?.imageUrl || '',
            unitPrice: variant.sellingPrice,
            mrp: variant.mrp,
            quantity: 2,
            isCodEligible: true,
            availableStock: 50
          }
        ])
      );

      // Log in with authenticated user profile
      localStorage.setItem(
        'zada_auth_user',
        JSON.stringify({
          id: userId,
          email: 'customer@example.com',
          fullName: 'Customer Test',
          role: 'customer'
        })
      );

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <AllProviders>{children}</AllProviders>
      });

      // The quantity must be 2, NOT 4!
      expect(result.current.items.length).toBe(1);
      expect(result.current.items[0].quantity).toBe(2);
    });
  });

  // =========================================================================
  // SECTION 2: COD SURCHARGE CALCULATION & PAYMENT METHOD TOGGLING
  // =========================================================================
  describe('2. COD Surcharge Calculation & Dynamic Payment Toggling', () => {
    const evaluationItems = [
      {
        productId: INITIAL_PRODUCTS[0].id,
        variantId: INITIAL_PRODUCTS[0].variants[1].id,
        quantity: 2 // 2 * 180 = 360
      }
    ];

    it('calculates ₹30 surcharge when COD is selected and ₹0 when Razorpay is selected', () => {
      // 1. With COD selected
      const codSummary = calculateAuthoritativeCart(evaluationItems, null, 'STANDARD', {
        availableProducts: INITIAL_PRODUCTS,
        availableCoupons: INITIAL_COUPONS,
        userOrderCount: 0,
        freeShippingThreshold: 499,
        standardShippingFee: 40,
        expressShippingFee: 80,
        paymentMethod: 'COD',
        isCodGloballyEnabled: true,
        codFeeType: 'FIXED',
        codFeeValue: 30
      });

      expect(codSummary.rawSubtotal).toBe(360);
      expect(codSummary.shippingFee).toBe(40);
      expect(codSummary.codFee).toBe(30);
      expect(codSummary.grandTotal).toBe(360 + 40 + 30); // 430

      // 2. With Razorpay selected
      const razorpaySummary = calculateAuthoritativeCart(evaluationItems, null, 'STANDARD', {
        availableProducts: INITIAL_PRODUCTS,
        availableCoupons: INITIAL_COUPONS,
        userOrderCount: 0,
        freeShippingThreshold: 499,
        standardShippingFee: 40,
        expressShippingFee: 80,
        paymentMethod: 'RAZORPAY',
        isCodGloballyEnabled: true,
        codFeeType: 'FIXED',
        codFeeValue: 30
      });

      expect(razorpaySummary.rawSubtotal).toBe(360);
      expect(razorpaySummary.shippingFee).toBe(40);
      expect(razorpaySummary.codFee).toBe(0);
      expect(razorpaySummary.grandTotal).toBe(360 + 40 + 0); // 400
    });

    it('supports percentage-based COD surcharge calculation', () => {
      const summary = calculateAuthoritativeCart(evaluationItems, null, 'STANDARD', {
        availableProducts: INITIAL_PRODUCTS,
        availableCoupons: INITIAL_COUPONS,
        userOrderCount: 0,
        freeShippingThreshold: 499,
        standardShippingFee: 40,
        expressShippingFee: 80,
        paymentMethod: 'COD',
        isCodGloballyEnabled: true,
        codFeeType: 'PERCENTAGE',
        codFeeValue: 5 // 5% of 360 = 18
      });

      expect(summary.rawSubtotal).toBe(360);
      expect(summary.codFee).toBe(18);
      expect(summary.grandTotal).toBe(360 + 40 + 18); // 418
    });

    it('respects minimum and maximum order value rules for COD eligibility', () => {
      // Subtotal = 360, but min order value for COD is 500
      const belowMinSummary = calculateAuthoritativeCart(evaluationItems, null, 'STANDARD', {
        availableProducts: INITIAL_PRODUCTS,
        availableCoupons: INITIAL_COUPONS,
        userOrderCount: 0,
        paymentMethod: 'COD',
        isCodGloballyEnabled: true,
        codFeeType: 'FIXED',
        codFeeValue: 30,
        codMinOrderValue: 500,
        codMaxOrderValue: 50000
      });

      expect(belowMinSummary.isCodEligible).toBe(false);
      expect(belowMinSummary.codIneligibleReason).toContain('minimum order value of ₹500');
      expect(belowMinSummary.codFee).toBe(0);
    });

    it('renders COD surcharge as a distinct line item in CheckoutPage order summary and recalculates on toggle', async () => {
      // Seed cart with 1 Banana Chips (250g = ₹180)
      const product = INITIAL_PRODUCTS[0];
      const variant = product.variants[1];
      localStorage.setItem(
        'zada_guest_cart',
        JSON.stringify([
          {
            productId: product.id,
            variantId: variant.id,
            productName: product.name,
            productSlug: product.slug,
            categorySlug: product.categorySlug,
            variantWeightLabel: variant.weightLabel,
            imageUrl: product.images[0]?.imageUrl || '',
            unitPrice: variant.sellingPrice,
            mrp: variant.mrp,
            quantity: 1,
            isCodEligible: true,
            availableStock: 50
          }
        ])
      );

      // Set COD fee to ₹30
      localStorage.setItem(
        'zada_admin_settings',
        JSON.stringify({
          ...INITIAL_STORE_SETTINGS,
          isCodGloballyEnabled: true,
          isRazorpayEnabled: true,
          defaultCustomerPaymentMethod: 'COD',
          codFeeType: 'FIXED',
          codFeeValue: 30,
          standardDeliveryFee: 40,
          freeShippingThreshold: 499
        })
      );

      render(
        <AllProviders initialEntries={['/checkout']}>
          <CheckoutPage />
        </AllProviders>
      );

      // Verify COD is selected by default and COD surcharge row appears (+ ₹30)
      await waitFor(() => {
        expect(screen.getByTestId('cod-surcharge-row')).toBeInTheDocument();
      });
      expect(screen.getByTestId('cod-surcharge-row')).toHaveTextContent('+ ₹30');
      // Subtotal ₹180 + Delivery ₹40 + COD ₹30 = ₹250
      expect(screen.getByTestId('checkout-grand-total')).toHaveTextContent('₹250');

      // Switch payment method to Razorpay
      const razorpayRadio = screen.getByText(/Online Payment \(Razorpay\)/i);
      fireEvent.click(razorpayRadio);

      // Surcharge row disappears, Total becomes ₹220 (180 + 40)
      await waitFor(() => {
        expect(screen.queryByTestId('cod-surcharge-row')).not.toBeInTheDocument();
      });
      expect(screen.getByTestId('checkout-grand-total')).toHaveTextContent('₹220');

      // Switch back to COD
      const codRadio = screen.getByText(/Cash on Delivery \(COD\)/i);
      fireEvent.click(codRadio);

      // Surcharge row reappears immediately: + ₹30, Total = ₹250
      await waitFor(() => {
        expect(screen.getByTestId('cod-surcharge-row')).toBeInTheDocument();
      });
      expect(screen.getByTestId('cod-surcharge-row')).toHaveTextContent('+ ₹30');
      expect(screen.getByTestId('checkout-grand-total')).toHaveTextContent('₹250');
    });
  });

  // =========================================================================
  // SECTION 3: STORE CONTENT, BRAND STORY & MARKDOWN INTEGRITY
  // =========================================================================
  describe('3. Store Content, Brand Story & Legal Policies Markdown Parity', () => {
    it('editing store content in AdminContent updates and reflects on ContentPage with safe markdown formatting', async () => {
      // Seed custom content for shipping-policy
      const customMarkdown = `## Shipping Guidelines
We dispatch within **24 hours** using cold-pressed methods.
- Fast dispatch across Kerala
- Free shipping above ₹499
Visit our [Browse Catalogue](/shop) now.`;

      localStorage.setItem(
        'zada_admin_store_content',
        JSON.stringify([
          {
            slug: 'shipping-policy',
            title: 'Express Kerala Shipping',
            content: customMarkdown,
            lastUpdated: '2026-11-11'
          }
        ])
      );

      render(
        <AllProviders initialEntries={['/shipping-policy']}>
          <ContentPage forcedSlug="shipping-policy" />
        </AllProviders>
      );

      // Page Title updated
      expect(screen.getByRole('heading', { level: 1, name: /Express Kerala Shipping/i })).toBeInTheDocument();

      // Heading 2 rendered from markdown
      expect(screen.getByRole('heading', { level: 2, name: /Shipping Guidelines/i })).toBeInTheDocument();

      // Bold text rendered
      expect(screen.getByText('24 hours')).toBeInTheDocument();

      // List items rendered
      expect(screen.getByText(/Fast dispatch across Kerala/i)).toBeInTheDocument();
      expect(screen.getByText(/Free shipping above ₹499/i)).toBeInTheDocument();

      // Safe link rendered
      const shopLink = screen.getByRole('link', { name: 'Browse Catalogue' });
      expect(shopLink).toBeInTheDocument();
      expect(shopLink).toHaveAttribute('href', '/shop');
    });

    it('OurStoryPage reflects custom title and body saved by administrator without conflicting hardcoded overrides', async () => {
      const customStoryTitle = 'Centuries of Pure Malabar Taste';
      const customStoryBody = `ZaDa Foods began in **Kozhikode**.
Our snacks are fried strictly in pure coconut oil.
> Traditional food requires patient cooking.`;

      localStorage.setItem(
        'zada_admin_store_content',
        JSON.stringify([
          {
            slug: 'about',
            title: customStoryTitle,
            content: customStoryBody,
            lastUpdated: '2026-11-11'
          }
        ])
      );

      render(
        <AllProviders initialEntries={['/our-story']}>
          <OurStoryPage />
        </AllProviders>
      );

      // Custom title appears in both Hero and Heritage section
      expect(screen.getByRole('heading', { level: 1, name: new RegExp(customStoryTitle, 'i') })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: new RegExp(customStoryTitle, 'i') })).toBeInTheDocument();

      // Markdown bold text appears
      expect(screen.getByText('Kozhikode')).toBeInTheDocument();

      // Markdown blockquote appears
      expect(screen.getByText(/Traditional food requires patient cooking/i)).toBeInTheDocument();

      // Craftsmanship pillars remain visible
      expect(screen.getByText(/100% Pure Coconut Oil/i)).toBeInTheDocument();
      expect(screen.getByText(/Farm-Direct Nendran Bananas/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SECTION 4: CONTRADICTION RESOLUTION & SETTINGS SYNCHRONISATION
  // =========================================================================
  describe('4. Settings Contradiction Resolution', () => {
    it('internal WhatsApp routing toggle does not disable website checkout or payment methods when in Website mode', () => {
      // Configuration with Website mode, COD enabled, Razorpay enabled, WhatsApp internal routing enabled
      const settings = {
        ...INITIAL_STORE_SETTINGS,
        checkoutMode: 'WEBSITE' as const,
        primaryCheckoutMode: 'COD' as const,
        isCodGloballyEnabled: true,
        isRazorpayEnabled: true,
        isWhatsAppAssistedCodEnabled: true,
        whatsAppDestinationNumber: '917593959235'
      };

      localStorage.setItem('zada_admin_settings', JSON.stringify(settings));

      // Seed cart with 1 item
      const product = INITIAL_PRODUCTS[0];
      const variant = product.variants[0];
      localStorage.setItem(
        'zada_guest_cart',
        JSON.stringify([
          {
            productId: product.id,
            variantId: variant.id,
            productName: product.name,
            productSlug: product.slug,
            categorySlug: product.categorySlug,
            variantWeightLabel: variant.weightLabel,
            imageUrl: product.images[0]?.imageUrl || '',
            unitPrice: variant.sellingPrice,
            mrp: variant.mrp,
            quantity: 1,
            isCodEligible: true,
            availableStock: 50
          }
        ])
      );

      render(
        <AllProviders initialEntries={['/checkout']}>
          <CheckoutPage />
        </AllProviders>
      );

      // Both genuine payment methods remain available
      expect(screen.getByText(/Cash on Delivery \(COD\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Online Payment \(Razorpay\)/i)).toBeInTheDocument();

      // WhatsApp is NOT presented as a payment option
      expect(screen.queryByText(/Pay via WhatsApp/i)).not.toBeInTheDocument();
    });
  });
});
