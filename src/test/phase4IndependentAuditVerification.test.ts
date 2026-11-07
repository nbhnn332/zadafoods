import { describe, it, expect, beforeEach } from 'vitest';
import {
  verifyRazorpaySignature,
  processRazorpayWebhook,
  computeHmacSha256Hex,
  createRazorpayOrderManifest
} from '../lib/commerce/razorpayServer';
import { CustomerService } from '../lib/commerce/customerService';

describe('ZaDa Foods — Phase 4 Independent Audit Verification Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Razorpay Cryptographic Verification & Replay Protection', () => {
    const testSecret = 'rzp_test_secret_for_audit_12345';
    const razorpayOrderId = 'order_DAw2vM6c49Q5v1';
    const razorpayPaymentId = 'pay_DAw3959z18pPnm';

    it('validates authentic Razorpay payment signatures using HMAC-SHA256', async () => {
      const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
      const validSignature = await computeHmacSha256Hex(payload, testSecret);

      const verification = await verifyRazorpaySignature(
        razorpayOrderId,
        razorpayPaymentId,
        validSignature,
        testSecret
      );

      expect(verification.isValid).toBe(true);
      expect(verification.failureReason).toBeUndefined();
    });

    it('rejects tampered or mismatched Razorpay signatures', async () => {
      const fraudulentSignature = '0000000000000000000000000000000000000000000000000000000000000000';

      const verification = await verifyRazorpaySignature(
        razorpayOrderId,
        razorpayPaymentId,
        fraudulentSignature,
        testSecret
      );

      expect(verification.isValid).toBe(false);
      expect(verification.failureReason).toContain('tampering');
    });

    it('enforces webhook signature verification and prevents duplicate replay attacks', async () => {
      const webhookSecret = 'whsec_test_audit_987654321';
      const eventPayload = {
        id: 'evt_unique_1001',
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_1001',
              notes: { orderNumber: 'ZDF9999' }
            }
          }
        }
      };

      const rawBody = JSON.stringify(eventPayload);
      const validSig = await computeHmacSha256Hex(rawBody, webhookSecret);
      const processedEventIds = new Set<string>();

      // 1. Initial delivery
      const firstResult = await processRazorpayWebhook(
        rawBody,
        validSig,
        webhookSecret,
        processedEventIds
      );

      expect(firstResult.status).toBe('PROCESSED');
      expect(firstResult.orderNumber).toBe('ZDF9999');
      expect(firstResult.paymentStatus).toBe('PAID');

      // 2. Replay attempt with same eventId
      const replayResult = await processRazorpayWebhook(
        rawBody,
        validSig,
        webhookSecret,
        processedEventIds
      );

      expect(replayResult.status).toBe('ALREADY_PROCESSED');
      expect(replayResult.eventId).toBe('evt_unique_1001');
    });

    it('generates integer-paise amounts without floating-point currency inaccuracy', () => {
      const rupees = 890.5; // ₹890.50
      const { order, clientOptions } = createRazorpayOrderManifest(rupees, 'ZDF1009', 'rzp_test_key');

      expect(order.amount).toBe(89050); // Exact integer paise
      expect(order.amount_due).toBe(89050);
      expect(Number.isInteger(order.amount)).toBe(true);
      expect(clientOptions.amount).toBe(89050);
    });
  });

  describe('2. Customer Data Privacy & Account Isolation', () => {
    it('prevents customer A from accessing customer B addresses', async () => {
      const customerA = 'usr-cust-a-99';
      const customerB = 'usr-cust-b-88';

      await CustomerService.addAddress(customerA, {
        tag: 'Home',
        recipientName: 'Customer A Real Name',
        phone: '+91 99999 11111',
        streetAddress: 'Palayam',
        city: 'Kozhikode',
        state: 'Kerala',
        postalCode: '673001',
        isDefault: true
      });

      const customerBAddresses = await CustomerService.getAddresses(customerB);
      expect(customerBAddresses.length).toBe(0);

      const customerAAddresses = await CustomerService.getAddresses(customerA);
      expect(customerAAddresses.length).toBe(1);
      expect(customerAAddresses[0].recipientName).toBe('Customer A Real Name');
    });
  });
});
