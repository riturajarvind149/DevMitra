const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createBugReport, getProjectBugReports, getBugReport,
  updateBugReport, deleteBugReport, getMyBugReports,
  getBugComments, addBugComment,
} = require("../controllers/bugReportController");

router.get("/mine",                  protect, getMyBugReports);
router.get("/project/:projectId",            getProjectBugReports);
router.post("/",                     protect, createBugReport);
router.get("/:id",                           getBugReport);
router.put("/:id",                   protect, updateBugReport);
router.delete("/:id",                protect, deleteBugReport);
// Bug comment thread (private: reporter + owner only)
router.get("/:id/comments",          protect, getBugComments);
router.post("/:id/comments",         protect, addBugComment);

module.exports = router;
