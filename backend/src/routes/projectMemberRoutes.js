const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  getProjectMembers,
  removeMember,
} = require("../controllers/projectMemberController");

// Get all members of a project
router.get("/:projectId/members", getProjectMembers);

// Remove a member from a project (owner only)
router.delete("/:projectId/members/:userId", protect, removeMember);

module.exports = router;
