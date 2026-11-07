-- ==============================================================================
-- ZaDa Foods — Phase 23: Security Hardening & Cryptographic Guest Order Verification
-- Target: Staging Supabase Database (qjuvwrjpbwxkqyvffbcy) & Production Migrations
-- File: supabase/migrations/20261104000007_phase23_security_hardening.sql
-- ==============================================================================
-- DESIGN LAW:
-- 1. 100% IDEMPOTENT & NON-DESTRUCTIVE.
-- 2. Removes hardcoded fallback secret from create_order_server_authoritative.
-- 3. Employs isolated server-side secret store (private.server_secrets) inaccessible to anon/authenticated.
-- 4. Fails securely if HMAC secret is unconfigured.
-- 5. Implements cryptographic token verification function: get_guest_order_tracking(p_order_ref, p_token).
-- 6. Enforces email confirmation in bootstrap_super_admin.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. ISOLATED SERVER-SIDE SECRET STORE
-- ------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role, postgres;

CREATE TABLE IF NOT EXISTS private.server_secrets (
    key TEXT PRIMARY KEY,
    secret TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

REVOKE ALL ON private.server_secrets FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.server_secrets TO service_role, postgres;

-- Seed server HMAC secret with secure cryptographically random value if not present
INSERT INTO private.server_secrets (key, secret)
VALUES ('guest_order_hmac_secret', encode(extensions.gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. HARDENED create_order_server_authoritative (NO HARDCODED FALLBACK)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_order_server_authoritative(p_order_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_user_id UUID;
    v_customer_name TEXT;
    v_customer_email TEXT;
    v_customer_phone TEXT;
    v_shipping_address JSONB;
    v_delivery_method TEXT;
    v_payment_mode TEXT;
    v_coupon_code TEXT;

    v_items JSONB;
    v_item JSONB;
    v_item_var_id UUID;
    v_item_qty INTEGER;

    v_var RECORD;
    v_subtotal NUMERIC(10,2) := 0;
    v_discount NUMERIC(10,2) := 0;
    v_coupon_id UUID := NULL;
    v_free_shipping BOOLEAN := FALSE;
    v_coupon RECORD;

    v_shipping_setting JSONB;
    v_free_threshold NUMERIC(10,2) := 499.00;
    v_std_fee NUMERIC(10,2) := 40.00;
    v_exp_fee NUMERIC(10,2) := 80.00;
    v_shipping_charge NUMERIC(10,2) := 0;

    v_checkout_setting JSONB;
    v_total NUMERIC(10,2) := 0;
    v_cod_advance NUMERIC(10,2) := 0;
    v_cod_remaining NUMERIC(10,2) := 0;
    v_cod_advance_status VARCHAR(32) := NULL;

    v_guest_token TEXT := NULL;
    v_issued_at BIGINT;
    v_expires_at BIGINT;
    v_payload TEXT;
    v_token_secret TEXT;
    v_token_sig TEXT;
BEGIN
    -- 1. Input Validation
    v_items := p_order_data->'items';
    IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
        RAISE EXCEPTION 'ORDER_VALIDATION_FAILED: An order must contain at least one item.';
    END IF;

    v_customer_name := TRIM(COALESCE(p_order_data->>'customer_name', ''));
    v_customer_email := LOWER(TRIM(COALESCE(p_order_data->>'customer_email', '')));
    v_customer_phone := TRIM(COALESCE(p_order_data->>'customer_phone', ''));
    v_shipping_address := COALESCE(p_order_data->'shipping_address', '{}'::jsonb);
    v_delivery_method := UPPER(COALESCE(p_order_data->>'delivery_method', 'STANDARD'));
    v_payment_mode := UPPER(COALESCE(p_order_data->>'payment_mode', 'COD'));
    v_coupon_code := UPPER(TRIM(COALESCE(p_order_data->>'coupon_code', '')));

    IF v_customer_name = '' OR v_customer_phone = '' THEN
        RAISE EXCEPTION 'ORDER_VALIDATION_FAILED: Customer name and phone are required.';
    END IF;

    IF v_delivery_method NOT IN ('STANDARD', 'EXPRESS') THEN
        v_delivery_method := 'STANDARD';
    END IF;

    IF v_payment_mode NOT IN ('RAZORPAY', 'WHATSAPP_MANUAL', 'COD') THEN
        RAISE EXCEPTION 'ORDER_VALIDATION_FAILED: Invalid payment mode %.', v_payment_mode;
    END IF;

    -- Authoritative User Assignment from authenticated session
    IF auth.uid() IS NOT NULL THEN
        v_user_id := auth.uid();
    ELSE
        v_user_id := NULL;
    END IF;

    -- UUID and Human Order Number
    IF p_order_data->>'order_id' IS NOT NULL AND (p_order_data->>'order_id')::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
        v_order_id := (p_order_data->>'order_id')::uuid;
    ELSE
        v_order_id := gen_random_uuid();
    END IF;

    v_order_number := COALESCE(p_order_data->>'order_number', 'ZDF' || floor(extract(epoch from now()))::text);

    -- Duplicate Order Protection
    IF EXISTS (
        SELECT 1 FROM public.orders
        WHERE id = v_order_id OR order_number = v_order_number
    ) THEN
        RAISE EXCEPTION 'DUPLICATE_ORDER: An order with ID % or number % already exists. Duplicate order creation rejected.',
            v_order_id, v_order_number;
    END IF;

    -- 2. Item Stock Locking & Subtotal Accumulation
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        v_item_var_id := (v_item->>'variant_id')::uuid;
        v_item_qty := COALESCE((v_item->>'quantity')::integer, 1);

        IF v_item_qty <= 0 THEN
            RAISE EXCEPTION 'ORDER_VALIDATION_FAILED: Quantity for variant % must be greater than zero.', v_item_var_id;
        END IF;

        SELECT pv.id, pv.product_id, pv.selling_price, pv.mrp, pv.stock_quantity, pv.weight_label, p.name AS product_name, p.is_published
        INTO v_var
        FROM public.product_variants pv
        JOIN public.products p ON p.id = pv.product_id
        WHERE pv.id = v_item_var_id
        FOR UPDATE OF pv;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'ORDER_VALIDATION_FAILED: Product variant % does not exist.', v_item_var_id;
        END IF;

        IF NOT v_var.is_published THEN
            RAISE EXCEPTION 'ORDER_VALIDATION_FAILED: Product % is currently unavailable.', v_var.product_name;
        END IF;

        IF v_var.stock_quantity < v_item_qty THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK: Requested % of %, but only % available in stock.',
                v_item_qty, v_var.product_name || ' (' || v_var.weight_label || ')', v_var.stock_quantity;
        END IF;

        v_subtotal := v_subtotal + (v_var.selling_price * v_item_qty);
    END LOOP;

    -- 3. Authoritative Coupon Evaluation
    IF v_coupon_code != '' THEN
        SELECT id, discount_type, discount_value, min_order_amount, is_active
        INTO v_coupon
        FROM public.coupons
        WHERE UPPER(code) = v_coupon_code
          AND is_active = TRUE;

        IF FOUND THEN
            IF v_subtotal >= COALESCE(v_coupon.min_order_amount, 0) THEN
                v_coupon_id := v_coupon.id;
                IF v_coupon.discount_type = 'FLAT' THEN
                    v_discount := LEAST(v_subtotal, v_coupon.discount_value);
                ELSIF v_coupon.discount_type = 'PERCENTAGE' THEN
                    v_discount := ROUND((v_subtotal * (v_coupon.discount_value / 100.0)), 2);
                ELSIF v_coupon.discount_type = 'FREE_SHIPPING' THEN
                    v_free_shipping := TRUE;
                    v_discount := 0;
                END IF;
            END IF;
        END IF;
    END IF;

    -- 4. Authoritative Shipping Evaluation from store_settings
    SELECT value INTO v_shipping_setting FROM public.store_settings WHERE key = 'shipping';
    IF v_shipping_setting IS NOT NULL THEN
        v_free_threshold := COALESCE((v_shipping_setting->>'freeShippingThreshold')::numeric, 499.00);
        v_std_fee := COALESCE((v_shipping_setting->>'standardDeliveryFee')::numeric, 40.00);
        v_exp_fee := COALESCE((v_shipping_setting->>'expressDeliveryFee')::numeric, 80.00);
    END IF;

    IF v_delivery_method = 'EXPRESS' THEN
        v_shipping_charge := v_exp_fee;
    ELSIF v_free_shipping = TRUE OR v_subtotal >= v_free_threshold THEN
        v_shipping_charge := 0;
    ELSE
        v_shipping_charge := v_std_fee;
    END IF;

    -- 5. Authoritative Final Total
    v_total := GREATEST(0, (v_subtotal - v_discount) + v_shipping_charge);

    -- 6. Authoritative COD Advance Evaluation
    IF v_payment_mode = 'COD' THEN
        SELECT value INTO v_checkout_setting FROM public.store_settings WHERE key = 'checkout';
        IF v_checkout_setting IS NOT NULL AND COALESCE((v_checkout_setting->>'isCodAdvanceEnabled')::boolean, false) = TRUE THEN
            DECLARE
                v_min_order NUMERIC(10,2) := COALESCE((v_checkout_setting->>'codAdvanceMinOrderValue')::numeric, 0);
                v_adv_type TEXT := UPPER(COALESCE(v_checkout_setting->>'codAdvanceType', 'FIXED'));
                v_adv_val NUMERIC(10,2) := COALESCE((v_checkout_setting->>'codAdvanceValue')::numeric, 0);
                v_adv_min NUMERIC(10,2) := (v_checkout_setting->>'codAdvanceMinAmount')::numeric;
                v_adv_max NUMERIC(10,2) := (v_checkout_setting->>'codAdvanceMaxAmount')::numeric;
            BEGIN
                IF v_total >= v_min_order THEN
                    IF v_adv_type = 'PERCENTAGE' THEN
                        v_cod_advance := ROUND(v_total * (v_adv_val / 100.0), 2);
                    ELSE
                        v_cod_advance := v_adv_val;
                    END IF;

                    IF v_adv_min IS NOT NULL AND v_cod_advance < v_adv_min THEN
                        v_cod_advance := v_adv_min;
                    END IF;
                    IF v_adv_max IS NOT NULL AND v_cod_advance > v_adv_max THEN
                        v_cod_advance := v_adv_max;
                    END IF;
                    IF v_cod_advance > v_total THEN
                        v_cod_advance := v_total;
                    END IF;

                    IF v_cod_advance > 0 THEN
                        v_cod_advance_status := 'AWAITING_PAYMENT';
                    END IF;
                END IF;
            END;
        END IF;
        v_cod_remaining := GREATEST(0, v_total - v_cod_advance);
    ELSE
        v_cod_advance := 0;
        v_cod_remaining := 0;
    END IF;

    -- 7. Bypass trigger restriction safely inside transaction
    PERFORM set_config('zada.authoritative_order_creation', 'true', true);

    -- Insert into public.orders
    INSERT INTO public.orders (
        id,
        order_number,
        user_id,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        delivery_method,
        payment_mode,
        payment_status,
        fulfillment_status,
        subtotal_amount,
        discount_amount,
        coupon_id,
        coupon_code,
        shipping_charge,
        total_amount,
        cod_advance_amount,
        cod_advance_paid,
        cod_remaining_amount,
        cod_advance_payment_status,
        created_at,
        updated_at
    ) VALUES (
        v_order_id,
        v_order_number,
        v_user_id,
        v_customer_name,
        v_customer_email,
        v_customer_phone,
        v_shipping_address,
        v_delivery_method,
        v_payment_mode,
        'PENDING',
        'CONFIRMED',
        v_subtotal,
        v_discount,
        v_coupon_id,
        NULLIF(v_coupon_code, ''),
        v_shipping_charge,
        v_total,
        v_cod_advance,
        0,
        v_cod_remaining,
        v_cod_advance_status,
        NOW(),
        NOW()
    );

    -- Insert order items & decrement stock atomically
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        v_item_var_id := (v_item->>'variant_id')::uuid;
        v_item_qty := (v_item->>'quantity')::integer;

        SELECT pv.id, pv.product_id, pv.selling_price, pv.mrp, pv.stock_quantity, pv.weight_label, p.name AS product_name
        INTO v_var
        FROM public.product_variants pv
        JOIN public.products p ON p.id = pv.product_id
        WHERE pv.id = v_item_var_id;

        INSERT INTO public.order_items (
            order_id,
            product_id,
            variant_id,
            product_name,
            variant_weight_label,
            unit_price,
            mrp,
            quantity,
            line_total
        ) VALUES (
            v_order_id,
            v_var.product_id,
            v_var.id,
            v_var.product_name,
            v_var.weight_label,
            v_var.selling_price,
            v_var.mrp,
            v_item_qty,
            ROUND(v_var.selling_price * v_item_qty, 2)
        );

        UPDATE public.product_variants
        SET stock_quantity = stock_quantity - v_item_qty,
            updated_at = NOW()
        WHERE id = v_var.id;

        INSERT INTO public.inventory_movements (
            variant_id,
            movement_type,
            quantity_change,
            previous_stock,
            new_stock,
            order_id,
            reason,
            created_by,
            created_at
        ) VALUES (
            v_var.id,
            'SALE',
            -v_item_qty,
            v_var.stock_quantity,
            v_var.stock_quantity - v_item_qty,
            v_order_id,
            'Sale deduction for order ' || v_order_number,
            v_user_id,
            NOW()
        );
    END LOOP;

    INSERT INTO public.order_status_history (
        order_id,
        status,
        notes
    ) VALUES (
        v_order_id,
        'CONFIRMED',
        'Order placed and confirmed via authoritative server checkout.'
    );

    -- 8. Cryptographic HMAC Guest Order Token (Server Store Secret ONLY - Zero Hardcoded Fallbacks)
    IF v_user_id IS NULL THEN
        -- Retrieve secret from server store or server GUC
        v_token_secret := current_setting('app.settings.jwt_secret', true);
        IF v_token_secret IS NULL OR v_token_secret = '' THEN
            SELECT secret INTO v_token_secret FROM private.server_secrets WHERE key = 'guest_order_hmac_secret';
        END IF;

        -- Fail securely if server secret is missing or insufficient length
        IF v_token_secret IS NULL OR LENGTH(v_token_secret) < 32 THEN
            RAISE EXCEPTION 'SECURITY_CONFIGURATION_ERROR: Secure server HMAC secret is not configured in the secret store. Guest order creation aborted.';
        END IF;

        v_issued_at := (extract(epoch from now()) * 1000)::bigint;
        v_expires_at := v_issued_at + (7200 * 1000); -- 2 Hour TTL
        v_payload := v_order_id::text || '.' || v_issued_at::text || '.' || v_expires_at::text;
        v_token_sig := encode(extensions.hmac(v_payload::bytea, v_token_secret::bytea, 'sha256'), 'hex');
        v_guest_token := 'got_' || v_payload || '.' || v_token_sig;
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'user_id', v_user_id,
        'subtotal_amount', v_subtotal,
        'discount_amount', v_discount,
        'shipping_charge', v_shipping_charge,
        'total_amount', v_total,
        'cod_advance_amount', v_cod_advance,
        'cod_remaining_amount', v_cod_remaining,
        'payment_mode', v_payment_mode,
        'payment_status', 'PENDING',
        'fulfillment_status', 'CONFIRMED',
        'guest_token', v_guest_token
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_server_authoritative(JSONB) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. CRYPTOGRAPHIC GUEST ORDER TRACKING RPC (Zero IDOR / Tamper-Proof)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_guest_order_tracking(
    p_order_ref TEXT,
    p_guest_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_items JSONB;
    v_history JSONB;
    v_parts TEXT[];
    v_token_prefix TEXT;
    v_token_order_id TEXT;
    v_issued_at BIGINT;
    v_expires_at BIGINT;
    v_sig TEXT;
    v_token_secret TEXT;
    v_expected_sig TEXT;
    v_now_ms BIGINT;
BEGIN
    -- 1. Validate Token Structure: got_<order_id>.<issued_at>.<expires_at>.<sig>
    IF p_guest_token IS NULL OR NOT (p_guest_token LIKE 'got_%') THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_TOKEN', 'message', 'Invalid or missing guest access token format.');
    END IF;

    v_token_prefix := SUBSTRING(p_guest_token FROM 5);
    v_parts := string_to_array(v_token_prefix, '.');

    IF array_length(v_parts, 1) != 4 THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'INVALID_TOKEN_STRUCTURE', 'message', 'Malformed guest token format.');
    END IF;

    v_token_order_id := v_parts[1];
    v_issued_at := v_parts[2]::bigint;
    v_expires_at := v_parts[3]::bigint;
    v_sig := v_parts[4];

    -- 2. Verify Expiration
    v_now_ms := (extract(epoch from now()) * 1000)::bigint;
    IF v_now_ms > v_expires_at THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'TOKEN_EXPIRED', 'message', 'Guest order access token has expired. Please check order status via customer support.');
    END IF;

    -- 3. Retrieve Server Secret
    v_token_secret := current_setting('app.settings.jwt_secret', true);
    IF v_token_secret IS NULL OR v_token_secret = '' THEN
        SELECT secret INTO v_token_secret FROM private.server_secrets WHERE key = 'guest_order_hmac_secret';
    END IF;

    IF v_token_secret IS NULL OR LENGTH(v_token_secret) < 32 THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'SERVER_ERROR', 'message', 'Cryptographic verification secret unavailable.');
    END IF;

    -- 4. Cryptographic HMAC Verification
    v_expected_sig := encode(extensions.hmac((v_token_order_id || '.' || v_parts[2] || '.' || v_parts[3])::bytea, v_token_secret::bytea, 'sha256'), 'hex');

    IF v_sig != v_expected_sig THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'SIGNATURE_MISMATCH', 'message', 'Cryptographic verification failed. Token signature is invalid.');
    END IF;

    -- 5. Fetch Order safely
    SELECT * INTO v_order
    FROM public.orders
    WHERE (id::text = v_token_order_id OR order_number = p_order_ref)
      AND (id::text = v_token_order_id);

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'ORDER_NOT_FOUND', 'message', 'Order not found matching verified token.');
    END IF;

    -- Fetch order items
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'variant_id', oi.variant_id,
            'product_name', oi.product_name,
            'variant_weight_label', oi.variant_weight_label,
            'unit_price', oi.unit_price,
            'mrp', oi.mrp,
            'quantity', oi.quantity,
            'line_total', oi.line_total
        )
    ) INTO v_items
    FROM public.order_items oi
    WHERE oi.order_id = v_order.id;

    -- Fetch order status history
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', osh.id,
            'status', osh.status,
            'notes', osh.notes,
            'created_at', osh.created_at
        ) ORDER BY osh.created_at ASC
    ) INTO v_history
    FROM public.order_status_history osh
    WHERE osh.order_id = v_order.id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'order', jsonb_build_object(
            'id', v_order.id,
            'order_number', v_order.order_number,
            'customer_name', v_order.customer_name,
            'customer_phone', v_order.customer_phone,
            'customer_email', v_order.customer_email,
            'shipping_address', v_order.shipping_address,
            'delivery_method', v_order.delivery_method,
            'payment_mode', v_order.payment_mode,
            'payment_status', v_order.payment_status,
            'fulfillment_status', v_order.fulfillment_status,
            'subtotal_amount', v_order.subtotal_amount,
            'discount_amount', v_order.discount_amount,
            'shipping_charge', v_order.shipping_charge,
            'total_amount', v_order.total_amount,
            'cod_advance_amount', v_order.cod_advance_amount,
            'cod_advance_paid', v_order.cod_advance_paid,
            'cod_remaining_amount', v_order.cod_remaining_amount,
            'cod_advance_payment_status', v_order.cod_advance_payment_status,
            'created_at', v_order.created_at,
            'updated_at', v_order.updated_at,
            'items', COALESCE(v_items, '[]'::jsonb),
            'status_history', COALESCE(v_history, '[]'::jsonb)
        )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_guest_order_tracking(TEXT, TEXT) TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 4. HARDENED bootstrap_super_admin (ENFORCES is_confirmed CHECK)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bootstrap_super_admin(target_email TEXT DEFAULT 'admin.zadafoods.superad@gmail.com')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    target_user_id UUID;
    norm_email TEXT;
    is_confirmed BOOLEAN;
