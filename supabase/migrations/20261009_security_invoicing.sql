-- =============================================================================
-- Migration: Sicherheit, fortlaufende Belegnummern, GoBD-Schutz, Admin-Benutzer
-- Datum: 2026-10-09
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Zusätzliche Spalten
-- -----------------------------------------------------------------------------
alter table public.orders
  add column if not exists net_7 numeric(10,2) not null default 0,
  add column if not exists net_19 numeric(10,2) not null default 0,
  add column if not exists sequence_number integer,
  add column if not exists is_test boolean not null default false;

alter table public.restaurants
  add column if not exists order_prefix varchar(8),
  add column if not exists tax_number varchar(40),
  add column if not exists vat_id varchar(20);

alter table public.delivery_zones
  add column if not exists free_delivery_from numeric(10,2);

-- Bisherige Bestellungen sind ausschließlich Demo-/Testdaten
update public.orders set is_test = true where sequence_number is null;

-- Präfixe der bestehenden Restaurants
update public.restaurants set order_prefix = 'NAP' where id = 'rest_napoli_horrem_03' and order_prefix is null;
update public.restaurants set order_prefix = 'BN'  where id = 'rest_bella_napoli_01'  and order_prefix is null;

-- Golden Wok fehlte in der Datenbank -> Bestellungen scheiterten am Fremdschlüssel
insert into public.restaurants (id, name, slug, tagline, street, plz, city, phone, email, logo, accent_color, active, order_prefix)
values ('rest_golden_wok_02', 'Golden Wok Asia Express', 'asia-wok-express',
        'Knusprige Wok-Spezialitäten, handgerollte Frühlingsrollen & Currys',
        'Birkenstraße 78', '40233', 'Düsseldorf', '0211 6874920',
        'order@golden-wok-duesseldorf.de', '🥢', '#dc2626', true, 'GW')
on conflict (id) do nothing;

-- Napoli Horrem: kostenlose Lieferung ab 25 € in Horrem (wie auf der Website kommuniziert)
update public.delivery_zones set free_delivery_from = 25.00
where restaurant_id = 'rest_napoli_horrem_03' and plz = '50169' and free_delivery_from is null;

-- -----------------------------------------------------------------------------
-- 2. Fortlaufende Belegnummern pro Restaurant
-- -----------------------------------------------------------------------------
create table if not exists public.order_counters (
  restaurant_id text primary key references public.restaurants(id) on delete cascade,
  last_number integer not null default 0
);
alter table public.order_counters enable row level security;
-- Keine Policies: nur Service-Role und SECURITY DEFINER Funktionen

create or replace function public.next_order_number(p_restaurant_id text)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.order_counters (restaurant_id, last_number)
  values (p_restaurant_id, 1)
  on conflict (restaurant_id)
  do update set last_number = public.order_counters.last_number + 1
  returning last_number;
$$;
revoke all on function public.next_order_number(text) from public, anon, authenticated;

create or replace function public.assign_order_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
begin
  select coalesce(
           nullif(order_prefix, ''),
           upper(left(regexp_replace(name, '[^A-Za-z]', '', 'g'), 3))
         )
    into v_prefix
    from public.restaurants
   where id = new.restaurant_id;

  new.sequence_number := public.next_order_number(new.restaurant_id);
  new.order_number := coalesce(v_prefix, 'ORD') || '-' || lpad(new.sequence_number::text, 5, '0');
  new.is_test := false;
  new.created_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_assign_order_number on public.orders;
create trigger trg_assign_order_number
  before insert on public.orders
  for each row execute function public.assign_order_number();

create unique index if not exists orders_restaurant_order_number_key
  on public.orders (restaurant_id, order_number);

-- -----------------------------------------------------------------------------
-- 3. GoBD-Schutz: Beträge und Positionen sind nach dem Speichern unveränderbar
--    Erlaubt bleiben: status, payment_status, mollie_payment_id, desired_time
--    Löschen nur für Testdaten (is_test) oder mit explizitem Session-Flag
-- -----------------------------------------------------------------------------
create or replace function public.protect_order_record()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.is_test or coalesce(current_setting('app.allow_order_delete', true), '') = 'on' then
      return old;
    end if;
    raise exception 'Bestellung % darf nicht gelöscht werden (Aufbewahrungspflicht). Bitte stattdessen stornieren.', old.order_number;
  end if;

  if (new.id, new.restaurant_id, new.order_number, new.sequence_number, new.order_type,
      new.customer_data, new.payment_method, new.subtotal, new.delivery_fee, new.total,
      new.vat_7, new.vat_19, new.net_7, new.net_19, new.created_at, new.is_test)
     is distinct from
     (old.id, old.restaurant_id, old.order_number, old.sequence_number, old.order_type,
      old.customer_data, old.payment_method, old.subtotal, old.delivery_fee, old.total,
      old.vat_7, old.vat_19, old.net_7, old.net_19, old.created_at, old.is_test)
  then
    raise exception 'Beleg % ist abgeschlossen: Beträge, Kundendaten und Nummer dürfen nicht geändert werden.', old.order_number;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_order_record on public.orders;
