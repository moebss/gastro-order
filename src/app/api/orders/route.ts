import { NextRequest, NextResponse } from "next/server";
import { ALL_RESTAURANTS } from "../../../data/restaurants";
import { validateAndCalculateOrder, ServerOrderRequest } from "../../../lib/server/order-validator";
import { persistOrder, getOrderById } from "../../../lib/server/orders-store";
import { sendOrderConfirmationEmails } from "../../../lib/server/email-service";
import { createMolliePayment } from "../../../lib/server/mollie-service";
import { checkRateLimit } from "../../../lib/server/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    // Rate Limiting prüfen (Schutz gegen Bot-Spam & DoS)
    const rateLimitCheck = checkRateLimit(req, "order");
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          code: "TOO_MANY_REQUESTS",
          error: `Zu viele Bestellanfragen. Bitte warte ${rateLimitCheck.retryAfterSeconds} Sekunden vor einem erneuten Versuch.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitCheck.retryAfterSeconds || 60),
          },
        }
      );
    }

    const payload: ServerOrderRequest = await req.json();

    if (!payload.restaurantId) {
      return NextResponse.json(
        {
          success: false,
          code: "RESTAURANT_NOT_FOUND",
          error: "Keine restaurantId angegeben.",
        },
        { status: 400 }
      );
    }

    const restaurant = ALL_RESTAURANTS.find(
      (r) => r.id === payload.restaurantId || r.slug === payload.restaurantId
    );

    if (!restaurant) {
      return NextResponse.json(
        {
          success: false,
          code: "RESTAURANT_NOT_FOUND",
          error: `Das Restaurant mit ID „${payload.restaurantId}“ wurde nicht gefunden.`,
        },
        { status: 404 }
      );
    }

    // Serverseitige strikte Preisberechnung und Validierung
    const validationResult = validateAndCalculateOrder(payload, restaurant);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          code: validationResult.errorCode,
          error: validationResult.errorMessage,
        },
        { status: validationResult.statusCode }
      );
    }

    const verifiedOrder = validationResult.verifiedOrder;

    // Basis-URL der aktuellen Anfrage ermitteln
    const origin = req.headers.get("origin") || req.nextUrl.origin || "http://localhost:3000";

    let checkoutUrl: string | undefined = undefined;

    if (payload.paymentMethod === "online") {
      verifiedOrder.paymentStatus = "pending";
      // Erst nach bezahltem Webhook in der Küche anzeigen
      const savedOrder = await persistOrder(verifiedOrder, payload.idempotencyKey);

      // Mollie-Zahlung anlegen
      const mollieSession = await createMolliePayment(savedOrder, restaurant, origin);
      checkoutUrl = mollieSession.checkoutUrl;

      return NextResponse.json(
        {
          success: true,
          order: savedOrder,
          checkoutUrl,
        },
        { status: 201 }
      );
    } else {
      // Barzahlung: Bestellung sofort aktiv in der Küche
      verifiedOrder.paymentStatus = "pending";
      const savedOrder = await persistOrder(verifiedOrder, payload.idempotencyKey);

      // Bestätigungs-E-Mail versenden
      sendOrderConfirmationEmails(savedOrder, restaurant).catch((err) => {
        console.warn("Fehler beim E-Mail-Versand:", err);
      });

      return NextResponse.json(
        {
          success: true,
          order: savedOrder,
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    console.error("API Orders POST Fehler:", error);
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        error: "Ein interner Serverfehler ist aufgetreten. Bitte versuche es erneut.",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Bestell-ID erforderlich." },
      { status: 400 }
    );
  }

  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json(
      { success: false, error: "Bestellung nicht gefunden." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, order });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, switchPaymentMethod } = body;

    if (!orderId || switchPaymentMethod !== "cash") {
      return NextResponse.json(
        { success: false, error: "Ungültige Parameter für Zahlungsarten-Wechsel." },
        { status: 400 }
      );
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Bestellung nicht gefunden." },
        { status: 404 }
      );
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json(
        { success: false, error: "Bereits bezahlte Bestellungen können nicht geändert werden." },
        { status: 400 }
      );
    }

    order.paymentMethod = "cash";
    order.paymentStatus = "pending";
    order.status = "new";
    await persistOrder(order);

    const restaurant = ALL_RESTAURANTS.find((r) => r.id === order.restaurantId);
    if (restaurant) {
      sendOrderConfirmationEmails(order, restaurant).catch((err) => {
        console.warn("Fehler beim E-Mail-Versand:", err);
      });
    }

    return NextResponse.json({ success: true, order });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
