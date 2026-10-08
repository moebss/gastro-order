-- ==============================================================================
-- GASTRO-ORDER: INITIAL SEED DATA FOR SUPABASE
-- Region: EU (Frankfurt)
-- Füllt Restaurants, Kategorien, Speisen, Öffnungszeiten & Liefergebiete
-- ==============================================================================

-- 1. RESTAURANTS EINFÜGEN
INSERT INTO public.restaurants (
    id, name, slug, tagline, street, plz, city, phone, email, logo, hero_image, accent_color, active
) VALUES 
(
    'rest_napoli_horrem_03',
    'Pizzeria Napoli Horrem',
    'pizzeria-napoli-horrem',
    'Original neapolitanische Steinofen-Pizza & Spezialitäten in Kerpen-Horrem',
    'Hauptstraße 181',
    '50169',
    'Kerpen-Horrem',
    '02273 9917575',
    'info@pizzeria-napoli-horrem.de',
    '🍕',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop',
    '#dc2626',
    true
),
(
    'rest_bella_napoli_01',
    'Pizzeria Bella Napoli',
    'bella-napoli',
    'Traditionelle italienische Küche & knusprige Steinofen-Pizza',
    'Musterstraße 42',
    '50667',
    'Köln',
    '0221 1234567',
    'info@bella-napoli.de',
    '🍕',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200&auto=format&fit=crop',
    '#ea580c',
    true
)
ON CONFLICT (id) DO NOTHING;

-- 2. LIEFERGEBIETE EINFÜGEN (NAPOLI HORREM)
INSERT INTO public.delivery_zones (
    restaurant_id, plz, area_name, min_order, delivery_fee, estimated_minutes
) VALUES 
('rest_napoli_horrem_03', '50169', 'Kerpen-Horrem', 15.00, 1.50, 30),
('rest_napoli_horrem_03', '50170', 'Kerpen-Sindorf', 18.00, 2.00, 40),
('rest_napoli_horrem_03', '50168', 'Kerpen-Götzenkirchen', 20.00, 2.50, 45)
ON CONFLICT (restaurant_id, plz) DO NOTHING;

-- 3. ÖFFNUNGSZEITEN EINFÜGEN (NAPOLI HORREM: DI-SO geöffnet, MO Ruhetag)
INSERT INTO public.opening_hours (restaurant_id, day_of_week, day_name, is_open, slots) VALUES 
('rest_napoli_horrem_03', 1, 'Montag', false, '[]'::jsonb),
('rest_napoli_horrem_03', 2, 'Dienstag', true, '[{"from":"17:00","to":"22:00"}]'::jsonb),
('rest_napoli_horrem_03', 3, 'Mittwoch', true, '[{"from":"17:00","to":"22:00"}]'::jsonb),
('rest_napoli_horrem_03', 4, 'Donnerstag', true, '[{"from":"17:00","to":"22:00"}]'::jsonb),
('rest_napoli_horrem_03', 5, 'Freitag', true, '[{"from":"17:00","to":"22:30"}]'::jsonb),
('rest_napoli_horrem_03', 6, 'Samstag', true, '[{"from":"16:00","to":"22:30"}]'::jsonb),
('rest_napoli_horrem_03', 0, 'Sonntag', true, '[{"from":"12:00","to":"21:30"}]'::jsonb)
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;

-- 4. KATEGORIEN EINFÜGEN (NAPOLI HORREM)
INSERT INTO public.categories (id, restaurant_id, name, description, sort_order, active) VALUES
('cat_napoli_pizza', 'rest_napoli_horrem_03', '🍕 Steinofen-Pizza', 'Traditionell bei 450°C im Steinofen gebacken', 1, true),
('cat_napoli_pasta', 'rest_napoli_horrem_03', '🍝 Pasta al Forno', 'Hausgemachte Nudeln & goldbraun überbackene Aufläufe', 2, true),
('cat_napoli_broetchen', 'rest_napoli_horrem_03', '🥖 Pizzabrötchen', 'Ofenfrisch mit Kräuterbutter oder Aioli', 3, true),
('cat_napoli_salate', 'rest_napoli_horrem_03', '🥗 Frische Salate', 'Knackige Salate mit hausgemachtem Dressing', 4, true),
('cat_napoli_dessert', 'rest_napoli_horrem_03', '🍰 Dolci & Desserts', 'Hausgemachte italienische Nachspeisen', 5, true),
('cat_napoli_drinks', 'rest_napoli_horrem_03', '🥤 Getränke', 'Eiskalte Erfrischungen', 6, true)
ON CONFLICT (id) DO NOTHING;

