const prisma = require("../config/db");
const { checkDuplicateRating } = require("../utils/ratingUtils");

// ── Rate a contributor (owner → contributor) ──────────────────────────────────
const rateContributor = async (req, res) => {
  try {
    const { receiverId, projectId, pullRequestId, codeQuality, communication, timeliness, overall, comment } = req.body;
    const giverId = req.user.id;

    if (!receiverId || !projectId || !codeQuality || !communication || !timeliness || !overall) {
      return res.status(400).json({ message: "receiverId, projectId, and all rating fields (1-5) are required" });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.ownerId !== giverId) return res.status(403).json({ message: "Only the project owner can rate contributors" });
    if (giverId === receiverId) return res.status(400).json({ message: "Cannot rate yourself" });

    // Check for an existing rating before attempting to create
    const existingRating = pullRequestId
      ? await prisma.contributorRating.findUnique({ where: { giverId_receiverId_pullRequestId: { giverId, receiverId, pullRequestId } } }).catch(() => null)
      : null;
    if (checkDuplicateRating(existingRating)) {
      return res.status(409).json({ message: "You have already rated this contributor for this PR" });
    }

    const rating = await prisma.contributorRating.create({
      data: {
        giverId, receiverId, projectId,
        pullRequestId: pullRequestId || null,
        codeQuality: parseInt(codeQuality),
        communication: parseInt(communication),
        timeliness: parseInt(timeliness),
        overall: parseInt(overall),
        comment: comment || null,
      },
      include: {
        receiver: { select: { id: true, username: true, avatarUrl: true } },
        project: { select: { id: true, title: true } },
      },
    });

    // Notify the rated contributor
    await prisma.notification.create({
      data: {
        type: "NEW_RATING",
        message: `You received a ${overall}/5 rating for your contribution to "${project.title}"`,
        receiverId,
        senderId: giverId,
        projectId,
        link: `/users/${receiverId}`,
      },
    }).catch(() => {});

    // Update contributor tier based on avg overall
    await updateContributorTier(receiverId).catch(() => {});

    res.status(201).json(rating);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "You have already rated this contributor for this PR" });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to submit rating" });
  }
};

// ── Get ratings received by a user ───────────────────────────────────────────
const getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;

    const ratings = await prisma.contributorRating.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        giver: { select: { id: true, username: true, avatarUrl: true } },
        project: { select: { id: true, title: true } },
        pullRequest: { select: { id: true, title: true } },
      },
    });

    // Compute averages
    // Averages are computed in JS over the already-fetched ratings array.
    const avg = ratings.length ? {
      codeQuality:  +(ratings.reduce((s, r) => s + r.codeQuality, 0)  / ratings.length).toFixed(1),
      communication:+(ratings.reduce((s, r) => s + r.communication, 0)/ ratings.length).toFixed(1),
      timeliness:   +(ratings.reduce((s, r) => s + r.timeliness, 0)   / ratings.length).toFixed(1),
      overall:      +(ratings.reduce((s, r) => s + r.overall, 0)       / ratings.length).toFixed(1),
      count: ratings.length,
    } : null;

    res.json({ ratings, averages: avg });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch ratings" });
  }
};

// ── Rate a project (contributor → project) ────────────────────────────────────
const rateProject = async (req, res) => {
  try {
    const { projectId, ui, performance, codeQuality, overall, comment } = req.body;
    const userId = req.user.id;

    if (!projectId || !ui || !performance || !codeQuality || !overall) {
      return res.status(400).json({ message: "projectId and all rating fields (1-5) are required" });
    }

    // Must be a member to rate
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!membership) return res.status(403).json({ message: "Only project members can rate a project" });

    const rating = await prisma.projectRating.upsert({
      where: { projectId_userId: { projectId, userId } },
      create: {
        projectId, userId,
        ui: parseInt(ui),
        performance: parseInt(performance),
        codeQuality: parseInt(codeQuality),
        overall: parseInt(overall),
        comment: comment || null,
      },
      update: {
        ui: parseInt(ui),
        performance: parseInt(performance),
        codeQuality: parseInt(codeQuality),
        overall: parseInt(overall),
        comment: comment || null,
      },
      include: { project: { select: { id: true, title: true } } },
    });

    res.status(201).json(rating);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to submit project rating" });
  }
};

// ── Get project ratings ───────────────────────────────────────────────────────
const getProjectRatings = async (req, res) => {
  try {
    const { projectId } = req.params;

    const ratings = await prisma.projectRating.findMany({
      where: { projectId },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    });

    const avg = ratings.length ? {
      ui:          +(ratings.reduce((s, r) => s + r.ui, 0)          / ratings.length).toFixed(1),
      performance: +(ratings.reduce((s, r) => s + r.performance, 0)  / ratings.length).toFixed(1),
      codeQuality: +(ratings.reduce((s, r) => s + r.codeQuality, 0)  / ratings.length).toFixed(1),
      overall:     +(ratings.reduce((s, r) => s + r.overall, 0)      / ratings.length).toFixed(1),
      count: ratings.length,
    } : null;

    res.json({ ratings, averages: avg });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch project ratings" });
  }
};

// ── Helper: update contributor tier based on avg overall rating ───────────────
async function updateContributorTier(userId) {
  const ratings = await prisma.contributorRating.findMany({ where: { receiverId: userId } });
  if (ratings.length === 0) return;

  const avgOverall = ratings.reduce((s, r) => s + r.overall, 0) / ratings.length;
  const contributions = await prisma.projectMember.count({ where: { userId, role: "CONTRIBUTOR" } });

  let tier = "TESTER";
  if (avgOverall >= 4.5 && contributions >= 10) tier = "TRUSTED_REVIEWER";
  else if (avgOverall >= 4.0 && contributions >= 5) tier = "PAID_CONTRIBUTOR";
  else if (avgOverall >= 3.5 && contributions >= 3) tier = "EXPERT_TESTER";
  else if (avgOverall >= 3.0 && contributions >= 1) tier = "VERIFIED_TESTER";

  await prisma.user.update({ where: { id: userId }, data: { contributorTier: tier } });
}

module.exports = { rateContributor, getUserRatings, rateProject, getProjectRatings };
