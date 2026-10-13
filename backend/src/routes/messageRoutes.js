const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getConversations, getMessages, sendMessage, getUnreadCount } = require("../controllers/messageController");

router.get("/conversations", protect, getConversations);
router.get("/unread-count", protect, getUnreadCount);
router.get("/:conversationId", protect, getMessages);
router.post("/send", protect, sendMessage);

module.exports = router;
