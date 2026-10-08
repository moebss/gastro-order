import { test, expect } from "@playwright/test";

test.describe("End-to-End Bestellablauf Gastronomie", () => {
  test("Vollständige Bestellung von Speisekarte bis Bestätigung", async ({ page }) => {
    // 1. Speisekarte des Restaurants aufrufen
    await page.goto("http://localhost:3000/r/pizzeria-bella-napoli");
    await expect(page.locator("text=Pizzeria Bella Napoli")).toBeVisible();

    // 2. Artikel öffnen (Pizza Margherita)
    const pizzaCard = page.locator("text=Pizza Margherita").first();
    await expect(pizzaCard).toBeVisible();
    await pizzaCard.click();

    // 3. Modal: Größe & Extra wählen und in den Warenkorb legen
    await expect(page.locator("text=In den Warenkorb")).toBeVisible();
    await page.click("text=In den Warenkorb");

    // 4. Zur Kasse gehen
    const checkoutButton = page.locator("text=Zur Kasse").first();
    await expect(checkoutButton).toBeVisible();
    await checkoutButton.click();

    // 5. Checkout-Formular ausfüllen
    await expect(page.locator("text=Bestellung abschließen")).toBeVisible();

    await page.fill('input[placeholder*="Vor- und Nachname"]', "Maximilian Mustermann");
    await page.fill('input[placeholder*="0170"]', "0172 9876543");
    await page.fill('input[placeholder*="beispiel@mail.de"]', "max@mustermann.de");

    // Lieferadresse
    await page.fill('input[placeholder*="Straße"]', "Venloer Straße");
    await page.fill('input[placeholder*="Nr."]', "42");
    await page.fill('input[placeholder*="5-stellig"]', "50823");
    await page.fill('input[placeholder*="Stadt"]', "Köln");

    // Barzahlung wählen
    await page.click("text=Barzahlung bei Übergabe");

    // 6. Verbindlich bestellen
    const submitBtn = page.locator("text=Verbindlich bestellen");
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 7. Bestätigungsseite prüfen
    await expect(page.locator("text=Bestellung erfolgreich aufgegeben!")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Maximilian Mustermann")).toBeVisible();
  });
});
