const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createBugReport,
  getProjectBugReports,
  getBugReport,
  updateBugReport,
  deleteBugReport,
  getMyBugReports,
} = require("../controllers/bugReportController");

// My bug reports
router.get("/mine", protect, getMyBugReports);

// Project-scoped
router.get("/project/:projectId",   getProjectBugReports);
router.post("/",                    protect, createBugReport);
router.get("/:id",                  getBugReport);
router.put("/:id",                  protect, updateBugReport);
router.delete("/:id",               protect, deleteBugReport);

module.exports = router;
