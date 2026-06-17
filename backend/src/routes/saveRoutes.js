const express = require("express");
const router = express.Router({ mergeParams: true });
const protect = require("../middleware/authMiddleware");
const { saveProject, unsaveProject, getSaveStatus } = require("../controllers/saveController");

router.get("/status", protect, getSaveStatus);
router.post("/",      protect, saveProject);
router.delete("/",    protect, unsaveProject);

module.exports = router;
