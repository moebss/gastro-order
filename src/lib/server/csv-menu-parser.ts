import { MenuItem, Category } from "../../types/restaurant";
import { roundToCents } from "../calculations";

export interface ParsedMenuResult {
  categories: Category[];
  items: MenuItem[];
  errors: string[];
}

/**
 * Parst CSV-Inhalte für eine Restaurant-Speisekarte.
 * Unterstützt sowohl Komma- als auch Semikolon-Separatoren sowie deutsche Dezimalzahlen (z. B. "8,50 €").
 *
 * Header-Format:
 * Kategorie;Nummer;Name;Beschreibung;Preis;MwSt;Allergene
 */
export function parseMenuCsv(csvContent: string): ParsedMenuResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const errors: string[] = [];
  const categoryMap = new Map<string, Category>();
  const items: MenuItem[] = [];

  if (lines.length === 0) {
    return { categories: [], items: [], errors: ["CSV-Datei ist leer."] };
  }

  // Header analysieren
  const headerLine = lines[0];
  const delimiter = headerLine.includes(";") ? ";" : ",";
  const headers = headerLine.split(delimiter).map((h) => h.trim().toLowerCase());

  const idxCat = headers.findIndex((h) => h.includes("kategori") || h.includes("category"));
  const idxNum = headers.findIndex((h) => h.includes("nr") || h.includes("nummer") || h.includes("number"));
  const idxName = headers.findIndex((h) => h.includes("name") || h.includes("artikel") || h.includes("titel"));
  const idxDesc = headers.findIndex((h) => h.includes("beschreib") || h.includes("zutat") || h.includes("desc"));
  const idxPrice = headers.findIndex((h) => h.includes("preis") || h.includes("price"));
  const idxVat = headers.findIndex((h) => h.includes("mwst") || h.includes("steuer") || h.includes("vat"));
  const idxAllergens = headers.findIndex((h) => h.includes("allergen"));

  if (idxName === -1 || idxPrice === -1) {
    return {
      categories: [],
      items: [],
      errors: ["Ungültiges CSV-Format: Spalten 'Name' und 'Preis' sind zwingend erforderlich."],
    };
  }

  let catOrder = 1;
  let itemOrder = 1;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Ignoriere Kommentarzeilen
    if (line.startsWith("#") || line.startsWith("//")) continue;

    const cols = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ""));
    const rawName = cols[idxName];
    if (!rawName) continue;

    // Kategorie zuordnen oder anlegen
    const rawCat = idxCat !== -1 && cols[idxCat] ? cols[idxCat] : "Hauptspeisen";
    let cat = categoryMap.get(rawCat);
    if (!cat) {
      const catSlug = rawCat.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      cat = {
        id: `cat_${catSlug}_${categoryMap.size + 1}`,
        restaurantId: "rest_custom",
        name: rawCat,
        description: `Ausgewählte Spezialitäten aus der Kategorie ${rawCat}`,
        order: catOrder++,
        active: true,
      };
      categoryMap.set(rawCat, cat);
    }

    // Preis bereinigen
    const rawPriceStr = cols[idxPrice] ? cols[idxPrice].replace("€", "").replace(/\s/g, "").replace(",", ".") : "0";
    const priceNum = parseFloat(rawPriceStr);
    if (isNaN(priceNum) || priceNum <= 0) {
      errors.push(`Zeile ${i + 1}: Ungültiger Preis "${cols[idxPrice]}" für Artikel "${rawName}".`);
      continue;
    }

    // Steuersatz (Standard 7% für Speisen, 19% wenn angegeben oder Getränke)
    let vatRate: 7 | 19 = 7;
    if (idxVat !== -1 && cols[idxVat]) {
      const v = parseInt(cols[idxVat].replace("%", "").trim(), 10);
      if (v === 19) vatRate = 19;
    } else if (rawCat.toLowerCase().includes("getränk") || rawCat.toLowerCase().includes("drink")) {
      vatRate = 19;
    }

    // Allergene parsen (Komma, Semikolon oder Leerzeichen getrennt oder Folge-Spalten)
    const rawAllergens = idxAllergens !== -1 && cols[idxAllergens]
      ? cols.slice(idxAllergens).join(",")
      : "";
    const allergens = rawAllergens
      ? rawAllergens
          .split(/[,;\s]+/)
          .map((a) => a.trim().toUpperCase())
          .filter((a) => a.length > 0)
      : [];

    const itemId = `item_csv_${Date.now()}_${itemOrder}`;
    const itemNumber = idxNum !== -1 && cols[idxNum] ? cols[idxNum] : String(itemOrder);

    items.push({
      id: itemId,
      categoryId: cat.id,
      number: itemNumber,
      name: rawName,
      description: idxDesc !== -1 && cols[idxDesc] ? cols[idxDesc] : "",
      basePrice: roundToCents(priceNum),
      vatRate,
      allergens,
      isSoldOut: false,
      order: itemOrder++,
      sizes: [],
      extraGroups: [],
    });
  }

  return {
    categories: Array.from(categoryMap.values()),
    items,
    errors,
  };
}
