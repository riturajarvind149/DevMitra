const prisma = require("../config/db");

/**
 * Log an activity to the database
 * @param {string} action - Activity action type
 * @param {string} description - Human-readable description
 * @param {string} projectId - Project ID (optional)
 * @param {string} userId - User ID (optional)
 * @param {object} metadata - Additional metadata (optional)
 */
const logActivity = async (action, description, projectId = null, userId = null, metadata = null) => {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        description,
        projectId,
        userId,
        metadata,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw - activity logging shouldn't break the main flow
  }
};

module.exports = { logActivity };
