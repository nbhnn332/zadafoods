-- ==============================================================================
-- ZaDa Foods: Phase 17 Upgrade — Immersive Festival Visual Transformation System
-- Forward-only migration adding JSONB columns for campaigns, atmosphere & badges
-- ==============================================================================

-- 1. Add extended columns to festival_themes if they don't already exist
ALTER TABLE public.festival_themes
  ADD COLUMN IF NOT EXISTS promotions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS popup JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS countdown JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS atmosphere JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS product_badges JSONB DEFAULT '{}'::jsonb;

-- 2. Ensure grants are intact
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.festival_themes TO authenticated;
GRANT SELECT ON TABLE public.festival_themes TO anon;
GRANT ALL ON TABLE public.festival_themes TO service_role;
