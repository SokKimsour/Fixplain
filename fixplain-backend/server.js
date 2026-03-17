import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/fix', async (req, res) => {
    const { codeInput } = req.body;

    if (!codeInput) {
        return res.status(400).json({ error: "No code provided." });
    }

    // Your exact Prompt Engineering payload
    const systemPrompt = `Act as a senior software engineer and expert code debugger. 
    Analyze the code provided by the user. Find any bugs, fix them, and provide an explanation and improvement suggestions.

    You MUST respond in strict JSON format with exactly these four keys:
    - "bugsFound": An array of strings describing the bugs found.
    - "fixedCode": A string containing the perfectly formatted corrected code.
    - "explanation": A string explaining what was changed and why.
    - "improvementSuggestions": An array of strings with further best practice suggestions.`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Code to analyze:\n${codeInput}` }
            ],
            // Using Llama 3 8B because it is blazing fast and great for coding
            model: "llama-3.3-70b-versatile", 
            // Force the AI to output valid JSON to prevent frontend crashes
            response_format: { type: "json_object" }, 
            temperature: 0.1 
        });

        // Parse Groq's JSON response
        const resultJson = JSON.parse(chatCompletion.choices[0].message.content);
        
        // Send it back to your React UI
        res.json(resultJson);

    } catch (error) {
        console.error("Groq API Error:", error);
        res.status(500).json({ error: 'Failed to analyze code with AI.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Fixplain backend is running with Groq on http://localhost:${PORT}`);
});