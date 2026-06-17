const prisma = require("../config/db");

// POST /stories
const createStory = async (req, res) => {
  try {
    const { mediaUrl, mediaType = "image", caption, label, visibility = "PUBLIC" } = req.body;
    if (!mediaUrl) return res.status(400).json({ message: "Media URL is required" });

    const VALID_VIS = ["PUBLIC", "CONNECTIONS_ONLY", "PRIVATE"];
    const vis = (visibility || "PUBLIC").toUpperCase();
    if (!VALID_VIS.includes(vis)) return res.status(400).json({ message: "Invalid visibility" });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const story = await prisma.story.create({
      data: { userId: req.user.id, mediaUrl, mediaType, caption, label, visibility: vis, expiresAt },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    });
    res.status(201).json(story);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create story" });
  }
};

// GET /stories — active stories grouped by user, respecting visibility
const getActiveStories = async (req, res) => {
  try {
    const requestingUserId = req.user?.id || null;
    const now = new Date();

    // Get IDs the requesting user is connected with
    let connectedUserIds = [];
    if (requestingUserId) {
      const conns = await prisma.connection.findMany({
        where: {
          status: "ACCEPTED",
          OR: [
            { senderId: requestingUserId },
            { receiverId: requestingUserId },
          ],
        },
        select: { senderId: true, receiverId: true },
      });
      connectedUserIds = conns.map(c => c.senderId === requestingUserId ? c.receiverId : c.senderId);
    }

    const stories = await prisma.story.findMany({
      where: { expiresAt: { gt: now } },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    });

    // Filter by visibility rules
    const visible = stories.filter(s => {
      if (s.visibility === "PUBLIC") return true;
      if (!requestingUserId) return false;
      if (s.userId === requestingUserId) return true;  // Always see own stories
      if (s.visibility === "CONNECTIONS_ONLY") return connectedUserIds.includes(s.userId);
      if (s.visibility === "PRIVATE") return s.userId === requestingUserId;
      return false;
    });

    // Group by user
    const grouped = {};
    for (const story of visible) {
      if (!grouped[story.userId]) grouped[story.userId] = { user: story.user, stories: [] };
      grouped[story.userId].stories.push(story);
    }
    res.status(200).json(Object.values(grouped));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch stories" });
  }
};

// DELETE /stories/:id
const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const story = await prisma.story.findUnique({ where: { id } });
    if (!story) return res.status(404).json({ message: "Story not found" });
    if (story.userId !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    await prisma.story.delete({ where: { id } });
    res.status(200).json({ message: "Story deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete story" });
  }
};

module.exports = { createStory, getActiveStories, deleteStory };
