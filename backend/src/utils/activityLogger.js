const prisma = require("../config/db");
const { recordDailyActivity } = require("../controllers/profileController");

const logActivity = async (action, description, projectId = null, userId = null, metadata = null) => {
  try {
    await prisma.activityLog.create({
      data: { action, description, projectId, userId, metadata },
    });
    // Record daily activity for streak tracking
    if (userId) {
      recordDailyActivity(userId).catch(() => {}); // fire-and-forget, never block
    }
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

module.exports = { logActivity };
