-- ============================================================================
-- ZaDa Foods — Phase 15B: Subcategory CMS & Persistence Migration
-- Migration: 20261029000004_subcategory_cms.sql
-- ============================================================================

-- 1. Add description column to subcategories if not already present
ALTER TABLE public.subcategories
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Ensure indexes exist for rapid category-based filtering and display order
CREATE INDEX IF NOT EXISTS idx_subcategories_category_order
ON public.subcategories(category_id, display_order);

CREATE INDEX IF NOT EXISTS idx_subcategories_is_active
ON public.subcategories(is_active);

-- 3. Verify RLS policies on subcategories
-- (Re-affirming public read of active items and admin full management)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subcategories' 
          AND policyname = 'Public can view active subcategories'
    ) THEN
        CREATE POLICY "Public can view active subcategories"
            ON public.subcategories FOR SELECT
            USING (is_active = TRUE OR public.is_admin());
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subcategories' 
          AND policyname = 'Admins full management on subcategories'
    ) THEN
        CREATE POLICY "Admins full management on subcategories"
            ON public.subcategories FOR ALL
            USING (public.is_admin()) WITH CHECK (public.is_admin());
    END IF;
END $$;
