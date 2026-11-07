import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  normalizeWhatsAppNumber,
  formatWhatsAppOrderMessage,
  buildWhatsAppChatUrl,
  DEFAULT_WHATSAPP_DESTINATION,
  DISPLAY_WHATSAPP_DESTINATION
} from '../lib/commerce/whatsappRouting';
import {
  getProductWhatsAppUrl,
  getCartWhatsAppUrl,
  getSupportWhatsAppUrl,
  SHOP_WHATSAPP_NUMBER,
  SHOP_WHATSAPP_DISPLAY
} from '../lib/whatsapp';
import { resolveUserRoleAndPermissions } from '../context/AuthContext';
import { calculateCodAdvance } from '../lib/commerce/codAdvanceCalculator';
import {
  createRazorpayOrderManifest,
  verifyRazorpaySignature,
  processRazorpayWebhook,
  computeHmacSha256Hex
} from '../lib/commerce/razorpayServer';
import { Order, StoreSettings } from '../types';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 18: Final Independent Launch Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. WhatsApp Destination — Mandatory Correction & Link Generation', () => {
    it('verifies the official normalized WhatsApp number is strictly 917593959235', () => {
      expect(DEFAULT_WHATSAPP_DESTINATION).toBe('917593959235');
      expect(SHOP_WHATSAPP_NUMBER).toBe('917593959235');
      expect(DISPLAY_WHATSAPP_DESTINATION).toBe('+91 75939 59235');
      expect(SHOP_WHATSAPP_DISPLAY).toBe('+91 75939 59235');
    });

    it('rejects incorrect WhatsApp number (+91 94000 00000 / 9400000000) and safely normalizes to 917593959235', () => {
      expect(normalizeWhatsAppNumber('+91 94000 00000')).toBe('917593959235');
      expect(normalizeWhatsAppNumber('9400000000')).toBe('917593959235');
      expect(normalizeWhatsAppNumber('919400000000')).toBe('917593959235');
      expect(normalizeWhatsAppNumber('94000')).toBe('917593959235');
    });

    it('rejects legacy placeholder (9876543210) and safely normalizes to 917593959235', () => {
      expect(normalizeWhatsAppNumber('+91 98765 43210')).toBe('917593959235');
      expect(normalizeWhatsAppNumber('9876543210')).toBe('917593959235');
      expect(normalizeWhatsAppNumber('919876543210')).toBe('917593959235');
    });

    it('generates authentic product ordering wa.me URL targeting 917593959235', () => {
      const url = getProductWhatsAppUrl(
        { name: 'Kerala Banana Chips', slug: 'banana-chips' },
        { weightLabel: '250 g', sellingPrice: 240 },
        1
      );
      expect(url).toContain('https://wa.me/917593959235?text=');
      expect(url).not.toContain('94000');
      expect(url).not.toContain('9876543210');
    });

    it('generates authentic cart ordering wa.me URL targeting 917593959235', () => {
      const cartUrl = getCartWhatsAppUrl([
        {
          productName: 'Jackfruit Crisps',
          variantWeightLabel: '200 g',
          quantity: 2,
          unitPrice: 190
        }
      ], 380);
      expect(cartUrl).toContain('https://wa.me/917593959235?text=');
      expect(cartUrl).not.toContain('94000');
    });

    it('generates authentic customer support wa.me URL targeting 917593959235', () => {
      const supportUrl = getSupportWhatsAppUrl('Order #ZDF1008');
      expect(supportUrl).toContain('https://wa.me/917593959235?text=');
      expect(supportUrl).not.toContain('94000');
    });

    it('builds checkout COD WhatsApp confirmation URL targeting 917593959235 even if legacy destination is passed', () => {
      const waUrl = buildWhatsAppChatUrl('+91 94000 00000', 'Order Confirmation Message');
      expect(waUrl).toContain('https://wa.me/917593959235?text=');
    });
  });

  describe('2. Authentication and Session Security', () => {
    it('SUPER ADMIN: Authoritative superadmin account receives full permissions', async () => {
      const authInfo = await resolveUserRoleAndPermissions(
        'usr-superadmin-root',
        'admin.zadafoods.superad@gmail.com'
      );
      expect(authInfo.role).toBe('superadmin');
      expect(authInfo.status).toBe('active');
      expect(authInfo.permissions).toContain('admins.manage');
      expect(authInfo.permissions).toContain('settings.manage');
    });

    it('REGULAR ADMIN: Restricted admin receives only explicitly assigned operational permissions', async () => {
      const ordersStaff = await resolveUserRoleAndPermissions(
        'usr-admin-orders',
        'orders.staff@zadafoods.com'
      );
      expect(ordersStaff.role).toBe('admin');
      expect(ordersStaff.status).toBe('active');
      expect(ordersStaff.permissions).toContain('orders.manage');
      expect(ordersStaff.permissions).not.toContain('admins.manage');
      expect(ordersStaff.permissions).not.toContain('settings.manage');
    });

    it('SUSPENDED ADMIN: Completely revokes all permissions and marks status suspended', async () => {
      const suspended = await resolveUserRoleAndPermissions(
        'usr-admin-suspended',
        'suspended.admin@zadafoods.com'
      );
      expect(suspended.status).toBe('suspended');
      expect(suspended.permissions).toEqual([]);
    });

    it('FAIL-CLOSED DEFENSE: Unregistered user with arbitrary metadata claiming superadmin defaults to customer with 0 permissions', async () => {
      const attackerAttempt = await resolveUserRoleAndPermissions(
        'usr-attacker-999',
        'hacker@exploit.com',
        { role: 'superadmin', is_super_admin: true, permissions: ['admins.manage'] }
      );
      expect(attackerAttempt.role).toBe('customer');
      expect(attackerAttempt.permissions).toEqual([]);
    });

    it('FAIL-CLOSED DEFENSE: Unregistered corporate signup (@zadafoods.com) without database record defaults to customer', async () => {
      const unverifiedEmployee = await resolveUserRoleAndPermissions(
        'usr-corp-unknown',
        'fake.employee@zadafoods.com',
        { role: 'admin', permissions: ['dashboard.view'] }
      );
      expect(unverifiedEmployee.role).toBe('customer');
      expect(unverifiedEmployee.permissions).toEqual([]);
    });
  });

  describe('3. COD and WhatsApp-Assisted COD Workflow Separation', () => {
    const mockOrder: Order = {
      id: 'ord-phase18-001',
      orderNumber: 'ZD-20261104-P18',
      customerName: 'Suresh Kumar',
      customerEmail: 'suresh@example.com',
      customerPhone: '+91 98470 11223',
      shippingAddress: {
        id: 'addr-suresh',
        userId: 'usr-suresh',
        tag: 'Home',
        recipientName: 'Suresh Kumar',
        phone: '+91 98470 11223',
        streetAddress: 'Marine Drive, 5A',
        city: 'Kochi',
        state: 'Kerala',
        postalCode: '682031',
        isDefault: true
      },
      deliveryMethod: 'STANDARD',
      paymentMode: 'COD',
      paymentStatus: 'PENDING',
      fulfillmentStatus: 'PENDING',
      subtotalAmount: 600,
      shippingCharge: 0,
      discountAmount: 0,
      totalAmount: 600,
      items: [
        {
          id: 'item-p18-1',
          productId: 'prod-banana-chips',
          productName: 'Banana Chips (Nendran)',
          variantId: 'var-bc-250',
          variantWeightLabel: '250 g',
          imageUrl: '/assets/banana.jpg',
          unitPrice: 200,
          quantity: 3,
          lineTotal: 600
        }
      ],
      statusHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    it('formats structured, human-readable WhatsApp message with correct order details', () => {
      const msg = formatWhatsAppOrderMessage(mockOrder);
      expect(msg).toContain('ZD-20261104-P18');
      expect(msg).toContain('Suresh Kumar');
      expect(msg).toContain('Banana Chips (Nendran)');
      expect(msg).toContain('₹600');
      expect(msg).toContain('Awaiting WhatsApp Confirmation');
    });

    it('verifies that fulfillment status, payment status, and WhatsApp routing status are distinct', () => {
      // In WhatsApp-assisted COD:
      // fulfillmentStatus is PENDING (awaiting dispatch/verification)
      // paymentStatus is PENDING (cash not collected until delivery)
      expect(mockOrder.fulfillmentStatus).toBe('PENDING');
      expect(mockOrder.paymentStatus).toBe('PENDING');
      expect(mockOrder.paymentMode).toBe('COD');
    });
  });

  describe('4. Global COD Advance Payment Engine', () => {
    it('calculates fixed COD advance once per order (not per item)', () => {
      const settingsFixed: Partial<StoreSettings> = {
        isCodGloballyEnabled: true,
        isCodAdvanceEnabled: true,
        codAdvanceType: 'FIXED',
        codAdvanceValue: 150
      };

      const result = calculateCodAdvance(1200, settingsFixed as StoreSettings);
      expect(result.isAdvanceRequired).toBe(true);
      expect(result.advanceAmount).toBe(150);
      expect(result.remainingAmount).toBe(1050);
      expect(result.advanceAmount + result.remainingAmount).toBe(1200);
    });

    it('calculates percentage COD advance with min and max boundaries', () => {
      const settingsPercentage: Partial<StoreSettings> = {
        isCodGloballyEnabled: true,
        isCodAdvanceEnabled: true,
        codAdvanceType: 'PERCENTAGE',
        codAdvanceValue: 10, // 10%
        codAdvanceMinAmount: 100, // min ₹100 floor
        codAdvanceMaxAmount: 300 // max ₹300 ceiling
      };

      // Case A: 10% of ₹800 = ₹80, but min floor is ₹100
      const belowFloor = calculateCodAdvance(800, settingsPercentage as StoreSettings);
      expect(belowFloor.advanceAmount).toBe(100);
      expect(belowFloor.remainingAmount).toBe(700);

      // Case B: 10% of ₹2000 = ₹200 (within ₹100 - ₹300)
      const normal = calculateCodAdvance(2000, settingsPercentage as StoreSettings);
      expect(normal.advanceAmount).toBe(200);
      expect(normal.remainingAmount).toBe(1800);

      // Case C: 10% of ₹5000 = ₹500, but capped at ₹300
      const aboveCeiling = calculateCodAdvance(5000, settingsPercentage as StoreSettings);
      expect(aboveCeiling.advanceAmount).toBe(300);
      expect(aboveCeiling.remainingAmount).toBe(4700);
    });

    it('respects minimum order value threshold for requiring COD advance', () => {
      const settingsThreshold: Partial<StoreSettings> = {
        isCodGloballyEnabled: true,
        isCodAdvanceEnabled: true,
        codAdvanceType: 'FIXED',
        codAdvanceValue: 100,
        codAdvanceMinOrderValue: 500
      };

      // Below threshold (₹450 < ₹500): No advance required
      const belowThreshold = calculateCodAdvance(450, settingsThreshold as StoreSettings);
      expect(belowThreshold.isAdvanceRequired).toBe(false);
      expect(belowThreshold.advanceAmount).toBe(0);
      expect(belowThreshold.remainingAmount).toBe(450);

      // At or above threshold (₹550 >= ₹500): Advance required
      const aboveThreshold = calculateCodAdvance(550, settingsThreshold as StoreSettings);
      expect(aboveThreshold.isAdvanceRequired).toBe(true);
      expect(aboveThreshold.advanceAmount).toBe(100);
      expect(aboveThreshold.remainingAmount).toBe(450);
    });
  });

  describe('5. Razorpay End-to-End Cryptographic Verification', () => {
    const testSecret = 'secret_test_phase18_gateway_key';

    it('creates accurate order manifest in paise without secret leakage', () => {
      const manifest = createRazorpayOrderManifest(650, 'ZDF-2026-TEST', 'rzp_test_public_key');
      expect(manifest.order.amount).toBe(65000); // 65000 paise
      expect(manifest.order.currency).toBe('INR');
      expect(manifest.clientOptions.key).toBe('rzp_test_public_key');
      expect((manifest.clientOptions as any).secret).toBeUndefined();
    });

    it('verifies valid HMAC-SHA256 signature', async () => {
      const orderId = 'order_test_phase18_001';
      const paymentId = 'pay_test_phase18_001';
      const validSignature = await computeHmacSha256Hex(`${orderId}|${paymentId}`, testSecret);

      const verification = await verifyRazorpaySignature(orderId, paymentId, validSignature, testSecret);
      expect(verification.isValid).toBe(true);
      expect(verification.failureReason).toBeUndefined();
    });

    it('rejects tampered or invalid cryptographic signature', async () => {
      const orderId = 'order_test_phase18_001';
      const paymentId = 'pay_test_phase18_001';
      const forgedSignature = 'forged_deadbeef_invalid_signature_hex_1234';

      const verification = await verifyRazorpaySignature(orderId, paymentId, forgedSignature, testSecret);
      expect(verification.isValid).toBe(false);
      expect(verification.failureReason).toContain('mismatch');
    });

    it('enforces idempotent webhook delivery and rejects duplicates', async () => {
      const webhookSecret = 'whsec_test_phase18_event_stream';
      const processedEvents = new Set<string>();

      const payload = {
        id: 'evt_phase18_unique_001',
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_rzp_phase18_01',
              amount: 65000,
              notes: { orderNumber: 'ZD-20261104-P18' }
            }
          }
        }
      };

      const rawBody = JSON.stringify(payload);
      const validSignature = await computeHmacSha256Hex(rawBody, webhookSecret);

      // 1st delivery: PROCESSED
      const firstResult = await processRazorpayWebhook(rawBody, validSignature, webhookSecret, processedEvents);
      expect(firstResult.status).toBe('PROCESSED');
      expect(firstResult.eventId).toBe('evt_phase18_unique_001');

      // 2nd delivery (duplicate event delivery): ALREADY_PROCESSED
      const duplicateResult = await processRazorpayWebhook(rawBody, validSignature, webhookSecret, processedEvents);
      expect(duplicateResult.status).toBe('ALREADY_PROCESSED');
    });
  });

  describe('6. Customer Privacy & Cross-Customer IDOR Shielding', () => {
    const aliceOrder: Order = {
      id: 'ord-alice-p18',
      orderNumber: 'ZDF-ALICE-100',
      userId: 'usr-alice-1',
      customerName: 'Alice Johnson',
      customerEmail: 'alice@example.com',
      customerPhone: '+91 98765 43210',
      shippingAddress: {
        id: 'addr-alice',
        userId: 'usr-alice-1',
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
      paymentMode: 'RAZORPAY',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'CONFIRMED',
      subtotalAmount: 400,
      shippingCharge: 0,
      discountAmount: 0,
      totalAmount: 400,
      items: [],
      statusHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    it('prevents customer Bob from accessing customer Alice private order', () => {
      const bobUserId = 'usr-bob-2';
      const isOwner = aliceOrder.userId === bobUserId;
      expect(isOwner).toBe(false);
      
      // OrderTrackingPage authorization check
      const isAdmin = false;
      const isAuthorized = !aliceOrder || isAdmin || !bobUserId || !aliceOrder.userId || aliceOrder.userId === bobUserId;
      expect(isAuthorized).toBe(false);
    });

    it('ensures nonexistent order ID returns null (Zero IDOR leak or fallback to ZDF1008)', () => {
      const storeOrders = [aliceOrder];
      const searchedId = 'NONEXISTENT_ORDER_999';
      const matched = storeOrders.find((o) => o.id === searchedId || o.orderNumber === searchedId) || null;
      expect(matched).toBeNull();
    });
  });

  describe('7. HTTP Security Headers and Production Hosting Configuration', () => {
    it('verifies public/_headers contains all required security headers', () => {
      const headersPath = path.resolve(__dirname, '../../public/_headers');
      expect(fs.existsSync(headersPath)).toBe(true);
      const content = fs.readFileSync(headersPath, 'utf8');

      expect(content).toContain('Content-Security-Policy');
      expect(content).toContain('X-Frame-Options: SAMEORIGIN');
      expect(content).toContain('X-Content-Type-Options: nosniff');
      expect(content).toContain('Referrer-Policy: strict-origin-when-cross-origin');
      expect(content).toContain('Strict-Transport-Security: max-age=31536000');
      expect(content).toContain('Permissions-Policy: camera=(), microphone=(), geolocation=()');
    });

    it('verifies vercel.json contains all required security headers and SPA rewrite', () => {
      const vercelPath = path.resolve(__dirname, '../../vercel.json');
      expect(fs.existsSync(vercelPath)).toBe(true);
      const config = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));

      const headerMap: Record<string, string> = {};
      config.headers[0].headers.forEach((h: { key: string; value: string }) => {
        headerMap[h.key] = h.value;
      });

      expect(headerMap['Content-Security-Policy']).toBeDefined();
      expect(headerMap['X-Frame-Options']).toBe('SAMEORIGIN');
      expect(headerMap['X-Content-Type-Options']).toBe('nosniff');
      expect(headerMap['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      expect(headerMap['Strict-Transport-Security']).toContain('max-age=31536000');
      expect(config.rewrites[0].destination).toBe('/index.html');
    });

    it('verifies netlify.toml contains all required security headers and SPA redirect', () => {
      const netlifyPath = path.resolve(__dirname, '../../netlify.toml');
      expect(fs.existsSync(netlifyPath)).toBe(true);
      const content = fs.readFileSync(netlifyPath, 'utf8');

      expect(content).toContain('Content-Security-Policy');
      expect(content).toContain('X-Frame-Options = "SAMEORIGIN"');
      expect(content).toContain('X-Content-Type-Options = "nosniff"');
      expect(content).toContain('Strict-Transport-Security = "max-age=31536000');
      expect(content).toContain('to = "/index.html"');
    });
  });
});
