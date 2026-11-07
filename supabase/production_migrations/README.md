# ZaDa Foods — Production Migration Sequence & Execution Preflight

This directory contains the authoritative, sanitized migration bundle approved for production deployment.

## 1. Migration Manifest (22 Approved Files)
1. `20261027000001_initial_schema.sql`: Core 28 relational tables, indexes, constraints, timestamps.
2. `20261027000002_row_level_security.sql`: Initial RLS enabling and baseline ownership policies.
3. `20261027000003_seed_dev_data.sql`: 10 approved production categories, chips subcategories, initial products, and baseline store settings.
4. `20261027000004_atomic_inventory_operations.sql`: Stored procedures for atomic stock decrement, cancellation restock, and reservation hold.
5. `20261027000005_scheduled_order_maintenance.sql`: Order maintenance procedures and abandoned cart release logic.
6. `20261028000001_admin_homepage_banners_rls.sql`: Homepage banner management policies.
7. `20261029000001_category_banners.sql`: Category banners schema and policies.
8. `20261029000002_banner_persistence_and_payment_fixes.sql`: Banner display persistence fixes.
9. `20261029000003_update_whatsapp_destination_number.sql`: Sets official WhatsApp routing (`917593959235`).
10. `20261029000004_subcategory_cms.sql`: Subcategory management and display order support.
11. `20261029000005_fix_admin_roles_and_banner_persistence.sql`: Admin roles synchronization.
12. `20261030000001_super_admin_and_permissions.sql`: Granular RBAC permissions architecture.
13. `20261030000002_bootstrap_super_admin.sql`: `is_super_admin()` and `bootstrap_super_admin(email)` stored procedures.
14. `20261030000003_fix_homepage_banners_schema_mismatch.sql`: Schema reconciliations for desktop/mobile banner assets.
15. `20261030000004_fix_homepage_banners_authorization_and_rls.sql`: Granular permissions for homepage banners.
16. `20261030000005_festival_themes_and_promotions.sql`: Festival theme schema and coupon code column.
17. `20261030000006_immersive_festival_system.sql`: Festival themes CMS integration.
18. `20261104000001_fix_product_and_category_deletion_and_grants.sql`: FK cascade on product deletion and grant hardening.
19. `20261104000002_complete_database_permissions_and_schema_repair.sql`: Complete PostgreSQL schema repair and RLS verification.
20. `20261104000004_global_cod_advance_payment_configuration.sql`: Global COD advance payment columns and constraints.
21. `20261104000005_comprehensive_security_hardening.sql`: Triggers for role protection, order payment status lock, and granular admin permissions.
22. `20261104000006_phase20_security_remediation.sql`: Header-token guest cart isolation, server-authoritative order creation RPC, trigger-based price tampering shield, and customer/admin least privilege privacy.

## 2. Excluded Migrations
- `20261104000003_seed_super_admin_auth_user.sql` has been **strictly excluded** from production.

## 3. Production Super Admin Provisioning Process
1. Create the production administrator account using the official Supabase Auth Dashboard:
   - Navigate to **Authentication -> Users -> Add User -> Invite user** (or Create user).
   - Email: `admin.zadafoods.superad@gmail.com`
   - Set a strong, randomly generated 24+ character password.
2. In Supabase SQL Editor, execute the authoritative bootstrap procedure:
   ```sql
   SELECT public.bootstrap_super_admin('admin.zadafoods.superad@gmail.com');
   ```
3. Verify that the Super Admin is active in `public.admin_accounts` and `public.admin_roles`.
