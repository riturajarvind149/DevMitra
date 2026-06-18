const prisma = require("../config/db");
const { logActivity } = require("../utils/activityLogger");
const { createNotification } = require("./notificationController");

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
      include: {
        user: true,
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

    // Log activity
    await logActivity(
      "MEMBER_LEFT",
      `${member.user.username} was removed from "${project.title}"`,
      projectId,
      userId,
      { removedBy: req.user.id }
    );

    // Notify the removed member
    await createNotification({
      type: "CONTRIBUTOR_REMOVED",
      message: `You have been removed from "${project.title}"`,
      receiverId: userId,
      senderId: req.user.id,
      projectId,
      link: `/projects/${projectId}`,
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

// GET /users/:userId/contributing
// Projects where the authenticated user is CONTRIBUTOR (not owner)
const getUserContributing = async (req, res) => {
  try {
    // Use authenticated user's ID — ignores URL param to prevent cross-user data access
    const userId = req.user.id;
    const memberships = await prisma.projectMember.findMany({
      where: { userId, role: "CONTRIBUTOR" },
      include: {
        project: {
          include: {
            owner: { select: { id: true, username: true, avatarUrl: true } },
            _count: { select: { members: true, likes: true, accessRequests: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });
    res.status(200).json(memberships.map(m => m.project));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch contributing projects" });
  }
};

module.exports = {
  getProjectMembers,
  removeMember,
  checkMembership,
  getUserContributing,
};
