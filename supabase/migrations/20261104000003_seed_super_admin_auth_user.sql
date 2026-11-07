-- ==============================================================================
-- ZaDa Foods: Cloud Supabase Auth User Seeding (DEPRECATED & REDACTED FOR SECURITY)
-- File: supabase/migrations/20261104000003_seed_super_admin_auth_user.sql
-- ==============================================================================
-- SECURITY HARDENING NOTICE:
-- All plaintext passwords and mock credential inserts have been purged from this file.
-- This migration safely NO-OPs and MUST NEVER be executed against production.
--
-- In production, the Super Administrator must be provisioned exclusively via:
-- 1. The official Supabase Auth Dashboard (Invite user / Add user), OR
-- 2. Supabase Admin API: supabase.auth.admin.inviteUserByEmail() with strong cryptographic passwords.
-- Once the user confirms their account in auth.users, promote them securely via:
--    SELECT public.bootstrap_super_admin('admin.zadafoods.superad@gmail.com');
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Skipping legacy auth.users seeding. Production Super Admin provisioning must use Supabase Auth console.';
END $$;
