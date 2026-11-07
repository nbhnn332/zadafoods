-- ==============================================================================
-- ZaDa Foods — Production Catalog Seed Plan (REVIEW ONLY — DO NOT AUTO-APPLY)
-- Target: Production Supabase Database
-- Purpose: Seed products, variants, and images for the 8 missing categories
-- ==============================================================================

-- IMPORTANT NOTE:
-- This script is a reviewable deployment deliverable for Phase 10.
-- Do NOT execute against staging or production without explicit administrative approval.

BEGIN;

-- 1. SWEETS CATEGORY: Traditional Neyyappam
INSERT INTO public.products (
    id, category_id, subcategory_id, name, slug, tagline, description,
    ingredients, nutrition_facts, storage_instructions, shelf_life_days,
    is_preservative_free, is_coconut_oil_made, is_bestseller, is_on_offer,
    is_cod_eligible, is_published, average_rating, review_count
) VALUES (
    'd0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002', -- Sweets
    NULL,
    'Traditional Neyyappam',
    'traditional-neyyappam',
    'Crisp golden crust with soft cardamom core',
    'Traditional Malabar ghee sweet crafted with roasted raw rice flour, aged jaggery syrup, tender coconut bites, and fragrant cardamom.',
    'Rice flour (45%), Jaggery syrup (35%), Cow Ghee (12%), Coconut bits (5%), Cardamom, Sesame seeds.',
    '{"calories": "410 kcal", "carbs": "68.0 g", "protein": "4.2 g", "fat": "14.5 g"}',
    'Store in an airtight container at room temperature. Best consumed within 14 days.',
    30,
    TRUE, FALSE, TRUE, FALSE, TRUE, TRUE, 4.9, 420
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.product_variants (
    id, product_id, sku, weight_value, weight_unit, weight_label,
    selling_price, mrp, discount_percentage, stock_quantity, low_stock_threshold, is_default
) VALUES 
('f0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000003', 'ZDF-NYP-250G', 250, 'g', '250 g', 150, 180, 16.67, 120, 15, TRUE),
('f0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000003', 'ZDF-NYP-500G', 500, 'g', '500 g', 280, 340, 17.65, 80, 10, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 2. LADDU CATEGORY: Malabar Dry Fruit Laddu
INSERT INTO public.products (
    id, category_id, subcategory_id, name, slug, tagline, description,
    ingredients, nutrition_facts, storage_instructions, shelf_life_days,
    is_preservative_free, is_coconut_oil_made, is_bestseller, is_on_offer,
    is_cod_eligible, is_published, average_rating, review_count
) VALUES (
    'd0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000004', -- Laddu
    NULL,
    'Malabar Dry Fruit Laddu',
    'malabar-dry-fruit-laddu',
    'Pure Cow Ghee & Whole Roasted Dry Fruits',
    'Nutrient-dense Malabar laddus loaded with roasted almonds, whole cashews, pistachios, and organic jaggery cooked in pure cow ghee.',
    'Roasted Almonds (25%), Cashews (25%), Pure Cow Ghee (20%), Jaggery (20%), Pistachios (8%), Cardamom.',
    '{"calories": "520 kcal", "carbs": "44.0 g", "protein": "9.5 g", "fat": "34.0 g"}',
    'Store in a cool dry place in an airtight box.',
    45,
    TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, 4.9, 610
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.product_variants (
    id, product_id, sku, weight_value, weight_unit, weight_label,
    selling_price, mrp, discount_percentage, stock_quantity, low_stock_threshold, is_default
) VALUES 
('f0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000004', 'ZDF-LAD-250G', 250, 'g', '250 g', 240, 290, 17.24, 90, 10, TRUE),
('f0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000004', 'ZDF-LAD-500G', 500, 'g', '500 g', 460, 560, 17.86, 60, 10, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 3. MIXTURE CATEGORY: Special Kerala Mixture
INSERT INTO public.products (
    id, category_id, subcategory_id, name, slug, tagline, description,
    ingredients, nutrition_facts, storage_instructions, shelf_life_days,
    is_preservative_free, is_coconut_oil_made, is_bestseller, is_on_offer,
    is_cod_eligible, is_published, average_rating, review_count
) VALUES (
    'd0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000005', -- Mixture
    NULL,
    'Special Kerala Mixture',
    'special-kerala-mixture',
    'Crisp, spicy, and curry-leaf infused savory crunch',
    'Traditional Kerala savory mixture fried in pure coconut oil with roasted peanuts, fried garlic cloves, crispy curry leaves, and Malabar red chili seasoning.',
    'Gram flour (40%), Pure Coconut Oil (28%), Peanuts (12%), Fried Garlic (8%), Curry leaves, Chili powder, Salt.',
    '{"calories": "560 kcal", "carbs": "42.0 g", "protein": "11.2 g", "fat": "38.5 g"}',
    'Store in an airtight container to preserve crispness.',
    60,
    TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, 4.8, 930
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.product_variants (
    id, product_id, sku, weight_value, weight_unit, weight_label,
    selling_price, mrp, discount_percentage, stock_quantity, low_stock_threshold, is_default
) VALUES 
('f0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000005', 'ZDF-MIX-250G', 250, 'g', '250 g', 120, 150, 20.0, 210, 20, TRUE),
('f0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000005', 'ZDF-MIX-500G', 500, 'g', '500 g', 220, 280, 21.43, 140, 15, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 4. PICKLES CATEGORY: Homestyle Tender Cut Mango Pickle
INSERT INTO public.products (
    id, category_id, subcategory_id, name, slug, tagline, description,
    ingredients, nutrition_facts, storage_instructions, shelf_life_days,
    is_preservative_free, is_coconut_oil_made, is_bestseller, is_on_offer,
    is_cod_eligible, is_published, average_rating, review_count
) VALUES (
    'd0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000006', -- Pickles
    NULL,
    'Tender Cut Mango Pickle',
    'tender-cut-mango-pickle',
    'Preserved in pure cold-pressed sesame oil',
    'Homestyle tender raw mangoes hand-chopped and cured with roasted fenugreek, mustard seeds, and pure cold-pressed sesame oil.',
    'Raw Tender Mangoes (65%), Pure Sesame Oil (18%), Red Chili, Salt, Fenugreek, Mustard seeds, Asafoetida.',
    '{"calories": "165 kcal", "carbs": "8.5 g", "protein": "1.8 g", "fat": "14.0 g"}',
    'Keep sealed. Always use a dry spoon.',
    180,
    TRUE, FALSE, FALSE, FALSE, TRUE, TRUE, 4.7, 310
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.product_variants (
    id, product_id, sku, weight_value, weight_unit, weight_label,
    selling_price, mrp, discount_percentage, stock_quantity, low_stock_threshold, is_default
) VALUES 
('f0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000006', 'ZDF-PCK-300G', 300, 'g', '300 g', 130, 160, 18.75, 110, 15, TRUE),
('f0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000006', 'ZDF-PCK-500G', 500, 'g', '500 g', 210, 260, 19.23, 75, 10, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 5. DATES CATEGORY: Stuffed Medjool Dates
INSERT INTO public.products (
    id, category_id, subcategory_id, name, slug, tagline, description,
    ingredients, nutrition_facts, storage_instructions, shelf_life_days,
    is_preservative_free, is_coconut_oil_made, is_bestseller, is_on_offer,
    is_cod_eligible, is_published, average_rating, review_count
) VALUES (
    'd0000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000007', -- Dates
    NULL,
    'Stuffed Medjool Dates',
    'stuffed-medjool-dates',
    'Stuffed with whole roasted almonds & pistachios',
    'Plump premium imported Medjool dates pitted and generously filled with roasted almonds, cashews, and orange-blossom honey glaze.',
    'Medjool Dates (75%), Roasted Almonds (12%), Roasted Cashews (8%), Pistachios (5%).',
    '{"calories": "385 kcal", "carbs": "69.0 g", "protein": "6.0 g", "fat": "11.0 g"}',
    'Store in a cool dry place or refrigerate for extended freshness.',
    90,
    TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, 4.9, 280
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.product_variants (
    id, product_id, sku, weight_value, weight_unit, weight_label,
    selling_price, mrp, discount_percentage, stock_quantity, low_stock_threshold, is_default
) VALUES 
('f0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000007', 'ZDF-DAT-250G', 250, 'g', '250 g', 320, 390, 17.95, 65, 10, TRUE),
('f0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000007', 'ZDF-DAT-500G', 500, 'g', '500 g', 590, 720, 18.06, 40, 5, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 6. NUTS CATEGORY: Farm-Fresh Roasted Cashews
INSERT INTO public.products (
    id, category_id, subcategory_id, name, slug, tagline, description,
    ingredients, nutrition_facts, storage_instructions, shelf_life_days,
    is_preservative_free, is_coconut_oil_made, is_bestseller, is_on_offer,
    is_cod_eligible, is_published, average_rating, review_count
) VALUES (
    'd0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000008', -- Nuts
    NULL,
    'Farm-Fresh Roasted Whole Cashews',
    'farm-fresh-roasted-cashews',
    'W-240 Jumbo grade roasted in pure cow ghee',
    'Single-origin Kerala jumbo whole cashews slowly drum-roasted with a touch of rock salt and fragrant cow ghee.',
    'Whole Cashew Nuts W-240 (97%), Pure Cow Ghee (2%), Rock salt (1%).',
    '{"calories": "580 kcal", "carbs": "30.0 g", "protein": "18.0 g", "fat": "46.0 g"}',
    'Store in an airtight jar in a cool, dry place.',
    90,
    TRUE, FALSE, TRUE, FALSE, TRUE, TRUE, 4.9, 540
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.product_variants (
    id, product_id, sku, weight_value, weight_unit, weight_label,
    selling_price, mrp, discount_percentage, stock_quantity, low_stock_threshold, is_default
) VALUES 
('f0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000008', 'ZDF-NUT-200G', 200, 'g', '200 g', 260, 320, 18.75, 140, 15, TRUE),
('f0000000-0000-0000-0000-000000000016', 'd0000000-0000-0000-0000-000000000008', 'ZDF-NUT-500G', 500, 'g', '500 g', 620, 750, 17.33, 85, 10, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 7. GIFT PACKS CATEGORY: Royal Malabar Festive Hamper
INSERT INTO public.products (
    id, category_id, subcategory_id, name, slug, tagline, description,
    ingredients, nutrition_facts, storage_instructions, shelf_life_days,
    is_preservative_free, is_coconut_oil_made, is_bestseller, is_on_offer,
    is_cod_eligible, is_published, average_rating, review_count
) VALUES (
    'd0000000-0000-0000-0000-000000000009',
    'c0000000-0000-0000-0000-000000000009', -- Gift Packs
    NULL,
    'Royal Malabar Festive Hamper',
    'royal-malabar-festive-hamper',
    'Luxury gold-embossed celebration gifting box',
    'Curated royal festive box containing Banana Chips (250g), Kozhikode Cashew Halwa (250g), Special Kerala Mixture (250g), and Roasted Cashews (200g).',
    'Assorted authentic Kerala delicacies packaged in individual vacuum-sealed foil pouches.',
    '{"serving": "Curated Assortment"}',
    'Store at room temperature in a dry location.',
    60,
    TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, 5.0, 195
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.product_variants (
    id, product_id, sku, weight_value, weight_unit, weight_label,
    selling_price, mrp, discount_percentage, stock_quantity, low_stock_threshold, is_default
) VALUES 
('f0000000-0000-0000-0000-000000000017', 'd0000000-0000-0000-0000-000000000009', 'ZDF-GFT-1KG', 1000, 'g', '1 kg Gift Box', 799, 999, 20.02, 50, 10, TRUE),
('f0000000-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000009', 'ZDF-GFT-2KG', 2000, 'g', '2 kg Luxury Hamper', 1499, 1899, 21.06, 30, 5, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 8. COMBOS CATEGORY: Kerala Teatime Snack Trio Combo
INSERT INTO public.products (
    id, category_id, subcategory_id, name, slug, tagline, description,
    ingredients, nutrition_facts, storage_instructions, shelf_life_days,
    is_preservative_free, is_coconut_oil_made, is_bestseller, is_on_offer,
    is_cod_eligible, is_published, average_rating, review_count
) VALUES (
    'd0000000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000010', -- Combos
    NULL,
    'Kerala Teatime Snack Trio Combo',
    'kerala-teatime-snack-trio-combo',
    'Banana Chips (250g) + Mixture (250g) + Tapioca Chips (250g)',
    'The quintessential Kerala evening tea snack bundle featuring crispy wafer-thin coconut oil banana chips, crunchy spicy mixture, and lightly salted tapioca chips.',
    'Nendran Bananas, Tapioca, Gram flour, Pure Coconut Oil, Red Chili, Peanuts, Salt.',
    '{"serving": "Family Trio Pack"}',
    'Keep sealed in original pouches.',
    60,
    TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 4.9, 720
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.product_variants (
    id, product_id, sku, weight_value, weight_unit, weight_label,
    selling_price, mrp, discount_percentage, stock_quantity, low_stock_threshold, is_default
) VALUES 
('f0000000-0000-0000-0000-000000000019', 'd0000000-0000-0000-0000-000000000010', 'ZDF-CMB-750G', 750, 'g', '750 g Trio Pack', 399, 490, 18.57, 180, 20, TRUE)
ON CONFLICT (id) DO NOTHING;

COMMIT;
