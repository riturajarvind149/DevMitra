const prisma = require("../config/db");

// GET /ai/profile  — get current user's AI profile
const getAIProfile = async (req, res) => {
  try {
    const profile = await prisma.userAIProfile.findUnique({
      where: { userId: req.user.id },
    });
    res.status(200).json(profile || {});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch AI profile" });
  }
};

// PUT /ai/profile  — upsert AI profile
const updateAIProfile = async (req, res) => {
  try {
    const { skills, interests, preferredRoles, techStackExp, preferRemote } = req.body;

    const profile = await prisma.userAIProfile.upsert({
      where:  { userId: req.user.id },
      create: { userId: req.user.id, skills: skills || [], interests: interests || [], preferredRoles: preferredRoles || [], techStackExp: techStackExp || {}, preferRemote: preferRemote !== false },
      update: {
        ...(skills          !== undefined && { skills }),
        ...(interests       !== undefined && { interests }),
        ...(preferredRoles  !== undefined && { preferredRoles }),
        ...(techStackExp    !== undefined && { techStackExp }),
        ...(preferRemote    !== undefined && { preferRemote }),
      },
    });
    res.status(200).json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update AI profile" });
  }
};

// GET /ai/suggested-developers  — AI-matched developers based on shared skills/interests
const getSuggestedDevelopers = async (req, res) => {
  try {
    const myProfile = await prisma.userAIProfile.findUnique({ where: { userId: req.user.id } });
    const myUser    = await prisma.user.findUnique({ where: { id: req.user.id } });

    // Combined skills from user and AI profile
    const mySkills = [...new Set([...(myUser?.skills || []), ...(myProfile?.skills || [])])];

    // Get users with overlapping skills, excluding self and already-connected users
    const existing = await prisma.connection.findMany({
      where: { OR: [{ senderId: req.user.id }, { receiverId: req.user.id }] },
      select: { senderId: true, receiverId: true },
    });
    const excludeIds = new Set([req.user.id]);
    existing.forEach(c => { excludeIds.add(c.senderId); excludeIds.add(c.receiverId); });

    const developers = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excludeIds) },
        ...(mySkills.length > 0 && { skills: { hasSome: mySkills } }),
      },
      select: {
        id: true, username: true, avatarUrl: true, bio: true, skills: true,
        githubUsername: true, location: true, availabilityHours: true,
        _count: { select: { projects: true, projectMemberships: true } },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(developers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get suggestions" });
  }
};

// GET /ai/suggested-projects  — projects matching user's skills
const getSuggestedProjects = async (req, res) => {
  try {
    const myUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    const skills = myUser?.skills || [];

    const projects = await prisma.project.findMany({
      where: {
        visibility: "PUBLIC",
        ownerId: { not: req.user.id },
        ...(skills.length > 0 && { tags: { hasSome: skills } }),
      },
      include: {
        owner: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { members: true, accessRequests: true, likes: true } },
      },
      take: 6,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to get project suggestions" });
  }
};

module.exports = { getAIProfile, updateAIProfile, getSuggestedDevelopers, getSuggestedProjects };
