const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { optionalAuth } = require("../middleware/authMiddleware");
const { createStory, getActiveStories, deleteStory } = require("../controllers/storyController");

router.get("/",    optionalAuth, getActiveStories);
router.post("/",   protect,      createStory);
router.delete("/:id", protect,   deleteStory);

module.exports = router;
