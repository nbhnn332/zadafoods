-- ============================================================================
-- ZaDa Foods — Forward-Only Migration: Fix Homepage Hero Banner Database Authorization & RLS
-- Migration: 20261030000004_fix_homepage_banners_authorization_and_rls.sql
-- Description: 
--   1. Creates public.is_super_admin() FIRST to prevent Error 42883 (undefined_function).
--   2. Creates public.is_admin() and public.has_permission(TEXT).
--   3. Grants EXECUTE on functions to authenticated, anon, service_role.
--   4. Eliminates infinite recursion (42P17) in admin_roles RLS policies.
--   5. Fixes PostgreSQL table grants on public.homepage_banners (least privilege):
--      - anon: SELECT only (for storefront published banners)
--      - authenticated: SELECT, INSERT, UPDATE, DELETE (governed by RLS)
--      - PUBLIC: no privileges
--   6. Replaces homepage_banners RLS policies with strict role & permission enforcement.
--   7. Reloads PostgREST schema cache.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: CREATE public.is_super_admin() FIRST (Resolves Error 42883)
-- ----------------------------------------------------------------------------
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

    -- 1. Check auth.users for designated Super Admin emails
    BEGIN
        SELECT LOWER(email) INTO user_email
        FROM auth.users
        WHERE id = auth.uid();

        IF user_email IN ('admin.zadafoods.superad@gmail.com', 'superadmin@zadafoods.com') THEN
            RETURN TRUE;
        END IF;
    EXCEPTION WHEN OTHERS THEN
    END;

    -- 2. Check admin_roles table
    BEGIN
        IF EXISTS (
            SELECT 1 FROM public.admin_roles
            WHERE user_id = auth.uid() AND role = 'superadmin'
        ) THEN
            RETURN TRUE;
        END IF;
    EXCEPTION WHEN OTHERS THEN
    END;

    -- 3. Check profiles table
    BEGIN
        IF EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'superadmin' OR LOWER(email) = 'admin.zadafoods.superad@gmail.com')
        ) THEN
            RETURN TRUE;
        END IF;
    EXCEPTION WHEN OTHERS THEN
    END;

    RETURN FALSE;
END;
$$;

-- ----------------------------------------------------------------------------
-- STEP 2: CREATE public.is_admin() SECOND
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

    -- Super Admin is also an admin
    IF public.is_super_admin() THEN
        RETURN TRUE;
    END IF;

    -- Check profiles table (indexed direct lookup)
    BEGIN
        IF EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'staff')
        ) THEN
            RETURN TRUE;
        END IF;
    EXCEPTION WHEN OTHERS THEN
    END;

    -- Check admin_roles table
    BEGIN
        IF EXISTS (
            SELECT 1 FROM public.admin_roles
            WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin', 'support_staff')
        ) THEN
            RETURN TRUE;
        END IF;
    EXCEPTION WHEN OTHERS THEN
    END;

    RETURN FALSE;
END;
$$;

-- ----------------------------------------------------------------------------
-- STEP 3: CREATE public.has_permission(TEXT) THIRD
-- ----------------------------------------------------------------------------
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

    -- Check admin_permissions table if exists
    BEGIN
        IF EXISTS (
            SELECT 1 FROM public.admin_permissions
            WHERE user_id = auth.uid() AND permission = required_perm
        ) THEN
            RETURN TRUE;
        END IF;
    EXCEPTION WHEN OTHERS THEN
    END;

    -- Standard CMS permissions mapped to verified admins
    IF required_perm IN ('cms.homepage', 'cms.hero_banners', 'cms.category_banners', 'cms.sections') THEN
        RETURN public.is_admin();
    END IF;

    RETURN FALSE;
END;
$$;

-- ----------------------------------------------------------------------------
-- STEP 4: GRANT EXECUTE ON AUTHORIZATION FUNCTIONS
-- ----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(TEXT) TO authenticated, anon, service_role;

