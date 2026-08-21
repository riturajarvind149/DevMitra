/**
 * DevMitra Scoring Methodology Ground Truth Helper
 *
 * Reads directly from dimensionEngines.js rules and constants
 * to provide 100% verified, unhallucinated scoring rules.
 */

function getScoringMethodology() {
  return `
[DEVMITRA SCORING & WEIGHTING METHODOLOGY GROUND TRUTH]

### 1. Overall Score Formula (Weighted Sum across 8 Dimensions)
The overall engineering score (0–100) is calculated as the weighted average of all scored dimensions:
Overall Score = (Code Quality × 0.20) + (Architecture × 0.18) + (Testing × 0.15) + (Documentation × 0.10) + (Security × 0.10) + (Deployment & DevOps × 0.10) + (Open Source × 0.10) + (Consistency × 0.07)

Exact Dimension Weights:
- Code Quality (\`codeQuality\`): 20% (0.20)
- Architecture (\`architecture\`): 18% (0.18)
- Testing (\`testing\`): 15% (0.15)
- Documentation (\`documentation\`): 10% (0.10)
- Security (\`security\`): 10% (0.10)
- Deployment & DevOps (\`deployment\`): 10% (0.10)
- Open Source & Community (\`openSource\`): 10% (0.10)
- Consistency (\`consistency\`): 7% (0.07)
*Total Weight = 100% (1.00)*

### 2. Quality Gate Requirements
Before any reputation score is calculated, the profile MUST pass the Quality Gate:
1. Evidence Collection: At least 1 public repository collected (Required).
2. Evidence Validation: 0 schema validation errors (Required).
3. GitHub Public Activity: At least 1 public repo or >0 yearly contributions (Required).
4. Confidence Score: Recommended >= 20% (Non-blocking).
If any required check fails, the score is set to null (INSUFFICIENT_EVIDENCE) and no reputation score is rendered.

### 3. Repository Letter Grades
Repositories are graded based on individual dimension scores:
- A+: 93–100 (Production-Ready)
- A:  85–92  (High Quality)
- B+: 78–84  (Good Standards)
- B:  70–77  (Development-Ready)
- C:  55–69  (Prototype / Early Stage)
- D:  40–54  (Unstructured / Missing Fundamentals)
- F:  < 40   (Severely Lacking)

### 4. Professional Engineering Tiers
Engineering tiers are calculated from the Overall Score, Public Repo Count, and Commit Streak:
- PRINCIPAL TIER: Score >= 88 AND >= 20 public repositories
- EXPERT TIER: Score >= 78 AND >= 12 public repositories
- ADVANCED TIER: Score >= 65 AND >= 6 public repositories
- INTERMEDIATE TIER: Score >= 45 AND >= 2 public repositories
- BEGINNER TIER: Score < 45 with >= 1 repository or active commit streak
- NO_TIER: 0 repositories or failed Quality Gate

### 5. Confidence Levels
- HIGH: Confidence >= 80%
- MEDIUM: Confidence >= 55%
- LOW: Confidence >= 30%
- INSUFFICIENT: Confidence < 30%
`;
}

module.exports = {
  getScoringMethodology,
};
