const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/projects", projectRoutes);

app.use("/users", userRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "DevMitra API Running",
  });
});

module.exports = app;