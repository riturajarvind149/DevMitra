"use strict";

const {
  analyzeSecurity,
  analyzeDeployment,
  analyzeOpenSource,
} = require("../src/services/ai/dimensionEngines");

describe("Dimension Engines — Variety Check for Security, Deployment, and Open Source", () => {
  // Fixture 1: High Security, High Deployment, High Open Source
  const highFixture = {
    username: "highdev",
    totalPublicRepos: 5,
    repositories: Array(5).fill({
      visibility: "public",
      isArchived: false,
      isForked: false,
      hasSecurity: true,
      hasCI: true,
      hasDocker: true,
      hasLicense: true,
    }),
    totalStars: 250,
    totalForks: 45,
    pullRequests: { merged: 20 },
  };

  // Fixture 2: Low Security, Low Deployment, Low Open Source
  const lowFixture = {
    username: "lowdev",
    totalPublicRepos: 5,
    repositories: Array(5).fill({
      visibility: "public",
      isArchived: false,
      isForked: false,
      hasSecurity: false,
      hasCI: false,
      hasDocker: false,
      hasLicense: false,
    }),
    totalStars: 0,
    totalForks: 0,
    pullRequests: { merged: 0 },
  };

  // Fixture 3: Medium / Mixed Signals
  const mixedFixture = {
    username: "mixeddev",
    totalPublicRepos: 5,
    repositories: [
      { visibility: "public", isArchived: false, isForked: false, hasSecurity: true, hasCI: true, hasDocker: false, hasLicense: true },
      { visibility: "public", isArchived: false, isForked: false, hasSecurity: false, hasCI: false, hasDocker: false, hasLicense: true },
      { visibility: "public", isArchived: false, isForked: false, hasSecurity: false, hasCI: true, hasDocker: true, hasLicense: false },
      { visibility: "public", isArchived: false, isForked: false, hasSecurity: false, hasCI: false, hasDocker: false, hasLicense: false },
      { visibility: "public", isArchived: false, isForked: false, hasSecurity: false, hasCI: false, hasDocker: false, hasLicense: false },
    ],
    totalStars: 25,
    totalForks: 5,
    pullRequests: { merged: 3 },
  };

  test("Security scores differ meaningfully (> 10 points) between high, low, and mixed fixtures", () => {
    const highSec = analyzeSecurity(highFixture).score;
    const lowSec = analyzeSecurity(lowFixture).score;
    const mixedSec = analyzeSecurity(mixedFixture).score;

    expect(highSec).toBeGreaterThan(lowSec + 10);
    expect(highSec).toBeGreaterThan(mixedSec);
    expect(mixedSec).toBeGreaterThan(lowSec);
  });

  test("Deployment scores differ meaningfully (> 10 points) between high, low, and mixed fixtures", () => {
    const highDep = analyzeDeployment(highFixture).score;
    const lowDep = analyzeDeployment(lowFixture).score;
    const mixedDep = analyzeDeployment(mixedFixture).score;

    expect(highDep).toBeGreaterThan(lowDep + 10);
    expect(highDep).toBeGreaterThan(mixedDep);
    expect(mixedDep).toBeGreaterThan(lowDep);
  });

  test("Open Source scores differ meaningfully (> 10 points) between high, low, and mixed fixtures", () => {
    const highOS = analyzeOpenSource(highFixture).score;
    const lowOS = analyzeOpenSource(lowFixture).score;
    const mixedOS = analyzeOpenSource(mixedFixture).score;

    expect(highOS).toBeGreaterThan(lowOS + 10);
    expect(highOS).toBeGreaterThan(mixedOS);
    expect(mixedOS).toBeGreaterThan(lowOS);
  });
});
