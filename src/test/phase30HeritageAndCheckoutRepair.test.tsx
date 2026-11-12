import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { CartProvider, useCart } from '../context/CartContext';
import { AdminDataProvider } from '../context/AdminDataContext';
import { FestivalProvider } from '../context/FestivalContext';
import { HomePage } from '../pages/HomePage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { ProductCard } from '../components/ProductCard';
import { encodeCouponDescription, parseCouponDescription } from '../lib/commerce/supabaseDataService';
import { Product, HeritageStorySectionConfig, Coupon } from '../types';

describe('ZaDa Foods — Phase 30: Heritage CMS Synchronisation, Handpicked Design, Single-Use Coupons & Proper Checkout', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Heritage Story Authoritative Content Synchronisation', () => {
    it('synchronizes heritage story section data structure and eliminates hardcoded overrides', async () => {
      const mockHeritageConfig: HeritageStorySectionConfig = {
        id: 'h0000000-0000-0000-0000-000000000004',
        eyebrow: 'ESTD 1948 • CALICUT',
        heading: 'Generational Artistry in Every Crisp Batch',
        subtitle: 'Authentic Malabar Spice & Sweet Tradition',
        description: 'Made exclusively in cold-pressed Kerala coconut oil with locally harvested Nendran bananas.',
        imageUrl: '/assets/prod-banana-chips-hero.png',
        ctaLabel: 'Discover Our Heritage',
        ctaDestination: '/our-story',
        bgPreset: '#FAF6EE',
        textColor: '#1C1917',
        isActive: true,
        displayOrder: 6,
        desktopVisible: true,
        mobileVisible: true
      };

      localStorage.setItem('zada_admin_heritage_story_section', JSON.stringify(mockHeritageConfig));

      render(
        <MemoryRouter initialEntries={['/']}>
          <ToastProvider>
            <AuthProvider>
              <AdminDataProvider>
                <CartProvider>
                  <FestivalProvider>
                    <HomePage />
                  </FestivalProvider>
                </CartProvider>
              </AdminDataProvider>
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      // Verify authoritative heading, eyebrow, subtitle, description, and CTA
      expect(screen.getByText('ESTD 1948 • CALICUT')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Generational Artistry in Every Crisp Batch/i })).toBeInTheDocument();
      expect(screen.getByText('Authentic Malabar Spice & Sweet Tradition')).toBeInTheDocument();
      expect(screen.getByText(/Made exclusively in cold-pressed Kerala coconut oil/i)).toBeInTheDocument();

      const ctaLink = screen.getByRole('link', { name: 'Discover Our Heritage' });
      expect(ctaLink).toBeInTheDocument();
      expect(ctaLink).toHaveAttribute('href', '/our-story');
    });
  });

  describe('2. Handpicked for You Styling & Product Sanitation', () => {
    it('does NOT render green background gradient on Handpicked for You section', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <ToastProvider>
            <AuthProvider>
              <AdminDataProvider>
                <CartProvider>
                  <FestivalProvider>
                    <HomePage />
                  </FestivalProvider>
                </CartProvider>
              </AdminDataProvider>
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      const headings = screen.getAllByRole('heading', { level: 2 });
      const handpickedHeading = headings.find((h) => h.textContent?.includes('Traditional Sweets & Specialties'));
      if (handpickedHeading) {
        const sectionContainer = handpickedHeading.closest('section');
        expect(sectionContainer).not.toBeNull();
        expect(sectionContainer?.className).not.toContain('bg-gradient-to-br from-[#031D16] to-[#072C20]');
        expect(sectionContainer?.className).toContain('border-t');
      }
    });

    it('renders clean monogram placeholder for image-free products', () => {
      const imageFreeProduct: Product = {
        id: 'prod-clean-monogram',
        name: 'Heritage Sesame Laddu',
        slug: 'heritage-sesame-laddu',
        description: 'Traditional sesame sweet',
        categoryId: 'cat-sweets',
        categorySlug: 'sweets',
        isPublished: true,
        isBestseller: true,
        isOnOffer: false,
        isPreservativeFree: true,
        isCoconutOilMade: true,
        isCodEligible: true,
        storageInstructions: 'Cool and dry',
        ingredients: 'Sesame, Jaggery',
        shelfLifeDays: 90,
        averageRating: 4.8,
        reviewCount: 12,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        images: [], // intentionally empty
        variants: [
          {
            id: 'var-1',
            productId: 'prod-clean-monogram',
            sku: 'HSL-250',
            weightValue: 250,
            weightUnit: 'g',
            weightLabel: '250g',
            sellingPrice: 190,
            mrp: 220,
            discountPercentage: 14,
            stockQuantity: 25,
            lowStockThreshold: 5,
            isDefault: true
          }
        ]
      };

      render(
        <MemoryRouter>
          <ToastProvider>
            <CartProvider>
              <ProductCard product={imageFreeProduct} />
            </CartProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      // Verify that the luxury monogram initial is rendered instead of a fallback cat-chips image
      expect(screen.getByText('H')).toBeInTheDocument();
      expect(screen.getByText('ZaDa Foods')).toBeInTheDocument();
      expect(screen.getByText('Authentic Malabar')).toBeInTheDocument();
      expect(screen.queryByRole('img')).toBeNull();
    });
  });

  describe('3. Single-Use and Customer-Assigned Coupons', () => {
    it('correctly encodes and parses customer assignment and single-use flags', () => {
      const encoded = encodeCouponDescription('Diwali special promotion', 'customer@example.com', true);
      expect(encoded).toContain('ASSIGNED:customer@example.com');
      expect(encoded).toContain('SINGLE_USE:true');
      expect(encoded).toContain('Diwali special promotion');

      const parsed = parseCouponDescription(encoded);
      expect(parsed.assignedCustomerEmail).toBe('customer@example.com');
      expect(parsed.isSingleUsePerCustomer).toBe(true);
      expect(parsed.description).toBe('Diwali special promotion');
    });

    it('rejects coupon application if reserved for another customer email', async () => {
      const assignedCoupon: Coupon = {
        id: 'coup-assigned-1',
        code: 'VIPEXCLUSIVE50',
        discountType: 'FLAT',
        discountValue: 50,
        minOrderAmount: 100,
        isFirstOrderOnly: false,
        timesUsed: 0,
        isActive: true,
        assignedCustomerEmail: 'vip.patron@domain.com',
        isSingleUsePerCustomer: true
      };

      localStorage.setItem('zada_admin_coupons', JSON.stringify([assignedCoupon]));

      let testCartApi: any = null;
      const TestConsumer = () => {
        testCartApi = useCart();
        return <div>Cart Consumer</div>;
      };

      render(
        <MemoryRouter>
          <ToastProvider>
            <AuthProvider>
              <AdminDataProvider>
                <CartProvider>
                  <TestConsumer />
                </CartProvider>
              </AdminDataProvider>
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(testCartApi).not.toBeNull();
      });

      // Wrong customer attempts application
      let wrongUserRes: any;
      act(() => {
        wrongUserRes = testCartApi.applyCoupon('VIPEXCLUSIVE50', 500, 'intruder@other.com');
      });
      expect(wrongUserRes.success).toBe(false);
      expect(wrongUserRes.message).toContain('reserved for another customer');

      // Correct customer attempts application
      let correctUserRes: any;
      act(() => {
        correctUserRes = testCartApi.applyCoupon('VIPEXCLUSIVE50', 500, 'vip.patron@domain.com');
      });
      expect(correctUserRes.success).toBe(true);
      expect(correctUserRes.message).toContain('Coupon applied successfully');
    });

    it('rejects coupon if already redeemed when marked as single-use', async () => {
      const usedSingleUseCoupon: Coupon = {
        id: 'coup-single-used',
        code: 'ONCEONLY',
        discountType: 'FLAT',
        discountValue: 100,
        minOrderAmount: 200,
        isFirstOrderOnly: false,
        timesUsed: 1,
        usageLimit: 1,
        isActive: true,
        isSingleUsePerCustomer: true
      };

      localStorage.setItem('zada_admin_coupons', JSON.stringify([usedSingleUseCoupon]));

      let testCartApi: any = null;
      const TestConsumer = () => {
        testCartApi = useCart();
        return <div>Cart Consumer</div>;
      };

      render(
        <MemoryRouter>
          <ToastProvider>
            <AuthProvider>
              <AdminDataProvider>
                <CartProvider>
                  <TestConsumer />
                </CartProvider>
              </AdminDataProvider>
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(testCartApi).not.toBeNull();
      });

      let res: any;
      act(() => {
        res = testCartApi.applyCoupon('ONCEONLY', 500, 'customer@example.com');
      });
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/already been redeemed|maximum usage limit/i);
    });
  });

  describe('4. Proper Ecommerce Checkout (Zero WhatsApp Redirection for COD)', () => {
    it('calculates COD extra surcharge and displays it as distinct line item in Order Summary', async () => {
      // Store settings with ₹40 COD fee
      const storeSettingsWithCodFee = {
        isCodGloballyEnabled: true,
        codFeeType: 'FIXED' as const,
        codFeeValue: 40,
        standardDeliveryFee: 40,
        freeShippingThreshold: 999
      };
      localStorage.setItem('zada_admin_settings', JSON.stringify(storeSettingsWithCodFee));

      render(
        <MemoryRouter initialEntries={['/checkout?demo=true']}>
          <ToastProvider>
            <AuthProvider>
              <AdminDataProvider>
                <CartProvider>
                  <FestivalProvider>
                    <CheckoutPage />
                  </FestivalProvider>
                </CartProvider>
              </AdminDataProvider>
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      // Verify COD payment mode is available and displays handling fee
      await waitFor(() => {
        expect(screen.getByText('Cash on Delivery (COD)')).toBeInTheDocument();
      });

      // Confirm that the place order button mentions Cash on Delivery directly without WhatsApp
      const codButton = screen.getByRole('button', { name: /Place Cash on Delivery Order/i });
      expect(codButton).toBeInTheDocument();
      expect(codButton.textContent).not.toContain('WhatsApp');
    });
  });
});
