/**
 * DevMitra AI Mentor Eval Suite (Layer 3 Accuracy Runner)
 *
 * Runs evaluation cases against the mentor chat engine with rate-limit retry.
 *
 * Run: node --dns-result-order=ipv4first scripts/runEvals.js
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const prisma = require("../src/config/db");

// Mock prisma for evals so tests run reliably without DB dependency
prisma.githubAnalysis.findUnique = async () => ({
  id: "eval-analysis-id",
  githubUsername: "riturajarvind149",
  overallScore: 78,
  overallConfidence: 85,
  tier: "ADVANCED",
  reputationScore: 78,
  completedAt: new Date(),
  dimensions: [
    { dimension: "codeQuality", score: 85, status: "SCORED", reason: "Clean code structure", evidenceSources: [], strengths: [], weaknesses: [] },
    { dimension: "testing", score: 60, status: "SCORED", reason: "Jest configured in backend and frontend", evidenceSources: [], strengths: [], weaknesses: [] },
  ],
  evidenceRaw: {
    repositories: [
      {
        name: "DevMitra",
        grade: "A",
        language: "TypeScript",
        hasTests: true,
        hasCI: false,
        hasDocker: false,
        hasReadme: true,
        stars: 5,
        packageFolders: [
          {
            folder: "backend",
            hasTsConfig: false,
            hasPackageJson: true,
            testFramework: "jest",
            languageOfFolder: "JavaScript",
            hasDockerfile: false,
            hasCI: false,
            testFileCount: 5,
            testFilePaths: [
              "backend/__tests__/ratingDuplication.test.js",
              "backend/__tests__/pagination.test.js",
              "backend/__tests__/oauth.test.js",
              "backend/__tests__/dimensionEngines.test.js",
              "backend/__tests__/mentorEngine.test.js",
            ],
          },
          {
            folder: "frontend",
            hasTsConfig: true,
            hasPackageJson: true,
            testFramework: "jest",
            languageOfFolder: "TypeScript",
            hasDockerfile: false,
            hasCI: false,
            testFileCount: 0,
            testFilePaths: [],
          },
        ],
      },
    ],
  },
  mentorPlan: {
    skillGaps: [
      { skill: "CI/CD Automation", currentLevel: "BEGINNER", requiredLevel: "INTERMEDIATE", priority: "HIGH", recommendation: "Set up GitHub Actions workflow in .github/workflows" }
    ],
    weeklyTasks: [
      { weekNumber: 1, taskType: "CI_CD", title: "Add GitHub Actions workflow", impactDescription: "Automate test runs on pull requests", completed: false }
    ],
  },
});

const { streamChatResponse } = require("../src/services/ai/mentorChatEngine");

async function runSingleEval(mockSession, question) {
  let attempts = 0;
  while (attempts < 3) {
    try {
      attempts++;
      let text = "";
      await streamChatResponse(mockSession, question, (c) => { text += c; });
      return text;
    } catch (err) {
      if (err.message?.includes("429 Too Many Requests") || err.message?.includes("Quota exceeded")) {
        console.log(`  ⏳ Rate limited (attempt ${attempts}), waiting 15 seconds...`);
        await new Promise((r) => setTimeout(r, 15000));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Exhausted retries due to rate limits.");
}

async function runEvals() {
  const evalsPath = path.join(__dirname, "../evals/mentorChatEvals.json");
  if (!fs.existsSync(evalsPath)) {
    console.error("❌ Evals file not found at:", evalsPath);
    process.exit(1);
  }

  let evals = JSON.parse(fs.readFileSync(evalsPath, "utf-8"));
  const targetId = process.argv[2];
  if (targetId) {
    evals = evals.filter((e) => e.id === targetId || e.id.endsWith(targetId));
    console.log(`\n🎯 Filtering eval case for ID "${targetId}"`);
  }

  console.log(`\n🧪 Running DevMitra AI Mentor Evals (${evals.length} test case(s))...\n`);

  const mockSession = {
    id: "eval-session-id",
    userId: "eval-user-id",
    analysisId: "eval-analysis-id",
  };

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < evals.length; i++) {
    const item = evals[i];
    console.log(`[${i + 1}/${evals.length}] Eval "${item.id}": "${item.question}"`);

    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    let responseText = "";
    try {
      responseText = await runSingleEval(mockSession, item.question);
    } catch (err) {
      console.log(`  ❌ FAIL: Error during streaming response - ${err.message}\n`);
      failed++;
      continue;
    }

    const lowerResponse = responseText.toLowerCase();
    let casePassed = true;
    const failures = [];

    // Check expected facts
    for (const fact of item.expectedFacts || []) {
      if (!lowerResponse.includes(fact.toLowerCase())) {
        casePassed = false;
        failures.push(`Missing expected fact: "${fact}"`);
      }
    }

    // Check negative facts
    for (const negFact of item.negativeFacts || []) {
      if (lowerResponse.includes(negFact.toLowerCase())) {
        casePassed = false;
        failures.push(`Contains forbidden/incorrect statement: "${negFact}"`);
      }
    }

    if (casePassed) {
      console.log(`  ✅ PASS`);
      console.log(`  Response excerpt: ${responseText.slice(0, 160).replace(/\n/g, " ")}...\n`);
      passed++;
    } else {
      console.log(`  ❌ FAIL`);
      failures.forEach((f) => console.log(`     - ${f}`));
      console.log(`  Full response:\n${responseText}\n`);
      failed++;
    }
  }

  console.log(`========================================`);
  console.log(`Eval Results: ${passed}/${evals.length} PASSED (${failed} failed)`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runEvals();
