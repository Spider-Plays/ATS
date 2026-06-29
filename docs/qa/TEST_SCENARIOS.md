# Test Scenarios

High-level test scenarios for **Stitch ATS** production UAT. Each scenario links to detailed test cases in [TEST_CASES.md](./TEST_CASES.md).

**Legend:** P1 = must pass for sign-off | P2 = should pass | P3 = nice to have

---

## Auth and session

### SC-AUTH-001 | Staff login and logout | P1

| Field | Value |
|-------|-------|
| **Roles** | Recruiter (or any staff role) |
| **Preconditions** | Active staff account |
| **Description** | Log in via `/login`, verify dashboard loads and sidebar matches role; log out and verify session cleared |
| **Cases** | TC-AUTH-001, TC-AUTH-002 |

### SC-AUTH-002 | Portal-specific login routing | P1

| Field | Value |
|-------|-------|
| **Roles** | Candidate, Employee, Vendor |
| **Preconditions** | Accounts for each portal role |
| **Description** | Each role logs in via correct portal URL and lands on correct dashboard; wrong portal shows appropriate error |
| **Cases** | TC-AUTH-003, TC-AUTH-004 |

### SC-AUTH-003 | Password reset flow | P2

| Field | Value |
|-------|-------|
| **Roles** | Any staff role |
| **Preconditions** | Email delivery configured |
| **Description** | Request forgot password, complete reset, log in with new password |
| **Cases** | TC-AUTH-005 |

### SC-AUTH-004 | Idle logout | P2

| Field | Value |
|-------|-------|
| **Roles** | Any |
| **Preconditions** | Logged in |
| **Description** | After 15 minutes idle, user is logged out automatically |
| **Cases** | TC-AUTH-006 |

---

## Requirements

### SC-REQ-001 | Requirement approval workflow | P1

| Field | Value |
|-------|-------|
| **Roles** | Hiring Manager, HR Head |
| **Preconditions** | Department exists; HM account active |
| **Description** | HM creates draft requirement, submits for approval; HR Head approves; status becomes LIVE |
| **Cases** | TC-REQ-001, TC-REQ-002, TC-REQ-003 |

### SC-REQ-002 | Portal visibility and posting | P1

| Field | Value |
|-------|-------|
| **Roles** | Team Lead or HR Head |
| **Preconditions** | LIVE requirement exists |
| **Description** | Enable portal visibility; verify job appears on candidate portal jobs list |
| **Cases** | TC-REQ-004 |

### SC-REQ-003 | Recruiter assignment | P1

| Field | Value |
|-------|-------|
| **Roles** | HR Head, Recruiter |
| **Preconditions** | LIVE requirement |
| **Description** | Assign recruiter to requirement; recruiter sees it in scoped list |
| **Cases** | TC-REQ-005 |

### SC-REQ-004 | Requirement rejection | P2

| Field | Value |
|-------|-------|
| **Roles** | Hiring Manager, HR Head |
| **Preconditions** | Pending approval requirement |
| **Description** | HR Head rejects requirement; returns to editable state |
| **Cases** | TC-REQ-006 |

### SC-REQ-005 | Close requirement | P2

| Field | Value |
|-------|-------|
| **Roles** | HR Head |
| **Preconditions** | LIVE requirement |
| **Description** | Close requirement; no new applications accepted |
| **Cases** | TC-REQ-007, TC-REQ-008 |

---

## Sourcing

### SC-SRC-001 | Manual candidate add | P1

| Field | Value |
|-------|-------|
| **Roles** | Recruiter |
| **Preconditions** | LIVE requirement |
| **Description** | Recruiter manually adds `[QA]` candidate and links to requirement |
| **Cases** | TC-SRC-001, TC-SRC-002 |

### SC-SRC-002 | Vendor candidate submission | P1

| Field | Value |
|-------|-------|
| **Roles** | Vendor, Recruiter |
| **Preconditions** | Vendor assigned to LIVE job |
| **Description** | Vendor submits candidate via portal; staff sees in pipeline |
| **Cases** | TC-SRC-003 |

### SC-SRC-003 | Candidate portal application | P1

| Field | Value |
|-------|-------|
| **Roles** | Candidate |
| **Preconditions** | LIVE job visible on portal |
| **Description** | Candidate applies to job; application tracked on dashboard |
| **Cases** | TC-SRC-004, TC-SRC-005 |

### SC-SRC-004 | Employee referral submission | P2

| Field | Value |
|-------|-------|
| **Roles** | Employee |
| **Preconditions** | Referrable LIVE job |
| **Description** | Employee submits referral; appears in My Referrals and ERP module |
| **Cases** | TC-SRC-006 |

---

## Pipeline

