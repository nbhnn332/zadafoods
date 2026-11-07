-- ============================================================================
-- ZaDa Foods — Application-Wide Database, Permission & Schema Repair Migration
-- Migration: 20261104000002_complete_database_permissions_and_schema_repair.sql
-- Description:
--   1. Ensures all required application tables exist (category_banners, admin_accounts, admin_permissions, festival_themes).
--   2. Adds soft-delete & tracking columns (is_active, deleted_at, background_color, etc.).
--   3. Hardens SECURITY DEFINER helper functions: is_admin(), is_super_admin(), has_permission().
--   4. Grants explicit PostgreSQL table privileges to 'authenticated', 'anon', and 'service_role'.
--   5. Hardens Row Level Security (RLS) policies across all 32 tables without infinite recursion.
--   6. Reloads PostgREST schema cache.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- SECTION 1: ENSURE REQUIRED EXTENSIONS & CORE TABLES EXIST
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1.1 Category Banners Table
CREATE TABLE IF NOT EXISTS public.category_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id TEXT,
    category_slug TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    eyebrow TEXT,
    background_color TEXT DEFAULT '#072C20',
    text_color TEXT DEFAULT '#FFFFFF',
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cat_banners_slug ON public.category_banners(category_slug);

-- 1.2 Admin Permissions & Status Tables
CREATE TABLE IF NOT EXISTS public.admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, permission)
);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_user ON public.admin_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_perm ON public.admin_permissions(permission);

CREATE TABLE IF NOT EXISTS public.admin_accounts (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    suspended_at TIMESTAMPTZ,
    suspended_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_accounts_status ON public.admin_accounts(status);

-- 1.3 Festival Themes Table
CREATE TABLE IF NOT EXISTS public.festival_themes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    banner_text TEXT,
    banner_subtext TEXT,
    banner_image_url TEXT,
    banner_cta_text TEXT,
    banner_cta_link TEXT,
    theme_colors JSONB,
    decorative_elements JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.4 Festival Promotional Campaigns Table
CREATE TABLE IF NOT EXISTS public.festival_promotional_campaigns (
    id TEXT PRIMARY KEY,
    theme_id TEXT REFERENCES public.festival_themes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subtitle TEXT,
    badge_text TEXT,
    coupon_code TEXT,
    target_url TEXT,
    image_url TEXT,
    display_location TEXT NOT NULL DEFAULT 'HOMEPAGE_HERO',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- SECTION 2: ADD SOFT-DELETE & TRACKING COLUMNS (FORWARD-ONLY)
-- ----------------------------------------------------------------------------
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.categories
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.subcategories
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.homepage_banners
    ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#072C20',
    ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#FFFFFF',
    ADD COLUMN IF NOT EXISTS badge_text TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON public.products(deleted_at);
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON public.categories(deleted_at);

-- ----------------------------------------------------------------------------
-- SECTION 3: HARDEN AUTHORIZATION FUNCTIONS (SECURITY DEFINER)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check if suspended in admin_accounts
    IF EXISTS (
        SELECT 1 FROM public.admin_accounts
        WHERE id = auth.uid() AND status = 'suspended'
    ) THEN
        RETURN FALSE;
    END IF;

    -- Check admin_roles
    IF EXISTS (
        SELECT 1 FROM public.admin_roles
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'superadmin', 'support_staff')
    ) THEN
        RETURN TRUE;
    END IF;

    -- Check profiles table
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'staff', 'superadmin')
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    user_email TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check if suspended in admin_accounts
    IF EXISTS (
        SELECT 1 FROM public.admin_accounts
        WHERE id = auth.uid() AND status = 'suspended'
    ) THEN
        RETURN FALSE;
    END IF;

    -- Check designated superadmin emails via auth.users
    SELECT LOWER(email) INTO user_email
    FROM auth.users
    WHERE id = auth.uid();

    IF user_email IN ('admin.zadafoods.superad@gmail.com', 'superadmin@zadafoods.com') THEN
        RETURN TRUE;
    END IF;

    -- Check admin_roles table
    IF EXISTS (
        SELECT 1 FROM public.admin_roles
        WHERE user_id = auth.uid() AND role = 'superadmin'
    ) THEN
        RETURN TRUE;
    END IF;

    -- Check profiles table
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND (role = 'superadmin' OR LOWER(email) IN ('admin.zadafoods.superad@gmail.com', 'superadmin@zadafoods.com'))
    );
