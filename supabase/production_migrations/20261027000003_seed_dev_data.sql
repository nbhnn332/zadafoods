-- ============================================================================
-- ZaDa Foods — Development Seed Data & Initial Admin Setup
-- Migration: 20261027000003_seed_dev_data.sql
-- ============================================================================

-- 1. INITIAL STORE SETTINGS
INSERT INTO public.store_settings (key, value, description)
VALUES
    ('shipping', '{"standardDeliveryFee": 40, "freeShippingThreshold": 499, "expressDeliveryFee": 80}', 'Shipping pricing rules'),
    ('checkout', '{"primaryCheckoutMode": "RAZORPAY", "isCodGloballyEnabled": true, "whatsappNumber": "917593959235"}', 'Checkout modes and switches'),
    ('compliance', '{"fssaiNumber": "11322999000123", "brandName": "ZaDa Foods", "supportEmail": "care@zadafoods.com"}', 'FSSAI and contact metadata')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. CATEGORIES (The 10 approved categories from Screen 1)
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

-- 3. SUBCATEGORIES FOR CHIPS
INSERT INTO public.subcategories (id, category_id, name, slug, display_order, is_active)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'All', 'all', 1, TRUE),
    ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Banana Chips', 'banana-chips', 2, TRUE),
    ('a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Tapioca', 'tapioca', 3, TRUE),
    ('a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'Plantain', 'plantain', 4, TRUE),
    ('a0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Jackfruit', 'jackfruit', 5, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4. PRODUCTS & VARIANTS
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

INSERT INTO public.product_variants (id, product_id, sku, weight_value, weight_unit, weight_label, selling_price, mrp, stock_quantity, low_stock_threshold, is_default)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'ZDF-BCN-100G', 100, 'g', '100 g', 80.00, 100.00, 150, 15, FALSE),
    ('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'ZDF-BCN-250G', 250, 'g', '250 g', 180.00, 220.00, 280, 20, TRUE),
    ('f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'ZDF-BCN-500G', 500, 'g', '500 g', 320.00, 390.00, 95, 10, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 5. COUPONS
INSERT INTO public.coupons (id, code, discount_type, discount_value, min_order_amount, is_first_order_only, usage_limit, is_active)
VALUES
    ('ca000000-0000-0000-0000-000000000001', 'ZADA80', 'FLAT', 80.00, 499.00, FALSE, 500, TRUE),
    ('ca000000-0000-0000-0000-000000000002', 'FIRST10', 'PERCENTAGE', 10.00, 299.00, TRUE, NULL, TRUE),
    ('ca000000-0000-0000-0000-000000000003', 'FREESHIP', 'FREE_SHIPPING', 40.00, 399.00, FALSE, NULL, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 6. QUANTITY TIER PRICING RULE
INSERT INTO public.pricing_rules (id, name, rule_type, product_id, min_quantity, discount_percentage, is_active)
VALUES
    ('da000000-0000-0000-0000-000000000001', 'Bulk Pack Discount - Banana Chips', 'QUANTITY_TIER', 'd0000000-0000-0000-0000-000000000001', 3, 5.00, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECURE INITIAL ADMINISTRATOR BOOTSTRAP INSTRUCTIONS:
-- To grant administrative privileges to a user securely:
-- 1. Have the admin register an account via Supabase Auth (or console).
-- 2. Execute the following SQL with their authenticated UUID:
--    UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@zadafoods.com';
--    INSERT INTO public.admin_roles (user_id, role)
--    SELECT id, 'superadmin' FROM public.profiles WHERE email = 'admin@zadafoods.com';
-- ============================================================================
