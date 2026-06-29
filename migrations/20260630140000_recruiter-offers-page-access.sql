-- Grant recruiters the Offers page when seeded without it.
UPDATE "RolePageAccess"
SET
  pages = '["dashboard","requirements","vendors","candidates","pipeline","interviews","offers","notifications","settings"]',
  "updatedAt" = NOW()
WHERE role = 'RECRUITER'
  AND NOT (pages::jsonb @> '["offers"]'::jsonb);
