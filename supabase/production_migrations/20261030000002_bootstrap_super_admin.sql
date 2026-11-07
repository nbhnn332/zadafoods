-- Migration: 20261030000002_bootstrap_super_admin.sql
-- Description: Super Admin bootstrap and role resolution for Admin.ZaDaFoods.superAD@gmail.com

-- 1. UPDATE is_super_admin() FUNCTION
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

    -- If suspended in admin_accounts, revoke superadmin privileges immediately
    IF EXISTS (
        SELECT 1 FROM public.admin_accounts
        WHERE id = auth.uid() AND status = 'suspended'
    ) THEN
        RETURN FALSE;
    END IF;

    -- Check designated Super Admin email
    SELECT LOWER(email) INTO user_email
    FROM auth.users
    WHERE id = auth.uid();

    IF user_email = 'admin.zadafoods.superad@gmail.com' OR user_email = 'superadmin@zadafoods.com' THEN
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
        WHERE id = auth.uid() AND (role = 'superadmin' OR LOWER(email) = 'admin.zadafoods.superad@gmail.com')
    );
END;
$$;

-- 2. CREATE SERVER-SIDE BOOTSTRAP FUNCTION
CREATE OR REPLACE FUNCTION public.bootstrap_super_admin(target_email TEXT DEFAULT 'admin.zadafoods.superad@gmail.com')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    target_user_id UUID;
    norm_email TEXT;
BEGIN
    norm_email := LOWER(TRIM(target_email));

    SELECT id INTO target_user_id
    FROM auth.users
    WHERE LOWER(email) = norm_email;

    IF target_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'User account not found in auth.users for ' || norm_email
        );
    END IF;

    -- 1. Profiles
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (target_user_id, norm_email, 'ZaDa Super Administrator', 'superadmin')
    ON CONFLICT (id) DO UPDATE SET
        role = 'superadmin',
        updated_at = NOW();

    -- 2. Admin Roles
    INSERT INTO public.admin_roles (user_id, role, granted_by)
    VALUES (target_user_id, 'superadmin', target_user_id)
    ON CONFLICT (user_id) DO UPDATE SET
        role = 'superadmin',
        updated_at = NOW();

    -- 3. Admin Accounts
    INSERT INTO public.admin_accounts (id, role, status)
    VALUES (target_user_id, 'superadmin', 'active')
    ON CONFLICT (id) DO UPDATE SET
        role = 'superadmin',
        status = 'active',
        updated_at = NOW();

    RETURN jsonb_build_object(
        'success', TRUE,
        'user_id', target_user_id,
        'email', norm_email,
        'role', 'superadmin'
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bootstrap_super_admin FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_super_admin TO service_role;
