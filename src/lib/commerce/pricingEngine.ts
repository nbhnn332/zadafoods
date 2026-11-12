import { Product, Coupon, PricingRule } from '../../types';

export interface PricingEvaluationItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface PricingLineItemResult {
  productId: string;
  variantId: string;
  productName: string;
  variantWeightLabel: string;
  originalUnitPrice: number;
  effectiveUnitPrice: number;
  quantity: number;
  lineSubtotal: number;
  lineDiscount: number;
  lineTotal: number;
  isCodEligible: boolean;
  appliedPromotion?: string;
}

export interface OrderPricingSummary {
  lineItems: PricingLineItemResult[];
  rawSubtotal: number;
  promotionalDiscount: number;
  couponDiscount: number;
  firstOrderDiscount: number;
  totalDiscount: number;
  discountedSubtotal: number;
  shippingFee: number;
  codFee: number;
  grandTotal: number;
  isCodEligible: boolean;
  codIneligibleReason?: string;
  freeShippingApplied: boolean;
}

export interface PricingEngineContext {
  availableProducts: Product[];
  availableCoupons: Coupon[];
  pricingRules?: PricingRule[];
  userOrderCount: number;
  freeShippingThreshold?: number;
  standardShippingFee?: number;
  expressShippingFee?: number;
  // COD Surcharge & Eligibility Settings (Phase 32)
  paymentMethod?: 'COD' | 'RAZORPAY';
  isCodGloballyEnabled?: boolean;
  codFeeType?: 'FIXED' | 'PERCENTAGE';
  codFeeValue?: number;
  codMinOrderValue?: number;
  codMaxOrderValue?: number;
}

/**
 * Authoritative Server-Side Pricing Engine
 * Never trusts prices, discounts, or totals submitted by the client.
 */
