const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getSavedProjects } = require("../controllers/saveController");

router.get("/", protect, getSavedProjects);

module.exports = router;
