const express = require("express");
const router = express.Router();

const {
  getProjectActivities,
  getUserActivities,
} = require("../controllers/activityController");

// Get activities for a project
router.get("/projects/:projectId/activities", getProjectActivities);

// Get activities for a user
router.get("/users/:userId/activities", getUserActivities);

module.exports = router;
