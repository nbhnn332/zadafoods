-- ============================================================================
-- ZaDa Foods — Critical Fix: Product and Category Deletion & Permissions
-- Migration: 20261104000001_fix_product_and_category_deletion_and_grants.sql
-- ============================================================================

-- 1. ADD SOFT-DELETE AND ACTIVE STATUS COLUMNS (IF NOT PRESENT)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON public.products(deleted_at);
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON public.categories(deleted_at);

-- 2. ENSURE EXPLICIT POSTGRESQL PRIVILEGES ON CORE CATALOG TABLES
-- Grant SELECT to anon and authenticated
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.subcategories TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT SELECT ON public.product_images TO anon, authenticated;

-- Grant FULL management (SELECT, INSERT, UPDATE, DELETE) to authenticated (governed by RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subcategories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;

-- Grant ALL to service_role
GRANT ALL ON public.categories TO service_role;
GRANT ALL ON public.subcategories TO service_role;
GRANT ALL ON public.products TO service_role;
GRANT ALL ON public.product_variants TO service_role;
GRANT ALL ON public.product_images TO service_role;

-- 3. HARDEN RLS POLICIES FOR PRODUCTS
DROP POLICY IF EXISTS "Public can view published products" ON public.products;
CREATE POLICY "Public can view published products"
    ON public.products FOR SELECT
    USING (
        (is_published = TRUE AND is_active = TRUE AND deleted_at IS NULL)
        OR public.is_admin() = TRUE
        OR public.is_super_admin() = TRUE
    );

DROP POLICY IF EXISTS "Admins full management on products" ON public.products;
CREATE POLICY "Admins full management on products"
    ON public.products FOR ALL
    TO authenticated
    USING (
        public.is_admin() = TRUE
        OR public.is_super_admin() = TRUE
        OR public.has_permission('catalog.products') = TRUE
    )
    WITH CHECK (
        public.is_admin() = TRUE
        OR public.is_super_admin() = TRUE
        OR public.has_permission('catalog.products') = TRUE
    );

-- 4. HARDEN RLS POLICIES FOR CATEGORIES
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories"
    ON public.categories FOR SELECT
    USING (
        (is_active = TRUE AND deleted_at IS NULL)
        OR public.is_admin() = TRUE
        OR public.is_super_admin() = TRUE
    );

DROP POLICY IF EXISTS "Admins full management on categories" ON public.categories;
CREATE POLICY "Admins full management on categories"
    ON public.categories FOR ALL
    TO authenticated
    USING (
        public.is_admin() = TRUE
        OR public.is_super_admin() = TRUE
        OR public.has_permission('catalog.categories') = TRUE
    )
    WITH CHECK (
        public.is_admin() = TRUE
        OR public.is_super_admin() = TRUE
        OR public.has_permission('catalog.categories') = TRUE
    );

-- 5. RELOAD POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
