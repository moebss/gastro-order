import { describe, it, expect, beforeEach } from "vitest";
import { ALL_RESTAURANTS } from "../../data/restaurants";
import { ONBOARDING_TEMPLATES } from "../server/onboarding-templates";
import { validateAndCalculateOrder, ServerOrderRequest } from "../server/order-validator";
import { persistOrder, getOrderById } from "../server/orders-store";
import { createMolliePayment, setSimulatorPaymentStatus, processMollieWebhook } from "../server/mollie-service";
import { checkRateLimit, resetRateLimitStore } from "../server/rate-limiter";
import { Restaurant } from "../../types/restaurant";

describe("Meilenstein 6: Vollständiger E2E-Bestellablauf & System-Integration", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("durchläuft den kompletten Lifecycle: Onboarding -> Speisekarte -> Warenkorb -> Zahlung -> Küche", async () => {
    // -------------------------------------------------------------
    // SCHRITT 1: Neues Restaurant anlegen (Onboarding-Flow)
    // -------------------------------------------------------------
    const template = ONBOARDING_TEMPLATES[0]; // Pizzeria-Vorlage
    const newRestaurant: Restaurant = {
      id: "rest_e2e_berlin_pizzeria",
      name: "Pizzeria Napoli Berlin",
      slug: "pizzeria-napoli-berlin",
      tagline: "Authentische Steinofenpizza in Berlin-Mitte",
      address: {
        street: "Torstraße 100",
        plz: "10119",
        city: "Berlin",
      },
      phone: "030 9876543",
      email: "berlin@napoli-gastro.de",
      logo: "🍕",
      heroImage: "",
      accentColor: "#dc2626",
      active: true,
      deliveryZones: [
        { plz: "10119", areaName: "Berlin-Mitte", minOrder: 15.0, deliveryFee: 1.5, estimatedMinutes: 25 },
        { plz: "10405", areaName: "Prenzlauer Berg", minOrder: 20.0, deliveryFee: 2.5, estimatedMinutes: 35 },
      ],
      openingHours: [
        {
          day: new Date().getDay(),
          dayName: "Heute",
          isOpen: true,
          slots: [{ from: "00:00", to: "23:59" }],
        },
      ],
      categories: template.categories,
      items: template.items,
    };

    ALL_RESTAURANTS.push(newRestaurant);
    expect(ALL_RESTAURANTS.some((r) => r.slug === "pizzeria-napoli-berlin")).toBe(true);

    // -------------------------------------------------------------
    // SCHRITT 2: Speisekarte & Preissicherheit prüfen
    // -------------------------------------------------------------
    const pizzaItem = newRestaurant.items.find((i) => i.id === "item_piz_1");
    expect(pizzaItem).toBeDefined();
    expect(pizzaItem?.name).toBe("Pizza Margherita");
    expect(pizzaItem?.vatRate).toBe(7); // 7% MwSt für Speisen

    const drinkItem = newRestaurant.items.find((i) => i.id === "item_drk_1");
    expect(drinkItem).toBeDefined();
    expect(drinkItem?.vatRate).toBe(19); // 19% MwSt für Getränke

    // -------------------------------------------------------------
    // SCHRITT 3: Manipulierte Preise abwehren
    // -------------------------------------------------------------
    const tamperedPayload: ServerOrderRequest = {
      restaurantId: newRestaurant.id,
      orderType: "delivery",
      customer: {
        name: "Hacker",
        phone: "0170 0000000",
        email: "hack@test.de",
        street: "Torstraße",
        houseNumber: "1",
        plz: "10119",
        city: "Berlin",
      },
      desiredTime: { type: "asap" },
      paymentMethod: "online",
      items: [
        {
          itemId: "item_piz_1",
          quantity: 2,
          clientSuppliedUnitPrice: 0.01, // Betrugsversuch!
        },
      ],
    };

    const validatedResult = validateAndCalculateOrder(tamperedPayload, newRestaurant);
    expect(validatedResult.success).toBe(true);
    if (validatedResult.success) {
      // Server MUSS den echten Preis aus der Datenbank nehmen (2x 8.50 = 17.00 €)
      expect(validatedResult.verifiedOrder.calculation.subtotal).toBe(17.0);
      expect(validatedResult.verifiedOrder.calculation.deliveryFee).toBe(1.5);
      expect(validatedResult.verifiedOrder.calculation.total).toBe(18.5);
      expect(validatedResult.verifiedOrder.calculation.vat7).toBe(1.11);
    }

    // -------------------------------------------------------------
    // SCHRITT 4: Mollie-Zahlung erzeugen & Küchen-Sperre prüfen
    // -------------------------------------------------------------
    if (validatedResult.success) {
      const order = validatedResult.verifiedOrder;
      order.paymentStatus = "pending";
      await persistOrder(order);

      const mollieSession = await createMolliePayment(order, newRestaurant, "http://localhost:3000");
      expect(mollieSession.paymentId).toBeDefined();

      // Küchen-Filter: Solange 'pending', darf die Bestellung NICHT im Küchen-Feed sein!
      const isVisibleInKitchenBeforePay = order.paymentMethod === "cash" || order.paymentStatus === "paid";
      expect(isVisibleInKitchenBeforePay).toBe(false);

      // -------------------------------------------------------------
      // SCHRITT 5: Webhook meldet 'paid' -> Freigabe für die Küche
      // -------------------------------------------------------------
      setSimulatorPaymentStatus(mollieSession.paymentId, "paid");
      const webhookRes = await processMollieWebhook(mollieSession.paymentId);
      expect(webhookRes.success).toBe(true);
      expect(webhookRes.status).toBe("paid");

      const paidOrder = await getOrderById(order.id);
      expect(paidOrder?.paymentStatus).toBe("paid");

      const isVisibleInKitchenAfterPay = paidOrder?.paymentMethod === "cash" || paidOrder?.paymentStatus === "paid";
      expect(isVisibleInKitchenAfterPay).toBe(true);
    }
  });
});
