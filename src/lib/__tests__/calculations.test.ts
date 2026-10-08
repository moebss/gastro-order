import { describe, it, expect } from "vitest";
import {
  calculateUnitPrice,
  calculateOrderSummary,
  roundToCents,
  formatEuro,
  getAvailableTimeSlots,
} from "../calculations";
import { CartItem, DeliveryZone, OpeningHour } from "../../types/restaurant";

describe("Geschäftslogik & Preisberechnung", () => {
  it("berechnet den Einzelpreis für Standardgröße und Extras korrekt", () => {
    // Pizza Margherita Standard: 8,50 € + Knoblauch (0,80 €) + Büffelmozzarella (2,50 €) = 11,80 €
    const basePrice = 8.50;
    const selectedSize = { id: "size_standard", name: "Klassik Ø 28 cm", price: 8.50 };
    const extras = [
      { price: 0.80 },
      { price: 2.50 },
    ];
    const unitPrice = calculateUnitPrice(basePrice, selectedSize, extras);
    expect(unitPrice).toBe(11.80);
  });

  it("berechnet den Einzelpreis für Familiengröße und Extras korrekt", () => {
    // Pizza Margherita Familie: 16,50 € + Grana Padano (1,50 €) = 18,00 €
    const basePrice = 8.50;
    const familySize = { id: "size_family", name: "Familie Ø 45 cm", price: 16.50 };
    const extras = [{ price: 1.50 }];
    const unitPrice = calculateUnitPrice(basePrice, familySize, extras);
    expect(unitPrice).toBe(18.00);
  });

  it("erlaubt Nachrechnen von zwei Pizzagrößen im Warenkorb", () => {
    // Item 1: 1x Pizza Margherita Klassik (8,50 €) + Extras (2,50 €) = 11,00 €
    // Item 2: 1x Pizza Margherita Familie (16,50 €) + Extras (1,50 €) = 18,00 €
    // Zwischensumme = 29,00 €
    const items: CartItem[] = [
      {
        cartLineId: "item1",
        itemId: "item_pizza_margherita",
        number: "10",
        name: "Pizza Margherita",
        selectedSize: { id: "size_standard", name: "Klassik Ø 28 cm", price: 8.50 },
        selectedExtras: [{ id: "ext1", groupId: "grp1", groupName: "Käse", name: "Büffelmozzarella", price: 2.50 }],
        unitPrice: 11.00,
        quantity: 1,
        vatRate: 7,
        totalPrice: 11.00,
      },
      {
        cartLineId: "item2",
        itemId: "item_pizza_margherita",
        number: "10",
        name: "Pizza Margherita",
        selectedSize: { id: "size_family", name: "Familie Ø 45 cm", price: 16.50 },
        selectedExtras: [{ id: "ext2", groupId: "grp1", groupName: "Käse", name: "Grana Padano", price: 1.50 }],
        unitPrice: 18.00,
        quantity: 1,
        vatRate: 7,
        totalPrice: 18.00,
      },
    ];

    const zones: DeliveryZone[] = [
      { plz: "50823", areaName: "Ehrenfeld", minOrder: 15.00, deliveryFee: 1.50, estimatedMinutes: 30 },
    ];

    const summary = calculateOrderSummary(items, "delivery", "50823", zones);

    expect(summary.subtotal).toBe(29.00);
    expect(summary.deliveryFee).toBe(1.50);
    expect(summary.total).toBe(30.50);
    expect(summary.isMinOrderReached).toBe(true);
    expect(summary.minOrderDelta).toBe(0);

    // MwSt. Prüfung:
    // Speisen (29,00 €) unterliegen 7% MwSt: Netto = 29.00 / 1.07 = 27.10 €, MwSt 7% = 1.90 €
    expect(summary.vat7).toBe(1.90);
    // Liefergebühr (1,50 €) unterliegt 19% MwSt: Netto = 1.50 / 1.19 = 1.26 €, MwSt 19% = 0.24 €
    expect(summary.vat19).toBe(0.24);
  });

  it("teilt 7 % und 19 % MwSt. exakt auf bei Speisen, Getränken und Liefergebühr", () => {
    // 1x Pasta (10,00 € brutto @ 7%)
    // 2x Cola (je 3,00 € = 6,00 € brutto @ 19%)
    // Abholung (0,00 € Liefergebühr)
    const items: CartItem[] = [
      {
        cartLineId: "line1",
        itemId: "pasta",
        number: "31",
        name: "Pasta",
        selectedExtras: [],
        unitPrice: 10.00,
        quantity: 1,
        vatRate: 7,
        totalPrice: 10.00,
      },
      {
        cartLineId: "line2",
        itemId: "cola",
        number: "70",
        name: "Coca-Cola",
        selectedExtras: [],
        unitPrice: 3.00,
        quantity: 2,
        vatRate: 19,
        totalPrice: 6.00,
      },
    ];

    const summary = calculateOrderSummary(items, "pickup", "", []);

    expect(summary.subtotal).toBe(16.00);
    expect(summary.total).toBe(16.00);
    expect(summary.deliveryFee).toBe(0);

    // 10,00 € Speisen: Netto = 9.35 €, MwSt (7%) = 0.65 €
    expect(summary.foodNet).toBe(9.35);
    expect(summary.vat7).toBe(0.65);

    // 6,00 € Getränke: Netto = 5.04 €, MwSt (19%) = 0.96 €
    expect(summary.drinkOrDeliveryNet).toBe(5.04);
    expect(summary.vat19).toBe(0.96);
  });

  it("erkennt Unterschreitung des Mindestbestellwerts zuverlässig", () => {
    const items: CartItem[] = [
      {
        cartLineId: "line1",
        itemId: "salat",
        number: "45",
        name: "Insalata",
        selectedExtras: [],
        unitPrice: 6.90,
        quantity: 1,
        vatRate: 7,
        totalPrice: 6.90,
      },
    ];

    const zones: DeliveryZone[] = [
      { plz: "50823", areaName: "Ehrenfeld", minOrder: 15.00, deliveryFee: 1.50, estimatedMinutes: 30 },
    ];

    const summary = calculateOrderSummary(items, "delivery", "50823", zones);

    expect(summary.subtotal).toBe(6.90);
    expect(summary.minOrderRequired).toBe(15.00);
    expect(summary.isMinOrderReached).toBe(false);
    expect(summary.minOrderDelta).toBe(8.10);
  });

  it("erlaubt Abholung auch unterhalb des Liefer-Mindestbestellwerts", () => {
    const items: CartItem[] = [
      {
        cartLineId: "line1",
        itemId: "salat",
        number: "45",
        name: "Insalata",
        selectedExtras: [],
        unitPrice: 6.90,
        quantity: 1,
        vatRate: 7,
        totalPrice: 6.90,
      },
    ];

    const zones: DeliveryZone[] = [
      { plz: "50823", areaName: "Ehrenfeld", minOrder: 15.00, deliveryFee: 1.50, estimatedMinutes: 30 },
    ];

    const summary = calculateOrderSummary(items, "pickup", "", zones);

    expect(summary.isMinOrderReached).toBe(true);
    expect(summary.minOrderDelta).toBe(0);
    expect(summary.deliveryFee).toBe(0);
    expect(summary.total).toBe(6.90);
  });

  it("formatiert Beträge korrekt mit Euro-Zeichen und Komma", () => {
    expect(formatEuro(12.5)).toMatch(/12,50\s*€/);
    expect(formatEuro(0)).toMatch(/0,00\s*€/);
    expect(formatEuro(18.99)).toMatch(/18,99\s*€/);
  });

  it("erzeugt Zeitfenster nur innerhalb der Öffnungszeiten mit Vorlauf", () => {
    const testHours: OpeningHour[] = [
      {
        day: 1, // Montag
        dayName: "Montag",
        isOpen: true,
        slots: [{ from: "17:00", to: "22:00" }],
      },
    ];

    // Simuliere Montag 17:30 Uhr
    const fakeNow = new Date("2026-10-05T17:30:00"); // Tag 1 (Montag)
    const result = getAvailableTimeSlots(testHours, fakeNow);

    expect(result.isOpenToday).toBe(true);
    expect(result.isCurrentlyOpen).toBe(true);
    expect(result.slots.length).toBeGreaterThan(0);
    // Erster Slot nach 17:30 + 35 min = 18:05 -> aufgerundet auf 18:15 Uhr
    expect(result.slots[0]).toBe("18:15 Uhr");
    // Letzter Slot vor 22:00 - 20 min = 21:40 -> 21:30 Uhr
    expect(result.slots[result.slots.length - 1]).toBe("21:30 Uhr");
  });
});
