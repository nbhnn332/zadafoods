# ZaDa Foods — Supabase Environment & Secrets Configuration Guide

This guide details how to configure the environment variables for the frontend application and the backend secrets for the brand-new Supabase project.

---

## 1. Security Architecture & Boundary Rules

- **Client Environment Variables (`VITE_*`)**:
  Bundled by Vite into the client application. They are public to any user inspecting the browser source code. Never put secrets here.
- **Server-Side Secrets**:
  Configured exclusively in Supabase Edge Functions or backend CI/CD pipelines.
- **The Service Role Key (`service_role`)**:
  Bypasses Row Level Security (RLS). **NEVER** expose the `service_role` key in frontend `.env` files or commit it to version control.

---

## 2. Frontend Configuration (`.env`)

In the root of your project directory (`zaada foods`), create or update your `.env` file with your new Supabase project credentials.

### Template: `.env.example`

```env
# ==============================================================================
# ZaDa Foods — Frontend Environment Configuration
# ==============================================================================

# 1. Supabase Project Connection (Found in: Project Settings -> API)
VITE_SUPABASE_URL="https://<YOUR-NEW-PROJECT-REF>.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. Razorpay Public Client Key (Found in: Razorpay Dashboard -> API Keys)
# For test environment: rzp_test_...
# For live production:  rzp_live_...
VITE_RAZORPAY_KEY_ID="rzp_test_placeholder_key_id"

# 3. Store Environment Indicator ('development' | 'staging' | 'production')
VITE_STORE_ENV="production"
```

---

## 3. Where to Find Credentials in the Supabase Dashboard

1. Open your new Supabase Project at [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Click the **Project Settings** (gear icon) in the bottom-left corner of the sidebar.
3. Click **API** under Configuration.
4. Locate the following values:
   - **Project URL**: Copy and set as `VITE_SUPABASE_URL`.
   - **Project API Keys -> `anon` (public)**: Copy and set as `VITE_SUPABASE_ANON_KEY`.
   - **Project API Keys -> `service_role` (secret)**: Keep safe! Use only for Supabase CLI secrets or administrative backend jobs.

---

## 4. Backend Edge Function Secrets Checklist

Set these using the Supabase CLI (`npx supabase secrets set <KEY>=<VALUE>`) or via **Project Settings -> Edge Functions -> Manage Secrets**:

| Secret Name | Required By | Description | Example / Recommended Source |
|---|---|---|---|
| `RAZORPAY_KEY_ID` | `create-razorpay-order`, `verify-razorpay-payment` | Public identifier from Razorpay | `rzp_test_...` or `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | `create-razorpay-order`, `verify-razorpay-payment` | Private Razorpay key used to verify payment signatures | From Razorpay Dashboard -> API Keys |
| `RAZORPAY_WEBHOOK_SECRET` | `razorpay-webhook` | Secret configured in the Razorpay Webhook settings | User-defined random string |
| `GUEST_TOKEN_SECRET` | All checkout functions | Cryptographic secret for signing guest order tokens | Generate using `openssl rand -hex 32` |

---

## 5. Frontend Verification Steps

After updating your `.env` file:

1. Restart the Vite development server to load the new environment variables:
   ```powershell
   npm run build
   ```
2. Launch the dev server:
   ```powershell
   npm run dev
   ```
3. Open the browser console on `http://localhost:5173/` and verify:
   - No `[Supabase Error]` messages appear.
   - Products and categories load dynamically from your new Supabase database.
   - The connection banner displays connected status.
