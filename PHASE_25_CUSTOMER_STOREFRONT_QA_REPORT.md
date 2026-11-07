# ZaDa Foods — Phase 25 Customer Storefront Functional QA Report

**Date:** 2026-11-05  
**Database Project Reference:** `ykzgqaepayuqatgbvsoq`  
**Storefront URL:** `http://localhost:5173/`  
**Scope:** End-to-end customer purchasing journey, payment modes, tracking, and compliance.

---

## 1. Storefront Module Inspection & Verification

| Module / Journey | Operational Behavior | Database Interaction | Verification Status |
|---|---|---|---|
| **Homepage (`/`)** | Hero carousel renders dynamic banners from database; category cards render authentic Kerala imagery; bestseller snacks display pricing. | Reads `homepage_banners`, `categories`, and `products`. | **PASS** |
| **Shop Page (`/shop`)** | Renders all active products, category chips, subcategory selectors, sorting dropdowns, and live search. | Fetches live products and variants from `products` and `product_variants`. | **PASS** |
| **Category Landing (`/category/:slug`)** | Dynamically resolves category banner, eyebrow, subtitle, and filters products belonging to that category ID. | Reads `categories` and `category_banners`. | **PASS** |
| **Product Detail Page (`/product/:slug`)** | Displays multi-weight selector (250g, 500g, 1kg), dynamic price updates, preservative-free badges, nutrition table, and verified reviews. | Reads product variant stock from `product_variants` and approved reviews from `reviews`. | **PASS** |
| **Cart Drawer & Page (`/cart`)** | Handles guest cart storage in browser; computes authoritative subtotals; displays Free Shipping progress bar (threshold: ₹499). | Synchronizes variant IDs and prices with server catalogue. | **PASS** |
| **Guest Checkout (`/checkout`)** | Allows unauthenticated customers to enter shipping address and contact details without forced account creation. | Issues cryptographically signed guest token `got_*` scoped strictly to the order. | **PASS** |
| **Registered Customer Checkout** | Pre-fills saved customer addresses and attaches authenticated `user_id` to order record. | Linked to `auth.users` and `public.addresses`. | **PASS** |
| **WhatsApp Direct Ordering** | Formats cart items, variants, delivery address, and subtotal into an encoded URL directly targeting `+91 7593959235`. | Reads `store_settings` for destination WhatsApp number `917593959235`. | **PASS** |
| **Website Checkout: COD** | Places authoritative order in `public.orders` with `payment_mode = 'COD'`, decrements stock atomically, and returns order confirmation. | Invokes atomic stock decrement via `atomic_order_inventory_decrement`. | **PASS** |
| **Website Checkout: COD Advance** | Calculates authoritative advance amount based on store settings; requires advance payment before dispatching COD balance. | Verified against `store_settings` COD configuration. | **PASS** |
| **Website Checkout: Razorpay** | Initiates Razorpay payment modal with integer-paise calculations; validates signatures server-side. | Records transaction to `payment_transactions`. | **PASS** |
| **Order Tracking (`/track-order`)** | Allows customers to look up order status, courier name (`Delhivery Express`), and AWB tracking URL using order number + phone verification. | Queries `orders` with phone number validation preventing IDOR leaks. | **PASS** |

---

## 2. Business Compliance & Contact Information Audit

All customer-facing components across Desktop, Tablet, and Mobile viewports were verified against official business parameters:

- **Store Name:** ZaDa Foods
- **Official Tagline:** *Authentic Kerala Flavours, Rooted in Tradition*
- **Registered Manufacturing Address:** Punalur, Kollam (Dist), Kerala – 691305
- **Verified Central FSSAI License Number:** `21326145000345` *(zero old numbers present)*
- **Primary Support Phone:** `+91 8891537982`
- **Official WhatsApp Destination:** `917593959235` (`+91 75939 59235`)
- **Official Support Email:** `Zadafoods4@gmail.com`

---

## 3. Storefront Verdict

**STATUS: FUNCTIONALLY VERIFIED & PRODUCTION READY**  
The customer storefront seamlessly interacts with the fresh Supabase backend, provides flawless guest and registered checkout workflows, enforces atomic stock decrement, and displays accurate compliance data.
