-- App settings table for org-wide offer configuration
CREATE TABLE IF NOT EXISTS "AppSetting" (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  "updatedBy" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Finance Head default page access
INSERT INTO "RolePageAccess" (role, pages, "updatedAt") VALUES
  ('FINANCE_HEAD', '["dashboard","offer_compensation_config","notifications","settings"]', NOW())
ON CONFLICT (role) DO NOTHING;

-- Add offer settings pages to Admin
UPDATE "RolePageAccess"
SET pages = '["dashboard","requirements","vendors","candidates","pipeline","interviews","offers","offer_compensation_config","offer_letter_template","notifications","settings"]',
    "updatedAt" = NOW()
WHERE role = 'ADMIN';

-- Add offer letter template page to HR Head
UPDATE "RolePageAccess"
SET pages = '["dashboard","requirements","vendors","candidates","pipeline","interviews","offers","offer_letter_template","notifications","settings"]',
    "updatedAt" = NOW()
WHERE role = 'HR_HEAD';
