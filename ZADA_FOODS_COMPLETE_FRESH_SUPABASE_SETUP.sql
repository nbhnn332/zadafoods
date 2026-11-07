-- ==============================================================================
-- ZaDa Foods — COMPLETE FRESH SUPABASE BACKEND SETUP
-- Target: Fresh Supabase Project (PostgreSQL 15+)
-- Environment: PRODUCTION & STAGING READY
-- Purpose: Complete, self-contained, from-scratch database architecture for ZaDa Foods.
-- ==============================================================================

-- Instructions:
-- Paste and execute this entire script in your new Supabase Project:
-- Supabase Dashboard -> SQL Editor -> New Query -> Run.
-- Everything executes within a single transaction block.

BEGIN;

-- ==============================================================================
-- 1. EXTENSIONS & SCHEMAS
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT ALL ON SCHEMA private TO service_role, postgres;

-- ==============================================================================
-- 2. CORE TIMESTAMP TRIGGER FUNCTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ==============================================================================
-- 3. MODULE A: PRODUCT CATALOGUE
-- ==============================================================================

-- A1. Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- A2. Subcategories
CREATE TABLE IF NOT EXISTS public.subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_subcategories_updated_at
    BEFORE UPDATE ON public.subcategories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- A3. Products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    tagline TEXT,
    description TEXT NOT NULL DEFAULT '',
    ingredients TEXT,
    nutrition_facts JSONB DEFAULT '{}'::jsonb,
    storage_instructions TEXT DEFAULT 'Store in an airtight container in a cool, dry place.',
    shelf_life_days INTEGER DEFAULT 60,
    is_preservative_free BOOLEAN NOT NULL DEFAULT TRUE,
    is_coconut_oil_made BOOLEAN NOT NULL DEFAULT TRUE,
    is_bestseller BOOLEAN NOT NULL DEFAULT FALSE,
    is_on_offer BOOLEAN NOT NULL DEFAULT FALSE,
    is_cod_eligible BOOLEAN NOT NULL DEFAULT TRUE,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    average_rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
    review_count INTEGER NOT NULL DEFAULT 0,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- A4. Product Variants
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT NOT NULL UNIQUE,
    weight_value NUMERIC(10,2) NOT NULL DEFAULT 250,
    weight_unit TEXT NOT NULL DEFAULT 'g',
    weight_label TEXT NOT NULL DEFAULT '250g',
    selling_price NUMERIC(10,2) NOT NULL CHECK (selling_price >= 0),
    mrp NUMERIC(10,2) NOT NULL CHECK (mrp >= selling_price),
    discount_percentage NUMERIC(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    stock_quantity INTEGER NOT NULL DEFAULT 100 CHECK (stock_quantity >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 10 CHECK (low_stock_threshold >= 0),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_product_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- A5. Product Images
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT DEFAULT '',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A6. Product Tags
CREATE TABLE IF NOT EXISTS public.product_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_tag UNIQUE (product_id, tag)
);

-- A7. Product Attributes
CREATE TABLE IF NOT EXISTS public.product_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    attribute_name TEXT NOT NULL,
    attribute_value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_attribute UNIQUE (product_id, attribute_name)
);

-- ==============================================================================
-- 4. MODULE B: INVENTORY MANAGEMENT & AUDIT
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT', 'SALE', 'RETURN', 'RESTOCK', 'DAMAGE')),
    quantity_change INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    order_id UUID DEFAULT NULL,
    reason TEXT,
    created_by UUID DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    previous_quantity INTEGER NOT NULL,
    adjusted_quantity INTEGER NOT NULL,
    reason TEXT NOT NULL,
    adjusted_by UUID DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. MODULE C: CUSTOMER PROFILES & SAVED ADDRESSES
-- ==============================================================================

-- C1. Customer Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT '',
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin', 'superadmin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- C2. Customer Addresses
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tag TEXT DEFAULT 'Home',
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    street_address TEXT NOT NULL,
    landmark TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'Kerala',
    postal_code TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_addresses_updated_at
    BEFORE UPDATE ON public.addresses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Compatibility View for customer_addresses
CREATE OR REPLACE VIEW public.customer_addresses AS
SELECT * FROM public.addresses;

-- C3. Customer Preferences
CREATE TABLE IF NOT EXISTS public.customer_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    newsletter_subscribed BOOLEAN NOT NULL DEFAULT TRUE,
    sms_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    whatsapp_updates BOOLEAN NOT NULL DEFAULT TRUE,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. MODULE D: ORDERS, ITEMS, PAYMENTS & GUEST TOKENS
-- ==============================================================================

-- D1. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT NOT NULL,
    shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    delivery_method TEXT NOT NULL DEFAULT 'STANDARD' CHECK (delivery_method IN ('STANDARD', 'EXPRESS')),
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('COD', 'RAZORPAY', 'WHATSAPP_MANUAL', 'WHATSAPP')),
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'ADVANCE_PAID', 'PAID', 'FAILED', 'REFUNDED')),
    fulfillment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (fulfillment_status IN ('PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED')),
    subtotal_amount NUMERIC(10,2) NOT NULL CHECK (subtotal_amount >= 0),
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    coupon_code TEXT,
    shipping_charge NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (shipping_charge >= 0),
    total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
    cod_advance_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    cod_advance_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    cod_remaining_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    cod_advance_payment_status VARCHAR(32) DEFAULT NULL,
    advance_payment_reference TEXT,
    advance_payment_method TEXT,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    courier_name TEXT,
    tracking_number TEXT,
    tracking_url TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- D2. Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    variant_weight_label TEXT NOT NULL,
    image_url TEXT,
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    mrp NUMERIC(10,2) NOT NULL CHECK (mrp >= unit_price),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total NUMERIC(10,2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- D3. Order Status History
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    notes TEXT,
    updated_by TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- D4. Guest Order Tokens (Cryptographically Secure Access)
CREATE TABLE IF NOT EXISTS public.guest_order_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- D5. Payment Transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    gateway TEXT NOT NULL DEFAULT 'RAZORPAY',
    transaction_type TEXT NOT NULL DEFAULT 'FULL' CHECK (transaction_type IN ('FULL', 'ADVANCE', 'REFUND')),
    gateway_order_id TEXT,
    gateway_payment_id TEXT,
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL CHECK (status IN ('CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED')),
    signature TEXT,
    raw_response JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- D6. Refunds
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED')),
    gateway_refund_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 7. MODULE E: CART & WISHLIST PERSISTENCE
-- ==============================================================================

-- E1. Carts
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    guest_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_carts_updated_at
    BEFORE UPDATE ON public.carts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- E2. Cart Items
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cart_variant UNIQUE (cart_id, variant_id)
);

-- E3. Wishlists
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_wishlist UNIQUE (user_id, product_id)
);

-- ==============================================================================
-- 8. MODULE F: COUPONS, PRICING RULES & COMBOS
-- ==============================================================================

-- F1. Coupons
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FLAT', 'FREE_SHIPPING')),
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value >= 0),
    max_discount_amount NUMERIC(10,2) DEFAULT NULL,
    min_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    is_first_order_only BOOLEAN NOT NULL DEFAULT FALSE,
    usage_limit INTEGER DEFAULT NULL,
    times_used INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- F2. Pricing Rules (BOGO, Volume Tiers, Cart Thresholds)
CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('BOGO', 'VOLUME_TIER', 'CART_THRESHOLD')),
    buy_quantity INTEGER DEFAULT 1,
    get_quantity INTEGER DEFAULT 0,
    discount_percentage NUMERIC(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    min_cart_total NUMERIC(10,2) DEFAULT 0.00,
    target_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    target_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    min_quantity INTEGER DEFAULT 1,
    fixed_price NUMERIC(10,2) DEFAULT NULL,
    free_variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_pricing_rules_updated_at
    BEFORE UPDATE ON public.pricing_rules
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- F3. Combos
CREATE TABLE IF NOT EXISTS public.combos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    tagline TEXT,
    description TEXT NOT NULL DEFAULT '',
    combo_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    discount_type TEXT NOT NULL DEFAULT 'PERCENTAGE' CHECK (discount_type IN ('PERCENTAGE', 'FIXED_PRICE')),
    discount_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_combos_updated_at
    BEFORE UPDATE ON public.combos
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- F4. Combo Items
CREATE TABLE IF NOT EXISTS public.combo_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id UUID NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 9. MODULE G: HOMEPAGE CMS, BANNERS & SECTIONS
-- ==============================================================================

-- G1. Homepage Banners
CREATE TABLE IF NOT EXISTS public.homepage_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    headline TEXT,
    badge_text TEXT,
    eyebrow TEXT,
    cta_text TEXT NOT NULL DEFAULT 'Explore Collection',
    cta_url TEXT NOT NULL DEFAULT '/shop',
    cta_link TEXT DEFAULT '/shop',
    image_url TEXT NOT NULL,
    background_color TEXT DEFAULT '#072C20',
    text_color TEXT DEFAULT '#FFFFFF',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_homepage_banners_updated_at
    BEFORE UPDATE ON public.homepage_banners
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- G2. Category Banners
CREATE TABLE IF NOT EXISTS public.category_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    subtitle TEXT,
    eyebrow TEXT,
    background_color TEXT NOT NULL DEFAULT '#072C20',
    text_color TEXT NOT NULL DEFAULT '#FFFFFF',
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_category_banners_updated_at
    BEFORE UPDATE ON public.category_banners
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- G3. Homepage Sections
CREATE TABLE IF NOT EXISTS public.homepage_sections (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    section_type TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- G4. Store Content Pages
CREATE TABLE IF NOT EXISTS public.store_content (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 10. MODULE H: FESTIVAL THEME MANAGER
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.festival_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    preset TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    intensity TEXT NOT NULL DEFAULT 'moderate' CHECK (intensity IN ('subtle', 'moderate', 'festive')),
    primary_color TEXT NOT NULL DEFAULT '#D4AF37',
    accent_color TEXT NOT NULL DEFAULT '#800020',
    banner_url TEXT,
    motifs JSONB NOT NULL DEFAULT '[]'::jsonb,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_festival_themes_updated_at
    BEFORE UPDATE ON public.festival_themes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 11. MODULE I: REVIEWS & HONEST RATING AGGREGATION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_title TEXT,
    review_text TEXT NOT NULL,
    is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured_on_pdp BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Honest Review Aggregation Trigger (No Fake Rating Counts)
CREATE OR REPLACE FUNCTION public.sync_product_reviews_statistics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    target_prod_id UUID;
    v_avg NUMERIC(3,2);
    v_cnt INTEGER;
BEGIN
    target_prod_id := COALESCE(NEW.product_id, OLD.product_id);

    SELECT 
        COALESCE(ROUND(AVG(rating)::numeric, 2), 5.00),
        COUNT(*)
    INTO v_avg, v_cnt
    FROM public.reviews
    WHERE product_id = target_prod_id
      AND is_approved = TRUE;

    UPDATE public.products
    SET 
        average_rating = v_avg,
        review_count = v_cnt,
        updated_at = NOW()
    WHERE id = target_prod_id;

    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_reviews_aggregation
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.sync_product_reviews_statistics();

-- ==============================================================================
-- 12. MODULE J: BULK & CONTACT ENQUIRIES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.bulk_enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    company_name TEXT,
    organization_name TEXT,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    event_type TEXT,
    product_interest TEXT,
    estimated_quantity INTEGER,
    quantity TEXT,
    required_date DATE,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'IN_REVIEW', 'CONTACTED', 'CLOSED')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_bulk_enquiries_updated_at
    BEFORE UPDATE ON public.bulk_enquiries
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 13. MODULE K: STORE SETTINGS & COMPLIANCE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.store_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 14. MODULE L: ADMIN MANAGEMENT & AUDIT LOGS
-- ==============================================================================

-- L1. Admin Accounts
CREATE TABLE IF NOT EXISTS public.admin_accounts (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin', 'staff')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_admin_accounts_updated_at
    BEFORE UPDATE ON public.admin_accounts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- L2. Admin Roles
CREATE TABLE IF NOT EXISTS public.admin_roles (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role)
);

-- L3. Admin Permissions
CREATE TABLE IF NOT EXISTS public.admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_permission UNIQUE (user_id, permission)
);

-- L4. Admin Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- L5. Private Server Secrets
CREATE TABLE IF NOT EXISTS private.server_secrets (
    key TEXT PRIMARY KEY,
    secret TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed cryptographically secure HMAC secret for guest tokens
INSERT INTO private.server_secrets (key, secret)
VALUES ('guest_order_hmac_secret', encode(extensions.gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- 15. PERFORMANCE INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON public.products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_published_active ON public.products(is_published, is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id, display_order);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON public.orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON public.order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_guest_tokens_hash ON public.guest_order_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant ON public.inventory_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_order ON public.inventory_movements(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_combos_slug ON public.combos(slug);

-- ==============================================================================
-- 16. SECURITY DEFINER AUTHORIZATION HELPERS
-- ==============================================================================

-- 1. Check if authenticated user is Super Admin
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

    -- If suspended in admin_accounts, revoke immediately
    IF EXISTS (
        SELECT 1 FROM public.admin_accounts
        WHERE id = auth.uid() AND status = 'suspended'
    ) THEN
        RETURN FALSE;
    END IF;

    -- Check designated superadmin emails via auth.users
    SELECT LOWER(email) INTO user_email
    FROM auth.users
    WHERE id = auth.uid();

    IF user_email IN ('admin.zadafoods.superad@gmail.com', 'superadmin@zadafoods.com') THEN
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
        WHERE id = auth.uid() AND (role = 'superadmin' OR LOWER(email) IN ('admin.zadafoods.superad@gmail.com', 'superadmin@zadafoods.com'))
    );
END;
$$;

-- 2. Check if authenticated user is Admin or Super Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    IF public.is_super_admin() THEN
        RETURN TRUE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.admin_accounts
        WHERE id = auth.uid() AND status = 'suspended'
    ) THEN
        RETURN FALSE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.admin_accounts
        WHERE id = auth.uid() AND is_active = TRUE AND role IN ('admin', 'superadmin')
    ) THEN
        RETURN TRUE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.admin_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin')
    ) THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    );
END;
$$;

-- 3. Check granular permission
CREATE OR REPLACE FUNCTION public.has_permission(required_perm TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    IF public.is_super_admin() THEN
        RETURN TRUE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.admin_accounts
        WHERE id = auth.uid() AND status = 'suspended'
    ) THEN
        RETURN FALSE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.admin_permissions
        WHERE user_id = auth.uid() AND permission = required_perm
    ) THEN
        RETURN TRUE;
    END IF;

    -- Verified fallback for general administrative tasks
    IF public.is_admin() THEN
        IF required_perm IN (
            'catalog.products', 'catalog.categories', 'catalog.inventory',
            'cms.hero_banners', 'cms.category_banners', 'cms.sections', 'cms.reviews',
            'orders.view', 'orders.manage', 'inventory.manage', 'dashboard.view',
            'promotions.coupons', 'promotions.pricing_rules', 'promotions.combos',
            'pricing_rules.manage', 'combos.manage'
        ) THEN
            RETURN TRUE;
        END IF;
    END IF;

    RETURN FALSE;
END;
$$;

-- 4. Profile Role Modification Protection Trigger
CREATE OR REPLACE FUNCTION public.protect_profiles_role_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        -- Allow if session has bootstrap_mode flag or is system superuser
        IF current_setting('zada.bootstrap_mode', true) = 'on' THEN
            RETURN NEW;
        END IF;

        IF NOT public.is_super_admin() AND current_user NOT IN ('postgres', 'supabase_admin') THEN
            RAISE EXCEPTION 'SECURITY_VIOLATION: Unauthorized attempt to modify user role. Administrative role changes require Super Admin authorization.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profiles_role ON public.profiles;
CREATE TRIGGER trg_protect_profiles_role
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profiles_role_modification();

