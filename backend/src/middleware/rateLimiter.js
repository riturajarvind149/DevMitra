const rateLimit = require("express-rate-limit");

// General API limiter — generous for dev, tighten for production
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000,                 // 2000 req / 15 min per IP (plenty for polling + usage)
  message: { message: "Too many requests from this IP, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  // skip function removed — /stats is no longer exempt
});

// Auth endpoints — keep strict to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: "Too many authentication attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create endpoints — moderate limit
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200,
  message: { message: "Too many resources created, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Chat message limiter — per-message LLM cost control
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,             // 30 messages/min per user
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { message: "Too many messages. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, authLimiter, createLimiter, chatLimiter };
