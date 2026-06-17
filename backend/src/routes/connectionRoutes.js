const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  sendConnectionRequest, acceptConnection, rejectConnection, removeConnection,
  getConnectionRequests, getConnections, getConnectionStatus, getConnectionCounts,
} = require("../controllers/connectionController");

router.get("/",                    protect, getConnections);
router.get("/requests",            protect, getConnectionRequests);
router.get("/status/:userId",      protect, getConnectionStatus);
router.get("/counts/:userId",      getConnectionCounts);
router.post("/request/:userId",    protect, sendConnectionRequest);
router.put("/accept/:requestId",   protect, acceptConnection);
router.put("/reject/:requestId",   protect, rejectConnection);
router.delete("/:userId",          protect, removeConnection);

module.exports = router;
