// In-memory per-IP rate-limiter (per warm Vercel instance).
// For multi-instance global enforcement use Upstash/Redis or Vercel KV.
//
// Limits and window match the production api/generate.js exactly:
//   10 requests / 60 seconds, per IP.
const RL_WINDOW_MS = 60_000;
const RL_MAX = 10;
const MAX_BUCKET_SIZE = 2000;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Override Date.now() — used by tests to simulate window expiry. */
  readonly now?: number;
}

/** Returns true when the request is allowed, false when rate-limited. */
export function checkRateLimit(ip: string, opts?: RateLimitOptions): boolean {
  const now = opts?.now ?? Date.now();

  // Periodic cleanup so the Map cannot grow unbounded across warm-instance lifetime.
  if (buckets.size > MAX_BUCKET_SIZE) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt < now) buckets.delete(key);
    }
  }

  const existing = buckets.get(ip);
  if (!existing || existing.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + RL_WINDOW_MS });
    return true;
  }
  if (existing.count >= RL_MAX) return false;
  existing.count++;
  return true;
}

/** Test-only: clears all in-memory buckets so tests don't bleed into one another. */
export function __resetRateLimitForTest(): void {
  buckets.clear();
}

export const RATE_LIMIT_CONFIG = {
  windowMs: RL_WINDOW_MS,
  maxPerWindow: RL_MAX,
} as const;
