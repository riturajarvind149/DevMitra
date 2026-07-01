const prisma = require("../config/db");
const { logActivity } = require("../utils/activityLogger");
const { recordDailyActivity, awardBadges } = require("./profileController");
const { parsePagination } = require("../utils/pagination");

// Helper — check if requesting user is a member of the project
async function isMember(projectId, userId) {
  if (!userId) return false;
  const m = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return !!m;
}

// Helper — strip sensitive fields based on repo privacy + membership
function applyRepoVisibility(project, userId) {
  const member = project.members?.some((m) => m.userId === userId);
  const owner = project.ownerId === userId;
  if (project.isRepoPrivate && !member && !owner) {
    return { ...project, githubRepoUrl: null, _repoHidden: true };
  }
  return { ...project, _repoHidden: false };
}

// POST /projects
const createProject = async (req, res) => {
  try {
    const {
      title, description, deployedUrl, githubRepoUrl,
      tags, coverImage, images, category,
      isRepoPrivate, visibility, openRoles, isPaid, budget,
    } = req.body;

    if (!title || !description || !deployedUrl) {
      return res.status(400).json({ message: "Title, description, and deployed URL are required" });
    }
    if (tags && !Array.isArray(tags)) {
      return res.status(400).json({ message: "Tags must be an array" });
    }
    if (openRoles && !Array.isArray(openRoles)) {
      return res.status(400).json({ message: "openRoles must be an array" });
    }

    const VALID_VISIBILITY = ["PUBLIC", "UNLISTED", "PRIVATE"];
    const vis = (visibility || "PUBLIC").toUpperCase();
    if (!VALID_VISIBILITY.includes(vis)) {
      return res.status(400).json({ message: "visibility must be PUBLIC, UNLISTED, or PRIVATE" });
    }

    const ownerId = req.user.id;

    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          title, description, deployedUrl,
          githubRepoUrl: githubRepoUrl || null,
          tags: tags || [],
          coverImage: coverImage || null,
          images: images || [],
          category: category || null,
          isRepoPrivate: !!isRepoPrivate,
          visibility: vis,
          openRoles: openRoles || [],
          isPaid: !!isPaid,
          budget: budget || null,
          ownerId,
        },
      });
      await tx.projectMember.create({
        data: { projectId: newProject.id, userId: ownerId, role: "OWNER" },
      });
      return newProject;
    });

    await logActivity("PROJECT_CREATED", `${req.user.username} created project "${title}"`, project.id, req.user.id, { title });

    // Record contribution activity for streak
    recordDailyActivity(req.user.id).catch(() => {});
    awardBadges(req.user.id).catch(() => {});

    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create project" });
  }
};

