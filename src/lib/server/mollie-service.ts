import { Order, Restaurant } from "../../types/restaurant";
import { getOrderById, persistOrder } from "./orders-store";
import { sendOrderConfirmationEmails } from "./email-service";

export type MolliePaymentStatus =
  | "open"
  | "canceled"
  | "pending"
  | "expired"
  | "failed"
  | "paid";

export interface MolliePaymentData {
  id: string;
  status: MolliePaymentStatus;
  amount: {
    currency: "EUR";
    value: string;
  };
  description: string;
  redirectUrl: string;
  webhookUrl: string;
  metadata: {
    orderId: string;
    restaurantId: string;
  };
  createdAt: string;
  paidAt?: string;
  canceledAt?: string;
  failedAt?: string;
}

// In-Memory Speicher für Simulator-Zahlungen & Webhook-Idempotenz
const mollieSimulatorStore = new Map<string, MolliePaymentData>();
const processedWebhooks = new Set<string>();

/**
 * Erstellt eine Mollie-Zahlungssitzung (Live oder Sandbox-Simulator)
 */
export async function createMolliePayment(
  order: Order,
  restaurant: Restaurant,
  baseUrl: string
): Promise<{ paymentId: string; checkoutUrl: string }> {
  const mollieApiKey = restaurant.mollieApiKey || process.env.MOLLIE_API_KEY;
  const formattedAmount = order.calculation.total.toFixed(2);
  const redirectUrl = `${baseUrl}/order/status?orderId=${order.id}&token=${order.guestAccessToken || ""}`;
  const webhookUrl = `${baseUrl}/api/webhooks/mollie`;

  // 1. Wenn ein echter Mollie API Key (test_... oder live_...) vorhanden ist:
  if (mollieApiKey) {
    try {
      const res = await fetch("https://api.mollie.com/v2/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${mollieApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: {
            currency: "EUR",
            value: formattedAmount,
          },
          description: `Bestellung #${order.orderNumber} - ${restaurant.name}`,
          redirectUrl,
          webhookUrl,
          metadata: {
            orderId: order.id,
            restaurantId: restaurant.id,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data._links?.checkout?.href) {
        order.molliePaymentId = data.id;
        order.mollieCheckoutUrl = data._links.checkout.href;
        order.paymentStatus = "pending";
        await persistOrder(order);

        return {
          paymentId: data.id,
          checkoutUrl: data._links.checkout.href,
        };
      } else {
        console.warn("Mollie API Fehler:", data);
      }
    } catch (e) {
      console.warn("Mollie API Verbindungsfehler, nutze Sandbox-Simulator:", e);
    }
  }

  // 2. Sandbox-Simulator (für lokale Entwicklung ohne ngrok-Tunnel & Tests):
  const mockPaymentId = `tr_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const mockCheckoutUrl = `${baseUrl}/order/mollie-simulator?paymentId=${mockPaymentId}`;

  const paymentData: MolliePaymentData = {
    id: mockPaymentId,
    status: "open",
    amount: { currency: "EUR", value: formattedAmount },
    description: `Bestellung #${order.orderNumber} - ${restaurant.name}`,
    redirectUrl,
    webhookUrl,
    metadata: {
      orderId: order.id,
      restaurantId: restaurant.id,
    },
    createdAt: new Date().toISOString(),
  };

  mollieSimulatorStore.set(mockPaymentId, paymentData);

  order.molliePaymentId = mockPaymentId;
  order.mollieCheckoutUrl = mockCheckoutUrl;
  order.paymentStatus = "pending";
  await persistOrder(order);

  return {
    paymentId: mockPaymentId,
    checkoutUrl: mockCheckoutUrl,
  };
}

/**
 * Fragt den Status einer Mollie-Zahlung ab
 */
export async function getMolliePayment(
  paymentId: string
): Promise<MolliePaymentData | null> {
  const mollieApiKey = process.env.MOLLIE_API_KEY;

  if (mollieApiKey && !paymentId.startsWith("tr_test_")) {
    try {
      const res = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${mollieApiKey}` },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Fehler beim Abruf der Mollie-Zahlung:", e);
    }
  }

  return mollieSimulatorStore.get(paymentId) || null;
}

/**
 * Simuliert oder aktualisiert den Status im Sandbox-Store (für Tests & UI-Simulation)
 */
export function setSimulatorPaymentStatus(
  paymentId: string,
  newStatus: MolliePaymentStatus
): MolliePaymentData | null {
  const payment = mollieSimulatorStore.get(paymentId);
  if (!payment) return null;

  payment.status = newStatus;
  if (newStatus === "paid") payment.paidAt = new Date().toISOString();
  if (newStatus === "canceled") payment.canceledAt = new Date().toISOString();
  if (newStatus === "failed") payment.failedAt = new Date().toISOString();

  mollieSimulatorStore.set(paymentId, payment);
  return payment;
}

/**
 * Verarbeitet den Mollie-Webhook idempotent
 */
export async function processMollieWebhook(paymentId: string): Promise<{
  success: boolean;
  orderId?: string;
  status: MolliePaymentStatus;
  isDuplicate: boolean;
}> {
  const payment = await getMolliePayment(paymentId);
  if (!payment) {
    throw new Error(`Zahlung mit ID ${paymentId} nicht gefunden.`);
  }

  const orderId = payment.metadata?.orderId;
  if (!orderId) {
    throw new Error("Keine orderId in Zahlungs-Metadaten gefunden.");
  }

  const order = await getOrderById(orderId);
  if (!order) {
    throw new Error(`Bestellung #${orderId} nicht gefunden.`);
  }

  // Idempotenz-Schutz: Wenn dieser Webhook für diese Zahlung bereits auf 'paid' verarbeitet wurde
  const idempotencyWebhookKey = `${paymentId}_${payment.status}`;
  if (processedWebhooks.has(idempotencyWebhookKey)) {
    return {
      success: true,
      orderId,
      status: payment.status,
      isDuplicate: true,
    };
  }

  // Statusverarbeitung
  if (payment.status === "paid") {
    const wasPending = order.paymentStatus !== "paid";
    order.paymentStatus = "paid";
    order.status = "new"; // Erst jetzt erscheint die Bestellung aktiv in der Küche!
    await persistOrder(order);

    if (wasPending) {
      processedWebhooks.add(idempotencyWebhookKey);
      // E-Mails versenden (Bestätigung an Gast und Restaurant)
      const restaurant = (await import("../../data/restaurants")).ALL_RESTAURANTS.find(
        (r) => r.id === order.restaurantId
      );
      if (restaurant) {
        sendOrderConfirmationEmails(order, restaurant).catch((e) =>
          console.warn("E-Mail Fehler nach Webhook:", e)
        );
      }
    }
  } else if (
    payment.status === "canceled" ||
    payment.status === "failed" ||
    payment.status === "expired"
  ) {
    order.paymentStatus = payment.status === "canceled" ? "canceled" : "failed";
    await persistOrder(order);
    processedWebhooks.add(idempotencyWebhookKey);
  }

  return {
    success: true,
    orderId,
    status: payment.status,
    isDuplicate: false,
  };
}
