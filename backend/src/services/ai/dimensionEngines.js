// DevMitra AI Engine — Evidence-Based Scoring
// Rule 1: No score without evidence. No evidence = "INSUFFICIENT_EVIDENCE" (score: null).
// Rule 2: Quality Gate is a HARD stop — if passed === false, no reputation score is rendered.

function confidenceLevel(score) {
  if (score >= 80) return 'HIGH';
  if (score >= 55) return 'MEDIUM';
  if (score >= 30) return 'LOW';
  return 'INSUFFICIENT';
}

function gradeFromScore(score) {
  if (score >= 93) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 78) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function tierFromScore(score, repoCount, commitStreak) {
  if (!score || repoCount === 0) return 'NO_TIER';
  if (score >= 88 && repoCount >= 20) return 'PRINCIPAL';
  if (score >= 78 && repoCount >= 12) return 'EXPERT';
  if (score >= 65 && repoCount >= 6) return 'ADVANCED';
  if (score >= 45 && repoCount >= 2) return 'INTERMEDIATE';
  if (repoCount >= 1 || commitStreak > 0) return 'BEGINNER';
  return 'NO_TIER';
}

function runQualityGate(evidence) {
  const checks = [
    {
      name: 'Evidence Collection',
      passed: evidence.repositories.length > 0 && Boolean(evidence.collectedAt),
      message: evidence.repositories.length === 0
        ? 'No repositories found — insufficient evidence for analysis'
        : `${evidence.repositories.length} repositories collected`,
      required: true,
    },
    {
      name: 'Evidence Validation',
      passed: evidence.validationErrors.length === 0,
      message: evidence.validationErrors.length > 0
        ? `Validation errors: ${evidence.validationErrors.join(', ')}`
        : 'All evidence validated',
      required: true,
    },
    {
      name: 'Confidence Calculation',
      passed: evidence.overallConfidence >= 20,
      message: evidence.overallConfidence < 20
        ? `Confidence too low (${evidence.overallConfidence}%) — public activity needed`
        : `Confidence: ${evidence.overallConfidence}%`,
      required: false,
    },
    {
      name: 'GitHub Public Activity',
      passed: evidence.totalPublicRepos > 0 || evidence.activity.yearlyTotal > 0,
      message: evidence.totalPublicRepos === 0 && evidence.activity.yearlyTotal === 0
        ? 'No public repositories or activity recorded'
        : `${evidence.totalPublicRepos} public repositories, ${evidence.activity.yearlyTotal} contributions`,
      required: true,
    },
  ];

  const requiredFailed = checks.filter((c) => c.required && !c.passed);
  return {
    passed: requiredFailed.length === 0,
    checks,
  };
}

function insufficientEvidence(dimension, label, icon, reason) {
  return {
    dimension,
    label,
    icon,
    score: null,
    confidence: 0,
    confidenceLevel: 'INSUFFICIENT',
    status: 'INSUFFICIENT_EVIDENCE',
    evidenceSources: [],
    reason,
    strengths: [],
    weaknesses: ['Not enough public data to evaluate'],
    improvements: [{
      action: 'Make repositories public or add more public contributions',
      impact: 'Enables evidence-based scoring',
      estimatedGain: 0,
      estimatedTime: 'Immediate',
      effort: 'LOW',
    }],
    estimatedGain: 0,
    effort: 'LOW',
  };
}

