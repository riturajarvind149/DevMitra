const prisma = require("../config/db");

// GET /projects/:projectId/activities
// Get all activities for a specific project
const getProjectActivities = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

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

    const take = Math.min(parseInt(limit) || 20, 100);
    const skip = parseInt(offset) || 0;

    const total = await prisma.activityLog.count({
      where: { projectId },
    });

    const activities = await prisma.activityLog.findMany({
      where: {
        projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            githubUsername: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take,
      skip,
    });

    res.status(200).json({
      activities,
      pagination: {
        total,
        limit: take,
        offset: skip,
        hasMore: skip + take < total,
      },
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch project activities",
    });
  }
};


// GET /users/:userId/activities
// Get all activities for a specific user
const getUserActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const take = Math.min(parseInt(limit) || 20, 100);
    const skip = parseInt(offset) || 0;

    const total = await prisma.activityLog.count({
      where: { userId },
    });

    const activities = await prisma.activityLog.findMany({
      where: {
        userId,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take,
      skip,
    });

    res.status(200).json({
      activities,
      pagination: {
        total,
        limit: take,
        offset: skip,
        hasMore: skip + take < total,
      },
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch user activities",
    });
  }
};

module.exports = {
  getProjectActivities,
  getUserActivities,
};
