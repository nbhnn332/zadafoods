-- Migration: 20261028000001_admin_homepage_banners_rls.sql
-- Description: Full CRUD Admin Policies for Homepage Banners & Sections CMS

-- 1. Ensure RLS is enabled
ALTER TABLE IF EXISTS public.homepage_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.homepage_sections ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if already defined
DROP POLICY IF EXISTS "Admins full management on homepage_banners" ON public.homepage_banners;
DROP POLICY IF EXISTS "Admins full management on homepage_sections" ON public.homepage_sections;

-- 3. Create comprehensive admin CRUD policies
CREATE POLICY "Admins full management on homepage_banners"
    ON public.homepage_banners FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins full management on homepage_sections"
    ON public.homepage_sections FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4. Preserve public access for storefront rendering
DROP POLICY IF EXISTS "Public can view active homepage banners" ON public.homepage_banners;
CREATE POLICY "Public can view active homepage banners"
    ON public.homepage_banners FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Public can view active homepage sections" ON public.homepage_sections;
CREATE POLICY "Public can view active homepage sections"
    ON public.homepage_sections FOR SELECT
    USING (is_active = TRUE OR public.is_admin());