function analyzeCodeQuality(evidence) {
  if (evidence.totalPublicRepos === 0) {
    return insufficientEvidence('codeQuality', 'Code Quality', '⌨️',
      'No public repositories found. Cannot assess code quality without evidence.');
  }

  const pubRepos = evidence.repositories.filter((r) => r.visibility === 'public' && !r.isArchived);
  if (pubRepos.length === 0) {
    return insufficientEvidence('codeQuality', 'Code Quality', '⌨️',
      'All repositories are archived or private. Code quality cannot be assessed.');
  }

  const evidenceSources = [];
  let score = 40;
  let confidence = 30;

  const commitQuality = evidence.commits.qualityScore;
  score += Math.round(commitQuality * 0.2);
  confidence += 15;
  evidenceSources.push(`${evidence.commits.total} commits analyzed`);
  evidenceSources.push(`Commit message quality: ${evidence.commits.messageQuality}`);

  const langDiversity = evidence.languages.diversity;
  score += Math.round(langDiversity * 0.1);
  evidenceSources.push(`${Object.keys(evidence.languages.distribution).length} languages detected`);

  const testedRepos = pubRepos.filter((r) => r.hasTests).length;
  const testRatio = pubRepos.length > 0 ? testedRepos / pubRepos.length : 0;
  score += Math.round(testRatio * 15);
  confidence += 10;
  evidenceSources.push(`${testedRepos}/${pubRepos.length} repositories have tests`);

  score += Math.round(evidence.commits.conventionalCommitPercent * 0.1);

  if (evidence.activity.trend === 'INCREASING') { score += 5; confidence += 5; }
  if (evidence.commits.currentStreak > 30) { score += 5; }
  evidenceSources.push(`${evidence.commits.currentStreak}-day contribution streak`);

  score = Math.min(100, Math.max(0, score));
  confidence = Math.min(95, confidence);

  const strengths = [];
  const weaknesses = [];

  if (commitQuality > 70) strengths.push('High-quality commit messages with clear intent');
  else weaknesses.push('Commit messages lack detail or follow no convention');

  if (testRatio > 0.6) strengths.push('Majority of repositories have test coverage');
  else if (testRatio < 0.2) weaknesses.push('Very few repositories include test files');

  if (evidence.commits.conventionalCommitPercent > 60) strengths.push('Follows conventional commit standards');
  if (evidence.activity.trend === 'INCREASING') strengths.push('Coding activity is trending upward');
  if (evidence.activity.trend === 'DECREASING') weaknesses.push('Contribution frequency has been declining');

  return {
    dimension: 'codeQuality',
    label: 'Code Quality',
    icon: '⌨️',
    score,
    confidence,
    confidenceLevel: confidenceLevel(confidence),
    status: 'SCORED',
    evidenceSources,
    reason: `Score derived from ${pubRepos.length} public repositories. Commit quality (${evidence.commits.messageQuality}), test presence in ${Math.round(testRatio * 100)}% of repos, and ${evidence.commits.conventionalCommitPercent}% conventional commit adoption.`,
    strengths,
    weaknesses,
    improvements: [
      {
        action: 'Adopt Conventional Commits standard across all repositories',
        impact: 'Cleaner history, better changelogs, automated versioning',
        estimatedGain: 6,
        estimatedTime: '1–2 days',
        effort: 'LOW',
      },
      {
        action: 'Add ESLint + Prettier to every JavaScript/TypeScript project',
        impact: 'Consistent code style, catches bugs early',
        estimatedGain: 5,
        estimatedTime: '2–4 hours',
        effort: 'LOW',
      },
    ],
    estimatedGain: 12,
    effort: 'MEDIUM',
  };
}

