-- ============================================================================
-- ZaDa Foods — Phase 20: Final Security Remediation & Hardening Migration
-- Migration: 20261104000006_phase20_security_remediation.sql
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. FIX AND VERIFY CART ISOLATION
-- ----------------------------------------------------------------------------
-- Eliminate any loose "session_id IS NOT NULL" conditions.
-- Enforce authenticated user cart ownership AND cryptographically tokenized guest cart ownership.

ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO anon, authenticated;

DROP POLICY IF EXISTS "Users can manage own carts" ON public.carts;
DROP POLICY IF EXISTS "carts_isolation_policy" ON public.carts;
DROP POLICY IF EXISTS "carts_owner_access" ON public.carts;

CREATE POLICY "carts_isolation_policy"
    ON public.carts FOR ALL
    TO anon, authenticated
    USING (
        -- 1. Authenticated user owns their cart
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        -- 2. Guest user with exact cryptographically verified token sent via x-cart-token header
        OR (
            auth.uid() IS NULL
            AND user_id IS NULL
            AND session_id IS NOT NULL
            AND session_id = NULLIF(current_setting('request.headers', true)::json->>'x-cart-token', '')
        )
        -- 3. Super Admin authority
        OR (public.is_super_admin() = TRUE)
    )
    WITH CHECK (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        OR (
            auth.uid() IS NULL
            AND user_id IS NULL
            AND session_id IS NOT NULL
            AND session_id = NULLIF(current_setting('request.headers', true)::json->>'x-cart-token', '')
        )
        OR (public.is_super_admin() = TRUE)
    );

DROP POLICY IF EXISTS "Users can manage own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "cart_items_isolation_policy" ON public.cart_items;
DROP POLICY IF EXISTS "cart_items_owner_access" ON public.cart_items;

CREATE POLICY "cart_items_isolation_policy"
    ON public.cart_items FOR ALL
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.carts
            WHERE carts.id = cart_items.cart_id
            AND (
                (auth.uid() IS NOT NULL AND carts.user_id = auth.uid())
                OR (
                    auth.uid() IS NULL
                    AND carts.user_id IS NULL
                    AND carts.session_id IS NOT NULL
                    AND carts.session_id = NULLIF(current_setting('request.headers', true)::json->>'x-cart-token', '')
                )
                OR (public.is_super_admin() = TRUE)
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.carts
            WHERE carts.id = cart_items.cart_id
            AND (
                (auth.uid() IS NOT NULL AND carts.user_id = auth.uid())
                OR (
                    auth.uid() IS NULL
                    AND carts.user_id IS NULL
                    AND carts.session_id IS NOT NULL
                    AND carts.session_id = NULLIF(current_setting('request.headers', true)::json->>'x-cart-token', '')
                )
                OR (public.is_super_admin() = TRUE)
            )
        )
    );

-- ----------------------------------------------------------------------------
-- 2. SERVER-AUTHORITATIVE ORDER CREATION & FINANCIAL INTEGRITY
-- ----------------------------------------------------------------------------

