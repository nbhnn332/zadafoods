import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

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

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Server misconfiguration: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  let currentEventId: string | null = null;

  try {
    const signatureHeader = req.headers.get('x-razorpay-signature');
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');

    if (!signatureHeader) {
      return new Response(JSON.stringify({ error: 'Missing x-razorpay-signature header' }), { status: 400 });
    }

    if (!webhookSecret) {
      return new Response(JSON.stringify({ error: 'Webhook secret not configured on server' }), { status: 500 });
    }

    // 1. Raw body verification BEFORE parsing JSON
    const rawBody = await req.text();
    const expectedSig = await computeHmacSha256(rawBody, webhookSecret);

    if (expectedSig.toLowerCase() !== signatureHeader.toLowerCase()) {
      return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), { status: 401 });
    }

    // 2. Parse payload safely
    const event = JSON.parse(rawBody);
    const eventId = event.id;
    currentEventId = eventId;
    const eventType = event.event;

    // 3. Concurrency-Safe Atomic Claim via PostgreSQL Unique Constraint
    const { error: claimError } = await supabaseAdmin
      .from('payment_webhooks')
      .insert({
        event_id: eventId,
        event_type: eventType,
        payload: event,
        is_processed: false,
        processed_at: null,
      });

    if (claimError) {
      // Unique constraint violation (23505) indicates duplicate delivery, in-flight processing, or retry after failure
      const { data: existingEvent } = await supabaseAdmin
        .from('payment_webhooks')
        .select('id, is_processed, error_message')
        .eq('event_id', eventId)
        .maybeSingle();

      if (existingEvent?.is_processed) {
        return new Response(
          JSON.stringify({ status: 'ALREADY_PROCESSED', eventId }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // If a previous execution failed (error_message is set), permit this retry to re-attempt processing
      if (existingEvent && !existingEvent.is_processed && existingEvent.error_message) {
        // Clear previous error and proceed with retry
        await supabaseAdmin
          .from('payment_webhooks')
          .update({ error_message: null })
          .eq('event_id', eventId);
      } else {
        // Active concurrent execution in progress
        return new Response(
          JSON.stringify({ status: 'PROCESSING_IN_PROGRESS', eventId }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 4. Handle events with strict status transitions and payment evidence verification
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;
      const paymentStatus = paymentEntity?.status;
      // Strictly require 'captured' status (authorized payments must NOT mark an order PAID)
      const isVerifiedPaid = paymentStatus === 'captured' || (eventType === 'order.paid' && (!paymentStatus || paymentStatus === 'captured'));

      if (!isVerifiedPaid) {
        await supabaseAdmin
          .from('payment_webhooks')
          .update({
            is_processed: true,
            processed_at: new Date().toISOString(),
            error_message: `Ignored unverified/uncaptured payment status '${paymentStatus}'`
          })
          .eq('event_id', eventId);

        return new Response(
          JSON.stringify({ status: 'IGNORED_UNCAPTURED_STATUS', eventId, paymentStatus }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const orderNumber = paymentEntity?.notes?.orderNumber || orderEntity?.receipt;
      const orderIdNote = paymentEntity?.notes?.orderId;
      const rzpPaymentId = paymentEntity?.id;
      const rzpOrderId = paymentEntity?.order_id || orderEntity?.id;
      const capturedAmountPaise = Number(paymentEntity?.amount || 0);
      const capturedAmountRupees = Math.round(capturedAmountPaise / 100);

      // Check whether this is a COD order with advance payment
      let targetOrderQuery = supabaseAdmin.from('orders').select('id, payment_mode, total_amount, cod_advance_amount, cod_advance_paid, cod_remaining_amount, payment_status');
      if (orderNumber) {
        targetOrderQuery = targetOrderQuery.eq('order_number', orderNumber);
      } else if (orderIdNote) {
        targetOrderQuery = targetOrderQuery.eq('id', orderIdNote);
      }

      const { data: matchedOrder } = await targetOrderQuery.maybeSingle();

      const isCodWithAdvance = matchedOrder && matchedOrder.payment_mode === 'COD' && Number(matchedOrder.cod_advance_amount) > 0;

      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (rzpPaymentId) updatePayload.razorpay_payment_id = rzpPaymentId;
      if (rzpOrderId) updatePayload.razorpay_order_id = rzpOrderId;

      if (isCodWithAdvance) {
        // CRITICAL PAYMENT SECURITY: An advance payment MUST NOT mark the entire COD order as PAID!
        // It must be marked ADVANCE_PAID with balance remaining at doorstep delivery.
        updatePayload.payment_status = 'ADVANCE_PAID';
        updatePayload.cod_advance_paid = capturedAmountRupees > 0 ? capturedAmountRupees : Number(matchedOrder.cod_advance_amount);
        updatePayload.cod_remaining_amount = Math.max(0, Number(matchedOrder.total_amount) - updatePayload.cod_advance_paid);
        updatePayload.cod_advance_payment_status = 'PAID';
        updatePayload.advance_payment_reference = rzpPaymentId;
        updatePayload.advance_payment_method = 'RAZORPAY';
        updatePayload.admin_notes = `[Razorpay Webhook]: COD advance payment of ₹${updatePayload.cod_advance_paid} captured (Ref: ${rzpPaymentId}). Remaining balance of ₹${updatePayload.cod_remaining_amount} due on delivery.`;
      } else {
        updatePayload.payment_status = 'PAID';
      }

      if (orderNumber) {
        await supabaseAdmin
          .from('orders')
          .update(updatePayload)
          .eq('order_number', orderNumber)
          .neq('payment_status', 'PAID');
      } else if (orderIdNote) {
        await supabaseAdmin
          .from('orders')
          .update(updatePayload)
          .eq('id', orderIdNote)
          .neq('payment_status', 'PAID');
      }
    } else if (eventType === 'payment.authorized') {
      // Authorized only: Do NOT mark PAID. Keep PENDING and log audit note.
      const orderNumber = event.payload?.payment?.entity?.notes?.orderNumber;
      const orderIdNote = event.payload?.payment?.entity?.notes?.orderId;
      const rzpPaymentId = event.payload?.payment?.entity?.id;

      const updatePayload = {
        admin_notes: `[Razorpay Webhook]: Payment authorized by bank (ID: ${rzpPaymentId}). Awaiting capture before fulfillment.`,
        updated_at: new Date().toISOString(),
      };

      if (orderNumber) {
        await supabaseAdmin
          .from('orders')
          .update(updatePayload)
          .eq('order_number', orderNumber)
          .eq('payment_status', 'PENDING');
      } else if (orderIdNote) {
        await supabaseAdmin
          .from('orders')
          .update(updatePayload)
          .eq('id', orderIdNote)
          .eq('payment_status', 'PENDING');
      }
    } else if (eventType === 'payment.failed') {
      const orderNumber = event.payload?.payment?.entity?.notes?.orderNumber;
      const orderIdNote = event.payload?.payment?.entity?.notes?.orderId;
      const errorDesc = event.payload?.payment?.entity?.error_description || 'Payment declined by bank';

      // CRITICAL: ONLY mark FAILED if currently PENDING. Never downgrade an already-paid order!
      const updatePayload = {
        payment_status: 'FAILED',
        admin_notes: `[Razorpay Webhook]: Payment attempt failed: ${errorDesc}`,
        updated_at: new Date().toISOString(),
      };

      if (orderNumber) {
        await supabaseAdmin
          .from('orders')
          .update(updatePayload)
          .eq('order_number', orderNumber)
          .eq('payment_status', 'PENDING');
      } else if (orderIdNote) {
        await supabaseAdmin
          .from('orders')
          .update(updatePayload)
          .eq('id', orderIdNote)
          .eq('payment_status', 'PENDING');
      }
    } else if (eventType === 'refund.processed') {
      const orderNumber = event.payload?.refund?.entity?.notes?.orderNumber;
      const orderIdNote = event.payload?.refund?.entity?.notes?.orderId;

      const updatePayload = {
        payment_status: 'REFUNDED',
        admin_notes: `[Razorpay Webhook]: Refund of ₹${(event.payload?.refund?.entity?.amount || 0) / 100} processed.`,
        updated_at: new Date().toISOString(),
      };

      if (orderNumber) {
        await supabaseAdmin
          .from('orders')
          .update(updatePayload)
          .eq('order_number', orderNumber);
      } else if (orderIdNote) {
        await supabaseAdmin
          .from('orders')
          .update(updatePayload)
          .eq('id', orderIdNote);
      }
    }

      const updatePayload = {
        payment_status: 'REFUNDED',
        admin_notes: `[Razorpay Webhook]: Refund of ₹${(event.payload?.refund?.entity?.amount || 0) / 100} processed.`,
        updated_at: new Date().toISOString(),
      };

      if (orderNumber) {
        await supabaseAdmin
          .from('orders')
          .update(updatePayload)
          .eq('order_number', orderNumber);
      } else if (orderIdNote) {
        await supabaseAdmin
          .from('orders')
          .update(updatePayload)
          .eq('id', orderIdNote);
      }
    }

    // 5. Mark webhook successfully processed
    await supabaseAdmin
      .from('payment_webhooks')
      .update({ is_processed: true, processed_at: new Date().toISOString() })
      .eq('event_id', eventId);

    return new Response(
      JSON.stringify({ status: 'PROCESSED', eventId, eventType }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    if (currentEventId && supabaseAdmin) {
      await supabaseAdmin
        .from('payment_webhooks')
        .update({ error_message: error.message || 'Unknown processing error' })
        .eq('event_id', currentEventId);
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Webhook processing failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
