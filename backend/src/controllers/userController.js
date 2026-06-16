const prisma = require("../config/db");

// POST /users
// Create user manually (not typically used since GitHub OAuth creates users)
const createUser = async (req, res) => {
  try {
    const { username, email } = req.body;

    // Validate required fields
    if (!username || !email) {
      return res.status(400).json({
        message: "Username and email are required",
      });
    }

    const user = await prisma.user.create({
      data: {
        username,
        email,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create user",
    });
  }
};


// GET /users
// Get all users (public endpoint)
const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        githubUsername: true,
        githubProfileUrl: true,
        createdAt: true,
      },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};


// GET /users/:id
// Get user by ID (public endpoint)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        githubUsername: true,
        githubProfileUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch user",
    });
  }
};


// PUT /users/:id
// Update user profile (user can only update their own profile)
// Auth: required
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow users to update their own profile
    if (req.user.id !== id) {
      return res.status(403).json({
        message: "Not authorized to update this user",
      });
    }

    const { username, email } = req.body;

    // Validate at least one field is provided
    if (!username && !email) {
      return res.status(400).json({
        message: "At least one field (username or email) is required",
      });
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;

    const user = await prisma.user.update({
      where: {
        id,
      },
      data: updateData,
    });

    res.status(200).json(user);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update user",
    });
  }
};


// DELETE /users/:id
// Delete user account (user can only delete their own account)
// Auth: required
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow users to delete their own account
    if (req.user.id !== id) {
      return res.status(403).json({
        message: "Not authorized to delete this user",
      });
    }

    await prisma.user.delete({
      where: {
        id,
      },
    });

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete user",
    });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
