import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import apiRouter from './routes/api.js';
import { groqClients, CEREBRAS_API_KEY } from './config/ai.js';
const app = express();

// ── CORS & Body Parsing ───────────────────────────────────────────────────────
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

// ── Router ────────────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ── Server Listen ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Fixplain backend live on port ${PORT}`);
  console.log(`Providers: Groq=${groqClients.length} keys | Cerebras=${!!CEREBRAS_API_KEY} | Gemini=${!!process.env.GEMINI_API_KEY}`);
});