const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { optionalAuth } = require("../middleware/authMiddleware");
const { createUser, getUsers, getUserById, getUserProjects, getUserMemberships, updateUser, deleteUser } = require("../controllers/userController");

router.get("/",               getUsers);
router.get("/:id",            optionalAuth, getUserById);
router.get("/:id/projects",   getUserProjects);
router.get("/:id/memberships",getUserMemberships);
router.post("/",              createUser);
router.put("/:id",            protect, updateUser);
router.delete("/:id",         protect, deleteUser);

module.exports = router;
