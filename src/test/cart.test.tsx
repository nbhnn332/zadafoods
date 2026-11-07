import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { CartProvider, useCart, DEMO_CART_ITEMS } from '../context/CartContext';
import { ToastProvider } from '../context/ToastContext';
import { INITIAL_PRODUCTS } from '../data/mockData';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    <CartProvider>{children}</CartProvider>
  </ToastProvider>
);

describe('Cart Context & Fresh Customer Initialization (Phase 6A)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes fresh customer visits with a completely empty cart and no coupon applied', () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toEqual([]);
    expect(result.current.totalUniqueItems).toBe(0);
    expect(result.current.totalItemUnits).toBe(0);
    expect(result.current.subtotal).toBe(0);
    expect(result.current.appliedCoupon).toBeNull();
    expect(result.current.couponDiscount).toBe(0);
    expect(result.current.deliveryCharge).toBe(0);
    expect(result.current.grandTotal).toBe(0);
  });

  it('restores legitimate returning customer cart from localStorage correctly', () => {
    // Seed localStorage with a legitimate returning customer's cart
    localStorage.setItem('zada_cart', JSON.stringify(DEMO_CART_ITEMS.slice(0, 2)));
    localStorage.setItem('zada_coupon', 'ZADA80');

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items.length).toBe(2);
    expect(result.current.items[0].productName).toBe('Banana Chips (Nendran)');
    expect(result.current.items[1].productName).toBe('Cashew Halwa');
    expect(result.current.appliedCoupon).toBe('ZADA80');
    expect(result.current.subtotal).toBe(710); // 2*180 + 1*350 = 360 + 350 = 710
  });

  it('adds items, updates quantity, and recalculates totals correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const product = INITIAL_PRODUCTS[0]; // Banana chips
    const variant = product.variants[1]; // 250g, 180 rs

    act(() => {
      result.current.addToCart(product, variant, 2);
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.subtotal).toBe(360);
    expect(result.current.deliveryCharge).toBe(40);
    expect(result.current.grandTotal).toBe(400);

    // Update quantity
    act(() => {
      result.current.updateQuantity(variant.id, 3);
    });
    expect(result.current.items[0].quantity).toBe(3);
    expect(result.current.subtotal).toBe(540);
  });

  it('applies and removes coupons accurately with minimum order threshold checks', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const product = INITIAL_PRODUCTS[0];
    const variant = product.variants[1]; // 250g, 180 rs

    // Add 1 unit (subtotal = 180, below ZADA80 threshold of 499)
    act(() => {
      result.current.addToCart(product, variant, 1);
    });

    let couponRes: any;
    act(() => {
      couponRes = result.current.applyCoupon('ZADA80');
    });
    expect(couponRes.success).toBe(false);
    expect(couponRes.message).toContain('minimum order of ₹499');
    expect(result.current.appliedCoupon).toBeNull();

    // Increase units to 3 (subtotal = 540 >= 499)
    act(() => {
      result.current.updateQuantity(variant.id, 3);
    });

    act(() => {
      couponRes = result.current.applyCoupon('ZADA80');
    });
    expect(couponRes.success).toBe(true);
    expect(result.current.appliedCoupon).toBe('ZADA80');
    expect(result.current.couponDiscount).toBe(80);
    expect(result.current.grandTotal).toBe(540 - 80 + 40); // 500

    // Remove coupon
    act(() => {
      result.current.removeCoupon();
    });
    expect(result.current.appliedCoupon).toBeNull();
    expect(result.current.couponDiscount).toBe(0);
  });

  it('removes item when quantity is decreased to 0 or removeFromCart is invoked', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const product = INITIAL_PRODUCTS[0];
    const variant = product.variants[0];

    act(() => {
      result.current.addToCart(product, variant, 1);
    });
    expect(result.current.items.length).toBe(1);

    act(() => {
      result.current.removeFromCart(variant.id);
    });
    expect(result.current.items.length).toBe(0);
    expect(result.current.subtotal).toBe(0);
    expect(result.current.grandTotal).toBe(0);
  });
});
