const prisma = require("../config/db");
const { decryptToken } = require("../utils/tokenEncryption");
const { collectEvidence } = require("../services/github/evidenceCollector");
const {
  runQualityGate,
  runAllEngines,
  calculateOverallScore,
  calculateReputation,
} = require("../services/ai/dimensionEngines");
const { buildMentorPlan } = require("../services/ai/mentorEngine");

async function processAnalysisJob(analysisId) {
  const analysis = await prisma.githubAnalysis.findUnique({
    where: { id: analysisId },
    include: { user: true },
  });

  if (!analysis) {
    throw new Error(`Analysis job with ID ${analysisId} not found.`);
  }

  try {
    // 1. COLLECTING
    await prisma.githubAnalysis.update({
      where: { id: analysisId },
      data: { status: "COLLECTING" },
    });

    let accessToken = null;
    if (analysis.user && analysis.user.githubAccessToken) {
      accessToken = decryptToken(analysis.user.githubAccessToken);
    }

    const evidence = await collectEvidence(analysis.githubUsername, accessToken);

    // Save raw evidence
    await prisma.githubAnalysis.update({
      where: { id: analysisId },
      data: {
        evidenceRaw: evidence,
        status: "SCORING",
      },
    });

    // 2. SCORING
    const qualityGate = runQualityGate(evidence);
    const dimensions = runAllEngines(evidence);
    const overall = calculateOverallScore(dimensions);
    const reputation = calculateReputation(evidence, dimensions);

    // 3. MENTOR PLAN
    const mentorPlanData = buildMentorPlan(dimensions, evidence, reputation);

    // 4. SAVE RESULTS (Transaction or sequence)
    await prisma.$transaction(async (tx) => {
      // Create DimensionResult entries
      for (const [dimKey, dimVal] of Object.entries(dimensions)) {
        await tx.dimensionResult.create({
          data: {
            analysisId,
            dimension: dimKey,
            score: dimVal.score,
            confidence: dimVal.confidence,
            status: dimVal.status,
            reason: dimVal.reason || '',
            evidenceSources: dimVal.evidenceSources || [],
            strengths: dimVal.strengths || [],
            weaknesses: dimVal.weaknesses || [],
          },
        });
      }

      // Create MentorPlan, SkillGap, MentorTask
      const createdPlan = await tx.mentorPlan.create({
        data: {
          analysisId,
          currentTier: mentorPlanData.currentTier,
          targetTier: mentorPlanData.targetTier,
          estimatedTimeline: mentorPlanData.estimatedTimeline,
        },
      });

      for (const gap of mentorPlanData.skillGaps) {
        await tx.skillGap.create({
          data: {
            mentorPlanId: createdPlan.id,
            skill: gap.skill,
            currentLevel: gap.currentLevel,
            requiredLevel: gap.requiredLevel,
            priority: gap.priority,
            recommendation: gap.recommendation,
          },
        });
      }

      for (const task of mentorPlanData.weeklyTasks) {
        await tx.mentorTask.create({
          data: {
            mentorPlanId: createdPlan.id,
            weekNumber: task.weekNumber,
            title: task.title,
            taskType: task.taskType,
            impactDescription: task.impactDescription,
            estimatedHours: task.estimatedHours,
          },
        });
      }

      // Create ReputationSnapshot if user attached
      if (analysis.userId && reputation.score !== null) {
        const dimScores = {};
        for (const [k, v] of Object.entries(dimensions)) {
          dimScores[k] = v.score;
        }

        await tx.reputationSnapshot.create({
          data: {
            userId: analysis.userId,
            analysisId,
            overallScore: overall.score,
            reputationScore: reputation.score,
            dimensionScores: dimScores,
          },
        });
      }

      // Update GithubAnalysis status to DONE
      await tx.githubAnalysis.update({
        where: { id: analysisId },
        data: {
          status: "DONE",
          overallScore: overall.score,
          overallConfidence: overall.confidence,
          tier: reputation.tier,
          reputationScore: reputation.score,
          completedAt: new Date(),
        },
      });
    });

    console.log(`Analysis job ${analysisId} for ${analysis.githubUsername} completed successfully.`);
    return { success: true, analysisId };
  } catch (error) {
    console.error(`Analysis job ${analysisId} failed:`, error);
    await prisma.githubAnalysis.update({
      where: { id: analysisId },
      data: {
        status: "FAILED",
        errorMessage: error.message || "Analysis failed due to an unexpected error.",
      },
    });
    throw error;
  }
}

// Standalone worker process execution if run via `npm run worker`
if (require.main === module) {
  console.log("Worker process initialized. Ready to process jobs...");
}

module.exports = {
  processAnalysisJob,
};