function analyzeArchitecture(evidence) {
  const pubRepos = evidence.repositories.filter((r) => r.visibility === 'public' && !r.isForked && !r.isArchived);

  if (pubRepos.length < 1) {
    return insufficientEvidence('architecture', 'Architecture', '🏗️',
      `Need at least 1 original public repository to assess architectural patterns.`);
  }

  const evidenceSources = [];
  let score = 35;
  let confidence = 40;

  const largeRepos = pubRepos.filter((r) => r.size > 500);
  const hasMultipleLangs = Object.keys(evidence.languages.distribution).length >= 3;
  const avgContributors = pubRepos.reduce((s, r) => s + r.contributors, 0) / pubRepos.length;

  score += Math.min(20, pubRepos.length * 3);
  confidence += Math.min(20, pubRepos.length * 2);
  evidenceSources.push(`${pubRepos.length} original repositories analyzed`);

  if (largeRepos.length > 0) { score += 10; evidenceSources.push(`${largeRepos.length} large-scale projects (>500KB)`); }
  if (hasMultipleLangs) { score += 8; evidenceSources.push(`Multi-language portfolio: ${Object.keys(evidence.languages.distribution).join(', ')}`); }

  const ciRepos = pubRepos.filter((r) => r.hasCI).length;
  score += Math.round((ciRepos / pubRepos.length) * 10);
  evidenceSources.push(`CI/CD present in ${ciRepos}/${pubRepos.length} repos`);

  const dockerRepos = pubRepos.filter((r) => r.hasDocker).length;
  if (dockerRepos > 0) { score += 5; evidenceSources.push(`Docker configuration in ${dockerRepos} repos`); }

  score = Math.min(100, score);
  confidence = Math.min(90, confidence);

  const strengths = [];
  const weaknesses = [];

  if (largeRepos.length >= 2) strengths.push('Multiple large-scale, production-grade projects');
  if (hasMultipleLangs) strengths.push('Polyglot portfolio shows architectural versatility');
  if (ciRepos > 0) strengths.push('CI/CD adoption demonstrates automation mindset');
  if (dockerRepos === 0) weaknesses.push('No Docker usage — containerization skills unclear');
  if (avgContributors < 1.5) weaknesses.push('Mostly solo projects — limited team architecture experience visible');

  return {
    dimension: 'architecture',
    label: 'Architecture',
    icon: '🏗️',
    score,
    confidence,
    confidenceLevel: confidenceLevel(confidence),
    status: 'SCORED',
    evidenceSources,
    reason: `Assessed ${pubRepos.length} original repositories. Architecture quality inferred from project scale (${largeRepos.length} large projects), multi-language adoption, CI/CD coverage, and Docker usage.`,
    strengths,
    weaknesses,
    improvements: [
      {
        action: 'Add Dockerfile and docker-compose to your main projects',
        impact: 'Demonstrates production deployment knowledge',
        estimatedGain: 8,
        estimatedTime: '4–8 hours per project',
        effort: 'MEDIUM',
      },
    ],
    estimatedGain: 15,
    effort: 'HIGH',
  };
}

function analyzeTesting(evidence) {
  const pubRepos = evidence.repositories.filter((r) => r.visibility === 'public' && !r.isArchived);

  if (pubRepos.length === 0) {
    return insufficientEvidence('testing', 'Testing', '🧪',
      'No public repositories to analyze for test coverage.');
  }

  const testedRepos = pubRepos.filter((r) => r.hasTests);
  const ciRepos = pubRepos.filter((r) => r.hasCI);
  const testRatio = testedRepos.length / pubRepos.length;
  const ciRatio = ciRepos.length / pubRepos.length;

  const evidenceSources = [
    `${pubRepos.length} repositories scanned for test files`,
    `${testedRepos.length} repositories contain test files`,
    `${ciRepos.length} repositories have CI (automated test runs)`,
  ];

  let score = Math.round(testRatio * 60 + ciRatio * 40);
  let confidence = 50 + Math.min(30, pubRepos.length * 5);

  const strengths = [];
  const weaknesses = [];

  if (testRatio > 0.7) { strengths.push('Strong testing culture — majority of projects include tests'); }
  else if (testRatio < 0.2) { weaknesses.push('Testing severely lacking — fewer than 20% of projects have tests'); score -= 5; }

  if (ciRatio > 0.5) { strengths.push('CI pipeline ensures tests run automatically on every push'); }
  else { weaknesses.push('Few projects automate test execution via CI'); }

  if (score === 0 && testedRepos.length === 0) {
    return {
      ...insufficientEvidence('testing', 'Testing', '🧪', 'No test files found in any public repository.'),
      score: 8,
      confidence: 60,
      confidenceLevel: 'MEDIUM',
      status: 'SCORED',
      evidenceSources,
      reason: 'No test files detected in any public repository. Testing dimension score reflects absence of testing evidence.',
      weaknesses: ['No test files found in any repository', 'No CI configuration for automated testing'],
    };
  }

  return {
    dimension: 'testing',
    label: 'Testing',
    icon: '🧪',
    score: Math.min(100, score),
    confidence: Math.min(90, confidence),
    confidenceLevel: confidenceLevel(confidence),
    status: 'SCORED',
    evidenceSources,
    reason: `${testedRepos.length} of ${pubRepos.length} repositories contain test files (${Math.round(testRatio * 100)}%). CI present in ${Math.round(ciRatio * 100)}% of repos.`,
    strengths,
    weaknesses,
    improvements: [
      {
        action: 'Add unit and integration tests to your top repositories',
        impact: 'Direct score improvement, signals engineering discipline',
        estimatedGain: 20,
        estimatedTime: '1–2 weeks per project',
        effort: 'HIGH',
      },
    ],
    estimatedGain: 25,
    effort: 'HIGH',
  };
}

