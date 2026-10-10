import { getKeyValueStore } from "@/lib/store/kv";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
}

/**
 * Fixed-window rate limiter keyed by an arbitrary scope string (e.g.
 * `ip:1.2.3.4` or `room:ABC123`). Default: 12 AI calls per minute, per the
 * brief's free-tier guidance. Vision gets a tighter limit at the call site.
 */
export async function checkRateLimit(
  scope: string,
  limit = 12,
  windowSeconds = 60,
): Promise<RateLimitResult> {
  const store = getKeyValueStore();
  const windowId = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = `ratelimit:${scope}:${windowId}`;
  const count = await store.incrWithTtl(key, windowSeconds);
  return { allowed: count <= limit, limit, remaining: Math.max(0, limit - count) };
}

/** Best-effort client IP extraction from standard proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
