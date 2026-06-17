const prisma = require("../config/db");

// POST /projects/:projectId/save
const saveProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ message: "Project not found" });

    const existing = await prisma.savedProject.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (existing) return res.status(400).json({ message: "Already saved" });

    await prisma.savedProject.create({ data: { projectId, userId } });
    res.status(201).json({ saved: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to save project" });
  }
};

// DELETE /projects/:projectId/save
const unsaveProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    await prisma.savedProject.deleteMany({ where: { projectId, userId } });
    res.status(200).json({ saved: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to unsave project" });
  }
};

// GET /saved-projects
const getSavedProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const saved = await prisma.savedProject.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            owner: { select: { id: true, username: true, avatarUrl: true } },
            _count: { select: { members: true, accessRequests: true, likes: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(saved.map((s) => s.project));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch saved projects" });
  }
};

// GET /projects/:projectId/save-status
const getSaveStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const saved = await prisma.savedProject.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    res.status(200).json({ saved: !!saved });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch save status" });
  }
};

module.exports = { saveProject, unsaveProject, getSavedProjects, getSaveStatus };
