import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import pkg from 'js-beautify';
const { js: beautifyJS } = pkg;

dotenv.config();
const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

// ── Groq multi-key round-robin ────────────────────────────────────────────────
// Supports GROQ_API_KEY (single) or GROQ_API_KEY_1 ... GROQ_API_KEY_5 (multi).
// Collects ALL valid keys first, then creates one Groq client per key.
const groqKeys = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
  process.env.GROQ_API_KEY_5,
].filter(Boolean); // removes undefined / empty strings

// Create clients only after all keys are collected
const groqClients = groqKeys.map(key => new Groq({ apiKey: key }));
let groqIndex = 0;

function nextGroqClient() {
  if (!groqClients.length) throw new Error('No Groq API keys configured');
  const client = groqClients[groqIndex];
  groqIndex = (groqIndex + 1) % groqClients.length;
  return client;
}

// ── Other provider clients ────────────────────────────────────────────────────
const genai            = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;

// ── Rate limiter (10 req / min per IP) ───────────────────────────────────────
const rateLimitMap = new Map();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 10;

function rateLimiter(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };

  if (now - entry.start > RATE_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return next();
  }
  entry.count++;
  rateLimitMap.set(ip, entry);

  if (entry.count > RATE_MAX) {
    return res.status(429).json({
      error: `Rate limit reached. You can make ${RATE_MAX} requests per minute. Please wait a moment.`,
    });
  }
  next();
}

setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  for (const [ip, entry] of rateLimitMap) {
    if (entry.start < cutoff) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

// ── Simple in-memory response cache ──────────────────────────────────────────
// Caches results for identical (code+language+mode+locale) combos for 10 min.
// Saves API quota when multiple users paste the same example snippets.
const responseCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

function hashKey(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = Math.imul(31, h) + str.charCodeAt(i) | 0; }
  return h.toString(36);
}

function getCached(key) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { responseCache.delete(key); return null; }
  return entry.data;
}

setInterval(() => {
  const cutoff = Date.now() - CACHE_TTL_MS;
  for (const [k, v] of responseCache) { if (v.ts < cutoff) responseCache.delete(k); }
}, 5 * 60 * 1000);

// ── Input size guard ──────────────────────────────────────────────────────────
const MAX_CODE_CHARS = 12000;

// ── Format code ───────────────────────────────────────────────────────────────
function formatCode(code, language) {
  if (!code || typeof code !== 'string') return code;
  const opts = {
    indent_size: 2, indent_char: ' ', max_preserve_newlines: 2,
    preserve_newlines: true, keep_array_indentation: false,
    break_chained_methods: false, brace_style: 'collapse',
    space_before_conditional: true, unescape_strings: false,
    jslint_happy: false, end_with_newline: false,
    wrap_line_length: 0, comma_first: false,
  };
  try {
    switch (language) {
      case 'javascript': case 'nodejs': case 'typescript':
      case 'java': case 'csharp': case 'php':
        return beautifyJS(code, opts);
      default:
        return code
          .replace(/;\s+/g, ';\n')
          .replace(/\{\s+/g, '{\n  ')
          .replace(/\s+\}/g, '\n}');
    }
  } catch { return code; }
}

// ── Safe JSON parse — strips markdown fences some models accidentally add ─────
function safeParseJSON(text) {
  if (!text) throw new Error('Empty response from model');
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}

// ── Provider 1: Groq — round-robin across multiple keys ───────────────────────
async function callGroq(systemPrompt, userMessage) {
  if (!groqClients.length) throw new Error('No Groq API keys configured');

  // Try every key once before giving up — if the current key is rate-limited,
  // the next key in the rotation might still have quota.
  const attempts = groqClients.length;
  let lastError;

  for (let i = 0; i < attempts; i++) {
    const client = nextGroqClient();
    try {
      const chat = await withTimeout(
        client.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userMessage  },
          ],
          model: 'llama-3.3-70b-versatile',
          response_format: { type: 'json_object' },
          temperature: 0,
          max_tokens: 4096,
        }),
        PROVIDER_TIMEOUT_MS,
        `Groq key ${i + 1}`
      );
      return safeParseJSON(chat.choices[0].message.content);
    } catch (err) {
      lastError = err;
      // 429 = rate limited — try the next key immediately
      // Any other error — also try next key (key might be invalid/expired)
      console.warn(`[Groq] Key ${groqIndex} failed: ${err.message}`);
    }
  }

  throw new Error(`All Groq keys failed: ${lastError?.message}`);
}

