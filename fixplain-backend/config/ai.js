import 'dotenv/config';
import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import { safeParseJSON, withTimeout } from '../utils/helpers.js';

// ── Groq multi-key round-robin ────────────────────────────────────────────────
const groqKeys = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
  process.env.GROQ_API_KEY_5,
].filter(Boolean);

export const groqClients = groqKeys.map(key => new Groq({ apiKey: key }));
let groqIndex = 0;

export function nextGroqClient() {
  if (!groqClients.length) throw new Error('No Groq API keys configured');
  const client = groqClients[groqIndex];
  groqIndex = (groqIndex + 1) % groqClients.length;
  return client;
}

// ── Other provider clients ────────────────────────────────────────────────────
export const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
export const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;

const PROVIDER_TIMEOUT_MS = 35000;

// ── Provider 1: Groq — round-robin across multiple keys ───────────────────────
export async function callGroq(systemPrompt, userMessage) {
  if (!groqClients.length) throw new Error('No Groq API keys configured');

  const attempts = groqClients.length;
  let lastError;

  for (let i = 0; i < attempts; i++) {
    const client = nextGroqClient();
    try {
      const chat = await withTimeout(
        client.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          model: 'llama-3.3-70b-versatile',
          response_format: { type: 'json_object' },
          temperature: 0,
          max_tokens: 3000,
        }),
        PROVIDER_TIMEOUT_MS,
        `Groq key ${i + 1}`
      );
      return safeParseJSON(chat.choices[0].message.content);
    } catch (err) {
      lastError = err;
      console.warn(`[Groq] Key ${groqIndex} failed: ${err.message}`);
    }
  }

  throw new Error(`All Groq keys failed: ${lastError?.message}`);
}

// ── Provider 2: Cerebras (LLaMA 3.3 70b — same model, different infra) ───────
export async function callCerebras(systemPrompt, userMessage) {
  if (!CEREBRAS_API_KEY) throw new Error('CEREBRAS_API_KEY not set');

  const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama3.3-70b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 3000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cerebras ${res.status}: ${err}`);
  }
  const data = await res.json();
  return safeParseJSON(data.choices[0].message.content);
}

// ── Provider 3: Gemini 2.0 Flash (official @google/genai SDK) ────────────────
export async function callGemini(systemPrompt, userMessage) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

  const response = await genai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `${systemPrompt}\n\n${userMessage}`,
    config: {
      temperature: 0,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  });

  return safeParseJSON(response.text);
}

// ── Fallback chain: Gemini → Groq → Cerebras ─────────────────────────────────
export async function callWithFallback(systemPrompt, userMessage) {
  const providers = [
    { name: 'Gemini', fn: () => withTimeout(callGemini(systemPrompt, userMessage), PROVIDER_TIMEOUT_MS, 'Gemini') },
    { name: 'Groq', fn: () => withTimeout(callGroq(systemPrompt, userMessage), PROVIDER_TIMEOUT_MS, 'Groq') },
    { name: 'Cerebras', fn: () => withTimeout(callCerebras(systemPrompt, userMessage), PROVIDER_TIMEOUT_MS, 'Cerebras') },
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
