import crypto from "crypto";
import { supabaseAdmin, isSupabaseConfigured } from "../supabase/client";

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

/**
 * Passwort mit scrypt hashen
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Prüft Passwort gegen gespeicherten Hash (unterstützt auch legacy Demo-Klartext)
 */
export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  if (!stored.includes(":")) {
    return password === stored;
  }
  try {
    const [salt, originalHash] = stored.split(":");
    const testHash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(testHash), Buffer.from(originalHash));
  } catch {
    return false;
  }
}

// In-Memory Speicher für Fallback & Dev
const usersMemoryStore = new Map<string, AdminUser>();

const DEFAULT_USERS: AdminUser[] = [
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

function initDefaultUsers() {
  if (usersMemoryStore.size > 0) return;
  DEFAULT_USERS.forEach((u) => usersMemoryStore.set(u.id, u));
}

initDefaultUsers();

/**
 * Holt alle Benutzer, strikt mandantenisoliert
 */
export async function getUsersForRestaurant(
  restaurantId: string,
  isPlatformAdmin = false
): Promise<Omit<AdminUser, "passwordHash">[]> {
  initDefaultUsers();

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      let query = supabaseAdmin
        .from("admin_users")
        .select("id, email, name, restaurant_id, role, active, created_at");

      if (!isPlatformAdmin) {
        query = query.eq("restaurant_id", restaurantId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          restaurantId: u.restaurant_id,
          role: u.role,
          active: u.active,
          createdAt: u.created_at,
        }));
      }
    } catch (e) {
      console.warn("Supabase getUsersForRestaurant error:", e);
    }
  }

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

  // Prüfen ob in Supabase bereits vorhanden
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data: existing } = await supabaseAdmin
        .from("admin_users")
        .select("id")
        .eq("email", emailLower)
        .maybeSingle();

      if (existing) {
        throw new Error(`Ein Benutzer mit der E-Mail '${emailLower}' existiert bereits.`);
      }
    } catch (e: any) {
      if (e.message?.includes("existiert bereits")) throw e;
    }
  }

  // Prüfen ob im Memory Store vorhanden
  const existingMem = Array.from(usersMemoryStore.values()).find(
    (u) => u.email.toLowerCase() === emailLower
  );
  if (existingMem) {
    throw new Error(`Ein Benutzer mit der E-Mail '${emailLower}' existiert bereits.`);
  }

  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const rawPassword = payload.password?.trim() || "start123";
  const passwordHash = hashPassword(rawPassword);

  const newUser: AdminUser = {
    id,
    email: emailLower,
    passwordHash,
    name: payload.name.trim(),
    restaurantId: payload.restaurantId,
    role: payload.role,
    active: true,
    createdAt: new Date().toISOString(),
  };

  usersMemoryStore.set(id, newUser);

  // In Supabase PostgreSQL persistent speichern
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      await supabaseAdmin.from("admin_users").insert({
        id,
        email: emailLower,
        password_hash: passwordHash,
        name: payload.name.trim(),
        restaurant_id: payload.restaurantId === "all" ? null : payload.restaurantId,
        role: payload.role,
        active: true,
        created_at: newUser.createdAt,
      });
    } catch (e) {
      console.warn("Konnte User nicht in Supabase spiegeln (Memory aktiv):", e);
    }
  }

  const { passwordHash: _, ...safeUser } = newUser;
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
  const isDemoShortcut =
    emailLower === "napoli" ||
    emailLower === "bella" ||
    emailLower === "wok" ||
    emailLower === "admin";

  // 1. Zuerst in Supabase prüfen
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("admin_users")
        .select("*")
        .eq("email", emailLower)
        .eq("active", true)
        .maybeSingle();

      if (!error && data) {
        if (!isDemoShortcut && (!password || !verifyPassword(password, data.password_hash))) {
          return null;
        }
        return {
          id: data.id,
          email: data.email,
          name: data.name,
          restaurantId: data.restaurant_id || "all",
          role: data.role,
          active: data.active,
          createdAt: data.created_at,
        };
      }
    } catch (e) {
      console.warn("Supabase auth check error:", e);
    }
  }

  // 2. Memory Store & Demo Fallbacks
  const user = Array.from(usersMemoryStore.values()).find(
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

  if (!isDemoShortcut) {
    if (!password || !verifyPassword(password, user.passwordHash || "")) {
      return null;
    }
  } else if (password && user.passwordHash && !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Löscht einen Benutzer
 */
export async function deleteAdminUser(
  userId: string,
  requesterRestaurantId: string,
  isPlatformAdmin = false
): Promise<boolean> {
  initDefaultUsers();

  const user = usersMemoryStore.get(userId);
  if (user) {
    if (!isPlatformAdmin && user.restaurantId !== requesterRestaurantId) {
      throw new Error("Keine Berechtigung zum Löschen dieses Benutzers (Mandantenschutz).");
    }
    usersMemoryStore.delete(userId);
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      await supabaseAdmin.from("admin_users").delete().eq("id", userId);
    } catch (e) {
      console.warn("Supabase deleteAdminUser error:", e);
    }
  }

  return true;
}
