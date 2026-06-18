const prisma = require("../config/db");

const USER_PUBLIC_SELECT = {
  id: true, username: true, email: true, avatarUrl: true,
  githubUsername: true, githubProfileUrl: true,
  bio: true, location: true, website: true,
  skills: true, linkedinUrl: true, twitterUrl: true,
  portfolioUrl: true, availabilityHours: true,
  profileVisibility: true, isAdmin: true, createdAt: true,
  _count: { select: { projects: true, projectMemberships: true } },
};

// POST /users
const createUser = async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) return res.status(400).json({ message: "Username and email are required" });
    const user = await prisma.user.create({ data: { username, email } });
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create user" });
  }
};

// GET /users
const getUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const where = search ? {
      OR: [
        { username: { contains: search, mode: "insensitive" } },
        { githubUsername: { contains: search, mode: "insensitive" } },
      ],
    } : {};
    const users = await prisma.user.findMany({
      where,
      select: USER_PUBLIC_SELECT,
      take: 50,
    });
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// GET /users/:id
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user?.id || null;

    const user = await prisma.user.findUnique({ where: { id }, select: USER_PUBLIC_SELECT });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Profile privacy enforcement
    if (user.profileVisibility === "PRIVATE" && requestingUserId !== id) {
      return res.status(403).json({ message: "This profile is private" });
    }
    if (user.profileVisibility === "CONNECTIONS_ONLY" && requestingUserId !== id) {
      const conn = await prisma.connection.findFirst({
        where: {
          status: "ACCEPTED",
          OR: [
            { senderId: requestingUserId, receiverId: id },
            { senderId: id, receiverId: requestingUserId },
          ],
        },
      });
      if (!conn) return res.status(403).json({ message: "This profile is only visible to connections" });
    }

    // Accurate stats — calculated precisely
    const [ownedProjects, contributorMemberships, acceptedConnections] = await Promise.all([
      // Projects user OWNS
      prisma.project.count({ where: { ownerId: id } }),
      // Memberships where user is CONTRIBUTOR (not owner)
      prisma.projectMember.count({ where: { userId: id, role: "CONTRIBUTOR" } }),
      // Accepted connections (both directions)
      prisma.connection.count({
        where: {
          status: "ACCEPTED",
          OR: [{ senderId: id }, { receiverId: id }],
        },
      }),
    ]);

    res.status(200).json({
      ...user,
      stats: {
        projects:      ownedProjects,
        memberships:   contributorMemberships,
        connections:   acceptedConnections,
        contributions: contributorMemberships, // same as memberships — non-owner roles
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

// GET /users/:id/projects
const getUserProjects = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: "User not found" });
    const projects = await prisma.project.findMany({
      where: { ownerId: id },
      include: {
        owner: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { members: true, accessRequests: true, likes: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch user projects" });
  }
};

// GET /users/:id/memberships
const getUserMemberships = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: "User not found" });
    const memberships = await prisma.projectMember.findMany({
      where: { userId: id },
      include: {
        project: {
          include: {
            owner: { select: { id: true, username: true, avatarUrl: true } },
            _count: { select: { members: true, likes: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });
    res.status(200).json(memberships);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch user memberships" });
  }
};

// PUT /users/:id
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id !== id) return res.status(403).json({ message: "Not authorized" });

    const {
      username, bio, location, website,
      skills, linkedinUrl, twitterUrl, profileVisibility,
      portfolioUrl, availabilityHours,
    } = req.body;

    const VALID_VIS = ["PUBLIC", "CONNECTIONS_ONLY", "PRIVATE"];
    if (profileVisibility && !VALID_VIS.includes(profileVisibility)) {
      return res.status(400).json({ message: "Invalid profileVisibility" });
    }

    const data = {};
    if (username)            data.username = username;
    if (bio !== undefined)   data.bio = bio;
    if (location !== undefined) data.location = location;
    if (website !== undefined)  data.website = website;
    if (skills !== undefined)   data.skills = Array.isArray(skills) ? skills : skills.split(",").map(s => s.trim()).filter(Boolean);
    if (linkedinUrl !== undefined) data.linkedinUrl = linkedinUrl;
    if (twitterUrl !== undefined)  data.twitterUrl = twitterUrl;
    if (portfolioUrl !== undefined) data.portfolioUrl = portfolioUrl;
    if (availabilityHours !== undefined) data.availabilityHours = availabilityHours ? parseInt(availabilityHours) : null;
    if (profileVisibility)  data.profileVisibility = profileVisibility;

    if (Object.keys(data).length === 0) return res.status(400).json({ message: "No fields to update" });

    const user = await prisma.user.update({ where: { id }, data, select: USER_PUBLIC_SELECT });
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update user" });
  }
};

// DELETE /users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id !== id) return res.status(403).json({ message: "Not authorized" });
    await prisma.user.delete({ where: { id } });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

module.exports = { createUser, getUsers, getUserById, getUserProjects, getUserMemberships, updateUser, deleteUser };
