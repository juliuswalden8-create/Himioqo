type Bucket = { count: number; resetAt: number };

const globalForLimit = globalThis as unknown as { __hqRate?: Map<string, Bucket> };

function buckets() {
  if (!globalForLimit.__hqRate) globalForLimit.__hqRate = new Map();
  return globalForLimit.__hqRate;
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const map = buckets();
  const current = map.get(key);
  if (!current || current.resetAt < now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAt: now + windowMs };
  }
  if (current.count >= limit) {
    return { ok: false, remaining: 0, retryAt: current.resetAt };
  }
  current.count += 1;
  return { ok: true, remaining: limit - current.count, retryAt: current.resetAt };
}
