-- AlterTable
ALTER TABLE "User" ADD COLUMN     "contributorTier" TEXT NOT NULL DEFAULT 'TESTER',
ADD COLUMN     "hourlyRate" DOUBLE PRECISION,
ADD COLUMN     "isPaidContributor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "openForPaidWork" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pricePerBug" DOUBLE PRECISION,
ADD COLUMN     "pricePerFeature" DOUBLE PRECISION,
ADD COLUMN     "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "UserStreak" ADD COLUMN     "lastActiveMonth" TEXT,
ADD COLUMN     "lastActiveWeek" TEXT,
ADD COLUMN     "monthlyStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weeklyStreak" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "BugReport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'BUG',
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "projectId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "assignedTo" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BugReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PullRequest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "branchName" TEXT,
    "prUrl" TEXT,
    "type" TEXT NOT NULL DEFAULT 'FEATURE',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "agreedPrice" DOUBLE PRECISION,
    "projectId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "bugReportId" TEXT,
    "mergedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PullRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributorRating" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "giverId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "pullRequestId" TEXT,
    "codeQuality" INTEGER NOT NULL,
    "communication" INTEGER NOT NULL,
    "timeliness" INTEGER NOT NULL,
    "overall" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContributorRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectRating" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ui" INTEGER NOT NULL,
    "performance" INTEGER NOT NULL,
    "codeQuality" INTEGER NOT NULL,
    "overall" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectResource" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'OTHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectResource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BugReport_projectId_idx" ON "BugReport"("projectId");

-- CreateIndex
CREATE INDEX "BugReport_reporterId_idx" ON "BugReport"("reporterId");

-- CreateIndex
CREATE INDEX "BugReport_status_idx" ON "BugReport"("status");

-- CreateIndex
CREATE INDEX "PullRequest_projectId_idx" ON "PullRequest"("projectId");

-- CreateIndex
CREATE INDEX "PullRequest_authorId_idx" ON "PullRequest"("authorId");

-- CreateIndex
CREATE INDEX "PullRequest_status_idx" ON "PullRequest"("status");

-- CreateIndex
CREATE INDEX "ContributorRating_receiverId_idx" ON "ContributorRating"("receiverId");

-- CreateIndex
CREATE INDEX "ContributorRating_projectId_idx" ON "ContributorRating"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ContributorRating_pullRequestId_giverId_key" ON "ContributorRating"("pullRequestId", "giverId");

-- CreateIndex
CREATE INDEX "ProjectRating_projectId_idx" ON "ProjectRating"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRating_projectId_userId_key" ON "ProjectRating"("projectId", "userId");

-- CreateIndex
CREATE INDEX "ProjectResource_projectId_idx" ON "ProjectResource"("projectId");

-- AddForeignKey
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullRequest" ADD CONSTRAINT "PullRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullRequest" ADD CONSTRAINT "PullRequest_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullRequest" ADD CONSTRAINT "PullRequest_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullRequest" ADD CONSTRAINT "PullRequest_bugReportId_fkey" FOREIGN KEY ("bugReportId") REFERENCES "BugReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributorRating" ADD CONSTRAINT "ContributorRating_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributorRating" ADD CONSTRAINT "ContributorRating_giverId_fkey" FOREIGN KEY ("giverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributorRating" ADD CONSTRAINT "ContributorRating_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributorRating" ADD CONSTRAINT "ContributorRating_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRating" ADD CONSTRAINT "ProjectRating_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRating" ADD CONSTRAINT "ProjectRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectResource" ADD CONSTRAINT "ProjectResource_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectResource" ADD CONSTRAINT "ProjectResource_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