-- A. Create authoritative order creation RPC
CREATE OR REPLACE FUNCTION public.create_order_server_authoritative(p_order_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
    -- 1. Extract inputs
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

    IF v_customer_name = '' OR v_customer_email = '' OR v_customer_phone = '' THEN
        RAISE EXCEPTION 'ORDER_VALIDATION_FAILED: Customer name, email, and phone are required.';
    END IF;

    IF v_delivery_method NOT IN ('STANDARD', 'EXPRESS') THEN
        v_delivery_method := 'STANDARD';
    END IF;

    IF v_payment_mode NOT IN ('RAZORPAY', 'WHATSAPP_MANUAL', 'COD') THEN
        RAISE EXCEPTION 'ORDER_VALIDATION_FAILED: Invalid payment mode %.', v_payment_mode;
    END IF;

    -- User ID assignment: strictly authoritative from auth.uid()
    IF auth.uid() IS NOT NULL THEN
        v_user_id := auth.uid();
    ELSE
        v_user_id := NULL;
    END IF;

    -- Generate UUID and human order number
    IF p_order_data->>'order_id' IS NOT NULL AND (p_order_data->>'order_id')::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
        v_order_id := (p_order_data->>'order_id')::uuid;
    ELSE
        v_order_id := gen_random_uuid();
    END IF;

    v_order_number := COALESCE(p_order_data->>'order_number', 'ZDF' || floor(extract(epoch from now()))::text);

    -- Replay / Duplicate Order Check
    IF EXISTS (
        SELECT 1 FROM public.orders
        WHERE id = v_order_id OR order_number = v_order_number
    ) THEN
        RAISE EXCEPTION 'DUPLICATE_ORDER: An order with ID % or number % already exists. Duplicate order creation rejected.',
            v_order_id, v_order_number;
    END IF;

    -- 2. Validate Items & Compute Authoritative Subtotal with row locking
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
    LOOP
        v_item_var_id := (v_item->>'variant_id')::uuid;
        v_item_qty := COALESCE((v_item->>'quantity')::integer, 1);

        IF v_item_qty <= 0 THEN
            RAISE EXCEPTION 'ORDER_VALIDATION_FAILED: Quantity for variant % must be greater than zero.', v_item_var_id;
        END IF;

        -- Acquire row lock on product variant and join product
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

        -- Authoritative price accumulation
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

        -- Insert order item
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

        -- Decrement variant stock
        UPDATE public.product_variants
        SET stock_quantity = stock_quantity - v_item_qty,
            updated_at = NOW()
        WHERE id = v_var.id;

        -- Record inventory SALE movement
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

    -- Record initial status history
    INSERT INTO public.order_status_history (
        order_id,
        status,
        notes
    ) VALUES (
        v_order_id,
        'CONFIRMED',
        'Order placed and confirmed via authoritative server checkout.'
    );

    -- 8. Generate Guest Token if order is unauthenticated guest
    IF v_user_id IS NULL THEN
        v_issued_at := (extract(epoch from now()) * 1000)::bigint;
        v_expires_at := v_issued_at + (7200 * 1000); -- 2 hours TTL
        v_payload := v_order_id::text || '.' || v_issued_at::text || '.' || v_expires_at::text;
        v_token_secret := COALESCE(current_setting('app.jwt_secret', true), 'zada_production_guest_order_secret_hmac');
        v_token_sig := encode(extensions.hmac(v_payload::bytea, v_token_secret::bytea, 'sha256'), 'hex');
        v_guest_token := 'got_' || v_payload || '.' || v_token_sig;
    END IF;

    -- Return full authoritative order response
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

-- B. Harden Trigger on public.orders preventing direct client manipulation
CREATE OR REPLACE FUNCTION public.enforce_order_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Super Admin and service_role can perform direct order management
    IF current_user = 'service_role' OR public.is_super_admin() = TRUE THEN
        RETURN NEW;
    END IF;

    -- Storefront clients cannot insert orders directly without authoritative server execution
    IF TG_OP = 'INSERT' THEN
        IF current_setting('zada.authoritative_order_creation', true) IS DISTINCT FROM 'true' THEN
            RAISE EXCEPTION 'SECURITY_VIOLATION: Direct insertion into orders with client-determined financials is forbidden. Use create_order_server_authoritative().';
        END IF;

        IF NEW.payment_status NOT IN ('PENDING', 'ADVANCE_PAID') THEN
            RAISE EXCEPTION 'SECURITY_VIOLATION: Orders cannot be inserted with payment status % by storefront clients.', NEW.payment_status;
        END IF;

        IF NEW.fulfillment_status NOT IN ('PENDING', 'CONFIRMED') THEN
            RAISE EXCEPTION 'SECURITY_VIOLATION: Orders cannot be inserted with fulfillment status % by storefront clients.', NEW.fulfillment_status;
        END IF;
    END IF;

    -- Update protection
    IF TG_OP = 'UPDATE' THEN
        IF NEW.payment_status = 'PAID' AND OLD.payment_status != 'PAID' AND NOT (
            public.has_permission('orders.manage') = TRUE
        ) THEN
            RAISE EXCEPTION 'SECURITY_VIOLATION: Direct modification of payment_status to PAID is restricted to payment gateway webhooks and authorized administrators.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_order_payment_integrity ON public.orders;
DROP TRIGGER IF EXISTS trg_enforce_order_integrity ON public.orders;

CREATE TRIGGER trg_enforce_order_integrity
    BEFORE INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_order_integrity();

-- ----------------------------------------------------------------------------
-- 3. COMPLETE CUSTOMER AND ADMIN PRIVACY SEPARATION (LEAST PRIVILEGE)
-- ----------------------------------------------------------------------------

-- A. PROFILES: Only own profile, Super Admin, or authorized Customer Support
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_least_privilege" ON public.profiles;

CREATE POLICY "profiles_select_least_privilege"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id
        OR public.is_super_admin() = TRUE
        OR public.has_permission('customers.view') = TRUE
        OR public.has_permission('support.customers') = TRUE
    );

-- B. ADMIN ROLES: Only own role, Super Admin, or authorized Administrator Manager
DROP POLICY IF EXISTS "admin_roles_select_policy" ON public.admin_roles;
DROP POLICY IF EXISTS "admin_roles_select_least_privilege" ON public.admin_roles;

