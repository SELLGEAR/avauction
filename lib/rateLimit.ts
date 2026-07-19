// Sliding-window in-memory rate limiter.
//
// LIMITATION: per-serverless-instance only — on Vercel each warm lambda has
// its own window, so the effective global limit is (limit x instances).
// Good enough as a first line of defense for phase 1; move to a shared
// store (Upstash Redis) before launch if bid endpoint abuse shows up.
// Tracked in the pre-launch security checklist alongside the gauge API
// rate limits.

const windows = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (windows.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    windows.set(key, hits);
    return false;
  }
  hits.push(now);
  windows.set(key, hits);
  // Opportunistic cleanup so the map doesn't grow unbounded
  if (windows.size > 10_000) {
    for (const [k, v] of windows) {
      if (v.every((t) => t <= cutoff)) windows.delete(k);
    }
  }
  return true;
}
