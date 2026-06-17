const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createAccessRequest, getMyAccessRequests, getIncomingAccessRequests,
  approveAccessRequest, rejectAccessRequest, checkMyRequest,
} = require("../controllers/accessRequestController");

router.get("/mine", protect, getMyAccessRequests);
router.get("/incoming", protect, getIncomingAccessRequests);
// Check if current user has a request for a specific project
router.get("/check/:projectId", protect, checkMyRequest);
router.post("/", protect, createAccessRequest);
router.put("/:id/approve", protect, approveAccessRequest);
router.put("/:id/reject", protect, rejectAccessRequest);

module.exports = router;
