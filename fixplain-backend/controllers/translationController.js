import { groqClients, nextGroqClient } from '../config/ai.js';
import { safeParseJSON, withTimeout } from '../utils/helpers.js';

export async function translateText(req, res) {
  const { explain, suggest, targetLocale } = req.body;
  if (!explain && (!suggest || !suggest.length)) return res.status(400).json({ error: 'No text provided.' });
  if (!targetLocale) return res.status(400).json({ error: 'targetLocale is required.' });

  const systemPrompt = `Translate the following technical text into ${targetLocale}. Maintain all markdown formatting. Return ONLY a JSON object with 'explain' and 'suggest' keys.`;
  const userMessage = JSON.stringify({ explain, suggest });

  try {
    if (!groqClients.length) throw new Error('No Groq API keys configured');
    const client = nextGroqClient();
    const chat = await withTimeout(
      client.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        model: 'llama-3.1-8b-instant',
        response_format: { type: 'json_object' },
        temperature: 0,
        max_tokens: 2000,
      }),
      15000,
      'Translate'
    );
    const parsed = safeParseJSON(chat.choices[0].message.content);
    res.json({ explain: parsed.explain || '', suggest: parsed.suggest || [] });
  } catch (err) {
    console.error('[Translate]', err.message);
    res.status(500).json({ error: 'Translation failed.' });
  }
}
