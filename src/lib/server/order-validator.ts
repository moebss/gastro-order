import { Restaurant, Order, OrderType, PaymentMethod, CartItem, CartExtraItem } from "../../types/restaurant";
import { roundToCents, formatEuro } from "../calculations";

export interface ServerOrderItemRequest {
  itemId: string;
  sizeId?: string;
  extraIds?: string[];
  quantity: number;
  comment?: string;
  // Bösartiger Client könnte versuchen, eigene Preise mitzuschicken:
  clientSuppliedUnitPrice?: number;
  clientSuppliedTotal?: number;
}

export interface ServerOrderRequest {
  restaurantId: string;
  idempotencyKey?: string;
  orderType: OrderType;
  customer: {
    name: string;
    phone: string;
    email: string;
    street?: string;
    houseNumber?: string;
    plz?: string;
    city?: string;
    comment?: string;
  };
  desiredTime: {
    type: "asap" | "scheduled";
    timeSlot?: string;
  };
  paymentMethod: PaymentMethod;
  items: ServerOrderItemRequest[];
  honeypot?: string;
}

export interface ValidationSuccess {
  success: true;
  verifiedOrder: Order;
}

export interface ValidationFailure {
  success: false;
  statusCode: number;
  errorCode:
    | "SPAM_BOT_DETECTED"
    | "RESTAURANT_NOT_FOUND"
    | "RESTAURANT_INACTIVE"
    | "EMPTY_CART"
    | "ITEM_NOT_FOUND"
    | "ITEM_SOLD_OUT"
    | "INVALID_SIZE"
    | "INVALID_EXTRA"
    | "MISSING_REQUIRED_EXTRA"
    | "INVALID_QUANTITY"
    | "INVALID_CUSTOMER_DATA"
    | "UNSUPPORTED_DELIVERY_ZONE"
    | "MIN_ORDER_NOT_MET"
    | "RESTAURANT_CLOSED_TODAY"
    | "INVALID_DESIRED_TIME";
  errorMessage: string;
}

export type OrderValidationResult = ValidationSuccess | ValidationFailure;

/**
 * Kernfunktion der serverseitigen Geschäftslogik.
 * Vertraut KEINEN Preisen aus dem Client und validiert Verfügbarkeit,
 * Öffnungszeiten, Liefergebiete und Mindestbestellwerte.
 */
