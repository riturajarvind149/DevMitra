const prisma = require("../config/db");

// GET /messages/conversations
// Get all conversations for the logged-in user
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Add unread count per conversation
    const result = await Promise.all(
      conversations.map(async (conv) => {
        const unread = await prisma.message.count({
          where: { conversationId: conv.id, receiverId: userId, read: false },
        });
        const otherParticipant = conv.participants.find((p) => p.userId !== userId);
        return {
          ...conv,
          otherUser: otherParticipant?.user || null,
          unreadCount: unread,
          lastMessage: conv.messages[0] || null,
        };
      })
    );

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

// GET /messages/:conversationId
// Get messages in a conversation
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: req.user.id },
      },
    });
    if (!participant)
      return res.status(403).json({ message: "Not a participant" });

    // Mark messages as read
    await prisma.message.updateMany({
      where: { conversationId, receiverId: req.user.id, read: false },
      data: { read: true },
    });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "asc" },
      take: Math.min(parseInt(limit) || 50, 100),
      skip: parseInt(offset) || 0,
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

// POST /messages/send
// Send a message to a user (creates or reuses conversation)
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !content?.trim())
      return res.status(400).json({ message: "Receiver and content required" });

    if (receiverId === senderId)
      return res.status(400).json({ message: "Cannot message yourself" });

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) return res.status(404).json({ message: "User not found" });

    // Find existing conversation between these two users
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: senderId } } },
          { participants: { some: { userId: receiverId } } },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [{ userId: senderId }, { userId: receiverId }],
          },
        },
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

// GET /messages/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const count = await prisma.message.count({
      where: { receiverId: req.user.id, read: false },
    });
    res.status(200).json({ unreadCount: count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get unread count" });
  }
};

module.exports = { getConversations, getMessages, sendMessage, getUnreadCount };
