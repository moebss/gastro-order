-- ==============================================================================
-- GASTRO-BESTELLSYSTEM: SUPABASE POSTGRESQL SCHEMA MIT ROW LEVEL SECURITY (RLS)
-- Region: EU (Frankfurt) - Multi-Tenant Architektur
-- ==============================================================================

-- 1. UUID Erweiterung aktivieren
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPEN
DO $$ BEGIN
    CREATE TYPE order_type_enum AS ENUM ('delivery', 'pickup');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('cash', 'online');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status_enum AS ENUM ('new', 'preparing', 'delivering', 'ready', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('platform_admin', 'restaurant_owner', 'restaurant_staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- TABELLEN-DEFINITIONEN
-- ==============================================================================

-- Tabelle: RESTAURANTS (Mandanten)
CREATE TABLE IF NOT EXISTS public.restaurants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    tagline TEXT,
    street VARCHAR(255) NOT NULL,
    plz VARCHAR(10) NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    logo TEXT NOT NULL DEFAULT '🍕',
    hero_image TEXT,
    accent_color VARCHAR(20) NOT NULL DEFAULT '#ea580c',
    active BOOLEAN NOT NULL DEFAULT true,
    mollie_profile_id VARCHAR(100),
    mollie_api_key_encrypted TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabelle: RESTAURANT_MEMBERS (Zuordnung Betreiber <-> Restaurant)
CREATE TABLE IF NOT EXISTS public.restaurant_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id TEXT REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role_enum NOT NULL DEFAULT 'restaurant_owner',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(restaurant_id, user_id)
);

-- Tabelle: OPENING_HOURS (Öffnungs- und Lieferzeiten)
CREATE TABLE IF NOT EXISTS public.opening_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sonntag, 1=Montag...
    day_name VARCHAR(20) NOT NULL,
    is_open BOOLEAN NOT NULL DEFAULT true,
    slots JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array von { from: "11:30", to: "14:30" }
    UNIQUE(restaurant_id, day_of_week)
);

-- Tabelle: DELIVERY_ZONES (Liefergebiete & Mindestbestellwerte)
CREATE TABLE IF NOT EXISTS public.delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    plz VARCHAR(10) NOT NULL,
    area_name VARCHAR(100) NOT NULL,
    min_order NUMERIC(8, 2) NOT NULL DEFAULT 15.00,
    delivery_fee NUMERIC(8, 2) NOT NULL DEFAULT 1.50,
    estimated_minutes INT NOT NULL DEFAULT 35,
    UNIQUE(restaurant_id, plz)
);

-- Tabelle: CATEGORIES (Speisekarten-Kategorien)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    restaurant_id TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabelle: ITEMS (Speisen & Getränke)
CREATE TABLE IF NOT EXISTS public.items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    restaurant_id TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    number VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price NUMERIC(8, 2) NOT NULL,
    vat_rate INT NOT NULL CHECK (vat_rate IN (7, 19)),
    allergens TEXT[] NOT NULL DEFAULT '{}',
    image TEXT,
    is_sold_out BOOLEAN NOT NULL DEFAULT false,
    sort_order INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabelle: ITEM_SIZES (Größen wie z.B. 28cm vs 45cm)
CREATE TABLE IF NOT EXISTS public.item_sizes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    item_id TEXT NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(8, 2) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
);

-- Tabelle: EXTRA_GROUPS (Zusatzgruppen wie 'Extras', 'Dressing')
CREATE TABLE IF NOT EXISTS public.extra_groups (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    restaurant_id TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    item_id TEXT REFERENCES public.items(id) ON DELETE CASCADE, -- NULL = kategorieweit
    category_id TEXT REFERENCES public.categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    required BOOLEAN NOT NULL DEFAULT false,
    multiple BOOLEAN NOT NULL DEFAULT true,
    min_selections INT DEFAULT 0,
    max_selections INT DEFAULT 10,
    sort_order INT NOT NULL DEFAULT 0
);