-- ----------------------------------------------------------------------------
-- STEP 5: FIX INFINITE RECURSION ON admin_roles (Resolves Error 42P17)
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.admin_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmins can manage admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Admins can view admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "admin_roles_select_policy" ON public.admin_roles;
DROP POLICY IF EXISTS "admin_roles_write_policy" ON public.admin_roles;

CREATE POLICY "admin_roles_select_policy"
    ON public.admin_roles FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "admin_roles_write_policy"
    ON public.admin_roles FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

GRANT SELECT ON TABLE public.admin_roles TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON TABLE public.admin_roles TO authenticated;

-- ----------------------------------------------------------------------------
-- STEP 6: POSTGRESQL PRIVILEGES ON homepage_banners (LEAST PRIVILEGE)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.homepage_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT,
    background_color TEXT DEFAULT '#072C20',
    text_color TEXT DEFAULT '#FFFFFF',
    eyebrow TEXT DEFAULT NULL,
    cta_text TEXT NOT NULL DEFAULT 'Shop Now',
    cta_link TEXT NOT NULL DEFAULT '/category/chips',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Revoke all privileges from PUBLIC
REVOKE ALL ON TABLE public.homepage_banners FROM PUBLIC;

-- anon: Storefront visitors can only SELECT published banners
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.homepage_banners FROM anon;
GRANT SELECT ON TABLE public.homepage_banners TO anon;

-- authenticated: Can perform operations, but restricted strictly by RLS policies
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.homepage_banners TO authenticated;
GRANT ALL ON TABLE public.homepage_banners TO service_role;

-- ----------------------------------------------------------------------------
-- STEP 7: ROW LEVEL SECURITY (RLS) POLICIES ON homepage_banners
-- ----------------------------------------------------------------------------
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active homepage banners" ON public.homepage_banners;
DROP POLICY IF EXISTS "Anyone can view active homepage banners" ON public.homepage_banners;
DROP POLICY IF EXISTS "Admins full management on homepage_banners" ON public.homepage_banners;
DROP POLICY IF EXISTS "Admins manage homepage banners" ON public.homepage_banners;
DROP POLICY IF EXISTS "homepage_banners_select_policy" ON public.homepage_banners;
DROP POLICY IF EXISTS "homepage_banners_insert_policy" ON public.homepage_banners;
DROP POLICY IF EXISTS "homepage_banners_update_policy" ON public.homepage_banners;
DROP POLICY IF EXISTS "homepage_banners_delete_policy" ON public.homepage_banners;

-- SELECT policy:
-- 1. Anyone (anon + authenticated) can view active/published banners on storefront.
-- 2. Super Admin and CMS Admins can view ALL banners (active, drafts, and inactive).
CREATE POLICY "homepage_banners_select_policy"
    ON public.homepage_banners FOR SELECT
    USING (
        is_active = TRUE
        OR public.is_super_admin()
        OR public.has_permission('cms.hero_banners')
        OR public.has_permission('cms.homepage')
    );

-- INSERT policy:
-- Only Super Admin or authorized CMS Admin can create new banners.
CREATE POLICY "homepage_banners_insert_policy"
    ON public.homepage_banners FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.has_permission('cms.hero_banners')
        OR public.has_permission('cms.homepage')
    );

-- UPDATE policy:
-- Only Super Admin or authorized CMS Admin can edit or change publication status.
CREATE POLICY "homepage_banners_update_policy"
    ON public.homepage_banners FOR UPDATE
    USING (
        public.is_super_admin()
        OR public.has_permission('cms.hero_banners')
        OR public.has_permission('cms.homepage')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.has_permission('cms.hero_banners')
        OR public.has_permission('cms.homepage')
    );

-- DELETE policy:
-- Only Super Admin or authorized CMS Admin can delete banners.
CREATE POLICY "homepage_banners_delete_policy"
    ON public.homepage_banners FOR DELETE
    USING (
        public.is_super_admin()
        OR public.has_permission('cms.hero_banners')
        OR public.has_permission('cms.homepage')
    );

-- ----------------------------------------------------------------------------
-- STEP 8: RELOAD POSTGREST SCHEMA CACHE
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
