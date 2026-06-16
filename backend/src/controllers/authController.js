const axios = require("axios");
const prisma = require("../config/db");
const generateToken = require("../utils/generateToken");


const loginWithGithub = async (req, res) => {
  const githubUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${process.env.GITHUB_CLIENT_ID}`;

  res.redirect(githubUrl);
};


const githubCallback = async (req, res) => {
  try {
    const { code } = req.query;

    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const githubUser = await axios.get(
      "https://api.github.com/user",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const user = await prisma.user.upsert({
      where: {
        githubId: String(githubUser.data.id),
      },
      update: {
        username: githubUser.data.name || githubUser.data.login,
        email: githubUser.data.email,
        avatarUrl: githubUser.data.avatar_url,
        githubUsername: githubUser.data.login,
        githubProfileUrl: githubUser.data.html_url,
      },
      create: {
        githubId: String(githubUser.data.id),
        username: githubUser.data.name || githubUser.data.login,
        email: githubUser.data.email,
        avatarUrl: githubUser.data.avatar_url,
        githubUsername: githubUser.data.login,
        githubProfileUrl: githubUser.data.html_url,
      },
    });

    const token = generateToken(user.id);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user,
      token,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "GitHub login failed",
    });
  }
};


const getCurrentUser = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch current user",
    });
  }
};


// POST /auth/logout
// Logout user by clearing the JWT cookie
const logout = async (req, res) => {
  try {
    res.clearCookie("token");

    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to logout",
    });
  }
};

module.exports = {
  loginWithGithub,
  githubCallback,
  getCurrentUser,
  logout,
};