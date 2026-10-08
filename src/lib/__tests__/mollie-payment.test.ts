import { describe, it, expect, beforeEach } from "vitest";
import {
  createMolliePayment,
  getMolliePayment,
  setSimulatorPaymentStatus,
  processMollieWebhook,
} from "../server/mollie-service";
import { persistOrder, getOrderById } from "../server/orders-store";
import { RESTAURANT_BELLA_NAPOLI } from "../../data/restaurants";
import { Order } from "../../types/restaurant";

describe("Meilenstein 5: Online-Zahlung mit Mollie & Idempotente Webhooks", () => {
  const sampleOrder: Order = {
    id: "ord_mollie_test_01",
    restaurantId: RESTAURANT_BELLA_NAPOLI.id,
    orderNumber: "BN-99001",
    orderType: "delivery",
    customer: {
      name: "Sabine Musterfrau",
      phone: "0170 5544332",
      email: "sabine@musterfrau.de",
      street: "Venloer Str.",
      houseNumber: "20",
      plz: "50823",
      city: "Köln",
    },
    desiredTime: { type: "asap" },
    paymentMethod: "online",
    paymentStatus: "pending",
    items: [
      {
        cartLineId: "line_1",
        itemId: "item_pizza_margherita",
        number: "10",
        name: "Pizza Margherita",
        selectedSize: { id: "size_standard", name: "Klassik Ø 28 cm", price: 8.5 },
        selectedExtras: [],
        unitPrice: 8.5,
        quantity: 2,
        vatRate: 7,
        totalPrice: 17.0,
      },
    ],
    calculation: {
      subtotal: 17.0,
      deliveryFee: 1.5,
      total: 18.5,
      vat7: 1.11,
      vat19: 0.24,
      foodNet: 15.89,
      drinkOrDeliveryNet: 1.26,
      isMinOrderReached: true,
      minOrderDelta: 0,
      minOrderRequired: 15.0,
    },
    status: "new",
    createdAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    // Frische Test-Bestellung speichern
    await persistOrder({ ...sampleOrder });
  });

  it("erstellt eine Mollie-Zahlungssitzung mit exaktem Euro-Betrag und Metadaten", async () => {
    const order = await getOrderById(sampleOrder.id);
    expect(order).toBeDefined();

    const session = await createMolliePayment(
      order!,
      RESTAURANT_BELLA_NAPOLI,
      "http://localhost:3000"
    );

    expect(session.paymentId).toMatch(/^tr_test_/);
    expect(session.checkoutUrl).toContain(session.paymentId);

    const paymentData = await getMolliePayment(session.paymentId);
    expect(paymentData).not.toBeNull();
    expect(paymentData?.amount.value).toBe("18.50");
    expect(paymentData?.amount.currency).toBe("EUR");
    expect(paymentData?.metadata.orderId).toBe(sampleOrder.id);
    expect(paymentData?.metadata.restaurantId).toBe(RESTAURANT_BELLA_NAPOLI.id);
    expect(paymentData?.status).toBe("open");
  });

  it("verarbeitet erfolgreiche Zahlung (paid) und schaltet Bestellung für die Küche frei", async () => {
    const order = await getOrderById(sampleOrder.id);
    const session = await createMolliePayment(
      order!,
      RESTAURANT_BELLA_NAPOLI,
      "http://localhost:3000"
    );

    // Status im Simulator auf 'paid' setzen
    setSimulatorPaymentStatus(session.paymentId, "paid");

    // Webhook verarbeiten
    const webhookResult = await processMollieWebhook(session.paymentId);
    expect(webhookResult.success).toBe(true);
    expect(webhookResult.status).toBe("paid");
    expect(webhookResult.isDuplicate).toBe(false);

    // Bestellung prüfen: paymentStatus muss 'paid' sein
    const updatedOrder = await getOrderById(sampleOrder.id);
    expect(updatedOrder?.paymentStatus).toBe("paid");
  });

  it("ist idempotent: wiederholte Webhook-Aufrufe erzeugen keine Duplikate", async () => {
    const order = await getOrderById(sampleOrder.id);
    const session = await createMolliePayment(
      order!,
      RESTAURANT_BELLA_NAPOLI,
      "http://localhost:3000"
    );

    setSimulatorPaymentStatus(session.paymentId, "paid");

    // Erster Webhook-Aufruf
    const firstCall = await processMollieWebhook(session.paymentId);
    expect(firstCall.isDuplicate).toBe(false);

    // Zweiter (doppelter) Webhook-Aufruf von Mollie
    const secondCall = await processMollieWebhook(session.paymentId);
    expect(secondCall.success).toBe(true);
    expect(secondCall.isDuplicate).toBe(true);
  });

  it("behandelt abgebrochene oder fehlgeschlagene Zahlungen korrekt", async () => {
    const cancelOrder: Order = {
      ...sampleOrder,
      id: "ord_mollie_cancel_02",
      orderNumber: "BN-99002",
    };
    await persistOrder(cancelOrder);

    const session = await createMolliePayment(
      cancelOrder,
      RESTAURANT_BELLA_NAPOLI,
      "http://localhost:3000"
    );

    // Gast bricht im Mollie-Fenster ab
    setSimulatorPaymentStatus(session.paymentId, "canceled");
    const result = await processMollieWebhook(session.paymentId);
    expect(result.status).toBe("canceled");

    const orderAfterCancel = await getOrderById(cancelOrder.id);
    expect(orderAfterCancel?.paymentStatus).toBe("canceled");
  });

  it("stellt sicher, dass unbezahlte Online-Bestellungen in der Küche ausgeblendet bleiben", async () => {
    const unpaidOrder: Order = {
      ...sampleOrder,
      id: "ord_unpaid_kitchen_check",
      paymentMethod: "online",
      paymentStatus: "pending",
    };
    await persistOrder(unpaidOrder);

    // Filter-Logik der Küche
    const isVisibleInKitchen = (o: Order) =>
      o.paymentMethod === "cash" || o.paymentStatus === "paid";

    // 1. Solange Zahlung 'pending' ist -> NICHT sichtbar für die Küche
    expect(isVisibleInKitchen(unpaidOrder)).toBe(false);

    // 2. Barzahlung ist SOFORT sichtbar für die Küche
    const cashOrder: Order = {
      ...sampleOrder,
      id: "ord_cash_kitchen_check",
      paymentMethod: "cash",
      paymentStatus: "pending",
    };
    expect(isVisibleInKitchen(cashOrder)).toBe(true);

    // 3. Nach erfolgreicher Zahlung wird die Online-Bestellung sichtbar
    unpaidOrder.paymentStatus = "paid";
    expect(isVisibleInKitchen(unpaidOrder)).toBe(true);
  });
});