-- 5. Automatic Profile Provisioning on User Sign-Up
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        LOWER(NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        CASE
            WHEN LOWER(NEW.email) IN ('admin.zadafoods.superad@gmail.com', 'superadmin@zadafoods.com') THEN 'superadmin'
            ELSE 'customer'
        END
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ==============================================================================
-- 17. ATOMIC BUSINESS LOGIC FUNCTIONS & SECURE RPCS
-- ==============================================================================

-- B1. Atomic Order Inventory Decrement (Deadlock-Free Sorted Row Locking)
CREATE OR REPLACE FUNCTION public.atomic_order_inventory_decrement(
    p_order_id UUID,
    p_items JSONB,
    p_actor UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_item JSONB;
    v_variant_id UUID;
    v_requested_qty INTEGER;
    v_current_stock INTEGER;
    v_sku TEXT;
    v_processed_count INTEGER := 0;
    v_already_processed BOOLEAN;
BEGIN
    -- Idempotency check: don't double deduct for the same order
    SELECT EXISTS (
        SELECT 1 FROM public.inventory_movements
        WHERE order_id = p_order_id AND movement_type = 'SALE'
    ) INTO v_already_processed;

    IF v_already_processed THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Order inventory deduction already processed idempotently.',
            'already_processed', true
        );
    END IF;

    -- Sort items by variant_id to eliminate deadlock risk under high concurrent checkout
    FOR v_item IN
        SELECT value FROM jsonb_array_elements(p_items)
        ORDER BY (value->>'variant_id') ASC
    LOOP
        v_variant_id := (v_item->>'variant_id')::UUID;
        v_requested_qty := (v_item->>'quantity')::INTEGER;

        IF v_requested_qty <= 0 THEN
            RAISE EXCEPTION 'ERR_INVALID_QUANTITY: Requested quantity must be positive';
        END IF;

        -- Acquire strict row-level exclusive lock (FOR UPDATE)
        SELECT stock_quantity, sku
        INTO v_current_stock, v_sku
        FROM public.product_variants
        WHERE id = v_variant_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'ERR_VARIANT_NOT_FOUND: Variant % does not exist', v_variant_id;
        END IF;

        IF v_current_stock < v_requested_qty THEN
            RAISE EXCEPTION 'ERR_INSUFFICIENT_STOCK: SKU % has % available, requested %',
                v_sku, v_current_stock, v_requested_qty;
        END IF;

        -- Decrement stock
        UPDATE public.product_variants
        SET stock_quantity = stock_quantity - v_requested_qty,
            updated_at = NOW()
        WHERE id = v_variant_id;

        -- Record Immutable Audit Movement
        INSERT INTO public.inventory_movements (
            variant_id,
            movement_type,
            quantity_change,
            previous_stock,
            new_stock,
            order_id,
            reason,
            created_by,
            created_at
        ) VALUES (
            v_variant_id,
            'SALE',
            -v_requested_qty,
            v_current_stock,
            v_current_stock - v_requested_qty,
            p_order_id,
            'Atomic deduction for verified order ' || p_order_id,
            p_actor,
            NOW()
        );

        v_processed_count := v_processed_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'items_deducted', v_processed_count
    );
END;
$$;

-- B2. Atomic Order Cancellation & Restock
CREATE OR REPLACE FUNCTION public.atomic_order_cancellation_restock(
    p_order_id UUID,
    p_actor UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_movement RECORD;
    v_current_stock INTEGER;
    v_already_restocked BOOLEAN;
    v_restocked_count INTEGER := 0;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.inventory_movements
        WHERE order_id = p_order_id AND movement_type = 'RESTOCK'
    ) INTO v_already_restocked;

    IF v_already_restocked THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Order items have already been restocked. Duplicate restock prevented.',
            'already_restocked', true
        );
    END IF;

    FOR v_movement IN
        SELECT variant_id, ABS(quantity_change) AS qty
        FROM public.inventory_movements
        WHERE order_id = p_order_id AND movement_type = 'SALE'
        ORDER BY variant_id ASC
    LOOP
        SELECT stock_quantity
        INTO v_current_stock
        FROM public.product_variants
        WHERE id = v_movement.variant_id
        FOR UPDATE;

        IF FOUND THEN
            UPDATE public.product_variants
            SET stock_quantity = stock_quantity + v_movement.qty,
                updated_at = NOW()
            WHERE id = v_movement.variant_id;

            INSERT INTO public.inventory_movements (
                variant_id,
                movement_type,
                quantity_change,
                previous_stock,
                new_stock,
                order_id,
                reason,
                created_by,
                created_at
            ) VALUES (
                v_movement.variant_id,
                'RESTOCK',
                v_movement.qty,
                v_current_stock,
                v_current_stock + v_movement.qty,
                p_order_id,
                'Restocked from cancelled order ' || p_order_id,
                p_actor,
                NOW()
            );

            v_restocked_count := v_restocked_count + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'items_restocked', v_restocked_count
    );
END;
$$;

-- B3. Expiration of Abandoned Orders
CREATE OR REPLACE FUNCTION public.release_unpaid_whatsapp_or_abandoned_orders(
    p_timeout_minutes INTEGER DEFAULT 1440
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_released_orders INTEGER := 0;
BEGIN
    FOR v_order IN
        SELECT id, order_number
        FROM public.orders
        WHERE payment_status = 'PENDING'
          AND fulfillment_status NOT IN ('CANCELLED', 'DELIVERED')
          AND created_at < (NOW() - (p_timeout_minutes || ' minutes')::INTERVAL)
    LOOP
        UPDATE public.orders
        SET fulfillment_status = 'CANCELLED',
            admin_notes = COALESCE(admin_notes, '') || E'\n[System]: Cancelled automatically due to payment timeout.',
            updated_at = NOW()
        WHERE id = v_order.id;

        PERFORM public.atomic_order_cancellation_restock(v_order.id);
        v_released_orders := v_released_orders + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'orders_expired_and_restocked', v_released_orders
    );
END;
$$;

