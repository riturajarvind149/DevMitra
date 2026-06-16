const prisma = require("../config/db");

// POST /access-requests
// Create a new access request for a project
const createAccessRequest = async (req, res) => {
  try {
    const {
      reason,
      suggestion,
      projectId,
    } = req.body;

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
const getMyAccessRequests = async (req, res) => {
  try {
    const requesterId = req.user.id;

    const requests = await prisma.projectAccessRequest.findMany({
      where: {
        requesterId,
      },
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
const getIncomingAccessRequests = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const requests = await prisma.projectAccessRequest.findMany({
      where: {
        project: {
          ownerId,
        },
      },
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
    });

    res.status(200).json(request);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to reject access request",
    });
  }
};

module.exports = {
  createAccessRequest,
  getMyAccessRequests,
  getIncomingAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
};
