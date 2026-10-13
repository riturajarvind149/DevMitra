const prisma = require("../config/db");

// ── Add a resource to a project ───────────────────────────────────────────────
const addResource = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, fileUrl, fileType = "OTHER" } = req.body;
    const uploaderId = req.user.id;

    if (!title || !fileUrl) {
      return res.status(400).json({ message: "title and fileUrl are required" });
    }

    // Must be owner or member
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ message: "Project not found" });

    const isOwner = project.ownerId === uploaderId;
    const isMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: uploaderId } },
    });

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: "Only project members can add resources" });
    }

    const resource = await prisma.projectResource.create({
      data: { projectId, uploaderId, title, description: description || null, fileUrl, fileType },
      include: { uploader: { select: { id: true, username: true, avatarUrl: true } } },
    });

    res.status(201).json(resource);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add resource" });
  }
};

// ── Get resources for a project ───────────────────────────────────────────────
const getProjectResources = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { fileType } = req.query;

    const resources = await prisma.projectResource.findMany({
      where: { projectId, ...(fileType ? { fileType } : {}) },
      orderBy: { createdAt: "desc" },
      include: { uploader: { select: { id: true, username: true, avatarUrl: true } } },
    });

    res.json(resources);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch resources" });
  }
};

// ── Delete a resource ─────────────────────────────────────────────────────────
const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const resource = await prisma.projectResource.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    if (resource.uploaderId !== userId && resource.project.ownerId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await prisma.projectResource.delete({ where: { id } });
    res.json({ message: "Resource deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete resource" });
  }
};

module.exports = { addResource, getProjectResources, deleteResource };
