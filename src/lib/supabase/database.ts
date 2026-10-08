import { supabase, isSupabaseConfigured } from "./client";
import { Restaurant, Category, MenuItem } from "../../types/restaurant";
import { ALL_RESTAURANTS } from "../../data/restaurants";

/**
 * Lädt ein Restaurant anhand seines Slugs (z.B. "pizzeria-bella-napoli" oder "asia-wok-express")
 */
export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  // Wenn Supabase live verbunden ist
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: rest, error } = await supabase
        .from("restaurants")
        .select(`
          *,
          opening_hours (*),
          delivery_zones (*),
          categories (*),
          items (
            *,
            item_sizes (*),
            extra_groups (
              *,
              extras (*)
            )
          )
        `)
        .eq("slug", slug)
        .eq("active", true)
        .single();

      if (!error && rest) {
        // Konvertiere snake_case Schema nach TypeScript CamelCase
        return {
          id: rest.id,
          name: rest.name,
          slug: rest.slug,
          tagline: rest.tagline || "",
          address: {
            street: rest.street,
            plz: rest.plz,
            city: rest.city,
          },
          phone: rest.phone,
          email: rest.email,
          logo: rest.logo || "🍽️",
          heroImage: rest.hero_image || "",
          accentColor: rest.accent_color || "#ea580c",
          active: rest.active,
          openingHours: (rest.opening_hours || []).map((h: any) => ({
            day: h.day_of_week,
            dayName: h.day_name,
            isOpen: h.is_open,
            slots: h.slots || [],
          })),
          deliveryZones: (rest.delivery_zones || []).map((z: any) => ({
            plz: z.plz,
            areaName: z.area_name,
            minOrder: Number(z.min_order),
            deliveryFee: Number(z.delivery_fee),
            estimatedMinutes: z.estimated_minutes,
          })),
          categories: (rest.categories || []).map((c: any) => ({
            id: c.id,
            restaurantId: c.restaurant_id,
            name: c.name,
            description: c.description || "",
            order: c.sort_order,
            active: c.active,
          })),
          items: (rest.items || []).map((i: any) => ({
            id: i.id,
            categoryId: i.category_id,
            number: i.number,
            name: i.name,
            description: i.description || "",
            basePrice: Number(i.base_price),
            vatRate: i.vat_rate,
            allergens: i.allergens || [],
            image: i.image,
            isSoldOut: i.is_sold_out,
            order: i.sort_order,
            sizes: (i.item_sizes || []).map((s: any) => ({
              id: s.id,
              name: s.name,
              price: Number(s.price),
            })),
            extraGroups: (i.extra_groups || []).map((g: any) => ({
              id: g.id,
              name: g.name,
              required: g.required,
              multiple: g.multiple,
              minSelections: g.min_selections,
              maxSelections: g.max_selections,
              extras: (g.extras || []).map((e: any) => ({
                id: e.id,
                name: e.name,
                price: Number(e.price),
              })),
            })),
          })),
        };
      }
    } catch (e) {
      console.warn("Supabase fetch failed, falling back to local multi-tenant database:", e);
    }
  }

  // Fallback / Lokale Mandanten-Datenbank
  const found = ALL_RESTAURANTS.find((r) => r.slug === slug);
  return found || null;
}

/**
 * Liefert alle registrierten aktiven Restaurants (für Tenant-Auswahl & Plattform-Übersicht)
 */
export async function getAllRestaurants(): Promise<Restaurant[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, slug, tagline, street, plz, city, logo, accent_color, active")
        .eq("active", true);

      if (!error && data && data.length > 0) {
        return data.map((r: any) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          tagline: r.tagline,
          address: { street: r.street, plz: r.plz, city: r.city },
          phone: "",
          email: "",
          logo: r.logo,
          heroImage: "",
          accentColor: r.accent_color,
          active: r.active,
          deliveryZones: [],
          openingHours: [],
          categories: [],
          items: [],
        }));
      }
    } catch (e) {
      // Ignorieren und Fallback nutzen
    }
  }

  return ALL_RESTAURANTS;
}

/**
 * Filtert Artikel strikt nach der Mandanten-ID (restaurant_id)
 * Kernfunktion für die strikte Mandantentrennung
 */
export function filterItemsByTenant(
  items: MenuItem[],
  categories: Category[],
  tenantRestaurantId: string
): { categories: Category[]; items: MenuItem[] } {
  const tenantCategories = categories.filter(
    (c) => c.restaurantId === tenantRestaurantId && c.active
  );
  const categoryIds = new Set(tenantCategories.map((c) => c.id));

  const tenantItems = items.filter((item) => categoryIds.has(item.categoryId));

  return {
    categories: tenantCategories,
    items: tenantItems,
  };
}
