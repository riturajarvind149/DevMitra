const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const userRoutes           = require("./routes/userRoutes");
const projectRoutes        = require("./routes/projectRoutes");
const projectMemberRoutes  = require("./routes/projectMemberRoutes");
const accessRequestRoutes  = require("./routes/accessRequestRoutes");
const authRoutes           = require("./routes/authRoutes");
const activityRoutes       = require("./routes/activityRoutes");
const notificationRoutes   = require("./routes/notificationRoutes");
const storyRoutes          = require("./routes/storyRoutes");
const messageRoutes        = require("./routes/messageRoutes");
const connectionRoutes     = require("./routes/connectionRoutes");
const likeRoutes           = require("./routes/likeRoutes");
const commentRoutes        = require("./routes/commentRoutes");
const commentStandaloneRoutes = require("./routes/commentStandaloneRoutes");
const saveRoutes           = require("./routes/saveRoutes");
const savedProjectsRoutes  = require("./routes/savedProjectsRoutes");
const repoAccessRoutes     = require("./routes/repoAccessRoutes");
const opportunityRoutes    = require("./routes/opportunityRoutes");
const developerRoutes      = require("./routes/developerRoutes");
const aiRoutes             = require("./routes/aiRoutes");
const profileRoutes        = require("./routes/profileRoutes");
const bugReportRoutes      = require("./routes/bugReportRoutes");
const pullRequestRoutes    = require("./routes/pullRequestRoutes");
const ratingRoutes         = require("./routes/ratingRoutes");
const projectResourceRoutes = require("./routes/projectResourceRoutes");
const announcementRoutes    = require("./routes/announcementRoutes");

const { getPlatformStats } = require("./controllers/statsController");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(cookieParser());
app.use(apiLimiter);

// Core
app.use("/auth",             authRoutes);
app.use("/users",            userRoutes);
app.use("/projects",         projectRoutes);
app.use("/projects",         projectMemberRoutes);
app.use("/access-requests",  accessRequestRoutes);
app.use("/",                 activityRoutes);

// Social
app.use("/notifications",    notificationRoutes);
app.use("/stories",          storyRoutes);
app.use("/messages",         messageRoutes);
app.use("/connections",      connectionRoutes);
app.use("/saved-projects",   savedProjectsRoutes);

// Phase 3 new routes
app.use("/repo-requests",    repoAccessRoutes);
app.use("/opportunities",    opportunityRoutes);
app.use("/developers",       developerRoutes);
app.use("/ai",               aiRoutes);
app.use("/profile-data",     profileRoutes);

// Phase 4 new routes
app.use("/bug-reports",      bugReportRoutes);
app.use("/pull-requests",    pullRequestRoutes);
app.use("/ratings",          ratingRoutes);

// Nested project routes
app.use("/projects/:projectId/likes",          likeRoutes);
app.use("/projects/:projectId/comments",       commentRoutes);
app.use("/projects/:projectId/save",           saveRoutes);
app.use("/projects/:projectId/resources",      projectResourceRoutes);
app.use("/projects/:projectId/announcements",  announcementRoutes);

// Standalone
app.use("/comments", commentStandaloneRoutes);

app.get("/",      (req, res) => res.json({ success: true, message: "DevMitra API Running" }));
app.get("/stats", getPlatformStats);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
