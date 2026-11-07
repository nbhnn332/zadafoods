-- ==============================================================================
-- ZaDa Foods — Phase 24: Complete Commerce Workflow & Admin Permissions Fix
-- Staging Database: qjuvwrjpbwxkqyvffbcy
-- ==============================================================================

BEGIN;

-- 1. CONFIRM STAGING SUPER ADMIN USER IN AUTH.USERS
-- (Note: confirmed_at is a generated column in Supabase auth.users, only email_confirmed_at is updated)
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE LOWER(email) IN ('superadmin@zadafoods.com', 'admin.zadafoods.superad@gmail.com');

-- 2. ENSURE SUPER ADMIN ACTIVE STATUS IN ADMIN_ACCOUNTS
UPDATE public.admin_accounts
SET role = 'superadmin', is_active = TRUE
WHERE LOWER(email) IN ('superadmin@zadafoods.com', 'admin.zadafoods.superad@gmail.com');

-- 3. GRANT TABLE PRIVILEGES TO AUTHENTICATED AND ANON
-- authenticated gets full CRUD; RLS policies govern who can perform which action.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.combos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.combo_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homepage_banners TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_banners TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;

-- anon gets SELECT for public storefront rendering
GRANT SELECT ON public.pricing_rules TO anon;
GRANT SELECT ON public.combos TO anon;
GRANT SELECT ON public.combo_items TO anon;
GRANT SELECT ON public.homepage_banners TO anon;
GRANT SELECT ON public.category_banners TO anon;
GRANT SELECT ON public.coupons TO anon;
GRANT SELECT ON public.reviews TO anon;

-- Customers (both anon and authenticated) can submit reviews for moderation
GRANT INSERT ON public.reviews TO anon, authenticated;

-- 4. ENABLE RLS ON ALL COMMERCE & CMS TABLES
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 5. PRICING RULES POLICIES
DROP POLICY IF EXISTS "Public can view active pricing rules" ON public.pricing_rules;
DROP POLICY IF EXISTS "Admins full management on pricing_rules" ON public.pricing_rules;

CREATE POLICY "Public can view active pricing rules"
    ON public.pricing_rules FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE OR public.is_super_admin() = TRUE OR public.is_admin() = TRUE);

CREATE POLICY "Admins full management on pricing_rules"
    ON public.pricing_rules FOR ALL
    TO authenticated
    USING (
        public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR public.has_permission('promotions.pricing_rules') = TRUE
        OR public.has_permission('pricing_rules.manage') = TRUE
    )
    WITH CHECK (
        public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR public.has_permission('promotions.pricing_rules') = TRUE
        OR public.has_permission('pricing_rules.manage') = TRUE
    );

-- 6. COMBOS & COMBO ITEMS POLICIES
DROP POLICY IF EXISTS "Public can view active combos" ON public.combos;
DROP POLICY IF EXISTS "Admins full management on combos" ON public.combos;

CREATE POLICY "Public can view active combos"
    ON public.combos FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE OR public.is_super_admin() = TRUE OR public.is_admin() = TRUE);

CREATE POLICY "Admins full management on combos"
    ON public.combos FOR ALL
    TO authenticated
    USING (
        public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR public.has_permission('promotions.combos') = TRUE
        OR public.has_permission('combos.manage') = TRUE
    )
    WITH CHECK (
        public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR public.has_permission('promotions.combos') = TRUE
        OR public.has_permission('combos.manage') = TRUE
    );

DROP POLICY IF EXISTS "Public can view combo items" ON public.combo_items;
DROP POLICY IF EXISTS "Admins full management on combo_items" ON public.combo_items;

CREATE POLICY "Public can view combo items"
    ON public.combo_items FOR SELECT
    TO anon, authenticated
    USING (
        public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR EXISTS (
            SELECT 1 FROM public.combos c
            WHERE c.id = combo_items.combo_id AND (c.is_active = TRUE OR public.is_admin() = TRUE)
        )
    );

CREATE POLICY "Admins full management on combo_items"
    ON public.combo_items FOR ALL
    TO authenticated
    USING (
        public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR public.has_permission('promotions.combos') = TRUE
        OR public.has_permission('combos.manage') = TRUE
    )
    WITH CHECK (
        public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR public.has_permission('promotions.combos') = TRUE
        OR public.has_permission('combos.manage') = TRUE
    );

-- 7. HOMEPAGE BANNERS POLICIES
DROP POLICY IF EXISTS "Public can view active homepage banners" ON public.homepage_banners;
DROP POLICY IF EXISTS "Admins full management on homepage_banners" ON public.homepage_banners;

CREATE POLICY "Public can view active homepage banners"
    ON public.homepage_banners FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE OR public.is_super_admin() = TRUE OR public.is_admin() = TRUE);

CREATE POLICY "Admins full management on homepage_banners"
    ON public.homepage_banners FOR ALL
    TO authenticated
    USING (
        public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR public.has_permission('cms.homepage') = TRUE
        OR public.has_permission('cms.hero_banners') = TRUE
    )
    WITH CHECK (
        public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR public.has_permission('cms.homepage') = TRUE
        OR public.has_permission('cms.hero_banners') = TRUE
    );

-- 8. CATEGORY BANNERS POLICIES
DROP POLICY IF EXISTS "Public can view active category banners" ON public.category_banners;
DROP POLICY IF EXISTS "Admins full management on category_banners" ON public.category_banners;

CREATE POLICY "Public can view active category banners"
    ON public.category_banners FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE OR public.is_super_admin() = TRUE OR public.is_admin() = TRUE);

CREATE POLICY "Admins full management on category_banners"
    ON public.category_banners FOR ALL
    TO authenticated
    USING (
        public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR public.has_permission('cms.category_banners') = TRUE
        OR public.has_permission('cms.homepage') = TRUE
    )
    WITH CHECK (
        public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR public.has_permission('cms.category_banners') = TRUE
        OR public.has_permission('cms.homepage') = TRUE
    );

-- 9. COUPONS POLICIES
DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins full management on coupons" ON public.coupons;

CREATE POLICY "Public can view active coupons"
    ON public.coupons FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE OR public.is_super_admin() = TRUE OR public.is_admin() = TRUE);

CREATE POLICY "Admins full management on coupons"
    ON public.coupons FOR ALL
    TO authenticated
    USING (
        public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR public.has_permission('promotions.coupons') = TRUE
        OR public.has_permission('coupons.manage') = TRUE
    )
    WITH CHECK (
        public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR public.has_permission('promotions.coupons') = TRUE
        OR public.has_permission('coupons.manage') = TRUE
    );

-- 10. REVIEWS POLICIES
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Customers can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins full management on reviews" ON public.reviews;

CREATE POLICY "Public can view approved reviews"
    ON public.reviews FOR SELECT
    TO anon, authenticated
    USING (
        is_approved = TRUE
        OR public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    );

CREATE POLICY "Customers can insert reviews"
    ON public.reviews FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        (auth.uid() IS NULL OR auth.uid() = user_id)
        OR public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
    );

CREATE POLICY "Admins full management on reviews"
    ON public.reviews FOR ALL
    TO authenticated
    USING (
        public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR public.has_permission('reviews.moderate') = TRUE
    )
    WITH CHECK (
        public.is_super_admin() = TRUE
        OR public.is_admin() = TRUE
        OR public.has_permission('reviews.moderate') = TRUE
    );

COMMIT;

NOTIFY pgrst, 'reload schema';
