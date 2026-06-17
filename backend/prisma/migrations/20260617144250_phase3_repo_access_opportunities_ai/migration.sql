-- AlterTable
ALTER TABLE "User" ADD COLUMN     "availabilityHours" INTEGER,
ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "portfolioUrl" TEXT;

-- CreateTable
CREATE TABLE "RepositoryAccessRequest" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "requestedRole" TEXT NOT NULL,
    "githubProfile" TEXT NOT NULL,
    "experienceDescription" TEXT NOT NULL,
    "availabilityHours" INTEGER NOT NULL,
    "portfolioUrl" TEXT,
    "additionalMessage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepositoryAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "duration" TEXT,
    "budget" TEXT,
    "isRemote" BOOLEAN NOT NULL DEFAULT true,
    "projectId" TEXT,
    "ownerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityApplication" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "githubUrl" TEXT,
    "portfolioUrl" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAIProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "techStackExp" JSONB,
    "preferRemote" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAIProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RepositoryAccessRequest_projectId_idx" ON "RepositoryAccessRequest"("projectId");

-- CreateIndex
CREATE INDEX "RepositoryAccessRequest_requesterId_idx" ON "RepositoryAccessRequest"("requesterId");

-- CreateIndex
CREATE INDEX "RepositoryAccessRequest_status_idx" ON "RepositoryAccessRequest"("status");

-- CreateIndex
CREATE INDEX "Opportunity_ownerId_idx" ON "Opportunity"("ownerId");

-- CreateIndex
CREATE INDEX "Opportunity_status_idx" ON "Opportunity"("status");

-- CreateIndex
CREATE INDEX "OpportunityApplication_opportunityId_idx" ON "OpportunityApplication"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityApplication_opportunityId_applicantId_key" ON "OpportunityApplication"("opportunityId", "applicantId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAIProfile_userId_key" ON "UserAIProfile"("userId");

-- AddForeignKey
ALTER TABLE "RepositoryAccessRequest" ADD CONSTRAINT "RepositoryAccessRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoryAccessRequest" ADD CONSTRAINT "RepositoryAccessRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoryAccessRequest" ADD CONSTRAINT "RepositoryAccessRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityApplication" ADD CONSTRAINT "OpportunityApplication_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityApplication" ADD CONSTRAINT "OpportunityApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAIProfile" ADD CONSTRAINT "UserAIProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
