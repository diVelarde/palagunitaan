const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const geminiService = require('../services/geminiService');

const router = express.Router();

router.get('/health', requireAuth, requireRole('admin'), async (req, res) => {
  if (!geminiService.isConfigured()) {
    return res.status(503).json({
      configured: false,
      model: geminiService.MODEL_NAME,
      message:
        'GEMINI_API_KEY is not set on this server. AI categorization and plain-language versions are disabled, and entries are saved without them.',
    });
  }

  try {
    const reply = await geminiService.checkHealth();
    res.json({ configured: true, reachable: true, model: geminiService.MODEL_NAME, reply });
  } catch (err) {
    res.status(502).json({
      configured: true,
      reachable: false,
      model: geminiService.MODEL_NAME,
      message: err.message,
    });
  }
});

router.get('/categories', (req, res) => {
  res.json({ categories: geminiService.CATEGORY_LIST });
});

module.exports = router;
