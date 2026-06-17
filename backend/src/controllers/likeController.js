const prisma = require("../config/db");
const { createNotification } = require("./notificationController");

// POST /projects/:projectId/like
const likeProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ message: "Project not found" });

    const existing = await prisma.projectLike.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (existing) return res.status(400).json({ message: "Already liked" });

    const like = await prisma.projectLike.create({ data: { projectId, userId } });

    // Notify project owner
    if (project.ownerId !== userId) {
      await createNotification({
        type: "PROJECT_LIKED",
        message: `${req.user.username} liked your project "${project.title}"`,
        receiverId: project.ownerId,
        senderId: userId,
        projectId,
        link: `/projects/${projectId}`,
      });
    }

    const count = await prisma.projectLike.count({ where: { projectId } });
    res.status(201).json({ liked: true, count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to like project" });
  }
};

// DELETE /projects/:projectId/like
const unlikeProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    await prisma.projectLike.deleteMany({ where: { projectId, userId } });
    const count = await prisma.projectLike.count({ where: { projectId } });
    res.status(200).json({ liked: false, count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to unlike project" });
  }
};

// GET /projects/:projectId/likes
const getProjectLikes = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;
    const count = await prisma.projectLike.count({ where: { projectId } });
    const liked = userId
      ? !!(await prisma.projectLike.findUnique({ where: { projectId_userId: { projectId, userId } } }))
      : false;
    res.status(200).json({ count, liked });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch likes" });
  }
};

module.exports = { likeProject, unlikeProject, getProjectLikes };
