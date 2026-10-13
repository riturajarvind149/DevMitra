const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { optionalAuth } = require("../middleware/authMiddleware");
const { createLimiter } = require("../middleware/rateLimiter");

const {
  createProject, getProjects, getMyProjects, getProjectById,
  getProjectStats, updateProject, deleteProject,
} = require("../controllers/projectController");

router.post("/", protect, createLimiter, createProject);

// Public/optional-auth reads
router.get("/", optionalAuth, getProjects);
router.get("/my", protect, getMyProjects);
router.get("/:id", optionalAuth, getProjectById);
router.get("/:id/stats", optionalAuth, getProjectStats);

// Owner-only mutations
router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);

module.exports = router;
