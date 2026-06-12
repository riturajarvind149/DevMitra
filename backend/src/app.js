const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const accessRequestRoutes = require("./routes/accessRequestRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/projects", projectRoutes);
app.use("/access-requests", accessRequestRoutes);
app.use("/auth", authRoutes);

app.use("/users", userRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "DevMitra API Running",
  });
});

module.exports = app;