// ── Provider 2: Cerebras (LLaMA 3.3 70b — same model, different infra) ───────
async function callCerebras(systemPrompt, userMessage) {
  if (!CEREBRAS_API_KEY) throw new Error('CEREBRAS_API_KEY not set');

  const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage  },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cerebras ${res.status}: ${err}`);
  }
  const data = await res.json();
  return safeParseJSON(data.choices[0].message.content);
}

// ── Provider 3: Gemini 2.5 Flash (official @google/genai SDK) ────────────────
async function callGemini(systemPrompt, userMessage) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

  const response = await genai.models.generateContent({
    model: 'gemini-2.5-flash-preview-04-17',
    contents: `${systemPrompt}\n\n${userMessage}`,
    config: {
      temperature: 0,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  });

  return safeParseJSON(response.text);
}

// ── Fallback chain: Groq → Cerebras → Gemini ─────────────────────────────────
// Each provider gets 20s before we give up and try the next one.
const PROVIDER_TIMEOUT_MS = 20000;

function withTimeout(promise, ms, name) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${name} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

async function callWithFallback(systemPrompt, userMessage) {
  const providers = [
    { name: 'Groq',     fn: () => withTimeout(callGroq(systemPrompt, userMessage),     PROVIDER_TIMEOUT_MS, 'Groq')     },
    { name: 'Cerebras', fn: () => withTimeout(callCerebras(systemPrompt, userMessage), PROVIDER_TIMEOUT_MS, 'Cerebras') },
    { name: 'Gemini',   fn: () => withTimeout(callGemini(systemPrompt, userMessage),   PROVIDER_TIMEOUT_MS, 'Gemini')   },
  ];

  const errors = [];

  for (const provider of providers) {
    try {
      console.log(`[AI] Trying ${provider.name}...`);
      const result = await provider.fn();
      console.log(`[AI] ✓ ${provider.name} succeeded`);
      return { result, provider: provider.name };
    } catch (err) {
      console.warn(`[AI] ✗ ${provider.name} failed: ${err.message}`);
      errors.push(`${provider.name}: ${err.message}`);
    }
  }

  throw new Error(`All AI providers failed.\n${errors.join('\n')}`);
}

// ── Health / ping (wakes Render from sleep) ───────────────────────────────────
app.get('/api/ping', (req, res) => res.json({ ok: true }));

// ── Provider status (useful for debugging on Render logs) ─────────────────────
app.get('/api/status', (_req, res) => {
  res.json({
    groq:     groqClients.length > 0,
    groqKeys: groqClients.length,
    cerebras: !!CEREBRAS_API_KEY,
    gemini:   !!process.env.GEMINI_API_KEY,
  });
});

// ── Main analysis endpoint ────────────────────────────────────────────────────
app.post('/api/fix', rateLimiter, async (req, res) => {
  const {
    codeInput,
    language = 'javascript',
    mode = 'both',
    locale = 'en',
    previousBugs = [],
    wasAlreadyFixed = false,
  } = req.body;

  if (!codeInput) return res.status(400).json({ error: 'No code provided.' });
  if (codeInput.length > MAX_CODE_CHARS) {
    return res.status(400).json({
      error: `Code exceeds the ${MAX_CODE_CHARS.toLocaleString()} character limit. Please split into smaller sections.`,
    });
  }

  const modeInstruction =
    mode === 'fix'
      ? 'Focus ONLY on finding and fixing bugs. Do not refactor beyond what is needed.'
      : mode === 'refactor'
      ? 'Assume the logic is correct. Focus ONLY on refactoring for readability and efficiency. Do not change function names.'
      : 'Both fix all bugs AND refactor the code for readability and efficiency. Do not change function names.';

  const localeInstruction = locale === 'km'
    ? `IMPORTANT — KHMER LANGUAGE: Write ALL user-facing text in Khmer (ភាសាខ្មែរ). This includes:
  - Every "issue" string in bugsFound (e.g. "SQL injection vulnerability" → "ភាពងាយរងគ្រោះ SQL injection")
  - The "explanation" field
  - Every item in "improvementSuggestions"
  CRITICAL: Do NOT translate string literals, variable names, function names, or any actual code content inside fixedCode or commentedCode. Only JSDoc comment text above functions may be in Khmer. Code must remain valid and unchanged.`
    : '';

  const previousBugsInstruction = Array.isArray(previousBugs) && previousBugs.length > 0
    ? `\nPREVIOUS ANALYSIS CONTEXT: A prior review already identified these bugs. Do NOT re-report them if resolved:\n${previousBugs.map((b, i) => `  ${i + 1}. ${b}`).join('\n')}`
    : '';

  const alreadyFixedInstruction = wasAlreadyFixed
    ? `\nIMPORTANT: This code was already processed and fixed by a previous AI analysis. It should be clean. Apply RULE 1 very strictly — only report genuine remaining bugs. If in doubt, do NOT report it. The expected result is bugsFound = [] and health = 100.`
    : '';

  const systemPrompt = `Act as a world-class ${language} software engineer performing a professional code review.
