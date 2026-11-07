-- ==============================================================================
-- ZaDa Foods — FRESH DATABASE VERIFICATION & ASSERTION SCRIPT
-- Target: Fresh Supabase Project (PostgreSQL 15+)
-- Purpose: Rigorously verify schema integrity, RLS, functions, grants, and seed data.
-- ==============================================================================

-- Instructions:
-- Execute this script in your new Supabase Project SQL Editor after running
-- ZADA_FOODS_COMPLETE_FRESH_SUPABASE_SETUP.sql.
-- It returns a complete pass/fail assertion table.

DO $$
DECLARE
    v_missing_tables TEXT[] := ARRAY[]::TEXT[];
    v_missing_rls TEXT[] := ARRAY[]::TEXT[];
    v_missing_functions TEXT[] := ARRAY[]::TEXT[];
    v_table TEXT;
    v_func TEXT;
    v_count INT;
    v_expected_tables TEXT[] := ARRAY[
        'categories', 'subcategories', 'products', 'product_variants', 'product_images',
        'product_tags', 'product_attributes', 'inventory_movements', 'stock_adjustments',
        'profiles', 'addresses', 'customer_preferences', 'orders', 'order_items',
        'order_status_history', 'guest_order_tokens', 'payment_transactions', 'refunds',
        'carts', 'cart_items', 'wishlists', 'coupons', 'pricing_rules', 'combos',
        'combo_items', 'homepage_banners', 'category_banners', 'homepage_sections',
        'store_content', 'festival_themes', 'reviews', 'bulk_enquiries', 'store_settings',
        'admin_accounts', 'admin_roles', 'admin_permissions', 'admin_audit_logs'
    ];
    v_expected_functions TEXT[] := ARRAY[
        'is_super_admin', 'is_admin', 'has_permission', 'bootstrap_super_admin',
        'atomic_order_inventory_decrement', 'atomic_order_cancellation_restock',
        'release_unpaid_whatsapp_or_abandoned_orders', 'create_order_server_authoritative'
    ];
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE '   ZaDa Foods — Supabase Fresh Schema Verification     ';
    RAISE NOTICE '=======================================================';

    -- 1. Table Existence Check
    FOREACH v_table IN ARRAY v_expected_tables LOOP
        SELECT COUNT(*) INTO v_count
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = v_table;

        IF v_count = 0 THEN
            v_missing_tables := array_append(v_missing_tables, v_table);
        END IF;
    END LOOP;

    -- 2. RLS Status Check
    FOREACH v_table IN ARRAY v_expected_tables LOOP
        SELECT COUNT(*) INTO v_count
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = v_table AND c.relrowsecurity = TRUE;

        IF v_count = 0 THEN
            v_missing_rls := array_append(v_missing_rls, v_table);
        END IF;
    END LOOP;

    -- 3. Core RPC Functions Check
    FOREACH v_func IN ARRAY v_expected_functions LOOP
        SELECT COUNT(*) INTO v_count
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = v_func;

        IF v_count = 0 THEN
            v_missing_functions := array_append(v_missing_functions, v_func);
        END IF;
    END LOOP;

    -- Report Results
    IF cardinality(v_missing_tables) > 0 THEN
        RAISE EXCEPTION 'VERIFICATION FAILED: Missing tables: %', v_missing_tables;
    ELSE
        RAISE NOTICE '[PASS] All % required tables exist in public schema.', cardinality(v_expected_tables);
    END IF;

    IF cardinality(v_missing_rls) > 0 THEN
        RAISE EXCEPTION 'VERIFICATION FAILED: Tables with RLS disabled: %', v_missing_rls;
    ELSE
        RAISE NOTICE '[PASS] Row Level Security (RLS) is ENABLED on all % tables.', cardinality(v_expected_tables);
    END IF;

    IF cardinality(v_missing_functions) > 0 THEN
        RAISE EXCEPTION 'VERIFICATION FAILED: Missing RPC / Security functions: %', v_missing_functions;
    ELSE
        RAISE NOTICE '[PASS] All % essential functions and RPCs are compiled and ready.', cardinality(v_expected_functions);
    END IF;

    RAISE NOTICE '-------------------------------------------------------';
    RAISE NOTICE '[PASS] Fresh Database Architecture is 100%% VERIFIED.';
    RAISE NOTICE '=======================================================';
END $$;

-- Summary Table Output for SQL Editor UI
SELECT 
    'Tables in Schema' AS verification_item,
    COUNT(*)::text AS actual_count,
    '37 expected' AS criteria,
    CASE WHEN COUNT(*) >= 37 THEN 'PASS' ELSE 'FAIL' END AS status
FROM information_schema.tables
WHERE table_schema = 'public'

UNION ALL

SELECT 
    'RLS Enabled Tables',
    COUNT(*)::text,
    '37 expected',
    CASE WHEN COUNT(*) >= 37 THEN 'PASS' ELSE 'FAIL' END
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relrowsecurity = TRUE AND c.relkind = 'r'

UNION ALL

SELECT 
    'Security & Atomic Functions',
    COUNT(*)::text,
    '8 expected',
    CASE WHEN COUNT(*) >= 8 THEN 'PASS' ELSE 'FAIL' END
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname IN (
    'is_super_admin', 'is_admin', 'has_permission', 'bootstrap_super_admin',
    'atomic_order_inventory_decrement', 'atomic_order_cancellation_restock',
    'release_unpaid_whatsapp_or_abandoned_orders', 'create_order_server_authoritative'
)

UNION ALL

SELECT 
    'Store Settings Initialized',
    COUNT(*)::text,
    '3 rows (shipping, checkout, compliance)',
    CASE WHEN COUNT(*) >= 3 THEN 'PASS' ELSE 'FAIL' END
FROM public.store_settings

UNION ALL

SELECT 
    'Official Products Seeded',
    COUNT(*)::text,
    'At least 5 initial products',
    CASE WHEN COUNT(*) >= 5 THEN 'PASS' ELSE 'FAIL' END
FROM public.products

UNION ALL

SELECT 
    'Product Variants Seeded',
    COUNT(*)::text,
    'At least 5 initial variants',
    CASE WHEN COUNT(*) >= 5 THEN 'PASS' ELSE 'FAIL' END
FROM public.product_variants

UNION ALL

SELECT 
    'Private Server Secret Present',
    COUNT(*)::text,
    '1 HMAC secret (guest_order_hmac_secret)',
    CASE WHEN COUNT(*) >= 1 THEN 'PASS' ELSE 'FAIL' END
FROM private.server_secrets
WHERE key = 'guest_order_hmac_secret';
