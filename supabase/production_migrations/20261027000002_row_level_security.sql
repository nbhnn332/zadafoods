-- ============================================================================
-- ZaDa Foods — Row Level Security (RLS) Policies
-- Migration: 20261027000002_row_level_security.sql
-- ============================================================================

-- Helper function to check if the executing user is an authenticated Administrator
-- Hardened with fixed search_path to prevent search_path hijacking vulnerabilities
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

-- 1. Enable RLS on all tables
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

-- ----------------------------------------------------------------------------
-- PROFILES POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (auth.uid() = id OR public.is_admin());

-- ----------------------------------------------------------------------------
-- PUBLIC CATALOG READ POLICIES (Storefront browsing)
-- ----------------------------------------------------------------------------
CREATE POLICY "Public can view active categories"
    ON public.categories FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Public can view active subcategories"
    ON public.subcategories FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Public can view published products"
    ON public.products FOR SELECT
    USING (is_published = TRUE OR public.is_admin());

CREATE POLICY "Public can view product images"
    ON public.product_images FOR SELECT
    USING (TRUE);

CREATE POLICY "Public can view product variants"
    ON public.product_variants FOR SELECT
    USING (TRUE);

CREATE POLICY "Public can view active combos"
    ON public.combos FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Public can view combo items"
    ON public.combo_items FOR SELECT
    USING (TRUE);

CREATE POLICY "Public can view active pricing rules"
    ON public.pricing_rules FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Public can view approved reviews"
    ON public.reviews FOR SELECT
    USING (is_approved = TRUE OR public.is_admin());

CREATE POLICY "Public can view active homepage banners"
    ON public.homepage_banners FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Public can view active homepage sections"
    ON public.homepage_sections FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Public can view store settings"
    ON public.store_settings FOR SELECT
    USING (TRUE);

CREATE POLICY "Public can validate active coupons"
    ON public.coupons FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

-- ----------------------------------------------------------------------------
-- CUSTOMER PERSONAL DATA POLICIES (Addresses, Carts, Orders)
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can manage own addresses"
    ON public.addresses FOR ALL
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can manage own carts"
    ON public.carts FOR ALL
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can manage own cart items"
    ON public.cart_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.carts
            WHERE carts.id = cart_items.cart_id AND (carts.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Users can manage own wishlist"
    ON public.wishlists FOR ALL
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own orders"
    ON public.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR public.is_admin());

CREATE POLICY "Users can view own order items"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Users can view own order status history"
    ON public.order_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_status_history.order_id AND (orders.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Authenticated users can submit reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Public can submit bulk enquiries"
    ON public.bulk_enquiries FOR INSERT
    WITH CHECK (TRUE);

-- ----------------------------------------------------------------------------
-- ADMIN FULL MANAGEMENT POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Admins full management on categories"
    ON public.categories FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins full management on subcategories"
    ON public.subcategories FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins full management on products"
    ON public.products FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins full management on product_images"
    ON public.product_images FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins full management on product_variants"
    ON public.product_variants FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins full management on inventory_movements"
    ON public.inventory_movements FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins full management on combos"
    ON public.combos FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins full management on combo_items"
    ON public.combo_items FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins full management on pricing_rules"
    ON public.pricing_rules FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins full management on coupons"
    ON public.coupons FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins full management on orders"
    ON public.orders FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins full management on order_items"
    ON public.order_items FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins full management on order_status_history"
    ON public.order_status_history FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins full management on reviews"
    ON public.reviews FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins full management on bulk_enquiries"
    ON public.bulk_enquiries FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins full management on store_settings"
    ON public.store_settings FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins full management on audit logs"
    ON public.admin_audit_logs FOR ALL
    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Superadmins can manage admin roles"
    ON public.admin_roles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles
            WHERE user_id = auth.uid() AND role = 'superadmin'
        )
    );