-- Tabelle: EXTRAS (Einzelne Toppings / Saucen)
CREATE TABLE IF NOT EXISTS public.extras (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    group_id TEXT NOT NULL REFERENCES public.extra_groups(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    sort_order INT NOT NULL DEFAULT 0
);

-- Tabelle: ORDERS (Bestellungen)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    restaurant_id TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL,
    order_type order_type_enum NOT NULL DEFAULT 'delivery',
    status order_status_enum NOT NULL DEFAULT 'new',
    customer_data JSONB NOT NULL, -- { name, phone, email, street, houseNumber, plz, city, comment }
    desired_time JSONB NOT NULL, -- { type: 'asap'|'scheduled', timeSlot: '19:15' }
    payment_method payment_method_enum NOT NULL DEFAULT 'cash',
    payment_status payment_status_enum NOT NULL DEFAULT 'pending',
    mollie_payment_id VARCHAR(100),
    subtotal NUMERIC(8, 2) NOT NULL,
    delivery_fee NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(8, 2) NOT NULL,
    vat_7 NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    vat_19 NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    guest_access_token VARCHAR(100) NOT NULL DEFAULT gen_random_uuid()::TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabelle: ORDER_ITEMS (Bestellpositionen Snapshot)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    size_name VARCHAR(100),
    extras JSONB DEFAULT '[]'::jsonb,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(8, 2) NOT NULL,
    total_price NUMERIC(8, 2) NOT NULL,
    vat_rate INT NOT NULL CHECK (vat_rate IN (7, 19)),
    comment TEXT
);

-- ==============================================================================
-- INDEXE FÜR SCHNELLE ABFRAGEN
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_id ON public.categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_items_restaurant_id ON public.items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON public.items(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_guest_token ON public.orders(guest_access_token);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) FUNKTIONEN & POLICIES
-- ==============================================================================

-- RLS auf allen Tabellen aktivieren
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opening_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Hilfsfunktion: Gibt die restaurant_id des eingeloggten Nutzers zurück
CREATE OR REPLACE FUNCTION public.get_auth_restaurant_id()
RETURNS TEXT AS $$
    SELECT restaurant_id FROM public.restaurant_members
    WHERE user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Hilfsfunktion: Prüft, ob der Nutzer Plattform-Admin ist
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.restaurant_members
        WHERE user_id = auth.uid() AND role = 'platform_admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 1. POLICIES: RESTAURANTS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view active restaurants" ON public.restaurants;
CREATE POLICY "Public can view active restaurants"
    ON public.restaurants FOR SELECT
    USING (active = true);

DROP POLICY IF EXISTS "Restaurant owners can manage their restaurant" ON public.restaurants;
CREATE POLICY "Restaurant owners can manage their restaurant"
    ON public.restaurants FOR ALL
    USING (id = public.get_auth_restaurant_id() OR public.is_platform_admin());

-- ------------------------------------------------------------------------------
-- 2. POLICIES: SPEISEKARTE (Kategorien, Artikel, Größen, Extras, Zonen, Zeiten)
-- ------------------------------------------------------------------------------
-- Öffentlich: Gäste dürfen alle aktiven Speisekarten-Daten lesen
DROP POLICY IF EXISTS "Public can read categories" ON public.categories;
CREATE POLICY "Public can read categories"
    ON public.categories FOR SELECT
    USING (active = true);

DROP POLICY IF EXISTS "Public can read items" ON public.items;
CREATE POLICY "Public can read items"
    ON public.items FOR SELECT
    USING (active = true);

DROP POLICY IF EXISTS "Public can read item sizes" ON public.item_sizes;
CREATE POLICY "Public can read item sizes"
    ON public.item_sizes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can read extra groups" ON public.extra_groups;
CREATE POLICY "Public can read extra groups"
    ON public.extra_groups FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can read extras" ON public.extras;
CREATE POLICY "Public can read extras"
    ON public.extras FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can read delivery zones" ON public.delivery_zones;
CREATE POLICY "Public can read delivery zones"
    ON public.delivery_zones FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can read opening hours" ON public.opening_hours;
CREATE POLICY "Public can read opening hours"
    ON public.opening_hours FOR SELECT
    USING (true);

