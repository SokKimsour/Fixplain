import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import pkg from 'js-beautify';
const { js: beautifyJS } = pkg;

dotenv.config();
const app  = express();
app.use(cors());
app.use(express.json());
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Format code based on language ────────────────────────────────────────────
function formatCode(code, language) {
  if (!code || typeof code !== 'string') return code;

  const opts = {
    indent_size: 2,
    indent_char: ' ',
    max_preserve_newlines: 2,
    preserve_newlines: true,
    keep_array_indentation: false,
    break_chained_methods: false,
    brace_style: 'collapse',
    space_before_conditional: true,
    unescape_strings: false,
    jslint_happy: false,
    end_with_newline: false,
    wrap_line_length: 0,
    comma_first: false,
  };

  try {
    switch (language) {
      case 'javascript':
      case 'nodejs':
      case 'typescript':
      case 'java':
      case 'csharp':
      case 'php':
        return beautifyJS(code, opts);
      default:
        // For SQL, Python etc — do basic newline cleanup
        return code
          .replace(/;\s+/g, ';\n')
          .replace(/\{\s+/g, '{\n  ')
          .replace(/\s+\}/g, '\n}');
    }
  } catch {
    return code;
  }
}

// ── Main analysis endpoint ────────────────────────────────────────────────────
app.post('/api/fix', async (req, res) => {
  const { codeInput, language = 'javascript', mode = 'both', locale = 'en' } = req.body;
  if (!codeInput) return res.status(400).json({ error: 'No code provided.' });

  const modeInstruction =
    mode === 'fix'      ? 'Focus ONLY on finding and fixing bugs. Do not refactor beyond what is needed.' :
    mode === 'refactor' ? 'Assume the logic is correct. Focus ONLY on refactoring for readability and efficiency. Do not change function names.' :
                          'Both fix all bugs AND refactor the code for readability and efficiency. Do not change function names.';

  const localeInstruction = locale === 'km'
    ? `IMPORTANT: Write the "explanation" and "improvementSuggestions" fields in Khmer (ភាសាខ្មែរ).`
    : '';

  const systemPrompt = `Act as a world-class ${language} software engineer performing a professional code review.
${modeInstruction}
${localeInstruction}

STRICT RULES — read carefully before responding:

RULE 1 — A "bug" is ONLY one of these real problems:
  - Syntax error that prevents code from running
  - Runtime error (null/undefined dereference, division by zero, index out of bounds, missing await, unhandled rejection)
  - Logic error that produces wrong results
  - Security vulnerability (SQL injection, XSS, unsafe input handling)
  DO NOT report: style preferences, naming conventions, missing comments, performance micro-optimizations, or "could be improved" suggestions as bugs. Those belong in improvementSuggestions only.

RULE 2 — If the code is functional, has no syntax errors, no runtime errors, and no logic errors — return bugsFound as an EMPTY ARRAY and fixedCode as the original code (lightly refactored only if mode includes refactor). Health will show 100.

RULE 3 — Fix EVERY bug you list. If you put it in bugsFound, it MUST be resolved in fixedCode. No partial fixes.

RULE 4 — Self-verify fixedCode before responding:
  After writing fixedCode, re-read it and confirm: no syntax errors, no runtime errors, no logic errors, no security holes. If you find any — fix them before submitting. The goal is that re-analyzing fixedCode returns an empty bugsFound.

RULE 5 — Code formatting: 2-space indentation, real newlines, never a single line.

Respond ONLY in strict JSON with exactly these five keys:

- "bugsFound": array of objects each with:
    - "issue": clear description of the bug
    - "severity": "high" | "medium" | "low"
    - "lineNumber": integer line number or null
  EMPTY ARRAY if code has no real bugs or mode is 'refactor'.

- "fixedCode": fully corrected production-quality code. Every bug in bugsFound must be resolved. Properly indented with real newlines. No markdown fences.

- "commentedCode": fixedCode with JSDoc-style comment above each function (what it does, params, return value). No markdown fences.

- "explanation": plain-language explanation of every change made. If code was already clean, say so clearly. ${locale === 'km' ? 'Write in Khmer (ភាសាខ្មែរ).' : ''}

- "improvementSuggestions": exactly 3 specific actionable tips to further improve this code. ${locale === 'km' ? 'Write in Khmer (ភាសាខ្មែរ).' : ''}`;

  try {
    const chat = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: `Analyze this ${language} code:\n${codeInput}` },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 4096,
    });

    const result = JSON.parse(chat.choices[0].message.content);

    // ── Post-process: format code fields so they're never single-line ──
    if (result.fixedCode)    result.fixedCode    = formatCode(result.fixedCode,    language);
    if (result.commentedCode) result.commentedCode = formatCode(result.commentedCode, language);

    res.json(result);
  } catch (err) {
    console.error('Groq error:', err);
    res.status(500).json({ error: 'AI analysis failed.' });
  }
});

// ── Single bug fix endpoint ───────────────────────────────────────────────────
app.post('/api/fix-single', async (req, res) => {
  const { codeInput, bugIssue, language = 'javascript' } = req.body;
  if (!codeInput || !bugIssue) return res.status(400).json({ error: 'Missing fields.' });

  const systemPrompt = `Act as a world-class ${language} software engineer.
Fix ONLY this specific bug: "${bugIssue}"
- Do not change any other logic or function names.
- Ensure the fix is complete — no partial fixes.
- The fixed code must be production-quality with no new issues introduced.
- Use proper indentation and formatting.
Respond ONLY in strict JSON with one key:
- "fixedCode": the complete code with only that bug fixed. No markdown fences.`;

  try {
    const chat = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: `Code:\n${codeInput}` },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 4096,
    });

    const result = JSON.parse(chat.choices[0].message.content);
    if (result.fixedCode) result.fixedCode = formatCode(result.fixedCode, language);

    res.json(result);
  } catch (err) {
    console.error('Groq error:', err);
    res.status(500).json({ error: 'Fix failed.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Fixplain backend live on port ${PORT}`));
