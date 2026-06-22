const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getProjectMembers, removeMember, checkMembership, addMember } = require("../controllers/projectMemberController");

router.get("/:projectId/members",            getProjectMembers);
router.get("/:projectId/membership",  protect, checkMembership);
router.post("/:projectId/members",    protect, addMember);
router.delete("/:projectId/members/:userId", protect, removeMember);

module.exports = router;
