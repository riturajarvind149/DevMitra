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

/**
 * Persist all analysis results in a single batched transaction.
 * Uses createMany() instead of looped create() to minimize round-trips
 * and prevent Prisma interactive-transaction timeouts.
 */
async function saveAnalysisResults(tx, { analysisId, analysis, dimensions, overall, reputation, mentorPlanData }) {
  // 1. Batch-create all DimensionResult rows (single round-trip)
  await tx.dimensionResult.createMany({
    data: Object.entries(dimensions).map(([dimKey, dimVal]) => ({
      analysisId,
      dimension: dimKey,
      score: dimVal.score,
      confidence: dimVal.confidence,
      status: dimVal.status,
      reason: dimVal.reason || '',
      evidenceSources: dimVal.evidenceSources || [],
      strengths: dimVal.strengths || [],
      weaknesses: dimVal.weaknesses || [],
    })),
  });

  // 2. Create MentorPlan (need ID for child records)
  const createdPlan = await tx.mentorPlan.create({
    data: {
      analysisId,
      currentTier: mentorPlanData.currentTier,
      targetTier: mentorPlanData.targetTier,
      estimatedTimeline: mentorPlanData.estimatedTimeline,
    },
  });

  // 3. Batch-create SkillGap rows (single round-trip)
  if (mentorPlanData.skillGaps.length > 0) {
    await tx.skillGap.createMany({
      data: mentorPlanData.skillGaps.map((gap) => ({
        mentorPlanId: createdPlan.id,
        skill: gap.skill,
        currentLevel: gap.currentLevel,
        requiredLevel: gap.requiredLevel,
        priority: gap.priority,
        recommendation: gap.recommendation,
      })),
    });
  }

  // 4. Batch-create MentorTask rows (single round-trip)
  if (mentorPlanData.weeklyTasks.length > 0) {
    await tx.mentorTask.createMany({
      data: mentorPlanData.weeklyTasks.map((task) => ({
        mentorPlanId: createdPlan.id,
        weekNumber: task.weekNumber,
        title: task.title,
        taskType: task.taskType,
        impactDescription: task.impactDescription,
        estimatedHours: task.estimatedHours,
      })),
    });
  }

  // 5. Create ReputationSnapshot if user attached
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

  // 6. Update GithubAnalysis status to DONE
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

  // 7. Sync AI reputation score to User model (Bug 2 fix)
  if (analysis.userId && overall.score !== null) {
    await tx.user.update({
      where: { id: analysis.userId },
      data: {
        aiReputationScore: overall.score,
        aiReputationTier: reputation.tier,
        aiAnalyzedAt: new Date(),
      },
    });
  }
}

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

    // Save raw evidence (outside transaction — no LLM/network calls inside tx)
    await prisma.githubAnalysis.update({
      where: { id: analysisId },
      data: {
        evidenceRaw: evidence,
        status: "SCORING",
      },
    });

    // 2. SCORING (all CPU-bound, no network — safe to run before tx)
    const qualityGate = runQualityGate(evidence);
    const dimensions = runAllEngines(evidence);
    const overall = calculateOverallScore(dimensions);
    const reputation = calculateReputation(evidence, dimensions);

    // 3. MENTOR PLAN (CPU-bound)
    const mentorPlanData = buildMentorPlan(dimensions, evidence, reputation);

    // 4. SAVE RESULTS — batched transaction with retry-once for transient timeouts
    const txPayload = { analysisId, analysis, dimensions, overall, reputation, mentorPlanData };
    const TX_OPTIONS = { timeout: 15000, maxWait: 5000 };

    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        await prisma.$transaction(
          (tx) => saveAnalysisResults(tx, txPayload),
          TX_OPTIONS,
        );
        break; // Success — exit retry loop
      } catch (txError) {
        const isTransient =
          txError.message?.includes("Transaction already closed") ||
          txError.message?.includes("expired transaction") ||
          txError.code === "P2028";

        if (isTransient && attempts < maxAttempts) {
          console.warn(`Transaction attempt ${attempts} failed (transient timeout), retrying...`);
          continue;
        }
        throw txError; // Non-transient error or exhausted retries
      }
    }

    console.log(`Analysis job ${analysisId} for ${analysis.githubUsername} completed successfully.`);
    return { success: true, analysisId };
  } catch (error) {
    console.error(`Analysis job ${analysisId} failed:`, error);

    // Surface clear error message for the user
    let userMessage = "Analysis failed due to an unexpected error.";
    if (error.message?.includes("Transaction already closed") || error.message?.includes("expired transaction")) {
      userMessage = "Analysis timed out while saving results. Please try again — this is usually a temporary issue.";
    } else if (error.message?.includes("rate limit")) {
      userMessage = "GitHub API rate limit reached. Please wait a few minutes and try again.";
    } else if (error.message) {
      userMessage = error.message.slice(0, 500);
    }

    await prisma.githubAnalysis.update({
      where: { id: analysisId },
      data: {
        status: "FAILED",
        errorMessage: userMessage,
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
