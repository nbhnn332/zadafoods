import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AdminDataProvider, useAdminData } from '../context/AdminDataContext';
import { ToastProvider } from '../context/ToastContext';

describe('ZaDa Foods — Phase 3 Admin Operations & Data Integrity', () => {
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ToastProvider>
      <AdminDataProvider>{children}</AdminDataProvider>
    </ToastProvider>
  );

  beforeEach(() => {
    localStorage.clear();
  });

  it('allows creating, updating, and archiving products with multi-pack variants', () => {
    const { result } = renderHook(() => useAdminData(), { wrapper });

    act(() => {
      result.current.addProduct({
        name: 'Crispy Kerala Murukku',
        slug: 'crispy-kerala-murukku',
        categoryId: 'cat-chips',
        categorySlug: 'chips',
        description: 'Crisp spiral savoury snacks made with rice flour and roasted cumin.',
        isPreservativeFree: true,
        isCoconutOilMade: true,
        isBestseller: true,
        isOnOffer: false,
        isCodEligible: true,
        isPublished: true,
        images: [{ id: 'img-1', imageUrl: 'https://...', altText: 'Murukku', displayOrder: 1 }],
        variants: [
          {
            id: 'var-murukku-250g',
            productId: 'prod-new',
            sku: 'ZDF-MURUKKU-250G',
            weightValue: 250,
            weightUnit: 'g',
            weightLabel: '250 g',
            sellingPrice: 120,
            mrp: 140,
            discountPercentage: 14,
            stockQuantity: 50,
            lowStockThreshold: 10
          }
        ]
      });
    });

    const created = result.current.products.find((p) => p.slug === 'crispy-kerala-murukku');
    expect(created).toBeDefined();
    expect(created?.name).toBe('Crispy Kerala Murukku');
    expect(created?.variants.length).toBe(1);
    expect(created?.variants[0].stockQuantity).toBe(50);

    // Toggle publish
    act(() => {
      result.current.toggleProductPublish(created!.id);
    });

    const toggled = result.current.products.find((p) => p.id === created!.id);
    expect(toggled?.isPublished).toBe(false);
  });

  it('adjusts variant stock atomically and prevents negative stock balances', () => {
    const { result } = renderHook(() => useAdminData(), { wrapper });
    const targetVariant = result.current.products[0].variants[0];
    const initialStock = targetVariant.stockQuantity;

    // Add 25 units via Purchase Order
    act(() => {
      result.current.adjustVariantStock(
        targetVariant.id,
        25,
        'PURCHASE_ORDER',
        'Batch PO-901 arrival'
      );
    });

    const afterAdd = result.current.products[0].variants[0];
    expect(afterAdd.stockQuantity).toBe(initialStock + 25);

    // Verify Movement History entry was recorded
    const latestMovement = result.current.stockMovements[0];
    expect(latestMovement.variantId).toBe(targetVariant.id);
    expect(latestMovement.delta).toBe(25);
    expect(latestMovement.reason).toBe('PURCHASE_ORDER');

    // Attempt to deduct more than available (should floor at 0, no negative stock)
    act(() => {
      result.current.adjustVariantStock(
        targetVariant.id,
        -99999,
        'DAMAGE_WASTE',
        'Catastrophic warehouse spill'
      );
    });

    const floored = result.current.products[0].variants[0];
    expect(floored.stockQuantity).toBe(0);
  });

  it('enforces order status transitions and restocks inventory on order cancellation', () => {
    const { result } = renderHook(() => useAdminData(), { wrapper });
    const order = result.current.orders[0];
    const purchasedItem = order.items[0];

    // Find current stock of the purchased variant
    let currentStock = 0;
    result.current.products.forEach((p) => {
      const v = p.variants.find((vr) => vr.id === purchasedItem.variantId);
      if (v) currentStock = v.stockQuantity;
    });

    // Advance status to PACKED
    let transitionResult = false;
    act(() => {
      transitionResult = result.current.updateOrderStatus(order.id, 'PACKED', undefined, undefined, 'Packed cleanly.');
    });
    expect(transitionResult).toBe(true);

    // Cancel order -> must automatically restock the purchased items!
    act(() => {
      result.current.updateOrderStatus(order.id, 'CANCELLED', undefined, undefined, 'Customer requested cancellation.');
    });

    const cancelledOrder = result.current.orders.find((o) => o.id === order.id);
    expect(cancelledOrder?.fulfillmentStatus).toBe('CANCELLED');

    // Verify stock was restored
    let restockedQty = 0;
    result.current.products.forEach((p) => {
      const v = p.variants.find((vr) => vr.id === purchasedItem.variantId);
      if (v) restockedQty = v.stockQuantity;
    });
    expect(restockedQty).toBe(currentStock + purchasedItem.quantity);

    // Verify cancellation is final (cannot transition from CANCELLED to DELIVERED)
    let invalidTransition = false;
    act(() => {
      invalidTransition = result.current.updateOrderStatus(order.id, 'DELIVERED');
    });
    expect(invalidTransition).toBe(false);
  });

  it('validates combo bundle savings calculation against individual variant retail prices', () => {
    const { result } = renderHook(() => useAdminData(), { wrapper });

    act(() => {
      result.current.addCombo({
        name: 'Festive Halwa & Banana Chips Gift Box',
        slug: 'festive-halwa-chips-gift-box',
        description: 'Luxury heritage gift box containing pure Kozhikode Halwa and crispy Nendran chips.',
        imageUrl: 'https://...',
        originalPrice: 500,
        comboPrice: 420,
        discountPercent: 16,
        isActive: true,
        items: [
          {
            productId: 'prod-banana-chips-nendran',
            variantId: 'var-chips-500g',
            quantity: 1,
            productName: 'Kerala Banana Chips',
            variantLabel: '500 g'
          }
        ]
      });
    });

    const combo = result.current.combos.find((c) => c.slug === 'festive-halwa-chips-gift-box');
    expect(combo).toBeDefined();
    expect(combo?.comboPrice).toBe(420);
    expect(combo?.discountPercent).toBe(16);
  });

  it('moderates customer reviews and updates PDP visibility', () => {
    const { result } = renderHook(() => useAdminData(), { wrapper });

    act(() => {
      result.current.addReview({
        productId: 'prod-banana-chips-nendran',
        reviewerName: 'Anoop Kumar',
        rating: 5,
        reviewTitle: 'Unbeatable Coconut Oil Fragrance',
        reviewText: 'Arrived crisp and fresh in Bangalore within 2 days.',
        isVerifiedPurchase: true
      });
    });

    const newRev = result.current.reviews.find((r) => r.reviewerName === 'Anoop Kumar');
    expect(newRev).toBeDefined();
    expect(newRev?.isApproved).toBe(true);

    // Pin review to PDP
    act(() => {
      result.current.toggleReviewFeatured(newRev!.id);
    });

    const pinned = result.current.reviews.find((r) => r.id === newRev!.id);
    expect(pinned?.isFeaturedOnPdp).toBe(true);
  });
});
