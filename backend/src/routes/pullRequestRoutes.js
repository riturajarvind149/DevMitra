const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createPullRequest,
  getProjectPullRequests,
  getPullRequest,
  reviewPullRequest,
  getMyPullRequests,
  getIncomingPullRequests,
} = require("../controllers/pullRequestController");

router.get("/mine",     protect, getMyPullRequests);
router.get("/incoming", protect, getIncomingPullRequests);

router.get("/project/:projectId", getProjectPullRequests);
router.post("/",                  protect, createPullRequest);
router.get("/:id",                getPullRequest);
router.put("/:id/review",         protect, reviewPullRequest);

module.exports = router;
