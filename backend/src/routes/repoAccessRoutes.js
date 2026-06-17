const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { createRepoRequest, getMyRepoRequests, getIncomingRepoRequests, checkMyRepoRequest, approveRepoRequest, rejectRepoRequest } = require("../controllers/repoAccessController");

router.post("/",                    protect, createRepoRequest);
router.get("/mine",                 protect, getMyRepoRequests);
router.get("/incoming",             protect, getIncomingRepoRequests);
router.get("/check/:projectId",     protect, checkMyRepoRequest);
router.put("/:id/approve",          protect, approveRepoRequest);
router.put("/:id/reject",           protect, rejectRepoRequest);

module.exports = router;
