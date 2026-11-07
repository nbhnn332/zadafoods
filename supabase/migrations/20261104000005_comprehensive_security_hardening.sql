-- ============================================================================
-- ZaDa Foods — Comprehensive Database Security Hardening & Vulnerability Remediation
-- Migration: 20261104000005_comprehensive_security_hardening.sql
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. REMEDIATE FINDING-01: PREVENT PRIVILEGE ESCALATION VIA PROFILES.ROLE UPDATE
-- ----------------------------------------------------------------------------

-- Create trigger function preventing non-superadmin users from modifying profiles.role
CREATE OR REPLACE FUNCTION public.protect_profiles_role_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- If role is being changed
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Only service_role or active superadmin can change role
        IF NOT (
            current_user = 'service_role' OR
            public.is_super_admin() = TRUE
        ) THEN
            RAISE EXCEPTION 'SECURITY_VIOLATION: Unauthorized attempt to modify user role. Administrative role changes require Super Admin authorization.';
        END IF;
    END IF;

    -- Update timestamp
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profiles_role ON public.profiles;
CREATE TRIGGER trg_protect_profiles_role
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profiles_role_modification();

-- Harden profiles RLS policies: users can update own profile, but cannot escalate role
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id OR public.is_super_admin() = TRUE)
    WITH CHECK (auth.uid() = id OR public.is_super_admin() = TRUE);

-- ----------------------------------------------------------------------------
-- 2. REMEDIATE FINDING-02: PREVENT CLIENT-SIDE ORDERS WITH payment_status = 'PAID'
-- ----------------------------------------------------------------------------

-- Trigger function enforcing payment status integrity on orders
CREATE OR REPLACE FUNCTION public.enforce_order_payment_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- If an order is being inserted with 'PAID', non-admins/non-service-role must be rejected
    IF TG_OP = 'INSERT' THEN
        IF NEW.payment_status = 'PAID' AND NOT (
            current_user = 'service_role' OR
            public.is_super_admin() = TRUE OR
            public.is_admin() = TRUE
        ) THEN
            RAISE EXCEPTION 'SECURITY_VIOLATION: Orders cannot be inserted with PAID status by storefront clients. Orders must be initiated as PENDING or ADVANCE_PAID and verified by payment gateway.';
        END IF;
    END IF;

    -- If an order is being updated to 'PAID', require service_role, gateway webhook, or authorized admin
    IF TG_OP = 'UPDATE' THEN
        IF NEW.payment_status = 'PAID' AND OLD.payment_status != 'PAID' AND NOT (
            current_user = 'service_role' OR
            public.is_super_admin() = TRUE OR
            public.has_permission('orders.manage') = TRUE
        ) THEN
            RAISE EXCEPTION 'SECURITY_VIOLATION: Direct modification of payment_status to PAID is restricted to payment gateway webhooks and authorized administrators.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_order_payment_integrity ON public.orders;
CREATE TRIGGER trg_enforce_order_payment_integrity
    BEFORE INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_order_payment_integrity();

-- Refine orders INSERT policy
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders"
    ON public.orders FOR INSERT
    WITH CHECK (
        (auth.uid() = user_id OR user_id IS NULL OR public.is_admin() = TRUE OR public.is_super_admin() = TRUE)
        AND (
            -- Non-admins cannot insert orders as 'PAID'
            (public.is_admin() = TRUE OR public.is_super_admin() = TRUE)
            OR payment_status IN ('PENDING', 'ADVANCE_PAID')
        )
    );

-- ----------------------------------------------------------------------------
-- 3. REMEDIATE FINDING-03 & FINDING-04: SECURE SECURITY DEFINER FUNCTIONS
-- ----------------------------------------------------------------------------

-- Secure release_unpaid_whatsapp_or_abandoned_orders: Only service_role & Super Admin
REVOKE EXECUTE ON FUNCTION public.release_unpaid_whatsapp_or_abandoned_orders(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_unpaid_whatsapp_or_abandoned_orders(INTEGER) TO service_role;

-- Secure atomic_order_cancellation_restock: Restrict execution and enforce caller authorization
CREATE OR REPLACE FUNCTION public.atomic_order_cancellation_restock(
    p_order_id UUID,
    p_actor UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_movement RECORD;
    v_current_stock INTEGER;
    v_already_restocked BOOLEAN;
    v_restocked_count INTEGER := 0;
    v_order_status TEXT;
BEGIN
    -- Caller authorization check: Only service_role, Super Admin, or Order Manager
    IF NOT (
        current_user = 'service_role' OR
        public.is_super_admin() = TRUE OR
        public.has_permission('orders.manage') = TRUE
    ) THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: Access denied. Administrative permission (orders.manage) required to execute order cancellation restock.';
    END IF;

    -- Verify that the order is actually marked as CANCELLED
    SELECT fulfillment_status INTO v_order_status
    FROM public.orders
    WHERE id = p_order_id;

    IF v_order_status IS NULL THEN
        RAISE EXCEPTION 'Order % does not exist.', p_order_id;
    END IF;

    IF v_order_status != 'CANCELLED' THEN
        RAISE EXCEPTION 'Order % cannot be restocked because its fulfillment status is %, not CANCELLED.', p_order_id, v_order_status;
    END IF;

    -- Idempotency Check: Verify if order has already been restocked
    SELECT EXISTS (
        SELECT 1 FROM public.inventory_movements
        WHERE order_id = p_order_id AND movement_type = 'RETURN'
    ) INTO v_already_restocked;

    IF v_already_restocked THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Order items have already been restocked. Duplicate restock prevented.',
            'already_restocked', true
        );
    END IF;

    -- Iterate through original SALE movements for this order in sorted variant order
    FOR v_movement IN
        SELECT variant_id, ABS(quantity_change) AS qty
        FROM public.inventory_movements
        WHERE order_id = p_order_id AND movement_type = 'SALE'
        ORDER BY variant_id ASC
    LOOP
        -- Acquire row lock
        SELECT stock_quantity
        INTO v_current_stock
        FROM public.product_variants
        WHERE id = v_movement.variant_id
        FOR UPDATE;

        IF FOUND THEN
            -- Increment stock back
            UPDATE public.product_variants
            SET stock_quantity = stock_quantity + v_movement.qty,
                updated_at = NOW()
            WHERE id = v_movement.variant_id;

            -- Record RETURN movement
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
                v_movement.variant_id,
                'RETURN',
                v_movement.qty,
                v_current_stock,
                v_current_stock + v_movement.qty,
                p_order_id,
                'Restocked from cancelled order ' || p_order_id,
                p_actor,
                NOW()
            );

            v_restocked_count := v_restocked_count + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'items_restocked', v_restocked_count
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.atomic_order_cancellation_restock(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.atomic_order_cancellation_restock(UUID, UUID) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. REMEDIATE FINDING-07: RESTRICT admin_roles SELECT TO OWN ROLE & ADMINS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin_roles_select_policy" ON public.admin_roles;
CREATE POLICY "admin_roles_select_policy"
    ON public.admin_roles FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id
        OR public.is_admin() = TRUE
        OR public.is_super_admin() = TRUE
    );

