-- ============================================================================
-- ZaDa Foods — Production-Grade Role-Based Access Control (RBAC) System
-- Migration: 20261030000001_super_admin_and_permissions.sql
-- ============================================================================

-- 1. EXTEND PROFILES ROLE ENUM CHECK
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('customer', 'admin', 'staff', 'superadmin'));

-- 2. CREATE ADMIN PERMISSIONS TABLE
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

-- 3. CREATE ADMIN STATUS / ACCOUNT TRACKING TABLE
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

-- 4. HARDEN public.is_admin() AND CREATE public.has_permission()
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

    -- Check if user is suspended in admin_accounts
    IF EXISTS (
        SELECT 1 FROM public.admin_accounts
        WHERE id = auth.uid() AND status = 'suspended'
    ) THEN
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
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.admin_accounts
        WHERE id = auth.uid() AND status = 'suspended'
    ) THEN
        RETURN FALSE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.admin_roles
        WHERE user_id = auth.uid() AND role = 'superadmin'
    ) THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'superadmin'
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

    -- Check suspended
    IF EXISTS (
        SELECT 1 FROM public.admin_accounts
        WHERE id = auth.uid() AND status = 'suspended'
    ) THEN
        RETURN FALSE;
    END IF;

    -- Check granular permission grant
    RETURN EXISTS (
        SELECT 1 FROM public.admin_permissions
        WHERE user_id = auth.uid() AND permission = required_perm
    );
END;
$$;

-- 5. ROW LEVEL SECURITY (RLS) FOR ADMIN MANAGEMENT TABLES
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view permissions" ON public.admin_permissions;
CREATE POLICY "Admins can view permissions"
    ON public.admin_permissions FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "Superadmins manage permissions" ON public.admin_permissions;
CREATE POLICY "Superadmins manage permissions"
    ON public.admin_permissions FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Admins can view admin accounts" ON public.admin_accounts;
CREATE POLICY "Admins can view admin accounts"
    ON public.admin_accounts FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "Superadmins manage admin accounts" ON public.admin_accounts;
CREATE POLICY "Superadmins manage admin accounts"
    ON public.admin_accounts FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- 6. AUDIT LOGGING FOR PRIVILEGED ACTIONS
DROP POLICY IF EXISTS "Admins view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins view audit logs"
    ON public.admin_audit_logs FOR SELECT
    USING (public.has_permission('audit_logs.view'));

DROP POLICY IF EXISTS "System insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "System insert audit logs"
    ON public.admin_audit_logs FOR INSERT
    WITH CHECK (public.is_admin());

-- 7. RE-APPLY HOMEPAGE BANNERS PERMISSION-CHECKED RLS
DROP POLICY IF EXISTS "Admins full management on homepage_banners" ON public.homepage_banners;
CREATE POLICY "Admins full management on homepage_banners"
    ON public.homepage_banners FOR ALL
    USING (public.has_permission('cms.hero_banners'))
    WITH CHECK (public.has_permission('cms.hero_banners'));

DROP POLICY IF EXISTS "Admins full management on category_banners" ON public.category_banners;
CREATE POLICY "Admins full management on category_banners"
    ON public.category_banners FOR ALL
    USING (public.has_permission('cms.category_banners'))
    WITH CHECK (public.has_permission('cms.category_banners'));

-- 8. GRANT PROPER ROLES
GRANT SELECT ON public.admin_permissions TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.admin_permissions TO authenticated;

GRANT SELECT ON public.admin_accounts TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.admin_accounts TO authenticated;