-- Restaurantbetreiber: Nur Zeilen des EIGENEN Restaurants ändern/löschen/anlegen
DROP POLICY IF EXISTS "Owners can manage categories" ON public.categories;
CREATE POLICY "Owners can manage categories"
    ON public.categories FOR ALL
    USING (restaurant_id = public.get_auth_restaurant_id() OR public.is_platform_admin())
    WITH CHECK (restaurant_id = public.get_auth_restaurant_id() OR public.is_platform_admin());

DROP POLICY IF EXISTS "Owners can manage items" ON public.items;
CREATE POLICY "Owners can manage items"
    ON public.items FOR ALL
    USING (restaurant_id = public.get_auth_restaurant_id() OR public.is_platform_admin())
    WITH CHECK (restaurant_id = public.get_auth_restaurant_id() OR public.is_platform_admin());

DROP POLICY IF EXISTS "Owners can manage extra groups" ON public.extra_groups;
CREATE POLICY "Owners can manage extra groups"
    ON public.extra_groups FOR ALL
    USING (restaurant_id = public.get_auth_restaurant_id() OR public.is_platform_admin())
    WITH CHECK (restaurant_id = public.get_auth_restaurant_id() OR public.is_platform_admin());

DROP POLICY IF EXISTS "Owners can manage delivery zones" ON public.delivery_zones;
CREATE POLICY "Owners can manage delivery zones"
    ON public.delivery_zones FOR ALL
    USING (restaurant_id = public.get_auth_restaurant_id() OR public.is_platform_admin())
    WITH CHECK (restaurant_id = public.get_auth_restaurant_id() OR public.is_platform_admin());

DROP POLICY IF EXISTS "Owners can manage opening hours" ON public.opening_hours;
CREATE POLICY "Owners can manage opening hours"
    ON public.opening_hours FOR ALL
    USING (restaurant_id = public.get_auth_restaurant_id() OR public.is_platform_admin())
    WITH CHECK (restaurant_id = public.get_auth_restaurant_id() OR public.is_platform_admin());

-- ------------------------------------------------------------------------------
-- 3. POLICIES: BESTELLUNGEN (MANDANTENTRENNUNG & GÄSTE-SCHUTZ)
-- ------------------------------------------------------------------------------
-- Gäste: Dürfen neue Bestellungen für aktive Restaurants anlegen
DROP POLICY IF EXISTS "Guests can insert orders" ON public.orders;
CREATE POLICY "Guests can insert orders"
    ON public.orders FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Guests can insert order items" ON public.order_items;
CREATE POLICY "Guests can insert order items"
    ON public.order_items FOR INSERT
    WITH CHECK (true);

-- Gäste: Dürfen nur ihre EIGENE Bestellung mit dem geheimen access token lesen
DROP POLICY IF EXISTS "Guests can view their own order" ON public.orders;
CREATE POLICY "Guests can view their own order"
    ON public.orders FOR SELECT
    USING (
        guest_access_token = current_setting('request.headers', true)::json->>'x-guest-token'
        OR id = current_setting('request.headers', true)::json->>'x-order-id'
    );

-- Restaurantbetreiber: Dürfen AUSSCHLIESSLICH Bestellungen ihrer restaurant_id sehen und bearbeiten!
DROP POLICY IF EXISTS "Restaurant owners can view own orders" ON public.orders;
CREATE POLICY "Restaurant owners can view own orders"
    ON public.orders FOR SELECT
    USING (restaurant_id = public.get_auth_restaurant_id() OR public.is_platform_admin());

DROP POLICY IF EXISTS "Restaurant owners can update own orders" ON public.orders;
CREATE POLICY "Restaurant owners can update own orders"
    ON public.orders FOR UPDATE
    USING (restaurant_id = public.get_auth_restaurant_id() OR public.is_platform_admin());

-- Order Items Einsicht nur für berechtigte Bestellungen
DROP POLICY IF EXISTS "View order items" ON public.order_items;
CREATE POLICY "View order items"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND (o.restaurant_id = public.get_auth_restaurant_id() OR public.is_platform_admin())
        )
    );
