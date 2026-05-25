export const responseCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

export function getCached(key) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCached(key, data) {
  responseCache.set(key, { data, ts: Date.now() });
}

// Clean up expired cache items every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - CACHE_TTL_MS;
  for (const [k, v] of responseCache) {
    if (v.ts < cutoff) responseCache.delete(k);
  }
}, 5 * 60 * 1000);
