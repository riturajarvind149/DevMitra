const prisma = require("../config/db");

// GET /developers  — searchable, filterable developer directory
const getDevelopers = async (req, res) => {
  try {
    const { search, skill, location, availability, limit = 40, offset = 0 } = req.query;
    const take = Math.min(parseInt(limit) || 40, 100);
    const skip = parseInt(offset) || 0;

    const where = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { githubUsername: { contains: search, mode: "insensitive" } },
        { bio: { contains: search, mode: "insensitive" } },
      ];
    }
    if (skill) where.skills = { has: skill };
    if (location) where.location = { contains: location, mode: "insensitive" };
    if (availability) where.availabilityHours = { gte: parseInt(availability) };

    const [total, developers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true, username: true, email: true, avatarUrl: true,
          githubUsername: true, githubProfileUrl: true,
          bio: true, location: true, website: true,
          skills: true, linkedinUrl: true, twitterUrl: true,
          availabilityHours: true, profileVisibility: true,
          createdAt: true,
          _count: { select: { projects: true, projectMemberships: true } },
        },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
    ]);

    res.status(200).json({ developers, pagination: { total, limit: take, offset: skip, hasMore: skip + take < total } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch developers" });
  }
};

// GET /developers/suggested  — developers to connect with
const getSuggestedDevelopers = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get IDs already connected or pending
    const existing = await prisma.connection.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      select: { senderId: true, receiverId: true },
    });
    const excludeIds = new Set([userId]);
    existing.forEach(c => { excludeIds.add(c.senderId); excludeIds.add(c.receiverId); });

    const developers = await prisma.user.findMany({
      where: { id: { notIn: Array.from(excludeIds) } },
      select: {
        id: true, username: true, avatarUrl: true, bio: true, skills: true,
        githubUsername: true, location: true,
        _count: { select: { projects: true, projectMemberships: true } },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(developers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch suggestions" });
  }
};

// GET /developers/activity-feed  — global feed of activities
const getActivityFeed = async (req, res) => {
  try {
    const { limit = 30, offset = 0 } = req.query;
    const take = Math.min(parseInt(limit) || 30, 50);
    const skip = parseInt(offset) || 0;

    const activities = await prisma.activityLog.findMany({
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        project: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });

    res.status(200).json(activities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch feed" });
  }
};

module.exports = { getDevelopers, getSuggestedDevelopers, getActivityFeed };
