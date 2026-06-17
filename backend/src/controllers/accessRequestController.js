const prisma = require("../config/db");
const { logActivity } = require("../utils/activityLogger");
const { createNotification } = require("./notificationController");

// POST /access-requests
// Create a new access request for a project
const createAccessRequest = async (req, res) => {
  try {
    const {
      reason,
      suggestion,
      projectId,
    } = req.body;

    // Validate required fields
    if (!reason || !suggestion || !projectId) {
      return res.status(400).json({
        message: "Reason, suggestion, and project ID are required",
      });
    }

    const requesterId = req.user.id;

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    // Prevent owner from requesting access to their own project
    if (project.ownerId === requesterId) {
      return res.status(400).json({
        message: "You cannot request access to your own project",
      });
    }

    const existingRequest =
      await prisma.projectAccessRequest.findFirst({
        where: {
          projectId,
          requesterId,
          status: "PENDING",
        },
      });

    if (existingRequest) {
      return res.status(400).json({
        message: "Access request already pending",
      });
    }

    const request =
      await prisma.projectAccessRequest.create({
        data: {
          reason,
          suggestion,
          projectId,
          requesterId,
        },
      });

    // Log activity
    await logActivity(
      "ACCESS_REQUEST_CREATED",
      `${req.user.username} requested access to "${project.title}"`,
      projectId,
      req.user.id,
      { reason }
    );

    // Notify project owner
    await createNotification({
      type: "ACCESS_REQUEST",
      message: `${req.user.username} requested access to your project "${project.title}"`,
      receiverId: project.ownerId,
      senderId: req.user.id,
      projectId,
      link: `/requests`,
    });

    res.status(201).json(request);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create access request",
    });
  }
};


// GET /access-requests/mine
// Returns all requests submitted by the logged-in user
// Auth: required
// Query params: status (PENDING, APPROVED, REJECTED)
const getMyAccessRequests = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { status } = req.query;

    const where = { requesterId };
    
    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }

    const requests = await prisma.projectAccessRequest.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            ownerId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(requests);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch your access requests",
    });
  }
};


// GET /access-requests/incoming
// Returns all requests submitted to projects owned by the logged-in user
// Auth: required
// Query params: status (PENDING, APPROVED, REJECTED)
const getIncomingAccessRequests = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { status } = req.query;

    const where = {
      project: {
        ownerId,
      },
    };

    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }

    const requests = await prisma.projectAccessRequest.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        requester: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            githubUsername: true,
            githubProfileUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(requests);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch incoming access requests",
    });
  }
};


// PUT /access-requests/:id/approve
// Approve an access request — only the project owner can do this
// Creates a CONTRIBUTOR membership for the requester
// Auth: required
const approveAccessRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const existingRequest =
      await prisma.projectAccessRequest.findUnique({
        where: { id },
        include: {
          project: true,
        },
      });

    if (!existingRequest) {
      return res.status(404).json({
        message: "Access request not found",
      });
    }

    if (existingRequest.project.ownerId !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    // Approve request and create contributor membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update request status to APPROVED
      const request = await tx.projectAccessRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
        },
        include: {
          requester: true,
        },
      });

      // Create project membership for the requester
      // Use upsert to handle case where membership already exists
      await tx.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId: existingRequest.projectId,
            userId: existingRequest.requesterId,
          },
        },
        update: {}, // If already exists, do nothing
        create: {
          projectId: existingRequest.projectId,
          userId: existingRequest.requesterId,
          role: "CONTRIBUTOR",
        },
      });

      return request;
    });

    // Log activity
    await logActivity(
      "ACCESS_REQUEST_APPROVED",
      `${req.user.username} approved ${result.requester.username}'s access request to "${existingRequest.project.title}"`,
      existingRequest.projectId,
      req.user.id,
      { requesterId: existingRequest.requesterId }
    );

    await logActivity(
      "MEMBER_JOINED",
      `${result.requester.username} joined "${existingRequest.project.title}"`,
      existingRequest.projectId,
      existingRequest.requesterId,
      { role: "CONTRIBUTOR" }
    );

    // Notify the requester
    await createNotification({
      type: "REQUEST_APPROVED",
      message: `Your access request to "${existingRequest.project.title}" was approved! You are now a contributor.`,
      receiverId: existingRequest.requesterId,
      senderId: req.user.id,
      projectId: existingRequest.projectId,
      link: `/projects/${existingRequest.projectId}`,
    });

    res.status(200).json(result);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to approve access request",
    });
  }
};


// PUT /access-requests/:id/reject
// Reject an access request — only the project owner can do this
// Auth: required
const rejectAccessRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const existingRequest =
      await prisma.projectAccessRequest.findUnique({
        where: { id },
        include: {
          project: true,
        },
      });

    if (!existingRequest) {
      return res.status(404).json({
        message: "Access request not found",
      });
    }

    if (existingRequest.project.ownerId !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const request = await prisma.projectAccessRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
      },
      include: {
        requester: true,
      },
    });

    // Log activity
    await logActivity(
      "ACCESS_REQUEST_REJECTED",
      `${req.user.username} rejected ${request.requester.username}'s access request to "${existingRequest.project.title}"`,
      existingRequest.projectId,
      req.user.id,
      { requesterId: existingRequest.requesterId }
    );

    // Notify the requester
    await createNotification({
      type: "REQUEST_REJECTED",
      message: `Your access request to "${existingRequest.project.title}" was not approved at this time.`,
      receiverId: existingRequest.requesterId,
      senderId: req.user.id,
      projectId: existingRequest.projectId,
      link: `/requests`,
    });

    res.status(200).json(request);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to reject access request",
    });
  }
};

// GET /access-requests/check/:projectId
// Returns the current user's request status for a project (if any)
const checkMyRequest = async (req, res) => {
  try {
    const { projectId } = req.params;
    const requesterId = req.user.id;

    const request = await prisma.projectAccessRequest.findFirst({
      where: { projectId, requesterId },
      orderBy: { createdAt: "desc" },
    });

    if (!request) {
      return res.status(200).json({ hasRequest: false, request: null });
    }
    res.status(200).json({ hasRequest: true, request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to check request status" });
  }
};

module.exports = {
  createAccessRequest,
  getMyAccessRequests,
  getIncomingAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
  checkMyRequest,
};
