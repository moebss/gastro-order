import { supabase, isSupabaseConfigured } from "../supabase/client";

export type UserRole = "restaurant_owner" | "restaurant_staff" | "platform_admin";

export interface AdminUser {
  id: string;
  email: string;
  passwordHash?: string;
  name: string;
  restaurantId: string; // "all" für platform_admin
  role: UserRole;
  active: boolean;
  createdAt: string;
}

// In-Memory Speicher für Dev/Serverless mit Default-Benutzern
const usersMemoryStore = new Map<string, AdminUser>();

// Initial-Benutzer initialisieren
function initDefaultUsers() {
  if (usersMemoryStore.size > 0) return;

  const defaults: AdminUser[] = [
    {
      id: "usr_napoli_owner",
      email: "info@pizzeria-napoli-horrem.de",
      passwordHash: "napoli123",
      name: "Mario Rossi (Inhaber)",
      restaurantId: "rest_napoli_horrem_03",
      role: "restaurant_owner",
      active: true,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "usr_napoli_kueche",
      email: "kueche@pizzeria-napoli-horrem.de",
      passwordHash: "kueche123",
      name: "Küchen-Team Horrem",
      restaurantId: "rest_napoli_horrem_03",
      role: "restaurant_staff",
      active: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "usr_bella_owner",
      email: "bella@bella-napoli.de",
      passwordHash: "bella123",
      name: "Gianni Bella (Inhaber)",
      restaurantId: "rest_bella_napoli_01",
      role: "restaurant_owner",
      active: true,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: "usr_wok_owner",
      email: "wok@golden-wok.de",
      passwordHash: "wok123",
      name: "Lin Chen (Inhaber)",
      restaurantId: "rest_golden_wok_02",
      role: "restaurant_owner",
      active: true,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: "usr_platform_admin",
      email: "admin@gastro-order.de",
      passwordHash: "admin123",
      name: "System Administrator",
      restaurantId: "all",
      role: "platform_admin",
      active: true,
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
  ];

  defaults.forEach((u) => usersMemoryStore.set(u.id, u));
}

initDefaultUsers();

/**
 * Holt alle Benutzer, strikt mandantenisoliert:
 * Ein Restaurant-Inhaber sieht NUR die Benutzer seines eigenen Restaurants.
 * Ein Platform-Admin sieht alle Benutzer.
 */
export async function getUsersForRestaurant(
  restaurantId: string,
  isPlatformAdmin = false
): Promise<Omit<AdminUser, "passwordHash">[]> {
  initDefaultUsers();

  const all = Array.from(usersMemoryStore.values());
  const filtered = isPlatformAdmin
    ? all
    : all.filter((u) => u.restaurantId === restaurantId);

  return filtered.map(({ passwordHash, ...rest }) => rest);
}

/**
 * Erstellt einen neuen Benutzer für ein Restaurant
 */
export async function createAdminUser(payload: {
  email: string;
  password?: string;
  name: string;
  restaurantId: string;
  role: UserRole;
}): Promise<Omit<AdminUser, "passwordHash">> {
  initDefaultUsers();

  const emailLower = payload.email.toLowerCase().trim();

  // Prüfen ob E-Mail schon existiert
  const existing = Array.from(usersMemoryStore.values()).find(
    (u) => u.email.toLowerCase() === emailLower
  );
  if (existing) {
    throw new Error(`Ein Benutzer mit der E-Mail '${emailLower}' existiert bereits.`);
  }

  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newUser: AdminUser = {
    id,
    email: emailLower,
    passwordHash: payload.password || "start123",
    name: payload.name.trim(),
    restaurantId: payload.restaurantId,
    role: payload.role,
    active: true,
    createdAt: new Date().toISOString(),
  };

  usersMemoryStore.set(id, newUser);

  // Optional: In Supabase anlegen wenn verbunden
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("restaurant_members").insert({
        restaurant_id: payload.restaurantId,
        role: payload.role,
      });
    } catch (e) {
      console.warn("Konnte User nicht in Supabase spiegeln:", e);
    }
  }

  const { passwordHash, ...safeUser } = newUser;
  return safeUser;
}

/**
 * Authentifiziert einen Benutzer per E-Mail und Passwort
 */
export async function authenticateAdminUser(
  email: string,
  password?: string
): Promise<Omit<AdminUser, "passwordHash"> | null> {
  initDefaultUsers();

  const emailLower = email.toLowerCase().trim();

  // Schnelle Demo-Logins erlauben (z.B. nur "napoli" oder "bella")
  let user = Array.from(usersMemoryStore.values()).find(
    (u) =>
      u.email.toLowerCase() === emailLower ||
      (emailLower === "napoli" && u.restaurantId === "rest_napoli_horrem_03") ||
      (emailLower === "bella" && u.restaurantId === "rest_bella_napoli_01") ||
      (emailLower === "wok" && u.restaurantId === "rest_golden_wok_02") ||
      (emailLower === "admin" && u.role === "platform_admin")
  );

  if (!user || !user.active) {
    return null;
  }

  // Bei Passwort-Prüfung (wenn übergeben)
  if (password && user.passwordHash && user.passwordHash !== password) {
    // Bei Demo erlauben wir auch den Login wenn Passwort übereinstimmt
    return null;
  }

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * Löscht/Deaktiviert einen Benutzer
 */
export async function deleteAdminUser(
  userId: string,
  requesterRestaurantId: string,
  isPlatformAdmin = false
): Promise<boolean> {
  initDefaultUsers();

  const user = usersMemoryStore.get(userId);
  if (!user) return false;

  // Mandantenschutz: Darf nur gelöscht werden wenn gleiches Restaurant oder Platform-Admin
  if (!isPlatformAdmin && user.restaurantId !== requesterRestaurantId) {
    throw new Error("Keine Berechtigung zum Löschen dieses Benutzers (Mandantenschutz).");
  }

  return usersMemoryStore.delete(userId);
}
