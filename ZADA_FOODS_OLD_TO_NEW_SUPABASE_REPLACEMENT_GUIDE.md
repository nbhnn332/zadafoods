# ZaDa Foods — Old to New Supabase Migration & Cutover Playbook

This playbook provides a zero-downtime, step-by-step operational guide for transitioning the ZaDa Foods web application from the previous database (`qjuvwrjpbwxkqyvffbcy`) to your brand-new Supabase project.

---

## Migration Philosophy: Safe Parallel Switchover

- **Do NOT delete the old Supabase project prematurely.** It remains online as a safety fallback throughout the entire process.
- **Frontend remains 100% intact.** No React components, pages, styles, or branding assets are modified or deleted.
- **Verification First.** We verify the new database schema, storage, functions, and admin authority *before* updating the frontend connection.

```
[Old Supabase Project] ──── (Retained as Fallback)
         │
         ├─── Step 1: Initialize New Supabase Project
         ├─── Step 2: Apply Fresh Architecture (Master SQL)
         ├─── Step 3: Verify Schema & RLS (Verification SQL)
         ├─── Step 4: Configure Storage & Edge Functions
         ├─── Step 5: Provision Super Admin
         └─── Step 6: Update Frontend .env & Re-deploy ─────► [New Supabase Project (LIVE)]
```

---

## Phase 1: Create Your New Supabase Project

1. Log in to [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Click **New Project**.
3. Select your Organization.
4. Set the **Project Name**: `ZaDa Foods Production` (or `ZaDa Foods Staging`).
5. Set a strong **Database Password** (store this in your password manager).
6. Select the **Region**: Recommended `South Asia (Mumbai) - ap-south-1` for lowest latency across India.
7. Click **Create new project** and wait 1–2 minutes for the database to provision.

---

## Phase 2: Apply the Master SQL Architecture

1. Once the new project is active, open the **SQL Editor** in the left menu.
2. Click **New Query**.
3. Open `ZADA_FOODS_COMPLETE_FRESH_SUPABASE_SETUP.sql` from your project workspace.
4. Copy the entire contents and paste into the Supabase SQL Editor.
5. Click **Run** (or press `Ctrl+Enter`).
6. Confirm that the query finishes with:
   ```text
   Success. No rows returned.
   ```

---

## Phase 3: Run the Automated Verification Assertions

1. In the **SQL Editor**, open another **New Query**.
2. Open `ZADA_FOODS_FRESH_DATABASE_VERIFICATION.sql`.
3. Copy and paste the entire script into the editor.
4. Click **Run**.
5. Inspect the output table. Verify that all rows display:
   ```text
   verification_item                | actual_count | criteria            | status
   ---------------------------------+--------------+---------------------+--------
   Tables in Schema                 | 37           | 37 expected         | PASS
   RLS Enabled Tables               | 37           | 37 expected         | PASS
   Security & Atomic Functions      | 8            | 8 expected          | PASS
   Store Settings Initialized       | 3            | 3 rows              | PASS
   Official Products Seeded         | 5            | At least 5 initial  | PASS
   Product Variants Seeded          | 7            | At least 5 initial  | PASS
   Private Server Secret Present    | 1            | 1 HMAC secret       | PASS
   ```

---

## Phase 4: Configure Storage Buckets & Policies

1. In the **SQL Editor**, run the Storage configuration script found in `ZADA_FOODS_STORAGE_SETUP_GUIDE.md`:
   ```sql
   INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
   VALUES 
   ('product-images', 'product-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg']),
   ('banners', 'banners', true, 8388608, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg']),
   ('category-banners', 'category-banners', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg', 'image/svg+xml']),
   ('festival-assets', 'festival-assets', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg', 'image/svg+xml'])
   ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;
   ```
2. Navigate to **Storage** in the sidebar to verify that all 4 buckets are listed and marked **Public**.

---

## Phase 5: Link CLI & Deploy Edge Functions

In your local command terminal (PowerShell or Bash) from the project root:

```powershell
# 1. Login to Supabase CLI
npx supabase login

# 2. Link your local codebase to the new project
npx supabase link --project-ref <YOUR-NEW-PROJECT-REF>

# 3. Configure backend secrets
npx supabase secrets set RAZORPAY_KEY_ID="rzp_test_placeholder_key_id"
npx supabase secrets set RAZORPAY_KEY_SECRET="your_razorpay_secret"
npx supabase secrets set RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"
npx supabase secrets set GUEST_TOKEN_SECRET="a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90"

# 4. Deploy all four Edge Functions
npx supabase functions deploy create-razorpay-order --no-verify-jwt
npx supabase functions deploy verify-razorpay-payment --no-verify-jwt
npx supabase functions deploy razorpay-webhook --no-verify-jwt
npx supabase functions deploy manage-admins --no-verify-jwt
```

---

## Phase 6: Provision the Super Admin Account

1. Open **Authentication -> Users** in your new Supabase Dashboard.
2. Click **Add User -> Create user**.
3. Enter:
   - Email: `superadmin@zadafoods.com` (or your preferred admin email).
   - Password: Choose a secure password.
   - Auto Confirm User: Checked.
4. Click **Create user**.
5. Switch to the **SQL Editor** and execute:
   ```sql
   SELECT public.bootstrap_super_admin('superadmin@zadafoods.com');
   ```

---

## Phase 7: Cut Over the Frontend Connection

1. Open your project's local `.env` file (or update your Netlify/Vercel environment variables).
2. Replace the connection details with the new project credentials:
   ```env
   VITE_SUPABASE_URL="https://<YOUR-NEW-PROJECT-REF>.supabase.co"
   VITE_SUPABASE_ANON_KEY="<YOUR-NEW-PROJECT-ANON-KEY>"
   VITE_RAZORPAY_KEY_ID="rzp_test_placeholder_key_id"
   VITE_STORE_ENV="production"
   ```
3. Test the build locally:
   ```powershell
   npm run build
   ```
4. Verify all automated tests pass:
   ```powershell
   npm test
   ```

---

## Phase 8: Acceptance Testing Checklist

Perform these tests on the live application:

- [ ] **Home Page**: Hero carousel loads, categories render with images, footer displays official Punalur manufacturer address and FSSAI license (`21326144000032`).
- [ ] **Shop & PDP**: Products load with real weights and prices; PDP displays ingredients and nutrition facts.
- [ ] **Cart & Checkout**:
  - Add Banana Chips to cart.
  - Test WhatsApp Ordering mode (opens WhatsApp with formatted cart summary).
  - Test Razorpay / COD order placement (order persists in `orders` and stock decrements atomically).
- [ ] **Admin Portal**:
  - Log in at `/admin/login` as Super Admin.
  - Create a new coupon (e.g. `TEST10`) and verify database persistence.
  - Edit a product and verify instant update.
  - Delete a test banner and verify it remains deleted after page refresh.

---

## Phase 9: Safe Decommissioning of Old Project

Once the new project has operated successfully for at least 7 days:
1. Export a final safety backup of the old database from **Project Settings -> Database -> Backups**.
2. Pause the old Supabase project (`qjuvwrjpbwxkqyvffbcy`) in the Supabase Dashboard.
3. After 30 days of clean operations, delete the old project.
