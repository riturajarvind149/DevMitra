-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "githubAccessToken" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "GithubAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "githubUsername" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "jobId" TEXT,
    "errorMessage" TEXT,
    "evidenceRaw" JSONB,
    "evidenceVersion" TEXT NOT NULL DEFAULT 'v1',
    "overallScore" INTEGER,
    "overallConfidence" INTEGER,
    "tier" TEXT,
    "reputationScore" INTEGER,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "GithubAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "DimensionResult" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "score" INTEGER,
    "confidence" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidenceSources" TEXT[],
    "strengths" TEXT[],
    "weaknesses" TEXT[],

    CONSTRAINT "DimensionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "MentorPlan" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "currentTier" TEXT NOT NULL,
    "targetTier" TEXT NOT NULL,
    "estimatedTimeline" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SkillGap" (
    "id" TEXT NOT NULL,
    "mentorPlanId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "currentLevel" INTEGER NOT NULL,
    "requiredLevel" INTEGER NOT NULL,
    "priority" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,

    CONSTRAINT "SkillGap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "MentorTask" (
    "id" TEXT NOT NULL,
    "mentorPlanId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "impactDescription" TEXT NOT NULL,
    "estimatedHours" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MentorTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReputationSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "overallScore" INTEGER,
    "reputationScore" INTEGER NOT NULL,
    "dimensionScores" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReputationSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX IF NOT EXISTS "GithubAnalysis_userId_idx" ON "GithubAnalysis"("userId");
CREATE INDEX IF NOT EXISTS "GithubAnalysis_githubUsername_idx" ON "GithubAnalysis"("githubUsername");
CREATE INDEX IF NOT EXISTS "GithubAnalysis_status_idx" ON "GithubAnalysis"("status");

CREATE INDEX IF NOT EXISTS "DimensionResult_analysisId_idx" ON "DimensionResult"("analysisId");

CREATE UNIQUE INDEX IF NOT EXISTS "MentorPlan_analysisId_key" ON "MentorPlan"("analysisId");

CREATE INDEX IF NOT EXISTS "ReputationSnapshot_userId_createdAt_idx" ON "ReputationSnapshot"("userId", "createdAt");

-- AddForeignKeys
ALTER TABLE "GithubAnalysis" ADD CONSTRAINT "GithubAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DimensionResult" ADD CONSTRAINT "DimensionResult_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "GithubAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MentorPlan" ADD CONSTRAINT "MentorPlan_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "GithubAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SkillGap" ADD CONSTRAINT "SkillGap_mentorPlanId_fkey" FOREIGN KEY ("mentorPlanId") REFERENCES "MentorPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MentorTask" ADD CONSTRAINT "MentorTask_mentorPlanId_fkey" FOREIGN KEY ("mentorPlanId") REFERENCES "MentorPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReputationSnapshot" ADD CONSTRAINT "ReputationSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
