const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { optionalAuth } = require("../middleware/authMiddleware");
const { getDevelopers, getSuggestedDevelopers, getActivityFeed } = require("../controllers/developerController");

router.get("/",           optionalAuth, getDevelopers);
router.get("/suggested",  protect,      getSuggestedDevelopers);
router.get("/feed",       optionalAuth, getActivityFeed);

module.exports = router;
