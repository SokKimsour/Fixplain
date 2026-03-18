import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { js as beautifyJS, css as beautifyCSS } from 'js-beautify';

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

ANALYSIS RULES — follow these strictly:

1. ONLY report real bugs. If the code is already secure, functional, and well-written — return an empty bugsFound array. Do NOT invent or nitpick issues that do not exist.
2. If the input code is already clean and correct, fixedCode should be the same code (or only lightly refactored if mode includes refactor). Do not add unnecessary changes.
3. If bugs DO exist, fix ALL of them completely — zero bugs should remain in fixedCode.
4. Security: fix SQL injection, null pointer risks, division by zero, index out of bounds, unhandled promises, and any dangerous patterns.
5. The fixedCode must be production-quality — if a user re-analyzes it, it should score 95–100 with zero high or medium bugs.
6. Use correct indentation (2 spaces), proper formatting, and real newlines. Never return code as a single line.

Respond ONLY in strict JSON with exactly these five keys:

- "bugsFound": array of objects each with:
    - "issue": clear description of the bug
    - "severity": "high" | "medium" | "low"
    - "lineNumber": integer line number (best estimate) or null
  Return an EMPTY ARRAY if the code has no real bugs, or if mode is 'refactor'.

- "fixedCode": production-quality corrected code with proper indentation and newlines. No markdown fences. If code was already correct, return it as-is (or lightly refactored).

- "commentedCode": fixedCode with a JSDoc-style comment above each function explaining what it does, its parameters, and return value. No markdown fences.

- "explanation": plain-language explanation of what was changed and why. If nothing was wrong, say so clearly. ${locale === 'km' ? 'Write in Khmer (ភាសាខ្មែរ).' : ''}

- "improvementSuggestions": exactly 3 specific, actionable tips to further improve this code. ${locale === 'km' ? 'Write in Khmer (ភាសាខ្មែរ).' : ''}`;

  try {
    const chat = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: `Analyze this ${language} code:\n${codeInput}` },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.1,
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
      temperature: 0.1,
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
