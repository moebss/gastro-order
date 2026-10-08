import { describe, it, expect } from "vitest";
import {
  RESTAURANT_BELLA_NAPOLI,
  RESTAURANT_GOLDEN_WOK,
  ALL_RESTAURANTS,
} from "../../data/restaurants";
import {
  getRestaurantBySlug,
  filterItemsByTenant,
} from "../supabase/database";

describe("Meilenstein 2: Mandantenfähigkeit & Speisekarten-Trennung", () => {
  it("lädt Restaurant 1 (Bella Napoli) und enthält ausschließlich italienische Speisen", async () => {
    const restaurant1 = await getRestaurantBySlug("pizzeria-bella-napoli");
    expect(restaurant1).not.toBeNull();
    expect(restaurant1?.id).toBe("rest_bella_napoli_01");
    expect(restaurant1?.name).toBe("Pizzeria Bella Napoli");

    // Prüfe Kategorien
    const categoryNames = restaurant1?.categories.map((c) => c.name) || [];
    expect(categoryNames).toContain("Steinofen-Pizza");
    expect(categoryNames).toContain("Frische Pasta");
    expect(categoryNames).not.toContain("Gebratene Wok-Nudeln");

    // Prüfe Artikel
    const itemNames = restaurant1?.items.map((i) => i.name) || [];
    expect(itemNames).toContain("Pizza Margherita");
    expect(itemNames).toContain("Spaghetti alla Carbonara Autentica");
    expect(itemNames).not.toContain("Gebratene Eiernudeln mit knuspriger Ente");
    expect(itemNames).not.toContain("Vegetarische Mini-Frühlingsrollen (6 Stk.)");
  });

  it("lädt Restaurant 2 (Golden Wok) und enthält ausschließlich asiatische Speisen", async () => {
    const restaurant2 = await getRestaurantBySlug("asia-wok-express");
    expect(restaurant2).not.toBeNull();
    expect(restaurant2?.id).toBe("rest_golden_wok_02");
    expect(restaurant2?.name).toBe("Golden Wok Asia Express");

    // Prüfe Kategorien
    const categoryNames = restaurant2?.categories.map((c) => c.name) || [];
    expect(categoryNames).toContain("Gebratene Wok-Nudeln");
    expect(categoryNames).toContain("Traditionelle Thai Currys");
    expect(categoryNames).not.toContain("Steinofen-Pizza");

    // Prüfe Artikel
    const itemNames = restaurant2?.items.map((i) => i.name) || [];
    expect(itemNames).toContain("Gebratene Eiernudeln mit knuspriger Ente");
    expect(itemNames).toContain("Vegetarische Mini-Frühlingsrollen (6 Stk.)");
    expect(itemNames).not.toContain("Pizza Margherita");
    expect(itemNames).not.toContain("Spaghetti alla Carbonara Autentica");
  });

  it("verhindert Datenlecks zwischen den Mandanten über filterItemsByTenant", () => {
    const allItems = [
      ...RESTAURANT_BELLA_NAPOLI.items,
      ...RESTAURANT_GOLDEN_WOK.items,
    ];
    const allCategories = [
      ...RESTAURANT_BELLA_NAPOLI.categories,
      ...RESTAURANT_GOLDEN_WOK.categories,
    ];

    // Filter für Bella Napoli
    const tenant1Data = filterItemsByTenant(
      allItems,
      allCategories,
      "rest_bella_napoli_01"
    );
    expect(tenant1Data.categories.every((c) => c.restaurantId === "rest_bella_napoli_01")).toBe(true);
    expect(tenant1Data.items.every((i) => i.categoryId.startsWith("cat_"))).toBe(true);
    expect(tenant1Data.items.some((i) => i.name.includes("Wok-Nudeln"))).toBe(false);

    // Filter für Golden Wok
    const tenant2Data = filterItemsByTenant(
      allItems,
      allCategories,
      "rest_golden_wok_02"
    );
    expect(tenant2Data.categories.every((c) => c.restaurantId === "rest_golden_wok_02")).toBe(true);
    expect(tenant2Data.items.some((i) => i.name.includes("Pizza"))).toBe(false);
  });

  it("prüft RLS-Regeln: Betreiber von Mandant 1 darf Mandant 2 nicht manipulieren", () => {
    interface SecurityContext {
      authenticatedUserId: string;
      assignedRestaurantId: string;
      role: "owner" | "guest";
    }

    // Betreiber von Bella Napoli
    const ownerContext: SecurityContext = {
      authenticatedUserId: "user_owner_01",
      assignedRestaurantId: "rest_bella_napoli_01",
      role: "owner",
    };

    // RLS Policy Simulation: UPDATE categories
    const canUpdateCategory = (categoryId: string, targetRestaurantId: string, ctx: SecurityContext) => {
      // Entspricht der RLS-Bedingung: USING (restaurant_id = get_auth_restaurant_id())
      return ctx.assignedRestaurantId === targetRestaurantId;
    };

    // Darf eigene Kategorie ändern:
    expect(canUpdateCategory("cat_bn_pizza", "rest_bella_napoli_01", ownerContext)).toBe(true);

    // Darf fremde Kategorie von Golden Wok NICHT ändern:
    expect(canUpdateCategory("cat_gw_nudeln", "rest_golden_wok_02", ownerContext)).toBe(false);
  });

  it("prüft RLS-Regeln: Gast darf nur eigene Bestellung mit Access Token einsehen", () => {
    const order1 = {
      id: "ord_100",
      restaurantId: "rest_bella_napoli_01",
      guestAccessToken: "token_abc_123",
    };

    const order2 = {
      id: "ord_200",
      restaurantId: "rest_bella_napoli_01",
      guestAccessToken: "token_xyz_999",
    };

    // Gast-Policy: USING (guest_access_token = header_token)
    const canGuestViewOrder = (order: typeof order1, providedHeaderToken: string) => {
      return order.guestAccessToken === providedHeaderToken;
    };

    // Gast mit eigenem Token sieht eigene Bestellung
    expect(canGuestViewOrder(order1, "token_abc_123")).toBe(true);

    // Gast mit eigenem Token sieht fremde Bestellung NICHT
    expect(canGuestViewOrder(order2, "token_abc_123")).toBe(false);
  });
});
