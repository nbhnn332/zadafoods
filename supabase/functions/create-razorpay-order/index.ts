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

async function generateGuestToken(orderId: string, secret: string, ttlSeconds: number = 7200): Promise<string> {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + ttlSeconds * 1000;
  const payload = `${orderId}.${issuedAt}.${expiresAt}`;
  const sig = await computeHmacSha256(payload, secret);
  return `got_${payload}.${sig}`;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { orderId, guestAccessToken: bodyGuestToken, guestToken: directOrderSecret } = body;
    const headerGuestToken = req.headers.get('x-guest-order-token');
    const guestToken = headerGuestToken || bodyGuestToken;

    // 1. Mandatory Order ID validation & UUID check
    if (!orderId || !UUID_REGEX.test(orderId)) {
      return new Response(
        JSON.stringify({ error: 'Valid UUID orderId is required. Client-specified amounts or guessed IDs are strictly rejected.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validate Supabase Environment Variables
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

    // 3. Fetch authoritative order details from database
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

    // 4. Payment status checks (Replay & Terminal State Protection)
    if (dbOrder.payment_status === 'PAID') {
      return new Response(
        JSON.stringify({ error: `Order ${orderId} has already been paid.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (dbOrder.payment_status === 'REFUNDED') {
      return new Response(
        JSON.stringify({ error: `Order ${orderId} has been refunded and cannot be paid.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Authorization: Verified Supabase Identity OR Cryptographic Guest Order Token
    let issuedGuestToken: string | null = null;
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
      // Authenticated order: caller MUST match the order's user_id
      if (!authenticatedUserId || authenticatedUserId !== dbOrder.user_id) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: You do not have permission to pay for this order.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Guest order: MUST present a cryptographically verified, unguessable, order-scoped token
      // Email or phone alone is strictly forbidden
      let isGuestAuthorized = false;

      if (guestToken) {
        const verifyRes = await verifyGuestToken(guestToken, dbOrder.id, guestSecret);
        if (verifyRes.valid) {
          isGuestAuthorized = true;
          issuedGuestToken = guestToken;
        }
      }

      // Check initial checkout secret stored on guest order shipping_address
      const dbStoredSecret = (dbOrder.shipping_address as Record<string, any>)?.guest_token;
      if (!isGuestAuthorized && directOrderSecret && dbStoredSecret && directOrderSecret === dbStoredSecret) {
        isGuestAuthorized = true;
      }

      if (!isGuestAuthorized) {
        return new Response(
          JSON.stringify({
            error: 'Guest authorization failed: A valid, unexpired, order-scoped guestAccessToken is required. Authorization via email or phone alone is strictly prohibited.',
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!issuedGuestToken) {
        issuedGuestToken = await generateGuestToken(dbOrder.id, guestSecret);
      }
    }

    // 6. Server-Authoritative Integer-Paise Calculation
    const totalRupees = Number(dbOrder.total_amount);
    if (isNaN(totalRupees) || totalRupees <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid order total amount in database.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const amountInPaise = Math.round(totalRupees * 100);
    const keyId = Deno.env.get('RAZORPAY_KEY_ID') || 'rzp_test_placeholder_key_id';
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    // 7. Replay / Existing Razorpay Order check
    let razorpayOrderId = dbOrder.razorpay_order_id;

    if (!razorpayOrderId) {
      razorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      if (keySecret) {
        const auth = btoa(`${keyId}:${keySecret}`);
        const response = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt: dbOrder.order_number,
            notes: { orderNumber: dbOrder.order_number, orderId: dbOrder.id },
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          return new Response(
            JSON.stringify({ error: `Razorpay API error: ${errData.error?.description || 'Failed to create order'}` }),
            { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const orderData = await response.json();
        razorpayOrderId = orderData.id;
      }

      // Persist the Razorpay Order ID to prevent orphan or mismatch orders
      await supabaseAdmin
        .from('orders')
        .update({
          razorpay_order_id: razorpayOrderId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    }

    return new Response(
      JSON.stringify({
        orderId: razorpayOrderId,
        internalOrderId: dbOrder.id,
        amountInPaise,
        currency: 'INR',
        keyId,
        orderNumber: dbOrder.order_number,
        guestAccessToken: issuedGuestToken,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
