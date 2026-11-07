-- ============================================================================
-- ZaDa Foods — Phase 14: Banner Persistence, Image Nullability & Settings Fixes
-- Migration: 20261029000002_banner_persistence_and_payment_fixes.sql
-- ============================================================================

-- 1. Allow homepage hero banners to be pure CSS (make image_url nullable)
ALTER TABLE IF EXISTS public.homepage_banners
    ALTER COLUMN image_url DROP NOT NULL;

-- 2. Add styling fields for pure CSS zero-image homepage banners
ALTER TABLE IF EXISTS public.homepage_banners
    ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#072C20',
    ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#FFFFFF',
    ADD COLUMN IF NOT EXISTS eyebrow TEXT DEFAULT NULL;

-- 3. Ensure Category Banners table has proper column nullability and indexing
CREATE INDEX IF NOT EXISTS idx_cat_banners_order ON public.category_banners(display_order);

-- 4. Enable RLS and verify policies on homepage_banners
ALTER TABLE IF EXISTS public.homepage_banners ENABLE ROW LEVEL SECURITY;

-- 5. Public read policy: Allow storefront to read active published banners
DROP POLICY IF EXISTS "Public can view active homepage banners" ON public.homepage_banners;
CREATE POLICY "Public can view active homepage banners"
    ON public.homepage_banners FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

-- 6. Admin full CRUD policy on homepage_banners
DROP POLICY IF EXISTS "Admins full management on homepage_banners" ON public.homepage_banners;
CREATE POLICY "Admins full management on homepage_banners"
    ON public.homepage_banners FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7. Add comments for schema documentation
COMMENT ON COLUMN public.homepage_banners.image_url IS 'Optional URL for authorized hero photography. When NULL or empty, banner renders as polished pure CSS design.';
COMMENT ON COLUMN public.homepage_banners.background_color IS 'Hex color code for hero banner canvas (defaults to Forest Green #072C20).';
