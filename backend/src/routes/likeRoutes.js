const express = require("express");
const router = express.Router({ mergeParams: true });
const protect = require("../middleware/authMiddleware");
const { optionalAuth } = require("../middleware/authMiddleware");
const { likeProject, unlikeProject, getProjectLikes } = require("../controllers/likeController");

router.get("/",    optionalAuth, getProjectLikes);
router.post("/",   protect,      likeProject);
router.delete("/", protect,      unlikeProject);

module.exports = router;
