import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();
const app  = express();
app.use(cors());
app.use(express.json());
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

  const systemPrompt = `Act as a senior ${language} software engineer with 10 years of experience.
${modeInstruction}
${localeInstruction}

IMPORTANT: All code fields must be properly formatted with real newlines and correct indentation — never return code as a single line.

Respond ONLY in strict JSON with exactly these five keys:

- "bugsFound": array of objects, each with:
    - "issue": string describing the bug
    - "severity": "high" | "medium" | "low"
    - "lineNumber": integer line number where the bug occurs (best estimate), or null
  Empty array if mode is 'refactor' or no bugs exist.

- "fixedCode": corrected and/or refactored code string. No markdown fences.

- "commentedCode": fixedCode with descriptive comments above each function and key logic block. No markdown fences.

- "explanation": plain-language string explaining changes. ${locale === 'km' ? 'In Khmer.' : ''}

- "improvementSuggestions": array of 3 actionable best-practice tips. ${locale === 'km' ? 'In Khmer.' : ''}`;

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

  const systemPrompt = `Act as a senior ${language} software engineer.
Fix ONLY this specific bug in the code: "${bugIssue}"
Do not change anything else. Do not change function names.
Respond ONLY in strict JSON with one key:
- "fixedCode": the code with only that specific bug fixed. No markdown fences.`;

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
    res.json(result);
  } catch (err) {
    console.error('Groq error:', err);
    res.status(500).json({ error: 'Fix failed.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Fixplain backend live on port ${PORT}`));