-- B4. Server-Authoritative Order Creation RPC (Financial & Guest Security)
CREATE OR REPLACE FUNCTION public.create_order_server_authoritative(p_order_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_user_id UUID;
    v_customer_name TEXT;
    v_customer_email TEXT;
    v_customer_phone TEXT;
    v_shipping_address JSONB;
    v_delivery_method TEXT;
    v_payment_mode TEXT;
    v_coupon_code TEXT;

    v_items JSONB;
    v_item JSONB;
    v_item_var_id UUID;
    v_item_qty INTEGER;

    v_var RECORD;
    v_subtotal NUMERIC(10,2) := 0;
    v_discount NUMERIC(10,2) := 0;
    v_coupon_id UUID := NULL;
    v_free_shipping BOOLEAN := FALSE;
    v_coupon RECORD;

    v_shipping_setting JSONB;
    v_free_threshold NUMERIC(10,2) := 499.00;
    v_std_fee NUMERIC(10,2) := 40.00;
    v_exp_fee NUMERIC(10,2) := 80.00;
    v_shipping_charge NUMERIC(10,2) := 0;

    v_checkout_setting JSONB;
    v_total NUMERIC(10,2) := 0;
    v_cod_advance NUMERIC(10,2) := 0;
    v_cod_remaining NUMERIC(10,2) := 0;
    v_cod_advance_status VARCHAR(32) := NULL;

    v_guest_token TEXT := NULL;
    v_issued_at BIGINT;
    v_expires_at BIGINT;
    v_payload TEXT;
    v_token_secret TEXT;
    v_token_sig TEXT;
BEGIN
    v_items := p_order_data->'items';
    IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
        RAISE EXCEPTION 'ORDER_VALIDATION_FAILED: An order must contain at least one item.';
    END IF;

    v_customer_name := TRIM(COALESCE(p_order_data->>'customer_name', ''));
    v_customer_email := LOWER(TRIM(COALESCE(p_order_data->>'customer_email', '')));
    v_customer_phone := TRIM(COALESCE(p_order_data->>'customer_phone', ''));
    v_shipping_address := COALESCE(p_order_data->'shipping_address', '{}'::jsonb);
    v_delivery_method := UPPER(COALESCE(p_order_data->>'delivery_method', 'STANDARD'));
    v_payment_mode := UPPER(COALESCE(p_order_data->>'payment_mode', 'COD'));
    v_coupon_code := UPPER(TRIM(COALESCE(p_order_data->>'coupon_code', '')));

    IF v_customer_name = '' OR v_customer_phone = '' THEN
        RAISE EXCEPTION 'ORDER_VALIDATION_FAILED: Customer name and phone are required.';
    END IF;

    IF v_delivery_method NOT IN ('STANDARD', 'EXPRESS') THEN
        v_delivery_method := 'STANDARD';
    END IF;

    IF v_payment_mode NOT IN ('RAZORPAY', 'WHATSAPP_MANUAL', 'WHATSAPP', 'COD') THEN
        RAISE EXCEPTION 'ORDER_VALIDATION_FAILED: Invalid payment mode %.', v_payment_mode;
    END IF;

    IF auth.uid() IS NOT NULL THEN
        v_user_id := auth.uid();
    ELSE
        v_user_id := NULL;
    END IF;

    IF p_order_data->>'order_id' IS NOT NULL THEN
        v_order_id := (p_order_data->>'order_id')::UUID;
    ELSE
        v_order_id := gen_random_uuid();
    END IF;

    IF p_order_data->>'order_number' IS NOT NULL AND TRIM(p_order_data->>'order_number') <> '' THEN
        v_order_number := TRIM(p_order_data->>'order_number');
    ELSE
        v_order_number := 'ZDF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6));
    END IF;

    -- Sort items to prevent deadlocks and calculate authoritative subtotal
    FOR v_item IN
        SELECT value FROM jsonb_array_elements(v_items)
        ORDER BY (value->>'variant_id') ASC
    LOOP
        v_item_var_id := (v_item->>'variant_id')::UUID;
        v_item_qty := (v_item->>'quantity')::INTEGER;

        IF v_item_qty <= 0 THEN
            RAISE EXCEPTION 'ORDER_VALIDATION_FAILED: Item quantity must be at least 1.';
        END IF;

        SELECT pv.id, pv.product_id, pv.selling_price, pv.mrp, pv.stock_quantity, pv.sku,
               p.name AS product_name, pv.weight_label
        INTO v_var
        FROM public.product_variants pv
        JOIN public.products p ON p.id = pv.product_id
        WHERE pv.id = v_item_var_id
        FOR UPDATE OF pv;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'ORDER_VALIDATION_FAILED: Product variant % not found.', v_item_var_id;
        END IF;

        IF v_var.stock_quantity < v_item_qty THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK: Item % (%) is out of stock. % available, % requested.',
                v_var.product_name, v_var.sku, v_var.stock_quantity, v_item_qty;
        END IF;

        v_subtotal := v_subtotal + (v_var.selling_price * v_item_qty);
    END LOOP;

    -- Authoritative Coupon Discount Calculation
    IF v_coupon_code <> '' THEN
        SELECT * INTO v_coupon
        FROM public.coupons
        WHERE code = v_coupon_code AND is_active = TRUE
          AND (valid_until IS NULL OR valid_until > NOW());

        IF FOUND THEN
            IF v_subtotal >= v_coupon.min_order_amount THEN
                v_coupon_id := v_coupon.id;
                IF v_coupon.discount_type = 'PERCENTAGE' THEN
                    v_discount := ROUND((v_subtotal * (v_coupon.discount_value / 100.0)), 2);
                    IF v_coupon.max_discount_amount IS NOT NULL AND v_discount > v_coupon.max_discount_amount THEN
                        v_discount := v_coupon.max_discount_amount;
                    END IF;
                ELSIF v_coupon.discount_type = 'FLAT' THEN
                    v_discount := LEAST(v_coupon.discount_value, v_subtotal);
                ELSIF v_coupon.discount_type = 'FREE_SHIPPING' THEN
                    v_free_shipping := TRUE;
                END IF;
            END IF;
        END IF;
    END IF;

    -- Shipping Fee Calculation from store_settings
    SELECT value INTO v_shipping_setting FROM public.store_settings WHERE key = 'shipping';
    IF v_shipping_setting IS NOT NULL THEN
        v_free_threshold := COALESCE((v_shipping_setting->>'freeShippingThreshold')::numeric, 499.00);
        v_std_fee := COALESCE((v_shipping_setting->>'standardDeliveryFee')::numeric, 40.00);
        v_exp_fee := COALESCE((v_shipping_setting->>'expressDeliveryFee')::numeric, 80.00);
    END IF;

    IF v_free_shipping OR (v_delivery_method = 'STANDARD' AND (v_subtotal - v_discount) >= v_free_threshold) THEN
        v_shipping_charge := 0.00;
    ELSIF v_delivery_method = 'EXPRESS' THEN
        v_shipping_charge := v_exp_fee;
    ELSE
        v_shipping_charge := v_std_fee;
    END IF;

    v_total := GREATEST(0.00, (v_subtotal - v_discount) + v_shipping_charge);

    -- COD Advance Calculation
    IF v_payment_mode = 'COD' THEN
        SELECT value INTO v_checkout_setting FROM public.store_settings WHERE key = 'checkout';
        IF v_checkout_setting IS NOT NULL AND (v_checkout_setting->>'isCodAdvanceEnabled')::boolean = TRUE THEN
            IF v_total >= COALESCE((v_checkout_setting->>'codAdvanceMinOrderValue')::numeric, 0.00) THEN
                IF v_checkout_setting->>'codAdvanceType' = 'PERCENTAGE' THEN
                    v_cod_advance := ROUND(v_total * (COALESCE((v_checkout_setting->>'codAdvanceValue')::numeric, 10.0) / 100.0), 2);
                ELSE
                    v_cod_advance := LEAST(v_total, COALESCE((v_checkout_setting->>'codAdvanceValue')::numeric, 100.0));
                END IF;
                v_cod_advance_status := 'PENDING';
            END IF;
        END IF;
    END IF;

    v_cod_remaining := GREATEST(0.00, v_total - v_cod_advance);

    -- Insert Order
    INSERT INTO public.orders (
        id, order_number, user_id, customer_name, customer_email, customer_phone,
        shipping_address, delivery_method, payment_mode, payment_status, fulfillment_status,
        subtotal_amount, discount_amount, coupon_code, shipping_charge, total_amount,
        cod_advance_amount, cod_advance_paid, cod_remaining_amount, cod_advance_payment_status,
        created_at, updated_at
    ) VALUES (
        v_order_id, v_order_number, v_user_id, v_customer_name, v_customer_email, v_customer_phone,
        v_shipping_address, v_delivery_method, v_payment_mode, 'PENDING', 'PENDING',
        v_subtotal, v_discount, NULLIF(v_coupon_code, ''), v_shipping_charge, v_total,
        v_cod_advance, 0.00, v_cod_remaining, v_cod_advance_status,
        NOW(), NOW()
    );

    -- Insert Order Items and Decrement Stock
    FOR v_item IN
        SELECT value FROM jsonb_array_elements(v_items)
        ORDER BY (value->>'variant_id') ASC
    LOOP
        v_item_var_id := (v_item->>'variant_id')::UUID;
        v_item_qty := (v_item->>'quantity')::INTEGER;

        SELECT pv.id, pv.product_id, pv.selling_price, pv.mrp, pv.stock_quantity, pv.sku,
               p.name AS product_name, pv.weight_label
        INTO v_var
        FROM public.product_variants pv
        JOIN public.products p ON p.id = pv.product_id
        WHERE pv.id = v_item_var_id;

        INSERT INTO public.order_items (
            order_id, product_id, variant_id, product_name, variant_weight_label,
            unit_price, mrp, quantity, line_total
        ) VALUES (
            v_order_id, v_var.product_id, v_var.id, v_var.product_name, v_var.weight_label,
            v_var.selling_price, v_var.mrp, v_item_qty, (v_var.selling_price * v_item_qty)
        );

        UPDATE public.product_variants
        SET stock_quantity = stock_quantity - v_item_qty,
            updated_at = NOW()
        WHERE id = v_var.id;

        INSERT INTO public.inventory_movements (
            variant_id, movement_type, quantity_change, previous_stock, new_stock,
            order_id, reason, created_by, created_at
        ) VALUES (
            v_var.id, 'SALE', -v_item_qty, v_var.stock_quantity,
            v_var.stock_quantity - v_item_qty, v_order_id,
            'Authoritative deduction for order ' || v_order_number, v_user_id, NOW()
        );
    END LOOP;

    -- Update coupon usage
    IF v_coupon_id IS NOT NULL THEN
        UPDATE public.coupons
        SET times_used = times_used + 1, updated_at = NOW()
        WHERE id = v_coupon_id;
    END IF;

    -- Record initial status
    INSERT INTO public.order_status_history (order_id, status, notes, updated_by)
    VALUES (v_order_id, 'PENDING', 'Order placed authoritatively via server procedure', 'system');

    -- Generate Guest Order Token if Guest Checkout
    IF v_user_id IS NULL THEN
        SELECT secret INTO v_token_secret FROM private.server_secrets WHERE key = 'guest_order_hmac_secret';
        IF v_token_secret IS NULL OR v_token_secret = '' THEN
            RAISE EXCEPTION 'SECURITY_CONFIGURATION_ERROR: guest_order_hmac_secret is missing.';
        END IF;

        v_issued_at := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
        v_expires_at := (EXTRACT(EPOCH FROM (NOW() + INTERVAL '30 days')) * 1000)::BIGINT;
        v_payload := v_order_id::text || '.' || v_issued_at::text || '.' || v_expires_at::text;
        v_token_sig := encode(extensions.hmac(v_payload::bytea, v_token_secret::bytea, 'sha256'), 'hex');
        v_guest_token := 'got_' || v_payload || '.' || v_token_sig;

        INSERT INTO public.guest_order_tokens (order_id, token_hash, issued_at, expires_at)
        VALUES (v_order_id, encode(extensions.digest(v_guest_token::bytea, 'sha256'), 'hex'), NOW(), NOW() + INTERVAL '30 days');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'subtotal_amount', v_subtotal,
        'discount_amount', v_discount,
        'shipping_charge', v_shipping_charge,
        'total_amount', v_total,
        'cod_advance_amount', v_cod_advance,
        'cod_remaining_amount', v_cod_remaining,
        'payment_mode', v_payment_mode,
        'guest_token', v_guest_token
    );
