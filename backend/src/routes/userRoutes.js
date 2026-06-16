const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createUser,
  getUsers,
  getUserById,
  getUserProjects,
  getUserMemberships,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

// Public routes
router.get("/", getUsers);
router.get("/:id", getUserById);
router.get("/:id/projects", getUserProjects);
router.get("/:id/memberships", getUserMemberships);
router.post("/", createUser);

// Protected routes - user can only modify their own data
router.put("/:id", protect, updateUser);
router.delete("/:id", protect, deleteUser);

module.exports = router;