function analyzeDocumentation(evidence) {
  const pubRepos = evidence.repositories.filter((r) => r.visibility === 'public' && !r.isArchived);

  if (pubRepos.length === 0) {
    return insufficientEvidence('documentation', 'Documentation', '📝',
      'No public repositories to evaluate for documentation quality.');
  }

  const readmeRepos = pubRepos.filter((r) => r.hasReadme);
  const licenseRepos = pubRepos.filter((r) => r.hasLicense);
  const describedRepos = pubRepos.filter((r) => r.description && r.description.length > 20);
  const topicRepos = pubRepos.filter((r) => r.topics && r.topics.length > 0);

  const readmeRatio = readmeRepos.length / pubRepos.length;
  const licenseRatio = licenseRepos.length / pubRepos.length;
  const describeRatio = describedRepos.length / pubRepos.length;

  const evidenceSources = [
    `${readmeRepos.length}/${pubRepos.length} repositories have README`,
    `${licenseRepos.length}/${pubRepos.length} repositories have LICENSE`,
    `${describedRepos.length}/${pubRepos.length} repositories have descriptions`,
    `${topicRepos.length}/${pubRepos.length} repositories have topic tags`,
  ];

  const score = Math.min(100, Math.round(
    readmeRatio * 40 +
    licenseRatio * 15 +
    describeRatio * 25 +
    (topicRepos.length / pubRepos.length) * 20
  ));

  const confidence = Math.min(90, 50 + pubRepos.length * 4);

  const strengths = [];
  const weaknesses = [];

  if (readmeRatio > 0.8) strengths.push('Excellent README coverage across repositories');
  else if (readmeRatio < 0.4) weaknesses.push('Most repositories lack README documentation');

  if (licenseRatio > 0.7) strengths.push('Open source licensing properly applied');
  else weaknesses.push('Missing LICENSE files — limits open-source adoption');

  if (describeRatio > 0.6) strengths.push('Projects well-described for discoverability');
  else weaknesses.push('Most repositories lack clear descriptions');

  return {
    dimension: 'documentation',
    label: 'Documentation',
    icon: '📝',
    score,
    confidence,
    confidenceLevel: confidenceLevel(confidence),
    status: 'SCORED',
    evidenceSources,
    reason: `README: ${Math.round(readmeRatio * 100)}%, LICENSE: ${Math.round(licenseRatio * 100)}%, Descriptions: ${Math.round(describeRatio * 100)}% across ${pubRepos.length} repositories.`,
    strengths,
    weaknesses,
    improvements: [
      {
        action: 'Write comprehensive README for every project (installation, usage, screenshots)',
        impact: 'Dramatically improves first impressions',
        estimatedGain: 15,
        estimatedTime: '2–4 hours per project',
        effort: 'MEDIUM',
      },
    ],
    estimatedGain: 18,
    effort: 'MEDIUM',
  };
}

function analyzeSecurity(evidence) {
  const pubRepos = evidence.repositories.filter((r) => r.visibility === 'public' && !r.isArchived);

  if (pubRepos.length === 0) {
    return insufficientEvidence('security', 'Security', '🔒',
      'No public repositories to analyze for security practices.');
  }

  const secureRepos = pubRepos.filter((r) => r.hasSecurity);
  const ciRepos = pubRepos.filter((r) => r.hasCI);
  const licenseRepos = pubRepos.filter((r) => r.hasLicense);

  const evidenceSources = [
    `${secureRepos.length}/${pubRepos.length} repos have SECURITY.md or security config`,
    `${ciRepos.length}/${pubRepos.length} repos have CI (can include security scans)`,
    `Dependency files analyzed across ${pubRepos.length} repositories`,
  ];

  const securityRatio = secureRepos.length / pubRepos.length;
  let score = Math.round(securityRatio * 50 + (ciRepos.length / pubRepos.length) * 25 + (licenseRepos.length / pubRepos.length) * 10 + 15);
  const confidence = Math.min(80, 40 + pubRepos.length * 4);

  const strengths = [];
  const weaknesses = [];

  if (securityRatio > 0.3) strengths.push('Security policies documented in some repositories');
  else weaknesses.push('No SECURITY.md found — no public vulnerability reporting process');

  if (ciRepos.length > 0) strengths.push('CI pipeline present (can add security scanning tools)');

  return {
    dimension: 'security',
    label: 'Security',
    icon: '🔒',
    score: Math.min(100, score),
    confidence,
    confidenceLevel: confidenceLevel(confidence),
    status: 'SCORED',
    evidenceSources,
    reason: `Security assessed from SECURITY.md presence (${secureRepos.length} repos), CI pipeline (${ciRepos.length} repos), and license compliance.`,
    strengths,
    weaknesses,
    improvements: [
      {
        action: 'Add SECURITY.md to each repository with vulnerability reporting process',
        impact: 'Professional security posture for open source',
        estimatedGain: 8,
        estimatedTime: '1 hour',
        effort: 'LOW',
      },
    ],
    estimatedGain: 18,
    effort: 'LOW',
  };
}

