const prisma = require("../config/db");
const { createNotification } = require("./notificationController");

// POST /projects/:projectId/comments
const addComment = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { content, parentCommentId } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: "Content is required" });

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ message: "Project not found" });

    const comment = await prisma.projectComment.create({
      data: {
        content: content.trim(),
        projectId,
        userId: req.user.id,
        parentCommentId: parentCommentId || null,
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        replies: {
          include: { user: { select: { id: true, username: true, avatarUrl: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // Notify project owner (not self)
    if (project.ownerId !== req.user.id) {
      await createNotification({
        type: "PROJECT_COMMENTED",
        message: `${req.user.username} commented on your project "${project.title}"`,
        receiverId: project.ownerId,
        senderId: req.user.id,
        projectId,
        link: `/projects/${projectId}`,
      });
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add comment" });
  }
};

// GET /projects/:projectId/comments
const getComments = async (req, res) => {
  try {
    const { projectId } = req.params;
    // Top-level comments only; replies are nested
    const comments = await prisma.projectComment.findMany({
      where: { projectId, parentCommentId: null },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        replies: {
          include: { user: { select: { id: true, username: true, avatarUrl: true } } },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
};

// PUT /comments/:id
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: "Content is required" });

    const comment = await prisma.projectComment.findUnique({ where: { id } });
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.userId !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    const updated = await prisma.projectComment.update({
      where: { id },
      data: { content: content.trim() },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    });
    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update comment" });
  }
};

// DELETE /comments/:id
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await prisma.projectComment.findUnique({ where: { id } });
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.userId !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    await prisma.projectComment.delete({ where: { id } });
    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete comment" });
  }
};

// GET /users/:userId/comments
// Returns only the authenticated user's comments — ignores :userId param
// Auth: required
const getUserComments = async (req, res) => {
  try {
    // Always use the authenticated user's ID — never trust the URL param for private data
    const userId = req.user.id;
    const comments = await prisma.projectComment.findMany({
      where: { userId },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        project: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch user comments" });
  }
};

module.exports = { addComment, getComments, updateComment, deleteComment, getUserComments };