### SC-PIP-001 | Full funnel stage movement | P1

| Field | Value |
|-------|-------|
| **Roles** | Recruiter |
| **Preconditions** | Candidate linked to requirement |
| **Description** | Drag candidate through SOURCED → … → OFFER on Kanban board |
| **Cases** | TC-PIP-001, TC-PIP-002 |

### SC-PIP-002 | Candidate rejection | P1

| Field | Value |
|-------|-------|
| **Roles** | Recruiter |
| **Preconditions** | Active candidate in pipeline |
| **Description** | Reject candidate; verify REJECTED status |
| **Cases** | TC-PIP-003 |

### SC-PIP-003 | HIRED stage lock | P1

| Field | Value |
|-------|-------|
| **Roles** | Recruiter, HR Head |
| **Preconditions** | Candidate at HIRED stage |
| **Description** | Recruiter cannot change stage; HR Head can move to JOINED |
| **Cases** | TC-PIP-004, TC-PIP-005 |

---

## Interviews

### SC-INT-001 | Schedule interview | P1

| Field | Value |
|-------|-------|
| **Roles** | Recruiter, Interviewer |
| **Preconditions** | Candidate at INTERVIEW stage |
| **Description** | Schedule interview with interviewer assigned; appears in both lists |
| **Cases** | TC-INT-001, TC-INT-002 |

### SC-INT-002 | Submit interview feedback | P1

| Field | Value |
|-------|-------|
| **Roles** | Interviewer |
| **Preconditions** | Scheduled interview assigned to interviewer |
| **Description** | Interviewer submits feedback; interview moves to decided state |
| **Cases** | TC-INT-003, TC-INT-004 |

### SC-INT-003 | Interviewer data scoping | P1

| Field | Value |
|-------|-------|
| **Roles** | Interviewer |
| **Preconditions** | Interviews exist for other interviewers |
| **Description** | Interviewer sees only assigned interviews; limited candidate profile tabs |
| **Cases** | TC-INT-005, TC-INT-006 |

---

## Offers

### SC-OFR-001 | Full offer approval chain | P1

| Field | Value |
|-------|-------|
| **Roles** | Recruiter, HR Head, Admin |
| **Preconditions** | Candidate at OFFER stage |
| **Description** | Create offer → submit → HR approve → exec approve → send |
| **Cases** | TC-OFR-001, TC-OFR-002, TC-OFR-003 |

### SC-OFR-002 | Candidate accept offer | P1

| Field | Value |
|-------|-------|
| **Roles** | Candidate |
| **Preconditions** | Offer in Sent status for candidate |
| **Description** | Candidate accepts offer in portal; staff sees Accepted status |
| **Cases** | TC-OFR-004 |

### SC-OFR-003 | Candidate decline offer | P2

| Field | Value |
|-------|-------|
| **Roles** | Candidate |
| **Preconditions** | Offer in Sent status |
| **Description** | Candidate declines; staff sees Declined status |
| **Cases** | TC-OFR-005 |

### SC-OFR-004 | Compensation visibility by role | P2

| Field | Value |
|-------|-------|
| **Roles** | HR Head, Recruiter |
| **Preconditions** | Offer with compensation |
| **Description** | HR sees full compensation; verify recruiter visibility per policy |
| **Cases** | TC-OFR-006, TC-OFR-007, TC-OFR-008 |

---

## Admin

### SC-ADM-001 | User invite and role assign | P2

| Field | Value |
|-------|-------|
| **Roles** | Super Admin |
| **Preconditions** | Super Admin access |
| **Description** | Invite new user, assign role and department, verify login |
| **Cases** | TC-ADM-001, TC-ADM-002 |

### SC-ADM-002 | Role access editor | P2

| Field | Value |
|-------|-------|
| **Roles** | Super Admin, Recruiter |
| **Preconditions** | Super Admin access |
| **Description** | Remove a page from recruiter role; verify sidebar updates for recruiter |
| **Cases** | TC-ADM-003 |

### SC-ADM-003 | Catalog management | P3

| Field | Value |
|-------|-------|
| **Roles** | Admin |
| **Preconditions** | Admin access |
| **Description** | Add department, client, skill; use in new requirement |
| **Cases** | TC-ADM-004, TC-ADM-005 |

---

## Candidate portal

### SC-CNP-001 | Onboarding and apply | P1

| Field | Value |
|-------|-------|
| **Roles** | Candidate (new signup) |
| **Preconditions** | LIVE job on portal |
| **Description** | Signup → complete onboarding → browse jobs → apply → verify on applied list |
| **Cases** | TC-CNP-001, TC-CNP-002, TC-CNP-003 |

### SC-CNP-002 | Application tracking and offer | P1