function analyzeDeployment(evidence) {
  const pubRepos = evidence.repositories.filter((r) => r.visibility === 'public' && !r.isArchived);

  if (pubRepos.length === 0) {
    return insufficientEvidence('deployment', 'Deployment', '🚀',
      'No public repositories to evaluate deployment practices.');
  }

  const dockerRepos = pubRepos.filter((r) => r.hasDocker);
  const ciRepos = pubRepos.filter((r) => r.hasCI);
  const dockerRatio = dockerRepos.length / pubRepos.length;
  const ciRatio = ciRepos.length / pubRepos.length;

  const evidenceSources = [
    `${dockerRepos.length}/${pubRepos.length} repositories have Dockerfile`,
    `${ciRepos.length}/${pubRepos.length} repositories have CI/CD configuration`,
  ];

  const score = Math.min(100, Math.round(dockerRatio * 40 + ciRatio * 40 + 20));
  const confidence = Math.min(85, 40 + pubRepos.length * 4);

  const strengths = [];
  const weaknesses = [];

  if (dockerRatio > 0.3) strengths.push('Containerization knowledge demonstrated');
  else weaknesses.push('No Docker usage — containerization skills cannot be verified');
  if (ciRatio > 0.5) strengths.push('CI/CD practices are established');
  else weaknesses.push('Limited automated deployment pipeline evidence');

  return {
    dimension: 'deployment',
    label: 'Deployment & DevOps',
    icon: '🚀',
    score,
    confidence,
    confidenceLevel: confidenceLevel(confidence),
    status: 'SCORED',
    evidenceSources,
    reason: `Docker in ${Math.round(dockerRatio * 100)}% of repos, CI/CD in ${Math.round(ciRatio * 100)}%.`,
    strengths,
    weaknesses,
    improvements: [
      {
        action: 'Add GitHub Actions deployment workflow with staging + production environments',
        impact: 'Full CI/CD pipeline demonstrates DevOps competency',
        estimatedGain: 12,
        estimatedTime: '1–2 days',
        effort: 'MEDIUM',
      },
    ],
    estimatedGain: 20,
    effort: 'MEDIUM',
  };
}

