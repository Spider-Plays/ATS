# Roles and Access Matrix

Permission reference for **Stitch ATS** production testing. Twelve roles across five portals.

---

## Role summary

| Role | Login URL | Default landing | Portal |
|------|-----------|-----------------|--------|
| SUPER_ADMIN | /login | /dashboard or /admin | Staff + Admin |
| ADMIN | /login | /dashboard | Staff + Admin |
| HR_HEAD | /login | /dashboard | Staff |
| HR_MANAGER | /login | /dashboard | Staff |
| RECRUITER | /login | /dashboard | Staff |
| TEAM_LEAD | /login | /dashboard | Staff |
| HIRING_MANAGER | /login | /dashboard | Staff |
| INTERVIEWER | /login | /dashboard | Staff |
| CANDIDATE | /portal/login | /portal/dashboard | Candidate |
| VENDOR | /login | /vendor-portal/dashboard | Vendor |
| EMPLOYEE | /referral-portal/login | /referral-portal/dashboard | Referral |

**Cross-portal rules:**
- CANDIDATE and EMPLOYEE are **blocked** from `/login` with redirect message
- VENDOR uses `/login` but lands on vendor portal
- Any role except CANDIDATE and VENDOR can use the **referral portal**

---

## Staff page access (default)

Sidebar pages controlled by `allowedPages`. Super Admin always sees all pages. Configurable by Super Admin at `/admin/role-access`.

| Page | SUPER_ADMIN | ADMIN | HR_HEAD | HR_MANAGER | RECRUITER | TEAM_LEAD | HIRING_MANAGER | INTERVIEWER |
|------|:-----------:|:-----:|:-------:|:----------:|:---------:|:---------:|:--------------:|:-----------:|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Requirements | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Vendors | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| Candidates | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| Pipeline | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| Interviews | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Offers | ✓ | ✓ | ✓ | ✓ | — | ✓ | — | — |
| User Mgmt | ✓ | — | — | — | — | — | — | — |
| Notifications | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Settings | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Admin hub** (`/admin`): Admin and Super Admin only (separate from sidebar page keys).

---

## Capability matrix

| Capability | SUPER_ADMIN | ADMIN | HR_HEAD | HR_MANAGER | RECRUITER | TEAM_LEAD | HIRING_MANAGER | INTERVIEWER |
|------------|:-----------:|:-----:|:-------:|:----------:|:---------:|:---------:|:--------------:|:-----------:|
| Create requirement | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | — |
| Approve requirement | ✓ | ✓* | ✓ | — | — | — | — | — |
| Edit requirement (any) | ✓ | ✓ | ✓ | ✓ | scoped | scoped | own only | — |
| Posting controls | ✓ | ✓ | ✓ | ✓ | — | ✓ | own only | — |
| Portal visibility toggle | ✓ | ✓ | ✓ | ✓ | — | ✓ | — | — |
| Assign recruiter | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| Create candidate | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| Change pipeline stage | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| Change stage after HIRED | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| Schedule interview | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Submit interview feedback | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | assigned only |
| Create offer | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| HR approve offer | ✓ | ✓ | ✓ | — | — | — | — | — |
| Exec approve offer | ✓ | ✓ | — | — | — | — | — | — |
| Send offer | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| Manage vendors | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| Admin hub catalogs | ✓ | ✓ | — | — | — | — | — | — |
| User management (full) | ✓ | partial** | — | — | — | — | — | — |
| Role access editor | ✓ | — | — | — | — | — | — | — |
| View compensation (offers) | ✓ | ✓ | ✓ | ✓ | limited | — | — | — |

\* Admin approves requirements **on behalf of HR Head** (delegation semantics).  
\** Admin can open User Management UI and create users; most edit/delete APIs are Super Admin-only.

---

## External portal capabilities

| Capability | CANDIDATE | VENDOR | EMPLOYEE |
|------------|:---------:|:------:|:--------:|
| Browse open jobs | ✓ (portal) | assigned only | referrable only |
| Apply / submit | ✓ | submit candidate | submit referral |
| Track status | ✓ | submissions list | my referrals |
| View/respond to offer | ✓ | — | — |
| Onboarding profile | ✓ | — | — |

---

## Data scoping rules

| Scope | Roles | What they see |
|-------|-------|---------------|
| **Org-wide** | Super Admin, Admin, HR Head, HR Manager | All requirements, candidates, vendors, interviews, offers |
| **Assigned requirements** | Recruiter, Team Lead | Requirements they created or are assigned to; candidates linked to those reqs |
| **Owned requirements** | Hiring Manager | Requirements they created or are named hiring manager on |
| **Assigned interviews** | Interviewer | Only interviews where they are assigned; related candidates (overview + resume tabs only) |
| **Vendor scope** | Vendor | Only positions assigned to their vendor org |
| **Own data** | Candidate | Own applications and offers only |
| **Own referrals** | Employee | Referrals they submitted |

---

## Feature tags

Assigned by Super Admin per user (`PATCH /users/:id/tags`). Admin and Super Admin always have all tags.

| Tag | Route | Purpose |
|-----|-------|---------|
| `careers` | `/features/careers` | Portal/self-applied candidates |
| `employee_referral` | `/features/employee-referral` | ERP-tagged referral candidates |
| `mis` | `/features/mis` | MIS recruitment KPI dashboard |

**Test setup:** Ensure at least one HR/recruiter test account has all three tags.

---

## Interviewer restrictions

Interviewers have the most limited staff access:

- **Candidate profile tabs:** Overview and Resume only (no Interviews or Activity tabs for editing)
- **Interview list:** Assigned interviews only (`?mine=1` behavior)
- **No access to:** Requirements, Pipeline, Offers, Vendors, Candidates list/page (default pages)
- **Can:** Submit feedback on assigned interviews; view candidate resume via interview session (`/interviews/:id/resume`), not the full candidate profile

---

## Admin hub access detail

| Section | SUPER_ADMIN | ADMIN |
|---------|:-----------:|:-----:|
| Overview | ✓ | ✓ |
| User Management | ✓ | UI yes / API limited |
| Departments | ✓ | ✓ |
| Clients | ✓ | ✓ |
| Skills | ✓ | ✓ |
| Role Access Editor | ✓ | — |
| Interview Panels | ✓ | ✓ |

---

## Suggested test accounts (emails)

Primary accounts per role (passwords from QA lead):

| Role | Email |
|------|-------|
| SUPER_ADMIN | superadmin@stitch-ats.in |
| ADMIN | admin@stitch-ats.in |
| HR_HEAD | hrhead@stitch-ats.in |
| HR_MANAGER | hrmanager@stitch-ats.in |
| RECRUITER | recruiter@stitch-ats.in |
| TEAM_LEAD | teamlead@stitch-ats.in |
| HIRING_MANAGER | hiringmanager@stitch-ats.in |
| INTERVIEWER | interviewer@stitch-ats.in |
| VENDOR | vendor@stitch-ats.in |
| EMPLOYEE | employee@stitch-ats.in |
| CANDIDATE | candidate@stitch-ats.in |

---

## Related documents

- [APPLICATION_FLOW.md](./APPLICATION_FLOW.md) — workflows using these permissions
- [TEST_CASES.md](./TEST_CASES.md) — RBAC negative test cases (TC-RBAC-*)
- [TESTER_SETUP.md](./TESTER_SETUP.md) — credential provisioning
