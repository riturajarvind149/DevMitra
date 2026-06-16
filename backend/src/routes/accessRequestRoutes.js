const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createAccessRequest,
  getMyAccessRequests,
  getIncomingAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
} = require("../controllers/accessRequestController");

// Requests submitted by the logged-in user
router.get("/mine", protect, getMyAccessRequests);

// Requests received on projects owned by the logged-in user
router.get("/incoming", protect, getIncomingAccessRequests);

// Create a new access request
router.post("/", protect, createAccessRequest);

// Approve / reject — owner only
router.put("/:id/approve", protect, approveAccessRequest);
router.put("/:id/reject", protect, rejectAccessRequest);

module.exports = router;
