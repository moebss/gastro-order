import { describe, it, expect } from "vitest";
import { canTransitionStatus, OrderStatus } from "../server/order-status-machine";
import { RESTAURANT_BELLA_NAPOLI } from "../../data/restaurants";
import { validateAndCalculateOrder, ServerOrderRequest } from "../server/order-validator";

describe("Meilenstein 4: Admin-Bereich & Statusübergänge", () => {
  it("erlaubt betriebswirtschaftlich sinnvolle Statusfolgen", () => {
    // 1. Neu -> In Zubereitung
    expect(canTransitionStatus("new", "preparing", "delivery").allowed).toBe(true);

    // 2. In Zubereitung -> Unterwegs (bei Lieferung)
    expect(canTransitionStatus("preparing", "delivering", "delivery").allowed).toBe(true);

    // 3. In Zubereitung -> Abholbereit (bei Abholung)
    expect(canTransitionStatus("preparing", "ready", "pickup").allowed).toBe(true);

    // 4. Unterwegs -> Abgeschlossen
    expect(canTransitionStatus("delivering", "completed", "delivery").allowed).toBe(true);
  });

  it("verhindert unlogische Statussprünge", () => {
    // Neu darf nicht direkt 'abgeschlossen' sein (muss erst zubereitet werden)
    const directComplete = canTransitionStatus("new", "completed", "delivery");
    expect(directComplete.allowed).toBe(false);
    expect(directComplete.reason).toContain("Ungültiger Statusübergang");

    // Abholbestellung kann nicht 'Unterwegs' sein
    const pickupDelivering = canTransitionStatus("preparing", "delivering", "pickup");
    expect(pickupDelivering.allowed).toBe(false);
    expect(pickupDelivering.reason).toContain("Abholbestellung");

    // Abgeschlossene Bestellung kann nicht nachträglich geändert werden
    const completedToCancelled = canTransitionStatus("completed", "cancelled", "delivery");
    expect(completedToCancelled.allowed).toBe(false);
  });

  it("stellt sicher, dass 1-Klick-Ausverkauft-Status die Speisekarte sofort schützt", () => {
    // Wir klonen das Restaurant für den Test
    const testRestaurant = JSON.parse(JSON.stringify(RESTAURANT_BELLA_NAPOLI));
    const targetItem = testRestaurant.items.find((i: any) => i.id === "item_pizza_margherita");
    expect(targetItem.isSoldOut).toBe(false);

    // Admin schaltet Pizza Margherita auf 'ausverkauft'
    targetItem.isSoldOut = true;

    // Gast versucht nun Pizza Margherita zu bestellen
    const orderAttempt: ServerOrderRequest = {
      restaurantId: testRestaurant.id,
      orderType: "pickup",
      customer: { name: "Gast", phone: "0171 1234567", email: "gast@test.de" },
      desiredTime: { type: "asap" },
      paymentMethod: "cash",
      items: [{ itemId: "item_pizza_margherita", quantity: 1 }],
    };

    const result = validateAndCalculateOrder(orderAttempt, testRestaurant);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe("ITEM_SOLD_OUT");
      expect(result.errorMessage).toContain("ausverkauft");
    }
  });

  it("stellt sicher, dass Preisänderungen im Admin sofort greifen", () => {
    const testRestaurant = JSON.parse(JSON.stringify(RESTAURANT_BELLA_NAPOLI));
    const targetItem = testRestaurant.items.find((i: any) => i.id === "item_pasta_carbonara");
    expect(targetItem.basePrice).toBe(12.50);

    // Admin erhöht Preis auf 13.50 €
    targetItem.basePrice = 13.50;

    const orderAttempt: ServerOrderRequest = {
      restaurantId: testRestaurant.id,
      orderType: "pickup",
      customer: { name: "Gast", phone: "0171 1234567", email: "gast@test.de" },
      desiredTime: { type: "asap" },
      paymentMethod: "cash",
      items: [{ itemId: "item_pasta_carbonara", quantity: 1 }],
    };

    const result = validateAndCalculateOrder(orderAttempt, testRestaurant);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.verifiedOrder.calculation.subtotal).toBe(13.50);
      expect(result.verifiedOrder.calculation.total).toBe(13.50);
    }
  });
});
