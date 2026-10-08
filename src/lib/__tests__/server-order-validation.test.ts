import { describe, it, expect } from "vitest";
import { RESTAURANT_BELLA_NAPOLI } from "../../data/restaurants";
import {
  validateAndCalculateOrder,
  ServerOrderRequest,
} from "../server/order-validator";
import { persistOrder } from "../server/orders-store";

describe("Meilenstein 3: Serverseitige Bestellvalidierung & Manipulationsschutz", () => {
  // Basis-Gültige Testzeit: Montag 18:00 Uhr (Restaurant hat 17:00-22:00 geöffnet)
  const validMondayEvening = new Date("2026-10-05T18:00:00");

  it("ignoriert manipulierte Client-Preise und berechnet den echten Preis ausschließlich aus der Datenbank", () => {
    const maliciousPayload: ServerOrderRequest = {
      restaurantId: RESTAURANT_BELLA_NAPOLI.id,
      orderType: "pickup",
      customer: {
        name: "Hacker Max",
        phone: "0171 1234567",
        email: "max@example.com",
      },
      desiredTime: { type: "asap" },
      paymentMethod: "cash",
      items: [
        {
          itemId: "item_pizza_margherita",
          sizeId: "size_standard", // In DB: 8,50 €
          extraIds: ["ext_bufala"], // In DB: 2,50 €
          quantity: 2,
          // Manipulationsversuch des Clients:
          clientSuppliedUnitPrice: 0.01,
          clientSuppliedTotal: 0.02,
        },
      ],
    };

    const result = validateAndCalculateOrder(
      maliciousPayload,
      RESTAURANT_BELLA_NAPOLI,
      validMondayEvening
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    // Erwartet: 2x (8,50 € + 2,50 €) = 2x 11,00 € = 22,00 €
    expect(result.verifiedOrder.calculation.subtotal).toBe(22.00);
    expect(result.verifiedOrder.calculation.total).toBe(22.00);
    expect(result.verifiedOrder.items[0].unitPrice).toBe(11.00);
    expect(result.verifiedOrder.items[0].totalPrice).toBe(22.00);

    // Manipulierte Preise (0,01 €) durften keinen Einfluss haben!
    expect(result.verifiedOrder.calculation.total).not.toBe(0.02);
  });

  it("lehnt nicht belieferte PLZ bei Lieferung sauber mit HTTP 400 ab", () => {
    const payload: ServerOrderRequest = {
      restaurantId: RESTAURANT_BELLA_NAPOLI.id,
      orderType: "delivery",
      customer: {
        name: "Fremder Gast",
        phone: "0171 9999999",
        email: "gast@berlin.de",
        street: "Alexanderplatz",
        houseNumber: "1",
        plz: "10178", // Berlin, Restaurant ist in Köln (50823)
        city: "Berlin",
      },
      desiredTime: { type: "asap" },
      paymentMethod: "cash",
      items: [
        {
          itemId: "item_pizza_margherita",
          quantity: 2,
        },
      ],
    };

    const result = validateAndCalculateOrder(
      payload,
      RESTAURANT_BELLA_NAPOLI,
      validMondayEvening
    );

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.statusCode).toBe(400);
    expect(result.errorCode).toBe("UNSUPPORTED_DELIVERY_ZONE");
    expect(result.errorMessage).toContain("10178");
  });

  it("lehnt Warenkorb unterhalb des Mindestbestellwerts für die PLZ sauber ab", () => {
    // 50823 hat Mindestbestellwert 15,00 €
    const payload: ServerOrderRequest = {
      restaurantId: RESTAURANT_BELLA_NAPOLI.id,
      orderType: "delivery",
      customer: {
        name: "Sparfuchs",
        phone: "0171 1234567",
        email: "spar@koeln.de",
        street: "Venloer Str.",
        houseNumber: "12",
        plz: "50823",
        city: "Köln",
      },
      desiredTime: { type: "asap" },
      paymentMethod: "cash",
      items: [
        {
          itemId: "item_cola_033", // 2,90 €
          quantity: 1,
        },
      ],
    };

    const result = validateAndCalculateOrder(
      payload,
      RESTAURANT_BELLA_NAPOLI,
      validMondayEvening
    );

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.statusCode).toBe(400);
    expect(result.errorCode).toBe("MIN_ORDER_NOT_MET");
    expect(result.errorMessage).toContain("Mindestbestellwert");
  });

  it("lehnt ausverkaufte Artikel sauber ab", () => {
    const payload: ServerOrderRequest = {
      restaurantId: RESTAURANT_BELLA_NAPOLI.id,
      orderType: "pickup",
      customer: {
        name: "Hungriger Kunde",
        phone: "0171 1234567",
        email: "kunde@koeln.de",
      },
      desiredTime: { type: "asap" },
      paymentMethod: "cash",
      items: [
        {
          itemId: "item_pizza_quattro_stagioni", // isSoldOut: true
          quantity: 1,
        },
      ],
    };

    const result = validateAndCalculateOrder(
      payload,
      RESTAURANT_BELLA_NAPOLI,
      validMondayEvening
    );

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.statusCode).toBe(400);
    expect(result.errorCode).toBe("ITEM_SOLD_OUT");
    expect(result.errorMessage).toContain("ausverkauft");
  });

  it("lehnt fehlende Pflicht-Extras (z.B. Dressing beim Salat) ab", () => {
    const payload: ServerOrderRequest = {
      restaurantId: RESTAURANT_BELLA_NAPOLI.id,
      orderType: "pickup",
      customer: {
        name: "Salatliebhaber",
        phone: "0171 1234567",
        email: "salat@koeln.de",
      },
      desiredTime: { type: "asap" },
      paymentMethod: "cash",
      items: [
        {
          itemId: "item_salat_mista", // Hat Pflichtgruppe "Dressing"
          extraIds: [], // Kein Dressing ausgewählt!
          quantity: 1,
        },
      ],
    };

    const result = validateAndCalculateOrder(
      payload,
      RESTAURANT_BELLA_NAPOLI,
      validMondayEvening
    );

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.statusCode).toBe(400);
    expect(result.errorCode).toBe("MISSING_REQUIRED_EXTRA");
    expect(result.errorMessage).toContain("Dressing");
  });

  it("lehnt Wunschzeiten außerhalb der Öffnungszeiten ab", () => {
    // Montagabend geöffnet bis 22:00 Uhr
    const payload: ServerOrderRequest = {
      restaurantId: RESTAURANT_BELLA_NAPOLI.id,
      orderType: "pickup",
      customer: {
        name: "Nachtschwärmer",
        phone: "0171 1234567",
        email: "nacht@koeln.de",
      },
      desiredTime: {
        type: "scheduled",
        timeSlot: "03:30 Uhr", // Mitten in der Nacht
      },
      paymentMethod: "cash",
      items: [
        {
          itemId: "item_pizza_margherita",
          quantity: 1,
        },
      ],
    };

    const result = validateAndCalculateOrder(
      payload,
      RESTAURANT_BELLA_NAPOLI,
      validMondayEvening
    );

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.statusCode).toBe(400);
    expect(result.errorCode).toBe("INVALID_DESIRED_TIME");
  });

  it("verhindert doppelte Bestellungen durch Idempotency-Schutz", async () => {
    const validOrder = {
      id: "ord_idempotent_test_1",
      restaurantId: RESTAURANT_BELLA_NAPOLI.id,
      orderNumber: "BN-99999",
      orderType: "pickup" as const,
      customer: {
        name: "Doppelklicker",
        phone: "0171 1234567",
        email: "click@test.de",
        street: "",
        houseNumber: "",
        plz: "",
        city: "Köln",
        comment: "",
      },
      desiredTime: { type: "asap" as const },
      paymentMethod: "cash" as const,
      items: [],
      calculation: {
        subtotal: 10,
        deliveryFee: 0,
        total: 10,
        vat7: 0.65,
        vat19: 0,
        foodNet: 9.35,
        drinkOrDeliveryNet: 0,
        isMinOrderReached: true,
        minOrderDelta: 0,
        minOrderRequired: 0,
      },
      status: "new" as const,
      createdAt: new Date().toISOString(),
    };

    const idempotencyKey = "key_unique_session_88492";

    // 1. Speichern
    const firstSave = await persistOrder(validOrder, idempotencyKey);
    expect(firstSave.id).toBe("ord_idempotent_test_1");

    // 2. Erneutes Absenden mit identischem Key aber neu erzeugtem Objekt
    const secondOrderAttempt = {
      ...validOrder,
      id: "ord_idempotent_test_2_duplicate",
    };
    const secondSave = await persistOrder(secondOrderAttempt, idempotencyKey);

    // Idempotenz garantiert: Es wird die bestehende Original-Bestellung zurückgegeben!
    expect(secondSave.id).toBe("ord_idempotent_test_1");
  });
});
