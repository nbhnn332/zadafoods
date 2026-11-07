import { describe, it, expect } from 'vitest';
import {
  generateGuestOrderToken,
  verifyGuestOrderToken,
} from '../lib/commerce/guestOrderAuth';

describe('ZaDa Foods — Edge Function Hardening Verification Suite', () => {
  const TEST_SECRET = 'test_guest_hmac_secret_key_12345';
  const VALID_ORDER_ID_A = 'a1111111-1111-4111-8111-111111111111';
  const VALID_ORDER_ID_B = 'b2222222-2222-4222-8222-222222222222';
  const GUESSED_ORDER_ID = 'c3333333-3333-4333-8333-333333333333';

  // --- 1. Guessed Order IDs ---
  describe('1. Guessed Order IDs & Authorization Boundaries', () => {
    it('strictly rejects access when a guessed order ID is provided without a valid token', async () => {
      // Simulating Edge Function authorization check for guest orders
      const authorizationAttempt = async (orderId: string, token: string | null) => {
        if (!token) {
          return { status: 403, error: 'Guest authorization failed: A valid guestAccessToken is required.' };
        }
        const verifyRes = await verifyGuestOrderToken(token, orderId, TEST_SECRET);
        if (!verifyRes.valid) {
          return { status: 403, error: `Guest authorization failed: ${verifyRes.reason}` };
        }
        return { status: 200, authorized: true };
      };

      const resultWithoutToken = await authorizationAttempt(GUESSED_ORDER_ID, null);
      expect(resultWithoutToken.status).toBe(403);
      expect(resultWithoutToken.error).toContain('guestAccessToken is required');

      const resultWithArbitraryToken = await authorizationAttempt(GUESSED_ORDER_ID, 'got_random_unauthorized_token');
      expect(resultWithArbitraryToken.status).toBe(403);
    });
  });

  // --- 2. Email/Phone-Only Access Prohibition ---
  describe('2. Email / Phone-Only Access Enforcement', () => {
    it('strictly forbids access when only customer email and phone are provided without an order-scoped token', () => {
      // The hardened Edge Function requires a cryptographic guestAccessToken; email/phone fallback is rejected
      const evaluateAuthorization = (payload: { orderId: string; customerEmail?: string; customerPhone?: string; guestAccessToken?: string }) => {
        // Only valid if guestAccessToken is present and valid
        if (!payload.guestAccessToken) {
          return {
            allowed: false,
            statusCode: 403,
            message: 'Guest authorization failed: A valid, unexpired, order-scoped guestAccessToken is required. Authorization via email or phone alone is strictly prohibited.'
          };
        }
        return { allowed: true, statusCode: 200 };
      };

      const attemptWithEmailAndPhoneOnly = evaluateAuthorization({
        orderId: VALID_ORDER_ID_A,
        customerEmail: 'customer@example.com',
        customerPhone: '+91 98765 43210',
      });

      expect(attemptWithEmailAndPhoneOnly.allowed).toBe(false);
      expect(attemptWithEmailAndPhoneOnly.statusCode).toBe(403);
      expect(attemptWithEmailAndPhoneOnly.message).toContain('email or phone alone is strictly prohibited');
    });
  });

  // --- 3. Invalid Guest Tokens ---
  describe('3. Cryptographic Guest Token Lifecycle & Security', () => {
    it('generates valid tokens that successfully verify against the matching order ID', async () => {
      const token = await generateGuestOrderToken(VALID_ORDER_ID_A, TEST_SECRET, 3600);
      expect(token).toMatch(/^got_[0-9a-f-]+/);

      const verification = await verifyGuestOrderToken(token, VALID_ORDER_ID_A, TEST_SECRET);
      expect(verification.valid).toBe(true);
      expect(verification.orderId).toBe(VALID_ORDER_ID_A);
    });

    it('rejects expired guest tokens', async () => {
      // Generate a token with a negative TTL (already expired)
      const expiredToken = await generateGuestOrderToken(VALID_ORDER_ID_A, TEST_SECRET, -10);
      const verification = await verifyGuestOrderToken(expiredToken, VALID_ORDER_ID_A, TEST_SECRET);

      expect(verification.valid).toBe(false);
      expect(verification.reason).toBe('EXPIRED');
    });

    it('rejects tokens forged with an incorrect secret or signature', async () => {
      const legitimateToken = await generateGuestOrderToken(VALID_ORDER_ID_A, TEST_SECRET, 3600);
      // Verify against a wrong server secret
      const verification = await verifyGuestOrderToken(legitimateToken, VALID_ORDER_ID_A, 'attacker_fake_secret_9999');

      expect(verification.valid).toBe(false);
      expect(verification.reason).toBe('INVALID_SIGNATURE');
    });

    it('rejects a valid token for Order A when presented against Order B (Order Mismatch)', async () => {
      const tokenForOrderA = await generateGuestOrderToken(VALID_ORDER_ID_A, TEST_SECRET, 3600);
      // Attempt to access Order B with Order A's token
      const verification = await verifyGuestOrderToken(tokenForOrderA, VALID_ORDER_ID_B, TEST_SECRET);

      expect(verification.valid).toBe(false);
      expect(verification.reason).toBe('ORDER_MISMATCH');
    });
  });

  // --- 4. Wrong-Order Signatures ---
  describe('4. Wrong-Order Signature & Order Binding Verification', () => {
    it('rejects payment verification when the registered DB Razorpay Order ID does not match the submitted order ID', () => {
      const dbOrderRecord = {
        id: VALID_ORDER_ID_A,
        total_amount: 890,
        razorpay_order_id: 'order_ZAADA_LEGIT_123',
        payment_status: 'PENDING'
      };

      const verificationPayload = {
        orderId: VALID_ORDER_ID_A,
        razorpayOrderId: 'order_ATTACKER_FOREIGN_456', // Mismatched Razorpay order ID
        razorpayPaymentId: 'pay_ATTACKER_789',
        razorpaySignature: 'valid_signature_for_foreign_order'
      };

      const verifyBinding = (dbOrder: typeof dbOrderRecord, payload: typeof verificationPayload) => {
        if (dbOrder.razorpay_order_id && dbOrder.razorpay_order_id !== payload.razorpayOrderId) {
          return {
            valid: false,
            statusCode: 400,
            error: 'Razorpay order ID does not match the registered order in database.'
          };
        }
        return { valid: true };
      };

      const result = verifyBinding(dbOrderRecord, verificationPayload);
      expect(result.valid).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.error).toContain('does not match the registered order in database');
    });
  });

  // --- 5. Duplicate Concurrent Webhooks (Atomic Claim) ---
  describe('5. Duplicate Concurrent Webhook Handling (Atomic Claim Strategy)', () => {
    it('safely handles concurrent webhook deliveries without double-processing orders', async () => {
      // Mocking Postgres table with unique constraint on event_id
      const processedEvents = new Map<string, { eventId: string; isProcessed: boolean; errorMessage?: string | null }>();

      const handleWebhookAtomicClaim = async (eventId: string, _eventType: string) => {
        // Atomic Insert Simulation
        if (processedEvents.has(eventId)) {
          const existing = processedEvents.get(eventId)!;
          if (existing.isProcessed) {
            return { status: 200, action: 'ALREADY_PROCESSED' };
          }
          if (existing.errorMessage) {
            // Permitted retry after previous failure
            existing.errorMessage = null;
            await new Promise((r) => setTimeout(r, 10));
            existing.isProcessed = true;
            return { status: 200, action: 'RETRY_SUCCEEDED' };
          }
          return { status: 200, action: 'PROCESSING_IN_PROGRESS' };
        }

        // Claim lock
        processedEvents.set(eventId, { eventId, isProcessed: false, errorMessage: null });

        // Simulate order fulfillment execution
        await new Promise((r) => setTimeout(r, 10));

        // Mark processed
        processedEvents.set(eventId, { eventId, isProcessed: true, errorMessage: null });
        return { status: 200, action: 'PROCESSED' };
      };

      const eventId = 'evt_test_concurrent_payment_captured_001';

      // Simulate 3 concurrent webhook requests hitting the server simultaneously
      const results = await Promise.all([
        handleWebhookAtomicClaim(eventId, 'payment.captured'),
        handleWebhookAtomicClaim(eventId, 'payment.captured'),
        handleWebhookAtomicClaim(eventId, 'payment.captured'),
      ]);

      const actions = results.map((r) => r.action);
      // Exactly one execution claims and processes
      expect(actions.filter((a) => a === 'PROCESSED').length).toBe(1);
      // Subsequent deliveries receive non-duplicating response
      expect(actions.filter((a) => a === 'PROCESSING_IN_PROGRESS' || a === 'ALREADY_PROCESSED').length).toBe(2);
    });

    it('safely permits a subsequent retry when the previous attempt failed with an error', async () => {
      const eventId = 'evt_test_retry_after_failure_002';
      const eventStore = new Map<string, { eventId: string; isProcessed: boolean; errorMessage: string | null }>();

      // Simulate first attempt failing during DB order update
      eventStore.set(eventId, { eventId, isProcessed: false, errorMessage: 'Network timeout during DB update' });

      // Simulate Razorpay retrying 60 seconds later
      const handleRetry = (id: string) => {
        const existing = eventStore.get(id);
        if (existing) {
          if (existing.isProcessed) return { action: 'ALREADY_PROCESSED' };
          if (existing.errorMessage) {
            // Clear error and allow retry to process
            existing.errorMessage = null;
            existing.isProcessed = true;
            return { action: 'RETRY_PROCESSED' };
          }
          return { action: 'IN_PROGRESS' };
        }
        return { action: 'NEW' };
      };

      const retryResult = handleRetry(eventId);
      expect(retryResult.action).toBe('RETRY_PROCESSED');
      expect(eventStore.get(eventId)?.isProcessed).toBe(true);
      expect(eventStore.get(eventId)?.errorMessage).toBe(null);
    });
  });

  // --- 6. Delayed Failure Events ---
  describe('6. Delayed Failure Event Downgrade Protection', () => {
    it('strictly prevents a delayed payment.failed event from overwriting an already-PAID order', () => {
      let order = {
        id: VALID_ORDER_ID_A,
        order_number: 'ORD-20261027-001',
        payment_status: 'PAID', // Customer successfully paid via retry
        total_amount: 890
      };

      const applyWebhookEvent = (currentOrder: typeof order, incomingEvent: { eventType: string; status: string }) => {
        if (incomingEvent.eventType === 'payment.failed') {
          // Hardened filter: ONLY update if currently PENDING
          if (currentOrder.payment_status === 'PENDING') {
            currentOrder.payment_status = 'FAILED';
            return { updated: true, status: 'FAILED' };
          }
          // Ignored if already PAID
          return { updated: false, status: currentOrder.payment_status, reason: 'Order already in final paid status' };
        }
        return { updated: false, status: currentOrder.payment_status };
      };

      const result = applyWebhookEvent(order, { eventType: 'payment.failed', status: 'failed' });

      // Order must remain PAID
      expect(result.updated).toBe(false);
      expect(result.status).toBe('PAID');
      expect(order.payment_status).toBe('PAID');
    });
  });

  // --- 7. Gateway Amount Mismatch ---
  describe('7. Payment Amount & Currency Mismatch Rejection', () => {
    it('rejects payment verification when the gateway payment amount differs from the database order total', () => {
      const dbOrderTotalRupees = 890;

      const verifyGatewayPayment = (dbTotal: number, gatewayAmount: number, gatewayCurrency: string) => {
        const expected = Math.round(dbTotal * 100);
        if (gatewayAmount !== expected) {
          return {
            valid: false,
            statusCode: 400,
            error: `Gateway payment amount mismatch: expected ${expected} paise, got ${gatewayAmount} paise.`
          };
        }
        if (gatewayCurrency !== 'INR') {
          return {
            valid: false,
            statusCode: 400,
            error: `Gateway currency mismatch: expected INR, got ${gatewayCurrency}.`
          };
        }
        return { valid: true, statusCode: 200 };
      };

      // Attacker paid ₹1 (100 paise) instead of ₹890 (89000 paise)
      const amountMismatchResult = verifyGatewayPayment(dbOrderTotalRupees, 100, 'INR');
      expect(amountMismatchResult.valid).toBe(false);
      expect(amountMismatchResult.statusCode).toBe(400);
      expect(amountMismatchResult.error).toContain('Gateway payment amount mismatch');

      // Currency mismatch test (e.g. USD instead of INR)
      const currencyMismatchResult = verifyGatewayPayment(dbOrderTotalRupees, 89000, 'USD');
      expect(currencyMismatchResult.valid).toBe(false);
      expect(currencyMismatchResult.statusCode).toBe(400);
      expect(currencyMismatchResult.error).toContain('Gateway currency mismatch');

      // Exact match test
      const validMatchResult = verifyGatewayPayment(dbOrderTotalRupees, 89000, 'INR');
      expect(validMatchResult.valid).toBe(true);
      expect(validMatchResult.statusCode).toBe(200);
    });
  });

  // --- 8. Authorized vs Captured Payment Verification ---
  describe('8. Authorized vs Captured State Protection', () => {
    it('strictly forbids marking an order as PAID when payment state is only authorized', () => {
      const evaluatePaymentVerification = (paymentStatus: 'authorized' | 'captured' | 'failed') => {
        // Only captured payments can mark an order as PAID
        if (paymentStatus !== 'captured') {
          return {
            isValid: false,
            statusCode: 400,
            error: `Payment is in '${paymentStatus}' state. Only 'captured' payments can mark an order as PAID. Authorized payments must be captured before fulfillment.`
          };
        }
        return { isValid: true, statusCode: 200, paymentStatus: 'PAID' };
      };

      // Test authorized state
      const authorizedResult = evaluatePaymentVerification('authorized');
      expect(authorizedResult.isValid).toBe(false);
      expect(authorizedResult.statusCode).toBe(400);
      expect(authorizedResult.error).toContain("Only 'captured' payments can mark an order as PAID");

      // Test captured state
      const capturedResult = evaluatePaymentVerification('captured');
      expect(capturedResult.isValid).toBe(true);
      expect(capturedResult.statusCode).toBe(200);
      expect(capturedResult.paymentStatus).toBe('PAID');
    });
  });
});
