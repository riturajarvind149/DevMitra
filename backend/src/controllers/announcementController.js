const prisma = require("../config/db");

// ── Create announcement (owner only) ─────────────────────────────────────────
const createAnnouncement = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, content, audience = "ALL" } = req.body;
    const authorId = req.user.id;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: "Title and content are required" });
    }
    if (!["ALL", "CONTRIBUTORS"].includes(audience)) {
      return res.status(400).json({ message: "audience must be ALL or CONTRIBUTORS" });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.ownerId !== authorId) return res.status(403).json({ message: "Only the project owner can post announcements" });

    const announcement = await prisma.projectAnnouncement.create({
      data: { projectId, authorId, title, content, audience },
      include: { author: { select: { id: true, username: true, avatarUrl: true } } },
    });

    // Notify based on audience
    const membersQuery = { where: { projectId, userId: { not: authorId } } };
    if (audience === "CONTRIBUTORS") {
      membersQuery.where.role = "CONTRIBUTOR";
    }
    const members = await prisma.projectMember.findMany({
      ...membersQuery,
      select: { userId: true },
    });

    if (members.length > 0) {
      await prisma.notification.createMany({
        data: members.map(m => ({
          type: "ANNOUNCEMENT",
          message: `New announcement on "${project.title}": ${title}`,
          receiverId: m.userId,
          senderId: authorId,
          projectId,
          link: `/projects/${projectId}#ann-${announcement.id}`,
        })),
        skipDuplicates: true,
      });
    }

    res.status(201).json(announcement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create announcement" });
  }
};

// ── Get announcements for a project ──────────────────────────────────────────
// Viewers see ALL audience; contributors also see CONTRIBUTORS audience
const getAnnouncements = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id || null;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Check if user is a contributor/owner
    let isContributor = false;
    if (userId) {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });
      isContributor = !!membership;
    }

    // Owner and contributors see all; others see only ALL audience
    const audienceFilter = isContributor
      ? { OR: [{ audience: "ALL" }, { audience: "CONTRIBUTORS" }] }
      : { audience: "ALL" };

    const announcements = await prisma.projectAnnouncement.findMany({
      where: { projectId, ...audienceFilter },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, username: true, avatarUrl: true } } },
    });

    res.json(announcements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
};

// ── Delete announcement (owner only) ─────────────────────────────────────────
const deleteAnnouncement = async (req, res) => {
  try {
    const { projectId, id } = req.params;
    const userId = req.user.id;

    const ann = await prisma.projectAnnouncement.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!ann) return res.status(404).json({ message: "Announcement not found" });
    if (ann.project.ownerId !== userId) return res.status(403).json({ message: "Not authorized" });

    // Delete related notifications — match by the announcement id in the link
    await prisma.notification.deleteMany({
      where: {
        type: "ANNOUNCEMENT",
        projectId,
        link: { contains: `ann-${id}` },
      },
    });

    await prisma.projectAnnouncement.delete({ where: { id } });
    res.json({ message: "Announcement deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete announcement" });
  }
};

// ── Mark project complete (owner only) ───────────────────────────────────────
const markProjectComplete = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.ownerId !== userId) return res.status(403).json({ message: "Only the project owner can mark it complete" });

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        visibility: "PRIVATE", // hide from public explore
      },
    });

    // Notify all members
    const members = await prisma.projectMember.findMany({
      where: { projectId, userId: { not: userId } },
      select: { userId: true },
    });
    if (members.length > 0) {
      await prisma.notification.createMany({
        data: members.map(m => ({
          type: "PROJECT_COMPLETED",
          message: `"${project.title}" has been marked as completed by the owner`,
          receiverId: m.userId,
          senderId: userId,
          projectId,
          link: `/projects/${projectId}`,
        })),
        skipDuplicates: true,
      });
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to mark project complete" });
  }
};

// ── Reopen project (owner only) ───────────────────────────────────────────────
const reopenProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.ownerId !== userId) return res.status(403).json({ message: "Not authorized" });

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { isCompleted: false, completedAt: null, visibility: "PUBLIC" },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to reopen project" });
  }
};

module.exports = { createAnnouncement, getAnnouncements, deleteAnnouncement, markProjectComplete, reopenProject };
