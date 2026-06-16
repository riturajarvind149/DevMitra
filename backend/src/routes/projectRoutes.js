const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createProject,
  getProjects,
  getMyProjects,
  getProjectById,
  getProjectStats,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

router.post("/", protect, createProject);

router.get("/", getProjects);
router.get("/my", protect, getMyProjects);
router.get("/:id", getProjectById);
router.get("/:id/stats", getProjectStats);

router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);

module.exports = router;