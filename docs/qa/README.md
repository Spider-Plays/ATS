# Stitch ATS — QA Documentation

**Document version:** 1.0  
**Last updated:** June 2026  
**Environment:** Production — https://stitch-ats.in  
**QA staging:** https://qa.stitch-ats.in — see [STAGING_ENVIRONMENT.md](./STAGING_ENVIRONMENT.md)

---

## Product overview

**Stitch ATS** is a multi-portal Applicant Tracking System for end-to-end hiring. It supports five distinct surfaces:

1. **Staff workspace** — recruiters, HR, hiring managers, interviewers
2. **Admin hub** — user management, catalogs, role access configuration
3. **Candidate portal** — job search, applications, offer responses
4. **Vendor portal** — staffing vendors submit candidates on assigned positions
5. **Employee referral portal** — employees refer candidates for open roles

---

## Production URLs

| Surface | Login URL | Default landing (after login) |
|---------|-----------|-------------------------------|
| Staff workspace | https://stitch-ats.in/login | `/dashboard` (role-dependent) |
| Admin hub | https://stitch-ats.in/admin | Admin overview |
| Candidate portal | https://stitch-ats.in/portal/login | `/portal/dashboard` |
| Vendor portal | https://stitch-ats.in/login (VENDOR role) | `/vendor-portal/dashboard` |
| Referral portal | https://stitch-ats.in/referral-portal/login | `/referral-portal/dashboard` |
| Candidate signup | https://stitch-ats.in/portal/signup | — |
| Password reset | https://stitch-ats.in/login → Forgot password | — |

**API (health check):** https://stitch-ats.onrender.com/api/health

---

## Pipeline stages

Candidates move through these stages on the hiring pipeline:

```
SOURCED → APPLIED → SCREENING → SHORTLISTED → INTERVIEW → OFFER → HIRED → JOINED
```

Rejected candidates are marked **REJECTED** at any stage.

After a candidate reaches **HIRED**, only HR leadership roles (HR Head, HR Manager, Admin, Super Admin) can change their pipeline stage.

---

## Documentation index

Read the documents in this order:

| # | Document | Purpose |
|---|----------|---------|
| 1 | [MIND_MAP.md](./MIND_MAP.md) | Visual map of the entire application |
| 2 | [APPLICATION_FLOW.md](./APPLICATION_FLOW.md) | Step-by-step workflows with diagrams |
| 3 | [ROLES_AND_ACCESS.md](./ROLES_AND_ACCESS.md) | Who can do what — roles and permissions |
| 4 | [TESTER_SETUP.md](./TESTER_SETUP.md) | How to access production, conventions, bug workflow |
| 5 | [TEST_PLAN.md](./TEST_PLAN.md) | Formal test plan — scope, strategy, schedule |
| 6 | [TEST_SCENARIOS.md](./TEST_SCENARIOS.md) | High-level test scenarios by module |
| 7 | [TEST_CASES.md](./TEST_CASES.md) | Detailed step-by-step test cases |
| 8 | [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md) | Quick smoke/regression checklists |
| 9 | [BUG_REPORT_TEMPLATE.md](./BUG_REPORT_TEMPLATE.md) | How to log defects |

---

## Before you start testing

A **Super Admin** must provision test accounts before handoff. See [TESTER_SETUP.md](./TESTER_SETUP.md) for details.

**Do not** put production passwords in these documents. Credentials are shared separately by the QA lead.

---

## Quick reference — 12 roles

| Role | Portal |
|------|--------|
| SUPER_ADMIN, ADMIN, HR_HEAD, HR_MANAGER, RECRUITER, TEAM_LEAD, HIRING_MANAGER, INTERVIEWER | Staff workspace |
| CANDIDATE | Candidate portal |
| VENDOR | Vendor portal |
| EMPLOYEE | Referral portal (staff roles can also use referral portal) |

---

## Document relationships

```
MIND_MAP → APPLICATION_FLOW → TEST_SCENARIOS → TEST_CASES → REGRESSION_CHECKLIST
                ↑                    ↑
         ROLES_AND_ACCESS      TEST_PLAN
                ↑
          TESTER_SETUP → BUG_REPORT_TEMPLATE
```
