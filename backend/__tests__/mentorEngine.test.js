"use strict";

const { buildMentorPlan, diffWithPreviousAnalysis } = require("../src/services/ai/mentorEngine");
const { runAllEngines, calculateReputation } = require("../src/services/ai/dimensionEngines");

const mockEvidence = {
  username: "testdev",
  collectedAt: new Date().toISOString(),
  repositories: [
    {
      name: "distributed-task-queue",
      fullName: "testdev/distributed-task-queue",
      description: "A task queue",
      language: "TypeScript",
      stars: 120,
      forks: 15,
      size: 3000,
      commitCount: 200,
      contributors: 2,
      hasReadme: true,
      hasTests: false, // Weak testing!
      hasCI: false,
      hasDocker: false,
      hasLicense: true,
      hasSecurity: false,
      openIssues: 5,
      lastActivity: "2 days ago",
      createdAt: "1 year ago",
      isArchived: false,
      isForked: false,
      visibility: "public",
      grade: "B",
      projectLevel: "EXPERT",
      topics: ["typescript", "redis"],
      dependencies: 12,
      devDependencies: 4,
    },
  ],
  commits: { total: 200, lastYear: 180, avgPerWeek: 4, longestStreak: 20, currentStreak: 5, conventionalCommitPercent: 30, avgMessageLength: 35, qualityScore: 60, messageQuality: "MEDIUM" },
  pullRequests: { total: 2, merged: 2, mergeRate: 100, avgReviewTime: 24, hasDescriptions: true, linksIssues: false, reviewsGiven: 1 },
  issues: { total: 1, closed: 1, closeRate: 100, avgResponseTime: 12, hasLabels: false, hasMilestones: false },
  activity: { contributionStreak: 5, weeklyAvg: 4, monthlyAvg: 15, yearlyTotal: 180, trend: "STABLE", contributionGraph: new Array(52).fill(3) },
  languages: { primary: "TypeScript", distribution: { TypeScript: 100 }, frameworks: ["Node.js"], diversity: 20 },
  totalPublicRepos: 1,
  totalPrivateRepos: 0,
  totalStars: 120,
  totalForks: 15,
  accountAge: 12,
  isOrganizationMember: false,
  qualityGatePassed: true,
  validationErrors: [],
  overallConfidence: 80,
};

describe("Mentor Engine — Repo Specificity", () => {
  test("Generates mentor plan referencing actual repository names", () => {
    const dimensions = runAllEngines(mockEvidence);
    const reputation = calculateReputation(mockEvidence, dimensions);

    const mentorPlan = buildMentorPlan(dimensions, mockEvidence, reputation);

    expect(mentorPlan).toHaveProperty("skillGaps");
    expect(mentorPlan).toHaveProperty("weeklyTasks");
    expect(mentorPlan.weeklyTasks.length).toBeGreaterThan(0);

    // Verify task title or recommendation explicitly names 'distributed-task-queue'
    const containsRepoName = mentorPlan.weeklyTasks.some((t) => t.title.includes("distributed-task-queue"));
    const containsRepoInGaps = mentorPlan.skillGaps.some((g) => g.recommendation.includes("distributed-task-queue"));

    expect(containsRepoName || containsRepoInGaps).toBe(true);
  });

  test("Diffs previous analysis with current analysis correctly", () => {
    const prevDimensions = {
      testing: { label: "Testing", score: 30 },
    };
    const currDimensions = {
      testing: { label: "Testing", score: 55 },
    };

    const callouts = diffWithPreviousAnalysis(currDimensions, prevDimensions);
    expect(callouts.length).toBe(1);
    expect(callouts[0].change).toBe(25);
    expect(callouts[0].message).toContain("+25 points");
  });
});
