const prisma = require("../config/db");
const { createNotification } = require("./notificationController");

const INCLUDE_FULL = {
  requester: { select: { id:true, username:true, avatarUrl:true, githubUsername:true, githubProfileUrl:true, skills:true } },
  project:   { select: { id:true, title:true, ownerId:true } },
  reviewedBy:{ select: { id:true, username:true, avatarUrl:true } },
};

// POST /repo-requests
const createRepoRequest = async (req, res) => {
  try {
    const { projectId, requestedRole, githubProfile, experienceDescription, availabilityHours, portfolioUrl, additionalMessage } = req.body;
    if (!projectId || !requestedRole || !githubProfile || !experienceDescription || !availabilityHours)
      return res.status(400).json({ message: "projectId, requestedRole, githubProfile, experienceDescription, and availabilityHours are required" });

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.ownerId === req.user.id) return res.status(400).json({ message: "Owners already have access" });

    // Check if member — already has access
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });
    if (member) return res.status(400).json({ message: "You are already a member with repository access" });

    // Check duplicate pending request
    const existing = await prisma.repositoryAccessRequest.findFirst({
      where: { projectId, requesterId: req.user.id, status: "PENDING" },
    });
    if (existing) return res.status(400).json({ message: "You already have a pending repository access request" });

    const request = await prisma.repositoryAccessRequest.create({
      data: { projectId, requesterId: req.user.id, requestedRole, githubProfile, experienceDescription, availabilityHours: parseInt(availabilityHours), portfolioUrl, additionalMessage, status: "PENDING" },
      include: INCLUDE_FULL,
    });

    await createNotification({
      type: "REPO_REQUEST",
      message: `${req.user.username} requested repository access for "${project.title}"`,
      receiverId: project.ownerId,
      senderId: req.user.id,
      projectId,
      link: `/repo-requests`,
    });

    res.status(201).json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create repository access request" });
  }
};

// GET /repo-requests/mine
const getMyRepoRequests = async (req, res) => {
  try {
    const requests = await prisma.repositoryAccessRequest.findMany({
      where: { requesterId: req.user.id },
      include: INCLUDE_FULL,
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch your requests" });
  }
};

// GET /repo-requests/incoming
const getIncomingRepoRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const where = { project: { ownerId: req.user.id } };
    if (status) where.status = status.toUpperCase();

    const requests = await prisma.repositoryAccessRequest.findMany({
      where,
      include: INCLUDE_FULL,
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch incoming requests" });
  }
};

// GET /repo-requests/check/:projectId
const checkMyRepoRequest = async (req, res) => {
  try {
    const { projectId } = req.params;
    const request = await prisma.repositoryAccessRequest.findFirst({
      where: { projectId, requesterId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ hasRequest: !!request, request: request || null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to check request" });
  }
};

// PUT /repo-requests/:id/approve
const approveRepoRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.repositoryAccessRequest.findUnique({ where: { id }, include: { project: true, requester: true } });
    if (!existing) return res.status(404).json({ message: "Request not found" });
    if (existing.project.ownerId !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    if (existing.status !== "PENDING") return res.status(400).json({ message: "Request already processed" });

    const updated = await prisma.repositoryAccessRequest.update({
      where: { id },
      data: { status: "APPROVED", reviewedById: req.user.id, reviewedAt: new Date() },
      include: INCLUDE_FULL,
    });

    // Also add as contributor member if not already
    await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: existing.projectId, userId: existing.requesterId } },
      update: {},
      create: { projectId: existing.projectId, userId: existing.requesterId, role: "CONTRIBUTOR" },
    });

    await createNotification({
      type: "REPO_APPROVED",
      message: `Your repository access request for "${existing.project.title}" was approved! You can now access the repository.`,
      receiverId: existing.requesterId,
      senderId: req.user.id,
      projectId: existing.projectId,
      link: `/projects/${existing.projectId}`,
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to approve request" });
  }
};

// PUT /repo-requests/:id/reject
const rejectRepoRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.repositoryAccessRequest.findUnique({ where: { id }, include: { project: true } });
    if (!existing) return res.status(404).json({ message: "Request not found" });
    if (existing.project.ownerId !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    const updated = await prisma.repositoryAccessRequest.update({
      where: { id },
      data: { status: "REJECTED", reviewedById: req.user.id, reviewedAt: new Date() },
      include: INCLUDE_FULL,
    });

    await createNotification({
      type: "REPO_REJECTED",
      message: `Your repository access request for "${existing.project.title}" was not approved at this time.`,
      receiverId: existing.requesterId,
      senderId: req.user.id,
      projectId: existing.projectId,
      link: `/repo-requests`,
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to reject request" });
  }
};

module.exports = { createRepoRequest, getMyRepoRequests, getIncomingRepoRequests, checkMyRepoRequest, approveRepoRequest, rejectRepoRequest };
