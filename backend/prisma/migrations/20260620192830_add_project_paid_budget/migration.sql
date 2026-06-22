-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "budget" TEXT,
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false;
