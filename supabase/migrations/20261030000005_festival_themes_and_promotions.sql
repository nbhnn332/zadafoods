-- ==============================================================================
-- ZaDa Foods: Phase 17 — Festival Themes & Seasonal Promotions Schema
-- Forward-only migration adding festival_themes table with RLS and grants
-- ==============================================================================

-- 1. Create festival_themes table if not exists
CREATE TABLE IF NOT EXISTS public.festival_themes (
  id TEXT PRIMARY KEY,
  preset TEXT NOT NULL,
  name TEXT NOT NULL,
  greeting TEXT,
  announcement_badge TEXT,
  coupon_code TEXT,
  is_active BOOLEAN DEFAULT false,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  intensity TEXT DEFAULT 'subtle',
  accent_color TEXT,
  badge_color TEXT,
  promotional_image_url TEXT,
  hero_banner_headline TEXT,
  hero_banner_subline TEXT,
  placements JSONB DEFAULT '{"heroBanners": true, "promoBanners": true, "productCards": true, "categorySections": true, "announcementBar": true}'::jsonb,
  featured_product_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create index on is_active and dates for fast query
CREATE INDEX IF NOT EXISTS idx_festival_themes_active ON public.festival_themes(is_active);
CREATE INDEX IF NOT EXISTS idx_festival_themes_preset ON public.festival_themes(preset);

-- 3. Grants
GRANT SELECT ON TABLE public.festival_themes TO anon, authenticated;
GRANT ALL ON TABLE public.festival_themes TO authenticated;
GRANT ALL ON TABLE public.festival_themes TO service_role;

-- 4. Enable Row Level Security
ALTER TABLE public.festival_themes ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS festival_themes_select_policy ON public.festival_themes;
CREATE POLICY festival_themes_select_policy ON public.festival_themes
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    OR public.is_admin() = true
    OR public.is_super_admin() = true
  );

DROP POLICY IF EXISTS festival_themes_insert_policy ON public.festival_themes;
CREATE POLICY festival_themes_insert_policy ON public.festival_themes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_super_admin() = true
    OR public.is_admin() = true
    OR public.has_permission('cms.homepage') = true
    OR public.has_permission('cms.festivals') = true
  );

DROP POLICY IF EXISTS festival_themes_update_policy ON public.festival_themes;
CREATE POLICY festival_themes_update_policy ON public.festival_themes
  FOR UPDATE
  TO authenticated
  USING (
    public.is_super_admin() = true
    OR public.is_admin() = true
    OR public.has_permission('cms.homepage') = true
    OR public.has_permission('cms.festivals') = true
  )
  WITH CHECK (
    public.is_super_admin() = true
    OR public.is_admin() = true
    OR public.has_permission('cms.homepage') = true
    OR public.has_permission('cms.festivals') = true
  );

DROP POLICY IF EXISTS festival_themes_delete_policy ON public.festival_themes;
CREATE POLICY festival_themes_delete_policy ON public.festival_themes
  FOR DELETE
  TO authenticated
  USING (
    public.is_super_admin() = true
    OR public.is_admin() = true
    OR public.has_permission('cms.homepage') = true
    OR public.has_permission('cms.festivals') = true
  );

-- 6. Seed Presets
INSERT INTO public.festival_themes (
  id, preset, name, greeting, announcement_badge, coupon_code, is_active, intensity, accent_color, badge_color, placements, featured_product_ids
) VALUES
  ('theme-default', 'default', 'Default ZaDa Theme', 'Pure Cold-Pressed Coconut Oil Snacks & Heritage Malabar Delicacies', 'Authentic Kerala', '', true, 'subtle', '#A67732', '#FAD982', '{"heroBanners": false, "promoBanners": false, "productCards": false, "categorySections": false, "announcementBar": false}'::jsonb, '[]'::jsonb),
  ('theme-diwali', 'diwali', 'Diwali Festival of Lights', '🪔 Shubh Deepavali! Illuminate your celebrations with pure ghee sweets & artisan chips.', 'Diwali Special', 'DIWALI20', false, 'subtle', '#D97706', '#FDE68A', '{"heroBanners": true, "promoBanners": true, "productCards": true, "categorySections": true, "announcementBar": true}'::jsonb, '["prod-1", "prod-2", "prod-3"]'::jsonb),
  ('theme-christmas', 'christmas', 'Christmas & Holiday Season', '🎄 Season''s Greetings! Warm your winter gatherings with handcrafted Kerala halwa boxes.', 'Holiday Joy', 'JOY2026', false, 'subtle', '#15803D', '#BBF7D0', '{"heroBanners": true, "promoBanners": true, "productCards": true, "categorySections": true, "announcementBar": true}'::jsonb, '["prod-2", "prod-4", "prod-5"]'::jsonb),
  ('theme-new_year', 'new_year', 'New Year Celebrations', '✨ Welcome 2027! Ring in new beginnings with authentic Malabar treats & exclusive festive savings.', 'New Year Fest', 'NEWYEAR15', false, 'subtle', '#B45309', '#FEF3C7', '{"heroBanners": true, "promoBanners": true, "productCards": true, "categorySections": true, "announcementBar": true}'::jsonb, '["prod-1", "prod-3"]'::jsonb),
  ('theme-onam', 'onam', 'Onam Harvest Festival', '🌸 Happy Onam! Celebrate Kerala''s grand harvest with golden banana chips & royal halwas.', 'Onasadhya Special', 'ONAM20', false, 'subtle', '#CA8A04', '#FEF08A', '{"heroBanners": true, "promoBanners": true, "productCards": true, "categorySections": true, "announcementBar": true}'::jsonb, '["prod-1", "prod-2", "prod-6"]'::jsonb),
  ('theme-eid', 'eid', 'Eid Mubarak Celebrations', '🌙 Eid Mubarak! Share the timeless sweetness of Malabar delicacies with family & friends.', 'Eid Treats', 'EID2026', false, 'subtle', '#047857', '#A7F3D0', '{"heroBanners": true, "promoBanners": true, "productCards": true, "categorySections": true, "announcementBar": true}'::jsonb, '["prod-2", "prod-3", "prod-5"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  preset = EXCLUDED.preset,
  name = EXCLUDED.name,
  greeting = EXCLUDED.greeting,
  updated_at = now();
