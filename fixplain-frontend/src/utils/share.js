// ── Share URL compression ─────────────────────────────────────────────────────
// Uses the browser's built-in CompressionStream (gzip) so large analysis
// results don't produce URLs too long for browsers/messaging apps to handle.
// Falls back to plain btoa if CompressionStream is unavailable.
export async function encodeShare(result, language, mode, codeInput = '') {
  try {
    const json = JSON.stringify({ result, language, mode, codeInput, time: Date.now() });
    if (typeof CompressionStream !== 'undefined') {
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      writer.write(new TextEncoder().encode(json));
      writer.close();
      const buf = await new Response(stream.readable).arrayBuffer();
      const bytes = new Uint8Array(buf);
      // URL-safe base64: replace + / with - _  and strip padding
      return btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    // Fallback for older browsers
    return btoa(encodeURIComponent(json)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch { return null; }
}

export async function decodeShare(hash) {
  try {
    // Restore URL-safe base64 padding
    const b64 = hash.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '=='.slice(0, (4 - b64.length % 4) % 4);
    const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
    if (typeof DecompressionStream !== 'undefined') {
      try {
        const stream = new DecompressionStream('gzip');
        const writer = stream.writable.getWriter();
        writer.write(bytes);
        writer.close();
        const text = await new Response(stream.readable).text();
        return JSON.parse(text);
      } catch {
        // Hash might be old uncompressed format — fall through
      }
    }
    // Fallback: try legacy plain btoa format
    return JSON.parse(decodeURIComponent(atob(padded)));
  } catch { return null; }
}
