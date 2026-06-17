const prisma = require("../config/db");

// GET /notifications
// Get all notifications for the logged-in user
const getNotifications = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const take = Math.min(parseInt(limit) || 20, 100);
    const skip = parseInt(offset) || 0;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { receiverId: req.user.id },
        include: {
          sender: {
            select: { id: true, username: true, avatarUrl: true },
          },
          project: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.notification.count({
        where: { receiverId: req.user.id, read: false },
      }),
    ]);

    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// PUT /notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to mark notification" });
  }
};

// PUT /notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { receiverId: req.user.id, read: false },
      data: { read: true },
    });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to mark all notifications" });
  }
};

// Helper to create a notification (used internally)
const createNotification = async ({ type, message, receiverId, senderId, projectId, link }) => {
  if (receiverId === senderId) return; // Don't notify yourself
  return prisma.notification.create({
    data: { type, message, receiverId, senderId, projectId, link },
  });
};

module.exports = { getNotifications, markAsRead, markAllAsRead, createNotification };
