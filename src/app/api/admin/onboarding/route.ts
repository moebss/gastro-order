import { NextRequest, NextResponse } from "next/server";
import { Restaurant, DeliveryZone, OpeningHourDay } from "../../../../types/restaurant";
import { ALL_RESTAURANTS } from "../../../../data/restaurants";
import { ONBOARDING_TEMPLATES } from "../../../../lib/server/onboarding-templates";
import { parseMenuCsv } from "../../../../lib/server/csv-menu-parser";

export interface OnboardRestaurantPayload {
  name: string;
  tagline?: string;
  slug?: string;
  ownerName?: string;
  email: string;
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

const DEFAULT_OPENING_HOURS: OpeningHourDay[] = [
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

      categories = selectedTemplate.categories;
      items = selectedTemplate.items;
    }

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

    return NextResponse.json(
      {
        success: true,
        restaurant: newRestaurant,
        liveUrl: `/r/${newRestaurant.slug}`,
        adminUrl: `/admin?restaurantId=${newRestaurant.id}`,
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
