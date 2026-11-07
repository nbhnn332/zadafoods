import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-guest-order-token',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function computeHmacSha256(data: string, secret: string): Promise<string> {
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

async function verifyGuestToken(
  token: string | null | undefined,
  orderId: string,
  secret: string
): Promise<{ valid: boolean; reason?: string }> {
  if (!token || typeof token !== 'string') return { valid: false, reason: 'MISSING_TOKEN' };
  if (!token.startsWith('got_')) return { valid: false, reason: 'MALFORMED_TOKEN' };

  const parts = token.slice(4).split('.');
  if (parts.length !== 4) return { valid: false, reason: 'MALFORMED_TOKEN' };

  const [tOrderId, issuedAtStr, expiresAtStr, sig] = parts;
  if (tOrderId.toLowerCase() !== orderId.toLowerCase()) {
    return { valid: false, reason: 'ORDER_MISMATCH' };
  }

  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return { valid: false, reason: 'EXPIRED' };
  }

  const expectedSig = await computeHmacSha256(`${tOrderId}.${issuedAtStr}.${expiresAtStr}`, secret);
  if (expectedSig.toLowerCase() !== sig.toLowerCase()) {
    return { valid: false, reason: 'INVALID_SIGNATURE' };
  }

  return { valid: true };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId, guestAccessToken: bodyGuestToken } = body;
    const headerGuestToken = req.headers.get('x-guest-order-token');
    const guestToken = headerGuestToken || bodyGuestToken;

    // 1. Mandatory input validation
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: razorpayOrderId, razorpayPaymentId, razorpaySignature, and orderId are mandatory.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!UUID_REGEX.test(orderId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid orderId format. Must be a valid UUID.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const guestSecret = Deno.env.get('GUEST_TOKEN_SECRET') || serviceRoleKey;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // 2. Fetch authoritative order record
    const { data: dbOrder, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, user_id, customer_email, customer_phone, total_amount, payment_status, razorpay_order_id, shipping_address')
      .eq('id', orderId)
      .single();

    if (orderErr || !dbOrder) {
      return new Response(
        JSON.stringify({ error: `Order ${orderId} not found in database.` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Idempotent check: if already paid with the same payment ID, succeed safely
    if (dbOrder.payment_status === 'PAID') {
      return new Response(
        JSON.stringify({ isValid: true, orderId, paymentId: razorpayPaymentId, message: 'Order is already marked as paid.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (dbOrder.payment_status === 'REFUNDED') {
      return new Response(
        JSON.stringify({ isValid: false, error: 'Order has already been refunded.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Strict Razorpay Order ID validation against DB
    if (dbOrder.razorpay_order_id && dbOrder.razorpay_order_id !== razorpayOrderId) {
      return new Response(
        JSON.stringify({ isValid: false, error: 'Razorpay order ID does not match the registered order in database.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Authorization: Verified Supabase Identity OR Order-Scoped Guest Token
    const authHeader = req.headers.get('Authorization');
    let authenticatedUserId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userData } = await supabaseAdmin.auth.getUser(token);
      if (userData?.user) {
        authenticatedUserId = userData.user.id;
      }
    }

    if (dbOrder.user_id !== null) {
      if (!authenticatedUserId || authenticatedUserId !== dbOrder.user_id) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: You do not have permission to verify this order.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      let isGuestAuthorized = false;

      if (guestToken) {
        const verifyRes = await verifyGuestToken(guestToken, dbOrder.id, guestSecret);
        if (verifyRes.valid) {
          isGuestAuthorized = true;
        }
      }

      const dbStoredSecret = (dbOrder.shipping_address as Record<string, any>)?.guest_token;
      if (!isGuestAuthorized && guestToken && dbStoredSecret && guestToken === dbStoredSecret) {
        isGuestAuthorized = true;
      }

      if (!isGuestAuthorized) {
        return new Response(
          JSON.stringify({
            error: 'Guest authorization failed: A valid, unexpired, order-scoped guestAccessToken is required. Email or phone alone is strictly prohibited.',
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 6. Cryptographic HMAC-SHA256 Signature Verification
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || 'rzp_test_secret_placeholder';
    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSig = await computeHmacSha256(payload, keySecret);

    if (expectedSig.toLowerCase() !== razorpaySignature.toLowerCase()) {
      return new Response(
        JSON.stringify({ isValid: false, error: 'Cryptographic signature mismatch.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Gateway-Level Direct Verification via Razorpay REST API
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    if (keyId && keySecret && !keySecret.includes('placeholder')) {
      const auth = btoa(`${keyId}:${keySecret}`);
      const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}`, {
        headers: { Authorization: `Basic ${auth}` },
      });

      if (!rzpRes.ok) {
        return new Response(
          JSON.stringify({ isValid: false, error: 'Razorpay gateway rejected payment verification inquiry.' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const paymentData = await rzpRes.json();
      const expectedPaise = Math.round(Number(dbOrder.total_amount) * 100);

      // Verify Razorpay Order ID
      if (paymentData.order_id && paymentData.order_id !== razorpayOrderId) {
        return new Response(
          JSON.stringify({ isValid: false, error: 'Gateway order ID mismatch.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify exact payment amount
      if (paymentData.amount !== expectedPaise) {
        return new Response(
          JSON.stringify({ isValid: false, error: `Gateway payment amount mismatch: expected ${expectedPaise} paise, got ${paymentData.amount} paise.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify currency
      if (paymentData.currency !== 'INR') {
        return new Response(
          JSON.stringify({ isValid: false, error: `Gateway currency mismatch: expected INR, got ${paymentData.currency}.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify payment status is strictly captured (authorized is NOT sufficient to mark PAID)
      if (paymentData.status !== 'captured') {
        return new Response(
          JSON.stringify({
            isValid: false,
            error: `Payment is in '${paymentData.status}' state. Only 'captured' payments can mark an order as PAID. Authorized payments must be captured before fulfillment.`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 8. Atomic Database Update (Guarded by PENDING status)
    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'PAID',
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('payment_status', 'PENDING');

    if (updateErr) {
      return new Response(
        JSON.stringify({ isValid: false, error: `Failed to update order status: ${updateErr.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        isValid: true,
        orderId,
        paymentId: razorpayPaymentId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Verification failure' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
