const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiter");

router.use(authLimiter);

const {
  loginWithGithub,
  githubCallback,
  getCurrentUser,
  logout,
} = require("../controllers/authController");

router.get("/github", loginWithGithub);
router.get("/github/callback", githubCallback);
router.get("/me", protect, getCurrentUser);
router.post("/logout", logout);

module.exports = router;