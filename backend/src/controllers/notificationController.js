const prisma = require("../config/db");
const { parsePagination } = require("../utils/pagination");

// GET /notifications
// Get all notifications for the logged-in user
const getNotifications = async (req, res) => {
  try {
    const { take, skip } = parsePagination(req.query, 20);

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

    // Ownership check: ensure the notification belongs to the requesting user
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    if (notification.receiverId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to mark this notification as read" });
    }

    await prisma.notification.update({
      where: { id, receiverId: req.user.id },
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
