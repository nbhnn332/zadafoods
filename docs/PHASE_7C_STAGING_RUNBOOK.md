# ZaDa Foods — Phase 7C: Staging Deployment Runbook

**Target Project Reference:** `qjuvwrjpbwxkqyvffbcy`  
**Environment Tier:** Dedicated Staging Environment  
**Execution Mode:** Read-Only Audit & Non-Destructive Preparation  
**Security Baseline:** Zero Exposed Secrets • Test Mode Gateway Only • Order-Scoped Guest Tokens

---

## 1. Preflight Verification Checklist

Before initiating any remote communication or deployment, the environment must pass the automated preflight check:

```bash
node scripts/stagingPreflightCheck.cjs
```

### Critical Preflight Invariants
1. **Target Ambiguity Guard:** `supabase/config.toml` must explicitly declare `project_id = "qjuvwrjpbwxkqyvffbcy"`. Execution stops if generic placeholders like `zada-foods-staging` are detected.
2. **Local Migration Baseline:** All 5 migration files must be present in `supabase/migrations/` and match the schema executed via `complete_staging_setup.sql`.
3. **Edge Functions Security Audit:**
   - [`create-razorpay-order`](file:///c:/Users/nabha/OneDrive/Desktop/zaada foods/supabase/functions/create-razorpay-order/index.ts): Enforces server-authoritative integer-paise pricing, verified Supabase user sessions, and order-scoped guest tokens (`got_...`). Email/phone-only access is strictly forbidden.
   - [`verify-razorpay-payment`](file:///c:/Users/nabha/OneDrive/Desktop/zaada foods/supabase/functions/verify-razorpay-payment/index.ts): Enforces internal order binding, cryptographic HMAC-SHA256 signatures, and strictly requires `captured` payment status (rejects `authorized` status before capture).
   - [`razorpay-webhook`](file:///c:/Users/nabha/OneDrive/Desktop/zaada foods/supabase/functions/razorpay-webhook/index.ts): Enforces raw-body signature checks, PostgreSQL unique constraint `event_id` atomic claim, safe failure retries, and prevents status downgrade on delayed `payment.failed` webhooks.
4. **Zero Client Secrets:** Verify that no private keys, service-role keys, or Razorpay secrets are prefixed with `VITE_` or embedded in frontend bundles.

---

## 2. Required Secrets Configuration (By Name Only)

The following 5 secrets must be set in your staging Supabase project. **Never share or expose secret values in chat, source control, or command logs:**

| Secret Name | Purpose | Target Service |
| :--- | :--- | :--- |
| `RAZORPAY_KEY_ID` | Razorpay Test Key ID (`rzp_test_...`) | `create-razorpay-order`, `verify-razorpay-payment` |
| `RAZORPAY_KEY_SECRET` | Razorpay Test Secret Key | `create-razorpay-order`, `verify-razorpay-payment` |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verification secret | `razorpay-webhook` |
| `GUEST_TOKEN_SECRET` | Dedicated HMAC secret for guest order tokens | `create-razorpay-order`, `verify-razorpay-payment` |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin database access client | All Edge Functions |

---

## 3. Migration History Reconciliation Procedure

### Problem Context
The staging schema was provisioned via the Supabase Dashboard SQL Editor using the consolidated script [`supabase/complete_staging_setup.sql`](file:///c:/Users/nabha/OneDrive/Desktop/zaada foods/supabase/complete_staging_setup.sql). Because this execution happened outside the CLI migration engine:
- The database schema is **100% complete and active**.
- The CLI migration tracking table (`supabase_migrations.schema_migrations`) does not yet record the 5 local version strings.
- **Strict Prohibition:** Never run `npx supabase db push`, `db reset`, or `migration up` against staging. Replaying migration `20261027000002_row_level_security.sql` will throw fatal errors (`policy already exists`), and `db reset` would wipe all existing data.

### Supported Reconciliation Workflows

#### Procedure A: CLI Migration Repair (Standard Documented Method)
Once the project is linked via `npx supabase link --project-ref qjuvwrjpbwxkqyvffbcy`, mark each migration as applied without re-running DDL:

```bash
npx supabase migration repair --status applied 20261027000001
npx supabase migration repair --status applied 20261027000002
npx supabase migration repair --status applied 20261027000003
npx supabase migration repair --status applied 20261027000004
npx supabase migration repair --status applied 20261027000005
```

#### Procedure B: Remote Read-Only History Verification
To verify the migration status remotely without modifying any tables:

```bash
npx supabase migration list
```
This lists which migrations are applied vs. pending on the remote database.

---

## 4. Edge Function Deployment Sequence

Deploy the three functions with documented `--no-verify-jwt` flags (required because `razorpay-webhook` is called directly by Razorpay servers, and `create`/`verify` support guest checkouts with internal token validation):

```bash
# 1. Order Creation Endpoint
npx supabase functions deploy create-razorpay-order --no-verify-jwt

# 2. Payment Verification Endpoint
npx supabase functions deploy verify-razorpay-payment --no-verify-jwt

# 3. Gateway Webhook Listener
npx supabase functions deploy razorpay-webhook --no-verify-jwt
```

---

## 5. Razorpay Test-Mode Configuration

In your Razorpay Dashboard (**Settings** → **Webhooks** → **Add New Webhook**):

- **Webhook URL:**  
  `https://qjuvwrjpbwxkqyvffbcy.supabase.co/functions/v1/razorpay-webhook`
- **Secret:**  
  Matches the value set for `RAZORPAY_WEBHOOK_SECRET`.
- **Active Subscription Events:**
  - `payment.captured`
  - `payment.failed`
  - `order.paid`
  - `payment.authorized` (Logged to audit notes; does not mark `PAID`)

---

## 6. End-to-End Verification Test Matrix

Execute these test scenarios on staging to validate production readiness:

| # | Test Scenario | Input / Action | Expected Result |
| :---: | :--- | :--- | :--- |
| **1** | **Customer Order Ownership** | User B attempts payment verification on User A's order ID. | HTTP 403 Forbidden (`You do not have permission to verify this order`). |
| **2** | **Guest Token Binding** | Guest submits valid token for Order A against Order B. | HTTP 403 Forbidden (`ORDER_MISMATCH`). |
| **3** | **Email/Phone-Only Access** | Caller attempts payment creation using only customer email/phone. | HTTP 403 Forbidden (`guestAccessToken is required`). |
| **4** | **Authoritative Pricing** | Caller sends modified `amountRupees: 1`. | Client amount ignored; Razorpay order created with exact database `total_amount`. |
| **5** | **Authorized vs Captured** | Gateway returns `status: 'authorized'` for payment. | HTTP 400 (`Only captured payments can mark an order as PAID`). Order remains `PENDING`. |
| **6** | **Payment Capture Success** | Gateway returns `status: 'captured'` with valid HMAC signature. | HTTP 200 `{ isValid: true }`. Order transitions to `PAID`. |
| **7** | **Delayed Failure Webhook** | Post `payment.failed` webhook for an already-`PAID` order. | Order `payment_status` remains `PAID`. Failure note recorded in `admin_notes`. |
| **8** | **Concurrent Webhooks** | Simultaneous delivery of identical webhook `event_id`. | Exactly one order update; duplicate worker returns `200 { status: 'ALREADY_PROCESSED' }`. |

---

## 7. Rollback & Troubleshooting Guidance

| Failure Symptom | Probable Cause | Safe Remediation Step |
| :--- | :--- | :--- |
| **HTTP 500: Server misconfiguration** | Missing `SUPABASE_SERVICE_ROLE_KEY` or `GUEST_TOKEN_SECRET` in Edge runtime. | Re-set secrets using `npx supabase secrets set ...` and re-verify. |
| **HTTP 401: Invalid webhook signature** | Webhook secret mismatch between Razorpay Dashboard and Supabase. | Re-enter `RAZORPAY_WEBHOOK_SECRET` in both platforms. Ensure no trailing whitespace. |
| **HTTP 400: Razorpay order ID mismatch** | Client passed payment details from a foreign or mismatched order. | Ensure checkout flow uses the `orderId` returned by `create-razorpay-order`. |
| **Schema error on CLI migration list** | CLI not linked or session token expired. | Run `npx supabase login` followed by `npx supabase link --project-ref qjuvwrjpbwxkqyvffbcy`. |
| **Function redeploy needed** | Logic or security update in Edge Function. | Run `npx supabase functions deploy <function-name> --no-verify-jwt`. Zero database downtime. |
