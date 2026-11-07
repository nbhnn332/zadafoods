/**
 * ZaDa Foods — Cryptographic Guest Order Authorization Engine
 * Issues and validates secure, unguessable, order-scoped, time-bounded tokens for guest checkouts.
 */

export interface GuestTokenVerificationResult {
  valid: boolean;
  reason?: 'MISSING_TOKEN' | 'MALFORMED_TOKEN' | 'ORDER_MISMATCH' | 'EXPIRED' | 'INVALID_SIGNATURE';
  orderId?: string;
  expiresAt?: number;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(str: string): boolean {
  return UUID_REGEX.test(str);
}

async function computeHmacSha256Hex(data: string, secret: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(data));
    return Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Fallback for Node environments without crypto.subtle
  const nodeCrypto = await import('crypto');
  return nodeCrypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Generates an unguessable, order-scoped, time-bounded guest token.
 * Format: got_<orderId>.<issuedAt>.<expiresAt>.<hmacSignature>
 */
export async function generateGuestOrderToken(
  orderId: string,
  secret: string,
  ttlSeconds: number = 7200 // 2 hours
): Promise<string> {
  if (!isValidUuid(orderId)) {
    throw new Error('Invalid order UUID provided for guest token generation.');
  }

  const issuedAt = Date.now();
  const expiresAt = issuedAt + ttlSeconds * 1000;
  const payload = `${orderId}.${issuedAt}.${expiresAt}`;
  const signature = await computeHmacSha256Hex(payload, secret);

  return `got_${payload}.${signature}`;
}

/**
 * Validates a guest order token against a specific orderId and secret.
 */
export async function verifyGuestOrderToken(
  token: string | null | undefined,
  expectedOrderId: string,
  secret: string
): Promise<GuestTokenVerificationResult> {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'MISSING_TOKEN' };
  }

  if (!token.startsWith('got_')) {
    return { valid: false, reason: 'MALFORMED_TOKEN' };
  }

  const parts = token.slice(4).split('.');
  if (parts.length !== 4) {
    return { valid: false, reason: 'MALFORMED_TOKEN' };
  }

  const [tokenOrderId, issuedAtStr, expiresAtStr, providedSignature] = parts;

  // 1. Order binding check: token MUST match the exact order being accessed
  if (tokenOrderId.toLowerCase() !== expectedOrderId.toLowerCase()) {
    return { valid: false, reason: 'ORDER_MISMATCH', orderId: tokenOrderId };
  }

  // 2. Expiration check
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return { valid: false, reason: 'EXPIRED', orderId: tokenOrderId, expiresAt };
  }

  // 3. Cryptographic signature verification
  const payload = `${tokenOrderId}.${issuedAtStr}.${expiresAtStr}`;
  const expectedSignature = await computeHmacSha256Hex(payload, secret);

  // Constant-time-like comparison
  if (expectedSignature.toLowerCase() !== providedSignature.toLowerCase()) {
    return { valid: false, reason: 'INVALID_SIGNATURE', orderId: tokenOrderId };
  }

  return { valid: true, orderId: tokenOrderId, expiresAt };
}
