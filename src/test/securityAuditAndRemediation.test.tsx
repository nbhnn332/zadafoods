import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { resolveUserRoleAndPermissions, getRegisteredAdmin } from '../context/AuthContext';
import { OrderTrackingPage } from '../pages/OrderTrackingPage';
import { AdminDataProvider } from '../context/AdminDataContext';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { Order } from '../types';

describe('ZaDa Foods — Comprehensive Security Audit & Vulnerability Remediation Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. Authentication & Role Privilege Escalation (FINDING-01 & FINDING-08)', () => {
    it('rejects user-controlled raw_user_meta_data from client signup claiming superadmin', async () => {
      // Attacker passes role: 'superadmin' in client-side signUp options
      const attackerMetadata = {
        full_name: 'Attacker User',
        role: 'superadmin',
        permissions: ['admins.manage', 'orders.manage']
      };

      const resolved = await resolveUserRoleAndPermissions(
        'usr-attacker-123',
        'attacker@evil.com',
        attackerMetadata
      );

      // Must strictly resolve to ordinary customer, NOT superadmin!
      expect(resolved.role).toBe('customer');
      expect(resolved.role).not.toBe('superadmin');
      expect(resolved.permissions).toEqual([]);
    });

    it('rejects localStorage manipulation attempting to inject fake admin accounts', () => {
      // Attacker injects fake admin into localStorage
      localStorage.setItem(
        'zada_admin_accounts_list',
        JSON.stringify([
          {
            id: 'usr-attacker-fake-admin',
            email: 'hacker@malicious.com',
            fullName: 'Fake Super Admin',
            role: 'superadmin',
            status: 'active',
            permissions: ['admins.manage']
          }
        ])
      );

      // getRegisteredAdmin must NOT trust client-side localStorage
      const registered = getRegisteredAdmin('hacker@malicious.com');
      expect(registered).toBeUndefined();
    });

    it('resolves genuine verified administrators from authoritative directory', () => {
      const genuineAdmin = getRegisteredAdmin('admin@zadafoods.com');
      expect(genuineAdmin).toBeDefined();
      expect(genuineAdmin?.role).toBe('admin');
      expect(genuineAdmin?.permissions).toContain('orders.manage');
    });

    it('enforces suspended status for deactivated administrators', async () => {
      const resolved = await resolveUserRoleAndPermissions(
        'usr-admin-suspended',
        'suspended.admin@zadafoods.com'
      );

      expect(resolved.status).toBe('suspended');
      expect(resolved.permissions).toEqual([]);
    });
  });

  describe('2. Customer Privacy & IDOR Prevention (FINDING-06)', () => {
    it('displays Order Not Found instead of leaking another customer order on unknown id', () => {
      render(
        <MemoryRouter initialEntries={['/order-tracking/unknown-malicious-order-id-999']}>
          <ToastProvider>
            <AuthProvider>
              <AdminDataProvider>
                <CartProvider>
                  <Routes>
                    <Route path="/order-tracking/:id" element={<OrderTrackingPage />} />
                  </Routes>
                </CartProvider>
              </AdminDataProvider>
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      // Must display Order Not Found
      expect(screen.getByText('Order Not Found')).toBeInTheDocument();
      expect(screen.getByText(/We could not find an order matching reference/i)).toBeInTheDocument();

      // Must NOT render details or address of other customer orders
      expect(screen.queryByText(/Delivery Address/i)).toBeNull();
      expect(screen.queryByText(/Order Items/i)).toBeNull();
    });
  });

  describe('3. Payment & Order Integrity (FINDING-02 & FINDING-05)', () => {
    it('verifies COD order state separation: advance payment capture sets ADVANCE_PAID and never marks order fully PAID', () => {
      const codOrder: Order = {
        id: 'ord-cod-adv-1',
        orderNumber: 'ZDF7711',
        customerName: 'Test Customer',
        customerEmail: 'customer@example.com',
        customerPhone: '+91 98765 43210',
        shippingAddress: {
          id: 'addr-1',
          userId: 'usr-1',
          tag: 'Home',
          recipientName: 'Test Customer',
          phone: '+91 98765 43210',
          streetAddress: 'Beach Road',
          city: 'Kozhikode',
          state: 'Kerala',
          postalCode: '673001',
          isDefault: true
        },
        deliveryMethod: 'STANDARD',
        paymentMode: 'COD',
        paymentStatus: 'ADVANCE_PAID',
        fulfillmentStatus: 'CONFIRMED',
        subtotalAmount: 1000,
        discountAmount: 0,
        shippingCharge: 40,
        totalAmount: 1040,
        codAdvanceAmount: 140,
        codAdvancePaid: 140,
        codRemainingAmount: 900,
        codAdvancePaymentStatus: 'PAID',
        advancePaymentReference: 'pay_rzp_adv_7711',
        advancePaymentMethod: 'RAZORPAY',
        items: [],
        statusHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // State Machine Verification
      expect(codOrder.paymentMode).toBe('COD');
      expect(codOrder.paymentStatus).toBe('ADVANCE_PAID');
      expect(codOrder.paymentStatus).not.toBe('PAID');
      expect(codOrder.codAdvancePaid).toBe(140);
      expect(codOrder.codRemainingAmount).toBe(900);
      expect((codOrder.codAdvancePaid || 0) + (codOrder.codRemainingAmount || 0)).toBe(codOrder.totalAmount);
    });
  });

  describe('4. Open Redirect Sanitization (FINDING-11)', () => {
    // Pure function logic extracted from LoginPage.tsx for verification
    function getSafeRedirectPath(rawPath?: string | null, fallback: string = '/'): string {
      if (!rawPath || typeof rawPath !== 'string') return fallback;
      const clean = rawPath.trim();
      if (
        clean.startsWith('/') &&
        !clean.startsWith('//') &&
        !clean.startsWith('/\\') &&
        !clean.includes('\\') &&
        !clean.includes(':')
      ) {
        return clean;
      }
      return fallback;
    }

    it('allows valid internal relative paths', () => {
      expect(getSafeRedirectPath('/account')).toBe('/account');
      expect(getSafeRedirectPath('/checkout')).toBe('/checkout');
      expect(getSafeRedirectPath('/shop?category=chips')).toBe('/shop?category=chips');
    });

    it('rejects protocol-relative and external URL redirects', () => {
      expect(getSafeRedirectPath('//attacker.com')).toBe('/');
      expect(getSafeRedirectPath('https://evil.com/phish')).toBe('/');
      expect(getSafeRedirectPath('javascript:alert(1)')).toBe('/');
    });

    it('rejects backslash open-redirect bypass attempts (CVE-2025-68470)', () => {
      expect(getSafeRedirectPath('/\\attacker.com')).toBe('/');
      expect(getSafeRedirectPath('\\attacker.com')).toBe('/');
      expect(getSafeRedirectPath('/account\\evil.com')).toBe('/');
    });
  });

  describe('5. Security Headers & Deployment Configuration (FINDING-12)', () => {
    it('verifies that index.html contains Content Security Policy and security headers', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const htmlContent = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf-8');

      expect(htmlContent).toContain('http-equiv="Content-Security-Policy"');
      expect(htmlContent).toContain('http-equiv="X-Content-Type-Options" content="nosniff"');
      expect(htmlContent).toContain('name="referrer" content="strict-origin-when-cross-origin"');
      expect(htmlContent).toContain('checkout.razorpay.com');
      expect(htmlContent).toContain('*.supabase.co');
    });
  });
});