CREATE POLICY "admin_roles_select_least_privilege"
    ON public.admin_roles FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR public.is_super_admin() = TRUE
        OR public.has_permission('admins.manage') = TRUE
    );

-- C. ADMIN ACCOUNTS: Only own account, Super Admin, or authorized Administrator Manager
DROP POLICY IF EXISTS "Admins can view admin accounts" ON public.admin_accounts;
DROP POLICY IF EXISTS "admin_accounts_select_least_privilege" ON public.admin_accounts;

CREATE POLICY "admin_accounts_select_least_privilege"
    ON public.admin_accounts FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id
        OR public.is_super_admin() = TRUE
        OR public.has_permission('admins.manage') = TRUE
    );

-- D. ADMIN PERMISSIONS: Only own permissions, Super Admin, or authorized Administrator Manager
DROP POLICY IF EXISTS "Admins can view permissions" ON public.admin_permissions;
DROP POLICY IF EXISTS "admin_permissions_select_least_privilege" ON public.admin_permissions;

CREATE POLICY "admin_permissions_select_least_privilege"
    ON public.admin_permissions FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR public.is_super_admin() = TRUE
        OR public.has_permission('admins.manage') = TRUE
    );

-- ----------------------------------------------------------------------------
-- 4. ORDER TRACKING RLS DEFENSE
-- ----------------------------------------------------------------------------
-- Ensure public.orders SELECT policy prevents cross-customer order snooping:
-- Authenticated customer can ONLY see their own orders (auth.uid() = user_id).
-- Guest orders can ONLY be accessed if guest token is verified, or Super Admin/Order Manager.
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    TO authenticated, anon
    USING (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        OR (public.is_super_admin() = TRUE)
        OR (public.has_permission('orders.view') = TRUE)
        OR (public.has_permission('orders.manage') = TRUE)
    );

-- ----------------------------------------------------------------------------
-- 5. REVOKE DIRECT STOREFRONT INSERT ON ORDERS & ORDER_ITEMS
-- ----------------------------------------------------------------------------
-- Eliminate any direct client financial injection vector.
-- Storefront clients must create orders exclusively through create_order_server_authoritative.
REVOKE INSERT ON public.orders FROM anon, authenticated;
REVOKE INSERT ON public.order_items FROM anon, authenticated;
GRANT INSERT ON public.orders TO service_role;
GRANT INSERT ON public.order_items TO service_role;

-- ----------------------------------------------------------------------------
-- 6. HARDEN SUPER ADMIN BOOTSTRAP PROCEDURE
-- ----------------------------------------------------------------------------
-- Ensure bootstrap_super_admin can ONLY be executed by service_role (or superuser),
-- can ONLY promote the explicitly approved Super Admin email,
-- and strictly requires an existing confirmed GoTrue auth user.

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
    -- 1. Caller Authorization Check: Only service_role or database superuser
    IF current_user != 'service_role' AND current_user != 'postgres' THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: bootstrap_super_admin is restricted to service_role and database superusers.';
    END IF;

    norm_email := LOWER(TRIM(target_email));

    -- 2. Strict Whitelist Enforcement: Arbitrary emails CANNOT be promoted
    IF norm_email NOT IN ('admin.zadafoods.superad@gmail.com', 'superadmin@zadafoods.com') THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'SECURITY_VIOLATION: bootstrap_super_admin can only provision explicitly designated Super Admin emails (' || norm_email || ' is not approved).'
        );
    END IF;

    -- 3. Require existing confirmed auth user
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

    -- 4. Idempotent promotion across profiles, admin_roles, and admin_accounts
    -- 4.1 Profiles
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (target_user_id, norm_email, 'ZaDa Super Administrator', 'superadmin')
    ON CONFLICT (id) DO UPDATE SET
        role = 'superadmin',
        updated_at = NOW();

    -- 4.2 Admin Roles
    INSERT INTO public.admin_roles (user_id, role, granted_by)
    VALUES (target_user_id, 'superadmin', target_user_id)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 4.3 Admin Accounts
    INSERT INTO public.admin_accounts (id, role, status)
    VALUES (target_user_id, 'superadmin', 'active')
    ON CONFLICT (id) DO UPDATE SET
        role = 'superadmin',
        status = 'active',
        updated_at = NOW();

    RETURN jsonb_build_object(
        'success', TRUE,
        'user_id', target_user_id,
        'email', norm_email,
        'role', 'superadmin',
        'status', 'active'
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bootstrap_super_admin(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_super_admin(TEXT) TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
