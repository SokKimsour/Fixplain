import { callGemini } from '../config/ai.js';

export async function translateText(req, res) {
  const { explain, suggest, targetLocale } = req.body;
  if (!explain && (!suggest || !suggest.length)) return res.status(400).json({ error: 'No text provided.' });
  if (!targetLocale) return res.status(400).json({ error: 'targetLocale is required.' });

  const systemPrompt = `Translate the following technical text into ${targetLocale}. Maintain all markdown formatting. Return ONLY a JSON object with 'explain' and 'suggest' keys.`;
  const userMessage = JSON.stringify({ explain, suggest });

  try {
    const parsed = await callGemini(systemPrompt, userMessage);
    res.json({ explain: parsed.explain || '', suggest: parsed.suggest || [] });
  } catch (err) {
    console.error('[Translate]', err.message);
    res.status(500).json({ error: 'Translation failed.' });
  }
}