${modeInstruction}
${localeInstruction}
${previousBugsInstruction}
${alreadyFixedInstruction}

OUTPUT FORMAT — THIS IS CRITICAL:
You must respond with ONLY a valid JSON object. No preamble. No explanation before or after. No markdown fences. No code blocks. No "Here is..." text. Start your response with { and end with }. Nothing else.

STRICT RULES — read carefully before responding:

RULE 1 — A "bug" is ONLY one of these real problems:
  - Syntax error that prevents code from running
  - Runtime error (null/undefined dereference, division by zero, index out of bounds, missing await, unhandled rejection)
  - Logic error that produces wrong results
  - Security vulnerability (SQL injection, XSS, unsafe input handling)
  DO NOT report: style preferences, naming conventions, missing comments, performance micro-optimizations, or "could be improved" suggestions as bugs. Those belong in improvementSuggestions only.

RULE 2 — If the code is functional with no real bugs — return bugsFound as an EMPTY ARRAY and fixedCode as the original code (lightly refactored only if mode includes refactor). Health will show 100.

RULE 3 — Fix EVERY bug you list. If you put it in bugsFound, it MUST be resolved in fixedCode. No partial fixes.

RULE 4 — Self-verify fixedCode before responding:
  Re-read fixedCode line by line and confirm: no syntax errors, no runtime errors, no logic errors, no security holes, every listed bug is resolved. Fix anything remaining before submitting.

RULE 5 — Code formatting: 2-space indentation, real newlines, never a single line.

RULE 6 — Confidence and severity must be consistent:
  - If confidence < 70, do NOT include the bug in bugsFound at all.
  - If confidence 70–89, use "low" or "medium" severity only — never "high".
  - If confidence ≥ 90, any severity is appropriate.
  This prevents inflating the bug count with uncertain findings that lower the health score unfairly.

SEVERITY DEFINITIONS — use these exact criteria, no exceptions:
  "high"   = bugs that WILL cause a crash, data loss, or security breach at runtime. Examples: SQL injection, missing await on async call, null dereference, division by zero, assignment instead of comparison (= vs ===).
            → Each high bug deducts 25 points from the health score (100 − 25 per high bug).
  "medium" = bugs that produce WRONG results silently without crashing. Examples: off-by-one errors, wrong operator (=+ instead of +=), unhandled error callbacks, logic that returns incorrect values.
            → Each medium bug deducts 12 points from the health score.
  "low"    = code that works but has a clear quality issue. Examples: unused variables, unreachable code, redundant conditions.
            → Low bugs do NOT affect the health score — they are informational only.
  NEVER use "high" for style issues. NEVER use "low" for runtime crashes. The severity must match these definitions exactly — health score accuracy depends on it.
  CONSISTENCY CHECK: before assigning severity, ask yourself "will this crash at runtime?" → high. "Will this give wrong output silently?" → medium. "Does it still work correctly?" → low.

Respond ONLY in strict JSON with exactly these five keys:
- "bugsFound": array of objects each with:
    - "issue": (${locale === 'km' ? 'string in Khmer (ភាសាខ្មែរ)' : 'string'})
    - "severity": ("high"|"medium"|"low")
    - "lineNumber": (integer or null)
    - "confidence": (integer 0-100 — only report bugs with confidence ≥ 70). EMPTY ARRAY if no real bugs or mode is 'refactor'.
