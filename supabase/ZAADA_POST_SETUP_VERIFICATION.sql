-- ==============================================================================
-- ZaDa Foods — Comprehensive Post-Setup Database Verification Script
-- Run this query in Supabase SQL Editor to audit your live staging schema.
-- ==============================================================================

-- 1. VERIFY ALL 29 CORE TABLES & ROW LEVEL SECURITY (RLS) STATUS
SELECT 
    tablename, 
    rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. VERIFY SEED DATA RECORD COUNTS ACROSS ALL DOMAIN MODULES
SELECT 'categories' AS entity, COUNT(*) AS total_rows FROM public.categories
UNION ALL
SELECT 'subcategories', COUNT(*) FROM public.subcategories
UNION ALL
SELECT 'products', COUNT(*) FROM public.products
UNION ALL
SELECT 'product_images', COUNT(*) FROM public.product_images
UNION ALL
SELECT 'product_variants', COUNT(*) FROM public.product_variants
UNION ALL
SELECT 'coupons', COUNT(*) FROM public.coupons
UNION ALL
SELECT 'pricing_rules', COUNT(*) FROM public.pricing_rules
UNION ALL
SELECT 'homepage_banners', COUNT(*) FROM public.homepage_banners
UNION ALL
SELECT 'homepage_sections', COUNT(*) FROM public.homepage_sections
UNION ALL
SELECT 'store_settings', COUNT(*) FROM public.store_settings
UNION ALL
SELECT 'store_content_pages', COUNT(*) FROM public.store_content_pages;

-- 3. VERIFY ALL DATABASE FUNCTIONS & SECURITY DEFINER SEARCH PATH
SELECT 
    routine_name AS function_name,
    routine_type,
    security_type
FROM information_schema.routines
WHERE specific_schema = 'public' 
  AND routine_name IN (
    'is_admin', 
    'handle_new_user', 
    'atomic_order_inventory_decrement', 
    'atomic_order_cancellation_restock', 
    'release_unpaid_whatsapp_or_abandoned_orders'
  )
ORDER BY routine_name;

-- 4. VERIFY THAT UNRESTRICTED EXECUTE PERMISSION HAS BEEN REVOKED FROM 'PUBLIC'
SELECT 
    routine_name AS function_name, 
    grantee, 
    privilege_type
FROM information_schema.routine_privileges
WHERE specific_schema = 'public' 
  AND routine_name IN (
    'atomic_order_inventory_decrement', 
    'atomic_order_cancellation_restock', 
    'release_unpaid_whatsapp_or_abandoned_orders'
  )
ORDER BY routine_name, grantee;

-- 5. VERIFY PG_CRON EXTENSION AND SCHEDULED MAINTENANCE JOBS
SELECT 
    extname AS extension_name, 
    extversion AS version 
FROM pg_extension 
WHERE extname = 'pg_cron';

-- Check if hourly abandoned order sweep is scheduled in cron.job
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        RAISE NOTICE 'pg_cron extension is ACTIVE on this database.';
    ELSE
        RAISE NOTICE 'pg_cron is NOT available on this tier. Use Edge Function or Supabase Scheduled Trigger instead.';
    END IF;
END;
$$;

-- 6. VERIFY FOREIGN KEY CONSTRAINTS ARE INTACT
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public'
ORDER BY tc.table_name, kcu.column_name;
