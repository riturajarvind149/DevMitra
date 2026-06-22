const express = require("express");
const router = express.Router({ mergeParams: true });
const protect = require("../middleware/authMiddleware");
const { addResource, getProjectResources, deleteResource } = require("../controllers/projectResourceController");

router.get("/",      getProjectResources);
router.post("/",     protect, addResource);
router.delete("/:id", protect, deleteResource);

module.exports = router;
