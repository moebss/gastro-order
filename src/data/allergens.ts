export interface AllergenInfo {
  code: string;
  name: string;
  description: string;
}

export const ALLERGENS: AllergenInfo[] = [
  { code: "A", name: "Glutenhaltiges Getreide", description: "Weizen, Roggen, Gerste, Hafer etc." },
  { code: "B", name: "Krebstiere", description: "Garnelen, Krabben, Hummer etc." },
  { code: "C", name: "Eier", description: "Hühnereier und daraus gewonnene Erzeugnisse" },
  { code: "D", name: "Fisch", description: "Fisch und Fischerzeugnisse" },
  { code: "E", name: "Erdnüsse", description: "Erdnüsse und Erdnusserzeugnisse" },
  { code: "F", name: "Soja", description: "Sojabohnen und Sojaerzeugnisse" },
  { code: "G", name: "Milch & Laktose", description: "Milch und Milcherzeugnisse einschl. Laktose" },
  { code: "H", name: "Schalenfrüchte", description: "Mandeln, Haselnüsse, Walnüsse, Pistazien etc." },
  { code: "I", name: "Sellerie", description: "Sellerie und Sellerieerzeugnisse" },
  { code: "J", name: "Senf", description: "Senf und Senferzeugnisse" },
  { code: "K", name: "Sesamsamen", description: "Sesam und Sesamerzeugnisse" },
  { code: "L", name: "Schwefeldioxid & Sulfite", description: "Ab Konzentrationen > 10 mg/kg oder 10 mg/l" },
  { code: "M", name: "Lupinen", description: "Lupinen und Lupinenerzeugnisse" },
  { code: "N", name: "Weichtiere", description: "Schnecken, Muscheln, Tintenfische etc." },
];
