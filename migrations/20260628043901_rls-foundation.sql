-- RLS foundation: authenticated users may access ATS data.
-- Express/Prisma uses the project connection string (bypasses RLS).
-- Tighten policies per-role when migrating frontend to direct SDK access.

DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'User', 'LoginHistory', 'Vendor', 'VendorRequirement', 'Requirement',
    'Candidate', 'InterviewPlan', 'InterviewPlanStage', 'Interview',
    'Feedback', 'Offer', 'SkillCatalog', 'DepartmentCatalog', 'ClientCatalog',
    'InterviewPanelLevel', 'ActivityLog', 'RolePageAccess'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format(
      'CREATE POLICY "authenticated_all" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;
