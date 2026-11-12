-- ============================================================================
-- ZaDa Foods — Forward-Only Migration: Make Banner CTA and Headline Optional
-- Migration: 20261113000001_make_banner_cta_and_titles_optional.sql
-- Description: Drops NOT NULL constraints on cta_text, cta_link, and title
--              in public.homepage_banners to natively allow image-only banners
--              without forcing dummy button text or empty spacing.
-- ============================================================================

-- 1. Ensure table exists
CREATE TABLE IF NOT EXISTS public.homepage_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    subtitle TEXT,
    image_url TEXT,
    cta_text TEXT,
    cta_link TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Drop NOT NULL constraints safely on optional columns
ALTER TABLE IF EXISTS public.homepage_banners
    ALTER COLUMN cta_text DROP NOT NULL,
    ALTER COLUMN cta_link DROP NOT NULL,
    ALTER COLUMN title DROP NOT NULL;

-- 3. Document schema columns
COMMENT ON COLUMN public.homepage_banners.cta_text IS 'Optional call-to-action button label. Can be NULL or empty string when CTA is disabled.';
COMMENT ON COLUMN public.homepage_banners.cta_link IS 'Optional destination URL. When CTA is disabled and is_clickable is true, whole banner links here.';
COMMENT ON COLUMN public.homepage_banners.title IS 'Optional headline text. Can be NULL or empty for pure image banners.';

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
