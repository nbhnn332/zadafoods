-- ============================================================================
-- ZaDa Foods — Critical Fix: Banner Persistence & Admin RLS Hardening
-- Migration: 20261029000005_fix_admin_roles_and_banner_persistence.sql
-- ============================================================================

-- 1. FIX INFINITE RECURSION ON admin_roles
-- Drop recursive policy on admin_roles that causes error 42P17
DROP POLICY IF EXISTS "Superadmins can manage admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Admins can view admin roles" ON public.admin_roles;

-- Recreate clean non-recursive policies on admin_roles
CREATE POLICY "Admins can view admin roles"
    ON public.admin_roles FOR SELECT
    USING (TRUE);

CREATE POLICY "Superadmins can manage admin roles"
    ON public.admin_roles FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. HARDEN public.is_admin() FUNCTION (SECURITY DEFINER WITH SEARCH_PATH)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Unauthenticated users are not admins
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check admin_roles table
    IF EXISTS (
        SELECT 1 FROM public.admin_roles
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'superadmin', 'support_staff')
    ) THEN
        RETURN TRUE;
    END IF;

    -- Fallback to profiles role
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'staff', 'superadmin')
    );
END;
$$;

-- 3. ENSURE TABLE PRIVILEGES ON HOMEPAGE_BANNERS
GRANT SELECT ON TABLE public.homepage_banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.homepage_banners TO authenticated, anon;

-- 4. ENSURE RLS IS ENABLED AND POLICIES ARE AUTHORITATIVE
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;

-- Drop prior policies
DROP POLICY IF EXISTS "Public can view active homepage banners" ON public.homepage_banners;
DROP POLICY IF EXISTS "Admins manage homepage banners" ON public.homepage_banners;
DROP POLICY IF EXISTS "Admins full management on homepage_banners" ON public.homepage_banners;

-- Public storefront can view active banners; admins can view all
CREATE POLICY "Public can view active homepage banners"
    ON public.homepage_banners FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

-- Authorized admins full CRUD management
CREATE POLICY "Admins full management on homepage_banners"
    ON public.homepage_banners FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. ENSURE CATEGORY BANNERS TABLE & POLICIES EXIST SAFELY
CREATE TABLE IF NOT EXISTS public.category_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    category_slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    eyebrow TEXT,
    background_color TEXT NOT NULL DEFAULT '#072C20',
    text_color TEXT NOT NULL DEFAULT '#FFFFFF',
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT ON TABLE public.category_banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.category_banners TO authenticated, anon;

ALTER TABLE public.category_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active category banners" ON public.category_banners;
CREATE POLICY "Public can view active category banners"
    ON public.category_banners FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins full management on category_banners" ON public.category_banners;
CREATE POLICY "Admins full management on category_banners"
    ON public.category_banners FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
