-- ==============================================================================
-- MIGRATION: 20261027000004_atomic_inventory_operations.sql
-- DESCRIPTION: Concurrency-Safe, Deadlock-Free Atomic Inventory Operations
-- PROVIDES:
--   1. public.atomic_order_inventory_decrement(p_order_id, p_items, p_actor)
--   2. public.atomic_order_cancellation_restock(p_order_id, p_actor)
--   3. public.release_unpaid_whatsapp_or_abandoned_orders(p_timeout_minutes)
-- ==============================================================================

-- 1. ATOMIC ORDER INVENTORY DECREMENT WITH ROW LOCKING & IDEMPOTENCY
CREATE OR REPLACE FUNCTION public.atomic_order_inventory_decrement(
    p_order_id UUID,
    p_items JSONB, -- Array of { "variant_id": "UUID", "quantity": 2 }
    p_actor UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_item JSONB;
    v_variant_id UUID;
    v_requested_qty INTEGER;
    v_current_stock INTEGER;
    v_sku TEXT;
    v_processed_count INTEGER := 0;
    v_already_processed BOOLEAN;
BEGIN
    -- Idempotency Check: Prevent duplicate stock deductions for the same order
    SELECT EXISTS (
        SELECT 1 FROM public.inventory_movements
        WHERE order_id = p_order_id AND movement_type = 'SALE'
    ) INTO v_already_processed;

    IF v_already_processed THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Order inventory deduction already processed idempotently.',
            'already_processed', true
        );
    END IF;

    -- Sort items by variant_id to eliminate deadlock risk under high concurrent checkouts
    FOR v_item IN
        SELECT value FROM jsonb_array_elements(p_items)
        ORDER BY (value->>'variant_id') ASC
    LOOP
        v_variant_id := (v_item->>'variant_id')::UUID;
        v_requested_qty := (v_item->>'quantity')::INTEGER;

        IF v_requested_qty <= 0 THEN
            RAISE EXCEPTION 'ERR_INVALID_QUANTITY: Requested quantity must be positive';
        END IF;

        -- Acquire strict row-level exclusive lock (FOR UPDATE)
        SELECT stock_quantity, sku
        INTO v_current_stock, v_sku
        FROM public.product_variants
        WHERE id = v_variant_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'ERR_VARIANT_NOT_FOUND: Variant % does not exist', v_variant_id;
        END IF;

        -- Strict Stock Sufficiency Check
        IF v_current_stock < v_requested_qty THEN
            RAISE EXCEPTION 'ERR_INSUFFICIENT_STOCK: SKU % has % available, requested %',
                v_sku, v_current_stock, v_requested_qty;
        END IF;

        -- Atomic Decrement
        UPDATE public.product_variants
        SET stock_quantity = stock_quantity - v_requested_qty,
            updated_at = NOW()
        WHERE id = v_variant_id;

        -- Record Immutable Audit Movement
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
            v_variant_id,
            'SALE',
            -v_requested_qty,
            v_current_stock,
            v_current_stock - v_requested_qty,
            p_order_id,
            'Atomic deduction for verified order ' || p_order_id,
            p_actor,
            NOW()
        );

        v_processed_count := v_processed_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'items_deducted', v_processed_count
    );
END;
$$;

-- 2. ATOMIC ORDER CANCELLATION & IDEMPOTENT RESTOCKING
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
BEGIN
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

-- 3. EXPIRATION OF UNPAID WHATSAPP OR ABANDONED ORDERS
CREATE OR REPLACE FUNCTION public.release_unpaid_whatsapp_or_abandoned_orders(
    p_timeout_minutes INTEGER DEFAULT 1440 -- 24 hours default
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_released_orders INTEGER := 0;
BEGIN
    FOR v_order IN
        SELECT id, order_number
        FROM public.orders
        WHERE payment_status = 'PENDING'
          AND fulfillment_status NOT IN ('CANCELLED', 'DELIVERED')
          AND created_at < (NOW() - (p_timeout_minutes || ' minutes')::INTERVAL)
    LOOP
        -- Transition order status to CANCELLED
        UPDATE public.orders
        SET fulfillment_status = 'CANCELLED',
            admin_notes = COALESCE(admin_notes, '') || E'\n[System]: Automatically cancelled due to payment window expiration.',
            updated_at = NOW()
        WHERE id = v_order.id;

        -- Release stock atomically
        PERFORM public.atomic_order_cancellation_restock(v_order.id);

        v_released_orders := v_released_orders + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'orders_expired_and_restocked', v_released_orders
    );
END;
$$;
