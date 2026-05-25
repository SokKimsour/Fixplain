// ── Safe JSON parse — strips markdown fences some models accidentally add ─────
export function safeParseJSON(text) {
  if (!text) throw new Error('Empty response from model');
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}

// ── Timeout wrapper for Promises ─────────────────────────────────────────────
export function withTimeout(promise, ms, name) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${name} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

// ── Simple string hashing for cache keys ──────────────────────────────────────
export function hashKey(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return h.toString(36);
}
