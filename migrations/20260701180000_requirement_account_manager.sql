ALTER TABLE "Requirement" ADD COLUMN IF NOT EXISTS "accountManager" TEXT;

UPDATE "Requirement" r
SET "accountManager" = b."accountManager"
FROM "BusinessRequirement" b
WHERE b."publishedRequirementId" = r.id
  AND b."accountManager" IS NOT NULL
  AND r."accountManager" IS NULL;

UPDATE "RolePageAccess"
SET
  pages = (
    SELECT jsonb_agg(DISTINCT elem)::text
    FROM (
      SELECT jsonb_array_elements_text(pages::jsonb) AS elem
      UNION ALL
      SELECT 'requirements'
    ) sub
  ),
  "updatedAt" = NOW()
WHERE role = 'ACCOUNT_MANAGER'
  AND NOT (pages::jsonb @> '["requirements"]'::jsonb);