create trigger trg_protect_order_record
  before update or delete on public.orders
  for each row execute function public.protect_order_record();

create or replace function public.protect_order_items()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_is_test boolean;
begin
  select is_test into v_is_test from public.orders where id = old.order_id;
  if tg_op = 'DELETE' and (coalesce(v_is_test, true)
       or coalesce(current_setting('app.allow_order_delete', true), '') = 'on') then
    return old;
  end if;
  raise exception 'Belegpositionen sind unveränderbar.';
end;
$$;

drop trigger if exists trg_protect_order_items on public.order_items;
create trigger trg_protect_order_items
  before update or delete on public.order_items
  for each row execute function public.protect_order_items();

-- -----------------------------------------------------------------------------
-- 4. Admin-Benutzer (persistente Logins mit Passwort-Hash)
-- -----------------------------------------------------------------------------
create table if not exists public.admin_users (
  id text primary key,
  email varchar(255) not null unique,
  password_hash text not null,
  name varchar(200) not null,
  restaurant_id text references public.restaurants(id) on delete cascade,
  role public.user_role_enum not null default 'restaurant_owner',
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);
alter table public.admin_users enable row level security;
-- Keine Policies: ausschließlich über den Server (Service-Role) erreichbar

-- -----------------------------------------------------------------------------
-- 5. Öffentliche Bestellfunktion für statische Websites
--    Preise, Steuern und Liefergebühren werden ausschließlich hier berechnet.
-- -----------------------------------------------------------------------------
create or replace function public.place_order(
  p_restaurant_id text,
  p_order_type text,
  p_payment_method text,
  p_customer jsonb,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_restaurant public.restaurants%rowtype;
  v_zone public.delivery_zones%rowtype;
  v_line jsonb;
  v_item public.items%rowtype;
  v_qty integer;
  v_lines jsonb := '[]'::jsonb;
  v_food numeric(10,2) := 0;
  v_drink numeric(10,2) := 0;
  v_subtotal numeric(10,2) := 0;
  v_fee numeric(10,2) := 0;
  v_fee7 numeric(10,2) := 0;
  v_fee19 numeric(10,2) := 0;
  v_gross7 numeric(10,2);
  v_gross19 numeric(10,2);
  v_net7 numeric(10,2);
  v_net19 numeric(10,2);
  v_total numeric(10,2);
  v_name text := btrim(coalesce(p_customer->>'name', ''));
  v_phone text := btrim(coalesce(p_customer->>'phone', ''));
  v_plz text := btrim(coalesce(p_customer->>'plz', ''));
  v_street text := btrim(coalesce(p_customer->>'street', ''));
  v_order_id text := 'ord_' || replace(gen_random_uuid()::text, '-', '');
  v_number text;
  v_token text;
  v_recent integer;
begin
  -- Restaurant
  select * into v_restaurant from public.restaurants where id = p_restaurant_id and active = true;
  if not found then
    raise exception 'Restaurant nicht gefunden oder pausiert.' using errcode = 'P0001';
  end if;

  if p_order_type not in ('delivery', 'pickup') then
    raise exception 'Ungültige Bestellart.' using errcode = 'P0001';
  end if;
  if p_payment_method not in ('cash', 'online') then
    raise exception 'Ungültige Zahlungsart.' using errcode = 'P0001';
  end if;

  -- Kundendaten
  if length(v_name) < 2 or length(v_name) > 100 then
    raise exception 'Bitte einen gültigen Namen angeben.' using errcode = 'P0001';
  end if;
  if length(regexp_replace(v_phone, '[^0-9]', '', 'g')) < 6 or length(v_phone) > 40 then
    raise exception 'Bitte eine gültige Telefonnummer angeben.' using errcode = 'P0001';
  end if;
  if length(coalesce(p_customer->>'comment', '')) > 500 or length(v_street) > 200 then
    raise exception 'Eingaben zu lang.' using errcode = 'P0001';
  end if;

  -- Einfacher Spam-Schutz: max. 5 Bestellungen pro Telefonnummer in 10 Minuten
  select count(*) into v_recent
    from public.orders
   where restaurant_id = p_restaurant_id
     and customer_data->>'phone' = v_phone
     and created_at > timezone('utc', now()) - interval '10 minutes';
  if v_recent >= 5 then
    raise exception 'Zu viele Bestellungen in kurzer Zeit. Bitte ruf uns direkt an.' using errcode = 'P0001';
  end if;

  -- Positionen
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'Der Warenkorb ist leer oder ungültig.' using errcode = 'P0001';
  end if;

  for v_line in select * from jsonb_array_elements(p_items) loop
    v_qty := coalesce((v_line->>'quantity')::integer, 0);
    if v_qty < 1 or v_qty > 50 then
      raise exception 'Ungültige Menge.' using errcode = 'P0001';
    end if;

    select * into v_item from public.items
     where id = v_line->>'item_id' and restaurant_id = p_restaurant_id and active = true;
    if not found then
      raise exception 'Ein Artikel ist nicht mehr verfügbar.' using errcode = 'P0001';
    end if;
    if v_item.is_sold_out then
      raise exception '„%“ ist leider ausverkauft.', v_item.name using errcode = 'P0001';
    end if;

    if v_item.vat_rate = 7 then
      v_food := v_food + v_item.base_price * v_qty;
    else
      v_drink := v_drink + v_item.base_price * v_qty;
    end if;

    v_lines := v_lines || jsonb_build_object(
      'item_name', v_item.name,
      'quantity', v_qty,
      'unit_price', v_item.base_price,
      'total_price', round(v_item.base_price * v_qty, 2),
      'vat_rate', v_item.vat_rate,
      'comment', left(nullif(btrim(coalesce(v_line->>'comment', '')), ''), 200)
    );
  end loop;

  v_subtotal := v_food + v_drink;

  -- Lieferung
  if p_order_type = 'delivery' then
    select * into v_zone from public.delivery_zones
     where restaurant_id = p_restaurant_id and plz = v_plz;
    if not found then
      raise exception 'In die PLZ % liefern wir leider nicht.', v_plz using errcode = 'P0001';
    end if;
    if length(v_street) < 3 then
      raise exception 'Bitte Straße und Hausnummer angeben.' using errcode = 'P0001';
    end if;
    if v_subtotal < v_zone.min_order then
      raise exception 'Mindestbestellwert von % € nicht erreicht.', to_char(v_zone.min_order, 'FM990D00') using errcode = 'P0001';
    end if;
    if v_zone.free_delivery_from is not null and v_subtotal >= v_zone.free_delivery_from then
      v_fee := 0;
    else
      v_fee := v_zone.delivery_fee;
    end if;
  end if;

  -- Liefergebühr als Nebenleistung im Verhältnis der Warenwerte aufteilen
  if v_fee > 0 and v_subtotal > 0 then
    v_fee7 := round(v_fee * v_food / v_subtotal, 2);
    v_fee19 := v_fee - v_fee7;
  end if;

  v_gross7 := v_food + v_fee7;
  v_gross19 := v_drink + v_fee19;
  v_net7 := round(v_gross7 / 1.07, 2);
  v_net19 := round(v_gross19 / 1.19, 2);
  v_total := v_subtotal + v_fee;

  insert into public.orders (
    id, restaurant_id, order_number, order_type, status, customer_data, desired_time,
    payment_method, payment_status, subtotal, delivery_fee, total,
    vat_7, vat_19, net_7, net_19
  ) values (
    v_order_id, p_restaurant_id, 'pending', p_order_type::public.order_type_enum, 'new',
    jsonb_build_object(
      'name', v_name,
      'phone', v_phone,
      'email', left(btrim(coalesce(p_customer->>'email', '')), 200),
      'street', v_street,
      'plz', v_plz,
      'city', left(btrim(coalesce(p_customer->>'city', '')), 100),
      'comment', left(btrim(coalesce(p_customer->>'comment', '')), 500),
      'source', 'website'
    ),
    jsonb_build_object('type', 'asap'),
    p_payment_method::public.payment_method_enum,
    'pending',
    v_subtotal, v_fee, v_total,
    v_gross7 - v_net7, v_gross19 - v_net19, v_net7, v_net19
  )
  returning order_number, guest_access_token into v_number, v_token;

  insert into public.order_items (order_id, item_name, size_name, extras, quantity, unit_price, total_price, vat_rate, comment)
  select v_order_id, l->>'item_name', null, '[]'::jsonb, (l->>'quantity')::integer,
         (l->>'unit_price')::numeric, (l->>'total_price')::numeric, (l->>'vat_rate')::integer, l->>'comment'
    from jsonb_array_elements(v_lines) l;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_number,
    'guest_token', v_token,
    'subtotal', v_subtotal,
    'delivery_fee', v_fee,
    'total', v_total,
    'payment_status', 'pending'
  );
end;
$$;

revoke all on function public.place_order(text, text, text, jsonb, jsonb) from public;
grant execute on function public.place_order(text, text, text, jsonb, jsonb) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 6. RLS: keine direkten anonymen Inserts mehr; Gäste sehen nur mit Token
-- -----------------------------------------------------------------------------
drop policy if exists "Guests can insert orders" on public.orders;
drop policy if exists "Guests can insert order items" on public.order_items;
drop policy if exists "Guests can view their own order" on public.orders;
create policy "Guests can view their own order" on public.orders
  for select
  using (guest_access_token::text = ((current_setting('request.headers', true))::json ->> 'x-guest-token'));

revoke insert, update, delete on public.orders, public.order_items from anon;
