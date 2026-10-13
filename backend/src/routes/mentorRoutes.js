const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { optionalAuth } = require("../middleware/authMiddleware");
const { createLimiter, chatLimiter } = require("../middleware/rateLimiter");
const {
  analyze,
  getAnalysis,
  getMine,
  getHistory,
  completeTask,
  deleteAnalysis,
} = require("../controllers/mentorController");
const {
  createSession,
  listSessions,
  getSession,
  sendMessage,
  deleteSession,
  recordFeedback,
} = require("../controllers/mentorChatController");

// ── Analysis routes ──────────────────────────────────────────────────────
router.post("/analyze", createLimiter, optionalAuth, analyze);
router.get("/analysis/:id", getAnalysis);
router.get("/mine", protect, getMine);
router.get("/history/:userId", getHistory);
router.post("/mentor-task/:id/complete", completeTask);
router.delete("/analysis/:id", protect, deleteAnalysis);

// ── Chat routes ──────────────────────────────────────────────────────────
router.post("/chat/session", protect, createSession);
router.get("/chat/sessions", protect, listSessions);
router.get("/chat/session/:id", protect, getSession);
router.post("/chat/session/:id/message", protect, chatLimiter, sendMessage);
router.delete("/chat/session/:id", protect, deleteSession);
router.post("/chat/feedback", protect, recordFeedback);

module.exports = router;

