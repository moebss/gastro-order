-- ==============================================================================
-- SEED DATEN: 2 DEMO-RESTAURANTS ZUR DEMONSTRATION DER MANDANTENTRENNUNG
-- ==============================================================================

-- 1. RESTAURANT 1: Pizzeria Bella Napoli (Köln-Ehrenfeld)
INSERT INTO public.restaurants (id, name, slug, tagline, street, plz, city, phone, email, logo, hero_image, accent_color, active)
VALUES (
    'rest_bella_napoli_01',
    'Pizzeria Bella Napoli',
    'pizzeria-bella-napoli',
    'Echte neapolitanische Steinofenpizza & frische Pasta seit 1994',
    'Venloer Straße 240',
    '50823',
    'Köln',
    '0221 5104820',
    'ciao@bella-napoli-koeln.de',
    '🍕',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop',
    '#ea580c',
    true
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;

-- Öffnungszeiten Restaurant 1
INSERT INTO public.opening_hours (restaurant_id, day_of_week, day_name, is_open, slots) VALUES
('rest_bella_napoli_01', 1, 'Montag', true, '[{"from": "11:30", "to": "14:30"}, {"from": "17:00", "to": "22:00"}]'::jsonb),
('rest_bella_napoli_01', 2, 'Dienstag', true, '[{"from": "11:30", "to": "14:30"}, {"from": "17:00", "to": "22:00"}]'::jsonb),
('rest_bella_napoli_01', 3, 'Mittwoch', true, '[{"from": "11:30", "to": "14:30"}, {"from": "17:00", "to": "22:00"}]'::jsonb),
('rest_bella_napoli_01', 4, 'Donnerstag', true, '[{"from": "11:30", "to": "14:30"}, {"from": "17:00", "to": "22:00"}]'::jsonb),
('rest_bella_napoli_01', 5, 'Freitag', true, '[{"from": "11:30", "to": "14:30"}, {"from": "17:00", "to": "23:00"}]'::jsonb),
('rest_bella_napoli_01', 6, 'Samstag', true, '[{"from": "12:00", "to": "23:00"}]'::jsonb),
('rest_bella_napoli_01', 0, 'Sonntag', true, '[{"from": "12:00", "to": "22:00"}]'::jsonb)
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;

-- Liefergebiete Restaurant 1
INSERT INTO public.delivery_zones (restaurant_id, plz, area_name, min_order, delivery_fee, estimated_minutes) VALUES
('rest_bella_napoli_01', '50823', 'Köln-Ehrenfeld', 15.00, 1.50, 30),
('rest_bella_napoli_01', '50825', 'Köln-Neuehrenfeld', 18.00, 2.00, 35),
('rest_bella_napoli_01', '50672', 'Köln-Belgisches Viertel', 20.00, 2.50, 40),
('rest_bella_napoli_01', '50674', 'Köln-Neustadt-Süd', 25.00, 3.00, 45)
ON CONFLICT (restaurant_id, plz) DO NOTHING;

-- Kategorien Restaurant 1
INSERT INTO public.categories (id, restaurant_id, name, description, sort_order, active) VALUES
('cat_bn_pizza', 'rest_bella_napoli_01', 'Steinofen-Pizza', 'Traditionell 48 Std. kalt gereifter Teig, San Marzano Tomaten D.O.P., Fior di Latte', 1, true),
('cat_bn_pasta', 'rest_bella_napoli_01', 'Frische Pasta', 'Täglich hausgemachte Nudeln nach originalem Familienrezept', 2, true),
('cat_bn_salate', 'rest_bella_napoli_01', 'Knackige Salate', 'Mit frischem Marktsalat und hausgemachten Dressings serviert', 3, true),
('cat_bn_drinks', 'rest_bella_napoli_01', 'Getränke & Wein', 'Gekühlte Softdrinks, italienisches Bier und erlesene Weine (19% MwSt.)', 4, true)
ON CONFLICT (id) DO NOTHING;

-- Artikel Restaurant 1
INSERT INTO public.items (id, category_id, restaurant_id, number, name, description, base_price, vat_rate, allergens, image, is_sold_out, sort_order) VALUES
('item_bn_p1', 'cat_bn_pizza', 'rest_bella_napoli_01', '10', 'Pizza Margherita', 'Fruchtige San Marzano Tomatensauce, Fior di Latte Mozzarella, frisches Basilikum', 8.50, 7, '{"A","G"}', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=800&auto=format&fit=crop', false, 1),
('item_bn_p2', 'cat_bn_pizza', 'rest_bella_napoli_01', '12', 'Pizza Salame', 'San Marzano Tomaten, Fior di Latte Mozzarella, feine italienische Edelsalami', 9.90, 7, '{"A","G"}', 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800&auto=format&fit=crop', false, 2),
('item_bn_pas1', 'cat_bn_pasta', 'rest_bella_napoli_01', '31', 'Spaghetti alla Carbonara Autentica', 'Original römisch: Guanciale, Bio-Eigelb, Pecorino Romano, ohne Sahne', 12.50, 7, '{"A","C","G"}', 'https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=800&auto=format&fit=crop', false, 3),
('item_bn_drk1', 'cat_bn_drinks', 'rest_bella_napoli_01', '70', 'Coca-Cola 0,33l', 'Eiskalte Dose inklusive 0,25 € DPG Pfand', 2.90, 19, '{}', null, false, 4)
ON CONFLICT (id) DO NOTHING;

-- Größen für Pizza Margherita
INSERT INTO public.item_sizes (id, item_id, name, price, sort_order) VALUES
('sz_bn_p1_std', 'item_bn_p1', 'Klassik Ø 28 cm', 8.50, 1),
('sz_bn_p1_fam', 'item_bn_p1', 'Familie Ø 45 cm', 16.50, 2)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. RESTAURANT 2: Golden Wok Asia Express (Düsseldorf-Flingern)
-- ------------------------------------------------------------------------------
INSERT INTO public.restaurants (id, name, slug, tagline, street, plz, city, phone, email, logo, hero_image, accent_color, active)
VALUES (
    'rest_golden_wok_02',
    'Golden Wok Asia Express',
    'asia-wok-express',
    'Knusprige Wok-Spezialitäten, handgerollte Frühlingsrollen & Currys',
    'Birkenstraße 78',
    '40233',
    'Düsseldorf',
    '0211 6874920',
    'order@golden-wok-duesseldorf.de',
    '🥢',
    'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?q=80&w=1200&auto=format&fit=crop',
    '#dc2626',
    true
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;

-- Öffnungszeiten Restaurant 2
INSERT INTO public.opening_hours (restaurant_id, day_of_week, day_name, is_open, slots) VALUES
('rest_golden_wok_02', 1, 'Montag', true, '[{"from": "11:00", "to": "21:30"}]'::jsonb),
('rest_golden_wok_02', 2, 'Dienstag', true, '[{"from": "11:00", "to": "21:30"}]'::jsonb),
('rest_golden_wok_02', 3, 'Mittwoch', true, '[{"from": "11:00", "to": "21:30"}]'::jsonb),
('rest_golden_wok_02', 4, 'Donnerstag', true, '[{"from": "11:00", "to": "21:30"}]'::jsonb),
('rest_golden_wok_02', 5, 'Freitag', true, '[{"from": "11:00", "to": "22:00"}]'::jsonb),
('rest_golden_wok_02', 6, 'Samstag', true, '[{"from": "12:00", "to": "22:00"}]'::jsonb),
('rest_golden_wok_02', 0, 'Sonntag', true, '[{"from": "12:00", "to": "21:30"}]'::jsonb)
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;

-- Liefergebiete Restaurant 2 (Düsseldorf)
INSERT INTO public.delivery_zones (restaurant_id, plz, area_name, min_order, delivery_fee, estimated_minutes) VALUES
('rest_golden_wok_02', '40233', 'Düsseldorf-Flingern', 12.00, 1.00, 25),
('rest_golden_wok_02', '40210', 'Düsseldorf-Stadtmitte', 16.00, 2.00, 30),
('rest_golden_wok_02', '40237', 'Düsseldorf-Düsseltal', 20.00, 2.50, 35)
ON CONFLICT (restaurant_id, plz) DO NOTHING;

-- Kategorien Restaurant 2
INSERT INTO public.categories (id, restaurant_id, name, description, sort_order, active) VALUES
('cat_gw_vorspeisen', 'rest_golden_wok_02', 'Vorspeisen & Dim Sum', 'Frisch frittiert und gedämpft mit hausgemachter süß-saurer Sauce', 1, true),
('cat_gw_nudeln', 'rest_golden_wok_02', 'Gebratene Wok-Nudeln', 'Frisch im heißen Gusseisen-Wok geschwenkt mit knackigem Sojasprossen-Gemüse', 2, true),
('cat_gw_curry', 'rest_golden_wok_02', 'Traditionelle Currys', 'Mit duftendem Jasmin-Reis und cremiger Kokosmilch serviert', 3, true),
('cat_gw_drinks', 'rest_golden_wok_02', 'Asiatische Erfrischungen', 'Hausgemachter Mango-Lassi, Jasmintee und Softdrinks (19% MwSt.)', 4, true)
ON CONFLICT (id) DO NOTHING;

-- Artikel Restaurant 2
INSERT INTO public.items (id, category_id, restaurant_id, number, name, description, base_price, vat_rate, allergens, image, is_sold_out, sort_order) VALUES
('item_gw_v1', 'cat_gw_vorspeisen', 'rest_golden_wok_02', 'A1', 'Vegetarische Mini-Frühlingsrollen (6 Stk.)', 'Knusprig gebackene Teigrollen mit Gemüsefüllung und Sweet-Chili Dip', 4.50, 7, '{"A","F"}', 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop', false, 1),
('item_gw_n1', 'cat_gw_nudeln', 'rest_golden_wok_02', 'W12', 'Gebratene Eiernudeln mit knuspriger Ente', 'Krosse Canton-Ente auf aromatischen Wok-Nudeln mit Lauch, Karotten und Ei', 13.90, 7, '{"A","C","F"}', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=800&auto=format&fit=crop', false, 2),
('item_gw_c1', 'cat_gw_curry', 'rest_golden_wok_02', 'C24', 'Rotes Thai-Curry mit Hühnerbrust', 'Pikantes Kokos-Curry mit Bambusstreifen, Thai-Basilikum und Jasmin-Reis', 11.50, 7, '{"F"}', 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=800&auto=format&fit=crop', false, 3),
('item_gw_d1', 'cat_gw_drinks', 'rest_golden_wok_02', 'T01', 'Hausgemachter Mango Lassi 0,4l', 'Cremiger indischer Joghurt-Drink mit reifer Alphonso-Mango', 3.80, 19, '{"G"}', null, false, 4)
ON CONFLICT (id) DO NOTHING;