-- Revoke anon SELECT from administrative role and permission tables
REVOKE SELECT ON public.admin_roles FROM anon;
REVOKE SELECT ON public.admin_accounts FROM anon;
REVOKE SELECT ON public.admin_permissions FROM anon;

-- ----------------------------------------------------------------------------
-- 5. REMEDIATE FINDING-09: HARDEN has_permission & ELIMINATE BLANKET ADMIN OVERRIDE
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_permission(required_perm TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Super Admin has all permissions implicitly
    IF public.is_super_admin() THEN
        RETURN TRUE;
    END IF;

    -- Check if suspended in admin_accounts
    IF EXISTS (
        SELECT 1 FROM public.admin_accounts
        WHERE id = auth.uid() AND status = 'suspended'
    ) THEN
        RETURN FALSE;
    END IF;

    -- Regular admins strictly require explicit permission grant in admin_permissions
    RETURN EXISTS (
        SELECT 1 FROM public.admin_permissions
        WHERE user_id = auth.uid() AND permission = required_perm
    );
END;
$$;

-- Harden catalog & CMS policies to enforce granular permissions without blanket is_admin bypass
DROP POLICY IF EXISTS "Admins full management on products" ON public.products;
CREATE POLICY "Admins full management on products"
    ON public.products FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.has_permission('catalog.products') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.has_permission('catalog.products') = TRUE);

DROP POLICY IF EXISTS "Admins full management on categories" ON public.categories;
CREATE POLICY "Admins full management on categories"
    ON public.categories FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.has_permission('catalog.categories') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.has_permission('catalog.categories') = TRUE);

DROP POLICY IF EXISTS "Admins full management on subcategories" ON public.subcategories;
CREATE POLICY "Admins full management on subcategories"
    ON public.subcategories FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.has_permission('catalog.categories') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.has_permission('catalog.categories') = TRUE);

DROP POLICY IF EXISTS "Admins full management on product_variants" ON public.product_variants;
CREATE POLICY "Admins full management on product_variants"
    ON public.product_variants FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.has_permission('catalog.products') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.has_permission('catalog.products') = TRUE);

DROP POLICY IF EXISTS "Admins full management on product_images" ON public.product_images;
CREATE POLICY "Admins full management on product_images"
    ON public.product_images FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.has_permission('catalog.products') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.has_permission('catalog.products') = TRUE);

DROP POLICY IF EXISTS "Admins full management on inventory_movements" ON public.inventory_movements;
CREATE POLICY "Admins full management on inventory_movements"
    ON public.inventory_movements FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.has_permission('inventory.manage') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.has_permission('inventory.manage') = TRUE);

DROP POLICY IF EXISTS "Admins full management on orders" ON public.orders;
CREATE POLICY "Admins full management on orders"
    ON public.orders FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.has_permission('orders.view') = TRUE OR public.has_permission('orders.manage') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.has_permission('orders.manage') = TRUE);

DROP POLICY IF EXISTS "Admins full management on order_items" ON public.order_items;
CREATE POLICY "Admins full management on order_items"
    ON public.order_items FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.has_permission('orders.manage') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.has_permission('orders.manage') = TRUE);

DROP POLICY IF EXISTS "Admins full management on homepage_banners" ON public.homepage_banners;
CREATE POLICY "Admins full management on homepage_banners"
    ON public.homepage_banners FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.has_permission('cms.hero_banners') = TRUE OR public.has_permission('cms.homepage') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.has_permission('cms.hero_banners') = TRUE OR public.has_permission('cms.homepage') = TRUE);

DROP POLICY IF EXISTS "Admins full management on category_banners" ON public.category_banners;
CREATE POLICY "Admins full management on category_banners"
    ON public.category_banners FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.has_permission('cms.category_banners') = TRUE OR public.has_permission('cms.homepage') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.has_permission('cms.category_banners') = TRUE OR public.has_permission('cms.homepage') = TRUE);

DROP POLICY IF EXISTS "Admins full management on store_settings" ON public.store_settings;
CREATE POLICY "Admins full management on store_settings"
    ON public.store_settings FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.has_permission('settings.manage') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.has_permission('settings.manage') = TRUE);

COMMIT;

NOTIFY pgrst, 'reload schema';
