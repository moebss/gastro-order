import { NextRequest, NextResponse } from "next/server";
import {
  getOrdersForRestaurant,
  getOrderById,
  persistOrder,
} from "../../../../lib/server/orders-store";
import {
  canTransitionStatus,
  OrderStatus,
} from "../../../../lib/server/order-status-machine";
import { ALL_RESTAURANTS } from "../../../../data/restaurants";
import { Order } from "../../../../types/restaurant";
import { getAdminSession } from "@/lib/server/auth-session";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/client";

// Vorbelegte Demo-Bestellungen für den Admin-Bereich
let seededAdminOrders = false;
function seedInitialAdminOrders() {
  if (seededAdminOrders) return;
  seededAdminOrders = true;

  const now = Date.now();
  const demoOrders: Order[] = [
    {
      id: "ord_demo_01",
      restaurantId: "rest_bella_napoli_01",
      orderNumber: "BN-48201",
      orderType: "delivery",
      customer: {
        name: "Julia Becker",
        phone: "0172 8847192",
        email: "julia.becker@koeln.de",
        street: "Subbelrather Str.",
        houseNumber: "15a",
        plz: "50823",
        city: "Köln",
        comment: "Bitte 2. OG klingeln, danke!",
      },
      desiredTime: { type: "asap" },
      paymentMethod: "cash",
      items: [
        {
          cartLineId: "l1",
          itemId: "item_pizza_margherita",
          number: "10",
          name: "Pizza Margherita",
          selectedSize: { id: "size_standard", name: "Klassik Ø 28 cm", price: 8.5 },
          selectedExtras: [
            { id: "ext_bufala", groupId: "g1", groupName: "Käse", name: "Büffelmozzarella D.O.P.", price: 2.5 },
          ],
          unitPrice: 11.0,
          quantity: 2,
          vatRate: 7,
          totalPrice: 22.0,
        },
        {
          cartLineId: "l2",
          itemId: "item_cola_033",
          number: "70",
          name: "Coca-Cola 0,33l",
          selectedExtras: [],
          unitPrice: 2.9,
          quantity: 2,
          vatRate: 19,
          totalPrice: 5.8,
        },
      ],
      calculation: {
        subtotal: 27.8,
        deliveryFee: 1.5,
        total: 29.3,
        vat7: 1.44,
        vat19: 1.17,
        foodNet: 20.56,
        drinkOrDeliveryNet: 6.13,
        isMinOrderReached: true,
        minOrderDelta: 0,
        minOrderRequired: 15.0,
      },
      status: "new",
      createdAt: new Date(now - 3 * 60000).toISOString(),
    },
    {
      id: "ord_demo_02",
      restaurantId: "rest_bella_napoli_01",
      orderNumber: "BN-48195",
      orderType: "pickup",
      customer: {
        name: "Marco Rossi",
        phone: "0151 4433221",
        email: "marco@rossi.de",
        street: "",
        houseNumber: "",
        plz: "",
        city: "Köln",
        comment: "Ich hole in 15 Min. ab.",
      },
      desiredTime: { type: "scheduled", timeSlot: "19:45 Uhr" },
      paymentMethod: "cash",
      items: [
        {
          cartLineId: "l3",
          itemId: "item_pasta_carbonara",
          number: "31",
          name: "Spaghetti alla Carbonara Autentica",
          selectedSize: { id: "size_portion_gross", name: "Große Portion (+30% Pasta)", price: 15.5 },
          selectedExtras: [],
          unitPrice: 15.5,
          quantity: 1,
          vatRate: 7,
          totalPrice: 15.5,
        },
      ],
      calculation: {
        subtotal: 15.5,
        deliveryFee: 0,
        total: 15.5,
        vat7: 1.01,
        vat19: 0,
        foodNet: 14.49,
        drinkOrDeliveryNet: 0,
        isMinOrderReached: true,
        minOrderDelta: 0,
        minOrderRequired: 0,
      },
      status: "preparing",
      createdAt: new Date(now - 14 * 60000).toISOString(),
    },
    {
      id: "ord_demo_03",
      restaurantId: "rest_golden_wok_02",
      orderNumber: "GW-10940",
      orderType: "delivery",
      customer: {
        name: "Stefan Meyer",
        phone: "0160 1122334",
        email: "stefan@meyer.de",
        street: "Birkenstr.",
        houseNumber: "45",
        plz: "40233",
        city: "Düsseldorf",
        comment: "",
      },
      desiredTime: { type: "asap" },
      paymentMethod: "cash",
      items: [
        {
          cartLineId: "w1",
          itemId: "item_gw_n1",
          number: "W12",
          name: "Gebratene Eiernudeln mit knuspriger Ente",
          selectedExtras: [],
          unitPrice: 13.9,
          quantity: 1,
          vatRate: 7,
          totalPrice: 13.9,
        },
      ],
      calculation: {
        subtotal: 13.9,
        deliveryFee: 1.0,
        total: 14.9,
        vat7: 0.91,
        vat19: 0.16,
        foodNet: 12.99,
        drinkOrDeliveryNet: 0.84,
        isMinOrderReached: true,
        minOrderDelta: 0,
        minOrderRequired: 12.0,
      },
      status: "new",
      createdAt: new Date(now - 5 * 60000).toISOString(),
    },
    {
      id: "ord_demo_napoli_01",
      restaurantId: "rest_napoli_horrem_03",
      orderNumber: "NAP-8120",
      orderType: "delivery",
      customer: {
        name: "Thomas Schmitz",
        phone: "0176 99887766",
        email: "thomas.schmitz@horrem.de",
        street: "Rathausstraße",
        houseNumber: "14",
        plz: "50169",
        city: "Kerpen-Horrem",
        comment: "Bitte im Erdgeschoss klingeln, danke!",
      },
      desiredTime: { type: "asap" },
      paymentMethod: "online",
      items: [
        {
          cartLineId: "np1",
          itemId: "item_nh_diavola",
          number: "02",
          name: "Pizza Diavola (Pikant)",
          selectedSize: { id: "size_nh_d_norm", name: "Normal Ø 28cm", price: 11.0 },
          selectedExtras: [
            { id: "ext_nh_cheese", groupId: "grp_nh_pizza_extra", groupName: "Extras", name: "Extra Mozzarella", price: 1.5 },
          ],
          unitPrice: 12.5,
          quantity: 1,
          vatRate: 7,
          totalPrice: 12.5,
        },
        {
          cartLineId: "np2",
          itemId: "item_nh_broetchen_butter",
          number: "30",
          name: "Pizzabrötchen mit Kräuterbutter (8 Stk.)",
          selectedExtras: [],
          unitPrice: 4.5,
          quantity: 1,
          vatRate: 7,
          totalPrice: 4.5,
        },
        {
          cartLineId: "np3",
          itemId: "item_nh_cola",
          number: "60",
          name: "Coca-Cola 0,33l (Dose)",
          selectedExtras: [],
          unitPrice: 2.5,
          quantity: 2,
          vatRate: 19,
          totalPrice: 5.0,
        },
      ],
      calculation: {
        subtotal: 22.0,
        deliveryFee: 1.5,
        total: 23.5,
        vat7: 1.11,
        vat19: 1.04,
        foodNet: 15.89,
        drinkOrDeliveryNet: 5.46,
        isMinOrderReached: true,
        minOrderDelta: 0,
        minOrderRequired: 15.0,
      },
      status: "new",
      createdAt: new Date(now - 2 * 60000).toISOString(),
    },
    {
      id: "ord_demo_napoli_02",
      restaurantId: "rest_napoli_horrem_03",
      orderNumber: "NAP-8119",
      orderType: "pickup",
      customer: {
        name: "Sarah Keller",
        phone: "0152 33445566",
        email: "sarah.keller@gmx.de",
        street: "Hauptstraße 181",
        houseNumber: "",
        plz: "50169",
        city: "Kerpen-Horrem",
        comment: "Hole ich in 20 Minuten ab.",
      },
      desiredTime: { type: "asap" },
      paymentMethod: "cash",
      items: [
        {
          cartLineId: "np4",
          itemId: "item_nh_rigatoni_forno",
          number: "20",
          name: "Rigatoni Napoli al Forno",
          selectedExtras: [],
          unitPrice: 10.5,
          quantity: 1,
          vatRate: 7,
          totalPrice: 10.5,
        },
        {
          cartLineId: "np5",
          itemId: "item_nh_tiramisu",
          number: "50",
          name: "Hausgemachtes Tiramisu Classico",
          selectedExtras: [],
          unitPrice: 5.5,
          quantity: 1,
          vatRate: 7,
          totalPrice: 5.5,
        },
      ],
      calculation: {
        subtotal: 16.0,
        deliveryFee: 0,
        total: 16.0,
        vat7: 1.05,
        vat19: 0,
        foodNet: 14.95,
        drinkOrDeliveryNet: 0,
        isMinOrderReached: true,
        minOrderDelta: 0,
        minOrderRequired: 0,
      },
      status: "preparing",
      createdAt: new Date(now - 12 * 60000).toISOString(),
    },
  ];

  demoOrders.forEach((o) => persistOrder(o));
}

