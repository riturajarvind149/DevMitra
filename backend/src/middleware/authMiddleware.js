const jwt = require("jsonwebtoken");
const prisma = require("../config/db");

// Hard protect — requires valid JWT, returns 401 otherwise
const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authenticated" });
  }
};

// Soft protect — attaches user if JWT present, continues without one
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (user) req.user = user;
    }
  } catch (_) {
    // ignore invalid token — just continue as unauthenticated
  }
  next();
};

module.exports = protect;
module.exports.optionalAuth = optionalAuth;