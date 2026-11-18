// noir-debt: in-memory per-instance throttle — cukup untuk "basic rate limit" di rubrik,
// tapi tidak persist antar instance serverless. Upgrade ke Upstash Redis saat butuh limit global.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit = 5, windowMs = 10_000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
