const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { optionalAuth } = require("../middleware/authMiddleware");
const { getMyFullProfile, getPublicProfile } = require("../controllers/profileController");

router.get("/me",          protect,      getMyFullProfile);
router.get("/:userId",     optionalAuth, getPublicProfile);

module.exports = router;