| Field | Value |
|-------|-------|
| **Roles** | Candidate |
| **Preconditions** | Existing application; sent offer |
| **Description** | Track application status on dashboard; view and respond to offer |
| **Cases** | TC-CNP-004, TC-CNP-005 |

---

## Vendor portal

### SC-VNP-001 | Vendor submit candidate | P1

| Field | Value |
|-------|-------|
| **Roles** | Vendor |
| **Preconditions** | Vendor assigned to position |
| **Description** | View assigned position, submit `[QA]` candidate with resume, verify on submissions |
| **Cases** | TC-VNP-001, TC-VNP-002, TC-VNP-003 |

---

## Referral portal

### SC-RFP-001 | Employee referral flow | P2

| Field | Value |
|-------|-------|
| **Roles** | Employee |
| **Preconditions** | Referrable job |
| **Description** | Browse roles, submit referral, track in My Referrals |
| **Cases** | TC-RFP-001, TC-RFP-002, TC-RFP-003 |

---

## Search and notifications

### SC-SRH-001 | Global search | P2

| Field | Value |
|-------|-------|
| **Roles** | Recruiter, HR Head |
| **Preconditions** | Known candidate/requirement exists |
| **Description** | Search returns scoped results; clicking result navigates correctly |
| **Cases** | TC-SRH-001, TC-SRH-002 |

### SC-SRH-002 | Pending approval notifications | P2

| Field | Value |
|-------|-------|
| **Roles** | HR Head |
| **Preconditions** | Pending requirement or offer |
| **Description** | Badge appears in header; notification links to approval action |
| **Cases** | TC-SRH-003 |

---

## RBAC negative

### SC-RBAC-001 | Recruiter cannot access offers | P1

| Field | Value |
|-------|-------|
| **Roles** | Recruiter |
| **Preconditions** | Default page config |
| **Description** | Offers not in sidebar; direct URL `/offers` blocked or redirected |
| **Cases** | TC-RBAC-001 |

### SC-RBAC-002 | Hiring manager data scoping | P1

| Field | Value |
|-------|-------|
| **Roles** | Hiring Manager |
| **Preconditions** | Requirements owned by others exist |
| **Description** | HM sees only own/assigned requirements |
| **Cases** | TC-RBAC-002, TC-RBAC-003 |

### SC-RBAC-003 | Interviewer profile restrictions | P1

| Field | Value |
|-------|-------|
| **Roles** | Interviewer |
| **Preconditions** | Candidate with interviews |
| **Description** | Only Overview + Resume tabs; cannot schedule interviews |
| **Cases** | TC-RBAC-004, TC-RBAC-005, TC-RBAC-006 |

---

## Feature modules

### SC-FTR-001 | Careers module | P2

| Field | Value |
|-------|-------|
| **Roles** | Recruiter with `careers` tag |
| **Preconditions** | Portal-applied candidate exists |
| **Description** | Careers page lists portal applicants |
| **Cases** | TC-FTR-001 |

### SC-FTR-002 | MIS dashboard | P3

| Field | Value |
|-------|-------|
| **Roles** | HR Head with `mis` tag |
| **Preconditions** | Hiring data exists |
| **Description** | MIS dashboard loads with KPI widgets |
| **Cases** | TC-FTR-002 |

---

## E2E golden path

### SC-E2E-001 | Full hire journey | P1

| Field | Value |
|-------|-------|
| **Roles** | Hiring Manager, HR Head, Recruiter, Interviewer, Admin, Candidate |
| **Preconditions** | All accounts active; catalogs populated |
| **Description** | End-to-end: create req → approve → source → interview → offer → accept → HIRED/JOINED |
| **Cases** | TC-E2E-001 |

See [APPLICATION_FLOW.md](./APPLICATION_FLOW.md#9-golden-path--hire-someone-end-to-end) for flow diagram.

---

## Scenario count summary

| Group | Scenarios | P1 |
|-------|-----------|-----|
| Auth | 4 | 2 |
| Requirements | 5 | 3 |
| Sourcing | 4 | 3 |
| Pipeline | 3 | 3 |
| Interviews | 3 | 3 |
| Offers | 4 | 2 |
| Admin | 3 | 0 |
| Candidate portal | 2 | 2 |
| Vendor portal | 1 | 1 |
| Referral portal | 1 | 0 |
| Search | 2 | 0 |
| RBAC | 3 | 3 |
| Features | 2 | 0 |
| E2E | 1 | 1 |
| **Total** | **38** | **23** |

---

## Related documents

- [TEST_CASES.md](./TEST_CASES.md) — detailed steps for each case ID
- [TEST_PLAN.md](./TEST_PLAN.md) — schedule and exit criteria
