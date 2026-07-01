const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { optionalAuth } = require("../middleware/authMiddleware");
const { createUser, getUsers, getUserById, getUserProjects, getUserMemberships, updateUser, deleteUser } = require("../controllers/userController");
const { getUserLikedProjects } = require("../controllers/likeController");
const { getUserComments } = require("../controllers/commentController");
const { getUserContributing } = require("../controllers/projectMemberController");
const { getUserApplications } = require("../controllers/opportunityController");

router.get("/",                      getUsers);
router.get("/:id",                   optionalAuth, getUserById);
router.get("/:id/projects",          getUserProjects);
router.get("/:id/memberships",       getUserMemberships);
router.get("/:id/contributing",      protect, getUserContributing);
router.get("/:id/liked-projects",    protect, getUserLikedProjects);
router.get("/:id/comments",          protect, getUserComments);
router.get("/:id/applications",      protect, getUserApplications);
router.post("/",                   protect, createUser);
router.put("/:id",                 protect, updateUser);
router.delete("/:id",              protect, deleteUser);

module.exports = router;
