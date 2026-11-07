-- ==============================================================================
-- ZaDa Foods — Phase 25 Database Permission & Schema Alignment Migration
-- Target: Supabase Project ykzgqaepayuqatgbvsoq (PostgreSQL 15+)
-- Purpose: 
--   1. Align bulk_enquiries, homepage_banners, pricing_rules, combo_items schemas
--   2. Update compliance settings with verified FSSAI: 21326145000345
--   3. Ensure public submission grants for enquiries & reviews
--   4. Ensure full administrative CRUD permissions for Super Admin & staff
-- ==============================================================================

BEGIN;

-- 1. BULK ENQUIRIES SCHEMA ALIGNMENT
ALTER TABLE public.bulk_enquiries 
    ADD COLUMN IF NOT EXISTS organization_name TEXT,
    ADD COLUMN IF NOT EXISTS event_type TEXT,
    ADD COLUMN IF NOT EXISTS estimated_quantity INTEGER,
    ADD COLUMN IF NOT EXISTS required_date DATE;

-- Ensure public can submit contact/bulk enquiries without authentication gate
GRANT INSERT ON public.bulk_enquiries TO anon, authenticated;

DROP POLICY IF EXISTS "Public can submit bulk enquiry" ON public.bulk_enquiries;
CREATE POLICY "Public can submit bulk enquiry"
    ON public.bulk_enquiries FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage bulk enquiries" ON public.bulk_enquiries;
CREATE POLICY "Admins can manage bulk enquiries"
    ON public.bulk_enquiries FOR ALL
    TO authenticated
    USING (public.is_admin() = true OR public.is_super_admin() = true)
    WITH CHECK (public.is_admin() = true OR public.is_super_admin() = true);

-- 2. HOMEPAGE BANNERS SCHEMA ALIGNMENT
ALTER TABLE public.homepage_banners 
    ADD COLUMN IF NOT EXISTS cta_link TEXT,
    ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#FFFFFF',
    ADD COLUMN IF NOT EXISTS eyebrow TEXT;

-- Auto-synchronize cta_link and cta_url
UPDATE public.homepage_banners 
SET cta_link = COALESCE(cta_link, cta_url),
    cta_url = COALESCE(cta_url, cta_link);

-- 3. PRICING RULES SCHEMA ALIGNMENT
ALTER TABLE public.pricing_rules
    ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS fixed_price NUMERIC(10,2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS free_variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ DEFAULT NULL;

-- 4. COMBO ITEMS NOT-NULL CONSTRAINT RELAXATION
-- variant_id already links to products, so product_id should be optional on item insert
ALTER TABLE public.combo_items 
    ALTER COLUMN product_id DROP NOT NULL;

-- 5. UPDATE COMPLIANCE FSSAI LICENSE NUMBER (21326145000345)
UPDATE public.store_settings
SET value = jsonb_set(
    jsonb_set(value, '{fssaiLicenseNumber}', '"21326145000345"'),
    '{supportWhatsApp}', '"917593959235"'
),
updated_at = NOW()
WHERE key = 'compliance';

-- 6. ENSURE GRANTS ON ALL CMS & PROMOTION TABLES FOR ADMINS
GRANT ALL ON public.categories TO authenticated;
GRANT ALL ON public.subcategories TO authenticated;
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.product_variants TO authenticated;
GRANT ALL ON public.product_images TO authenticated;
GRANT ALL ON public.homepage_banners TO authenticated;
GRANT ALL ON public.category_banners TO authenticated;
GRANT ALL ON public.coupons TO authenticated;
GRANT ALL ON public.pricing_rules TO authenticated;
GRANT ALL ON public.combos TO authenticated;
GRANT ALL ON public.combo_items TO authenticated;
GRANT ALL ON public.festival_themes TO authenticated;
GRANT ALL ON public.reviews TO authenticated;
GRANT ALL ON public.store_settings TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;

COMMIT;

-- Verification
SELECT 
    'FSSAI Updated' AS item,
    value->>'fssaiLicenseNumber' AS current_fssai,
    CASE WHEN value->>'fssaiLicenseNumber' = '21326145000345' THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.store_settings
WHERE key = 'compliance';
