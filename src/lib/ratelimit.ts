// Best-effort in-memory limiter. On serverless it resets per instance, so it only slows casual abuse;
// the team code and unique-email constraint are the real gates.
const hits = new Map<string, number[]>();

export function rateLimited(key: string, max = 8, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
}
