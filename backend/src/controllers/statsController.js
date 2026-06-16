const prisma = require("../config/db");

// GET /stats
// Get global platform statistics
const getPlatformStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProjects,
      totalMembers,
      totalAccessRequests,
      pendingRequests,
      recentActivities,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.projectMember.count(),
      prisma.projectAccessRequest.count(),
      prisma.projectAccessRequest.count({ where: { status: "PENDING" } }),
      prisma.activityLog.count(),
    ]);

    res.status(200).json({
      users: totalUsers,
      projects: totalProjects,
      memberships: totalMembers,
      accessRequests: {
        total: totalAccessRequests,
        pending: pendingRequests,
        processed: totalAccessRequests - pendingRequests,
      },
      activities: recentActivities,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch platform stats",
    });
  }
};

module.exports = {
  getPlatformStats,
};
