const axios = require("axios");
const prisma = require("../config/db");
const generateToken = require("../utils/generateToken");
const { recordLoginDay } = require("./profileController");


const loginWithGithub = async (req, res) => {
  // Add state param + allow GitHub account switcher so second accounts work
  const state = Math.random().toString(36).substring(2);
  const githubUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${process.env.GITHUB_CLIENT_ID}` +
    `&state=${state}` +
    `&allow_signup=true`;

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

    // If GitHub token exchange failed (bad code, expired, etc.)
    if (!accessToken) {
      console.error("GitHub token exchange failed:", tokenResponse.data);
      return res.redirect("http://localhost:3000?error=auth_failed");
    }

    const githubUser = await axios.get(
      "https://api.github.com/user",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Fetch verified emails if the primary email is not public
    let email = githubUser.data.email;
    if (!email) {
      try {
        const emailsRes = await axios.get("https://api.github.com/user/emails", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const primary = emailsRes.data.find((e) => e.primary && e.verified);
        email = primary?.email || emailsRes.data[0]?.email || null;
      } catch (_) {
        // ignore — use null email fallback below
      }
    }

    // Fallback: generate a placeholder if still no email (private account, no verified email)
    if (!email) {
      email = `${githubUser.data.login}@github.noemail`;
    }

    const user = await prisma.user.upsert({
      where: {
        githubId: String(githubUser.data.id),
      },
      update: {
        username: githubUser.data.name || githubUser.data.login,
        email,
        avatarUrl: githubUser.data.avatar_url,
        githubUsername: githubUser.data.login,
        githubProfileUrl: githubUser.data.html_url,
      },
      create: {
        githubId: String(githubUser.data.id),
        username: githubUser.data.name || githubUser.data.login,
        email,
        avatarUrl: githubUser.data.avatar_url,
        githubUsername: githubUser.data.login,
        githubProfileUrl: githubUser.data.html_url,
      },
    });

    const token = generateToken(user.id);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    // Count this login toward totalActiveDays (not streak — only real contributions count)
    recordLoginDay(user.id).catch(() => {});

    // Redirect to frontend after successful login
    res.redirect("http://localhost:3000");

  } catch (error) {
    console.error(error);

    // Redirect to frontend with error
    res.redirect("http://localhost:3000?error=auth_failed");
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