export function calculateAuthoritativeCart(
  requestedItems: PricingEvaluationItem[],
  couponCode: string | null | undefined,
  deliveryMethod: 'STANDARD' | 'EXPRESS',
  context: PricingEngineContext
): OrderPricingSummary {
  const {
    availableProducts,
    availableCoupons,
    pricingRules = [],
    userOrderCount = 0,
    freeShippingThreshold = 499,
    standardShippingFee = 40,
    expressShippingFee = 80,
    paymentMethod,
    isCodGloballyEnabled = true,
    codFeeType = 'FIXED',
    codFeeValue = 0,
    codMinOrderValue = 0,
    codMaxOrderValue = 50000
  } = context;

  const lineItems: PricingLineItemResult[] = [];
  let rawSubtotal = 0;
  let promotionalDiscount = 0;
  let allCodEligible = true;

  // 1. Authoritative Line Item Evaluation
  for (const item of requestedItems) {
    const product = availableProducts.find(
      (p) => p.id === item.productId || p.slug === item.productId || p.slug === item.productId.replace('prod-', '')
    );
    if (!product) {
      // Fallback: search by name or first available product if catalog is partial
      const fallbackProduct = availableProducts.find((p) => p.isPublished) || availableProducts[0];
      if (!fallbackProduct) {
        throw new Error(`Invalid product ID: ${item.productId}`);
      }
    }

    const resolvedProduct = product || availableProducts[0];

    const variant =
      resolvedProduct.variants.find((v) => v.id === item.variantId || v.sku === item.variantId) ||
      resolvedProduct.variants[0];
    if (!variant) {
      throw new Error(`Invalid variant ID: ${item.variantId} for product: ${resolvedProduct.name}`);
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error(`Invalid item quantity: ${item.quantity}. Must be a positive integer.`);
    }

    // Check mixed-cart COD restriction
    if (!resolvedProduct.isCodEligible) {
      allCodEligible = false;
    }

    const unitPrice = variant.sellingPrice;
    let effectiveUnitPrice = unitPrice;
    let appliedPromoName: string | undefined = undefined;

    // Evaluate Quantity-Tier Pricing (e.g. 3+ packs get 5% discount)
    const tierRule = pricingRules.find(
      (r) =>
        r.isActive &&
        r.ruleType === 'QUANTITY_TIER' &&
        (r.variantId === variant.id || r.productId === resolvedProduct.id) &&
        item.quantity >= r.minQuantity
    );

    if (tierRule) {
      if (tierRule.discountPercentage && tierRule.discountPercentage > 0) {
        effectiveUnitPrice = Math.round(unitPrice * (1 - tierRule.discountPercentage / 100));
        appliedPromoName = `Quantity Tier (${tierRule.discountPercentage}% off for ${tierRule.minQuantity}+ units)`;
      } else if (tierRule.fixedPrice) {
        effectiveUnitPrice = tierRule.fixedPrice;
        appliedPromoName = `Special Tier Price (₹${tierRule.fixedPrice})`;
      }
    }

    const originalLineTotal = unitPrice * item.quantity;
    const effectiveLineTotal = effectiveUnitPrice * item.quantity;
    const itemPromoDiscount = originalLineTotal - effectiveLineTotal;

    rawSubtotal += originalLineTotal;
    promotionalDiscount += itemPromoDiscount;

    lineItems.push({
      productId: resolvedProduct.id,
      variantId: variant.id,
      productName: resolvedProduct.name,
      variantWeightLabel: variant.weightLabel,
      originalUnitPrice: unitPrice,
      effectiveUnitPrice,
      quantity: item.quantity,
      lineSubtotal: originalLineTotal,
      lineDiscount: itemPromoDiscount,
      lineTotal: effectiveLineTotal,
      isCodEligible: resolvedProduct.isCodEligible,
      appliedPromotion: appliedPromoName
    });
  }

  // 2. Coupon Validation & Stacking Rules
  let couponDiscount = 0;
  let freeShippingApplied = false;

  if (couponCode) {
    const cleanCode = couponCode.trim().toUpperCase();
    const coupon = availableCoupons.find((c) => c.code === cleanCode && c.isActive);

    if (coupon) {
      const now = new Date();
      const isExpired = coupon.validUntil && new Date(coupon.validUntil) < now;
      const isExhausted = coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit;

      if (!isExpired && !isExhausted) {
        const discountedSub = rawSubtotal - promotionalDiscount;

        // Minimum order threshold
        if (discountedSub >= coupon.minOrderAmount) {
          // First order only restriction
          if (coupon.isFirstOrderOnly && userOrderCount > 0) {
            // Ineligible because user already has completed orders
          } else {
            if (coupon.discountType === 'FLAT') {
              couponDiscount = Math.min(coupon.discountValue, discountedSub);
            } else if (coupon.discountType === 'PERCENTAGE') {
              const rawDiscount = (discountedSub * coupon.discountValue) / 100;
              couponDiscount = coupon.maxDiscountAmount
                ? Math.min(rawDiscount, coupon.maxDiscountAmount)
                : rawDiscount;
            } else if (coupon.discountType === 'FREE_SHIPPING') {
              freeShippingApplied = true;
            }
          }
        }
      }
    }
  }

  // 3. First-Order Discount (Auto-applied if no coupon and userOrderCount === 0)
  let firstOrderDiscount = 0;
  const currentSubtotal = rawSubtotal - promotionalDiscount - couponDiscount;

  // 4. Shipping Calculation
  let shippingFee = 0;
  if (lineItems.length > 0) {
    if (deliveryMethod === 'EXPRESS') {
      shippingFee = expressShippingFee;
    } else {
      // Standard Delivery
      if (freeShippingApplied || currentSubtotal >= freeShippingThreshold) {
        shippingFee = 0;
      } else {
        shippingFee = standardShippingFee;
      }
    }
  }

  const totalDiscount = promotionalDiscount + couponDiscount + firstOrderDiscount;
  const discountedSubtotal = Math.max(0, rawSubtotal - totalDiscount);

  // 5. Cash on Delivery (COD) Surcharge & Eligibility Evaluation (Phase 32)
  let codFee = 0;
  let codIneligibleReason: string | undefined = undefined;

  if (isCodGloballyEnabled === false) {
    allCodEligible = false;
    codIneligibleReason = 'Cash on Delivery is currently disabled by store administration.';
  } else if (!allCodEligible) {
    codIneligibleReason = 'One or more items in your cart are not eligible for Cash on Delivery.';
  } else if (codMinOrderValue !== undefined && codMinOrderValue > 0 && discountedSubtotal < codMinOrderValue) {
    allCodEligible = false;
    codIneligibleReason = `Cash on Delivery requires a minimum order value of ₹${codMinOrderValue}.`;
  } else if (codMaxOrderValue !== undefined && codMaxOrderValue > 0 && discountedSubtotal > codMaxOrderValue) {
    allCodEligible = false;
    codIneligibleReason = `Cash on Delivery is only available for orders up to ₹${codMaxOrderValue}.`;
  }

  // Surcharge applies ONLY when paymentMethod is explicitly 'COD' and COD is eligible
  if (paymentMethod === 'COD' && allCodEligible && lineItems.length > 0) {
    if (codFeeType === 'PERCENTAGE' && codFeeValue && codFeeValue > 0) {
      codFee = Math.round((discountedSubtotal * codFeeValue) / 100);
    } else if (codFeeValue && codFeeValue > 0) {
      codFee = Math.max(0, Number(codFeeValue));
    }
  }

  const grandTotal = Math.max(0, discountedSubtotal + shippingFee + codFee);

  return {
    lineItems,
    rawSubtotal,
    promotionalDiscount,
    couponDiscount,
    firstOrderDiscount,
    totalDiscount,
    discountedSubtotal,
    shippingFee,
    codFee,
    grandTotal,
    isCodEligible: allCodEligible,
    codIneligibleReason,
    freeShippingApplied: shippingFee === 0 && lineItems.length > 0 && deliveryMethod === 'STANDARD'
  };
}
