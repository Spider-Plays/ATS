# Tester Setup Guide

**Environment:** Production — https://stitch-ats.in

---

## Supported browsers

Test on the **latest two versions** of:

- Google Chrome (primary)
- Microsoft Edge
- Mozilla Firefox

**Responsive testing:** Verify candidate portal, referral portal, and vendor portal on tablet and mobile viewports (minimum: iPhone SE width and iPad width).

---

## Obtaining test credentials

Production does **not** have dev quick login. Test accounts must be provisioned by a **Super Admin** via Admin → User Management (`/admin/users`).

### Required accounts

Provision one **ACTIVE** account per role:

| Role | Suggested email (if exists) | Login URL |
|------|----------------------------|-----------|
| SUPER_ADMIN | superadmin@stitch-ats.in | /login |
| ADMIN | admin@stitch-ats.in | /login |
| HR_HEAD | hrhead@stitch-ats.in | /login |
| HR_MANAGER | hrmanager@stitch-ats.in | /login |
| RECRUITER | recruiter@stitch-ats.in | /login |
| TEAM_LEAD | teamlead@stitch-ats.in | /login |
| HIRING_MANAGER | hiringmanager@stitch-ats.in | /login |
| INTERVIEWER | interviewer@stitch-ats.in | /login |
| VENDOR | vendor@stitch-ats.in | /login |
| EMPLOYEE | employee@stitch-ats.in | /referral-portal/login |
| CANDIDATE | candidate@stitch-ats.in | /portal/login |

**Password:** Contact your QA lead for credentials. Do not store passwords in bug reports or shared channels.

### Additional setup (Super Admin)

Before testing begins, confirm:

1. At least one HR or recruiter account has **feature tags**: `careers`, `employee_referral`, `mis`
2. At least one **vendor** is linked to an assigned job position
3. Catalog data exists: departments, clients, skills (Admin hub)
4. At least one **LIVE** requirement is visible on the candidate portal (for apply-flow testing)

### Reset database to QA baseline (dev / staging)

To wipe all data and load only what UAT needs (11 primary accounts, catalogs, 3 requirements, 1 vendor):

```bash
npm run db:reset-qa --prefix server
```

**Production:** requires explicit override — `npm run db:reset-qa --prefix server -- --force`

All seeded accounts use password **`password`**. The seed creates:

- One account per role (primary emails from `devUsers.registry.json`)
- Feature tags on Recruiter, HR Head, and HR Manager
- LIVE job `[QA] Senior Software Engineer` (portal + vendor visible)
- PENDING job `[QA] Product Manager` (approval tests)
- DRAFT job `[QA] Draft Data Analyst`
- No pre-seeded candidates (testers create `[QA]` data during runs)

---

## Session behavior

| Behavior | Detail |
|----------|--------|
| **Idle logout** | Automatic logout after **15 minutes** of inactivity |
| **JWT session** | Token valid for ~7 days; cleared on explicit logout or 401 response |
| **Forced password change** | Users with `mustChangePassword` are redirected to `/set-password` before accessing the app |
| **Disabled accounts** | Login returns an error; account status must be ACTIVE |

**Tip:** For long test sessions, interact with the app periodically to avoid idle logout mid-test.

---

## Testing conventions

### Naming test data

Prefix all test artifacts with **`[QA]`** so they can be identified and cleaned up:

- Requirement title: `[QA] Senior Engineer — Smoke Test`
- Candidate name: `[QA] Test Candidate 01`
- Vendor submission: `[QA] Vendor Submit 01`

### Email addresses for new signups

Use unique emails for candidate self-registration:

```
qa-candidate-001@your-test-domain.com
qa-candidate-002@your-test-domain.com
```

### Data hygiene

- Do **not** use real employee PII in test submissions
- Do **not** delete production data unless instructed by Super Admin
- Report orphaned `[QA]` data to the QA lead for cleanup after test cycles

### Multi-role testing

Keep separate browser profiles (or incognito windows) for different roles to avoid session conflicts.

---

## Bug reporting workflow

1. Reproduce the issue and note exact steps
2. Copy the [BUG_REPORT_TEMPLATE.md](./BUG_REPORT_TEMPLATE.md)
3. Fill in all fields — especially **portal URL**, **role used**, and **severity**
4. Attach screenshots or screen recordings
5. Submit to your QA lead via the agreed channel (Jira, GitHub Issues, email, etc.)
6. Reference the **Test Case ID** or **Scenario ID** if applicable

### Severity guide (summary)

| Severity | Definition |
|----------|------------|
| **Blocker** | Cannot proceed; core workflow broken; no workaround |
| **Major** | Important feature broken; workaround exists but painful |
| **Minor** | Non-critical issue; cosmetic or edge-case |
| **Cosmetic** | Visual polish only; no functional impact |

Full definitions are in [TEST_PLAN.md](./TEST_PLAN.md#13-defect-management).

---

## Known limitations on production

| Limitation | Impact on testing |
|------------|-------------------|
| No dev quick login | Must use real credentials for every role |
| Email-dependent flows | Forgot password, offer letter email delivery depends on Resend/M365 configuration — verify with QA lead what can be tested |
| Admin user management UI | Admin role can open User Management UI; most edit/delete user APIs are Super Admin-only — document if behavior differs from expectation |
| Production data | Exercise caution; use `[QA]` prefixes; avoid destructive actions on non-test data |
| Render API cold start | First API request after idle may be slow (~30s) — retry once before filing a Blocker |

---

## Health check

Before a test session, verify the app is reachable:

1. Open https://stitch-ats.in — login page loads
2. Optional: https://stitch-ats.onrender.com/api/health — returns OK with database connected

---

## Related documents

- [ROLES_AND_ACCESS.md](./ROLES_AND_ACCESS.md) — what each role can do
- [TEST_PLAN.md](./TEST_PLAN.md) — full test strategy and schedule
- [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md) — quick post-deploy checks
