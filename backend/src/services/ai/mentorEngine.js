/**
 * Mentor Engine — Core Differentiator
 * 
 * Generates personalized, repo-specific diagnosis and actionable improvement plans.
 * Rule: NEVER return generic advice. Always cite exact repository names, missing files,
 * and exact numerical score impacts.
 */

const { tierFromScore } = require("./dimensionEngines");

function buildMentorPlan(dimensions, evidence, reputationScore) {
  const pubRepos = (evidence.repositories || []).filter((r) => r.visibility === 'public' && !r.isArchived);
  
  // Find top repos by activity/stars
  const mainRepo = pubRepos[0] || null;
  const secondRepo = pubRepos[1] || mainRepo;
  const thirdRepo = pubRepos[2] || secondRepo;

  // 1. Rank scored dimensions by gap size * confidence
  const scoredDimensions = Object.entries(dimensions)
    .filter(([_, dim]) => dim.status === 'SCORED' && dim.score !== null)
    .map(([key, dim]) => ({
      key,
      ...dim,
      gap: (100 - dim.score) * (dim.confidence / 100),
    }))
    .sort((a, b) => b.gap - a.gap);

  const weakestDimensions = scoredDimensions.slice(0, 3);

  // 2. Derive skill gaps
  const skillGaps = weakestDimensions.map((dim) => {
    const requiredLevel = Math.min(95, Math.max(70, (dim.score || 50) + 25));
    let specificRec = `Improve ${dim.label} score from ${dim.score} to ${requiredLevel}.`;
    
    if (dim.key === 'testing' && mainRepo) {
      specificRec = mainRepo.hasTests
        ? `Increase test coverage in \`${mainRepo.name}\` — currently has basic tests, but CI automation is missing.`
        : `Add Jest/Vitest unit tests to \`${mainRepo.name}\` — it's your main repository and currently has zero test files.`;
    } else if (dim.key === 'documentation' && mainRepo) {
      specificRec = !mainRepo.hasReadme
        ? `Write a comprehensive README.md for \`${mainRepo.name}\` including setup steps, architecture diagram, and API examples.`
        : `Add LICENSE and contributing guidelines to \`${mainRepo.name}\` to improve documentation score.`;
    } else if (dim.key === 'deployment' && secondRepo) {
      specificRec = !secondRepo.hasDocker
        ? `Create a Dockerfile and docker-compose.yml for \`${secondRepo.name}\` to demonstrate containerization competency.`
        : `Add GitHub Actions CI/CD pipeline to \`${secondRepo.name}\`.`;
    } else if (dim.key === 'security' && mainRepo) {
      specificRec = `Add SECURITY.md vulnerability reporting instructions and enable Dependabot alerts on \`${mainRepo.name}\`.`;
    } else if (dim.key === 'codeQuality') {
      specificRec = `Adopt Conventional Commits standard across \`${mainRepo ? mainRepo.name : 'all repositories'}\` for automated release logs.`;
    }

    return {
      skill: dim.label,
      currentLevel: dim.score || 0,
      requiredLevel,
      priority: dim.gap > 40 ? 'HIGH' : dim.gap > 20 ? 'MEDIUM' : 'LOW',
      recommendation: specificRec,
    };
  });

  // 3. Generate weekly tasks with specific repo names
  const weeklyTasks = [];
  let weekNum = 1;

  // Task 1: Address documentation on top repo if missing or weak
  if (mainRepo && !mainRepo.hasReadme) {
    weeklyTasks.push({
      weekNumber: weekNum++,
      title: `Create README.md for \`${mainRepo.name}\``,
      taskType: 'BUILD',
      impactDescription: `Documentation score +15 points (Fixes missing README in ${mainRepo.name})`,
      estimatedHours: 4,
    });
  } else if (mainRepo) {
    weeklyTasks.push({
      weekNumber: weekNum++,
      title: `Audit and expand README in \`${mainRepo.name}\``,
      taskType: 'BUILD',
      impactDescription: `Documentation score +8 points (Add architecture diagram & usage examples)`,
      estimatedHours: 3,
    });
  }

  // Task 2: Testing task naming mainRepo
  if (mainRepo && !mainRepo.hasTests) {
    weeklyTasks.push({
      weekNumber: weekNum++,
      title: `Write unit test suite for \`${mainRepo.name}\``,
      taskType: 'CODE',
      impactDescription: `Testing score +20 points (Adds initial unit test coverage to primary project)`,
      estimatedHours: 8,
    });
  } else if (secondRepo && !secondRepo.hasTests) {
    weeklyTasks.push({
      weekNumber: weekNum++,
      title: `Add tests to \`${secondRepo.name}\``,
      taskType: 'CODE',
      impactDescription: `Testing score +12 points (Secondary project testing coverage)`,
      estimatedHours: 6,
    });
  }

  // Task 3: CI/CD task naming specific repo
  const repoWithoutCI = pubRepos.find((r) => !r.hasCI) || mainRepo;
  if (repoWithoutCI) {
    weeklyTasks.push({
      weekNumber: weekNum++,
      title: `Add GitHub Actions CI pipeline to \`${repoWithoutCI.name}\``,
      taskType: 'CODE',
      impactDescription: `Deployment score +12 points (Automates build & test on push)`,
      estimatedHours: 4,
    });
  }

  // Task 4: Docker/DevOps task
  const repoWithoutDocker = pubRepos.find((r) => !r.hasDocker) || secondRepo;
  if (repoWithoutDocker) {
    weeklyTasks.push({
      weekNumber: weekNum++,
      title: `Add Dockerfile and container config to \`${repoWithoutDocker.name}\``,
      taskType: 'CODE',
      impactDescription: `Deployment & Architecture score +10 points (Containerization)`,
      estimatedHours: 5,
    });
  }

  // Task 5: Security policy
  if (mainRepo) {
    weeklyTasks.push({
      weekNumber: weekNum++,
      title: `Add SECURITY.md and audit dependencies in \`${mainRepo.name}\``,
      taskType: 'REVIEW',
      impactDescription: `Security score +10 points (Document security policy & dependency hygiene)`,
      estimatedHours: 2,
    });
  }

  // Current and target tiers
  const currentTier = reputationScore ? reputationScore.tier : 'NO_TIER';
  const tierLevels = ['NO_TIER', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'PRINCIPAL'];
  const currentIdx = tierLevels.indexOf(currentTier);
  const targetTier = tierLevels[Math.min(tierLevels.length - 1, Math.max(1, currentIdx + 1))];

  return {
    currentTier,
    targetTier,
    estimatedTimeline: currentIdx < 2 ? '4–8 weeks' : currentIdx < 4 ? '2–4 months' : '3–6 months',
    skillGaps,
    weeklyTasks,
  };
}

/**
 * Compares current evidence against past analysis to highlight user progress.
 */
function diffWithPreviousAnalysis(currentDimensions, previousDimensions, completedTaskTitles = []) {
  const callouts = [];

  for (const [key, curr] of Object.entries(currentDimensions)) {
    const prev = previousDimensions[key];
    if (prev && curr.score !== null && prev.score !== null) {
      const diff = curr.score - prev.score;
      if (diff > 0) {
        callouts.push({
          dimension: key,
          label: curr.label,
          change: diff,
          message: `✅ Your ${curr.label} score improved by +${diff} points (Now ${curr.score}/100)!`,
        });
      }
    }
  }

  return callouts;
}

module.exports = {
  buildMentorPlan,
  diffWithPreviousAnalysis,
};
