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
    let connectedUserIds = [];
    if (requestingUserId) {
      const conns = await prisma.connection.findMany({
        where: { status: "ACCEPTED", OR: [{ senderId: requestingUserId }, { receiverId: requestingUserId }] },
        select: { senderId: true, receiverId: true },
      });
      connectedUserIds = conns.map(c => c.senderId === requestingUserId ? c.receiverId : c.senderId);
    }
    const stories = await prisma.story.findMany({
      where: { expiresAt: { gt: now } },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
    const visible = stories.filter(s => {
      if (s.visibility === "PUBLIC") return true;
      if (!requestingUserId) return false;
      if (s.userId === requestingUserId) return true;
      if (s.visibility === "CONNECTIONS_ONLY") return connectedUserIds.includes(s.userId);
      if (s.visibility === "PRIVATE") return s.userId === requestingUserId;
      return false;
    });
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

// POST /stories/:id/view — record that a user viewed a story (skip own)
const recordStoryView = async (req, res) => {
  try {
    const { id } = req.params;
    const viewerId = req.user.id;
    const story = await prisma.story.findUnique({ where: { id } });
    if (!story) return res.status(404).json({ message: "Story not found" });
    if (story.userId === viewerId) return res.status(200).json({ ok: true });
    await prisma.storyView.upsert({
      where: { storyId_viewerId: { storyId: id, viewerId } },
      create: { storyId: id, viewerId },
      update: { viewedAt: new Date() },
    });
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to record view" });
  }
};

// GET /stories/:id/viewers — owner only: viewers list with liked flag
const getStoryViewers = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const story = await prisma.story.findUnique({ where: { id } });
    if (!story) return res.status(404).json({ message: "Story not found" });
    if (story.userId !== userId) return res.status(403).json({ message: "Not authorized" });
    const [views, likes] = await Promise.all([
      prisma.storyView.findMany({
        where: { storyId: id },
        include: { viewer: { select: { id: true, username: true, avatarUrl: true } } },
        orderBy: { viewedAt: "desc" },
      }),
      prisma.storyLike.findMany({ where: { storyId: id }, select: { userId: true } }),
    ]);
    const likedIds = new Set(likes.map(l => l.userId));
    res.status(200).json(views.map(v => ({
      ...v.viewer,
      viewedAt: v.viewedAt,
      liked: likedIds.has(v.viewer.id),
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get viewers" });
  }
};

// POST /stories/:id/like — toggle like (can't like own story)
const toggleStoryLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const story = await prisma.story.findUnique({ where: { id } });
    if (!story) return res.status(404).json({ message: "Story not found" });
    if (story.userId === userId) return res.status(400).json({ message: "Cannot like your own story" });
    const existing = await prisma.storyLike.findUnique({
      where: { storyId_userId: { storyId: id, userId } },
    });
    if (existing) {
      await prisma.storyLike.delete({ where: { id: existing.id } });
      return res.status(200).json({ liked: false });
    } else {
      await prisma.storyLike.create({ data: { storyId: id, userId } });
      // Also record a view
      await prisma.storyView.upsert({
        where: { storyId_viewerId: { storyId: id, viewerId: userId } },
        create: { storyId: id, viewerId: userId },
        update: { viewedAt: new Date() },
      });

      // Notify story owner
      const liker = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });
      await prisma.notification.create({
        data: {
          type: "STORY_LIKE",
          message: `${liker?.username ?? "Someone"} liked your story`,
          receiverId: story.userId,
          senderId: userId,
          link: `/`,  // home page where stories are shown
        },
      }).catch(() => {}); // don't fail the like if notification fails

      return res.status(200).json({ liked: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to toggle like" });
  }
};

// GET /stories/:id/like — get like status for current user
const getStoryLikeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const [like, count] = await Promise.all([
      prisma.storyLike.findUnique({ where: { storyId_userId: { storyId: id, userId } } }),
      prisma.storyLike.count({ where: { storyId: id } }),
    ]);
    res.status(200).json({ liked: !!like, count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get like status" });
  }
};

module.exports = {
  createStory, getActiveStories, deleteStory,
  recordStoryView, getStoryViewers,
  toggleStoryLike, getStoryLikeStatus,
};
