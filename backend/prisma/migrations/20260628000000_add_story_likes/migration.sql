CREATE TABLE IF NOT EXISTS "StoryLike" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoryLike_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "StoryLike_storyId_userId_key" ON "StoryLike"("storyId", "userId");
CREATE INDEX IF NOT EXISTS "StoryLike_storyId_idx" ON "StoryLike"("storyId");
