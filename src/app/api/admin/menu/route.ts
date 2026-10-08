import { NextRequest, NextResponse } from "next/server";
import { ALL_RESTAURANTS } from "../../../../data/restaurants";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { restaurantId, itemId, isSoldOut, basePrice, name, description } = body;

    if (!restaurantId || !itemId) {
      return NextResponse.json(
        { success: false, error: "restaurantId und itemId sind erforderlich." },
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

    const item = restaurant.items.find((it) => it.id === itemId);
    if (!item) {
      return NextResponse.json(
        { success: false, error: "Artikel nicht gefunden." },
        { status: 404 }
      );
    }

    // Felder aktualisieren
    if (typeof isSoldOut === "boolean") {
      item.isSoldOut = isSoldOut;
    }

    if (typeof basePrice === "number" && basePrice > 0) {
      item.basePrice = Math.round(basePrice * 100) / 100;
    }

    if (typeof name === "string" && name.trim()) {
      item.name = name.trim();
    }

    if (typeof description === "string") {
      item.description = description.trim();
    }

    return NextResponse.json({
      success: true,
      message: `Artikel „${item.name}“ erfolgreich aktualisiert.`,
      item,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
