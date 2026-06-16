const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const projectMemberRoutes = require("./routes/projectMemberRoutes");
const accessRequestRoutes = require("./routes/accessRequestRoutes");
const authRoutes = require("./routes/authRoutes");
const activityRoutes = require("./routes/activityRoutes");
const { getPlatformStats } = require("./controllers/statsController");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Apply rate limiting to all routes
app.use(apiLimiter);

app.use("/projects", projectRoutes);
app.use("/projects", projectMemberRoutes);
app.use("/access-requests", accessRequestRoutes);
app.use("/auth", authRoutes);
app.use("/", activityRoutes);

app.use("/users", userRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "DevMitra API Running",
  });
});

app.get("/stats", getPlatformStats);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;