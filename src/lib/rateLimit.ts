/**
 * Simple in-memory sliding-window rate limiter.
 * Works for a local single-process deployment (Next.js dev / prod server).
 */

interface RateLimitWindow {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitWindow>();

// Prune expired entries every 5 minutes to avoid unbounded memory growth
const pruneInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, win] of store) {
    if (win.resetAt < now) store.delete(key);
  }
}, 5 * 60_000);

// Don't keep the process alive just for cleanup
if (pruneInterval.unref) pruneInterval.unref();

/**
 * Check whether a key is within its rate limit.
 *
 * @param key      Unique identifier, e.g. `"127.0.0.1:invoices:POST"`
 * @param limit    Max requests allowed per window (default 60)
 * @param windowMs Window duration in milliseconds (default 60 000 = 1 min)
 */
export function checkRateLimit(
  key: string,
  limit = 60,
  windowMs = 60_000
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const win = store.get(key);

  if (!win || win.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (win.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: win.resetAt - now };
  }

  win.count++;
  return { allowed: true, remaining: limit - win.count, retryAfterMs: 0 };
}

/**
 * Derive a stable rate-limit key from a Next.js / Web Request.
 * Uses X-Forwarded-For if present (proxy), otherwise falls back to "local".
 */
export function rateLimitKey(req: Request, suffix = ""): string {
  const ip =
    (req.headers as Headers).get("x-forwarded-for")?.split(",")[0].trim() ??
    "local";
  return suffix ? `${ip}:${suffix}` : ip;
}
