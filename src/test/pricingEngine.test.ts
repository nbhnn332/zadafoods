import { describe, it, expect } from 'vitest';
import { calculateAuthoritativeCart } from '../lib/commerce/pricingEngine';
import { INITIAL_PRODUCTS, INITIAL_COUPONS } from '../data/mockData';
import { PricingRule } from '../types';

describe('Server-Authoritative Pricing Engine', () => {
  const bananaChips = INITIAL_PRODUCTS[0]; // Banana Chips (Nendran)
  const variant250g = bananaChips.variants.find((v) => v.id === 'var-bcn-250')!; // ₹180 selling price

  it('calculates accurate raw subtotal without trusting client pricing', () => {
    const summary = calculateAuthoritativeCart(
      [{ productId: bananaChips.id, variantId: variant250g.id, quantity: 2 }],
      undefined,
      'STANDARD',
      {
        availableProducts: INITIAL_PRODUCTS,
        availableCoupons: INITIAL_COUPONS,
        userOrderCount: 0
      }
    );

    expect(summary.rawSubtotal).toBe(360);
    expect(summary.shippingFee).toBe(40); // Under ₹499 free threshold
    expect(summary.grandTotal).toBe(400);
  });

  it('applies free shipping when subtotal reaches or exceeds ₹499 threshold', () => {
    const summary = calculateAuthoritativeCart(
      [{ productId: bananaChips.id, variantId: variant250g.id, quantity: 3 }], // 3 x 180 = 540
      undefined,
      'STANDARD',
      {
        availableProducts: INITIAL_PRODUCTS,
        availableCoupons: INITIAL_COUPONS,
        userOrderCount: 0
      }
    );

    expect(summary.rawSubtotal).toBe(540);
    expect(summary.shippingFee).toBe(0); // Free shipping above ₹499
    expect(summary.freeShippingApplied).toBe(true);
    expect(summary.grandTotal).toBe(540);
  });

  it('evaluates quantity-tier discounts for bulk purchases', () => {
    const tierRule: PricingRule = {
      id: 'pr-tier-1',
      name: 'Bulk Pack Discount',
      ruleType: 'QUANTITY_TIER',
      productId: bananaChips.id,
      variantId: variant250g.id,
      minQuantity: 3,
      discountPercentage: 5, // 5% discount for 3+ units
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const summary = calculateAuthoritativeCart(
      [{ productId: bananaChips.id, variantId: variant250g.id, quantity: 4 }], // 4 x 180 = 720
      undefined,
      'STANDARD',
      {
        availableProducts: INITIAL_PRODUCTS,
        availableCoupons: INITIAL_COUPONS,
        pricingRules: [tierRule],
        userOrderCount: 0
      }
    );

    // Each pack discounted 5%: 180 * 0.95 = 171
    // Total: 4 x 171 = 684
    expect(summary.promotionalDiscount).toBe(36);
    expect(summary.discountedSubtotal).toBe(684);
  });

  it('validates first-order only coupon eligibility', () => {
    // User with 0 prior orders qualifies for FIRST10
    const eligibleSummary = calculateAuthoritativeCart(
      [{ productId: bananaChips.id, variantId: variant250g.id, quantity: 3 }], // 540
      'FIRST10',
      'STANDARD',
      {
        availableProducts: INITIAL_PRODUCTS,
        availableCoupons: INITIAL_COUPONS,
        userOrderCount: 0
      }
    );
    expect(eligibleSummary.couponDiscount).toBe(54); // 10% of 540

    // User with 1 prior order is rejected for FIRST10
    const ineligibleSummary = calculateAuthoritativeCart(
      [{ productId: bananaChips.id, variantId: variant250g.id, quantity: 3 }],
      'FIRST10',
      'STANDARD',
      {
        availableProducts: INITIAL_PRODUCTS,
        availableCoupons: INITIAL_COUPONS,
        userOrderCount: 1
      }
    );
    expect(ineligibleSummary.couponDiscount).toBe(0);
  });

  it('enforces mixed-cart COD restriction when any item is not COD eligible', () => {
    const prepaidOnlyProduct = {
      ...bananaChips,
      id: 'prod-prepaid-only',
      isCodEligible: false
    };

    const summary = calculateAuthoritativeCart(
      [
        { productId: bananaChips.id, variantId: variant250g.id, quantity: 1 },
        { productId: prepaidOnlyProduct.id, variantId: variant250g.id, quantity: 1 }
      ],
      undefined,
      'STANDARD',
      {
        availableProducts: [bananaChips, prepaidOnlyProduct],
        availableCoupons: INITIAL_COUPONS,
        userOrderCount: 0
      }
    );

    expect(summary.isCodEligible).toBe(false);
  });

  it('rejects invalid or non-integer quantities strictly', () => {
    expect(() =>
      calculateAuthoritativeCart(
        [{ productId: bananaChips.id, variantId: variant250g.id, quantity: -2 }],
        undefined,
        'STANDARD',
        { availableProducts: INITIAL_PRODUCTS, availableCoupons: INITIAL_COUPONS, userOrderCount: 0 }
      )
    ).toThrow(/Invalid item quantity/);

    expect(() =>
      calculateAuthoritativeCart(
        [{ productId: bananaChips.id, variantId: variant250g.id, quantity: 0 }],
        undefined,
        'STANDARD',
        { availableProducts: INITIAL_PRODUCTS, availableCoupons: INITIAL_COUPONS, userOrderCount: 0 }
      )
    ).toThrow(/Invalid item quantity/);
  });

  it('rejects expired coupons and exhausted usage limits', () => {
    const expiredCoupon = {
      id: 'c-exp',
      code: 'EXPIRED50',
      discountType: 'FLAT' as const,
      discountValue: 50,
      minOrderAmount: 100,
      isFirstOrderOnly: false,
      timesUsed: 0,
      isActive: true,
      validUntil: '2020-01-01T00:00:00Z' // Expired in 2020
    };

    const exhaustedCoupon = {
      id: 'c-exh',
      code: 'EXHAUSTED50',
      discountType: 'FLAT' as const,
      discountValue: 50,
      minOrderAmount: 100,
      isFirstOrderOnly: false,
      usageLimit: 10,
      timesUsed: 10, // Max reached
      isActive: true
    };

    const summaryExpired = calculateAuthoritativeCart(
      [{ productId: bananaChips.id, variantId: variant250g.id, quantity: 2 }],
      'EXPIRED50',
      'STANDARD',
      {
        availableProducts: INITIAL_PRODUCTS,
        availableCoupons: [expiredCoupon],
        userOrderCount: 0
      }
    );
    expect(summaryExpired.couponDiscount).toBe(0);

    const summaryExhausted = calculateAuthoritativeCart(
      [{ productId: bananaChips.id, variantId: variant250g.id, quantity: 2 }],
      'EXHAUSTED50',
      'STANDARD',
      {
        availableProducts: INITIAL_PRODUCTS,
        availableCoupons: [exhaustedCoupon],
        userOrderCount: 0
      }
    );
    expect(summaryExhausted.couponDiscount).toBe(0);
  });
});
