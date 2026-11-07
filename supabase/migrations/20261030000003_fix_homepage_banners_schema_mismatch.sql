-- ============================================================================
-- ZaDa Foods — Forward-Only Migration: Fix Homepage Hero Banner Schema Mismatch
-- Migration: 20261030000003_fix_homepage_banners_schema_mismatch.sql
-- Description: Adds missing styling and badge columns to public.homepage_banners,
--              ensures image_url nullability for pure CSS zero-image hero banners,
--              and reloads the PostgREST schema cache safely.
-- ============================================================================

-- 1. Ensure table exists
CREATE TABLE IF NOT EXISTS public.homepage_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT,
    cta_text TEXT NOT NULL DEFAULT 'Shop Now',
    cta_link TEXT NOT NULL DEFAULT '/category/chips',
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add missing background_color column with safe default (ZaDa Deep Forest Green)
ALTER TABLE IF EXISTS public.homepage_banners
    ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#072C20';

-- 3. Add missing text_color column with safe default (White)
ALTER TABLE IF EXISTS public.homepage_banners
    ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#FFFFFF';

-- 4. Add missing eyebrow column with safe default NULL
ALTER TABLE IF EXISTS public.homepage_banners
    ADD COLUMN IF NOT EXISTS eyebrow TEXT DEFAULT NULL;

-- 5. Drop NOT NULL constraint on image_url to allow pure CSS / zero-image hero banners
ALTER TABLE IF EXISTS public.homepage_banners
    ALTER COLUMN image_url DROP NOT NULL;

-- 6. Ensure default indexes exist for performance and ordering
CREATE INDEX IF NOT EXISTS idx_homepage_banners_display_order
    ON public.homepage_banners(display_order);

CREATE INDEX IF NOT EXISTS idx_homepage_banners_is_active
    ON public.homepage_banners(is_active);

-- 7. Document schema columns
COMMENT ON COLUMN public.homepage_banners.background_color IS 'Hex color code for hero banner canvas background (defaults to Forest Green #072C20).';
COMMENT ON COLUMN public.homepage_banners.text_color IS 'Hex color code for hero banner typography (defaults to White #FFFFFF).';
COMMENT ON COLUMN public.homepage_banners.eyebrow IS 'Optional decorative eyebrow badge text displayed above main headline (e.g. Fresh From Kerala).';
COMMENT ON COLUMN public.homepage_banners.image_url IS 'Optional URL for authorized hero photography. When NULL or empty, banner renders pure CSS styling.';

-- 8. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
