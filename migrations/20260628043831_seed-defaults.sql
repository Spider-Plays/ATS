-- Default role page access (matches server/src/lib/pageAccess.ts)

INSERT INTO "RolePageAccess" (role, pages, "updatedAt") VALUES
  ('ADMIN', '["dashboard","requirements","vendors","candidates","pipeline","interviews","offers","notifications","settings"]', NOW()),
  ('HR_HEAD', '["dashboard","requirements","vendors","candidates","pipeline","interviews","offers","notifications","settings"]', NOW()),
  ('HR_MANAGER', '["dashboard","requirements","vendors","candidates","pipeline","interviews","offers","notifications","settings"]', NOW()),
  ('RECRUITER', '["dashboard","requirements","vendors","candidates","pipeline","interviews","offers","notifications","settings"]', NOW()),
  ('TEAM_LEAD', '["dashboard","requirements","vendors","candidates","pipeline","interviews","offers","notifications","settings"]', NOW()),
  ('HIRING_MANAGER', '["dashboard","requirements","notifications","settings"]', NOW()),
  ('INTERVIEWER', '["dashboard","interviews","notifications","settings"]', NOW())
ON CONFLICT (role) DO NOTHING;

-- Default skill catalog seeds (categories match server/src/config/defaultSkills.ts)
INSERT INTO "SkillCatalog" (id, name, category, "createdAt") VALUES
  (gen_random_uuid()::text, 'JavaScript', 'Languages', NOW()),
  (gen_random_uuid()::text, 'TypeScript', 'Languages', NOW()),
  (gen_random_uuid()::text, 'Python', 'Languages', NOW()),
  (gen_random_uuid()::text, 'SQL', 'Languages', NOW()),
  (gen_random_uuid()::text, 'React', 'Frontend', NOW()),
  (gen_random_uuid()::text, 'Node.js', 'Backend', NOW()),
  (gen_random_uuid()::text, 'AWS', 'Cloud & DevOps', NOW()),
  (gen_random_uuid()::text, 'Communication', 'Soft Skills', NOW())
ON CONFLICT (name) DO NOTHING;

-- Default department catalog
INSERT INTO "DepartmentCatalog" (id, name, "createdAt") VALUES
  (gen_random_uuid()::text, 'Engineering', NOW()),
  (gen_random_uuid()::text, 'Product', NOW()),
  (gen_random_uuid()::text, 'Design', NOW()),
  (gen_random_uuid()::text, 'Sales', NOW()),
  (gen_random_uuid()::text, 'Marketing', NOW()),
  (gen_random_uuid()::text, 'Human Resources', NOW()),
  (gen_random_uuid()::text, 'Finance', NOW()),
  (gen_random_uuid()::text, 'Operations', NOW())
ON CONFLICT (name) DO NOTHING;
