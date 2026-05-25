import { Router } from 'express';
import { fixCode, fixSingleBug } from '../controllers/analysisController.js';
import { translateText } from '../controllers/translationController.js';
import { searchYouTube } from '../controllers/youtubeController.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { groqClients, CEREBRAS_API_KEY } from '../config/ai.js';

const router = Router();

// ── Health / ping (wakes Render from sleep) ───────────────────────────────────
router.get('/ping', (req, res) => res.json({ ok: true }));

// ── Provider status (useful for debugging) ────────────────────────────────────
router.get('/status', (_req, res) => {
  res.json({
    groq: groqClients.length > 0,
    groqKeys: groqClients.length,
    cerebras: !!CEREBRAS_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
  });
});

// ── Main analysis endpoint ────────────────────────────────────────────────────
router.post('/fix', rateLimiter, fixCode);

// ── Single bug fix endpoint ───────────────────────────────────────────────────
router.post('/fix-single', rateLimiter, fixSingleBug);

// ── Translation-only endpoint ─────────────────────────────────────────────────
router.post('/translate-text', rateLimiter, translateText);

// ── YouTube video search endpoint ─────────────────────────────────────────────
router.get('/youtube', searchYouTube);

export default router;
