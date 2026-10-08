import { NextRequest, NextResponse } from "next/server";
import { ALL_RESTAURANTS } from "../../../../data/restaurants";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { restaurantId, active, openingHours, deliveryZones } = body;

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: "restaurantId ist erforderlich." },
        { status: 400 }
      );
    }

    const restaurant = ALL_RESTAURANTS.find(
      (r) => r.id === restaurantId || r.slug === restaurantId
    );

    if (!restaurant) {
      return NextResponse.json(
        { success: false, error: "Restaurant nicht gefunden." },
        { status: 404 }
      );
    }

    if (typeof active === "boolean") {
      restaurant.active = active;
    }

    if (Array.isArray(openingHours)) {
      restaurant.openingHours = openingHours;
    }

    if (Array.isArray(deliveryZones)) {
      restaurant.deliveryZones = deliveryZones;
    }

    if (typeof body.mollieApiKey === "string") {
      restaurant.mollieApiKey = body.mollieApiKey.trim();
    }

    return NextResponse.json({
      success: true,
      message: "Einstellungen erfolgreich gespeichert.",
      restaurant,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
