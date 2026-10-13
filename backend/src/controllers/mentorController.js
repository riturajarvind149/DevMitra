const prisma = require("../config/db");
const { processAnalysisJob } = require("../workers/mentorWorker");

/**
 * POST /ai-mentor/analyze
 * Body: { githubUsername }
 */
const analyze = async (req, res) => {
  try {
    let { githubUsername } = req.body;
    if (!githubUsername) {
      // If logged in user didn't pass username, default to user's githubUsername or username
      if (req.user && (req.user.githubUsername || req.user.username)) {
        githubUsername = req.user.githubUsername || req.user.username;
      } else {
        return res.status(400).json({ message: "githubUsername is required" });
      }
    }

    githubUsername = githubUsername.trim().toLowerCase();

    // 24h Cache check: return recent completed analysis if requested within last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const cachedAnalysis = await prisma.githubAnalysis.findFirst({
      where: {
        githubUsername,
        status: "DONE",
        requestedAt: { gte: oneDayAgo },
      },
      orderBy: { requestedAt: "desc" },
    });

    if (cachedAnalysis) {
      return res.status(200).json({
        message: "Analysis retrieved from cache",
        analysisId: cachedAnalysis.id,
        status: cachedAnalysis.status,
        isCached: true,
      });
    }

    // Create new analysis job record
    const analysis = await prisma.githubAnalysis.create({
      data: {
        githubUsername,
        userId: req.user ? req.user.id : null,
        status: "QUEUED",
      },
    });

    // Fire background process job asynchronously (non-blocking)
    processAnalysisJob(analysis.id).catch((err) => {
      console.error(`Background execution error for analysis ${analysis.id}:`, err);
    });

    return res.status(202).json({
      message: "Analysis job queued successfully",
      analysisId: analysis.id,
      jobId: analysis.id,
      status: "QUEUED",
    });
  } catch (error) {
    console.error("Error queueing analysis:", error);
    return res.status(500).json({ message: "Failed to initiate analysis job" });
  }
};

/**
 * GET /ai-mentor/analysis/:id
 */
const getAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const analysis = await prisma.githubAnalysis.findUnique({
      where: { id },
      include: {
        dimensions: true,
        mentorPlan: {
          include: {
            skillGaps: true,
            weeklyTasks: true,
          },
        },
      },
    });

    if (!analysis) {
      return res.status(404).json({ message: "Analysis not found" });
    }

    // Map into frontend-friendly response format matching DeveloperAnalysis interface
    const dimensionsMap = {};
    if (analysis.dimensions) {
      analysis.dimensions.forEach((d) => {
        dimensionsMap[d.dimension] = {
          dimension: d.dimension,
          label: d.dimension.charAt(0).toUpperCase() + d.dimension.slice(1),
          score: d.score,
          confidence: d.confidence,
          status: d.status,
          reason: d.reason,
          evidenceSources: d.evidenceSources,
          strengths: d.strengths,
          weaknesses: d.weaknesses,
        };
      });
    }

    return res.status(200).json({
      id: analysis.id,
      githubUsername: analysis.githubUsername,
      status: analysis.status,
      errorMessage: analysis.errorMessage,
      overallScore: analysis.overallScore,
      overallConfidence: analysis.overallConfidence,
      tier: analysis.tier || 'NO_TIER',
      reputationScore: analysis.reputationScore,
      requestedAt: analysis.requestedAt,
      completedAt: analysis.completedAt,
      evidence: analysis.evidenceRaw,
      dimensions: dimensionsMap,
      mentorPlan: analysis.mentorPlan,
    });
  } catch (error) {
    console.error("Error fetching analysis:", error);
    return res.status(500).json({ message: "Failed to fetch analysis" });
  }
};

/**
 * GET /ai-mentor/mine
 */
const getMine = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const analyses = await prisma.githubAnalysis.findMany({
      where: { userId: req.user.id },
      orderBy: { requestedAt: "desc" },
      take: 20,
    });

    return res.status(200).json(analyses);
  } catch (error) {
    console.error("Error fetching user analyses:", error);
    return res.status(500).json({ message: "Failed to fetch analyses" });
  }
};

/**
 * GET /ai-mentor/history/:userId
 */
const getHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const snapshots = await prisma.reputationSnapshot.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    return res.status(200).json(snapshots);
  } catch (error) {
    console.error("Error fetching reputation history:", error);
    return res.status(500).json({ message: "Failed to fetch reputation history" });
  }
};

/**
 * POST /ai-mentor/mentor-task/:id/complete
 */
const completeTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.mentorTask.update({
      where: { id },
      data: {
        completed: true,
        completedAt: new Date(),
      },
    });

    return res.status(200).json({
      message: "Mentor task marked as complete",
      task,
    });
  } catch (error) {
    console.error("Error completing mentor task:", error);
    return res.status(500).json({ message: "Failed to complete mentor task" });
  }
};

/**
 * DELETE /ai-mentor/analysis/:id
 */
const deleteAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.githubAnalysis.delete({
      where: { id },
    });

    return res.status(200).json({ message: "Analysis deleted successfully" });
  } catch (error) {
    console.error("Error deleting analysis:", error);
    return res.status(500).json({ message: "Failed to delete analysis" });
  }
};

module.exports = {
  analyze,
  getAnalysis,
  getMine,
  getHistory,
  completeTask,
  deleteAnalysis,
};
