import { describe, it, expect } from 'vitest';
import {
  createRazorpayOrderManifest,
  verifyRazorpaySignature,
  processRazorpayWebhook,
  computeHmacSha256Hex
} from '../lib/commerce/razorpayServer';

describe('Server-Side Razorpay Integration Engine', () => {
  const secretKey = 'test_secret_key_12345';
  const orderNumber = 'ZDF1008';

  it('creates an order manifest converting rupees to paise accurately', () => {
    const { order, clientOptions } = createRazorpayOrderManifest(890, orderNumber);
    expect(order.amount).toBe(89000); // ₹890 = 89000 paise
    expect(order.currency).toBe('INR');
    expect(order.receipt).toBe(orderNumber);
    expect(clientOptions.amount).toBe(89000);
  });

  it('verifies a valid cryptographic HMAC-SHA256 signature', async () => {
    const razorpayOrderId = 'order_EKwxwAgItmmXdp';
    const razorpayPaymentId = 'pay_29QQoUBi66xm2f';
    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const validSignature = await computeHmacSha256Hex(payload, secretKey);

    const result = await verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      validSignature,
      secretKey
    );

    expect(result.isValid).toBe(true);
    expect(result.failureReason).toBeUndefined();
  });

  it('rejects a tampered payment signature', async () => {
    const razorpayOrderId = 'order_EKwxwAgItmmXdp';
    const razorpayPaymentId = 'pay_29QQoUBi66xm2f';
    const tamperedSignature = 'deadbeef00000000000000000000000000000000000000000000000000000000';

    const result = await verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      tamperedSignature,
      secretKey
    );

    expect(result.isValid).toBe(false);
    expect(result.failureReason).toContain('mismatch');
  });

  it('processes payment.captured webhooks and enforces idempotency', async () => {
    const webhookSecret = 'whsec_9876543210';
    const rawPayload = JSON.stringify({
      id: 'evt_123456789',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_abc123',
            amount: 89000,
            notes: { orderNumber: 'ZDF1008' }
          }
        }
      }
    });

    const signature = await computeHmacSha256Hex(rawPayload, webhookSecret);
    const processedEvents = new Set<string>();

    // First delivery: should process
    const result1 = await processRazorpayWebhook(rawPayload, signature, webhookSecret, processedEvents);
    expect(result1.status).toBe('PROCESSED');
    expect(result1.paymentStatus).toBe('PAID');
    expect(result1.orderNumber).toBe('ZDF1008');

    // Duplicate delivery: should detect duplicate and return ALREADY_PROCESSED
    const result2 = await processRazorpayWebhook(rawPayload, signature, webhookSecret, processedEvents);
    expect(result2.status).toBe('ALREADY_PROCESSED');
  });
});
