<USER_REQUEST>
# ZaDa Foods — Phase 27: Critical Functional Repair & Independent End-to-End Verification

## ROLE

Act as a senior full-stack engineer, Supabase architect, security engineer and independent QA team.

The objective is to fix the following actual problems in the ZaDa Foods application.

Do not redesign unrelated features. Do not simply change the UI to hide errors. Find the root cause, repair it, operate the actual application and verify every fix against the connected Supabase database.

Work in the verified staging environment only.

---

# 1. FIX AUTOMATIC HANDPICKED PRODUCT ASSIGNMENT

CURRENT BUG:

Every newly created product automatically appears in the "Handpicked for You" section.

EXPECTED BEHAVIOUR:

- Creating a product must NOT automatically add it to Handpicked for You.
- Handpicked for You must be an independent admin-controlled collection.
- Only products explicitly selected by an administrator should appear there.
- Provide a dedicated admin management page.
- Admin can select existing products, remove them, reorder them and activate/deactivate the section.
- Product creation and editing must not silently change handpicked membership.
- Removing a product from Handpicked for You must not delete the actual product.

Inspect database triggers, default values, product creation code, collection relationships and frontend fallback logic.

Test by creating three QA products:
- Create all three normally.
- Confirm none appears in Handpicked for You automatically.
- Select only one from the admin collection manager.
- Refresh the site.
- Confirm only that selected product appears.

# 2. FIX INVENTORY STOCK PERSISTENCE

CURRENT BUG:

When stock is adjusted, the UI displays the new value, but after refreshing the page the previous stock returns.

Investigate:
- Inventory table schema.
- Product variant relationships.
- Inventory adjustment functions.
- Database triggers.
- RLS and grants.
- React state updates.
- Query cache invalidation.
- Any local fallback data.
- Whether stock is being saved to the wrong table or record.

EXPECTED BEHAVIOUR:

- Adjusting stock must update the correct product variant.
- Every adjustment must persist in Supabase.
- Stock history must record the adjustment.
- The product listing must display the database value.
- Storefront availability must reflect the actual stock.
- Refreshing or logging in from another browser must show the same stock.
- Prevent negative stock and concurrent update inconsistencies.

Test stock addition, reduction and correction using QA products and verify the actual database values after every operation.

# 3. SIMPLIFY DESKTOP AND MOBILE BANNER MANAGEMENT

CURRENT REQUIREMENT:

I want exactly TWO separate management sections inside Banner Management:

A. Desktop Banners

B. Mobile Banners

Do not provide a confusing "Both" or "All Devices" option.

DESKTOP BANNERS:
- Images added here render only on desktop.
- Independent create, edit, preview, publish, reorder and delete.

MOBILE BANNERS:
- Images added here render only on mobile.
- Independent create, edit, preview, publish, reorder and delete.

Each section must have:
- Image upload.
- Image URL input, if supported.
- Live image preview.
- Headline.
- Description.
- CTA label.
- CTA destination.
- Display priority.
- Active/inactive status.

Use separate database records or an appropriate device-target field.

Verify that desktop banners never appear on mobile and mobile banners never appear on desktop.

Use actual responsive breakpoints. Do not rely on CSS alone if both images are loaded and displayed incorrectly.

# 4. FIX IMAGE URL PREVIEW AND IMAGE UPLOAD PERSISTENCE

CURRENT BUG:

- Image URL preview does not appear.
- Uploaded images do not appear in the intended storefront location.
- Some changes disappear after refresh.

Investigate the entire image pipeline:

1. URL validation.
2. Image preview component.
3. File upload handling.
4. Supabase Storage bucket.
5. Storage permissions and policies.
6. Returned public or signed URL.
7. Database record creation/update.
8. Frontend image rendering.
9. Cache invalidation.
10. Responsive image selection.

EXPECTED BEHAVIOUR:

- Entering a valid image URL displays a preview before saving.
- Invalid URLs show a useful error.
- Uploading an image displays an immediate preview.
- Saving stores the correct URL/reference in the appropriate database record.
- After refresh, the image remains.
- The storefront displays the image in the correct section.
- Failed uploads must never show a false success message.
- Removing an image must clear the correct database reference and storage object where safe.
- Do not automatically fetch stock images or substitute unrelated assets.

Test category images, product images, desktop banners and mobile banners separately.

# 5. FIX RESTORE DEFAULT ZADA THEME

CURRENT BUG:

Selecting or restoring the default ZaDa theme does not work reliably.