BEGIN
    IF current_user != 'service_role' AND current_user != 'postgres' THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: bootstrap_super_admin is restricted to service_role and database superusers.';
    END IF;

    norm_email := LOWER(TRIM(target_email));

    IF norm_email NOT IN ('admin.zadafoods.superad@gmail.com', 'superadmin@zadafoods.com') THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'SECURITY_VIOLATION: bootstrap_super_admin can only provision explicitly designated Super Admin emails (' || norm_email || ' is not approved).'
        );
    END IF;

    SELECT id, (email_confirmed_at IS NOT NULL OR confirmed_at IS NOT NULL)
    INTO target_user_id, is_confirmed
    FROM auth.users
    WHERE LOWER(email) = norm_email;

    IF target_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'User account not found in auth.users for ' || norm_email || '. Account must be invited/created first.'
        );
    END IF;

    -- ENFORCE CONFIRMED EMAIL BEFORE ELEVATION
    IF NOT COALESCE(is_confirmed, FALSE) THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'SECURITY_VIOLATION: Super Admin auth user ' || norm_email || ' must have a confirmed email before elevation.'
        );
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (target_user_id, norm_email, 'ZaDa Super Administrator', 'superadmin')
    ON CONFLICT (id) DO UPDATE SET role = 'superadmin', updated_at = NOW();

    INSERT INTO public.admin_roles (user_id, role, granted_by)
    VALUES (target_user_id, 'superadmin', target_user_id)
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.admin_accounts (id, role, status)
    VALUES (target_user_id, 'superadmin', 'active')
    ON CONFLICT (id) DO UPDATE SET role = 'superadmin', status = 'active', updated_at = NOW();

    RETURN jsonb_build_object('success', TRUE, 'email', norm_email, 'role', 'superadmin');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bootstrap_super_admin(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_super_admin(TEXT) TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
