const { collectEvidence } = require("../src/services/github/evidenceCollector");
const { runQualityGate, runAllEngines, calculateOverallScore, calculateReputation } = require("../src/services/ai/dimensionEngines");
const { buildMentorPlan } = require("../src/services/ai/mentorEngine");

async function main() {
  const targetUsername = process.argv[2] || "riturajarvind149";
  console.log(`\n=== Running AI Mentor Engine End-to-End Test for: ${targetUsername} ===\n`);

  try {
    console.log("1. Fetching live GitHub evidence...");
    const evidence = await collectEvidence(targetUsername);
    console.log(`   Fetched ${evidence.repositories.length} repositories.`);
    console.log(`   Account age: ${evidence.accountAge} months.`);
    console.log(`   Total public repos: ${evidence.totalPublicRepos}.`);
    console.log(`   Total stars: ${evidence.totalStars}.`);

    console.log("\n2. Running Quality Gate...");
    const qualityGate = runQualityGate(evidence);
    console.log(`   Quality Gate Passed: ${qualityGate.passed}`);
    qualityGate.checks.forEach((c) => {
      console.log(`   - [${c.passed ? "PASS" : "FAIL"}] ${c.name}: ${c.message}`);
    });

    console.log("\n3. Running Scoring Engines...");
    const dimensions = runAllEngines(evidence);
    Object.entries(dimensions).forEach(([key, dim]) => {
      console.log(`   - ${dim.icon} ${dim.label}: Score = ${dim.score !== null ? dim.score : "INSUFFICIENT"}, Status = ${dim.status}`);
      if (dim.reason) console.log(`     Reason: ${dim.reason}`);
    });

    const overall = calculateOverallScore(dimensions);
    console.log(`\n   Overall Score: ${overall.score}`);
    console.log(`   Overall Confidence: ${overall.confidence}%`);

    console.log("\n4. Calculating Reputation...");
    const reputation = calculateReputation(evidence, dimensions);
    console.log(`   Reputation Score: ${reputation.score}`);
    console.log(`   Tier: ${reputation.tier}`);

    console.log("\n5. Generating Gap-Driven Mentor Plan...");
    const mentorPlan = buildMentorPlan(dimensions, evidence, reputation);
    console.log(`   Current Tier: ${mentorPlan.currentTier}`);
    console.log(`   Target Tier: ${mentorPlan.targetTier}`);
    console.log(`   Timeline: ${mentorPlan.estimatedTimeline}`);
    console.log("\n   Skill Gaps Identified:");
    mentorPlan.skillGaps.forEach((g) => {
      console.log(`   - [${g.priority}] ${g.skill}: Current ${g.currentLevel} -> Target ${g.requiredLevel}`);
      console.log(`     Rec: ${g.recommendation}`);
    });

    console.log("\n   Weekly Tasks (Repo-Specific):");
    mentorPlan.weeklyTasks.forEach((t) => {
      console.log(`   - Week ${t.weekNumber} [${t.taskType}]: ${t.title}`);
      console.log(`     Impact: ${t.impactDescription}`);
    });

    console.log("\n=== End-to-End Test Completed Successfully! ===\n");
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

main();