export function validateAndCalculateOrder(
  payload: ServerOrderRequest,
  restaurant: Restaurant,
  referenceDate: Date = new Date()
): OrderValidationResult {
  // 0. Honeypot Bot-Schutz (Verstecktes Feld darf niemals gefüllt sein)
  if (payload.honeypot && payload.honeypot.trim().length > 0) {
    return {
      success: false,
      statusCode: 400,
      errorCode: "SPAM_BOT_DETECTED",
      errorMessage: "Automatische Spam-Bestellung erkannt und abgelehnt.",
    };
  }

  // 1. Restaurant Status prüfen
  if (!restaurant.active) {
    return {
      success: false,
      statusCode: 400,
      errorCode: "RESTAURANT_INACTIVE",
      errorMessage: `Das Restaurant „${restaurant.name}“ nimmt derzeit keine Bestellungen an.`,
    };
  }

  // 2. Warenkorb auf Inhalt prüfen
  if (!payload.items || payload.items.length === 0) {
    return {
      success: false,
      statusCode: 400,
      errorCode: "EMPTY_CART",
      errorMessage: "Der Warenkorb enthält keine Artikel.",
    };
  }

  // 3. Kundendaten validieren
  const cust = payload.customer;
  if (!cust || !cust.name || !cust.name.trim()) {
    return {
      success: false,
      statusCode: 400,
      errorCode: "INVALID_CUSTOMER_DATA",
      errorMessage: "Bitte geben Sie einen vollständigen Namen an.",
    };
  }
  if (!cust.phone || cust.phone.trim().length < 6) {
    return {
      success: false,
      statusCode: 400,
      errorCode: "INVALID_CUSTOMER_DATA",
      errorMessage: "Bitte geben Sie eine gültige Telefonnummer an.",
    };
  }
  if (!cust.email || !cust.email.includes("@")) {
    return {
      success: false,
      statusCode: 400,
      errorCode: "INVALID_CUSTOMER_DATA",
      errorMessage: "Bitte geben Sie eine gültige E-Mail-Adresse an.",
    };
  }

  // 4. Artikel, Größen und Extras verifizieren (Manipulationsschutz!)
  const verifiedCartItems: CartItem[] = [];
  let calculatedSubtotal = 0;
  let foodGross = 0;
  let drinkGross = 0;

  for (let i = 0; i < payload.items.length; i++) {
    const reqItem = payload.items[i];

    if (!reqItem.quantity || reqItem.quantity < 1) {
      return {
        success: false,
        statusCode: 400,
        errorCode: "INVALID_QUANTITY",
        errorMessage: `Ungültige Bestellmenge für Position ${i + 1}.`,
      };
    }

    // Artikel aus der Datenbank laden
    const dbItem = restaurant.items.find((it) => it.id === reqItem.itemId);
    if (!dbItem) {
      return {
        success: false,
        statusCode: 400,
        errorCode: "ITEM_NOT_FOUND",
        errorMessage: `Der Artikel mit ID „${reqItem.itemId}“ existiert nicht in der Speisekarte.`,
      };
    }

    // Ausverkauft-Status prüfen
    if (dbItem.isSoldOut) {
      return {
        success: false,
        statusCode: 400,
        errorCode: "ITEM_SOLD_OUT",
        errorMessage: `Der Artikel „${dbItem.name}“ (#${dbItem.number}) ist derzeit leider ausverkauft.`,
      };
    }

    // Größe verifizieren & Preis ermitteln
    let verifiedSize = undefined;
    let effectiveItemBasePrice = dbItem.basePrice;

    if (reqItem.sizeId) {
      const foundSize = dbItem.sizes.find((s) => s.id === reqItem.sizeId);
      if (!foundSize) {
        return {
          success: false,
          statusCode: 400,
          errorCode: "INVALID_SIZE",
          errorMessage: `Die gewählte Größe existiert nicht für „${dbItem.name}“.`,
        };
      }
      verifiedSize = foundSize;
      effectiveItemBasePrice = foundSize.price;
    }

    // Extras verifizieren & Pflichtauswahlen prüfen
    const verifiedExtrasList: CartExtraItem[] = [];
    const requestedExtraIds = new Set(reqItem.extraIds || []);

    for (const group of dbItem.extraGroups) {
      const chosenInGroup = group.extras.filter((e) => requestedExtraIds.has(e.id));

      if (group.required && chosenInGroup.length === 0) {
        return {
          success: false,
          statusCode: 400,
          errorCode: "MISSING_REQUIRED_EXTRA",
          errorMessage: `Bitte wählen Sie eine Option bei „${group.name}“ für „${dbItem.name}“.`,
        };
      }

      if (group.minSelections && chosenInGroup.length < group.minSelections) {
        return {
          success: false,
          statusCode: 400,
          errorCode: "MISSING_REQUIRED_EXTRA",
          errorMessage: `Mindestens ${group.minSelections} Auswahl(en) bei „${group.name}“ erforderlich.`,
        };
      }

      for (const extra of chosenInGroup) {
        verifiedExtrasList.push({
          id: extra.id,
          groupId: group.id,
          groupName: group.name,
          name: extra.name,
          price: extra.price,
        });
      }
    }

    // Serverseitig berechneter Einzelpreis (Ignoriert jegliche Client-Preise!)
    const extrasTotal = verifiedExtrasList.reduce((sum, e) => sum + e.price, 0);
    const verifiedUnitPrice = roundToCents(effectiveItemBasePrice + extrasTotal);
    const verifiedTotalPrice = roundToCents(verifiedUnitPrice * reqItem.quantity);

    calculatedSubtotal += verifiedTotalPrice;
    if (dbItem.vatRate === 7) {
      foodGross += verifiedTotalPrice;
    } else {
      drinkGross += verifiedTotalPrice;
    }

    const extraKey = verifiedExtrasList.map((e) => e.id).sort().join("_");
    const lineId = `${dbItem.id}-${verifiedSize?.id || "std"}-${extraKey}`;

    verifiedCartItems.push({
      cartLineId: lineId,
      itemId: dbItem.id,
      number: dbItem.number,
      name: dbItem.name,
      selectedSize: verifiedSize,
      selectedExtras: verifiedExtrasList,
      comment: reqItem.comment?.trim() || undefined,
      unitPrice: verifiedUnitPrice,
      quantity: reqItem.quantity,
      vatRate: dbItem.vatRate,
      totalPrice: verifiedTotalPrice,
    });
  }

  calculatedSubtotal = roundToCents(calculatedSubtotal);
  foodGross = roundToCents(foodGross);
  drinkGross = roundToCents(drinkGross);

  // 5. Liefergebiet & Mindestbestellwert prüfen
  let deliveryFee = 0;
  let minOrderRequired = 0;

  if (payload.orderType === "delivery") {
    if (!cust.street || !cust.houseNumber || !cust.plz) {
      return {
        success: false,
        statusCode: 400,
        errorCode: "INVALID_CUSTOMER_DATA",
        errorMessage: "Bitte geben Sie Straße, Hausnummer und PLZ für die Lieferung an.",
      };
    }

    const cleanedPlz = cust.plz.trim();
    const matchedZone = restaurant.deliveryZones.find(
      (z) => z.plz.trim() === cleanedPlz
    );

    if (!matchedZone) {
      return {
        success: false,
        statusCode: 400,
        errorCode: "UNSUPPORTED_DELIVERY_ZONE",
        errorMessage: `Das Liefergebiet mit PLZ „${cleanedPlz}“ wird von uns leider nicht beliefert.`,
      };
    }

    minOrderRequired = matchedZone.minOrder;
    deliveryFee = roundToCents(matchedZone.deliveryFee);

    if (calculatedSubtotal < minOrderRequired) {
      const delta = roundToCents(minOrderRequired - calculatedSubtotal);
      return {
        success: false,
        statusCode: 400,
        errorCode: "MIN_ORDER_NOT_MET",
        errorMessage: `Mindestbestellwert von ${formatEuro(minOrderRequired)} für PLZ ${cleanedPlz} nicht erreicht (Warenkorb: ${formatEuro(calculatedSubtotal)}). Es fehlen noch ${formatEuro(delta)}.`,
      };
    }
  }

  // 6. Öffnungszeiten & Wunschzeit prüfen
  const currentDayOfWeek = referenceDate.getDay();
  const todaySchedule = restaurant.openingHours.find((h) => h.day === currentDayOfWeek);

  if (!todaySchedule || !todaySchedule.isOpen || todaySchedule.slots.length === 0) {
    return {
      success: false,
      statusCode: 400,
      errorCode: "RESTAURANT_CLOSED_TODAY",
      errorMessage: `Das Restaurant „${restaurant.name}“ hat heute Ruhetag.`,
    };
  }

  const currentMinutesNow = referenceDate.getHours() * 60 + referenceDate.getMinutes();

  if (payload.desiredTime?.type === "scheduled" && payload.desiredTime.timeSlot) {
    const rawTime = payload.desiredTime.timeSlot.replace(" Uhr", "").trim();
    const [reqH, reqM] = rawTime.split(":").map(Number);
    if (isNaN(reqH) || isNaN(reqM)) {
      return {
        success: false,
        statusCode: 400,
        errorCode: "INVALID_DESIRED_TIME",
        errorMessage: "Ungültiges Zeitformat für die Wunschzeit.",
      };
    }
    const requestedMinutes = reqH * 60 + reqM;

    // Mindestens 30 Minuten Vorlaufzeit
    if (requestedMinutes < currentMinutesNow + 25) {
      return {
        success: false,
        statusCode: 400,
        errorCode: "INVALID_DESIRED_TIME",
        errorMessage: "Die gewünschte Zeit liegt zu nah oder in der Vergangenheit (mindestens 30 Min. Vorlauf).",
      };
    }

    // Prüfen, ob Wunschzeit in einem der Slots liegt
    const isWithinSlot = todaySchedule.slots.some((slot) => {
      const [fromH, fromM] = slot.from.split(":").map(Number);
      const [toH, toM] = slot.to.split(":").map(Number);
      return requestedMinutes >= fromH * 60 + fromM && requestedMinutes <= toH * 60 + toM;
    });

    if (!isWithinSlot) {
      return {
        success: false,
        statusCode: 400,
        errorCode: "INVALID_DESIRED_TIME",
        errorMessage: `Die Wunschzeit ${rawTime} Uhr liegt außerhalb unserer heutigen Öffnungszeiten.`,
      };
    }
  }

  // 7. Gesetzliche Steueraufteilung (7% und 19%) nach § 14 UStG
  const foodNet = roundToCents(foodGross / 1.07);
  const vat7 = roundToCents(foodGross - foodNet);

  const drinkAndDeliveryGross = roundToCents(
    drinkGross + (payload.orderType === "delivery" ? deliveryFee : 0)
  );
  const drinkOrDeliveryNet = roundToCents(drinkAndDeliveryGross / 1.19);
  const vat19 = roundToCents(drinkAndDeliveryGross - drinkOrDeliveryNet);

  const grandTotal = roundToCents(
    calculatedSubtotal + (payload.orderType === "delivery" ? deliveryFee : 0)
  );

  const prefix = restaurant.slug.split("-")[0].toUpperCase().slice(0, 3);
  const orderNumber = `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;

  const verifiedOrder: Order = {
    id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    restaurantId: restaurant.id,
    orderNumber,
    orderType: payload.orderType,
    customer: {
      name: cust.name.trim(),
      phone: cust.phone.trim(),
      email: cust.email.trim(),
      street: cust.street?.trim() || "",
      houseNumber: cust.houseNumber?.trim() || "",
      plz: cust.plz?.trim() || "",
      city: cust.city?.trim() || restaurant.address.city,
      comment: cust.comment?.trim() || "",
    },
    desiredTime: payload.desiredTime,
    paymentMethod: payload.paymentMethod,
    items: verifiedCartItems,
    calculation: {
      subtotal: calculatedSubtotal,
      deliveryFee: payload.orderType === "delivery" ? deliveryFee : 0,
      total: grandTotal,
      vat7,
      vat19,
      foodNet,
      drinkOrDeliveryNet,
      isMinOrderReached: true,
      minOrderDelta: 0,
      minOrderRequired,
    },
    status: "new",
    createdAt: referenceDate.toISOString(),
  };

  return {
    success: true,
    verifiedOrder,
  };
}
