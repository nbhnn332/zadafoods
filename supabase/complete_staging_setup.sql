-- ==============================================================================
-- ZaDa Foods — Complete Executable Supabase Staging Database Setup Script
-- Reconciles Migrations:
--   01: Initial Schema (28 Tables + Content Pages, Indexes, Constraints)
--   02: Row Level Security (RLS Policies & is_admin Definitive Function)
--   03: Staging Dev Seed Data (10 Categories, Subcategories, Products, Coupons)
--   04: Atomic Inventory Operations (SELECT FOR UPDATE, Restock, Expiration)
--   05: Scheduled Maintenance, Security Hardening & pg_cron Automation
-- ==============================================================================

-- Ensure transaction safety
BEGIN;

-- ------------------------------------------------------------------------------
-- SECTION 1: EXTENSIONS & INITIAL SETUP
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- SECTION 2: RELATIONAL CORE SCHEMA (29 TABLES)
-- ------------------------------------------------------------------------------

-- 1. PROFILES (Synchronized with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. ADMIN ROLES & AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'superadmin', 'support_staff')),
    granted_by UUID REFERENCES public.profiles(id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.admin_audit_logs(entity, entity_id);

-- 3. CATEGORIES & SUBCATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories(display_order);

CREATE TABLE IF NOT EXISTS public.subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (category_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_subcategories_cat ON public.subcategories(category_id);

-- 4. PRODUCTS & MEDIA
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id),
    subcategory_id UUID REFERENCES public.subcategories(id),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    tagline TEXT,
    description TEXT NOT NULL,
    ingredients TEXT,
    nutrition_facts JSONB,
    storage_instructions TEXT DEFAULT 'Store in an airtight container in a cool, dry place.',
    shelf_life_days INTEGER DEFAULT 90,
    is_preservative_free BOOLEAN NOT NULL DEFAULT TRUE,
    is_coconut_oil_made BOOLEAN NOT NULL DEFAULT TRUE,
    is_bestseller BOOLEAN NOT NULL DEFAULT FALSE,
    is_on_offer BOOLEAN NOT NULL DEFAULT FALSE,
    is_cod_eligible BOOLEAN NOT NULL DEFAULT TRUE,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    average_rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
    review_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_published ON public.products(is_published);

CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_prod ON public.product_images(product_id, display_order);

-- 5. SKUs, PRODUCT VARIANTS & INVENTORY MOVEMENTS
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE NOT NULL,
    weight_value INTEGER NOT NULL,
    weight_unit TEXT NOT NULL DEFAULT 'g' CHECK (weight_unit IN ('g', 'kg', 'ml', 'L', 'pack')),
    weight_label TEXT NOT NULL,
    selling_price NUMERIC(10,2) NOT NULL CHECK (selling_price >= 0),
    mrp NUMERIC(10,2) NOT NULL CHECK (mrp >= selling_price),
    discount_percentage NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE WHEN mrp > 0 THEN ROUND(((mrp - selling_price) / mrp) * 100, 0) ELSE 0 END
    ) STORED,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON public.product_variants(sku);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('PURCHASE', 'SALE', 'RETURN', 'MANUAL_ADJUSTMENT', 'RESERVATION_HOLD', 'RELEASE_HOLD')),
    quantity_change INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    order_id UUID,
    reason TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_movement_var ON public.inventory_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_inv_movement_order ON public.inventory_movements(order_id);

-- 6. COMBOS & PACKAGES
CREATE TABLE IF NOT EXISTS public.combos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    combo_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    discount_type TEXT NOT NULL DEFAULT 'FLAT' CHECK (discount_type IN ('FLAT', 'PERCENTAGE')),
    discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.combo_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id UUID NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_combo_items_combo ON public.combo_items(combo_id);

-- 7. PROMOTIONS & QUANTITY TIER PRICING (BOGO, Bulk Tiers)
CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('QUANTITY_TIER', 'BOGO', 'CATEGORY_DISCOUNT')),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
    min_quantity INTEGER NOT NULL DEFAULT 1,
    discount_percentage NUMERIC(5,2),
    fixed_price NUMERIC(10,2),
    buy_quantity INTEGER,
    get_quantity INTEGER,
    free_variant_id UUID REFERENCES public.product_variants(id),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_prod ON public.pricing_rules(product_id, is_active);

