import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/fix', async (req, res) => {
    const { codeInput, language = 'javascript', mode = 'both', locale = 'en' } = req.body;

    if (!codeInput) return res.status(400).json({ error: "No code provided." });

    const modeInstruction =
        mode === 'fix'
            ? `Focus ONLY on finding and fixing bugs. Do not refactor beyond what is needed.`
        : mode === 'refactor'
            ? `Assume the logic is correct. Focus ONLY on refactoring for readability and efficiency. Do not change function names.`
            : `Both fix all bugs AND refactor the code for readability and efficiency. Do not change function names.`;

    // Locale instruction — makes Groq respond in Khmer when UI is in Khmer mode
    const localeInstruction = locale === 'km'
        ? `IMPORTANT: You MUST write the "explanation" and "improvementSuggestions" fields in Khmer language (ភាសាខ្មែរ). All other fields (code) stay in ${language}.`
        : '';

    const systemPrompt = `Act as a senior ${language} software engineer with 10 years of experience.
${modeInstruction}
${localeInstruction}

You MUST respond in strict JSON format with exactly these five keys:

- "bugsFound": An array of OBJECTS, each with:
    - "issue": a string describing the bug
    - "severity": one of "high", "medium", or "low"
  Return an empty array if mode is 'refactor' or no bugs exist.

- "fixedCode": A string with the corrected and/or refactored code. No markdown fences.

- "commentedCode": The fixedCode version with clear descriptive comments above each function and key logic block. No markdown fences.

- "explanation": A plain-language string explaining what was wrong and what was changed. ${locale === 'km' ? 'Write this in Khmer (ភាសាខ្មែរ).' : ''}

- "improvementSuggestions": An array of 3 actionable best-practice tips for this ${language} code. ${locale === 'km' ? 'Write these in Khmer (ភាសាខ្មែរ).' : ''}`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Analyze this ${language} code:\n${codeInput}` }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            temperature: 0.1,
        });

        const resultJson = JSON.parse(chatCompletion.choices[0].message.content);
        res.json(resultJson);

    } catch (error) {
        console.error("Groq API Error:", error);
        res.status(500).json({ error: 'AI analysis failed.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Fixplain backend live on port ${PORT}`);
});
