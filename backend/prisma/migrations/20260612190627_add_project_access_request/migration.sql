-- CreateTable
CREATE TABLE "ProjectAccessRequest" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "suggestion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "projectId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectAccessRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProjectAccessRequest" ADD CONSTRAINT "ProjectAccessRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAccessRequest" ADD CONSTRAINT "ProjectAccessRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
