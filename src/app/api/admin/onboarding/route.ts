import { NextRequest, NextResponse } from "next/server";
import { Restaurant, DeliveryZone, OpeningHour } from "../../../../types/restaurant";
import { ALL_RESTAURANTS } from "../../../../data/restaurants";
import { ONBOARDING_TEMPLATES } from "../../../../lib/server/onboarding-templates";
import { parseMenuCsv } from "../../../../lib/server/csv-menu-parser";
import { createAdminUser } from "../../../../lib/server/users-store";
import { supabaseAdmin, isSupabaseConfigured } from "../../../../lib/supabase/client";

export interface OnboardRestaurantPayload {
  name: string;
  tagline?: string;
  slug?: string;
  ownerName?: string;
  email: string;
  password?: string;
  phone: string;
  street: string;
  plz: string;
  city: string;
  accentColor?: string;
  deliveryZones: Array<{
    plz: string;
    areaName?: string;
    minOrder: number;
    deliveryFee: number;
    estimatedMinutes?: number;
  }>;
  menuSource: "template" | "csv";
  templateId?: string;
  csvContent?: string;
}

function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = baseSlug || "restaurant";
  let counter = 1;
  while (ALL_RESTAURANTS.some((r) => r.slug === slug)) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
  return slug;
}

const DEFAULT_OPENING_HOURS: OpeningHour[] = [
  {
    day: 1,
    dayName: "Montag",
    isOpen: true,
    slots: [
      { from: "11:30", to: "14:30" },
      { from: "17:00", to: "22:00" },
    ],
  },
  {
    day: 2,
    dayName: "Dienstag",
    isOpen: true,
    slots: [
      { from: "11:30", to: "14:30" },
      { from: "17:00", to: "22:00" },
    ],
  },
  {
    day: 3,
    dayName: "Mittwoch",
    isOpen: true,
    slots: [
      { from: "11:30", to: "14:30" },
      { from: "17:00", to: "22:00" },
    ],
  },
  {
    day: 4,
    dayName: "Donnerstag",
    isOpen: true,
    slots: [
      { from: "11:30", to: "14:30" },
      { from: "17:00", to: "22:00" },
    ],
  },
  {
    day: 5,
    dayName: "Freitag",
    isOpen: true,
    slots: [
      { from: "11:30", to: "14:30" },
      { from: "17:00", to: "22:30" },
    ],
  },
  {
    day: 6,
    dayName: "Samstag",
    isOpen: true,
    slots: [{ from: "16:00", to: "22:30" }],
  },
  {
    day: 0,
    dayName: "Sonntag",
    isOpen: true,
    slots: [{ from: "12:00", to: "22:00" }],
  },
];

