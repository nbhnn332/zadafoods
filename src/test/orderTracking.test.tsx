import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AdminDataProvider, useAdminData } from '../context/AdminDataContext';
import { ToastProvider } from '../context/ToastContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    <AdminDataProvider>{children}</AdminDataProvider>
  </ToastProvider>
);

describe('Order Operations & Manual Tracking Controller (Decision #3)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads the initial order #ZDF1008 matching Screen 6', () => {
    const { result } = renderHook(() => useAdminData(), { wrapper });
    const order = result.current.orders.find((o) => o.orderNumber === 'ZDF1008');
    expect(order).toBeDefined();
    expect(order?.fulfillmentStatus).toBe('CONFIRMED');
    expect(order?.totalAmount).toBe(890);
  });

  it('manually advances order from CONFIRMED to PACKED', () => {
    const { result } = renderHook(() => useAdminData(), { wrapper });
    const order = result.current.orders[0];

    act(() => {
      result.current.updateOrderStatus(order.id, 'PACKED', undefined, undefined, 'Packaging completed.');
    });

    const updated = result.current.orders.find((o) => o.id === order.id);
    expect(updated?.fulfillmentStatus).toBe('PACKED');
    expect(updated?.adminNotes).toBe('Packaging completed.');
    expect(updated?.statusHistory[0].status).toBe('PACKED');
  });

  it('manually advances order to SHIPPED with courier partner and AWB', () => {
    const { result } = renderHook(() => useAdminData(), { wrapper });
    const order = result.current.orders[0];

    act(() => {
      result.current.updateOrderStatus(
        order.id,
        'SHIPPED',
        'DTDC Express',
        'DTDC99881122',
        'Dispatched from Kozhikode hub.'
      );
    });

    const updated = result.current.orders.find((o) => o.id === order.id);
    expect(updated?.fulfillmentStatus).toBe('SHIPPED');
    expect(updated?.courierName).toBe('DTDC Express');
    expect(updated?.trackingNumber).toBe('DTDC99881122');
  });

  it('updates stock quantity in real-time', () => {
    const { result } = renderHook(() => useAdminData(), { wrapper });
    const firstVariant = result.current.products[0].variants[0];

    act(() => {
      result.current.updateProductStock(firstVariant.id, 999);
    });

    const updatedProduct = result.current.products[0];
    const updatedVar = updatedProduct.variants.find((v) => v.id === firstVariant.id);
    expect(updatedVar?.stockQuantity).toBe(999);
  });
});
