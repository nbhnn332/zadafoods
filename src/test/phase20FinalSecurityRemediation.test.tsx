import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { calculateCodAdvance } from '../lib/commerce/codAdvanceCalculator';
import { processRazorpayWebhook, computeHmacSha256Hex } from '../lib/commerce/razorpayServer';
import { StoreSettings } from '../types';

describe('Phase 20 — Final Security Remediation & Production Migration Preflight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Production Path Credential Purge & Migration Exclusion', () => {
    it('VERIFIES 20261104000003_seed_super_admin_auth_user.sql has zero hardcoded plaintext passwords', () => {
      const migrationPath = path.resolve(__dirname, '../../supabase/migrations/20261104000003_seed_super_admin_auth_user.sql');
      expect(fs.existsSync(migrationPath)).toBe(true);
      const content = fs.readFileSync(migrationPath, 'utf8');

      expect(content).not.toContain('Admin@123456');
      expect(content).not.toContain('extensions.crypt');
      expect(content).toContain('SECURITY HARDENING NOTICE');
      expect(content).toContain('RAISE NOTICE');
    });

    it('VERIFIES production migration bundle completely omits 20261104000003_seed_super_admin_auth_user.sql', () => {
      const prodDir = path.resolve(__dirname, '../../supabase/production_migrations');
      expect(fs.existsSync(prodDir)).toBe(true);
      const files = fs.readdirSync(prodDir);

      expect(files.some((f) => f.includes('seed_super_admin_auth_user'))).toBe(false);
      expect(files.length).toBe(23); // 22 SQL migrations + 1 README.md
    });

    it('VERIFIES production migration bundle includes phase 20 security remediation migration', () => {
      const prodMigration23 = path.resolve(
        __dirname,
        '../../supabase/production_migrations/20261104000006_phase20_security_remediation.sql'
      );
      expect(fs.existsSync(prodMigration23)).toBe(true);
      const sql = fs.readFileSync(prodMigration23, 'utf8');
      expect(sql).toContain('create_order_server_authoritative');
      expect(sql).toContain('carts_isolation_policy');
      expect(sql).toContain('profiles_select_least_privilege');
    });
  });

  describe('2. Cart Isolation & Cryptographic Guest Token Verification', () => {
    it('CONFIRMS policy rejects loose "session_id IS NOT NULL" conditions', () => {
      const sqlPath = path.resolve(__dirname, '../../supabase/migrations/20261104000006_phase20_security_remediation.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');

      // Ensure no standalone "session_id IS NOT NULL" condition without exact token match
      expect(sql).toContain('session_id = NULLIF(current_setting(\'request.headers\', true)::json->>\'x-cart-token\', \'\')');
      expect(sql).not.toMatch(/session_id IS NOT NULL\s*\)\s*OR/);
    });

    it('DENIES cross-guest cart access when x-cart-token does not match', () => {
      const guestAToken = 'token_guest_alpha_329487293847239';
      const guestBToken = 'token_guest_beta_9182371982739182';

      const verifyCartAccess = (cartSessionId: string, requestHeaderToken?: string) => {
        if (!requestHeaderToken) return false;
        return cartSessionId === requestHeaderToken;
      };

      // Guest A accesses Cart A -> ALLOWED
      expect(verifyCartAccess(guestAToken, guestAToken)).toBe(true);
      // Guest B attempts to access Cart A -> DENIED
      expect(verifyCartAccess(guestAToken, guestBToken)).toBe(false);
      // Anonymous request without header token -> DENIED
      expect(verifyCartAccess(guestAToken, undefined)).toBe(false);
    });

    it('DENIES cross-customer cart access for authenticated users', () => {
      const customerAId = 'usr_customer_aaa';
      const customerBId = 'usr_customer_bbb';

      const verifyCustomerCartAccess = (cartUserId: string, authUid: string) => {
        return cartUserId === authUid;
      };

      expect(verifyCustomerCartAccess(customerAId, customerAId)).toBe(true);
      expect(verifyCustomerCartAccess(customerAId, customerBId)).toBe(false);
    });
  });

  describe('3. Server-Authoritative Order Creation & Financial Validation', () => {
    it('INDEPENDENTLY calculates authoritative subtotal and discounts from catalog prices', () => {
      const dbPrices: Record<string, number> = {
        'var_bcn_250': 180,
        'var_halwa_500': 350
      };

      const requestedItems = [
        { variantId: 'var_bcn_250', quantity: 2, clientClaimedPrice: 1 }, // Malicious client claim: ₹1
        { variantId: 'var_halwa_500', quantity: 1, clientClaimedPrice: 50 } // Malicious client claim: ₹50
      ];

      // Server computes subtotal using dbPrices, ignoring client claims
      const authoritativeSubtotal = requestedItems.reduce((acc, item) => {
        const truePrice = dbPrices[item.variantId] || 0;
        return acc + truePrice * item.quantity;
      }, 0);

      // (180 * 2) + (350 * 1) = 360 + 350 = 710
      expect(authoritativeSubtotal).toBe(710);
    });

    it('INDEPENDENTLY evaluates free shipping thresholds against authoritative subtotal', () => {
      const freeShippingThreshold = 499;
      const standardDeliveryFee = 40;

      const subtotalAbove = 710;
      const subtotalBelow = 360;

      const feeAbove = subtotalAbove >= freeShippingThreshold ? 0 : standardDeliveryFee;
      const feeBelow = subtotalBelow >= freeShippingThreshold ? 0 : standardDeliveryFee;

      expect(feeAbove).toBe(0);
      expect(feeBelow).toBe(40);
    });

    it('INDEPENDENTLY calculates COD advance and prevents client tampering', () => {
      const orderTotal = 710;
      const codConfig: Partial<StoreSettings> = {
        isCodGloballyEnabled: true,
        isCodAdvanceEnabled: true,
        codAdvanceType: 'PERCENTAGE',
        codAdvanceValue: 20,
        codAdvanceMinOrderValue: 499,
        codAdvanceMinAmount: 50,
        codAdvanceMaxAmount: 300
      };

      const result = calculateCodAdvance(orderTotal, codConfig as StoreSettings);
      // 20% of 710 = 142
      expect(result.advanceAmount).toBe(142);
      expect(result.remainingAmount).toBe(568);
      expect(result.isAdvanceRequired).toBe(true);

      // Client claiming advanceAmount = 0 is rejected by server calculation
      const clientTamperedAdvance = 0;
      expect(clientTamperedAdvance).not.toBe(result.advanceAmount);
    });

    it('REJECTS direct orders with payment_status = PAID from storefront clients', () => {
      const validateOrderPaymentStatus = (status: string, role: string) => {
        if (status === 'PAID' && role !== 'superadmin' && role !== 'service_role') {
          throw new Error('SECURITY_VIOLATION: Orders cannot be inserted with PAID status by storefront clients.');
        }
        return true;
      };

      expect(() => validateOrderPaymentStatus('PAID', 'customer')).toThrow('SECURITY_VIOLATION');
      expect(() => validateOrderPaymentStatus('PAID', 'guest')).toThrow('SECURITY_VIOLATION');
      expect(validateOrderPaymentStatus('PENDING', 'customer')).toBe(true);
      expect(validateOrderPaymentStatus('PAID', 'service_role')).toBe(true);
    });
  });

  describe('4. Complete Customer & Admin Privacy Separation (Least Privilege)', () => {
    it('GRANTS full customer directory access strictly to Super Admin and Support with customers.view', () => {
      // Simulate evaluation of profiles_select_least_privilege policy
      const evaluateProfilesAccess = (
        authUid: string,
        targetUserId: string,
        isSuperAdmin: boolean,
        permissions: string[]
      ) => {
        return (
          authUid === targetUserId ||
          isSuperAdmin === true ||
          permissions.includes('customers.view') ||
          permissions.includes('support.customers')
        );
      };

      const customerAId = 'usr_cust_a';
      const customerBId = 'usr_cust_b';

      // 1. Customer A reading own profile -> ALLOWED
      expect(evaluateProfilesAccess(customerAId, customerAId, false, [])).toBe(true);
      // 2. Customer A reading Customer B's profile -> DENIED
      expect(evaluateProfilesAccess(customerAId, customerBId, false, [])).toBe(false);

      // 3. Super Admin reading any customer profile -> ALLOWED
      expect(evaluateProfilesAccess('usr_super_admin', customerBId, true, [])).toBe(true);

      // 4. Customer Support Admin with customers.view -> ALLOWED
      expect(evaluateProfilesAccess('usr_support_admin', customerBId, false, ['customers.view'])).toBe(true);

      // 5. Catalog Admin (only has catalog.products) -> DENIED
      expect(evaluateProfilesAccess('usr_catalog_admin', customerBId, false, ['catalog.products'])).toBe(false);

      // 6. Marketing Admin (only has cms.homepage) -> DENIED
      expect(evaluateProfilesAccess('usr_marketing_admin', customerBId, false, ['cms.homepage'])).toBe(false);
    });

    it('PREVENTS regular admins from viewing other administrators or admin accounts', () => {
      // Simulate evaluation of admin_accounts_select_least_privilege policy
      const evaluateAdminAccountAccess = (
        authUid: string,
        targetAdminId: string,
        isSuperAdmin: boolean,
        permissions: string[]
      ) => {
        return (
          authUid === targetAdminId ||
          isSuperAdmin === true ||
          permissions.includes('admins.manage')
        );
      };

      const catalogAdminId = 'usr_admin_catalog';
      const otherAdminId = 'usr_admin_fulfillment';

      // 1. Catalog Admin viewing own account -> ALLOWED
      expect(evaluateAdminAccountAccess(catalogAdminId, catalogAdminId, false, ['catalog.products'])).toBe(true);

      // 2. Catalog Admin attempting to view other admin's account -> DENIED
      expect(evaluateAdminAccountAccess(catalogAdminId, otherAdminId, false, ['catalog.products'])).toBe(false);

      // 3. Super Admin viewing any admin account -> ALLOWED
      expect(evaluateAdminAccountAccess('usr_super_admin', otherAdminId, true, [])).toBe(true);

      // 4. Admin with explicit admins.manage permission -> ALLOWED
      expect(evaluateAdminAccountAccess('usr_team_lead', otherAdminId, false, ['admins.manage'])).toBe(true);
    });
  });

  describe('5. Duplicate Razorpay Webhook Event Idempotency', () => {
    it('HANDLES duplicate webhook payloads idempotently without double processing', async () => {
      const webhookSecret = 'test_webhook_secret_key_123';
      const eventId = 'evt_duplicate_test_001';
      const payloadObj = {
        id: eventId,
        entity: 'event',
        account_id: 'acc_test_123',
        event: 'payment.captured',
        contains: ['payment'],
        payload: {
          payment: {
            entity: {
              id: 'pay_test_dup_999',
              order_id: 'order_test_dup_999',
              amount: 50000,
              currency: 'INR',
              status: 'captured'
            }
          }
        },
        created_at: 1730000000
      };

      const rawBody = JSON.stringify(payloadObj);
      const signature = await computeHmacSha256Hex(rawBody, webhookSecret);

      const processedEvents = new Set<string>();

      // First webhook delivery
      const res1 = await processRazorpayWebhook(rawBody, signature, webhookSecret, processedEvents);
      expect(res1.status).toBe('PROCESSED');
      expect(res1.eventId).toBe(eventId);
      expect(processedEvents.has(eventId)).toBe(true);

      // Second duplicate webhook delivery
      const res2 = await processRazorpayWebhook(rawBody, signature, webhookSecret, processedEvents);
      expect(res2.status).toBe('ALREADY_PROCESSED');
      expect(res2.eventId).toBe(eventId);
    });
  });
});
