const express = require("express");
const router = express.Router({ mergeParams: true });
const protect = require("../middleware/authMiddleware");
const { addComment, getComments } = require("../controllers/commentController");

router.get("/",  getComments);
router.post("/", protect, addComment);

module.exports = router;
