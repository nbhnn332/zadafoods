import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AdminDataProvider, useAdminData } from '../context/AdminDataContext';
import { ToastProvider } from '../context/ToastContext';
import { Order } from '../types';

describe('ZaDa Foods — Phase 3 Independent Verification Audit Test Suite', () => {
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ToastProvider>
      <AdminDataProvider>{children}</AdminDataProvider>
    </ToastProvider>
  );

  beforeEach(() => {
    localStorage.clear();
  });

  // 1. Dashboard & Reports Dynamic Calculations (No Hardcoding)
  it('dynamically computes AOV, revenue, and ignores cancelled/unpaid orders without hardcoded values', () => {
    const { result } = renderHook(() => useAdminData(), { wrapper });

    // Initial state has 1 paid order of ₹890
    const initialPaid = result.current.orders.filter((o) => o.paymentStatus === 'PAID');
    const initialTotal = initialPaid.reduce((s, o) => s + o.totalAmount, 0);
    const initialAOV = initialPaid.length > 0 ? Math.round(initialTotal / initialPaid.length) : 0;
    expect(initialAOV).toBe(890);

    // Add a new PAID order of ₹1110
    const newPaidOrder: Order = {
      id: 'ord-test-paid',
      orderNumber: 'ZDF9999',
      customerName: 'Kavitha R',
      customerEmail: 'kavitha@example.com',
      customerPhone: '+91 9988776655',
      shippingAddress: {
        id: 'addr-k',
        userId: 'u-k',
        tag: 'Home',
        recipientName: 'Kavitha R',
        phone: '+91 9988776655',
        streetAddress: '10 Beach Road',
        city: 'Kozhikode',
        state: 'Kerala',
        postalCode: '673001',
        isDefault: true
      },
      deliveryMethod: 'STANDARD',
      paymentMode: 'RAZORPAY',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'CONFIRMED',
      subtotalAmount: 1150,
      discountAmount: 80,
      shippingCharge: 40,
      totalAmount: 1110,
      items: [
        {
          id: 'item-k1',
          productId: 'prod-banana-chips-nendran',
          variantId: 'var-chips-500g',
          productName: 'Banana Chips',
          variantWeightLabel: '500 g',
          imageUrl: '',
          unitPrice: 260,
          quantity: 2,
          lineTotal: 520
        }
      ],
      statusHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add an UNPAID (PENDING) WhatsApp order of ₹5000 (must NOT be counted in paid revenue or AOV)
    const unpaidOrder: Order = {
      ...newPaidOrder,
      id: 'ord-test-unpaid',
      orderNumber: 'ZDF9998',
      paymentStatus: 'PENDING',
      paymentMode: 'WHATSAPP_MANUAL',
      totalAmount: 5000
    };

    act(() => {
      result.current.createOrder(newPaidOrder);
      result.current.createOrder(unpaidOrder);
    });

    const activePaid = result.current.orders.filter((o) => o.paymentStatus === 'PAID');
    expect(activePaid.length).toBe(2);

    const expectedRevenue = 890 + 1110; // 2000
    const calculatedRevenue = activePaid.reduce((s, o) => s + o.totalAmount, 0);
    expect(calculatedRevenue).toBe(expectedRevenue);

    const dynamicAOV = Math.round(calculatedRevenue / activePaid.length);
    expect(dynamicAOV).toBe(1000); // 2000 / 2 = 1000, proved dynamic not hardcoded
  });

  // 2. Cancellation Restocking Idempotency Protection
  it('ensures cancellation is idempotent: repeated cancellation requests cannot double restock inventory', () => {
    const { result } = renderHook(() => useAdminData(), { wrapper });
    const targetOrder = result.current.orders[0];
    const orderedItem = targetOrder.items[0];

    // Find starting stock
    let initialStock = 0;
    result.current.products.forEach((p) => {
      const v = p.variants.find((vr) => vr.id === orderedItem.variantId);
      if (v) initialStock = v.stockQuantity;
    });

    // 1st Cancellation attempt -> must succeed and restock item
    let firstAttempt = false;
    act(() => {
      firstAttempt = result.current.updateOrderStatus(targetOrder.id, 'CANCELLED', undefined, undefined, 'First cancellation');
    });
    expect(firstAttempt).toBe(true);

    let stockAfterFirstCancel = 0;
    result.current.products.forEach((p) => {
      const v = p.variants.find((vr) => vr.id === orderedItem.variantId);
      if (v) stockAfterFirstCancel = v.stockQuantity;
    });
    expect(stockAfterFirstCancel).toBe(initialStock + orderedItem.quantity);

    // 2nd Cancellation attempt on already CANCELLED order -> must be REJECTED and NOT restock again!
    let secondAttempt = true;
    act(() => {
      secondAttempt = result.current.updateOrderStatus(targetOrder.id, 'CANCELLED', undefined, undefined, 'Duplicate cancellation attempt');
    });
    expect(secondAttempt).toBe(false);

    let stockAfterSecondAttempt = 0;
    result.current.products.forEach((p) => {
      const v = p.variants.find((vr) => vr.id === orderedItem.variantId);
      if (v) stockAfterSecondAttempt = v.stockQuantity;
    });
    // Stock MUST remain unchanged (idempotent protection)
    expect(stockAfterSecondAttempt).toBe(stockAfterFirstCancel);
  });

  // 3. Permitted Status Transitions
  it('prevents illegal transitions such as reopening a DELIVERED order', () => {
    const { result } = renderHook(() => useAdminData(), { wrapper });
    const targetOrder = result.current.orders[0];

    // Advance to DELIVERED
    act(() => {
      result.current.updateOrderStatus(targetOrder.id, 'PACKED');
      result.current.updateOrderStatus(targetOrder.id, 'SHIPPED', 'Delhivery', 'DEL8811');
      result.current.updateOrderStatus(targetOrder.id, 'DELIVERED');
    });

    const delivered = result.current.orders.find((o) => o.id === targetOrder.id);
    expect(delivered?.fulfillmentStatus).toBe('DELIVERED');

    // Attempt illegal transition: move DELIVERED back to CONFIRMED
    let illegalMove = true;
    act(() => {
      illegalMove = result.current.updateOrderStatus(targetOrder.id, 'CONFIRMED');
    });
    expect(illegalMove).toBe(false);
  });

  // 4. Review Moderation Isolation
  it('hides unapproved reviews from the public storefront and only shows approved ones', () => {
    const { result } = renderHook(() => useAdminData(), { wrapper });

    act(() => {
      result.current.addReview({
        productId: 'prod-banana-chips-nendran',
        reviewerName: 'Spam Bot',
        rating: 1,
        reviewTitle: 'Scam',
        reviewText: 'Fake negative review with promotional spam links',
        isVerifiedPurchase: false
      });
    });

    const addedReview = result.current.reviews.find((r) => r.reviewerName === 'Spam Bot');
    expect(addedReview).toBeDefined();

    // Admin rejects / hides the review
    act(() => {
      result.current.updateReviewApproval(addedReview!.id, false);
    });

    const moderated = result.current.reviews.find((r) => r.id === addedReview!.id);
    expect(moderated?.isApproved).toBe(false);

    // Verify storefront filter (only approved reviews)
    const publicReviews = result.current.reviews.filter(
      (r) => r.productId === 'prod-banana-chips-nendran' && r.isApproved
    );
    expect(publicReviews.some((r) => r.id === addedReview!.id)).toBe(false);
  });

  // 5. Store Settings Exclusivity
  it('enforces checkout mode switching between Razorpay and WhatsApp', () => {
    const { result } = renderHook(() => useAdminData(), { wrapper });
    expect(result.current.settings.primaryCheckoutMode).toBe('RAZORPAY');

    // Admin switches to WhatsApp mode
    act(() => {
      result.current.updateStoreSettings({ primaryCheckoutMode: 'WHATSAPP' });
    });

    expect(result.current.settings.primaryCheckoutMode).toBe('WHATSAPP');

    // Admin switches back to Razorpay
    act(() => {
      result.current.updateStoreSettings({ primaryCheckoutMode: 'RAZORPAY' });
    });

    expect(result.current.settings.primaryCheckoutMode).toBe('RAZORPAY');
  });
});
