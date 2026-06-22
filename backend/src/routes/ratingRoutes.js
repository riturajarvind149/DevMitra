const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  rateContributor,
  getUserRatings,
  rateProject,
  getProjectRatings,
} = require("../controllers/ratingController");

// Contributor ratings
router.post("/contributor",          protect, rateContributor);
router.get("/contributor/:userId",   getUserRatings);

// Project ratings
router.post("/project",              protect, rateProject);
router.get("/project/:projectId",    getProjectRatings);

module.exports = router;
