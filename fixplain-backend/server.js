import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import pkg from 'js-beautify';
const { js: beautifyJS } = pkg;

dotenv.config();
const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

// ── Provider clients ──────────────────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Cerebras and Gemini use native fetch — no extra SDK needed
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

// ── Provider 1: Groq (LLaMA 3.3 70b) ─────────────────────────────────────────
async function callGroq(systemPrompt, userMessage) {
  const chat = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' },
    temperature: 0,
    max_tokens: 4096,
  });
  return safeParseJSON(chat.choices[0].message.content);
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
        { role: 'user', content: userMessage },
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

// ── Provider 3: Gemini 2.0 Flash ─────────────────────────────────────────────
async function callGemini(systemPrompt, userMessage) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 4096,
          response_mime_type: 'application/json',
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return safeParseJSON(text);
}

// ── Fallback chain: Groq → Cerebras → Gemini ─────────────────────────────────
// Tries each provider in order. On failure, logs the error and moves to next.
// Returns { result, provider } so the endpoint knows which one was used.
async function callWithFallback(systemPrompt, userMessage) {
  const providers = [
    { name: 'Gemini', fn: () => callGemini(systemPrompt, userMessage) },
    { name: 'Groq', fn: () => callGroq(systemPrompt, userMessage) },
    { name: 'Cerebras', fn: () => callCerebras(systemPrompt, userMessage) },
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
    groq: !!process.env.GROQ_API_KEY,
    cerebras: !!CEREBRAS_API_KEY,
    gemini: !!GEMINI_API_KEY,
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
    ? `IMPORTANT: Write the "explanation" and "improvementSuggestions" fields in Khmer (ភាសាខ្មែរ).`
    : '';

  const previousBugsInstruction = Array.isArray(previousBugs) && previousBugs.length > 0
    ? `\nPREVIOUS ANALYSIS CONTEXT: A prior review already identified these bugs. Do NOT re-report them if resolved:\n${previousBugs.map((b, i) => `  ${i + 1}. ${b}`).join('\n')}`
    : '';

  const systemPrompt = `Act as a world-class ${language} software engineer performing a professional code review.
${modeInstruction}
${localeInstruction}
${previousBugsInstruction}

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

Respond ONLY in strict JSON with exactly these five keys:
- "bugsFound": array of objects each with "issue" (string), "severity" ("high"|"medium"|"low"), "lineNumber" (integer or null). EMPTY ARRAY if no real bugs or mode is 'refactor'.
- "fixedCode": fully corrected production-quality code. No markdown fences.
- "commentedCode": fixedCode with JSDoc-style comment above each function. No markdown fences.
- "explanation": plain-language explanation of every change. ${locale === 'km' ? 'Write in Khmer (ភាសាខ្មែរ).' : ''}
- "improvementSuggestions": exactly 3 specific actionable tips. ${locale === 'km' ? 'Write in Khmer (ភាសាខ្មែរ).' : ''}`;

  try {
    const { result, provider } = await callWithFallback(
      systemPrompt,
      `Analyze this ${language} code:\n${codeInput}`
    );

    if (result.fixedCode) result.fixedCode = formatCode(result.fixedCode, language);
    if (result.commentedCode) result.commentedCode = formatCode(result.commentedCode, language);

    // Tell the frontend which provider answered — shown in the status bar
    result._provider = provider;

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Fixplain backend live on port ${PORT}`);
  console.log(`Providers: Groq=${!!process.env.GROQ_API_KEY} | Cerebras=${!!CEREBRAS_API_KEY} | Gemini=${!!GEMINI_API_KEY}`);
});