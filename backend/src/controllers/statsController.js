const prisma = require("../config/db");

const getPlatformStats = async (req, res) => {
  try {
    const [
      totalUsers, totalProjects, totalMembers,
      totalAccessRequests, pendingRequests, recentActivities,
      totalLikes, totalConnections, totalComments,
      totalRepoRequests, totalOpportunities,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.projectMember.count(),
      prisma.projectAccessRequest.count(),
      prisma.projectAccessRequest.count({ where: { status: "PENDING" } }),
      prisma.activityLog.count(),
      prisma.projectLike.count(),
      prisma.connection.count({ where: { status: "ACCEPTED" } }),
      prisma.projectComment.count(),
      prisma.repositoryAccessRequest.count(),
      prisma.opportunity.count({ where: { status: "OPEN" } }),
    ]);

    res.status(200).json({
      users: totalUsers,
      projects: totalProjects,
      memberships: totalMembers,
      likes: totalLikes,
      connections: totalConnections,
      comments: totalComments,
      repoRequests: totalRepoRequests,
      openOpportunities: totalOpportunities,
      accessRequests: {
        total: totalAccessRequests,
        pending: pendingRequests,
        processed: totalAccessRequests - pendingRequests,
      },
      activities: recentActivities,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch platform stats" });
  }
};

module.exports = { getPlatformStats };