END;
$$;

-- B5. Bootstrap Initial Super Admin
CREATE OR REPLACE FUNCTION public.bootstrap_super_admin(target_email TEXT)
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
            'success', false,
            'error', 'USER_NOT_FOUND',
            'message', 'User with email ' || norm_email || ' does not exist in Supabase Auth. Create user first.'
        );
    END IF;

    -- Enable session bypass for bootstrap execution
    PERFORM set_config('zada.bootstrap_mode', 'on', true);

    -- Confirm email (only email_confirmed_at)
    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = target_user_id;

    -- Upsert profiles
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (target_user_id, norm_email, 'ZaDa Super Administrator', 'superadmin')
    ON CONFLICT (id) DO UPDATE SET role = 'superadmin', updated_at = NOW();

    -- Upsert admin_accounts
    INSERT INTO public.admin_accounts (id, email, full_name, role, status, is_active)
    VALUES (target_user_id, norm_email, 'ZaDa Super Administrator', 'superadmin', 'active', TRUE)
    ON CONFLICT (id) DO UPDATE SET role = 'superadmin', status = 'active', is_active = TRUE, updated_at = NOW();

    -- Upsert admin_roles
    INSERT INTO public.admin_roles (user_id, role)
    VALUES (target_user_id, 'superadmin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'user_id', target_user_id,
        'email', norm_email,
        'role', 'superadmin'
    );
END;
$$;

-- ==============================================================================
-- 18. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_order_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festival_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. CATALOGUE POLICIES
-- ------------------------------------------------------------------------------

-- Categories
CREATE POLICY "Public can view active categories"
    ON public.categories FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins full management on categories"
    ON public.categories FOR ALL
    TO authenticated
    USING (public.is_admin() OR public.has_permission('catalog.categories'))
    WITH CHECK (public.is_admin() OR public.has_permission('catalog.categories'));

-- Subcategories
CREATE POLICY "Public can view active subcategories"
    ON public.subcategories FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins full management on subcategories"
    ON public.subcategories FOR ALL
    TO authenticated
    USING (public.is_admin() OR public.has_permission('catalog.categories'))
    WITH CHECK (public.is_admin() OR public.has_permission('catalog.categories'));

-- Products
CREATE POLICY "Public can view active published products"
    ON public.products FOR SELECT
    TO anon, authenticated
    USING ((is_published = TRUE AND is_active = TRUE AND deleted_at IS NULL) OR public.is_admin());

CREATE POLICY "Admins full management on products"
    ON public.products FOR ALL
    TO authenticated
    USING (public.is_admin() OR public.has_permission('catalog.products'))
    WITH CHECK (public.is_admin() OR public.has_permission('catalog.products'));

-- Product Variants
CREATE POLICY "Public can view active product variants"
    ON public.product_variants FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins full management on product_variants"
    ON public.product_variants FOR ALL
    TO authenticated
    USING (public.is_admin() OR public.has_permission('catalog.products'))
    WITH CHECK (public.is_admin() OR public.has_permission('catalog.products'));

-- Product Images
CREATE POLICY "Public can view product images"
    ON public.product_images FOR SELECT
    TO anon, authenticated
    USING (TRUE);

CREATE POLICY "Admins full management on product_images"
    ON public.product_images FOR ALL
    TO authenticated
    USING (public.is_admin() OR public.has_permission('catalog.products'))
    WITH CHECK (public.is_admin() OR public.has_permission('catalog.products'));

-- Product Tags & Attributes
CREATE POLICY "Public can view product tags" ON public.product_tags FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Admins full management on product tags" ON public.product_tags FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Public can view product attributes" ON public.product_attributes FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Admins full management on product attributes" ON public.product_attributes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- B. INVENTORY POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins can view inventory movements"
    ON public.inventory_movements FOR SELECT
    TO authenticated
    USING (public.is_admin() OR public.has_permission('inventory.manage'));

CREATE POLICY "Admins can insert inventory movements"
    ON public.inventory_movements FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin() OR public.has_permission('inventory.manage'));

CREATE POLICY "Admins can view stock adjustments"
    ON public.stock_adjustments FOR SELECT
    TO authenticated
    USING (public.is_admin() OR public.has_permission('inventory.manage'));

CREATE POLICY "Admins can insert stock adjustments"
    ON public.stock_adjustments FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin() OR public.has_permission('inventory.manage'));

-- ------------------------------------------------------------------------------
-- C. CUSTOMER PROFILE & ADDRESS POLICIES
-- ------------------------------------------------------------------------------

-- Profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile (non-role fields)"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id OR public.is_super_admin())
    WITH CHECK (auth.uid() = id OR public.is_super_admin());

CREATE POLICY "Admins can insert profiles"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id OR public.is_super_admin());

-- Addresses
CREATE POLICY "Users can view own addresses"
    ON public.addresses FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own addresses"
    ON public.addresses FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
    ON public.addresses FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can delete own addresses"
    ON public.addresses FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

-- Customer Preferences
CREATE POLICY "Users can view own preferences" ON public.customer_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can manage own preferences" ON public.customer_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- D. ORDERS & CHECKOUT POLICIES
-- ------------------------------------------------------------------------------

-- Orders
CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can manage all orders"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (public.is_admin() OR public.has_permission('orders.manage'))
    WITH CHECK (public.is_admin() OR public.has_permission('orders.manage'));

-- Allow insert via direct fallback or RPC
CREATE POLICY "Authenticated users and guests can insert orders"
    ON public.orders FOR INSERT
    TO anon, authenticated
    WITH CHECK (TRUE);

-- Order Items
CREATE POLICY "Users can view own order items"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND (o.user_id = auth.uid() OR public.is_admin()))
    );

CREATE POLICY "Allow insert of order items"
    ON public.order_items FOR INSERT
    TO anon, authenticated
    WITH CHECK (TRUE);

-- Order Status History
CREATE POLICY "Users can view status history of own orders"
    ON public.order_status_history FOR SELECT
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_status_history.order_id AND (o.user_id = auth.uid() OR public.is_admin()))
    );

CREATE POLICY "Admins can insert order status history"
    ON public.order_status_history FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin() OR public.has_permission('orders.manage'));

