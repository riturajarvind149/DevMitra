const prisma = require("../config/db");
const { recordDailyActivity, awardBadges } = require("./profileController");

// ── Create bug report ─────────────────────────────────────────────────────────
const createBugReport = async (req, res) => {
  try {
    const { projectId, title, description, type = "BUG", severity = "MEDIUM" } = req.body;
    const reporterId = req.user.id;

    if (!projectId || !title || !description) {
      return res.status(400).json({ message: "projectId, title, and description are required" });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ message: "Project not found" });

    const bugReport = await prisma.bugReport.create({
      data: { projectId, reporterId, title, description, type, severity },
      include: { reporter: { select: { id: true, username: true, avatarUrl: true } }, project: { select: { id: true, title: true } } },
    });

    await recordDailyActivity(reporterId).catch(() => {});
    await awardBadges(reporterId).catch(() => {});

    // Notify project owner
    if (project.ownerId !== reporterId) {
      await prisma.notification.create({
        data: {
          type: "BUG_REPORT",
          message: `New ${type.toLowerCase().replace("_", " ")} reported on your project "${project.title}": ${title}`,
          receiverId: project.ownerId,
          senderId: reporterId,
          projectId,
          link: `/projects/${projectId}`,
        },
      }).catch(() => {});
    }

    res.status(201).json(bugReport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create bug report" });
  }
};

// ── Get bug reports for a project ────────────────────────────────────────────
const getProjectBugReports = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, type, limit = 20, offset = 0 } = req.query;

    const where = { projectId, ...(status ? { status } : {}), ...(type ? { type } : {}) };

    const [bugReports, total] = await Promise.all([
      prisma.bugReport.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: parseInt(limit),
        skip: parseInt(offset),
        include: {
          reporter: { select: { id: true, username: true, avatarUrl: true } },
          pullRequests: { select: { id: true, title: true, status: true } },
        },
      }),
      prisma.bugReport.count({ where }),
    ]);

    res.json({ bugReports, pagination: { total, limit: parseInt(limit), offset: parseInt(offset) } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch bug reports" });
  }
};

// ── Get single bug report ─────────────────────────────────────────────────────
const getBugReport = async (req, res) => {
  try {
    const { id } = req.params;
    const bugReport = await prisma.bugReport.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, username: true, avatarUrl: true } },
        project: { select: { id: true, title: true, ownerId: true } },
        pullRequests: { select: { id: true, title: true, status: true, author: { select: { id: true, username: true, avatarUrl: true } } } },
      },
    });
    if (!bugReport) return res.status(404).json({ message: "Bug report not found" });
    res.json(bugReport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch bug report" });
  }
};

// ── Update bug report status (owner only) ─────────────────────────────────────
const updateBugReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution, assignedTo, severity } = req.body;
    const userId = req.user.id;

    const bugReport = await prisma.bugReport.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!bugReport) return res.status(404).json({ message: "Bug report not found" });

    // Only project owner or reporter can update
    if (bugReport.project.ownerId !== userId && bugReport.reporterId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updated = await prisma.bugReport.update({
      where: { id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(resolution !== undefined ? { resolution } : {}),
        ...(assignedTo !== undefined ? { assignedTo } : {}),
        ...(severity !== undefined ? { severity } : {}),
      },
      include: { reporter: { select: { id: true, username: true, avatarUrl: true } } },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update bug report" });
  }
};

// ── Delete bug report ─────────────────────────────────────────────────────────
const deleteBugReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const bugReport = await prisma.bugReport.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!bugReport) return res.status(404).json({ message: "Bug report not found" });
    if (bugReport.reporterId !== userId && bugReport.project.ownerId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await prisma.bugReport.delete({ where: { id } });
    res.json({ message: "Bug report deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete bug report" });
  }
};

// ── Get my bug reports ────────────────────────────────────────────────────────
const getMyBugReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const bugReports = await prisma.bugReport.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: "desc" },
      include: { project: { select: { id: true, title: true, coverImage: true } } },
    });
    res.json(bugReports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch bug reports" });
  }
};

// getBugComments and addBugComment are exported below

// ── Get bug comments (reporter + project owner only) ─────────────────────────
const getBugComments = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const bug = await prisma.bugReport.findUnique({
      where: { id },
      include: { project: { select: { ownerId: true } } },
    });
    if (!bug) return res.status(404).json({ message: "Bug report not found" });

    // Only reporter or project owner can see these comments
    if (bug.reporterId !== userId && bug.project.ownerId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const comments = await prisma.bugComment.findMany({
      where: { bugReportId: id },
      include: { author: { select: { id: true, username: true, avatarUrl: true } } },
      orderBy: { createdAt: "asc" },
    });

    res.status(200).json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch bug comments" });
  }
};

// ── Add bug comment (reporter + project owner only) ───────────────────────────
const addBugComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content?.trim()) return res.status(400).json({ message: "Content is required" });

    const bug = await prisma.bugReport.findUnique({
      where: { id },
      include: { project: { select: { ownerId: true, title: true } } },
    });
    if (!bug) return res.status(404).json({ message: "Bug report not found" });

    // Only reporter or project owner can comment
    if (bug.reporterId !== userId && bug.project.ownerId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const comment = await prisma.bugComment.create({
      data: { bugReportId: id, authorId: userId, content: content.trim() },
      include: { author: { select: { id: true, username: true, avatarUrl: true } } },
    });

    // Notify the other party
    const notifyId = userId === bug.reporterId ? bug.project.ownerId : bug.reporterId;
    await prisma.notification.create({
      data: {
        type: "BUG_REPORT",
        message: `New reply on bug report "${bug.title}" in "${bug.project.title}"`,
        receiverId: notifyId,
        senderId: userId,
        projectId: bug.projectId,
        link: `/projects/${bug.projectId}`,
      },
    }).catch(() => {});

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add comment" });
  }
};

module.exports = {
  createBugReport, getProjectBugReports, getBugReport,
  updateBugReport, deleteBugReport, getMyBugReports,
  getBugComments, addBugComment,
};