-- 8. COUPONS & USAGE RECORDS
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FLAT', 'FREE_SHIPPING')),
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    max_discount_amount NUMERIC(10,2),
    min_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    is_first_order_only BOOLEAN NOT NULL DEFAULT FALSE,
    usage_limit INTEGER,
    times_used INTEGER NOT NULL DEFAULT 0,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

CREATE TABLE IF NOT EXISTS public.coupon_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id UUID NOT NULL,
    discount_amount NUMERIC(10,2) NOT NULL,
    used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON public.coupon_usages(user_id, coupon_id);

-- 9. SAVED ADDRESSES
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tag TEXT NOT NULL DEFAULT 'Home' CHECK (tag IN ('Home', 'Work', 'Other')),
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

CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);

-- 10. CARTS & WISHLISTS
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cart_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items(cart_id);

CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);

-- 11. ORDERS, ORDER ITEMS & ORDER STATUS HISTORY
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address JSONB NOT NULL,
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('STANDARD', 'EXPRESS')),
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('RAZORPAY', 'WHATSAPP_MANUAL', 'COD')),
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    fulfillment_status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (fulfillment_status IN ('CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    subtotal_amount NUMERIC(10,2) NOT NULL CHECK (subtotal_amount >= 0),
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    coupon_id UUID REFERENCES public.coupons(id),
    shipping_charge NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
    courier_name TEXT,
    tracking_number TEXT,
    tracking_url TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment ON public.orders(fulfillment_status);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id),
    product_name TEXT NOT NULL,
    variant_weight_label TEXT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    mrp NUMERIC(10,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total NUMERIC(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    notes TEXT,
    courier_name TEXT,
    tracking_number TEXT,
    updated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_history_order ON public.order_status_history(order_id, created_at);

-- 12. PAYMENTS & WEBHOOK LOGS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    razorpay_order_id TEXT NOT NULL,
    razorpay_payment_id TEXT UNIQUE,
    razorpay_signature TEXT,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL CHECK (status IN ('INITIATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED')),
    method TEXT,
    error_code TEXT,
    error_description TEXT,
    raw_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_rp_order ON public.payments(razorpay_order_id);

CREATE TABLE IF NOT EXISTS public.payment_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    is_processed BOOLEAN NOT NULL DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_event ON public.payment_webhooks(event_id);

-- 13. CUSTOMER REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_title TEXT,
    review_text TEXT NOT NULL,
    is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured_on_pdp BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id, is_approved);

-- 14. HOMEPAGE CMS & CONFIGURATION
CREATE TABLE IF NOT EXISTS public.homepage_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    cta_text TEXT NOT NULL DEFAULT 'Shop Now',
    cta_link TEXT NOT NULL DEFAULT '/category/chips',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.homepage_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    config JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. BULK ENQUIRIES & LEADS PIPELINE
CREATE TABLE IF NOT EXISTS public.bulk_enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    organization_name TEXT,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    event_type TEXT NOT NULL,
    estimated_quantity INTEGER NOT NULL CHECK (estimated_quantity > 0),
    required_date DATE,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'QUOTE_SENT', 'WON', 'CLOSED')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bulk_enquiries_status ON public.bulk_enquiries(status);

-- 16. STORE SETTINGS
CREATE TABLE IF NOT EXISTS public.store_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. EDITABLE STORE CONTENT PAGES (About, FAQ, Policies)
CREATE TABLE IF NOT EXISTS public.store_content_pages (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- SECTION 3: AUTOMATIC PROFILE CREATION TRIGGER (AUTH HOOK)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, phone, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
        'customer'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- SECTION 4: SECURITY DEFINER FUNCTIONS & AUTHORIZATION HELPERS
-- ------------------------------------------------------------------------------

-- Helper function to check if the executing user is an Administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Check admin_roles first (non-recursive)
    IF EXISTS (
        SELECT 1 FROM public.admin_roles
        WHERE user_id = auth.uid()
    ) THEN
        RETURN TRUE;
    END IF;

    -- Fallback to profile role
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'staff')
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- SECTION 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_content_pages ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (auth.uid() = id OR public.is_admin());

-- PUBLIC STOREFRONT READ POLICIES
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories"
    ON public.categories FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Public can view active subcategories" ON public.subcategories;
CREATE POLICY "Public can view active subcategories"
    ON public.subcategories FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Public can view published products" ON public.products;
CREATE POLICY "Public can view published products"
    ON public.products FOR SELECT
    USING (is_published = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;
CREATE POLICY "Public can view product images"
    ON public.product_images FOR SELECT
    USING (TRUE);

DROP POLICY IF EXISTS "Public can view product variants" ON public.product_variants;
CREATE POLICY "Public can view product variants"
    ON public.product_variants FOR SELECT
    USING (TRUE);

DROP POLICY IF EXISTS "Public can view active combos" ON public.combos;
CREATE POLICY "Public can view active combos"
    ON public.combos FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Public can view combo items" ON public.combo_items;
CREATE POLICY "Public can view combo items"
    ON public.combo_items FOR SELECT
    USING (TRUE);

DROP POLICY IF EXISTS "Public can view active pricing rules" ON public.pricing_rules;
CREATE POLICY "Public can view active pricing rules"
    ON public.pricing_rules FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews"
    ON public.reviews FOR SELECT
    USING (is_approved = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Public can view active homepage banners" ON public.homepage_banners;
CREATE POLICY "Public can view active homepage banners"
    ON public.homepage_banners FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Public can view active homepage sections" ON public.homepage_sections;
CREATE POLICY "Public can view active homepage sections"
    ON public.homepage_sections FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Public can view store settings" ON public.store_settings;
CREATE POLICY "Public can view store settings"
    ON public.store_settings FOR SELECT
    USING (TRUE);

DROP POLICY IF EXISTS "Public can view store content pages" ON public.store_content_pages;
CREATE POLICY "Public can view store content pages"
    ON public.store_content_pages FOR SELECT
    USING (is_published = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Public can validate active coupons" ON public.coupons;
CREATE POLICY "Public can validate active coupons"
    ON public.coupons FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

-- CUSTOMER PERSONAL DATA POLICIES
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;
CREATE POLICY "Users can manage own addresses"
    ON public.addresses FOR ALL
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can manage own carts" ON public.carts;
CREATE POLICY "Users can manage own carts"
    ON public.carts FOR ALL
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can manage own cart items" ON public.cart_items;
CREATE POLICY "Users can manage own cart items"
    ON public.cart_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.carts
            WHERE carts.id = cart_items.cart_id AND (carts.user_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlists;
CREATE POLICY "Users can manage own wishlist"
    ON public.wishlists FOR ALL
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR public.is_admin());

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Users can view own order status history" ON public.order_status_history;
CREATE POLICY "Users can view own order status history"
    ON public.order_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_status_history.order_id AND (orders.user_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Authenticated users can submit reviews" ON public.reviews;
CREATE POLICY "Authenticated users can submit reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Public can submit bulk enquiries" ON public.bulk_enquiries;
CREATE POLICY "Public can submit bulk enquiries"
    ON public.bulk_enquiries FOR INSERT
    WITH CHECK (TRUE);

-- ADMIN FULL MANAGEMENT POLICIES
DROP POLICY IF EXISTS "Admins full management on categories" ON public.categories;
CREATE POLICY "Admins full management on categories" ON public.categories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins full management on subcategories" ON public.subcategories;
CREATE POLICY "Admins full management on subcategories" ON public.subcategories FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins full management on products" ON public.products;
CREATE POLICY "Admins full management on products" ON public.products FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins full management on product_images" ON public.product_images;
CREATE POLICY "Admins full management on product_images" ON public.product_images FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins full management on product_variants" ON public.product_variants;
CREATE POLICY "Admins full management on product_variants" ON public.product_variants FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins full management on inventory_movements" ON public.inventory_movements;
CREATE POLICY "Admins full management on inventory_movements" ON public.inventory_movements FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins full management on combos" ON public.combos;
CREATE POLICY "Admins full management on combos" ON public.combos FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins full management on combo_items" ON public.combo_items;
CREATE POLICY "Admins full management on combo_items" ON public.combo_items FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins full management on pricing_rules" ON public.pricing_rules;
CREATE POLICY "Admins full management on pricing_rules" ON public.pricing_rules FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins full management on coupons" ON public.coupons;
CREATE POLICY "Admins full management on coupons" ON public.coupons FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins full management on orders" ON public.orders;
CREATE POLICY "Admins full management on orders" ON public.orders FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins full management on order_items" ON public.order_items;
CREATE POLICY "Admins full management on order_items" ON public.order_items FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins full management on order_status_history" ON public.order_status_history;
CREATE POLICY "Admins full management on order_status_history" ON public.order_status_history FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins full management on payments" ON public.payments;
CREATE POLICY "Admins full management on payments" ON public.payments FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins full management on reviews" ON public.reviews;
CREATE POLICY "Admins full management on reviews" ON public.reviews FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins full management on homepage_banners" ON public.homepage_banners;
CREATE POLICY "Admins full management on homepage_banners" ON public.homepage_banners FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins full management on homepage_sections" ON public.homepage_sections;
CREATE POLICY "Admins full management on homepage_sections" ON public.homepage_sections FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins full management on bulk_enquiries" ON public.bulk_enquiries;
CREATE POLICY "Admins full management on bulk_enquiries" ON public.bulk_enquiries FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins full management on store_settings" ON public.store_settings;
CREATE POLICY "Admins full management on store_settings" ON public.store_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins full management on store_content_pages" ON public.store_content_pages;
CREATE POLICY "Admins full management on store_content_pages" ON public.store_content_pages FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins full management on audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins full management on audit logs" ON public.admin_audit_logs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Superadmins can manage admin roles" ON public.admin_roles;
CREATE POLICY "Superadmins can manage admin roles"
    ON public.admin_roles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles
            WHERE user_id = auth.uid() AND role = 'superadmin'
        )
    );

-- ------------------------------------------------------------------------------
-- SECTION 6: CONCURRENCY-SAFE ATOMIC INVENTORY STORED PROCEDURES
-- ------------------------------------------------------------------------------

-- 1. ATOMIC ORDER INVENTORY DECREMENT WITH ROW LOCKING & IDEMPOTENCY
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
    -- Idempotency Check: Prevent duplicate stock deductions for the same order
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

    -- Sort items by variant_id to eliminate deadlock risk under high concurrent checkouts
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

        -- Strict Stock Sufficiency Check
        IF v_current_stock < v_requested_qty THEN
            RAISE EXCEPTION 'ERR_INSUFFICIENT_STOCK: SKU % has % available, requested %',
                v_sku, v_current_stock, v_requested_qty;
        END IF;

        -- Atomic Decrement
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

-- 2. ATOMIC ORDER CANCELLATION & IDEMPOTENT RESTOCKING
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
    v_caller_role TEXT;
BEGIN
    -- Authorization check: Caller must be an admin, superadmin, or backend service_role
    v_caller_role := auth.role();
    IF v_caller_role != 'service_role' AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED: Restocking requires administrative or service-role privileges.';
    END IF;

    -- Idempotency Check: Verify if order has already been restocked
    SELECT EXISTS (
        SELECT 1 FROM public.inventory_movements
        WHERE order_id = p_order_id AND movement_type = 'RETURN'
    ) INTO v_already_restocked;

    IF v_already_restocked THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Order items have already been restocked. Duplicate restock prevented.',
            'already_restocked', true
        );
    END IF;

    -- Iterate through original SALE movements for this order in sorted variant order
    FOR v_movement IN
        SELECT variant_id, ABS(quantity_change) AS qty
        FROM public.inventory_movements
        WHERE order_id = p_order_id AND movement_type = 'SALE'
        ORDER BY variant_id ASC
    LOOP
        -- Acquire row lock
        SELECT stock_quantity
        INTO v_current_stock
        FROM public.product_variants
        WHERE id = v_movement.variant_id
        FOR UPDATE;

        IF FOUND THEN
            -- Increment stock back
            UPDATE public.product_variants
            SET stock_quantity = stock_quantity + v_movement.qty,
                updated_at = NOW()
            WHERE id = v_movement.variant_id;

            -- Record RETURN movement
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
                'RETURN',
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

-- 3. EXPIRATION OF UNPAID WHATSAPP OR ABANDONED ORDERS
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
    v_caller_role TEXT;
BEGIN
    v_caller_role := auth.role();
    IF v_caller_role != 'service_role' AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED: Order sweep requires administrative or service-role privileges.';
    END IF;

    FOR v_order IN
        SELECT id, order_number
        FROM public.orders
        WHERE payment_status = 'PENDING'
          AND fulfillment_status NOT IN ('CANCELLED', 'DELIVERED')
          AND created_at < (NOW() - (p_timeout_minutes || ' minutes')::INTERVAL)
    LOOP
        UPDATE public.orders
        SET fulfillment_status = 'CANCELLED',
            admin_notes = COALESCE(admin_notes, '') || E'\n[System]: Automatically cancelled due to payment window expiration.',
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

-- ------------------------------------------------------------------------------
-- SECTION 7: LEAST-PRIVILEGE FUNCTION GRANTS & PERMISSIONS LOCKDOWN
-- ------------------------------------------------------------------------------

-- Eliminate unrestricted PUBLIC execution on stored procedures
REVOKE ALL ON FUNCTION public.atomic_order_inventory_decrement(UUID, JSONB, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.atomic_order_cancellation_restock(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_unpaid_whatsapp_or_abandoned_orders(INTEGER) FROM PUBLIC;

-- Grant execution to authenticated frontend users and backend service_role
GRANT EXECUTE ON FUNCTION public.atomic_order_inventory_decrement(UUID, JSONB, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.atomic_order_cancellation_restock(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.release_unpaid_whatsapp_or_abandoned_orders(INTEGER) TO service_role;

-- Grant table permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON public.categories, public.subcategories, public.products, public.product_images, public.product_variants, public.combos, public.combo_items, public.pricing_rules, public.reviews, public.homepage_banners, public.homepage_sections, public.store_settings, public.store_content_pages, public.coupons TO anon;
GRANT INSERT ON public.bulk_enquiries TO anon;

-- ------------------------------------------------------------------------------
-- SECTION 8: AUTOMATED PG_CRON SCHEDULING (CONDITIONAL)
-- ------------------------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron'
    ) THEN
        CREATE EXTENSION IF NOT EXISTS pg_cron;

        IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'release_abandoned_orders_hourly') THEN
            PERFORM cron.unschedule('release_abandoned_orders_hourly');
        END IF;

        PERFORM cron.schedule(
            'release_abandoned_orders_hourly',
            '0 * * * *',
            'SELECT public.release_unpaid_whatsapp_or_abandoned_orders(1440);'
        );
    END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- SECTION 9: STAGING INITIAL SEED DATA (IDEMPOTENT)
-- ------------------------------------------------------------------------------

-- 1. STORE SETTINGS
INSERT INTO public.store_settings (key, value, description)
VALUES
    ('shipping', '{"standardDeliveryFee": 40, "freeShippingThreshold": 499, "expressDeliveryFee": 80}', 'Shipping pricing rules'),
    ('checkout', '{"primaryCheckoutMode": "RAZORPAY", "isCodGloballyEnabled": true, "whatsappNumber": "917593959235"}', 'Checkout modes and switches'),
    ('compliance', '{"fssaiNumber": "11322999000123", "brandName": "ZaDa Foods", "supportEmail": "care@zadafoods.com"}', 'FSSAI and contact metadata')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. STORE CONTENT PAGES (About, FAQ, Policies)
INSERT INTO public.store_content_pages (slug, title, content, is_published)
VALUES
    ('about', 'Our Kerala Heritage & Pure Flavors', 'ZaDa Foods was founded with a singular, uncompromising vision: to bring the authentic, golden crunch and nostalgic aroma of traditional Kerala snacks directly to food lovers across India and the globe. Handcrafted using certified Wayanad Nendran bananas and cooked exclusively in 100% pure cold-pressed coconut oil.', TRUE),
    ('contact', 'Get In Touch with ZaDa Foods', 'Have questions about bulk orders, festival hampers, or need customer assistance? Reach us at care@zadafoods.com or call +91 75939 59235. Malabar Heritage Snackworks, Wayanad Road, Kozhikode, Kerala - 673001.', TRUE),
    ('faq', 'Frequently Asked Questions', 'What oil do you fry your chips in? We fry 100% of our chips in pure cold-pressed coconut oil. Are your snacks preservative-free? Yes, zero artificial colors, zero trans fats, and zero chemical preservatives. How long does shipping take? Standard shipping delivers across South India within 2-4 business days.', TRUE),
    ('shipping-policy', 'Shipping & Delivery Policy', 'All orders are dispatched from our Kozhikode facility within 24 hours of confirmation. Orders valued at ₹499 or above qualify for Free Standard Delivery. Standard delivery charge for orders below ₹499 is ₹40.', TRUE),
    ('cancellation-refund-policy', 'Cancellation & Refund Policy', 'Orders can be cancelled before dispatch directly from your account page. In the rare event of damaged transit or packaging tampering, notify us within 48 hours for immediate replacement or full refund.', TRUE),
    ('privacy-policy', 'Privacy Policy', 'ZaDa Foods respects your personal privacy. We collect minimal customer information necessary for fulfillment and payment processing. We never sell customer records to third parties.', TRUE),
    ('terms', 'Terms & Conditions of Service', 'By accessing or purchasing from ZaDa Foods, you agree to our standard terms of service. All prices include applicable GST.', TRUE)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content;

-- 3. THE 10 APPROVED CATEGORIES (Matching Screen 1)
INSERT INTO public.categories (id, name, slug, description, image_url, display_order, is_active)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Chips', 'chips', 'Crispy, tasty and traditional Kerala chips fried in cold-pressed coconut oil.', 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=300&q=80', 1, TRUE),
    ('c0000000-0000-0000-0000-000000000002', 'Sweets', 'sweets', 'Authentic festival delicacies, traditional Neyyappam, and melt-in-mouth sweets.', 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=300&q=80', 2, TRUE),
    ('c0000000-0000-0000-0000-000000000003', 'Halwa', 'halwa', 'World-famous Kozhikode black, wheat, and cashew halwas cooked in pure ghee.', 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=300&q=80', 3, TRUE),
    ('c0000000-0000-0000-0000-000000000004', 'Laddu', 'laddu', 'Golden aromatic Motichoor, Besan, and Malabar dry fruit laddus.', 'https://images.unsplash.com/photo-1505253758473-96b46deae6f9?auto=format&fit=crop&w=300&q=80', 4, TRUE),
    ('c0000000-0000-0000-0000-000000000005', 'Mixture', 'mixture', 'Spicy, crunchy Kerala savory mixtures infused with curry leaves and peanuts.', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=300&q=80', 5, TRUE),
    ('c0000000-0000-0000-0000-000000000006', 'Pickles', 'pickles', 'Homestyle preserved tender mango, garlic, and wild lime pickles in gingelly oil.', 'https://images.unsplash.com/photo-1589135233689-d4992f44c688?auto=format&fit=crop&w=300&q=80', 6, TRUE),
    ('c0000000-0000-0000-0000-000000000007', 'Dates', 'dates', 'Hand-picked premium Arabian and Medjool dates stuffed with roasted dry fruits.', 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=300&q=80', 7, TRUE),
    ('c0000000-0000-0000-0000-000000000008', 'Nuts', 'nuts', 'Direct-from-farm whole Kerala cashews, roasted almonds, and pistachios.', 'https://images.unsplash.com/photo-1536591375315-1b836815377a?auto=format&fit=crop&w=300&q=80', 8, TRUE),
    ('c0000000-0000-0000-0000-000000000009', 'Gift Packs', 'gift-packs', 'Luxurious festive hampers curated with gold-embossed packaging.', 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=300&q=80', 9, TRUE),
    ('c0000000-0000-0000-0000-000000000010', 'Combos', 'combos', 'Value family packs pairing crisp chips, savory mixture, and signature halwa.', 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=300&q=80', 10, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4. SUBCATEGORIES FOR CHIPS
INSERT INTO public.subcategories (id, category_id, name, slug, display_order, is_active)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'All', 'all', 1, TRUE),
    ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Banana Chips', 'banana-chips', 2, TRUE),
    ('a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Tapioca', 'tapioca', 3, TRUE),
    ('a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'Plantain', 'plantain', 4, TRUE),
    ('a0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Jackfruit', 'jackfruit', 5, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. PRODUCTS & VARIANTS
-- Product 1: Banana Chips (Nendran)
INSERT INTO public.products (
    id, category_id, subcategory_id, name, slug, tagline, description, ingredients, nutrition_facts,
    is_preservative_free, is_coconut_oil_made, is_bestseller, is_on_offer, is_cod_eligible, is_published, average_rating, review_count
) VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'Banana Chips (Nendran)',
    'banana-chips-nendran',
    'Crispy, tasty and traditional',
    'Crispy, thinly sliced Nendran bananas fried in pure coconut oil with a hint of salt.',
    'Fresh Farm Nendran Bananas (72%), Pure Coconut Oil (26%), Salt, Turmeric powder.',
    '{"calories": "532 kcal", "protein": "3.1 g", "carbs": "58.4 g", "fat": "32.0 g", "sugar": "1.2 g", "sodium": "380 mg"}',
    TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, 4.80, 1240
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.product_images (id, product_id, image_url, alt_text, display_order, is_primary)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=600&q=80', 'Banana Chips in Bowl', 1, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.product_variants (id, product_id, sku, weight_value, weight_unit, weight_label, selling_price, mrp, stock_quantity, low_stock_threshold, is_default)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'ZDF-BCN-100G', 100, 'g', '100 g', 80.00, 100.00, 150, 15, FALSE),
    ('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'ZDF-BCN-250G', 250, 'g', '250 g', 180.00, 220.00, 280, 20, TRUE),
    ('f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'ZDF-BCN-500G', 500, 'g', '500 g', 320.00, 390.00, 95, 10, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Product 2: Cashew Halwa
INSERT INTO public.products (
    id, category_id, name, slug, tagline, description, ingredients, nutrition_facts,
    is_preservative_free, is_coconut_oil_made, is_bestseller, is_on_offer, is_cod_eligible, is_published, average_rating, review_count
) VALUES (
    'd0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000003',
    'Cashew Halwa',
    'cashew-halwa',
    'Kozhikode heritage recipe',
    'Slow-cooked luxury halwa made with stone-ground wheat, caramelized jaggery, and generous whole roasted cashews in pure ghee.',
    'Whole Wheat Extract, Pure Cow Ghee (30%), Jaggery, Roasted Cashew Nuts (18%), Cardamom.',
    '{"calories": "480 kcal", "protein": "5.2 g", "carbs": "62.0 g", "fat": "24.0 g"}',
    TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, 4.90, 850
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.product_variants (id, product_id, sku, weight_value, weight_unit, weight_label, selling_price, mrp, stock_quantity, low_stock_threshold, is_default)
VALUES
    ('f0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'ZDF-CSH-500G', 500, 'g', '500 g', 360.00, 420.00, 60, 10, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 6. COUPONS
INSERT INTO public.coupons (id, code, discount_type, discount_value, min_order_amount, is_first_order_only, usage_limit, is_active)
VALUES
    ('ca000000-0000-0000-0000-000000000001', 'ZADA80', 'FLAT', 80.00, 499.00, FALSE, 500, TRUE),
    ('ca000000-0000-0000-0000-000000000002', 'FIRST10', 'PERCENTAGE', 10.00, 299.00, TRUE, NULL, TRUE),
    ('ca000000-0000-0000-0000-000000000003', 'FREESHIP', 'FREE_SHIPPING', 40.00, 399.00, FALSE, NULL, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 7. QUANTITY TIER PRICING RULE
INSERT INTO public.pricing_rules (id, name, rule_type, product_id, min_quantity, discount_percentage, is_active)
VALUES
    ('da000000-0000-0000-0000-000000000001', 'Bulk Pack Discount - Banana Chips', 'QUANTITY_TIER', 'd0000000-0000-0000-0000-000000000001', 3, 5.00, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 8. HOMEPAGE BANNERS & SECTIONS
INSERT INTO public.homepage_banners (id, title, subtitle, image_url, cta_text, cta_link, display_order, is_active)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Pure Coconut Oil Fried Kerala Banana Chips', 'Harvested from certified Wayanad farms, thinly sliced & fried fresh in 100% pure cold-pressed coconut oil.', 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=1200&q=80', 'Shop Chips', '/category/chips', 1, TRUE),
    ('b0000000-0000-0000-0000-000000000002', 'Festive Malabar Sweet Gift Boxes', 'Handcrafted Kozhikode Halwa and Ghee Sweets packed in luxury heritage gifting boxes.', 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1200&q=80', 'Explore Sweets', '/category/sweets', 2, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.homepage_sections (section_key, title, subtitle, display_order, is_active)
VALUES
    ('hero_banner', 'Hero Carousel', 'Featured collections & seasonal announcements', 1, TRUE),
    ('categories', 'Shop by Category', 'Authentic Malabar snacks & sweets', 2, TRUE),
    ('bestsellers', 'Bestselling Snacks', 'Customer favorite daily batches', 3, TRUE),
    ('combos', 'Value Combos & Hampers', 'Curated snack boxes', 4, TRUE),
    ('reviews', 'What Our Customers Say', 'Verified reviews from snack lovers', 5, TRUE)
ON CONFLICT (section_key) DO NOTHING;

-- Commit entire setup cleanly
COMMIT;
