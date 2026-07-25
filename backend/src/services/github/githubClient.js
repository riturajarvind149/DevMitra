const axios = require("axios");

const GITHUB_API_URL = "https://api.github.com";

class GitHubRateLimitError extends Error {
  constructor(message, resetTime) {
    super(message);
    this.name = "GitHubRateLimitError";
    this.resetTime = resetTime;
  }
}

// Track server-side rate limits in-memory
let lastRateLimitRemaining = 5000;
let lastRateLimitReset = 0;

function getAuthHeader(userAccessToken) {
  const token = userAccessToken || process.env.GITHUB_PAT || process.env.GITHUB_CLIENT_SECRET;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function updateRateLimit(headers) {
  if (headers && headers["x-ratelimit-remaining"]) {
    lastRateLimitRemaining = parseInt(headers["x-ratelimit-remaining"], 10);
  }
  if (headers && headers["x-ratelimit-reset"]) {
    lastRateLimitReset = parseInt(headers["x-ratelimit-reset"], 10);
  }
}

function checkRateLimitGuard() {
  if (lastRateLimitRemaining <= 5) {
    const now = Math.floor(Date.now() / 1000);
    if (now < lastRateLimitReset) {
      throw new GitHubRateLimitError(
        `GitHub API rate limit exhausted. Resets in ${lastRateLimitReset - now} seconds.`,
        lastRateLimitReset
      );
    }
  }
}

async function restGet(endpoint, token = null, params = {}) {
  checkRateLimitGuard();
  const url = endpoint.startsWith("http") ? endpoint : `${GITHUB_API_URL}${endpoint}`;
  try {
    const response = await axios.get(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...getAuthHeader(token),
      },
      params,
    });
    updateRateLimit(response.headers);
    return response.data;
  } catch (error) {
    if (error.response) {
      updateRateLimit(error.response.headers);
      if (error.response.status === 404) {
        return null;
      }
      if (error.response.status === 403 && error.response.headers["x-ratelimit-remaining"] === "0") {
        const reset = parseInt(error.response.headers["x-ratelimit-reset"] || "0", 10);
        throw new GitHubRateLimitError("GitHub API rate limit exceeded", reset);
      }
    }
    throw error;
  }
}

async function headCheck(endpoint, token = null) {
  checkRateLimitGuard();
  const url = endpoint.startsWith("http") ? endpoint : `${GITHUB_API_URL}${endpoint}`;
  try {
    const response = await axios.head(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...getAuthHeader(token),
      },
      validateStatus: (status) => status === 200 || status === 404,
    });
    updateRateLimit(response.headers);
    return response.status === 200;
  } catch (error) {
    if (error.response) {
      updateRateLimit(error.response.headers);
    }
    return false;
  }
}

async function graphqlQuery(query, variables = {}, token = null) {
  checkRateLimitGuard();
  const url = `${GITHUB_API_URL}/graphql`;
  try {
    const response = await axios.post(
      url,
      { query, variables },
      {
        headers: {
          Accept: "application/json",
          ...getAuthHeader(token),
        },
      }
    );
    updateRateLimit(response.headers);
    if (response.data.errors && response.data.errors.length > 0) {
      console.warn("GraphQL errors:", response.data.errors);
    }
    return response.data.data;
  } catch (error) {
    if (error.response) {
      updateRateLimit(error.response.headers);
    }
    throw error;
  }
}

module.exports = {
  restGet,
  headCheck,
  graphqlQuery,
  GitHubRateLimitError,
};
