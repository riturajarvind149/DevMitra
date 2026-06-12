const express = require("express");
const router = express.Router();

const {
  loginWithGithub,
  githubCallback,
} = require("../controllers/authController");

router.get("/github", loginWithGithub);
router.get("/github/callback", githubCallback);

module.exports = router;