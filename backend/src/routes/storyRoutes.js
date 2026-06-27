const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { optionalAuth } = require("../middleware/authMiddleware");
const {
  createStory, getActiveStories, deleteStory,
  recordStoryView, getStoryViewers,
  toggleStoryLike, getStoryLikeStatus,
} = require("../controllers/storyController");

router.get("/",              optionalAuth, getActiveStories);
router.post("/",             protect,      createStory);
router.delete("/:id",        protect,      deleteStory);
router.post("/:id/view",     protect,      recordStoryView);
router.get("/:id/viewers",   protect,      getStoryViewers);
router.post("/:id/like",     protect,      toggleStoryLike);
router.get("/:id/like",      protect,      getStoryLikeStatus);

module.exports = router;
