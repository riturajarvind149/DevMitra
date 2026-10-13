const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { updateComment, deleteComment } = require("../controllers/commentController");

router.put("/:id",    protect, updateComment);
router.delete("/:id", protect, deleteComment);

module.exports = router;