END;
$$;

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

    -- Check if suspended
    IF EXISTS (
        SELECT 1 FROM public.admin_accounts
        WHERE id = auth.uid() AND status = 'suspended'
    ) THEN
        RETURN FALSE;
    END IF;

    -- Check granular permission grant
    IF EXISTS (
        SELECT 1 FROM public.admin_permissions
        WHERE user_id = auth.uid() AND permission = required_perm
    ) THEN
        RETURN TRUE;
    END IF;

    -- Standard fallback for verified administrators
    IF public.is_admin() THEN
        IF required_perm IN ('catalog.products', 'catalog.categories', 'cms.hero_banners', 'cms.category_banners', 'cms.sections', 'cms.reviews', 'orders.view', 'orders.manage', 'inventory.manage', 'dashboard.view') THEN
            RETURN TRUE;
        END IF;
    END IF;

    RETURN FALSE;
END;
$$;

-- Grant EXECUTE on functions to all roles
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(TEXT) TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- SECTION 4: EXPLICIT POSTGRESQL TABLE PRIVILEGES (LEAST PRIVILEGE)
-- ----------------------------------------------------------------------------

-- A. PUBLIC READ PRIVILEGES (Storefront & Visitors)
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.subcategories TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT SELECT ON public.product_images TO anon, authenticated;
GRANT SELECT ON public.combos TO anon, authenticated;
GRANT SELECT ON public.combo_items TO anon, authenticated;
GRANT SELECT ON public.pricing_rules TO anon, authenticated;
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT SELECT ON public.homepage_banners TO anon, authenticated;
GRANT SELECT ON public.category_banners TO anon, authenticated;
GRANT SELECT ON public.homepage_sections TO anon, authenticated;
GRANT SELECT ON public.festival_themes TO anon, authenticated;
GRANT SELECT ON public.festival_promotional_campaigns TO anon, authenticated;
GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT SELECT ON public.admin_roles TO anon, authenticated;
GRANT SELECT ON public.admin_accounts TO anon, authenticated;
GRANT SELECT ON public.admin_permissions TO anon, authenticated;

-- B. PUBLIC INSERT PRIVILEGES (Checkout, Lead Forms, Reviews)
GRANT INSERT ON public.bulk_enquiries TO anon, authenticated;
GRANT INSERT ON public.reviews TO authenticated;
GRANT INSERT ON public.orders TO anon, authenticated;
GRANT INSERT ON public.order_items TO anon, authenticated;
GRANT INSERT ON public.order_status_history TO anon, authenticated;
GRANT INSERT ON public.payments TO anon, authenticated;
GRANT INSERT ON public.coupon_usages TO anon, authenticated;

-- C. AUTHENTICATED USER PERSONAL PRIVILEGES (Addresses, Carts, Orders, Profiles)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlists TO authenticated;
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT SELECT ON public.order_items TO authenticated;
GRANT SELECT ON public.order_status_history TO authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT ON public.coupon_usages TO authenticated;

-- D. FULL MANAGEMENT PRIVILEGES FOR AUTHENTICATED ADMINS (GOVERNED BY RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subcategories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_movements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.combos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.combo_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homepage_banners TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_banners TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homepage_sections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.festival_themes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.festival_promotional_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bulk_enquiries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_permissions TO authenticated;

-- E. SERVICE ROLE FULL ACCESS
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ----------------------------------------------------------------------------
-- SECTION 5: ROW LEVEL SECURITY (RLS) POLICIES FOR ALL CORE TABLES
-- ----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festival_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festival_promotional_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- 5.1 PROFILES POLICIES
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin() = TRUE OR public.is_super_admin() = TRUE);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin() = TRUE OR public.is_super_admin() = TRUE)
    WITH CHECK (auth.uid() = id OR public.is_admin() = TRUE OR public.is_super_admin() = TRUE);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id OR public.is_admin() = TRUE OR public.is_super_admin() = TRUE);