EXPECTED BEHAVIOUR:

- Provide a clear "Restore ZaDa Default Theme" action.
- Confirm before restoring.
- Restore the original ZaDa brand palette, typography, component styling and visual settings.
- Do not delete saved festival themes.
- Do not delete uploaded assets.
- Do not modify product, order or customer data.
- Persist the selected default theme in Supabase.
- After refresh and a new browser session, the default theme must remain active.

Inspect theme provider state, CSS variables, persisted settings, festival theme activation and scheduling logic.

Test switching from a festival theme to default and back.

# 6. FIX COUPON ENTRY AND VALIDATION

CURRENT BUG:

Customers cannot reliably enter or apply coupon codes.

Inspect:
- Checkout coupon input.
- Coupon validation API/RPC.
- Supabase coupon records.
- RLS and permissions.
- Date and usage constraints.
- Product/category eligibility.
- Minimum order amount.
- Maximum discount.
- First-order eligibility.
- Cart subtotal and shipping calculations.
- Server-side order calculation.

EXPECTED BEHAVIOUR:

1. Customer enters a coupon.
2. Customer selects Apply.
3. The code is validated against authoritative database data.
4. A clear success or failure message appears.
5. Eligible discount is calculated on the server.
6. The order summary updates correctly.
7. The applied coupon is retained through checkout.
8. Coupon is included in the final order data and WhatsApp message when applicable.
9. Invalid or expired coupons are rejected.
10. Duplicate applications and usage-limit bypasses are prevented.

Never trust discount amounts supplied by the frontend.

Test valid, invalid, expired, ineligible and usage-limit-exceeded coupons.

# 7. EXPLAIN HOW COMBO BUILDER WORKS

Do not just repair Combo Builder. Make it understandable to the store administrator.

Create a clear "How Combo Builder Works" help section inside the admin page.

Explain with a practical example:

Example:
- Product A: ₹200
- Product B: ₹150
- Product C: ₹100
- Normal combined price: ₹450
- Admin combo price: ₹399
- Customer savings: ₹51

Explain:

A. Creating a combo.
B. Selecting products.
C. Selecting variants and pack sizes.
D. Setting quantities.
E. Setting combo price.
F. Understanding automatic savings calculation.
G. Setting stock/availability rules.
H. Publishing and unpublishing.
I. How customers see the combo.
J. How customers add it to cart.
K. How checkout validates the combo price and stock.

Use the actual implemented business logic. Do not document features that do not exist.

Also repair and test combo creation, editing, deletion, publication, storefront display, cart calculation and checkout validation.

# 8. CRITICAL: FIX CUSTOMER IDENTITY LEAKAGE ACROSS DEVICES

<priority>CRITICAL SECURITY AND PRIVACY ISSUE</priority>

CURRENT BUG:

When another device visits the website and opens the profile/account area, it displays a previous customer's personal information, including the name Numan Sidique.

This must never happen.

Every new visitor must start as a GUEST unless they explicitly sign in using their own credentials.

INVESTIGATE THE ROOT CAUSE:

- Hardcoded customer profile defaults.
- Seed customer data.
- Shared localStorage keys.
- Shared sessionStorage keys.
- Static fallback profile.
- AuthContext.
- Supabase Auth session restoration.
- Customer profile queries.
- Customer address queries.
- Guest session initialization.
- Cross-device session persistence.
- Browser cache.
- Service workers.
- Profile query cache keys.
- Any code that uses the first available profile or orders[0].
- Any default customer ID or email.

REQUIRED GUEST BEHAVIOUR:

When a completely new browser/device opens the website:

- Show Guest or Sign In.
- Do not display Numan Sidique.
- Do not display another customer's phone number.
- Do not display another customer's saved addresses.
- Do not display another customer's orders.
- Do not display another customer's wishlist.
- Do not display another customer's account information.
- Do not automatically sign in as an existing customer.

AUTHENTICATED CUSTOMER BEHAVIOUR:

Only after a customer successfully signs in with their own verified Supabase Auth session:

- Resolve their profile using their authenticated user UUID.
- Load only their own addresses.
- Load only their own orders.
- Load only their own wishlist.
- Load only their own account details.

GUEST DATA:

- Guest carts may persist locally on that device.
- Guest profile details must not be confused with authenticated customer identity.
- Guest order tracking must use secure, order-specific access tokens.
- Guest data must not expose another customer's records.

SECURITY VERIFICATION:

Test in completely separate browser profiles or isolated browser contexts:

1. Device A: Customer A signs in.
2. Device B: Open the website without signing in.
3. Verify Device B displays Guest.
4. Verify Device B cannot see Customer A's profile or addresses.
5. Device B: Customer B signs in.
6. Verify Customer B only sees their own information.
7. Sign out on Device A.
8. Verify Device A returns to Guest state.
9. Try direct API requests for Customer A's profile and orders using Customer B's session.
10. Verify the requests are denied.

Inspect actual Supabase RLS policies. Do not rely on frontend filtering.

Do not fix this by simply deleting the displayed name or hiding the profile component.

Remove hardcoded personal data and unsafe fallback identity logic.

# 9. RECHECK CATEGORY DELETION INCONSISTENCY

The category deletion dialog displays:

Assigned Products: 0 products

But the deletion error reports:

Cannot delete category: 1 product(s).

Investigate:
- Product/category foreign keys.
- Product variants and relationships.
- Subcategory relationships.
- Archived or unpublished products.
- Category ID versus slug matching.
- Stale frontend data.
- Count query filters.
- Database delete constraints.

The dependency count displayed in the confirmation dialog must match the actual database dependency check.

If products are assigned:
- Block deletion.
- Display the exact affected products.
- Offer reassignment to another category.

If no products are assigned:
- Permit deletion if the user's permissions allow it.
- Confirm the deletion persists after refresh.

Never silently cascade-delete real products.

# 10. GLOBAL WHATSAPP CHECKOUT MODE

Inspect the existing global WhatsApp ordering setting.

If global WhatsApp redirect mode is ENABLED:

- Do not display Razorpay/Online Payment as an available checkout method.
- Do not display COD as an available checkout method.
- Do not display payment method selection.
- Show a clear WhatsApp order continuation action.
- Generate a premium, properly formatted WhatsApp message.
- Include product names, variants, quantities, coupon code if applied, subtotal, shipping and total.
- Use the configured official WhatsApp destination from Store Settings.
- Do not hardcode a different phone number.
- Validate the order details before redirecting.

If global WhatsApp redirect mode is DISABLED:

- Follow the normal website checkout configuration.
- Display only payment methods enabled by the administrator.
- Apply the configured COD advance payment rules.
- Use Razorpay only when enabled and configured.

Do not mix WhatsApp-only mode with normal payment checkout.

Important: Preserve the business's existing order-storage and confirmation rules. Do not falsely mark a WhatsApp enquiry as a confirmed or paid order.

Test both global modes separately.

# 11. COMPLETE REAL BROWSER QA

Operate the actual admin panel through the browser.

Use the real Super Admin account and verified staging database.

For every repaired feature:

1. Create a clearly labelled QA record.
2. Verify it in the UI.
3. Verify it in Supabase.
4. Refresh the browser.
5. Verify persistence.
6. Edit it.
7. Verify the updated database value.
8. Delete the QA record if safe.
9. Refresh again.
10. Verify it does not return.

Test customer identity in separate isolated browser contexts.

Test both mobile and desktop banner layouts.

Test coupons at checkout.

Test Combo Builder from admin creation through customer checkout.

Do not use mocked data as proof of live functionality.

# 12. FINAL REPORT

Create:

PHASE_27_CRITICAL_FIXES_AND_VERIFICATION_REPORT.md

Include:

- Root cause of every issue.
- Files and components changed.
- Database tables and functions changed.
- Migrations created and whether applied remotely.
- RLS and grant changes.
- Actual test procedures.
- Actual results.
- Screenshots before and after.
- Separate-device identity isolation evidence.
- Stock persistence evidence.
- Banner upload and rendering evidence.
- Coupon checkout evidence.
- Combo Builder workflow explanation.
- WhatsApp mode test results.
- Remaining blockers.

Use this table:

| Issue | Root cause | Fix | Live DB verified | Browser tested | Refresh tested |
|---|---|---|---|---|---|

Mark PASS only after real verification.

## STRICT RULES

- Staging only.
- Never deploy to production.
- Never reset or truncate the database.
- Never disable RLS.
- Never expose credentials.
- Never delete real business records.
- Never use hardcoded customer identities.
- Never use mock data to hide database errors.
- Never claim success based only on unit tests.
- Never change unrelated customer phone numbers when updating WhatsApp settings.
- Preserve existing payment security and order integrity.

Do not stop after fixing one or two issues. Complete the entire scope and provide the evidence-based report.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-11-10T02:25:52+05:30.
</ADDITIONAL_METADATA>