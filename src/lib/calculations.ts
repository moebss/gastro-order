import { CartItem, DeliveryZone, MenuItem, ItemSize, Extra, OrderCalculation, OrderType, OpeningHour } from "../types/restaurant";

/**
 * Rundet einen Geldbetrag kaufmännisch auf 2 Dezimalstellen
 */
export function roundToCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Formatiert Betrag ins deutsche Währungsformat (z.B. "12,50 €")
 */
export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Berechnet den Einzelpreis eines konfigurierten Artikels
 */
export function calculateUnitPrice(
  basePrice: number,
  selectedSize?: ItemSize,
  selectedExtras: { price: number }[] = []
): number {
  const effectiveBase = selectedSize ? selectedSize.price : basePrice;
  const extrasSum = selectedExtras.reduce((acc, curr) => acc + curr.price, 0);
  return roundToCents(effectiveBase + extrasSum);
}

/**
 * Berechnet Summen, MwSt.-Sätze (7% und 19%) und Mindestbestellwert
 */
export function calculateOrderSummary(
  items: CartItem[],
  orderType: OrderType,
  selectedPlz: string,
  deliveryZones: DeliveryZone[]
): OrderCalculation {
  const subtotal = roundToCents(
    items.reduce((sum, item) => sum + item.totalPrice, 0)
  );

  let foodGross = 0;
  let drinkGross = 0;

  for (const item of items) {
    if (item.vatRate === 7) {
      foodGross += item.totalPrice;
    } else {
      drinkGross += item.totalPrice;
    }
  }
  foodGross = roundToCents(foodGross);
  drinkGross = roundToCents(drinkGross);

  // Liefergebühr und Mindestbestellwert ermitteln
  let deliveryFee = 0;
  let minOrderRequired = 0;

  if (orderType === "delivery") {
    const matchedZone = deliveryZones.find(
      (z) => z.plz.trim() === selectedPlz.trim()
    );
    if (matchedZone) {
      deliveryFee = roundToCents(matchedZone.deliveryFee);
      minOrderRequired = matchedZone.minOrder;
    } else {
      // Wenn noch keine passende PLZ gewählt wurde, Standard-Mindestwert der 1. Zone
      minOrderRequired = deliveryZones[0]?.minOrder || 0;
    }
  }

  const isMinOrderReached = subtotal >= minOrderRequired;
  const minOrderDelta = isMinOrderReached ? 0 : roundToCents(minOrderRequired - subtotal);
  const total = roundToCents(subtotal + (orderType === "delivery" ? deliveryFee : 0));

  // Gesetzliche MwSt.-Berechnung nach deutschem Umsatzsteuergesetz (UStG)
  // Bruttobetrag / (1 + Steuersatz) = Nettobetrag
  // MwSt = Bruttobetrag - Nettobetrag
  const foodNet = roundToCents(foodGross / 1.07);
  const vat7 = roundToCents(foodGross - foodNet);

  // Getränke und Lieferdienstleistung unterliegen 19% MwSt
  const drinkAndDeliveryGross = roundToCents(
    drinkGross + (orderType === "delivery" ? deliveryFee : 0)
  );
  const drinkOrDeliveryNet = roundToCents(drinkAndDeliveryGross / 1.19);
  const vat19 = roundToCents(drinkAndDeliveryGross - drinkOrDeliveryNet);

  return {
    subtotal,
    deliveryFee: orderType === "delivery" ? deliveryFee : 0,
    total,
    vat7,
    vat19,
    foodNet,
    drinkOrDeliveryNet,
    isMinOrderReached,
    minOrderDelta,
    minOrderRequired,
  };
}

/**
 * Prüft, ob ein Restaurant heute geöffnet hat und liefert passende Wunschzeitfenster
 */
export function getAvailableTimeSlots(
  openingHours: OpeningHour[],
  now: Date = new Date()
): {
  isOpenToday: boolean;
  isCurrentlyOpen: boolean;
  slots: string[];
  nextOpenNotice?: string;
} {
  const currentDay = now.getDay(); // 0 = Sonntag, 1 = Montag...
  const todayHours = openingHours.find((h) => h.day === currentDay);

  if (!todayHours || !todayHours.isOpen || todayHours.slots.length === 0) {
    return {
      isOpenToday: false,
      isCurrentlyOpen: false,
      slots: [],
      nextOpenNotice: "Heute Ruhetag oder geschlossen.",
    };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const prepBufferMinutes = 35; // Mindestens 35 Min. Vorlaufzeit für Zubereitung/Lieferung
  const earliestOrderMinutes = currentMinutes + prepBufferMinutes;

  const validSlots: string[] = [];
  let isCurrentlyOpen = false;

  for (const slot of todayHours.slots) {
    const [fromH, fromM] = slot.from.split(":").map(Number);
    const [toH, toM] = slot.to.split(":").map(Number);
    const slotFromMin = fromH * 60 + fromM;
    const slotToMin = toH * 60 + toM;

    // Prüfen, ob jetzt gerade geöffnet ist
    if (currentMinutes >= slotFromMin && currentMinutes <= slotToMin) {
      isCurrentlyOpen = true;
    }

    // Generiere 15-Minuten-Intervalle im Slot
    // Startet bei Slot-Beginn oder frühestens nach Vorlaufzeit
    const startMin = Math.max(slotFromMin, earliestOrderMinutes);
    // Auf das nächste 15-Minuten-Intervall aufrunden
    let currentSlotMin = Math.ceil(startMin / 15) * 15;

    // Nur bis 20 Minuten vor Ladenschluss Bestellungen annehmen
    const lastAcceptableMin = slotToMin - 20;

    while (currentSlotMin <= lastAcceptableMin) {
      const h = Math.floor(currentSlotMin / 60);
      const m = currentSlotMin % 60;
      const formatted = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} Uhr`;
      validSlots.push(formatted);
      currentSlotMin += 15;
    }
  }

  return {
    isOpenToday: true,
    isCurrentlyOpen,
    slots: validSlots,
    nextOpenNotice: validSlots.length === 0 ? "Keine weiteren Zeitfenster für heute verfügbar." : undefined,
  };
}
