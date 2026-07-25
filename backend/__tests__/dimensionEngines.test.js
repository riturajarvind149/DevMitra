"use strict";

const {
  runQualityGate,
  runAllEngines,
  calculateOverallScore,
  calculateReputation,
  tierFromScore,
} = require("../src/services/ai/dimensionEngines");

const mockEvidence = {
  username: "testuser",
  collectedAt: new Date().toISOString(),
  repositories: [
    {
      name: "test-repo-1",
      fullName: "testuser/test-repo-1",
      description: "A cool test repo",
      language: "TypeScript",
      stars: 15,
      forks: 3,
      size: 1200,
      commitCount: 100,
      contributors: 1,
      hasReadme: true,
      hasTests: true,
      hasCI: true,
      hasDocker: false,
      hasLicense: true,
      hasSecurity: false,
      openIssues: 2,
      lastActivity: "1 day ago",
      createdAt: "1 year ago",
      isArchived: false,
      isForked: false,
      visibility: "public",
      grade: "A",
      projectLevel: "ADVANCED",
      topics: ["typescript"],
      dependencies: 10,
      devDependencies: 5,
    },
  ],
  commits: {
    total: 150,
    lastYear: 120,
    avgPerWeek: 3,
    longestStreak: 14,
    currentStreak: 5,
    conventionalCommitPercent: 60,
    avgMessageLength: 45,
    qualityScore: 75,
    messageQuality: "HIGH",
  },
  pullRequests: { total: 5, merged: 4, mergeRate: 80, avgReviewTime: 12, hasDescriptions: true, linksIssues: true, reviewsGiven: 2 },
  issues: { total: 3, closed: 2, closeRate: 66, avgResponseTime: 5, hasLabels: true, hasMilestones: false },
  activity: { contributionStreak: 5, weeklyAvg: 3, monthlyAvg: 12, yearlyTotal: 120, trend: "INCREASING", contributionGraph: new Array(52).fill(2) },
  languages: { primary: "TypeScript", distribution: { TypeScript: 100 }, frameworks: ["Node.js"], diversity: 30 },
  totalPublicRepos: 1,
  totalPrivateRepos: 0,
  totalStars: 15,
  totalForks: 3,
  accountAge: 12,
  isOrganizationMember: false,
  qualityGatePassed: true,
  validationErrors: [],
  overallConfidence: 75,
};

describe("Dimension Engines & Quality Gate", () => {
  test("Quality Gate passes when public repositories and activity exist", () => {
    const gate = runQualityGate(mockEvidence);
    expect(gate.passed).toBe(true);
  });

  test("Quality Gate fails hard when 0 public repos and 0 activity exist", () => {
    const emptyEvidence = {
      ...mockEvidence,
      repositories: [],
      totalPublicRepos: 0,
      activity: { ...mockEvidence.activity, yearlyTotal: 0 },
      validationErrors: ["No public GitHub repositories or activity found for evaluation."],
    };

    const gate = runQualityGate(emptyEvidence);
    expect(gate.passed).toBe(false);

    const reputation = calculateReputation(emptyEvidence, {});
    expect(reputation.score).toBeNull();
    expect(reputation.tier).toBe("NO_TIER");
  });

  test("Calculates dimension scores correctly with valid evidence", () => {
    const dimensions = runAllEngines(mockEvidence);
    expect(dimensions.codeQuality.status).toBe("SCORED");
    expect(dimensions.codeQuality.score).toBeGreaterThan(0);
    expect(dimensions.testing.score).toBeGreaterThan(0);

    const overall = calculateOverallScore(dimensions);
    expect(overall.score).toBeGreaterThan(0);
    expect(overall.confidence).toBeGreaterThan(0);
  });

  test("Tier calculation maps score to appropriate tier label", () => {
    expect(tierFromScore(85, 8, 30)).toBe("ADVANCED");
    expect(tierFromScore(90, 25, 100)).toBe("PRINCIPAL");
    expect(tierFromScore(30, 0, 0)).toBe("NO_TIER");
  });
});
