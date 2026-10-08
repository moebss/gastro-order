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
  ];

  demoOrders.forEach((o) => persistOrder(o));
}

export async function GET(req: NextRequest) {
  seedInitialAdminOrders();

  const { searchParams } = new URL(req.url);
  const restaurantId = searchParams.get("restaurantId") || "rest_bella_napoli_01";

  const allOrders = await getOrdersForRestaurant(restaurantId);
  // Erst nach bestätigter Zahlung (oder bei Barzahlung) erscheint die Bestellung in der Küche
  const visibleOrders = allOrders.filter(
    (o) => o.paymentMethod === "cash" || o.paymentStatus === "paid"
  );
  return NextResponse.json({ success: true, orders: visibleOrders });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, newStatus, restaurantId } = body;

    if (!orderId || !newStatus || !restaurantId) {
      return NextResponse.json(
        { success: false, error: "Fehlende Parameter (orderId, newStatus, restaurantId)." },
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

    return NextResponse.json({ success: true, order });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