-- 5.2 CATEGORIES POLICIES
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories"
    ON public.categories FOR SELECT
    USING (
        (is_active = TRUE AND (deleted_at IS NULL))
        OR public.is_admin() = TRUE
        OR public.is_super_admin() = TRUE
    );

DROP POLICY IF EXISTS "Admins full management on categories" ON public.categories;
CREATE POLICY "Admins full management on categories"
    ON public.categories FOR ALL
    TO authenticated
    USING (
        public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR public.has_permission('catalog.categories') = TRUE
    )
    WITH CHECK (
        public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR public.has_permission('catalog.categories') = TRUE
    );

-- 5.3 SUBCATEGORIES POLICIES
DROP POLICY IF EXISTS "Public can view active subcategories" ON public.subcategories;
CREATE POLICY "Public can view active subcategories"
    ON public.subcategories FOR SELECT
    USING (
        (is_active = TRUE AND (deleted_at IS NULL))
        OR public.is_admin() = TRUE
        OR public.is_super_admin() = TRUE
    );

DROP POLICY IF EXISTS "Admins full management on subcategories" ON public.subcategories;
CREATE POLICY "Admins full management on subcategories"
    ON public.subcategories FOR ALL
    TO authenticated
    USING (
        public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR public.has_permission('catalog.categories') = TRUE
    )
    WITH CHECK (
        public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR public.has_permission('catalog.categories') = TRUE
    );

-- 5.4 PRODUCTS POLICIES
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
        public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR public.has_permission('catalog.products') = TRUE
    )
    WITH CHECK (
        public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR public.has_permission('catalog.products') = TRUE
    );

-- 5.5 PRODUCT VARIANTS & IMAGES POLICIES
DROP POLICY IF EXISTS "Public can view product variants" ON public.product_variants;
CREATE POLICY "Public can view product variants" ON public.product_variants FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins full management on product_variants" ON public.product_variants;
CREATE POLICY "Admins full management on product_variants"
    ON public.product_variants FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('catalog.products') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('catalog.products') = TRUE);

DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;
CREATE POLICY "Public can view product images" ON public.product_images FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins full management on product_images" ON public.product_images;
CREATE POLICY "Admins full management on product_images"
    ON public.product_images FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('catalog.products') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('catalog.products') = TRUE);

-- 5.6 INVENTORY MOVEMENTS POLICIES
DROP POLICY IF EXISTS "Admins full management on inventory_movements" ON public.inventory_movements;
CREATE POLICY "Admins full management on inventory_movements"
    ON public.inventory_movements FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('inventory.manage') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('inventory.manage') = TRUE);

-- 5.7 ORDERS & ORDER ITEMS POLICIES
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin() = TRUE OR public.is_super_admin() = TRUE);

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR public.is_admin() = TRUE OR public.is_super_admin() = TRUE);

DROP POLICY IF EXISTS "Admins full management on orders" ON public.orders;
CREATE POLICY "Admins full management on orders"
    ON public.orders FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('orders.view') = TRUE OR public.has_permission('orders.manage') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('orders.manage') = TRUE);

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_admin() = TRUE OR public.is_super_admin() = TRUE)
        )
    );

DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
CREATE POLICY "Users can insert own order items"
    ON public.order_items FOR INSERT
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins full management on order_items" ON public.order_items;
CREATE POLICY "Admins full management on order_items"
    ON public.order_items FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('orders.manage') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('orders.manage') = TRUE);

