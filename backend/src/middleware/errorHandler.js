// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Prisma errors
  if (err.code === "P2002") {
    return res.status(409).json({
      message: "A record with this value already exists",
      field: err.meta?.target?.[0] || "unknown",
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      message: "Record not found",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      message: "Token expired",
    });
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: err.message,
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    message: err.message || "Internal server error",
  });
};

// 404 handler
const notFound = (req, res, next) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`,
  });
};

module.exports = { errorHandler, notFound };