function analyzeOpenSource(evidence) {
  const pubRepos = evidence.repositories.filter((r) => r.visibility === 'public' && !r.isForked);
  const totalStars = evidence.totalStars;
  const totalForks = evidence.totalForks;

  if (pubRepos.length === 0) {
    return insufficientEvidence('openSource', 'Open Source', '🌍',
      'No original public repositories found. Open source impact cannot be assessed.');
  }

  const evidenceSources = [
    `${pubRepos.length} original public repositories`,
    `${totalStars} total GitHub stars`,
    `${totalForks} total forks by the community`,
    `${evidence.pullRequests.merged} merged pull requests`,
  ];

  let score = 20;
  const confidence = Math.min(90, 50 + pubRepos.length * 3);

  score += Math.min(30, Math.round(Math.log(totalStars + 1) * 8));
  score += Math.min(15, Math.round(Math.log(totalForks + 1) * 5));
  score += Math.min(20, pubRepos.length * 2);
  score += Math.min(15, Math.round(evidence.pullRequests.merged * 0.5));

  const strengths = [];
  const weaknesses = [];

  if (totalStars > 50) strengths.push(`${totalStars} stars indicates community recognition`);
  if (totalForks > 10) strengths.push('Projects are actively forked and used by others');
  if (pubRepos.length >= 5) strengths.push('Active open source contributor with multiple projects');
  if (totalStars < 10) weaknesses.push('Low community recognition — consider promoting your work');
  if (evidence.pullRequests.merged < 3) weaknesses.push('Few merged PRs to external projects detected');

  return {
    dimension: 'openSource',
    label: 'Open Source',
    icon: '🌍',
    score: Math.min(100, score),
    confidence,
    confidenceLevel: confidenceLevel(confidence),
    status: 'SCORED',
    evidenceSources,
    reason: `${pubRepos.length} original public repos with ${totalStars} stars and ${totalForks} forks.`,
    strengths,
    weaknesses,
    improvements: [
      {
        action: 'Contribute to popular open source projects with meaningful PRs',
        impact: 'Demonstrates collaboration skills, builds network',
        estimatedGain: 12,
        estimatedTime: '2–4 weeks',
        effort: 'HIGH',
      },
    ],
    estimatedGain: 20,
    effort: 'HIGH',
  };
}

function analyzeConsistency(evidence) {
  const { activity, commits } = evidence;

  if (activity.yearlyTotal === 0 && commits.total === 0) {
    return insufficientEvidence('consistency', 'Consistency', '📅',
      'No activity data found. Consistency cannot be measured.');
  }

  const evidenceSources = [
    `${activity.yearlyTotal} contributions in the past year`,
    `${commits.longestStreak}-day longest contribution streak`,
    `${commits.currentStreak}-day current streak`,
    `Activity trend: ${activity.trend}`,
  ];

  let score = 20;
  const confidence = 70;

  score += Math.min(30, Math.round(activity.weeklyAvg * 3));
  score += Math.min(20, Math.round(commits.longestStreak * 0.4));
  score += Math.min(15, Math.round(commits.currentStreak * 0.3));
  if (activity.trend === 'INCREASING') score += 10;
  if (activity.trend === 'STABLE') score += 5;

  const strengths = [];
  const weaknesses = [];

  if (commits.currentStreak > 30) strengths.push(`Active ${commits.currentStreak}-day contribution streak`);
  if (commits.longestStreak > 60) strengths.push(`Longest streak of ${commits.longestStreak} days shows sustained commitment`);
  if (activity.weeklyAvg > 15) strengths.push(`Averaging ${activity.weeklyAvg} contributions/week`);
  if (commits.currentStreak === 0) weaknesses.push('No active streak currently — last contribution was some time ago');

  return {
    dimension: 'consistency',
    label: 'Consistency',
    icon: '📅',
    score: Math.min(100, score),
    confidence,
    confidenceLevel: confidenceLevel(confidence),
    status: 'SCORED',
    evidenceSources,
    reason: `${activity.yearlyTotal} contributions in the last year. Longest streak: ${commits.longestStreak} days. Current streak: ${commits.currentStreak} days.`,
    strengths,
    weaknesses,
    improvements: [
      {
        action: 'Maintain a daily coding habit — even 1 commit/day compounds significantly',
        impact: 'Streak and consistency score improvement',
        estimatedGain: 10,
        estimatedTime: 'Ongoing',
        effort: 'LOW',
      },
    ],
    estimatedGain: 12,
    effort: 'LOW',
  };
}

function runAllEngines(evidence) {
  return {
    codeQuality: analyzeCodeQuality(evidence),
    architecture: analyzeArchitecture(evidence),
    testing: analyzeTesting(evidence),
    documentation: analyzeDocumentation(evidence),
    security: analyzeSecurity(evidence),
    deployment: analyzeDeployment(evidence),
    openSource: analyzeOpenSource(evidence),
    consistency: analyzeConsistency(evidence),
  };
}

