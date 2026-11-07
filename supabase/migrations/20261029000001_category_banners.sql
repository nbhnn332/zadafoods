-- Migration: 20261029000001_category_banners.sql
-- Description: Schema and Row-Level Security for Category-Specific CMS Banners

-- 1. Create category_banners table
CREATE TABLE IF NOT EXISTS public.category_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_slug TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    eyebrow TEXT,
    background_color TEXT NOT NULL DEFAULT '#072C20',
    text_color TEXT NOT NULL DEFAULT '#FFFFFF',
    image_url TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for efficient lookup
CREATE INDEX IF NOT EXISTS idx_category_banners_slug ON public.category_banners(category_slug);
CREATE INDEX IF NOT EXISTS idx_category_banners_active ON public.category_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_category_banners_order ON public.category_banners(display_order);

-- 3. Automatic updated_at trigger
DROP TRIGGER IF EXISTS trg_category_banners_updated_at ON public.category_banners;
CREATE TRIGGER trg_category_banners_updated_at
    BEFORE UPDATE ON public.category_banners
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security
ALTER TABLE public.category_banners ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if any
DROP POLICY IF EXISTS "Public can view active category banners" ON public.category_banners;
DROP POLICY IF EXISTS "Admins full management on category_banners" ON public.category_banners;

-- 6. Storefront read policy: public can only view published active banners (or admins can view all)
CREATE POLICY "Public can view active category banners"
    ON public.category_banners FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

-- 7. Admin CRUD policy: only verified administrators can insert, update, or delete
CREATE POLICY "Admins full management on category_banners"
    ON public.category_banners FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
