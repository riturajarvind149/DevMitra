const crypto = require("crypto");
const axios = require("axios");
const prisma = require("../config/db");
const generateToken = require("../utils/generateToken");
const { encryptToken } = require("../utils/tokenEncryption");
const { recordLoginDay } = require("./profileController");

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";


const loginWithGithub = (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie("oauth_state", state, {
    httpOnly: true,
    maxAge: 10 * 60 * 1000, // 10 minutes
    // Must be "none" in production so the cookie survives the GitHub → backend
    // cross-origin redirect. "lax" would drop it on the callback request.
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  const githubUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${process.env.GITHUB_CLIENT_ID}` +
    `&state=${state}` +
    `&allow_signup=true`;

  res.redirect(githubUrl);
};


const githubCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const storedState = req.cookies.oauth_state;

    // Invalidate state cookie immediately (single-use enforcement)
    const isProdClear = process.env.NODE_ENV === "production";
    res.clearCookie("oauth_state", {
      path: "/",
      sameSite: isProdClear ? "none" : "lax",
      secure: isProdClear,
    });

    // Validate CSRF state — reject if missing or mismatched
    if (!state || !storedState || state !== storedState) {
      return res.redirect(`${FRONTEND_URL}?error=oauth_csrf`);
    }

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
      return res.redirect(`${FRONTEND_URL}?error=auth_failed`);
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

    const encryptedAccessToken = encryptToken(accessToken);

    let user;
    try {
      user = await prisma.user.upsert({
        where: {
          githubId: String(githubUser.data.id),
        },
        update: {
          username: githubUser.data.name || githubUser.data.login,
          email,
          avatarUrl: githubUser.data.avatar_url,
          githubUsername: githubUser.data.login,
          githubProfileUrl: githubUser.data.html_url,
          githubAccessToken: encryptedAccessToken,
        },
        create: {
          githubId: String(githubUser.data.id),
          username: githubUser.data.name || githubUser.data.login,
          email,
          avatarUrl: githubUser.data.avatar_url,
          githubUsername: githubUser.data.login,
          githubProfileUrl: githubUser.data.html_url,
          githubAccessToken: encryptedAccessToken,
        },
      });
    } catch (dbError) {
      console.warn("Retrying upsert without githubAccessToken in case of schema discrepancy:", dbError.message);
      user = await prisma.user.upsert({
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
    }

    const token = generateToken(user.id);

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      // Cross-origin deployment (Vercel frontend ↔ Railway backend):
      // sameSite must be "none" so the browser sends the cookie on
      // cross-origin requests from dev-mitra.vercel.app → railway.app.
      // "strict" silently drops the cookie on cross-site redirect flows.
      sameSite: isProd ? "none" : "lax",
      secure: isProd, // "none" requires secure:true per spec
      path: "/",
    });

    // Count this login toward totalActiveDays (not streak — only real contributions count)
    recordLoginDay(user.id).catch(() => {});

    // Redirect to frontend after successful login
    res.redirect(FRONTEND_URL);

  } catch (error) {
    console.error(error);

    // Redirect to frontend with error
    res.redirect(`${FRONTEND_URL}?error=auth_failed`);
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