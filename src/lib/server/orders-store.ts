import { Order } from "../../types/restaurant";
import { supabase, isSupabaseConfigured } from "../supabase/client";

// Globaler In-Memory Cache für Serverless/Dev & Idempotenz
const ordersMemoryStore = new Map<string, Order>();
const idempotencyStore = new Map<string, { orderId: string; timestamp: number }>();

/**
 * Speichert eine verifizierte Bestellung persistent ab
 */
export async function persistOrder(
  order: Order,
  idempotencyKey?: string
): Promise<Order> {
  // Idempotenz prüfen: Existiert bereits eine Bestellung für diesen Key?
  if (idempotencyKey) {
    const existing = idempotencyStore.get(idempotencyKey);
    if (existing) {
      const existingOrder = ordersMemoryStore.get(existing.orderId);
      if (existingOrder) {
        return existingOrder;
      }
    }
  }

  // Im Memory-Store sichern
  ordersMemoryStore.set(order.id, order);

  if (idempotencyKey) {
    idempotencyStore.set(idempotencyKey, {
      orderId: order.id,
      timestamp: Date.now(),
    });
  }

  // Falls Supabase konfiguriert ist, in PostgreSQL persistieren
  if (isSupabaseConfigured && supabase) {
    try {
      const { error: orderError } = await supabase.from("orders").insert({
        id: order.id,
        restaurant_id: order.restaurantId,
        order_number: order.orderNumber,
        order_type: order.orderType,
        status: order.status,
        customer_data: order.customer,
        desired_time: order.desiredTime,
        payment_method: order.paymentMethod,
        payment_status: order.paymentMethod === "online" ? "pending" : "pending",
        subtotal: order.calculation.subtotal,
        delivery_fee: order.calculation.deliveryFee,
        total: order.calculation.total,
        vat_7: order.calculation.vat7,
        vat_19: order.calculation.vat19,
        created_at: order.createdAt,
      });

      if (!orderError) {
        // Items snapshot einfügen
        const itemsToInsert = order.items.map((it) => ({
          order_id: order.id,
          item_name: it.name,
          size_name: it.selectedSize?.name || null,
          extras: it.selectedExtras,
          quantity: it.quantity,
          unit_price: it.unitPrice,
          total_price: it.totalPrice,
          vat_rate: it.vatRate,
          comment: it.comment || null,
        }));

        await supabase.from("order_items").insert(itemsToInsert);
      }
    } catch (e) {
      console.warn("Konnte Bestellung nicht in Supabase persistieren (Memory-Fallback aktiv):", e);
    }
  }

  return order;
}

/**
 * Ruft eine Bestellung anhand ihrer ID ab
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  if (ordersMemoryStore.has(orderId)) {
    return ordersMemoryStore.get(orderId)!;
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`*, order_items (*)`)
        .eq("id", orderId)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          restaurantId: data.restaurant_id,
          orderNumber: data.order_number,
          orderType: data.order_type,
          customer: data.customer_data,
          desiredTime: data.desired_time,
          paymentMethod: data.payment_method,
          status: data.status,
          createdAt: data.created_at,
          calculation: {
            subtotal: Number(data.subtotal),
            deliveryFee: Number(data.delivery_fee),
            total: Number(data.total),
            vat7: Number(data.vat_7),
            vat19: Number(data.vat_19),
            foodNet: 0,
            drinkOrDeliveryNet: 0,
            isMinOrderReached: true,
            minOrderDelta: 0,
            minOrderRequired: 0,
          },
          items: (data.order_items || []).map((oi: any) => ({
            cartLineId: oi.id,
            itemId: "",
            number: "",
            name: oi.item_name,
            selectedSize: oi.size_name ? { id: "", name: oi.size_name, price: 0 } : undefined,
            selectedExtras: oi.extras || [],
            comment: oi.comment,
            unitPrice: Number(oi.unit_price),
            quantity: oi.quantity,
            vatRate: oi.vat_rate,
            totalPrice: Number(oi.total_price),
          })),
        };
      }
    } catch (e) {
      // Ignorieren
    }
  }

  return null;
}

/**
 * Gibt alle Bestellungen für ein bestimmtes Restaurant zurück (für Admin)
 */
export async function getOrdersForRestaurant(restaurantId: string): Promise<Order[]> {
  const result: Order[] = [];
  for (const o of ordersMemoryStore.values()) {
    if (o.restaurantId === restaurantId) {
      result.push(o);
    }
  }
  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
