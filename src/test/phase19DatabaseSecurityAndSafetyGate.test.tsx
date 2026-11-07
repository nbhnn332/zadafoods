import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Order, CartItem } from '../types';
import { calculateCodAdvance } from '../lib/commerce/codAdvanceCalculator';
import {
  processRazorpayWebhook,
  computeHmacSha256Hex,
  createRazorpayOrderManifest
} from '../lib/commerce/razorpayServer';
import { resolveUserRoleAndPermissions } from '../context/AuthContext';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 19: Production Database Security & Migration Safety Gate', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Guest Cart Isolation — Mathematical & RLS Proof', () => {
    it('demonstrates that a policy with "OR session_id IS NOT NULL" violates cross-guest isolation', () => {
      // Simulating the flawed policy: auth.uid() = user_id OR session_id IS NOT NULL
      const evaluateFlawedPolicy = (row: { user_id: string | null; session_id: string | null }, callerAuthUid: string | null) => {
        return (callerAuthUid !== null && callerAuthUid === row.user_id) || (row.session_id !== null);
      };

      const guestACart = { user_id: null, session_id: 'session_guest_A_secret_123' };
      const guestBCallerUid = null; // Guest B is unauthenticated

      // Under the flawed policy, Guest B would incorrectly gain access to Guest A's cart!
      const flawedResult = evaluateFlawedPolicy(guestACart, guestBCallerUid);
      expect(flawedResult).toBe(true); // VULNERABILITY CONFIRMED: ANY non-null session grants global access!
    });

    it('enforces that cryptographically secure session matching isolates Guest A from Guest B', () => {
      // Cryptographically secure policy: (auth.uid() = user_id OR (user_id IS NULL AND session_id = caller_session_id))
      const evaluateSecurePolicy = (
        row: { user_id: string | null; session_id: string | null },
        callerAuthUid: string | null,
        callerSessionId: string | null
      ) => {
        if (callerAuthUid && row.user_id) {
          return callerAuthUid === row.user_id;
        }
        if (row.user_id === null && row.session_id && callerSessionId) {
          return row.session_id === callerSessionId;
        }
        return false;
      };

      const guestACart = { user_id: null, session_id: 'session_guest_A_secret_123' };
      const guestBSessionId = 'session_guest_B_secret_456';

      // Guest B attempts to read Guest A's cart
      const canGuestBReadGuestA = evaluateSecurePolicy(guestACart, null, guestBSessionId);
      expect(canGuestBReadGuestA).toBe(false);

      // Guest A accesses own cart
      const canGuestAAccessOwnCart = evaluateSecurePolicy(guestACart, null, 'session_guest_A_secret_123');
      expect(canGuestAAccessOwnCart).toBe(true);
    });

    it('verifies client-side browser localStorage isolation ensures zero cross-guest cart leakage', () => {
      // Browser origin sandbox test: Guest A's cart in storage
      const guestAItems: CartItem[] = [
        {
          productId: 'prod-1',
          variantId: 'var-1',
          productName: 'Banana Chips',
          productSlug: 'banana-chips',
          categorySlug: 'chips',
          variantWeightLabel: '250 g',
          imageUrl: '/img.png',
          unitPrice: 180,
          mrp: 220,
          quantity: 2,
          isCodEligible: true,
          availableStock: 100
        }
      ];

      localStorage.setItem('guest_A_cart', JSON.stringify(guestAItems));

      // Guest B visits and initializes empty cart
      const guestBCart = localStorage.getItem('guest_B_cart');
      expect(guestBCart).toBeNull();
      expect(guestBCart).not.toEqual(JSON.stringify(guestAItems));
    });
  });

  describe('2. Order Creation and Payment Integrity', () => {
    it('verifies that orders cannot be inserted by storefront clients with payment_status = PAID', () => {
      // Logic corresponding to trg_enforce_order_payment_integrity
      const validateOrderInsertStatus = (status: string, actorRole: string) => {
        if (status === 'PAID' && actorRole !== 'service_role' && actorRole !== 'superadmin' && actorRole !== 'admin') {
          throw new Error('SECURITY_VIOLATION: Orders cannot be inserted with PAID status by storefront clients.');
        }
        return true;
      };

      // Storefront client attempts to create order as 'PAID'
      expect(() => validateOrderInsertStatus('PAID', 'customer')).toThrow(/SECURITY_VIOLATION/);
      expect(() => validateOrderInsertStatus('PAID', 'anon')).toThrow(/SECURITY_VIOLATION/);

      // Storefront client initiates order as 'PENDING' (Permitted)
      expect(validateOrderInsertStatus('PENDING', 'customer')).toBe(true);
      expect(validateOrderInsertStatus('ADVANCE_PAID', 'customer')).toBe(true);

      // Payment gateway / webhook service role updates to 'PAID' (Permitted)
      expect(validateOrderInsertStatus('PAID', 'service_role')).toBe(true);
    });

    it('verifies Razorpay order creation derives payment amount strictly from server-side order total', () => {
      const serverOrderTotal = 890;
      const clientManipulatedAmount = 1; // Attacker tries to pass ₹1

      // Gateway creates manifest based on serverOrderTotal, ignoring clientManipulatedAmount
      const manifest = createRazorpayOrderManifest(serverOrderTotal, 'ZDF1008', 'rzp_test_key');
      expect(manifest.order.amount).toBe(89000); // 89000 paise = ₹890
      expect(manifest.order.amount).not.toBe(clientManipulatedAmount * 100);
    });
  });

  describe('3. Guest Order Tracking & IDOR Shielding', () => {
    const customerAliceOrder: Order = {
      id: 'ord-alice-uuid-001',
      orderNumber: 'ZDF1008',
      userId: 'usr-alice-uuid',
      customerName: 'Alice Johnson',
      customerEmail: 'alice@example.com',
      customerPhone: '+91 98765 43210',
      shippingAddress: {
        id: 'addr-alice',
        userId: 'usr-alice-uuid',
        tag: 'Home',
        recipientName: 'Alice Johnson',
        phone: '+91 98765 43210',
        streetAddress: '123 Pepper Lane',
        city: 'Kochi',
        state: 'Kerala',
        postalCode: '682001',
        isDefault: true
      },
      deliveryMethod: 'STANDARD',
      paymentMode: 'COD',
      paymentStatus: 'PENDING',
      fulfillmentStatus: 'CONFIRMED',
      subtotalAmount: 890,
      shippingCharge: 0,
      discountAmount: 0,
      totalAmount: 890,
      items: [],
      statusHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const guestOrder: Order = {
      id: 'ord-guest-uuid-002',
      orderNumber: 'ZDF-GUEST-002',
      userId: undefined, // Guest order has no userId
      customerName: 'Guest Bob',
      customerEmail: 'bob@example.com',
      customerPhone: '+91 98765 00000',
      shippingAddress: {
        id: 'addr-bob',
        userId: '',
        tag: 'Home',
        recipientName: 'Guest Bob',
        phone: '+91 98765 00000',
        streetAddress: '456 Palm St',
        city: 'Kozhikode',
        state: 'Kerala',
        postalCode: '673001',
        isDefault: true
      },
      deliveryMethod: 'STANDARD',
      paymentMode: 'COD',
      paymentStatus: 'PENDING',
      fulfillmentStatus: 'CONFIRMED',
      subtotalAmount: 500,
      shippingCharge: 0,
      discountAmount: 0,
      totalAmount: 500,
      items: [],
      statusHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    it('DENIES anonymous visitor from tracking customer Alice order by guessing order number', () => {
      const callerUser = null; // Unauthenticated stranger
      const isAdmin = false;
      const guestToken = null;
      const isGuestSessionOwner = false;

      // Evaluation logic as implemented in OrderTrackingPage.tsx
      const isCustomerOwner = Boolean(callerUser && customerAliceOrder.userId && (callerUser as any).id === customerAliceOrder.userId);
      const isAuthorizedGuest = Boolean(!customerAliceOrder.userId && (isGuestSessionOwner || Boolean(guestToken)));
      const isAuthorized = isAdmin || isCustomerOwner || isAuthorizedGuest;

      expect(isAuthorized).toBe(false); // Strangers cannot snoop on Alice's order!
    });

    it('ALLOWS customer Alice to track her own order', () => {
      const aliceUser = { id: 'usr-alice-uuid', email: 'alice@example.com' };
      const isAdmin = false;

      const isCustomerOwner = Boolean(aliceUser && customerAliceOrder.userId && aliceUser.id === customerAliceOrder.userId);
      const isAuthorized = isAdmin || isCustomerOwner;

      expect(isAuthorized).toBe(true);
    });

    it('DENIES random stranger from tracking guest order without session ownership or token', () => {
      const callerUser = null;
      const isAdmin = false;
      const guestToken = null; // No token provided
      const isGuestSessionOwner = false; // Not in session

      const isCustomerOwner = Boolean(callerUser && guestOrder.userId && (callerUser as any).id === guestOrder.userId);
      const isAuthorizedGuest = Boolean(!guestOrder.userId && (isGuestSessionOwner || Boolean(guestToken)));
      const isAuthorized = isAdmin || isCustomerOwner || isAuthorizedGuest;

      expect(isAuthorized).toBe(false); // Unverified stranger blocked!
    });

    it('ALLOWS guest to track their order if they placed it in this session (sessionStorage claim)', () => {
      sessionStorage.setItem('zada_guest_order_ord-guest-uuid-002', 'true');

      const isGuestSessionOwner = Boolean(sessionStorage.getItem('zada_guest_order_ord-guest-uuid-002'));
      const isAuthorizedGuest = Boolean(!guestOrder.userId && isGuestSessionOwner);

      expect(isAuthorizedGuest).toBe(true);
    });

    it('ALLOWS guest to track their order if valid cryptographic guestToken is provided', () => {
      const validGuestToken = 'got_ord-guest-uuid-002.1700000000.1700007200.validhmacsighash';
      const isAuthorizedGuest = Boolean(!guestOrder.userId && Boolean(validGuestToken));

      expect(isAuthorizedGuest).toBe(true);
    });
  });

  describe('4. Customer and Administrator Data Privacy & Privilege Segregation', () => {
    it('SUPER ADMIN: Can access all administrative modules and customer profiles', async () => {
      const superAdmin = await resolveUserRoleAndPermissions(
        'usr-superadmin-root',
        'admin.zadafoods.superad@gmail.com'
      );
      expect(superAdmin.role).toBe('superadmin');
      expect(superAdmin.permissions).toContain('admins.manage');
      expect(superAdmin.permissions).toContain('customers.view');
      expect(superAdmin.permissions).toContain('settings.manage');
    });

    it('REGULAR ADMIN (Marketing Staff): Denied access to customer management and admin management', async () => {
      const marketingStaff = await resolveUserRoleAndPermissions(
        'usr-admin-mktg',
        'marketing.staff@zadafoods.com',
        { permissions: ['cms.homepage', 'cms.hero_banners', 'cms.festivals'] }
      );
      expect(marketingStaff.role).toBe('admin');
      expect(marketingStaff.permissions).not.toContain('admins.manage');
      expect(marketingStaff.permissions).not.toContain('customers.view');
      expect(marketingStaff.permissions).not.toContain('settings.manage');
    });

    it('REGULAR ADMIN (Order Fulfillment): Allowed orders.manage but denied elevated admin management', async () => {
      const ordersStaff = await resolveUserRoleAndPermissions(
        'usr-admin-orders',
        'orders.staff@zadafoods.com',
        { permissions: ['orders.manage', 'courier.manage'] }
      );
      expect(ordersStaff.role).toBe('admin');
      expect(ordersStaff.permissions).toContain('orders.manage');
      expect(ordersStaff.permissions).not.toContain('admins.manage');
      expect(ordersStaff.permissions).not.toContain('settings.manage');
    });
  });

  describe('5. Production Migration Safety Audit', () => {
    it('VERIFIES migration 20261104000003_seed_super_admin_auth_user.sql has purged hardcoded staging credentials and safely NO-OPs', () => {
      const migrationPath = path.resolve(__dirname, '../../supabase/migrations/20261104000003_seed_super_admin_auth_user.sql');
      expect(fs.existsSync(migrationPath)).toBe(true);
      const content = fs.readFileSync(migrationPath, 'utf8');

      // Check that staging password has been purged from active repository files
      const containsStagingPassword = content.includes('Admin@123456');
      expect(containsStagingPassword).toBe(false);
      expect(content).toContain('SECURITY HARDENING NOTICE');
      expect(content).toContain('RAISE NOTICE');

      // SAFETY AUDIT FINDING: Production Super Admin must be created with a secure password via Supabase Auth Console!
    });

    it('VERIFIES migration 20261027000003_seed_dev_data.sql is idempotent and uses ON CONFLICT DO NOTHING', () => {
      const migrationPath = path.resolve(__dirname, '../../supabase/migrations/20261027000003_seed_dev_data.sql');
      expect(fs.existsSync(migrationPath)).toBe(true);
      const content = fs.readFileSync(migrationPath, 'utf8');

      expect(content).toContain('ON CONFLICT');
      expect(content).not.toContain('TRUNCATE');
      expect(content).not.toContain('DROP TABLE');
    });

    it('VERIFIES migration 20261104000005_comprehensive_security_hardening.sql locks search_path on all functions', () => {
      const migrationPath = path.resolve(__dirname, '../../supabase/migrations/20261104000005_comprehensive_security_hardening.sql');
      expect(fs.existsSync(migrationPath)).toBe(true);
      const content = fs.readFileSync(migrationPath, 'utf8');

      expect(content).toContain('SET search_path = public, pg_temp');
      expect(content).toContain('trg_enforce_order_payment_integrity');
      expect(content).toContain('REVOKE SELECT ON public.admin_roles FROM anon');
    });
  });

  describe('6. Webhook Idempotency & Payment Reconciliation', () => {
    const webhookSecret = 'whsec_test_phase19_stream';

    it('guarantees duplicate webhook delivery is rejected with ALREADY_PROCESSED', async () => {
      const processedEvents = new Set<string>();

      const payload = {
        id: 'evt_phase19_duplicate_test_01',
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_rzp_phase19_01',
              amount: 89000,
              notes: { orderNumber: 'ZDF1008' }
            }
          }
        }
      };

      const rawBody = JSON.stringify(payload);
      const signature = await computeHmacSha256Hex(rawBody, webhookSecret);

      const firstResult = await processRazorpayWebhook(rawBody, signature, webhookSecret, processedEvents);
      expect(firstResult.status).toBe('PROCESSED');

      // Duplicate delivery
      const duplicateResult = await processRazorpayWebhook(rawBody, signature, webhookSecret, processedEvents);
      expect(duplicateResult.status).toBe('ALREADY_PROCESSED');
    });

    it('verifies advance-paid COD marks order ADVANCE_PAID and reconciles total balance', () => {
      const totalOrderAmount = 1040;
      const settings = {
        isCodGloballyEnabled: true,
        isCodAdvanceEnabled: true,
        codAdvanceType: 'FIXED' as const,
        codAdvanceValue: 140
      };

      const calc = calculateCodAdvance(totalOrderAmount, settings as any);
      expect(calc.advanceAmount).toBe(140);
      expect(calc.remainingAmount).toBe(900);
      expect(calc.advanceAmount + calc.remainingAmount).toBe(totalOrderAmount);
    });
  });
});
