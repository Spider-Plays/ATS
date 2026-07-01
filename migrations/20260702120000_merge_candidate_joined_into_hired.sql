-- Candidate pipeline had duplicate terminal stages HIRED and JOINED; consolidate to HIRED.
UPDATE "Candidate"
SET status = 'HIRED', "updatedAt" = NOW()
WHERE status = 'JOINED';
