import { NextRequest } from "next/server";

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

const LIMITS: Record<string, RateLimitConfig> = {
  order: {
    maxRequests: 10, // Max 10 Bestellungen pro Minute pro IP
    windowSeconds: 60,
  },
  adminAuth: {
    maxRequests: 5, // Max 5 fehlgeschlagene Login-Versuche pro 15 Minuten
    windowSeconds: 15 * 60,
  },
  general: {
    maxRequests: 60,
    windowSeconds: 60,
  },
};

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-Memory Speicher für IP-Anfragen (Skaliert mit Server-Laufzeit)
const ipRequestStore = new Map<string, RateLimitRecord>();

/**
 * Ermittelt die Client-IP aus Standard-Proxy-Headern
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Prüft das Rate-Limit für eine bestimmte Aktion (z. B. 'order' oder 'adminAuth').
 * Liefert { allowed: true } oder { allowed: false, retryAfterSeconds: number }.
 */
export function checkRateLimit(
  req: NextRequest,
  action: "order" | "adminAuth" | "general" = "order",
  customKey?: string
): { allowed: boolean; retryAfterSeconds?: number; currentCount: number } {
  // In Testumgebung Rate-Limiter nicht blockieren, außer explizit angefordert
  if (process.env.NODE_ENV === "test" && !customKey?.startsWith("test_ratelimit_")) {
    return { allowed: true, currentCount: 1 };
  }

  const config = LIMITS[action] || LIMITS.general;
  const ip = customKey || getClientIp(req);
  const cacheKey = `${action}:${ip}`;
  const now = Date.now();

  const existing = ipRequestStore.get(cacheKey);

  if (!existing || now > existing.resetAt) {
    ipRequestStore.set(cacheKey, {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    });
    return { allowed: true, currentCount: 1 };
  }

  if (existing.count >= config.maxRequests) {
    const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
      currentCount: existing.count,
    };
  }

  existing.count += 1;
  return { allowed: true, currentCount: existing.count };
}

/**
 * Setzt den Rate-Limit-Speicher zurück (wichtig für Unittests)
 */
export function resetRateLimitStore(): void {
  ipRequestStore.clear();
}
