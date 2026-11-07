# ZaDa Foods — Edge Function Architecture & Deployment Guide

This guide details the deployment, configuration, and verification of the serverless Edge Functions for the brand-new ZaDa Foods Supabase project.

---

## 1. Edge Functions Inventory

The ZaDa Foods backend includes four production-ready Edge Functions located in `supabase/functions/`:

| Function Name | JWT Verification | Description |
|---|---|---|
| `create-razorpay-order` | `--no-verify-jwt` | Validates cart items, verifies guest HMAC token or customer auth, calls Razorpay Orders API to generate an authoritative gateway order ID. |
| `verify-razorpay-payment` | `--no-verify-jwt` | Verifies cryptographic payment signatures (`crypto.subtle` HMAC-SHA256), updates order payment status to `PAID` / `ADVANCE_PAID`, and logs audit records. |
| `razorpay-webhook` | `--no-verify-jwt` | Processes incoming asynchronous events (`payment.captured`, `refund.processed`) with strict signature verification and idempotency protection. |
| `manage-admins` | `--no-verify-jwt` | Secure administrative user management endpoint callable only by verified Super Admins to invite, suspend, or delete administrator accounts. |

> **Note on `--no-verify-jwt`:** These functions handle their own internal authentication (supporting both authenticated Supabase session JWTs and cryptographically signed guest tokens `got_*`). Deploying with `--no-verify-jwt` ensures guest checkout flows without 401 gate errors.

---

## 2. Prerequisites

1. Install the Supabase CLI (if not already installed):
   ```powershell
   npm install -g supabase
   ```
   *Or use `npx supabase` directly.*

2. Login to your Supabase account:
   ```powershell
   npx supabase login
   ```

3. Link your local project to the **new** Supabase project:
   ```powershell
   npx supabase link --project-ref <YOUR-NEW-PROJECT-REF>
   ```
   *(Find `<YOUR-NEW-PROJECT-REF>` in your new Supabase dashboard URL: `https://supabase.com/dashboard/project/<PROJECT_REF>`)*

---

## 3. Configuring Server-Side Secrets

Edge Functions require specific API credentials that must never be exposed to the client. Set these in your new Supabase project using the CLI:

```powershell
# 1. Razorpay Payment Gateway Credentials
npx supabase secrets set RAZORPAY_KEY_ID="rzp_test_placeholder_key_id"
npx supabase secrets set RAZORPAY_KEY_SECRET="your_razorpay_secret_key"
npx supabase secrets set RAZORPAY_WEBHOOK_SECRET="your_razorpay_webhook_secret"

# 2. Cryptographic Guest Order Secret (Must match database private.server_secrets or be a 64-char hex string)
npx supabase secrets set GUEST_TOKEN_SECRET="a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90"
```

> [!TIP]
> You can also configure these secrets via the Supabase Dashboard:
> **Project Settings -> Edge Functions -> Manage Secrets**.

---

## 4. Deploying Edge Functions

Deploy all four functions using the following commands:

```powershell
# Deploy create-razorpay-order
npx supabase functions deploy create-razorpay-order --no-verify-jwt

# Deploy verify-razorpay-payment
npx supabase functions deploy verify-razorpay-payment --no-verify-jwt

# Deploy razorpay-webhook
npx supabase functions deploy razorpay-webhook --no-verify-jwt

# Deploy manage-admins
npx supabase functions deploy manage-admins --no-verify-jwt
```

---

## 5. Webhook Configuration in Razorpay Dashboard

To ensure orders update even if the customer accidentally closes their browser tab after completing UPI or Net Banking payments:

1. Log into your **Razorpay Dashboard** (`https://dashboard.razorpay.com`).
2. Navigate to **Settings -> Webhooks**.
3. Click **Add New Webhook**.
4. Set the **Webhook URL** to:
   ```text
   https://<YOUR-NEW-PROJECT-REF>.supabase.co/functions/v1/razorpay-webhook
   ```
5. Enter the **Secret** you set as `RAZORPAY_WEBHOOK_SECRET`.
6. Select the following **Active Events**:
   - `order.paid`
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
7. Click **Create Webhook**.

---

## 6. Verification and Health Check

Test that the functions are live by pinging an options request:

```powershell
curl -X OPTIONS https://<YOUR-NEW-PROJECT-REF>.supabase.co/functions/v1/create-razorpay-order -i
```

Expected response: `HTTP/1.1 200 OK` with CORS headers (`access-control-allow-origin: *`).
