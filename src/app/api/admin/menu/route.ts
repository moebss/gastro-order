import { NextRequest, NextResponse } from "next/server";
import { ALL_RESTAURANTS } from "../../../../data/restaurants";
import { supabaseAdmin, isSupabaseConfigured } from "../../../../lib/supabase/client";
import { MenuItem } from "../../../../types/restaurant";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { restaurantId, categoryId, name, description, basePrice, vatRate, number } = body;

    if (!restaurantId || !name || !basePrice) {
      return NextResponse.json(
        { success: false, error: "restaurantId, name und basePrice sind erforderlich." },
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

    const newItemId = `it_${Date.now()}`;
    const newItem: MenuItem = {
      id: newItemId,
      categoryId: categoryId || restaurant.categories[0]?.id || "cat_general",
      number: number || String(restaurant.items.length + 1),
      name: name.trim(),
      description: description?.trim() || "",
      basePrice: Number(basePrice),
      vatRate: vatRate === 19 ? 19 : 7,
      allergens: [],
      isSoldOut: false,
      order: restaurant.items.length + 1,
      sizes: [],
      extraGroups: [],
    };

    restaurant.items.push(newItem);

    // In Supabase PostgreSQL speichern
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin.from("items").insert({
          id: newItem.id,
          restaurant_id: restaurant.id,
          category_id: newItem.categoryId,
          number: newItem.number,
          name: newItem.name,
          description: newItem.description,
          base_price: newItem.basePrice,
          vat_rate: newItem.vatRate,
          is_sold_out: false,
          active: true,
          sort_order: newItem.order,
        });
      } catch (e) {
        console.warn("Supabase item insert warning:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Artikel „${newItem.name}“ erfolgreich angelegt.`,
      item: newItem,
    }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

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

    // Supabase spiegeln
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const updatePayload: Record<string, any> = {};
        if (typeof isSoldOut === "boolean") updatePayload.is_sold_out = isSoldOut;
        if (typeof basePrice === "number") updatePayload.base_price = item.basePrice;
        if (typeof name === "string") updatePayload.name = item.name;
        if (typeof description === "string") updatePayload.description = item.description;

        await supabaseAdmin
          .from("items")
          .update(updatePayload)
          .eq("id", itemId)
          .eq("restaurant_id", restaurant.id);
      } catch (e) {
        console.warn("Supabase item update warning:", e);
      }
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