// GET /projects
// Visibility rules:
//   PUBLIC  — visible to everyone
//   UNLISTED — not in public listings, accessible via direct link
//   PRIVATE — only visible to members + owner
const getProjects = async (req, res) => {
  try {
    const { search, owner, sort } = req.query;
    const requestingUserId = req.user?.id || null;

    const where = { visibility: "PUBLIC" };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (owner) {
      where.owner = { username: { contains: owner, mode: "insensitive" } };
    }

    const { take, skip } = parsePagination(req.query, 50);
    const total = await prisma.project.count({ where });

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, username: true, avatarUrl: true, githubUsername: true } },
        _count: { select: { members: true, accessRequests: true, likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });

    // Score-based trending sort: likes*3 + comments*2 + members*2 + recency bonus
    let sorted = projects;
    if (sort === "trending") {
      const now = Date.now();
      // Trending score: likes*3 + comments*2 + members*2 + max(0, 30-ageDays)
      sorted = [...projects].sort((a, b) => {
        const ageA = (now - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24); // days
        const ageB = (now - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        const scoreA = (a._count.likes * 3) + (a._count.comments * 2) + (a._count.members * 2) + Math.max(0, 30 - ageA);
        const scoreB = (b._count.likes * 3) + (b._count.comments * 2) + (b._count.members * 2) + Math.max(0, 30 - ageB);
        return scoreB - scoreA;
      });
    }

    const safeProjects = sorted.map((p) => applyRepoVisibility({ ...p, members: [] }, requestingUserId));
    res.status(200).json({ projects: safeProjects, pagination: { total, limit: take, offset: skip, hasMore: skip + take < total } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
};

// GET /projects/:id
// Direct access — respects PRIVATE visibility
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user?.id || null;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, username: true, avatarUrl: true, githubUsername: true, githubProfileUrl: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true, githubUsername: true, githubProfileUrl: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
        _count: { select: { accessRequests: true, likes: true, comments: true } },
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // PRIVATE project: only members/owner can view
    if (project.visibility === "PRIVATE") {
      const allowed = requestingUserId === project.ownerId ||
        project.members.some((m) => m.userId === requestingUserId);
      if (!allowed) {
        return res.status(403).json({ message: "This project is private" });
      }
    }

    // Attach accurate member count from the actual members array
    const safeProject = applyRepoVisibility(project, requestingUserId);
    res.status(200).json({
      ...safeProject,
      _count: {
        ...safeProject._count,
        members: project.members.length,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch project" });
  }
};

// GET /projects/my
const getMyProjects = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const projects = await prisma.project.findMany({
      where: { ownerId },
      include: {
        owner: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { members: true, accessRequests: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch your projects" });
  }
};

// PUT /projects/:id
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Project not found" });
    if (existing.ownerId !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    const {
      title, description, deployedUrl, githubRepoUrl,
      tags, coverImage, images, category,
      isRepoPrivate, visibility, openRoles, isPaid, budget,
    } = req.body;

    if (visibility) {
      const VALID = ["PUBLIC", "UNLISTED", "PRIVATE"];
      if (!VALID.includes(visibility.toUpperCase())) {
        return res.status(400).json({ message: "visibility must be PUBLIC, UNLISTED, or PRIVATE" });
      }
    }

    const data = {};
    if (title) data.title = title;
    if (description) data.description = description;
    if (deployedUrl) data.deployedUrl = deployedUrl;
    if (githubRepoUrl !== undefined) data.githubRepoUrl = githubRepoUrl;
    if (tags !== undefined) data.tags = tags;
    if (coverImage !== undefined) data.coverImage = coverImage;
    if (images !== undefined) data.images = images;
    if (category !== undefined) data.category = category;
    if (isRepoPrivate !== undefined) data.isRepoPrivate = !!isRepoPrivate;
    // visibility is only updated when explicitly provided in req.body — never force-changed on completion
    if (visibility !== undefined) data.visibility = visibility.toUpperCase();
    if (openRoles !== undefined) data.openRoles = openRoles;
    if (isPaid !== undefined) data.isPaid = !!isPaid;
    if (budget !== undefined) data.budget = budget || null;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "At least one field is required to update" });
    }

    const project = await prisma.project.update({ where: { id }, data });
    await logActivity("PROJECT_UPDATED", `${req.user.username} updated project "${project.title}"`, project.id, req.user.id, { updatedFields: Object.keys(data) });
    res.status(200).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update project" });
  }
};

// GET /projects/:id/stats
const getProjectStats = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Private project: only owner or members can view stats
    if (project.visibility === "PRIVATE") {
      const allowed = req.user?.id === project.ownerId || await isMember(id, req.user?.id);
      if (!allowed) return res.status(403).json({ message: "Not authorized" });
    }

    const [totalMembers, pending, approved, rejected, totalActivities] = await Promise.all([
      prisma.projectMember.count({ where: { projectId: id } }),
      prisma.projectAccessRequest.count({ where: { projectId: id, status: "PENDING" } }),
      prisma.projectAccessRequest.count({ where: { projectId: id, status: "APPROVED" } }),
      prisma.projectAccessRequest.count({ where: { projectId: id, status: "REJECTED" } }),
      prisma.activityLog.count({ where: { projectId: id } }),
    ]);

    res.status(200).json({
      projectId: id,
      members: totalMembers,
      accessRequests: { pending, approved, rejected, total: pending + approved + rejected },
      activities: totalActivities,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch project stats" });
  }
};

// DELETE /projects/:id
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Project not found" });
    if (existing.ownerId !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    await prisma.project.delete({ where: { id } });
    await logActivity("PROJECT_DELETED", `${req.user.username} deleted project "${existing.title}"`, null, req.user.id, { projectTitle: existing.title });
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete project" });
  }
};

module.exports = { createProject, getProjects, getMyProjects, getProjectById, getProjectStats, updateProject, deleteProject };
