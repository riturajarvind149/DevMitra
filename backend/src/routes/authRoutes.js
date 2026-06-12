const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const {
  loginWithGithub,
  githubCallback,
  getCurrentUser,
} = require("../controllers/authController");

router.get("/github", loginWithGithub);
router.get("/github/callback", githubCallback);
router.get("/me", protect, getCurrentUser);

module.exports = router;