-- 5. SPEISEN & GETRÄNKE EINFÜGEN (NAPOLI HORREM)
INSERT INTO public.items (
    id, category_id, restaurant_id, number, name, description, base_price, vat_rate, allergens, sort_order, active
) VALUES
(
    'item_nap_01', 'cat_napoli_pizza', 'rest_napoli_horrem_03', '01',
    'Pizza Margherita Classica',
    'San Marzano Tomaten, Fior di Latte Mozzarella, frisches Basilikum, natives Olivenöl Extra',
    8.50, 7, ARRAY['A', 'G'], 1, true
),
(
    'item_nap_02', 'cat_napoli_pizza', 'rest_napoli_horrem_03', '02',
    'Pizza Diavola',
    'San Marzano Tomaten, Mozzarella, scharfe Spianata Calabrese Salami, pikante Peperoni',
    11.00, 7, ARRAY['A', 'G'], 2, true
),
(
    'item_nap_03', 'cat_napoli_pizza', 'rest_napoli_horrem_03', '03',
    'Pizza Prosciutto e Rucola',
    'San Marzano Tomaten, Mozzarella, Prosciutto di Parma 18 Mon., wilder Rucola, gehobelter Parmesan',
    12.50, 7, ARRAY['A', 'G'], 3, true
),
(
    'item_nap_04', 'cat_napoli_pizza', 'rest_napoli_horrem_03', '04',
    'Pizza Napoli Originale',
    'San Marzano Tomaten, Mozzarella, aromatische Sardellenfilets, Kapern, schwarze Oliven, Oregano',
    10.50, 7, ARRAY['A', 'D', 'G'], 4, true
),
(
    'item_nap_05', 'cat_napoli_pizza', 'rest_napoli_horrem_03', '05',
    'Pizza Quattro Formaggi',
    'Fior di Latte, Gorgonzola D.O.P., feiner Fontina & gehobelter Grana Padano',
    11.50, 7, ARRAY['A', 'G'], 5, true
),
(
    'item_nap_06', 'cat_napoli_pasta', 'rest_napoli_horrem_03', '20',
    'Lasagne al Forno Classica',
    'Hausgemachte Teigplatten geschichtet mit Rinder-Bolognese-Ragù, feiner Béchamel & Gratinkruste',
    11.50, 7, ARRAY['A', 'C', 'G'], 6, true
),
(
    'item_nap_07', 'cat_napoli_broetchen', 'rest_napoli_horrem_03', '30',
    'Ofenfrische Pizzabrötchen (8 Stk.)',
    'Dampfend heiß aus dem Steinofen serviert mit hausgemachter Kräuterbutter oder Aioli',
    4.50, 7, ARRAY['A', 'G'], 7, true
),
(
    'item_nap_08', 'cat_napoli_salate', 'rest_napoli_horrem_03', '40',
    'Insalata Caprese di Bufala',
    'Strauchtomaten mit cremigem Büffelmozzarella D.O.P., frischem Basilikum & Aceto Balsamico',
    9.50, 7, ARRAY['G'], 8, true
),
(
    'item_nap_09', 'cat_napoli_dessert', 'rest_napoli_horrem_03', '50',
    'Hausgemachtes Tiramisù',
    'Espresso getränkte Löffelbiskuits, samtige Mascarpone-Creme & edler Kakao nach Familienrezept',
    5.50, 7, ARRAY['A', 'C', 'G'], 9, true
),
(
    'item_nap_10', 'cat_napoli_drinks', 'rest_napoli_horrem_03', '90',
    'San Pellegrino Mineralwasser (0,5l Glas)',
    'Feinperliges italienisches Mineralwasser',
    2.80, 19, ARRAY[]::TEXT[], 10, true
),
(
    'item_nap_11', 'cat_napoli_drinks', 'rest_napoli_horrem_03', '91',
    'San Pellegrino Aranciata (0,33l Dose)',
    'Fruchtige italienische Orangenlimonade aus sizilianischen Früchten',
    2.90, 19, ARRAY[]::TEXT[], 11, true
)
ON CONFLICT (id) DO NOTHING;
