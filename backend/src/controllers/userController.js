const prisma = require("../config/db");

const createUser = async (req, res) => {
  try {
    const { username, email } = req.body;

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


const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();

    res.status(200).json(users);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};


const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        id,
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


const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;

    const user = await prisma.user.update({
      where: {
        id,
      },
      data: {
        username,
        email,
      },
    });

    res.status(200).json(user);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update user",
    });
  }
};


const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

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