/**
 * One-time backfill script: Sync AI reputation scores from completed
 * GithubAnalysis records to User.aiReputationScore / aiReputationTier / aiAnalyzedAt.
 *
 * Run: node scripts/backfillAiReputation.js
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function backfill() {
  console.log("🔄 Starting AI reputation backfill...\n");

  // Find all completed analyses that have a userId
  const analyses = await prisma.githubAnalysis.findMany({
    where: {
      status: "DONE",
      userId: { not: null },
      overallScore: { not: null },
    },
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      userId: true,
      overallScore: true,
      tier: true,
      completedAt: true,
    },
  });

  if (analyses.length === 0) {
    console.log("No completed analyses found. Nothing to backfill.");
    return;
  }

  console.log(`Found ${analyses.length} completed analyses.\n`);

  // Group by userId, keep only the most recent per user
  const latestByUser = new Map();
  for (const a of analyses) {
    if (!latestByUser.has(a.userId)) {
      latestByUser.set(a.userId, a);
    }
    // Already sorted desc, so first one per user is latest
  }

  console.log(`Updating ${latestByUser.size} users...\n`);

  let updated = 0;
  let skipped = 0;

  for (const [userId, analysis] of latestByUser) {
    try {
      // Check if user already has the correct score
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { aiReputationScore: true, username: true },
      });

      if (!user) {
        console.log(`  ⚠ User ${userId} not found (deleted?). Skipping.`);
        skipped++;
        continue;
      }

      if (user.aiReputationScore === analysis.overallScore) {
        console.log(`  ✓ ${user.username}: already synced (score=${analysis.overallScore})`);
        skipped++;
        continue;
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          aiReputationScore: analysis.overallScore,
          aiReputationTier: analysis.tier,
          aiAnalyzedAt: analysis.completedAt,
        },
      });

      console.log(`  ✅ ${user.username}: ${user.aiReputationScore ?? "null"} → ${analysis.overallScore} (${analysis.tier})`);
      updated++;
    } catch (err) {
      console.error(`  ❌ Failed to update user ${userId}:`, err.message);
    }
  }

  console.log(`\n🎉 Backfill complete. Updated: ${updated}, Skipped: ${skipped}`);
}

backfill()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