-- Payment Transactions & Refunds
CREATE POLICY "Admins can view payment transactions" ON public.payment_transactions FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can manage refunds" ON public.refunds FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Guest Order Tokens
CREATE POLICY "Service role can manage guest order tokens"
    ON public.guest_order_tokens FOR ALL
    TO authenticated, anon
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- E. CART & WISHLIST POLICIES
-- ------------------------------------------------------------------------------

-- Carts
CREATE POLICY "Users can manage own cart"
    ON public.carts FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Guests can manage cart by guest_id"
    ON public.carts FOR ALL
    TO anon
    USING (guest_id IS NOT NULL)
    WITH CHECK (guest_id IS NOT NULL);

-- Cart Items
CREATE POLICY "Users can manage own cart items"
    ON public.cart_items FOR ALL
    TO authenticated, anon
    USING (
        EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND (c.user_id = auth.uid() OR c.guest_id IS NOT NULL))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND (c.user_id = auth.uid() OR c.guest_id IS NOT NULL))
    );

-- Wishlists
CREATE POLICY "Users can manage own wishlist"
    ON public.wishlists FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- F. PROMOTIONS: COUPONS, PRICING RULES & COMBOS POLICIES
-- ------------------------------------------------------------------------------

-- Coupons
CREATE POLICY "Public can view active coupons"
    ON public.coupons FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins full management on coupons"
    ON public.coupons FOR ALL
    TO authenticated
    USING (public.is_admin() OR public.has_permission('promotions.coupons'))
    WITH CHECK (public.is_admin() OR public.has_permission('promotions.coupons'));

-- Pricing Rules
CREATE POLICY "Public can view active pricing rules"
    ON public.pricing_rules FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins full management on pricing_rules"
    ON public.pricing_rules FOR ALL
    TO authenticated
    USING (public.is_admin() OR public.has_permission('promotions.pricing_rules') OR public.has_permission('pricing_rules.manage'))
    WITH CHECK (public.is_admin() OR public.has_permission('promotions.pricing_rules') OR public.has_permission('pricing_rules.manage'));

-- Combos
CREATE POLICY "Public can view active combos"
    ON public.combos FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins full management on combos"
    ON public.combos FOR ALL
    TO authenticated
    USING (public.is_admin() OR public.has_permission('promotions.combos') OR public.has_permission('combos.manage'))
    WITH CHECK (public.is_admin() OR public.has_permission('promotions.combos') OR public.has_permission('combos.manage'));

-- Combo Items
CREATE POLICY "Public can view combo items"
    ON public.combo_items FOR SELECT
    TO anon, authenticated
    USING (TRUE);

CREATE POLICY "Admins full management on combo_items"
    ON public.combo_items FOR ALL
    TO authenticated
    USING (public.is_admin() OR public.has_permission('promotions.combos') OR public.has_permission('combos.manage'))
    WITH CHECK (public.is_admin() OR public.has_permission('promotions.combos') OR public.has_permission('combos.manage'));

-- ------------------------------------------------------------------------------
-- G. CMS & BANNERS POLICIES
-- ------------------------------------------------------------------------------

-- Homepage Banners
CREATE POLICY "Public can view active homepage banners"
    ON public.homepage_banners FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins full management on homepage_banners"
    ON public.homepage_banners FOR ALL
    TO authenticated
    USING (public.is_admin() OR public.has_permission('cms.hero_banners'))
    WITH CHECK (public.is_admin() OR public.has_permission('cms.hero_banners'));

-- Category Banners
CREATE POLICY "Public can view active category banners"
    ON public.category_banners FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins full management on category_banners"
    ON public.category_banners FOR ALL
    TO authenticated
    USING (public.is_admin() OR public.has_permission('cms.category_banners'))
    WITH CHECK (public.is_admin() OR public.has_permission('cms.category_banners'));

-- Homepage Sections & Store Content
CREATE POLICY "Public can view visible homepage sections" ON public.homepage_sections FOR SELECT TO anon, authenticated USING (is_visible = TRUE OR public.is_admin());
CREATE POLICY "Admins can manage homepage sections" ON public.homepage_sections FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Public can view store content" ON public.store_content FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Admins can manage store content" ON public.store_content FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- H. FESTIVAL THEMES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can view festival themes"
    ON public.festival_themes FOR SELECT
    TO anon, authenticated
    USING (TRUE);

CREATE POLICY "Admins full management on festival_themes"
    ON public.festival_themes FOR ALL
    TO authenticated
    USING (public.is_admin() OR public.has_permission('cms.festivals'))
    WITH CHECK (public.is_admin() OR public.has_permission('cms.festivals'));

-- ------------------------------------------------------------------------------
-- I. REVIEWS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can view approved reviews"
    ON public.reviews FOR SELECT
    TO anon, authenticated
    USING (is_approved = TRUE OR public.is_admin());

CREATE POLICY "Anyone can submit reviews for moderation"
    ON public.reviews FOR INSERT
    TO anon, authenticated
    WITH CHECK (TRUE);

CREATE POLICY "Admins full management on reviews"
    ON public.reviews FOR ALL
    TO authenticated
    USING (public.is_admin() OR public.has_permission('cms.reviews'))
    WITH CHECK (public.is_admin() OR public.has_permission('cms.reviews'));

-- ------------------------------------------------------------------------------
-- J. BULK ENQUIRIES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Anyone can submit bulk enquiries"
    ON public.bulk_enquiries FOR INSERT
    TO anon, authenticated
    WITH CHECK (TRUE);

CREATE POLICY "Admins can view and manage bulk enquiries"
    ON public.bulk_enquiries FOR ALL
    TO authenticated
    USING (public.is_admin() OR public.has_permission('dashboard.view'))
    WITH CHECK (public.is_admin() OR public.has_permission('dashboard.view'));

-- ------------------------------------------------------------------------------
-- K. STORE SETTINGS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Public can view store settings"
    ON public.store_settings FOR SELECT
    TO anon, authenticated
    USING (TRUE);

CREATE POLICY "Super Admins can update store settings"
    ON public.store_settings FOR ALL
    TO authenticated
    USING (public.is_super_admin() OR public.has_permission('settings.manage'))
    WITH CHECK (public.is_super_admin() OR public.has_permission('settings.manage'));

-- ------------------------------------------------------------------------------
-- L. ADMIN MANAGEMENT & AUDIT POLICIES
-- ------------------------------------------------------------------------------

-- Admin Accounts
CREATE POLICY "Super Admins manage admin accounts"
    ON public.admin_accounts FOR ALL
    TO authenticated
    USING (public.is_super_admin() OR id = auth.uid())
    WITH CHECK (public.is_super_admin());

-- Admin Roles
CREATE POLICY "Super Admins manage admin roles"
    ON public.admin_roles FOR ALL
    TO authenticated
    USING (public.is_super_admin() OR user_id = auth.uid())
    WITH CHECK (public.is_super_admin());

-- Admin Permissions
CREATE POLICY "Super Admins manage admin permissions"
    ON public.admin_permissions FOR ALL
    TO authenticated
    USING (public.is_super_admin() OR user_id = auth.uid())
    WITH CHECK (public.is_super_admin());

-- Admin Audit Logs
CREATE POLICY "Admins can view audit logs"
    ON public.admin_audit_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins can create audit logs"
    ON public.admin_audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- 19. GRANT PRIVILEGES TO ROLES
-- ==============================================================================

-- Grants for authenticated users (Customers & Admins; RLS governs access)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grants for anon users (Public Storefront)
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.subcategories TO anon;
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT ON public.product_images TO anon;
GRANT SELECT ON public.product_tags TO anon;
GRANT SELECT ON public.product_attributes TO anon;
GRANT SELECT ON public.coupons TO anon;
GRANT SELECT ON public.pricing_rules TO anon;
GRANT SELECT ON public.combos TO anon;
GRANT SELECT ON public.combo_items TO anon;
GRANT SELECT ON public.homepage_banners TO anon;
GRANT SELECT ON public.category_banners TO anon;
GRANT SELECT ON public.homepage_sections TO anon;
GRANT SELECT ON public.store_content TO anon;
GRANT SELECT ON public.festival_themes TO anon;
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.store_settings TO anon;
GRANT SELECT ON public.customer_addresses TO anon;

