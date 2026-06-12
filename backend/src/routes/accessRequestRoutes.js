const express = require("express");
const router = express.Router();

const {
  createAccessRequest,
  getAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
} = require("../controllers/accessRequestController");

router.get("/", getAccessRequests);
router.post("/", createAccessRequest);
router.put("/:id/approve", approveAccessRequest);
router.put("/:id/reject", rejectAccessRequest);

module.exports = router;