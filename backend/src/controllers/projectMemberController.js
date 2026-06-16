const prisma = require("../config/db");

// GET /projects/:projectId/members
// Get all members of a project
// No auth required — public endpoint
const getProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;

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

    const members = await prisma.projectMember.findMany({
      where: {
        projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            githubUsername: true,
            githubProfileUrl: true,
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    res.status(200).json(members);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch project members",
    });
  }
};


// DELETE /projects/:projectId/members/:userId
// Remove a member from a project
// Auth: required, only project owner can remove members
const removeMember = async (req, res) => {
  try {
    const { projectId, userId } = req.params;

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

    // Only owner can remove members
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    // Cannot remove the owner
    if (userId === project.ownerId) {
      return res.status(400).json({
        message: "Cannot remove project owner",
      });
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!member) {
      return res.status(404).json({
        message: "Member not found",
      });
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    res.status(200).json({
      message: "Member removed successfully",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to remove member",
    });
  }
};


// GET /projects/:projectId/membership
// Check if the logged-in user is a member of this project
// Auth: required
const checkMembership = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

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

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!membership) {
      return res.status(200).json({
        isMember: false,
        role: null,
      });
    }

    res.status(200).json({
      isMember: true,
      role: membership.role,
      joinedAt: membership.joinedAt,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to check membership",
    });
  }
};

module.exports = {
  getProjectMembers,
  removeMember,
  checkMembership,
};
