-- Replace legacy SOURCED/APPLIED with ADDED/SUBMITTED pipeline statuses.
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);

UPDATE "Candidate"
SET status = 'SUBMITTED',
    "submittedAt" = COALESCE("submittedAt", "updatedAt", "appliedDate", NOW())
WHERE status IN ('SOURCED', 'APPLIED')
  AND "requirementId" IS NOT NULL;

UPDATE "Candidate"
SET status = 'ADDED'
WHERE status IN ('SOURCED', 'APPLIED')
  AND "requirementId" IS NULL;
