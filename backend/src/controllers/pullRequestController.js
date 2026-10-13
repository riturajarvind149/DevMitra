const prisma = require("../config/db");
const { recordDailyActivity, awardBadges } = require("./profileController");
const { parsePagination } = require("../utils/pagination");

const VALID_PR_STATUS = ["OPEN", "UNDER_REVIEW", "MERGED", "CLOSED"];
const VALID_PR_TYPE = ["BUG_FIX", "FEATURE", "REFACTOR", "DOCS", "TEST"];

// ── Create pull request ───────────────────────────────────────────────────────
const createPullRequest = async (req, res) => {
  try {
    const {
      projectId, title, description, branchName, prUrl,
      type = "FEATURE", isPaid = false, agreedPrice, bugReportId,
    } = req.body;
    const authorId = req.user.id;

    if (!projectId || !title || !description) {
      return res.status(400).json({ message: "projectId, title, and description are required" });
    }

    if (!VALID_PR_TYPE.includes(type)) {
      return res.status(400).json({ message: "Invalid type value" });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.ownerId === authorId) {
      return res.status(400).json({ message: "You cannot submit a PR to your own project" });
    }

    // Gate: author must be a member OR have an approved repo-access request
    const [membership, repoAccess] = await Promise.all([
      prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: authorId } },
      }),
      prisma.repositoryAccessRequest.findFirst({
        where: { projectId, requesterId: authorId, status: "APPROVED" },
      }),
    ]);
    if (!membership && !repoAccess) {
      return res.status(403).json({
        message: "You must be a project member or have approved repository access to submit a pull request",
      });
    }

    if (bugReportId) {
      const bug = await prisma.bugReport.findUnique({ where: { id: bugReportId } });
      if (!bug) return res.status(404).json({ message: "Bug report not found" });
      if (bug.projectId !== projectId) {
        return res.status(400).json({
          message: "The referenced bug report does not belong to this project",
        });
      }
    }

    const pr = await prisma.pullRequest.create({
      data: {
        projectId, authorId, title, description, type,
        branchName: branchName || null,
        prUrl: prUrl || null,
        isPaid: !!isPaid,
        agreedPrice: agreedPrice ? parseFloat(agreedPrice) : null,
        bugReportId: bugReportId || null,
        reviewerId: project.ownerId,
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        project: { select: { id: true, title: true } },
        bugReport: { select: { id: true, title: true, type: true } },
      },
    });

    await recordDailyActivity(authorId).catch(() => {});
    await awardBadges(authorId).catch(() => {});

    // Notify project owner
    await prisma.notification.create({
      data: {
        type: "PULL_REQUEST",
        message: `New pull request submitted for "${project.title}": ${title}`,
        receiverId: project.ownerId,
        senderId: authorId,
        projectId,
        link: `/projects/${projectId}`,
      },
    }).catch(() => {});

    res.status(201).json(pr);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create pull request" });
  }
};

// ── Get PRs for a project ─────────────────────────────────────────────────────
const getProjectPullRequests = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;
    const { take, skip } = parsePagination(req.query, 20);

    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { visibility: true, ownerId: true } });
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.visibility === "PRIVATE") {
      const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: req.user?.id ?? "" } },
      });
      if (!member && project.ownerId !== req.user?.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
    }

    const where = { projectId, ...(status ? { status } : {}) };

    const [pullRequests, total] = await Promise.all([
      prisma.pullRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          author: { select: { id: true, username: true, avatarUrl: true } },
          bugReport: { select: { id: true, title: true, type: true } },
        },
      }),
      prisma.pullRequest.count({ where }),
    ]);

    res.json({ pullRequests, pagination: { total, limit: take, offset: skip } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch pull requests" });
  }
};

// ── Get single PR ─────────────────────────────────────────────────────────────
const getPullRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const pr = await prisma.pullRequest.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true, contributorTier: true } },
        reviewer: { select: { id: true, username: true, avatarUrl: true } },
        project: { select: { id: true, title: true, ownerId: true } },
        bugReport: { select: { id: true, title: true, type: true, severity: true } },
        ratings: { include: { giver: { select: { id: true, username: true, avatarUrl: true } } } },
      },
    });
    if (!pr) return res.status(404).json({ message: "Pull request not found" });
    res.json(pr);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch pull request" });
  }
};

// ── Review PR (owner: merge / close) ─────────────────────────────────────────
const reviewPullRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNote } = req.body; // MERGED | CLOSED | UNDER_REVIEW
    const userId = req.user.id;

    if (!VALID_PR_STATUS.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const pr = await prisma.pullRequest.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!pr) return res.status(404).json({ message: "Pull request not found" });
    if (pr.project.ownerId !== userId) return res.status(403).json({ message: "Only the project owner can review PRs" });

    const updated = await prisma.pullRequest.update({
      where: { id },
      data: {
        status,
        reviewNote: reviewNote || null,
        mergedAt: status === "MERGED" ? new Date() : null,
      },
      include: { author: { select: { id: true, username: true, avatarUrl: true } } },
    });

    // Notify PR author
    const action = status === "MERGED" ? "merged" : status === "CLOSED" ? "closed" : "reviewed";
    await prisma.notification.create({
      data: {
        type: "PR_REVIEWED",
        message: `Your pull request "${pr.title}" was ${action} on "${pr.project.title}"`,
        receiverId: pr.authorId,
        senderId: userId,
        projectId: pr.projectId,
        link: `/projects/${pr.projectId}`,
      },
    }).catch(() => {});

    // If PR merged — record contribution activity for author
    if (status === "MERGED") {
      const { recordDailyActivity, awardBadges } = require("./profileController");
      recordDailyActivity(pr.authorId).catch(() => {});
      awardBadges(pr.authorId).catch(() => {});
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to review pull request" });
  }
};

// ── Get my pull requests ──────────────────────────────────────────────────────
const getMyPullRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const pullRequests = await prisma.pullRequest.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, title: true, coverImage: true } },
        bugReport: { select: { id: true, title: true } },
      },
    });
    res.json(pullRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch pull requests" });
  }
};

// ── Get incoming PRs (for project owner) ─────────────────────────────────────
const getIncomingPullRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const where = {
      project: { ownerId: userId },
      ...(status ? { status } : {}),
    };

    const pullRequests = await prisma.pullRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true, contributorTier: true } },
        project: { select: { id: true, title: true } },
        bugReport: { select: { id: true, title: true } },
      },
    });
    res.json(pullRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch pull requests" });
  }
};

module.exports = {
  createPullRequest,
  getProjectPullRequests,
  getPullRequest,
  reviewPullRequest,
  getMyPullRequests,
  getIncomingPullRequests,
};