- "fixedCode": fully corrected production-quality code. No markdown fences.
- "commentedCode": fixedCode with JSDoc-style comment above each function. No markdown fences.
- "explanation": plain-language explanation referencing specific line numbers for each change. If code was already clean say so clearly. ${locale === 'km' ? 'Write in Khmer (ភាសាខ្មែរ).' : ''}
- "improvementSuggestions": array of exactly 3 objects, each with:
    - "tip": the actionable suggestion text. ${locale === 'km' ? 'Write in Khmer (ភាសាខ្មែរ).' : ''}
    - "youtubeQuery": a short English search query (4-6 words) for a YouTube tutorial. Always English. Example: "javascript async await explained", "python error handling best practices".
    - "mdnQuery": a short English search query (3-5 words) for MDN Web Docs. Always English. Example: "Promise async await", "array methods javascript".`;

  try {
    // Check cache first — skip if wasAlreadyFixed (re-analysis context matters)
    const cacheKey = hashKey(`${language}:${mode}:${locale}:${codeInput}`);
    if (!wasAlreadyFixed && previousBugs.length === 0) {
      const cached = getCached(cacheKey);
      if (cached) {
        console.log('[Cache] Hit');
        return res.json({ ...cached, _provider: 'Cache' });
      }
    }

    const { result, provider } = await callWithFallback(
      systemPrompt,
      `Analyze this ${language} code:\n${codeInput}`
    );

    if (result.fixedCode)     result.fixedCode     = formatCode(result.fixedCode,     language);
    if (result.commentedCode) result.commentedCode = formatCode(result.commentedCode, language);
    result._provider = provider;

    // Store in cache
    if (!wasAlreadyFixed) responseCache.set(cacheKey, { data: result, ts: Date.now() });

    res.json(result);
  } catch (err) {
    console.error('All providers failed:', err.message);
    res.status(500).json({ error: 'AI analysis failed. All providers are currently unavailable.' });
  }
});

// ── Single bug fix endpoint ───────────────────────────────────────────────────
app.post('/api/fix-single', rateLimiter, async (req, res) => {
  const { codeInput, bugIssue, language = 'javascript' } = req.body;
  if (!codeInput || !bugIssue) return res.status(400).json({ error: 'Missing fields.' });
  if (codeInput.length > MAX_CODE_CHARS) return res.status(400).json({ error: 'Code exceeds size limit.' });

  const systemPrompt = `Act as a world-class ${language} software engineer.
Fix ONLY this specific bug: "${bugIssue}"

OUTPUT FORMAT — THIS IS CRITICAL:
Respond with ONLY a valid JSON object. No preamble. No explanation before or after. No markdown fences. Start with { and end with }. Nothing else.

STRICT RULES:
- Do not change any other logic, function names, or variable names.
- Ensure the fix is complete — no partial fixes.
- Do not introduce any new bugs or issues while fixing.
- Self-verify: after writing fixedCode, re-read it and confirm the bug is resolved and no new issues exist.
- Use proper 2-space indentation and formatting.
- The fixed code must be production-quality with no syntax errors, runtime errors, or logic errors.

Respond ONLY in strict JSON with one key:
- "fixedCode": the complete code with only that specific bug fixed. No markdown fences.`;

  try {
    const { result, provider } = await callWithFallback(systemPrompt, `Code:\n${codeInput}`);
    if (result.fixedCode) result.fixedCode = formatCode(result.fixedCode, language);
    result._provider = provider;
    res.json(result);
  } catch (err) {
    console.error('All providers failed:', err.message);
    res.status(500).json({ error: 'Fix failed. All providers are currently unavailable.' });
  }
});


// ── YouTube video search endpoint ─────────────────────────────────────────────
// Calls YouTube Data API v3 to find 1 relevant video for a given query.
// Returns videoId, title, thumbnail, channelTitle, viewCount.
app.get('/api/youtube', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query' });
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return res.status(503).json({ error: 'YouTube API not configured' });

  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=1&relevanceLanguage=en&key=${key}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) throw new Error(`YouTube API ${searchRes.status}`);
    const searchData = await searchRes.json();

    const item = searchData.items?.[0];
    if (!item) return res.json({ video: null });

    const videoId = item.id?.videoId;
    const snippet = item.snippet;

    // Get view count via videos endpoint
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${key}`;
    const statsRes = await fetch(statsUrl);
    const statsData = await statsRes.json();
    const viewCount = statsData.items?.[0]?.statistics?.viewCount || null;

    res.json({
      video: {
        videoId,
        title:        snippet.title,
        channel:      snippet.channelTitle,
        thumbnail:    snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
        viewCount:    viewCount ? parseInt(viewCount).toLocaleString() : null,
        url:          `https://www.youtube.com/watch?v=${videoId}`,
      }
    });
  } catch (err) {
    console.error('[YouTube]', err.message);
    res.status(500).json({ error: 'YouTube search failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Fixplain backend live on port ${PORT}`);
  console.log(`Providers: Groq=${groqClients.length} keys | Cerebras=${!!CEREBRAS_API_KEY} | Gemini=${!!process.env.GEMINI_API_KEY}`);
});
