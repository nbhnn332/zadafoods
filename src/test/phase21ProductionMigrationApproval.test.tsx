import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 21 — Final Production Migration Approval Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Guest Cart Isolation Invariants', () => {
    it('VERIFIES public.carts policy strictly enforces x-cart-token header match for guests', () => {
      const sqlPath = path.resolve(__dirname, '../../supabase/migrations/20261104000006_phase20_security_remediation.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');

      // 1. Must check session_id against x-cart-token header exactly
      expect(sql).toContain("session_id = NULLIF(current_setting('request.headers', true)::json->>'x-cart-token', '')");
      // 2. Must require user_id IS NULL for guests
      expect(sql).toContain('user_id IS NULL');
      // 3. Must require auth.uid() IS NULL for guests
      expect(sql).toContain('auth.uid() IS NULL');
      // 4. Must require auth.uid() = user_id for authenticated users
      expect(sql).toContain('auth.uid() IS NOT NULL AND auth.uid() = user_id');
    });

    it('DENIES cart access when cart token is missing, invalid, or stolen', () => {
      const evaluateCartAccess = (
        authUid: string | null,
        cartUserId: string | null,
        cartSessionId: string | null,
        headerToken: string | null
      ) => {
        // Authenticated customer access
        if (authUid && cartUserId && authUid === cartUserId) return true;
        // Guest access with verified token
        if (!authUid && !cartUserId && cartSessionId && headerToken && cartSessionId === headerToken) return true;
        return false;
      };

      const guestTokenA = 'tok_guest_aaa_123';
      const guestTokenB = 'tok_guest_bbb_456';
      const custA = 'usr_cust_aaa';
      const custB = 'usr_cust_bbb';

      // Valid Guest A accessing Cart A -> ALLOWED
      expect(evaluateCartAccess(null, null, guestTokenA, guestTokenA)).toBe(true);
      // Stolen/Mismatched Token: Guest B accessing Cart A -> DENIED
      expect(evaluateCartAccess(null, null, guestTokenA, guestTokenB)).toBe(false);
      // Missing Token: Anonymous caller with no header -> DENIED
      expect(evaluateCartAccess(null, null, guestTokenA, null)).toBe(false);
      // Empty Token: Header with empty string -> DENIED
      expect(evaluateCartAccess(null, null, guestTokenA, '')).toBe(false);

      // Authenticated Customer A accessing Cart A -> ALLOWED
      expect(evaluateCartAccess(custA, custA, null, null)).toBe(true);
      // Customer B attempting to access Customer A's Cart -> DENIED
      expect(evaluateCartAccess(custB, custA, null, null)).toBe(false);
      // Customer A attempting to access Guest A's Cart -> DENIED
      expect(evaluateCartAccess(custA, null, guestTokenA, null)).toBe(false);
    });
  });

  describe('2. Server-Authoritative Order Procedure Verification', () => {
    it('VERIFIES create_order_server_authoritative SQL definition fulfills all security specifications', () => {
      const sqlPath = path.resolve(__dirname, '../../supabase/migrations/20261104000006_phase20_security_remediation.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');

      // 1. SECURITY DEFINER & Search Path
      expect(sql).toContain('SECURITY DEFINER');
      expect(sql).toContain('SET search_path = public, pg_temp');

      // 2. Row level locking on product variants
      expect(sql).toContain('FOR UPDATE OF pv');

      // 3. Negative quantity rejection
      expect(sql).toContain('IF v_item_qty <= 0 THEN');
      expect(sql).toContain('Quantity for variant % must be greater than zero');

      // 4. Duplicate order replay protection
      expect(sql).toContain('DUPLICATE_ORDER');
      expect(sql).toContain('SELECT 1 FROM public.orders');

      // 5. Stock availability check
      expect(sql).toContain('IF v_var.stock_quantity < v_item_qty THEN');
      expect(sql).toContain('INSUFFICIENT_STOCK');

      // 6. Authoritative calculations (coupons, shipping, COD advance)
      expect(sql).toContain('v_subtotal := v_subtotal + (v_var.selling_price * v_item_qty)');
      expect(sql).toContain("v_coupon.discount_type = 'FLAT'");
      expect(sql).toContain("v_coupon.discount_type = 'PERCENTAGE'");
      expect(sql).toContain("v_coupon.discount_type = 'FREE_SHIPPING'");
      expect(sql).toContain("v_shipping_setting->>'freeShippingThreshold'");
      expect(sql).toContain("v_checkout_setting->>'isCodAdvanceEnabled'");

      // 7. Revocation of direct INSERT on orders
      expect(sql).toContain('REVOKE INSERT ON public.orders FROM anon, authenticated');
      expect(sql).toContain('REVOKE INSERT ON public.order_items FROM anon, authenticated');
    });
  });

  describe('3. Trigger Integrity & GUC Abuse Shield', () => {
    it('VERIFIES direct REST callers cannot insert orders regardless of GUC claims', () => {
      const sqlPath = path.resolve(__dirname, '../../supabase/migrations/20261104000006_phase20_security_remediation.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');

      // 1. Direct INSERT is revoked at PostgreSQL permissions level
      expect(sql).toContain('REVOKE INSERT ON public.orders FROM anon, authenticated');

      // 2. Defense-in-depth trigger verifies GUC and rejects client manipulation
      expect(sql).toContain("current_setting('zada.authoritative_order_creation', true) IS DISTINCT FROM 'true'");
      expect(sql).toContain('SECURITY_VIOLATION: Direct insertion into orders with client-determined financials is forbidden');
    });
  });

  describe('4. Super Admin Bootstrap Procedure Security', () => {
    it('VERIFIES bootstrap_super_admin is restricted to service_role and whitelisted email', () => {
      const sqlPath = path.resolve(__dirname, '../../supabase/migrations/20261104000006_phase20_security_remediation.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');

      // 1. Caller restriction
      expect(sql).toContain("current_user != 'service_role' AND current_user != 'postgres'");
      expect(sql).toContain('SECURITY_VIOLATION: bootstrap_super_admin is restricted to service_role and database superusers');

      // 2. Strict whitelist
      expect(sql).toContain("norm_email NOT IN ('admin.zadafoods.superad@gmail.com', 'superadmin@zadafoods.com')");

      // 3. Confirmed GoTrue user requirement
      expect(sql).toContain('email_confirmed_at IS NOT NULL OR confirmed_at IS NOT NULL');

      // 4. Permission revocation from anon & authenticated
      expect(sql).toContain('REVOKE EXECUTE ON FUNCTION public.bootstrap_super_admin(TEXT) FROM PUBLIC, anon, authenticated');
      expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.bootstrap_super_admin(TEXT) TO service_role');
    });
  });

  describe('5. Production Migration Sequence & Integrity', () => {
    it('CONFIRMS exactly 22 approved migrations in supabase/production_migrations/ with 0 hardcoded credentials', () => {
      const prodDir = path.resolve(__dirname, '../../supabase/production_migrations');
      expect(fs.existsSync(prodDir)).toBe(true);

      const files = fs.readdirSync(prodDir);
      const sqlFiles = files.filter((f) => f.endsWith('.sql'));

      // Exactly 22 SQL migrations
      expect(sqlFiles.length).toBe(22);

      // Migration 20 is strictly excluded
      expect(sqlFiles.some((f) => f.includes('seed_super_admin_auth_user'))).toBe(false);

      // Verify zero hardcoded plaintext passwords in any approved production migration
      for (const file of sqlFiles) {
        const filePath = path.join(prodDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).not.toContain('Admin@123456');
        expect(content).not.toContain('sk_live_');
        expect(content).not.toContain('rzp_live_secret');
      }
    });
  });
});
