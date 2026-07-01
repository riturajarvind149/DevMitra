-- AddPartialUniqueIndex: prevents duplicate null-PR contributor ratings at DB level
-- PostgreSQL allows multiple NULLs in a unique index; a partial index constrains only the non-null case.
CREATE UNIQUE INDEX IF NOT EXISTS "ContributorRating_null_pr_dedup"
  ON "ContributorRating" ("giverId", "receiverId", "projectId")
  WHERE "pullRequestId" IS NULL;
