CREATE TABLE "BusinessRequirement" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "client" TEXT,
  "department" TEXT NOT NULL,
  "accountManager" TEXT NOT NULL,
  "hiringManager" TEXT NOT NULL,
  "businessStage" TEXT NOT NULL DEFAULT 'INITIAL_DISCUSSION',
  "stagePercentage" INTEGER NOT NULL DEFAULT 10,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "publishedRequirementId" TEXT,
  "stageHistory" TEXT NOT NULL DEFAULT '[]',
  "openings" INTEGER NOT NULL,
  "priority" TEXT,
  "location" TEXT,
  "locationCity" TEXT,
  "isRemote" BOOLEAN NOT NULL DEFAULT false,
  "workMode" TEXT,
  "employmentType" TEXT,
  "seniorityLevel" TEXT,
  "experienceMinYears" INTEGER,
  "experienceMaxYears" INTEGER,
  "salaryBand" TEXT,
  "targetStartDate" TIMESTAMP(3),
  "hiringDeadline" TIMESTAMP(3),
  "description" TEXT,
  "jobDescription" TEXT,
  "primarySkills" TEXT NOT NULL DEFAULT '[]',
  "secondarySkills" TEXT NOT NULL DEFAULT '[]',
  "createdBy" TEXT,
  "createdByRole" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BusinessRequirement_pkey" PRIMARY KEY ("id")
);

INSERT INTO "RolePageAccess" (role, pages, "updatedAt")
VALUES (
  'ACCOUNT_MANAGER',
  '["dashboard","business_requirements","notifications","settings"]',
  NOW()
)
ON CONFLICT (role) DO NOTHING;

UPDATE "RolePageAccess"
SET
  pages = (
    SELECT jsonb_agg(DISTINCT elem)::text
    FROM (
      SELECT jsonb_array_elements_text(pages::jsonb) AS elem
      UNION ALL
      SELECT 'business_requirements'
    ) sub
  ),
  "updatedAt" = NOW()
WHERE role = 'HIRING_MANAGER'
  AND NOT (pages::jsonb @> '["business_requirements"]'::jsonb);