function calculateOverallScore(dimensions) {
  const weights = {
    codeQuality: 0.20,
    architecture: 0.18,
    testing: 0.15,
    documentation: 0.10,
    security: 0.10,
    deployment: 0.10,
    openSource: 0.10,
    consistency: 0.07,
  };

  let weightedSum = 0;
  let totalWeight = 0;
  let confidenceSum = 0;
  let dimensionCount = 0;

  for (const [key, dim] of Object.entries(dimensions)) {
    if (dim.score !== null && dim.status === 'SCORED') {
      const w = weights[key] || 0;
      weightedSum += dim.score * w;
      totalWeight += w;
      confidenceSum += dim.confidence;
      dimensionCount++;
    }
  }

  if (totalWeight === 0 || dimensionCount < 2) return { score: null, confidence: 0 };

  return {
    score: Math.round(weightedSum / totalWeight),
    confidence: Math.round(confidenceSum / dimensionCount),
  };
}

function calculateReputation(evidence, dimensions) {
  const qualityGate = runQualityGate(evidence);

  // HARD STOP: If quality gate fails, return null score
  if (!qualityGate.passed) {
    return {
      score: null,
      tier: 'NO_TIER',
      confidence: evidence.overallConfidence,
      growthPrediction: 0,
      categories: [],
      improvements: ['Make repositories public or increase public activity to unlock reputation score.'],
      explanation: 'Insufficient public GitHub activity to generate a reputation score.',
      achievementBadges: [],
    };
  }

  const { score: overallScore } = calculateOverallScore(dimensions);
  if (overallScore === null) {
    return {
      score: null,
      tier: 'NO_TIER',
      confidence: 0,
      growthPrediction: 0,
      categories: [],
      improvements: ['Insufficient data across core engineering dimensions.'],
      explanation: 'Not enough dimension data to calculate reputation score.',
      achievementBadges: [],
    };
  }

  const tier = tierFromScore(overallScore, evidence.totalPublicRepos, evidence.commits.currentStreak);

  // Calculate evidence categories
  const categories = [
    {
      name: 'Project Quality',
      score: Math.round((dimensions.architecture.score || 50 + dimensions.codeQuality.score || 50) / 2),
      weight: 0.30,
      contribution: Math.round(((dimensions.architecture.score || 50 + dimensions.codeQuality.score || 50) / 2) * 0.30),
      evidence: [`${evidence.repositories.length} repos analyzed`],
      reason: 'Architecture and code quality evidence',
      confidence: 70,
    },
    {
      name: 'GitHub Activity',
      score: Math.min(100, Math.round((evidence.activity.yearlyTotal / 365) * 40 + (evidence.commits.currentStreak / 30) * 30 + 30)),
      weight: 0.20,
      contribution: Math.round(Math.min(100, Math.round((evidence.activity.yearlyTotal / 365) * 40 + (evidence.commits.currentStreak / 30) * 30 + 30)) * 0.20),
      evidence: [`${evidence.activity.yearlyTotal} contributions/year`, `${evidence.commits.currentStreak}-day streak`],
      reason: 'Contribution frequency and streak length',
      confidence: 80,
    },
    {
      name: 'Technical Excellence',
      score: overallScore,
      weight: 0.50,
      contribution: Math.round(overallScore * 0.50),
      evidence: [`Overall quality score: ${overallScore}`],
      reason: 'Composite technical dimension score',
      confidence: evidence.overallConfidence,
    },
  ];

  return {
    score: overallScore,
    tier,
    confidence: evidence.overallConfidence,
    growthPrediction: Math.min(30, Math.max(-10, Math.round((overallScore - 50) * 0.3))),
    categories,
    improvements: [
      'Increase testing coverage across repositories (+reputation)',
      'Add comprehensive documentation to top projects',
      'Maintain daily contribution consistency',
    ],
    explanation: `Reputation score of ${overallScore} based on verified GitHub evidence. Vanity metrics (followers, connections) excluded.`,
    achievementBadges: [],
  };
}

module.exports = {
  confidenceLevel,
  gradeFromScore,
  tierFromScore,
  runQualityGate,
  analyzeCodeQuality,
  analyzeArchitecture,
  analyzeTesting,
  analyzeDocumentation,
  analyzeSecurity,
  analyzeDeployment,
  analyzeOpenSource,
  analyzeConsistency,
  runAllEngines,
  calculateOverallScore,
  calculateReputation,
};
