# ZaDa Foods — Super Admin Provisioning & Verification Guide

This guide walks through securely creating and verifying the primary Super Administrator account on your fresh Supabase project.

---

## 1. Overview of the Super Admin Role

In ZaDa Foods, the **Super Admin** possesses unrestricted administrative authority across all modules:
- Complete CRUD across Catalogue, Pricing Rules, Combos, and Coupons.
- Full access to manage, activate, or deactivate Homepage and Category Banners.
- Full control over Festival Theme Manager and Store & Payment Settings.
- Unrestricted authority to invite, assign permissions to, suspend, or delete other administrators.

---

## 2. Step-by-Step Provisioning

### Step 1: Create the User in Supabase Auth

1. Open your **Supabase Project Dashboard**.
2. In the left navigation, click **Authentication** → **Users**.
3. Click the green **Add User** button at the top right and select **Create user**.
4. Fill in the details:
   - **Email**: `superadmin@zadafoods.com` *(or `admin.zadafoods.superad@gmail.com`)*
   - **Password**: Enter a secure, high-entropy password (e.g., 16+ characters).
   - **Auto Confirm User?**: **Toggle ON** (checked).
5. Click **Create user**.
6. Copy the generated User ID (UUID) for confirmation.

---

### Step 2: Execute the Secure Bootstrap Procedure

Navigate to the **SQL Editor** in your Supabase Dashboard and run:

```sql
-- Bootstrap Super Admin Authority for your registered user
SELECT public.bootstrap_super_admin('superadmin@zadafoods.com');
```

> **What this function does atomically:**
> 1. Confirms the user's email in `auth.users` (`email_confirmed_at = NOW()`).
> 2. Synchronizes the record in `public.profiles` with `role = 'superadmin'`.
> 3. Creates the record in `public.admin_accounts` with `role = 'superadmin'`, `status = 'active'`, and `is_active = TRUE`.
> 4. Assigns the `superadmin` role entry in `public.admin_roles`.

---

### Step 3: Run the Verification Query

Execute the following assertion script in the SQL Editor to verify that all administrative tables recognize the new Super Admin:

```sql
SELECT 
    u.id AS user_id,
    u.email,
    p.role AS profile_role,
    a.role AS admin_account_role,
    a.status AS account_status,
    r.role AS rbac_role,
    CASE 
        WHEN p.role = 'superadmin' 
         AND a.role = 'superadmin' 
         AND a.status = 'active'
         AND r.role = 'superadmin' 
        THEN 'FULLY VERIFIED SUPER ADMIN'
        ELSE 'MISCONFIGURED'
    END AS verification_status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.admin_accounts a ON a.id = u.id
LEFT JOIN public.admin_roles r ON r.user_id = u.id
WHERE LOWER(u.email) = 'superadmin@zadafoods.com';
```

**Expected Result:**
The `verification_status` column must display:
```text
FULLY VERIFIED SUPER ADMIN
```

---

## 3. Signing In to the ZaDa Foods Admin Portal

1. Start your local or deployed ZaDa Foods storefront application (`npm run dev`).
2. Navigate to the Admin Portal:
   ```text
   http://localhost:5173/admin/login
   ```
3. Enter your Super Admin credentials:
   - **Email**: `superadmin@zadafoods.com`
   - **Password**: *(The password configured in Step 1)*
4. Click **Sign In**.
5. You will be redirected to the **Admin Dashboard**.
6. Check that:
   - The top header displays: `Role: SUPERADMIN` with a gold crown badge.
   - All sidebar tabs are unlocked: **Dashboard**, **Products**, **Inventory**, **Orders**, **Hero Banners**, **Category Banners**, **Reviews**, **Festival Themes**, **Coupons & Combos**, **Settings**, and **Admin Management**.
   - You can create, edit, activate, and delete records without any `permission denied` or RLS errors.
