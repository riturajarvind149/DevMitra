const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

router.post("/", protect, createProject);

router.get("/", getProjects);
router.get("/:id", getProjectById);

router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);

module.exports = router;