export async function GET(req: NextRequest) {
  seedInitialAdminOrders();

  const session = getAdminSession(req);
  const { searchParams } = new URL(req.url);
  const requestedRestaurantId = searchParams.get("restaurantId") || (session?.restaurantId !== "all" ? session?.restaurantId : undefined) || "rest_bella_napoli_01";

  // Mandantenschutz: Ein angemeldeter Inhaber darf ausschließlich sein Restaurant sehen
  if (session && !session.isPlatformAdmin && session.restaurantId !== requestedRestaurantId) {
    return NextResponse.json(
      { success: false, error: "Zugriff verweigert: Unzulässige Restaurant-ID für diesen Benutzer." },
      { status: 403 }
    );
  }

  const allOrders = await getOrdersForRestaurant(requestedRestaurantId);
  // Erst nach bestätigter Zahlung (oder bei Barzahlung) erscheint die Bestellung in der Küche
  const visibleOrders = allOrders.filter(
    (o) => o.paymentMethod === "cash" || o.paymentStatus === "paid"
  );
  return NextResponse.json({ success: true, orders: visibleOrders });
}

export async function PATCH(req: NextRequest) {
  try {
    const session = getAdminSession(req);
    const body = await req.json();
    const { orderId, newStatus, restaurantId } = body;

    if (!orderId || !newStatus || !restaurantId) {
      return NextResponse.json(
        { success: false, error: "Fehlende Parameter (orderId, newStatus, restaurantId)." },
        { status: 400 }
      );
    }

    // Session-Berechtigung prüfen falls angemeldet
    if (session && !session.isPlatformAdmin && session.restaurantId !== restaurantId) {
      return NextResponse.json(
        { success: false, error: "Zugriff verweigert: Du darfst nur dein eigenes Restaurant verwalten." },
        { status: 403 }
      );
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Bestellung nicht gefunden." },
        { status: 404 }
      );
    }

    // Mandantentrennung: Betreiber darf nur eigene Bestellungen ändern
    if (order.restaurantId !== restaurantId) {
      return NextResponse.json(
        { success: false, error: "Zugriff verweigert: Diese Bestellung gehört zu einem anderen Restaurant." },
        { status: 403 }
      );
    }

    // Statuswechsel validieren
    const transitionCheck = canTransitionStatus(
      order.status as OrderStatus,
      newStatus as OrderStatus,
      order.orderType
    );

    if (!transitionCheck.allowed) {
      return NextResponse.json(
        { success: false, error: transitionCheck.reason },
        { status: 400 }
      );
    }

    // Status aktualisieren
    order.status = newStatus;
    await persistOrder(order);

    // In Supabase PostgreSQL spiegeln
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        await supabaseAdmin
          .from("orders")
          .update({ status: newStatus })
          .eq("id", orderId);
      } catch (dbErr) {
        console.warn("Supabase order status sync warning:", dbErr);
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
