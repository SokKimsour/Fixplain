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
    // We get BOTH codeInput AND language from the frontend
    const { codeInput, language } = req.body;

    if (!codeInput) return res.status(400).json({ error: "No code provided." });

    const systemPrompt = `Act as a senior ${language} software engineer. 
    Analyze the provided ${language} code for bugs. 
    
    You MUST respond in strict JSON format with exactly these four keys:
    - "bugsFound": An array of strings describing the bugs.
    - "fixedCode": A string with the corrected, well-formatted code.
    - "explanation": A string explaining why the changes were made.
    - "improvementSuggestions": An array of best practice tips for this specific language.`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Analyze this ${language} code:\n${codeInput}` }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            temperature: 0.1 
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
    console.log(`🚀 Fixplain backend live on port ${PORT}`);
});