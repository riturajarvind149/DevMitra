CREATE TABLE IF NOT EXISTS "BugComment" (
    "id" TEXT NOT NULL,
    "bugReportId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BugComment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "BugComment_bugReportId_idx" ON "BugComment"("bugReportId");
CREATE INDEX IF NOT EXISTS "BugComment_authorId_idx" ON "BugComment"("authorId");
