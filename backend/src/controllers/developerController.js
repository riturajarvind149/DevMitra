const prisma = require("../config/db");
const cache = require("../utils/cache");

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

// GET /developers/suggested  — developers to connect with (with mutual count)
const getSuggestedDevelopers = async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `suggested_devs:${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    // Get IDs already connected or pending
    const existing = await prisma.connection.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      select: { senderId: true, receiverId: true, status: true },
    });
    const excludeIds = new Set([userId]);
    existing.forEach((c) => {
      excludeIds.add(c.senderId);
      excludeIds.add(c.receiverId);
    });

    // My accepted connection IDs
    const myConnectedIds = new Set(
      existing
        .filter((c) => c.status === "ACCEPTED")
        .map((c) => (c.senderId === userId ? c.receiverId : c.senderId))
    );

    const developers = await prisma.user.findMany({
      where: { id: { notIn: Array.from(excludeIds) } },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true,
        skills: true,
        githubUsername: true,
        location: true,
        availabilityHours: true,
        _count: { select: { projects: true, projectMemberships: true } },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    const devIds = developers.map((d) => d.id);

    // Fetch mutual connections in ONE bulk query instead of 20 separate queries
    const allDevConns =
      devIds.length > 0
        ? await prisma.connection.findMany({
            where: {
              status: "ACCEPTED",
              OR: [{ senderId: { in: devIds } }, { receiverId: { in: devIds } }],
            },
            select: { senderId: true, receiverId: true },
          })
        : [];

    const devConnMap = new Map();
    for (const devId of devIds) {
      devConnMap.set(devId, new Set());
    }
    for (const conn of allDevConns) {
      if (devConnMap.has(conn.senderId)) {
        devConnMap.get(conn.senderId).add(conn.receiverId);
      }
      if (devConnMap.has(conn.receiverId)) {
        devConnMap.get(conn.receiverId).add(conn.senderId);
      }
    }

    const result = developers.map((dev) => {
      const connectedToDev = devConnMap.get(dev.id) || new Set();
      const mutualCount = [...myConnectedIds].filter((id) => connectedToDev.has(id)).length;
      return { ...dev, mutualCount };
    });

    cache.set(cacheKey, result, 60);
    res.status(200).json(result);
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
