import crypto from "crypto";
import { NextRequest } from "next/server";
import { UserRole } from "./users-store";

const SESSION_SECRET =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "gastro-order-fallback-secret-2026";

export interface AdminSession {
  userId: string;
  email: string;
  restaurantId: string;
  role: UserRole;
  isPlatformAdmin: boolean;
  expiresAt: number;
}

/**
 * Erstellt einen kryptographisch signierten Session-Token
 */
export function createSessionToken(payload: {
  userId: string;
  email: string;
  restaurantId: string;
  role: UserRole;
  expiresInDays?: number;
}): string {
  const expiresInDays = payload.expiresInDays || 7;
  const expiresAt = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;

  const data = JSON.stringify({
    uid: payload.userId,
    em: payload.email,
    rid: payload.restaurantId,
    rol: payload.role,
    exp: expiresAt,
  });

  const b64Data = Buffer.from(data, "utf-8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(b64Data)
    .digest("base64url");

  return `${b64Data}.${signature}`;
}

/**
 * Validiert einen Session-Token
 */
export function verifySessionToken(token: string): AdminSession | null {
  if (!token || !token.includes(".")) return null;

  try {
    const [b64Data, signature] = token.split(".");
    const expectedSig = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(b64Data)
      .digest("base64url");

    if (
      signature.length !== expectedSig.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
    ) {
      return null;
    }

    const json = Buffer.from(b64Data, "base64url").toString("utf-8");
    const parsed = JSON.parse(json);

    if (!parsed.exp || parsed.exp < Date.now()) {
      return null;
    }

    return {
      userId: parsed.uid,
      email: parsed.em,
      restaurantId: parsed.rid,
      role: parsed.rol,
      isPlatformAdmin: parsed.rol === "platform_admin" || parsed.rid === "all",
      expiresAt: parsed.exp,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Extrahiert und validiert die Session aus einem NextRequest (Cookie oder Header)
 */
export function getAdminSession(req: NextRequest): AdminSession | null {
  // 1. Aus Authorization Bearer Header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.substring(7).trim();
    const session = verifySessionToken(token);
    if (session) return session;
  }

  // 2. Aus Cookie
  const cookie = req.cookies.get("gastro_admin_session");
  if (cookie?.value) {
    const session = verifySessionToken(cookie.value);
    if (session) return session;
  }

  return null;
}
