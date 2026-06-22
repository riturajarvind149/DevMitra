const express = require("express");
const router = express.Router({ mergeParams: true }); // inherits :projectId
const protect = require("../middleware/authMiddleware");
const { optionalAuth } = require("../middleware/authMiddleware");
const {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  markProjectComplete,
  reopenProject,
} = require("../controllers/announcementController");

router.get("/",             optionalAuth, getAnnouncements);
router.post("/",            protect,      createAnnouncement);
router.delete("/:id",       protect,      deleteAnnouncement);
router.post("/complete",    protect,      markProjectComplete);
router.post("/reopen",      protect,      reopenProject);

module.exports = router;
