const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { optionalAuth } = require("../middleware/authMiddleware");
const { createOpportunity, getOpportunities, getOpportunityById, getMyOpportunities, updateOpportunity, deleteOpportunity, applyToOpportunity, approveApplication, rejectApplication, checkApplied } = require("../controllers/opportunityController");

router.get("/",             optionalAuth, getOpportunities);
router.get("/mine",         protect,      getMyOpportunities);
router.get("/:id",          optionalAuth, getOpportunityById);
router.get("/:id/check",    protect,      checkApplied);
router.post("/",            protect,      createOpportunity);
router.put("/:id",          protect,      updateOpportunity);
router.delete("/:id",       protect,      deleteOpportunity);
router.post("/:id/apply",   protect,      applyToOpportunity);
router.put("/:id/applications/:appId/approve", protect, approveApplication);
router.put("/:id/applications/:appId/reject",  protect, rejectApplication);

module.exports = router;
