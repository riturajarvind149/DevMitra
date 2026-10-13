-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "openRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "visibility" TEXT NOT NULL DEFAULT 'PUBLIC';
