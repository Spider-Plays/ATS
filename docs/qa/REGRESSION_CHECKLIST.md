# Regression Checklist

Quick smoke and regression checklists for **Stitch ATS** production. Run after each deploy or before sign-off.

**Time estimate:** ~15 minutes per portal section.

**Instructions:** Mark Pass / Fail for each item. Log failures using [BUG_REPORT_TEMPLATE.md](./BUG_REPORT_TEMPLATE.md).

---

## Staff workspace smoke

**Role:** Recruiter or HR Head

| # | Check | Pass | Fail |
|---|-------|:----:|:----:|
| 1 | `/login` loads without error | ☐ | ☐ |
| 2 | Login succeeds → dashboard loads | ☐ | ☐ |
| 3 | Sidebar shows expected pages for role | ☐ | ☐ |
| 4 | Dashboard metrics/widgets render | ☐ | ☐ |
| 5 | `/requirements` list loads with filters | ☐ | ☐ |
| 6 | Open a requirement detail page | ☐ | ☐ |
| 7 | `/candidates` list loads | ☐ | ☐ |
| 8 | Open a candidate profile | ☐ | ☐ |
| 9 | `/pipeline` Kanban loads with columns | ☐ | ☐ |
| 10 | Drag one candidate card (or verify drag UI) | ☐ | ☐ |
| 11 | `/interviews` list loads | ☐ | ☐ |
| 12 | Global search returns results | ☐ | ☐ |
| 13 | `/notifications` page loads | ☐ | ☐ |
| 14 | `/settings` — profile section loads | ☐ | ☐ |
| 15 | Logout works | ☐ | ☐ |

---

## Admin hub smoke

**Role:** Admin or Super Admin

| # | Check | Pass | Fail |
|---|-------|:----:|:----:|
| 1 | `/admin` overview loads | ☐ | ☐ |
| 2 | `/admin/departments` list loads | ☐ | ☐ |
| 3 | `/admin/clients` list loads | ☐ | ☐ |
| 4 | `/admin/skills` list loads | ☐ | ☐ |
| 5 | `/admin/users` list loads | ☐ | ☐ |
| 6 | `/admin/interview-panels` loads | ☐ | ☐ |
| 7 | Super Admin: `/admin/role-access` loads | ☐ | ☐ |

---

## Candidate portal smoke

**Role:** Candidate

| # | Check | Pass | Fail |
|---|-------|:----:|:----:|
| 1 | `/portal/login` loads | ☐ | ☐ |
| 2 | Login succeeds → dashboard or onboarding | ☐ | ☐ |
| 3 | Complete onboarding if redirected | ☐ | ☐ |
| 4 | `/portal/jobs` list loads | ☐ | ☐ |
| 5 | Open a job detail page | ☐ | ☐ |
| 6 | Apply button visible on LIVE job | ☐ | ☐ |
| 7 | `/portal/applied` shows applications | ☐ | ☐ |
| 8 | Sidebar navigation works (Home, Jobs) | ☐ | ☐ |
| 9 | Logout works | ☐ | ☐ |

---

## Vendor portal smoke

**Role:** Vendor

| # | Check | Pass | Fail |
|---|-------|:----:|:----:|
| 1 | Login at `/login` → vendor dashboard | ☐ | ☐ |
| 2 | Dashboard stats section loads | ☐ | ☐ |
| 3 | `/vendor-portal/positions` list loads | ☐ | ☐ |
| 4 | Open a position detail | ☐ | ☐ |
| 5 | Submit candidate form opens | ☐ | ☐ |
| 6 | Submissions accessible from dashboard | ☐ | ☐ |
| 7 | Logout works | ☐ | ☐ |

---

## Referral portal smoke

**Role:** Employee

| # | Check | Pass | Fail |
|---|-------|:----:|:----:|
| 1 | `/referral-portal/login` loads | ☐ | ☐ |
| 2 | Login → dashboard loads | ☐ | ☐ |
| 3 | Referral code/stats visible | ☐ | ☐ |
| 4 | `/referral-portal/jobs` list loads | ☐ | ☐ |
| 5 | Open job detail | ☐ | ☐ |
| 6 | Submit referral form opens | ☐ | ☐ |
| 7 | `/referral-portal/referrals` list loads | ☐ | ☐ |
| 8 | `/referral-portal/program` loads | ☐ | ☐ |
| 9 | Logout works | ☐ | ☐ |

---

## Cross-cutting regression

**Any role**

| # | Check | Pass | Fail |
|---|-------|:----:|:----:|
| 1 | Theme toggle (light/dark) works | ☐ | ☐ |
| 2 | Settings save (e.g. display name) persists | ☐ | ☐ |
| 3 | Invalid URL shows 404 page | ☐ | ☐ |
| 4 | Candidate portal usable at mobile width (375px) | ☐ | ☐ |
| 5 | Staff dashboard usable at tablet width (768px) | ☐ | ☐ |
| 6 | API health: `/api/health` returns OK (optional) | ☐ | ☐ |

---

## P1 critical path mini-regression

Run after bug fixes to core flows. **~30 minutes.**

| # | Flow | Role | Pass | Fail |
|---|------|------|:----:|:----:|
| 1 | Create requirement → submit → approve | HM, HR Head | ☐ | ☐ |
| 2 | Add candidate → visible on pipeline | Recruiter | ☐ | ☐ |
| 3 | Move candidate one pipeline stage | Recruiter | ☐ | ☐ |
| 4 | Schedule interview | Recruiter | ☐ | ☐ |
| 5 | Submit feedback | Interviewer | ☐ | ☐ |
| 6 | Create offer → submit → HR approve | Recruiter, HR Head | ☐ | ☐ |
| 7 | Candidate apply on portal | Candidate | ☐ | ☐ |
| 8 | Vendor submit on position | Vendor | ☐ | ☐ |

---

## Sign-off section

| Field | Value |
|-------|-------|
| **Tester name** | |
| **Date** | |
| **Build / deploy date** | |
| **Environment** | Production — stitch-ats.in |
| **Total checks passed** | / |
| **Blockers open** | Yes / No |
| **Recommendation** | Pass / Fail / Pass with conditions |

---

## Related documents

- [TEST_PLAN.md](./TEST_PLAN.md) — exit criteria
- [TEST_CASES.md](./TEST_CASES.md) — detailed cases if smoke item fails
