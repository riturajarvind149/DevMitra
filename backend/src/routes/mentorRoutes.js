const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { optionalAuth } = require("../middleware/authMiddleware");
const { createLimiter } = require("../middleware/rateLimiter");
const {
  analyze,
  getAnalysis,
  getMine,
  getHistory,
  completeTask,
  deleteAnalysis,
} = require("../controllers/mentorController");

// Rate limit analysis requests to prevent abuse
router.post("/analyze", createLimiter, optionalAuth, analyze);
router.get("/analysis/:id", getAnalysis);
router.get("/mine", protect, getMine);
router.get("/history/:userId", getHistory);
router.post("/mentor-task/:id/complete", completeTask);
router.delete("/analysis/:id", protect, deleteAnalysis);

module.exports = router;