export async function POST(req: NextRequest) {
  try {
    const body: OnboardRestaurantPayload = await req.json();

    if (!body.name || !body.email || !body.phone || !body.plz || !body.city) {
      return NextResponse.json(
        {
          success: false,
          error: "Pflichtfelder fehlen (Name, E-Mail, Telefon, PLZ, Stadt).",
        },
        { status: 400 }
      );
    }

    if (!body.deliveryZones || body.deliveryZones.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Mindestens ein Liefergebiet (PLZ) ist erforderlich.",
        },
        { status: 400 }
      );
    }

    const restaurantId = `rest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const slug = body.slug ? generateSlug(body.slug) : generateSlug(body.name);

    // Speisekarte ermitteln
    let categories: any[] = [];
    let items: any[] = [];

    if (body.menuSource === "csv" && body.csvContent) {
      const parsed = parseMenuCsv(body.csvContent);
      if (parsed.errors.length > 0 && parsed.items.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `CSV-Fehler: ${parsed.errors.join("; ")}`,
          },
          { status: 400 }
        );
      }
      categories = parsed.categories;
      items = parsed.items;
    } else {
      const selectedTemplate =
        ONBOARDING_TEMPLATES.find((t) => t.id === body.templateId) ||
        ONBOARDING_TEMPLATES[0];

      // Jedes Restaurant erhält isolierte, eindeutige IDs für Kategorien und Gerichte
      const catIdMap = new Map<string, string>();
      categories = selectedTemplate.categories.map((c, i) => {
        const uniqueCatId = `cat_${restaurantId}_${i + 1}`;
        catIdMap.set(c.id, uniqueCatId);
        return {
          ...c,
          id: uniqueCatId,
          restaurantId,
        };
      });

      items = selectedTemplate.items.map((it, i) => ({
        ...it,
        id: `item_${restaurantId}_${i + 1}`,
        categoryId: catIdMap.get(it.categoryId) || categories[0]?.id,
        restaurantId,
      }));
    }

    const orderPrefix = (slug.split("-")[0] || "RES").toUpperCase().slice(0, 3);

    const deliveryZones: DeliveryZone[] = body.deliveryZones.map((z) => ({
      plz: z.plz.trim(),
      areaName: z.areaName || `${body.city} (${z.plz})`,
      minOrder: Number(z.minOrder) || 15.0,
      deliveryFee: Number(z.deliveryFee) || 0,
      estimatedMinutes: Number(z.estimatedMinutes) || 30,
    }));

    const newRestaurant: Restaurant = {
      id: restaurantId,
      name: body.name.trim(),
      slug,
      tagline: body.tagline?.trim() || "Frisch zubereitete Spezialitäten direkt zu dir geliefert",
      address: {
        street: body.street?.trim() || "Hauptstraße 1",
        plz: body.plz.trim(),
        city: body.city.trim(),
      },
      phone: body.phone.trim(),
      email: body.email.trim(),
      logo: "🍽️",
      heroImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200&auto=format&fit=crop",
      accentColor: body.accentColor || "#ea580c",
      active: true,
      deliveryZones,
      openingHours: DEFAULT_OPENING_HOURS,
      categories,
      items,
    };

    // Im laufenden System registrieren
    ALL_RESTAURANTS.push(newRestaurant);

    // In Supabase PostgreSQL spiegeln
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from("restaurants").upsert({
          id: newRestaurant.id,
          name: newRestaurant.name,
          slug: newRestaurant.slug,
          order_prefix: orderPrefix,
          tagline: newRestaurant.tagline,
          street: newRestaurant.address.street,
          plz: newRestaurant.address.plz,
          city: newRestaurant.address.city,
          phone: newRestaurant.phone,
          email: newRestaurant.email,
          logo: newRestaurant.logo,
          hero_image: newRestaurant.heroImage,
          accent_color: newRestaurant.accentColor,
          active: newRestaurant.active,
        });

        if (newRestaurant.deliveryZones && newRestaurant.deliveryZones.length > 0) {
          const zonesToInsert = newRestaurant.deliveryZones.map((z, idx) => ({
            id: `zone_${newRestaurant.id}_${idx}_${Date.now()}`,
            restaurant_id: newRestaurant.id,
            plz: z.plz,
            area_name: z.areaName || z.plz,
            min_order: z.minOrder,
            delivery_fee: z.deliveryFee,
            estimated_minutes: z.estimatedMinutes || 30,
          }));
          await supabaseAdmin.from("delivery_zones").insert(zonesToInsert);
        }

        if (categories && categories.length > 0) {
          const catsToInsert = categories.map((c) => ({
            id: c.id,
            restaurant_id: newRestaurant.id,
            name: c.name,
            description: c.description || "",
            sort_order: c.order || 0,
            active: true,
          }));
          await supabaseAdmin.from("categories").upsert(catsToInsert);
        }

        if (items && items.length > 0) {
          const itemsToInsert = items.map((it) => ({
            id: it.id,
            restaurant_id: newRestaurant.id,
            category_id: it.categoryId,
            number: it.number || "",
            name: it.name,
            description: it.description || "",
            base_price: it.basePrice,
            vat_rate: it.vatRate || 7,
            allergens: it.allergens || [],
            is_sold_out: false,
            sort_order: it.order || 0,
          }));
          await supabaseAdmin.from("items").upsert(itemsToInsert);
        }
      } catch (dbErr) {
        console.warn("Supabase onboarding sync notice:", dbErr);
      }
    }

    // Inhaber-Login für das neue Restaurant erstellen mit gewähltem Passwort
    const userPassword =
      body.password && body.password.trim().length >= 6
        ? body.password.trim()
        : `gastro${Math.floor(100 + Math.random() * 900)}`;
    const ownerName = body.ownerName?.trim() || `${body.name} Inhaber`;

    try {
      await createAdminUser({
        email: body.email.trim(),
        name: ownerName,
        restaurantId: newRestaurant.id,
        role: "restaurant_owner",
        password: userPassword,
      });
    } catch (userErr) {
      console.warn("User konnte nicht automatisch erstellt werden:", userErr);
    }

    return NextResponse.json(
      {
        success: true,
        restaurant: newRestaurant,
        liveUrl: `/r/${newRestaurant.slug}`,
        adminUrl: `/admin?restaurantId=${newRestaurant.id}&email=${encodeURIComponent(body.email.trim())}`,
        initialLogin: {
          name: ownerName,
          email: body.email.trim(),
          password: userPassword,
          role: "restaurant_owner",
        },
        message: `Restaurant „${newRestaurant.name}“ erfolgreich angelegt und online!`,
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("Onboarding Fehler:", e);
    return NextResponse.json(
      { success: false, error: e.message || "Interner Onboarding-Fehler" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    templates: ONBOARDING_TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      icon: t.icon,
      itemCount: t.items.length,
    })),
    existingRestaurants: ALL_RESTAURANTS.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      itemCount: r.items.length,
      zonesCount: r.deliveryZones.length,
    })),
  });
}
