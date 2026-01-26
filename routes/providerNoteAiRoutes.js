const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { checkNotesWithAI } = require("../controllers/providerNoteAiController");

/**
 * Provider Note AI Integration Routes
 * All routes require authentication
 */

// POST /api/provider-note-ai/check-notes - Analyze provider and hygienist notes with Gemini AI
router.post("/check-notes", protect, checkNotesWithAI);

module.exports = router;