-- Storefront anon submissions
GRANT INSERT ON public.reviews TO anon;
GRANT INSERT ON public.bulk_enquiries TO anon;
GRANT INSERT ON public.orders TO anon;
GRANT INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO anon;

-- Function Execution Grants
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.bootstrap_super_admin(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.atomic_order_inventory_decrement(UUID, JSONB, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.atomic_order_cancellation_restock(UUID, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.release_unpaid_whatsapp_or_abandoned_orders(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_order_server_authoritative(JSONB) TO anon, authenticated, service_role;

-- ==============================================================================
-- 20. MASTER SEED DATA: OFFICIAL ZADA FOODS ASSETS & COMPLIANCE
-- ==============================================================================

-- 1. Official Store Settings (Exact Business Data & Compliance Details)
INSERT INTO public.store_settings (key, value, updated_at) VALUES
('shipping', '{
  "standardDeliveryFee": 40,
  "freeShippingThreshold": 499,
  "expressDeliveryFee": 80
}'::jsonb, NOW()),
('checkout', '{
  "checkoutMode": "WEBSITE",
  "isRazorpayEnabled": true,
  "isCodGloballyEnabled": true,
  "isCodAdvanceEnabled": false,
  "codAdvanceType": "FIXED",
  "codAdvanceValue": 0,
  "codAdvanceMinOrderValue": 0,
  "codAdvanceMinAmount": 0,
  "codAdvanceMaxAmount": 0,
  "whatsappDestinationNumber": "917593959235",
  "isWhatsAppCheckoutEnabled": true,
  "primaryCheckoutMode": "RAZORPAY",
  "defaultCustomerPaymentMethod": "COD"
}'::jsonb, NOW()),
('compliance', '{
  "storeName": "ZaDa Foods",
  "tagline": "Authentic Kerala Flavours, Rooted in Tradition",
  "fssaiLicenseNumber": "21326145000345",
  "registeredBusinessAddress": "Punalur, Kollam (Dist), Kerala – 691305",
  "supportPhone": "+91 8891537982",
  "supportWhatsApp": "+91 7593959235",
  "supportEmail": "Zadafoods4@gmail.com"
}'::jsonb, NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- 2. Official Categories
INSERT INTO public.categories (id, slug, name, description, image_url, display_order, is_active) VALUES
('c0000000-0000-0000-0000-000000000001', 'chips', 'Chips', 'Crispy, tasty and traditional Kerala chips fried in cold-pressed coconut oil.', '/assets/cat-chips.png', 1, TRUE),
('c0000000-0000-0000-0000-000000000002', 'sweets', 'Traditional Sweets', 'Heritage Malabar and Travancore sweets made with unrefined jaggery and pure cow ghee.', '/assets/cat-sweets.png', 2, TRUE),
('c0000000-0000-0000-0000-000000000003', 'halwa', 'Authentic Halwa', 'World-famous Kozhikode halwa slow-cooked in copper urns with premium coconut oil and ghee.', '/assets/cat-halwa.png', 3, TRUE),
('c0000000-0000-0000-0000-000000000004', 'spices-and-blends', 'Spices & Blends', 'Pure Wayanad black pepper, green cardamom, and stone-ground heritage spice masalas.', '/assets/cat-spices.png', 4, TRUE),
('c0000000-0000-0000-0000-000000000005', 'pickles', 'Kerala Pickles', 'Handcrafted regional pickles cured in mustard oil and sesame oil with traditional spices.', '/assets/cat-pickles.png', 5, TRUE),
('c0000000-0000-0000-0000-000000000006', 'gift-packs', 'Gift Boxes & Combos', 'Carefully curated hampers bringing together Kerala''s finest traditional delicacies.', '/assets/cat-gift-packs.png', 6, TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, is_active = EXCLUDED.is_active;

-- 3. Official Subcategories
INSERT INTO public.subcategories (id, category_id, slug, name, description, display_order, is_active) VALUES
('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'banana-chips', 'Banana Chips', 'Thinly sliced Nendran bananas fried in cold-pressed coconut oil.', 1, TRUE),
('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'tapioca', 'Tapioca Chips', 'Crispy Kerala kappa wafers delicately seasoned with salt and spices.', 2, TRUE),
('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'jackfruit', 'Jackfruit Chips', 'Golden crisp Malabar chakka chips made from ripe mature jackfruit.', 3, TRUE),
('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', 'black-halwa', 'Black Halwa', 'Traditional dark jaggery Kozhikode halwa cooked in pure cow ghee.', 1, TRUE),
('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000004', 'whole-spices', 'Whole Spices', 'Sun-dried Malabar black pepper and Wayanad green cardamom pods.', 1, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4. Initial Authentic Products
INSERT INTO public.products (
    id, category_id, subcategory_id, name, slug, tagline, description,
    ingredients, nutrition_facts, storage_instructions, shelf_life_days,
    is_preservative_free, is_coconut_oil_made, is_bestseller, is_on_offer,
    is_cod_eligible, is_published, is_active, average_rating, review_count
) VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Authentic Kerala Banana Chips',
    'authentic-banana-chips',
    'Fried in 100% Pure Cold-Pressed Coconut Oil',
    'Hand-sliced premium Nendran bananas fried to crisp perfection in cold-pressed coconut oil, seasoned with natural sea salt and pure turmeric.',
    'Raw Nendran Bananas, Pure Cold-Pressed Coconut Oil, Turmeric Powder, Sea Salt',
    '{"calories": "520 kcal", "carbohydrates": "58g", "protein": "2.8g", "fat": "31g"}'::jsonb,
    'Store in an airtight container in a cool, dry place away from direct sunlight.',
    60, TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, 5.00, 0
),
(
    'd0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'Traditional Tapioca Chips',
    'traditional-tapioca-chips',
    'Thinly sliced kappa wafers with red chilli crunch',
    'Crispy and spicy cassava chips seasoned with fiery bird''s eye chilli, curry leaves, and unrefined salt.',
    'Cassava / Tapioca, Pure Coconut Oil, Red Chilli Powder, Curry Leaves, Salt',
    '{"calories": "480 kcal", "carbohydrates": "62g", "protein": "1.5g", "fat": "24g"}'::jsonb,
    'Keep sealed in an airtight container for maximum crispiness.',
    45, TRUE, TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 5.00, 0
),
(
    'd0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000003',
    'Golden Jackfruit Chips',
    'golden-jackfruit-chips',
    'Natural sweet-savoury crunch from mature Varikka chakka',
    'Sun-ripened Varikka jackfruit slices fried in virgin coconut oil. A seasonal delicacy celebrated for its distinctive aroma and natural golden sweetness.',
    'Raw Jackfruit (Varikka), Cold-Pressed Coconut Oil, Sea Salt',
    '{"calories": "490 kcal", "carbohydrates": "64g", "protein": "3.1g", "fat": "25g"}'::jsonb,
    'Store in a cool, dry place. Seal tightly after opening.',
    45, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 5.00, 0
),
(
    'd0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000004',
    'Royal Kozhikode Black Halwa',
    'royal-kozhikode-black-halwa',
    'Cooked in copper urulis with dark palm jaggery & ghee',
    'Silky, melt-in-mouth heritage halwa slow-stirred for over 8 hours in traditional copper vats with aged Marayoor jaggery, pure ghee, and roasted cashews.',
    'Pure Cow Ghee, Marayoor Jaggery, Rice Flour, Coconut Milk, Cashews, Cardamom',
    '{"calories": "440 kcal", "carbohydrates": "68g", "protein": "4.2g", "fat": "18g"}'::jsonb,
    'Best kept at room temperature. Do not refrigerate.',
    90, TRUE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, 5.00, 0
),
(
    'd0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000005',
    'Malabar Whole Black Pepper',
    'malabar-whole-black-pepper',
    'Sun-dried high-piperine heritage tellicherry peppercorns',
    'Handpicked bold black pepper berries sourced directly from organic hill estates of Wayanad, offering sharp pungent heat and rich floral aroma.',
    '100% Whole Black Pepper Berries (Piper nigrum)',
    '{"calories": "250 kcal", "carbohydrates": "64g", "protein": "10.4g", "fat": "3.3g"}'::jsonb,
    'Store in an airtight spice container in a cool, dark place.',
    365, TRUE, FALSE, FALSE, FALSE, TRUE, TRUE, TRUE, 5.00, 0
)
ON CONFLICT (id) DO NOTHING;

-- 5. Product Variants & Real Inventory Stock
INSERT INTO public.product_variants (
    id, product_id, sku, weight_value, weight_unit, weight_label,
    selling_price, mrp, discount_percentage, stock_quantity, low_stock_threshold, is_default, is_active
) VALUES
('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'ZDF-BNC-250G', 250, 'g', '250g', 140.00, 160.00, 12.50, 150, 15, TRUE, TRUE),
('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'ZDF-BNC-500G', 500, 'g', '500g', 260.00, 300.00, 13.33, 100, 10, FALSE, TRUE),
('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'ZDF-BNC-1KG', 1000, 'g', '1kg', 499.00, 580.00, 13.97, 60, 5, FALSE, TRUE),
('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'ZDF-TPC-250G', 250, 'g', '250g', 120.00, 140.00, 14.29, 120, 10, TRUE, TRUE),
('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000003', 'ZDF-JKF-200G', 200, 'g', '200g', 180.00, 220.00, 18.18, 90, 10, TRUE, TRUE),
('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000004', 'ZDF-HLW-500G', 500, 'g', '500g', 290.00, 340.00, 14.71, 75, 10, TRUE, TRUE),
('e0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000005', 'ZDF-PEP-200G', 200, 'g', '200g', 210.00, 250.00, 16.00, 110, 10, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 6. Product Images
INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary) VALUES
('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '/assets/prod-banana-chips.png', 'Authentic Kerala Banana Chips', 0, TRUE),
('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', '/assets/prod-tapioca-chips.png', 'Traditional Tapioca Chips', 0, TRUE),
('f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', '/assets/prod-jackfruit-chips.png', 'Golden Jackfruit Chips', 0, TRUE),
('f0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', '/assets/prod-black-halwa.png', 'Royal Kozhikode Black Halwa', 0, TRUE),
('f0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', '/assets/prod-pepper.png', 'Malabar Whole Black Pepper', 0, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 7. Homepage Banners
INSERT INTO public.homepage_banners (id, title, subtitle, headline, badge_text, cta_text, cta_url, image_url, background_color, display_order, is_active) VALUES
('a1000000-0000-0000-0000-000000000001', 'Pure Cold-Pressed Flavours', 'Handcrafted in Punalur, Kollam with generational devotion', 'Experience the Heritage of Pure Kerala Crunch', 'Handmade in Pure Coconut Oil', 'Shop Traditional Crisps', '/shop?category=chips', '/assets/hero-banner-1.png', '#072C20', 1, TRUE),
('a1000000-0000-0000-0000-000000000002', 'Authentic Malabar Delicacies', 'Slow-cooked in copper urulis with aged Marayoor jaggery', 'Royal Kozhikode Halwa & Traditional Sweets', 'Heritage Recipe', 'Explore Sweets', '/shop?category=sweets', '/assets/hero-banner-2.png', '#1B3B2B', 2, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 8. Category Banners
INSERT INTO public.category_banners (id, category_id, category_slug, title, subtitle, eyebrow, background_color, text_color, image_url, display_order, is_active) VALUES
('a2000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'chips', 'Traditional Crisps & Wafers', 'Hand-sliced Nendran bananas and kappa fried to golden crunch in cold-pressed coconut oil.', 'Generational Mastery', '#072C20', '#FFFFFF', '/assets/cat-chips.png', 1, TRUE),
('a2000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'sweets', 'Heritage Kerala Sweets', 'Pure ghee, aged jaggery, and fragrant cardamom confections crafted with heritage artistry.', 'Royal Recipes', '#1B3B2B', '#FFFFFF', '/assets/cat-sweets.png', 2, TRUE),
('a2000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000004', 'spices-and-blends', 'Aromatic Hill Estate Spices', 'High-altitude tellicherry pepper, bold green cardamom, and stone-ground aromatic blends.', 'Pure & Unadulterated', '#2C1D11', '#FFFFFF', '/assets/cat-spices.png', 3, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 9. Active Festival Themes
INSERT INTO public.festival_themes (id, slug, name, preset, is_active, intensity, primary_color, accent_color, banner_url, motifs) VALUES
('a3000000-0000-0000-0000-000000000001', 'onam', 'Onam Festive Celebration', 'onam', FALSE, 'festive', '#E5A93C', '#2C6E49', '/assets/festival-onam.png', '["pookkalam", "kathakali", "kasavu"]'::jsonb),
('a3000000-0000-0000-0000-000000000002', 'diwali', 'Deepavali Festival of Lights', 'diwali', FALSE, 'moderate', '#FFB703', '#D00000', '/assets/festival-diwali.png', '["diya", "rangoli", "sparks"]'::jsonb),
('a3000000-0000-0000-0000-000000000003', 'christmas', 'Christmas & New Year Season', 'christmas', FALSE, 'subtle', '#C1121F', '#007200', '/assets/festival-christmas.png', '["star", "pine", "snow"]'::jsonb),
('a3000000-0000-0000-0000-000000000004', 'eid', 'Eid Heritage Festivities', 'eid', FALSE, 'moderate', '#107E7D', '#FFD166', '/assets/festival-eid.png', '["crescent", "lantern", "arabesque"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 10. Promotional Coupons
INSERT INTO public.coupons (id, code, description, discount_type, discount_value, max_discount_amount, min_order_amount, is_first_order_only, is_active) VALUES
('a4000000-0000-0000-0000-000000000001', 'WELCOME10', '10% off on your first authentic Kerala order', 'PERCENTAGE', 10.00, 150.00, 299.00, TRUE, TRUE),
('a4000000-0000-0000-0000-000000000002', 'FESTIVE15', 'Festive discount of 15% on orders above ₹799', 'PERCENTAGE', 15.00, 250.00, 799.00, FALSE, TRUE),
('a4000000-0000-0000-0000-000000000003', 'FREESHIP', 'Free delivery on all premium orders above ₹399', 'FREE_SHIPPING', 0.00, NULL, 399.00, FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 11. Promotional Pricing Rules
INSERT INTO public.pricing_rules (id, name, description, rule_type, buy_quantity, get_quantity, discount_percentage, min_cart_total, is_active) VALUES
('a5000000-0000-0000-0000-000000000001', 'Buy 2 Get 1 Free on Tapioca Chips', 'Automatic BOGO offer for crispy tapioca lovers', 'BOGO', 2, 1, 100.00, 0.00, TRUE),
('a5000000-0000-0000-0000-000000000002', 'Volume Tier: 10% Off on 3+ Packets', 'Order 3 or more packets of banana chips for 10% instant bundle savings', 'VOLUME_TIER', 3, 0, 10.00, 0.00, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 12. Storage Buckets & Policies Initialization
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
('product-images', 'product-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg']),
('banners', 'banners', true, 8388608, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg']),
('category-banners', 'category-banners', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg', 'image/svg+xml']),
('festival-assets', 'festival-assets', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id IN ('product-images', 'banners', 'category-banners', 'festival-assets'));

DROP POLICY IF EXISTS "Admins can upload storage objects" ON storage.objects;
CREATE POLICY "Admins can upload storage objects"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id IN ('product-images', 'banners', 'category-banners', 'festival-assets')
        AND (public.is_admin() = true OR public.is_super_admin() = true)
    );

DROP POLICY IF EXISTS "Admins can update storage objects" ON storage.objects;
CREATE POLICY "Admins can update storage objects"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id IN ('product-images', 'banners', 'category-banners', 'festival-assets')
        AND (public.is_admin() = true OR public.is_super_admin() = true)
    );

DROP POLICY IF EXISTS "Admins can delete storage objects" ON storage.objects;
CREATE POLICY "Admins can delete storage objects"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id IN ('product-images', 'banners', 'category-banners', 'festival-assets')
        AND (public.is_admin() = true OR public.is_super_admin() = true)
    );

-- Commit Transaction
COMMIT;