-- 5.8 REVIEWS POLICIES
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews"
    ON public.reviews FOR SELECT
    USING (is_approved = TRUE OR public.is_admin() = TRUE OR public.is_super_admin() = TRUE);

DROP POLICY IF EXISTS "Authenticated users can submit reviews" ON public.reviews;
CREATE POLICY "Authenticated users can submit reviews"
    ON public.reviews FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR public.is_admin() = TRUE OR public.is_super_admin() = TRUE);

DROP POLICY IF EXISTS "Admins full management on reviews" ON public.reviews;
CREATE POLICY "Admins full management on reviews"
    ON public.reviews FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('cms.reviews') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('cms.reviews') = TRUE);

-- 5.9 HOMEPAGE & CATEGORY BANNERS POLICIES
DROP POLICY IF EXISTS "Public can view active homepage banners" ON public.homepage_banners;
CREATE POLICY "Public can view active homepage banners"
    ON public.homepage_banners FOR SELECT
    USING (is_active = TRUE OR public.is_admin() = TRUE OR public.is_super_admin() = TRUE);

DROP POLICY IF EXISTS "Admins full management on homepage_banners" ON public.homepage_banners;
CREATE POLICY "Admins full management on homepage_banners"
    ON public.homepage_banners FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('cms.hero_banners') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('cms.hero_banners') = TRUE);

DROP POLICY IF EXISTS "Public can view active category banners" ON public.category_banners;
CREATE POLICY "Public can view active category banners"
    ON public.category_banners FOR SELECT
    USING (is_active = TRUE OR public.is_admin() = TRUE OR public.is_super_admin() = TRUE);

DROP POLICY IF EXISTS "Admins full management on category_banners" ON public.category_banners;
CREATE POLICY "Admins full management on category_banners"
    ON public.category_banners FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('cms.category_banners') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('cms.category_banners') = TRUE);

-- 5.10 BULK ENQUIRIES POLICIES
DROP POLICY IF EXISTS "Public can submit bulk enquiries" ON public.bulk_enquiries;
CREATE POLICY "Public can submit bulk enquiries"
    ON public.bulk_enquiries FOR INSERT
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins full management on bulk_enquiries" ON public.bulk_enquiries;
CREATE POLICY "Admins full management on bulk_enquiries"
    ON public.bulk_enquiries FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('enquiries.manage') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('enquiries.manage') = TRUE);

-- 5.11 COUPONS & COMBOS & PRICING RULES
DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
CREATE POLICY "Public can view active coupons" ON public.coupons FOR SELECT USING (is_active = TRUE OR public.is_admin() = TRUE OR public.is_super_admin() = TRUE);

DROP POLICY IF EXISTS "Admins full management on coupons" ON public.coupons;
CREATE POLICY "Admins full management on coupons"
    ON public.coupons FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('promotions.coupons') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('promotions.coupons') = TRUE);

DROP POLICY IF EXISTS "Public can view active combos" ON public.combos;
CREATE POLICY "Public can view active combos" ON public.combos FOR SELECT USING (is_active = TRUE OR public.is_admin() = TRUE OR public.is_super_admin() = TRUE);

DROP POLICY IF EXISTS "Admins full management on combos" ON public.combos;
CREATE POLICY "Admins full management on combos"
    ON public.combos FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('promotions.combos') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('promotions.combos') = TRUE);

DROP POLICY IF EXISTS "Public can view combo items" ON public.combo_items;
CREATE POLICY "Public can view combo items" ON public.combo_items FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins full management on combo_items" ON public.combo_items;
CREATE POLICY "Admins full management on combo_items"
    ON public.combo_items FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('promotions.combos') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('promotions.combos') = TRUE);

DROP POLICY IF EXISTS "Public can view active pricing rules" ON public.pricing_rules;
CREATE POLICY "Public can view active pricing rules" ON public.pricing_rules FOR SELECT USING (is_active = TRUE OR public.is_admin() = TRUE OR public.is_super_admin() = TRUE);

