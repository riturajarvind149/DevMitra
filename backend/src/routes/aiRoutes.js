const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getAIProfile, updateAIProfile, getSuggestedDevelopers, getSuggestedProjects } = require("../controllers/aiController");

router.get("/profile",               protect, getAIProfile);
router.put("/profile",               protect, updateAIProfile);
router.get("/suggested-developers",  protect, getSuggestedDevelopers);
router.get("/suggested-projects",    protect, getSuggestedProjects);

module.exports = router;
