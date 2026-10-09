import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimitStore } from "../server/rate-limiter";
import { parseMenuCsv } from "../server/csv-menu-parser";
import { ONBOARDING_TEMPLATES } from "../server/onboarding-templates";
import { validateAndCalculateOrder, ServerOrderRequest } from "../server/order-validator";
import { RESTAURANT_BELLA_NAPOLI, ALL_RESTAURANTS } from "../../data/restaurants";
import { NextRequest } from "next/server";
import { Restaurant } from "../../types/restaurant";

describe("Meilenstein 6: Härtung, Rate-Limiting & Mandanten-Onboarding", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  describe("1. Rate-Limiting & Spam-Schutz", () => {
    it("erlaubt Anfragen im Rahmen des Limits und sperrt bei Überschreitung", () => {
      const mockReq = new NextRequest("http://localhost:3000/api/orders");
      const testKey = "test_ratelimit_ip_1";

      // 10 Anfragen sind erlaubt
      for (let i = 1; i <= 10; i++) {
        const check = checkRateLimit(mockReq, "order", testKey);
        expect(check.allowed).toBe(true);
        expect(check.currentCount).toBe(i);
      }

      // Die 11. Anfrage muss abgewiesen werden
      const blocked = checkRateLimit(mockReq, "order", testKey);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
      expect(blocked.currentCount).toBe(10);
    });

    it("Honeypot-Feld wehrt automatisierte Spam-Bots lautlos ab", () => {
      const botPayload: ServerOrderRequest = {
        restaurantId: RESTAURANT_BELLA_NAPOLI.id,
        orderType: "delivery",
        customer: {
          name: "Spam Bot",
          phone: "0170 0000000",
          email: "bot@spam.com",
          street: "Spamgasse",
          houseNumber: "1",
          plz: "50823",
          city: "Köln",
        },
        desiredTime: { type: "asap" },
        paymentMethod: "cash",
        // Bot füllt das für Menschen unsichtbare Feld aus:
        honeypot: "http://buy-crypto-fast.org",
        items: [{ itemId: "item_pizza_margherita", quantity: 1 }],
      };

      const result = validateAndCalculateOrder(botPayload, RESTAURANT_BELLA_NAPOLI);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("SPAM_BOT_DETECTED");
        expect(result.errorMessage).toContain("Spam-Bestellung");
      }
    });
  });

  describe("2. CSV Speisekarten-Parser", () => {
    it("parst eine deutsche CSV mit Kommapreisen, Steuersätzen und Allergenen", () => {
      const sampleCsv = `Kategorie;Nummer;Name;Beschreibung;Preis;MwSt;Allergene
Pizzen;10;Pizza Tonno;Thunfisch & Zwiebeln;9,50 €;7;A;D;G
Getränke;90;Fritz-Kola 0,33l;Eiskalte Kola;2,80 €;19;
Vorspeisen;01;Bruschetta;Geröstetes Brot mit Tomaten;5,00;7;A`;

      const parsed = parseMenuCsv(sampleCsv);
      expect(parsed.errors.length).toBe(0);
      expect(parsed.items.length).toBe(3);
      expect(parsed.categories.length).toBe(3);

      const pizza = parsed.items.find((i) => i.name === "Pizza Tonno");
      expect(pizza).toBeDefined();
      expect(pizza?.basePrice).toBe(9.5);
      expect(pizza?.vatRate).toBe(7);
      expect(pizza?.allergens).toEqual(["A", "D", "G"]);

      const kola = parsed.items.find((i) => i.name.includes("Fritz-Kola"));
      expect(kola).toBeDefined();
      expect(kola?.basePrice).toBe(2.8);
      expect(kola?.vatRate).toBe(19);
    });

    it("meldet Fehler bei unbrauchbaren CSV-Dateien ohne Pflichtspalten", () => {
      const invalidCsv = `FalscheSpalte1,FalscheSpalte2
Wert1,Wert2`;
      const parsed = parseMenuCsv(invalidCsv);
      expect(parsed.items.length).toBe(0);
      expect(parsed.errors.length).toBeGreaterThan(0);
      expect(parsed.errors[0]).toContain("zwingend erforderlich");
    });
  });

  describe("3. Mandanten-Onboarding & Vorlagen", () => {
    it("stellt vollständige Vorlagen für Pizzerien, Burger-Imbisse und Asia-Restaurants bereit", () => {
      expect(ONBOARDING_TEMPLATES.length).toBe(3);

      const pizzeria = ONBOARDING_TEMPLATES.find((t) => t.id === "template_pizzeria");
      expect(pizzeria).toBeDefined();
      expect(pizzeria?.items.length).toBeGreaterThanOrEqual(4);
      expect(pizzeria?.categories.length).toBeGreaterThanOrEqual(3);

      // MwSt-Trennung in Vorlage: Speisen 7%, Getränke 19%
      const foodItem = pizzeria?.items.find((i) => i.vatRate === 7);
      const drinkItem = pizzeria?.items.find((i) => i.vatRate === 19);
      expect(foodItem).toBeDefined();
      expect(drinkItem).toBeDefined();
    });

    it("ermöglicht die sofortige Bestellung bei einem neu angelegten Restaurant", () => {
      // Simuliertes neues Restaurant
      const newRestaurant: Restaurant = {
        id: "rest_onboarding_test_99",
        name: "Trattoria Da Roberto",
        slug: "trattoria-da-roberto-test",
        tagline: "Echte neapolitanische Holzofenpizza",
        address: { street: "Rheinpromenade 1", plz: "50679", city: "Köln" },
        phone: "0221 998877",
        email: "roberto@test.de",
        logo: "🍕",
        heroImage: "",
        accentColor: "#ea580c",
        active: true,
        deliveryZones: [
          { plz: "50679", areaName: "Köln-Deutz", minOrder: 15.0, deliveryFee: 1.5, estimatedMinutes: 25 },
        ],
        openingHours: [
          {
            day: new Date().getDay(),
            dayName: "Heute",
            isOpen: true,
            slots: [{ from: "00:00", to: "23:59" }], // Ganztägig geöffnet für Test
          },
        ],
        categories: [
          { id: "cat_roberto_pizza", name: "Pizzen", description: "Holzofen", order: 1 },
        ],
        items: [
          {
            id: "item_roberto_margherita",
            categoryId: "cat_roberto_pizza",
            number: "01",
            name: "Pizza Margherita Speciale",
            description: "San Marzano Tomaten, Mozzarella di Bufala",
            basePrice: 9.0,
            vatRate: 7,
            allergens: ["A", "G"],
            isSoldOut: false,
            order: 1,
            sizes: [],
            extraGroups: [],
          },
        ],
      };

      // Bestellung aufgeben für den neuen Mandanten
      const validOrderReq: ServerOrderRequest = {
        restaurantId: newRestaurant.id,
        orderType: "delivery",
        customer: {
          name: "Test Gast",
          phone: "0172 1234567",
          email: "gast@test.de",
          street: "Deutzer Freiheit",
          houseNumber: "5",
          plz: "50679",
          city: "Köln",
        },
        desiredTime: { type: "asap" },
        paymentMethod: "cash",
        items: [{ itemId: "item_roberto_margherita", quantity: 2 }],
      };

      const result = validateAndCalculateOrder(validOrderReq, newRestaurant);
      expect(result.success).toBe(true);

      if (result.success) {
        // 2x 9.00 € = 18.00 € + 1.50 € Liefergebühr = 19.50 €
        expect(result.verifiedOrder.calculation.subtotal).toBe(18.0);
        expect(result.verifiedOrder.calculation.deliveryFee).toBe(1.5);
        expect(result.verifiedOrder.calculation.total).toBe(19.5);
        expect(result.verifiedOrder.calculation.isMinOrderReached).toBe(true);
      }
    });

    it("legt Inhaber mit selbst gewähltem Passwort an und authentifiziert diesen sicher", async () => {
      const { createAdminUser, authenticateAdminUser } = await import("../server/users-store");

      const userEmail = "inhaber.test@neue-pizzeria.de";
      const customPassword = "meinSicheresPasswort!2026";

      // Benutzer anlegen mit eigenem Passwort
      const newUser = await createAdminUser({
        email: userEmail,
        name: "Francesco Test",
        password: customPassword,
        restaurantId: "rest_francesco_01",
        role: "restaurant_owner",
      });

      expect(newUser.email).toBe(userEmail);
      expect(newUser.restaurantId).toBe("rest_francesco_01");

      // Login mit richtigem Passwort
      const authenticated = await authenticateAdminUser(userEmail, customPassword);
      expect(authenticated).not.toBeNull();
      expect(authenticated?.email).toBe(userEmail);

      // Login mit falschem Passwort muss fehlschlagen
      const failedAuthWrongPass = await authenticateAdminUser(userEmail, "falschesPasswort123");
      expect(failedAuthWrongPass).toBeNull();

      // Login ohne Passwort muss fehlschlagen
      const failedAuthNoPass = await authenticateAdminUser(userEmail, "");
      expect(failedAuthNoPass).toBeNull();
    });
  });
});
