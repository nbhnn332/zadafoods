-- ==============================================================================
-- MIGRATION: 20261027000005_scheduled_order_maintenance.sql
-- DESCRIPTION: Function Security Hardening, Privilege Grants & pg_cron Automation
-- PROVIDES:
--   1. Privilege lockdown (REVOKE EXECUTE FROM PUBLIC on stored procedures)
--   2. Explicit execution grants for authenticated and service_role callers
--   3. Caller verification inside restock stored procedures
--   4. Automated pg_cron scheduling for unpaid/abandoned order stock releases
-- ==============================================================================

-- 1. HARDEN FUNCTION PERMISSIONS (Eliminate unrestricted PUBLIC access)
REVOKE ALL ON FUNCTION public.atomic_order_inventory_decrement(UUID, JSONB, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.atomic_order_cancellation_restock(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_unpaid_whatsapp_or_abandoned_orders(INTEGER) FROM PUBLIC;

-- 2. GRANT AUTHORIZED ROLES
-- Order inventory decrement is allowed for authenticated users and backend service_role
GRANT EXECUTE ON FUNCTION public.atomic_order_inventory_decrement(UUID, JSONB, UUID) TO authenticated, service_role;

-- Restocking and automated expiration are strictly restricted to admin/service_role
GRANT EXECUTE ON FUNCTION public.atomic_order_cancellation_restock(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.release_unpaid_whatsapp_or_abandoned_orders(INTEGER) TO service_role;

-- 3. REINFORCE CALLER AUTHORIZATION INSIDE RESTOCK PROCEDURE
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
    v_caller_role TEXT;
BEGIN
    -- Verify caller authorization: Caller must be an admin, superadmin, or service_role
    v_caller_role := auth.role();
    IF v_caller_role != 'service_role' AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED: Restocking requires administrative or service-role privileges.';
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

-- 4. CONFIGURE PG_CRON SCHEDULED JOB FOR ABANDONED ORDERS
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron'
    ) THEN
        CREATE EXTENSION IF NOT EXISTS pg_cron;

        -- Unschedule prior instance if present to maintain repeatability
        IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'release_abandoned_orders_hourly') THEN
            PERFORM cron.unschedule('release_abandoned_orders_hourly');
        END IF;

        -- Schedule hourly release of orders unpaid after 24 hours (1440 minutes)
        PERFORM cron.schedule(
            'release_abandoned_orders_hourly',
            '0 * * * *',
            'SELECT public.release_unpaid_whatsapp_or_abandoned_orders(1440);'
        );
    END IF;
END;
$$;