DROP POLICY IF EXISTS "Admins full management on pricing_rules" ON public.pricing_rules;
CREATE POLICY "Admins full management on pricing_rules"
    ON public.pricing_rules FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('promotions.pricing_rules') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('promotions.pricing_rules') = TRUE);

-- 5.12 STORE SETTINGS & HOMEPAGE SECTIONS
DROP POLICY IF EXISTS "Public can view store settings" ON public.store_settings;
CREATE POLICY "Public can view store settings" ON public.store_settings FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins full management on store_settings" ON public.store_settings;
CREATE POLICY "Admins full management on store_settings"
    ON public.store_settings FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('settings.manage') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('settings.manage') = TRUE);

DROP POLICY IF EXISTS "Public can view active homepage sections" ON public.homepage_sections;
CREATE POLICY "Public can view active homepage sections" ON public.homepage_sections FOR SELECT USING (is_active = TRUE OR public.is_admin() = TRUE OR public.is_super_admin() = TRUE);

DROP POLICY IF EXISTS "Admins full management on homepage_sections" ON public.homepage_sections;
CREATE POLICY "Admins full management on homepage_sections"
    ON public.homepage_sections FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('cms.sections') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('cms.sections') = TRUE);

-- 5.13 FESTIVAL THEMES POLICIES
DROP POLICY IF EXISTS "Public can view active festival themes" ON public.festival_themes;
CREATE POLICY "Public can view active festival themes" ON public.festival_themes FOR SELECT USING (is_active = TRUE OR public.is_admin() = TRUE OR public.is_super_admin() = TRUE);

DROP POLICY IF EXISTS "Admins full management on festival_themes" ON public.festival_themes;
CREATE POLICY "Admins full management on festival_themes"
    ON public.festival_themes FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('cms.festivals') = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('cms.festivals') = TRUE);

-- 5.14 AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "Admins view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins view audit logs"
    ON public.admin_audit_logs FOR SELECT
    TO authenticated
    USING (public.is_super_admin() = TRUE OR public.is_admin() = TRUE OR public.has_permission('audit_logs.view') = TRUE);

DROP POLICY IF EXISTS "System insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "System insert audit logs"
    ON public.admin_audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin() = TRUE OR public.is_super_admin() = TRUE);

-- 5.15 ADMIN ROLES & ACCOUNTS & PERMISSIONS (SUPER ADMIN GOVERNED)
DROP POLICY IF EXISTS "admin_roles_select_policy" ON public.admin_roles;
CREATE POLICY "admin_roles_select_policy"
    ON public.admin_roles FOR SELECT
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Superadmins manage admin roles" ON public.admin_roles;
CREATE POLICY "Superadmins manage admin roles"
    ON public.admin_roles FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE);

DROP POLICY IF EXISTS "Admins can view admin accounts" ON public.admin_accounts;
CREATE POLICY "Admins can view admin accounts"
    ON public.admin_accounts FOR SELECT
    TO authenticated
    USING (public.is_admin() = TRUE OR public.is_super_admin() = TRUE);

DROP POLICY IF EXISTS "Superadmins manage admin accounts" ON public.admin_accounts;
CREATE POLICY "Superadmins manage admin accounts"
    ON public.admin_accounts FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE);

DROP POLICY IF EXISTS "Admins can view permissions" ON public.admin_permissions;
CREATE POLICY "Admins can view permissions"
    ON public.admin_permissions FOR SELECT
    TO authenticated
    USING (public.is_admin() = TRUE OR public.is_super_admin() = TRUE);

DROP POLICY IF EXISTS "Superadmins manage permissions" ON public.admin_permissions;
CREATE POLICY "Superadmins manage permissions"
    ON public.admin_permissions FOR ALL
    TO authenticated
    USING (public.is_super_admin() = TRUE)
    WITH CHECK (public.is_super_admin() = TRUE);

COMMIT;

-- ----------------------------------------------------------------------------
-- SECTION 6: RELOAD POSTGREST SCHEMA CACHE
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
