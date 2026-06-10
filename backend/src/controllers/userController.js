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

module.exports = {
  createUser,
  getUsers,
};