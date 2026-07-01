CREATE TABLE IF NOT EXISTS "OppComment" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "applicationId" TEXT,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OppComment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "OppComment_opportunityId_idx" ON "OppComment"("opportunityId");
CREATE INDEX IF NOT EXISTS "OppComment_applicationId_idx" ON "OppComment"("applicationId");
