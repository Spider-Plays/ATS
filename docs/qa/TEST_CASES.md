# Test Cases

Detailed executable test cases for **Stitch ATS** production UAT. Linked to scenarios in [TEST_SCENARIOS.md](./TEST_SCENARIOS.md).

**Record:** Pass / Fail / Blocked / N/A for each case in your execution tracker.

---

## Auth (TC-AUTH)

### TC-AUTH-001 | Staff login success

| Field | Value |
|-------|-------|
| **Scenario** | SC-AUTH-001 |
| **Priority** | P1 |
| **Role** | Recruiter |

**Preconditions:** Active recruiter account.

**Steps:**
1. Open https://stitch-ats.in/login
2. Enter recruiter email and password
3. Click Sign in

**Expected:** Redirect to `/dashboard`. Sidebar shows Dashboard, Requirements, Vendors, Candidates, Pipeline, Interviews, Notifications, Settings. Offers page **not** visible.

**Test data:** recruiter@stitch-ats.in

---

### TC-AUTH-002 | Staff logout

| Field | Value |
|-------|-------|
| **Scenario** | SC-AUTH-001 |
| **Priority** | P1 |
| **Role** | Recruiter |

**Preconditions:** Logged in as recruiter.

**Steps:**
1. Click user menu / Log out
2. Attempt to navigate to `/dashboard` directly

**Expected:** Redirect to `/login`. Dashboard not accessible without re-authentication.

---

### TC-AUTH-003 | Candidate portal login

| Field | Value |
|-------|-------|
| **Scenario** | SC-AUTH-002 |
| **Priority** | P1 |
| **Role** | Candidate |

**Preconditions:** Active candidate account.

**Steps:**
1. Open https://stitch-ats.in/portal/login
2. Enter candidate credentials
3. Sign in

**Expected:** Redirect to `/portal/dashboard` or `/portal/onboarding` if profile incomplete.

---

### TC-AUTH-004 | Wrong portal blocked

| Field | Value |
|-------|-------|
| **Scenario** | SC-AUTH-002 |
| **Priority** | P1 |
| **Role** | Candidate, Employee |

**Steps:**
1. Attempt candidate login at `/login` (staff login)
2. Attempt employee login at `/login`

**Expected:** Error message directing user to correct portal (/portal/login or /referral-portal/login).

---

### TC-AUTH-005 | Forgot password

| Field | Value |
|-------|-------|
| **Scenario** | SC-AUTH-003 |
| **Priority** | P2 |
| **Role** | Any staff |

**Preconditions:** Email delivery configured (confirm with QA lead).

**Steps:**
1. On login page, click Forgot password
2. Enter staff email
3. Submit
4. Open reset link from email
5. Set new password
6. Log in with new password

**Expected:** Password reset succeeds; login works with new password.

---

### TC-AUTH-006 | Idle logout

| Field | Value |
|-------|-------|
| **Scenario** | SC-AUTH-004 |
| **Priority** | P2 |
| **Role** | Any |

**Steps:**
1. Log in successfully
2. Do not interact with browser for 15+ minutes
3. Attempt any action

**Expected:** User logged out; redirected to login.

---

## Requirements (TC-REQ)

### TC-REQ-001 | Create draft requirement

| Field | Value |
|-------|-------|
| **Scenario** | SC-REQ-001 |
| **Priority** | P1 |
| **Role** | Hiring Manager |

**Steps:**
1. Log in as Hiring Manager
2. Navigate to `/requirements/new`
3. Fill title: `[QA] Test Engineer Role`
4. Select department, add skills, enter description
5. Save

**Expected:** Requirement created with status **Draft**. Visible in requirements list.

---

### TC-REQ-002 | Submit for approval

| Field | Value |
|-------|-------|
| **Scenario** | SC-REQ-001 |
| **Priority** | P1 |
| **Role** | Hiring Manager |

**Preconditions:** Draft requirement from TC-REQ-001.

**Steps:**
1. Open requirement detail
2. Click Submit for approval

**Expected:** Status changes to **Pending Approval**.

---

### TC-REQ-003 | HR approve requirement

| Field | Value |
|-------|-------|
| **Scenario** | SC-REQ-001 |
| **Priority** | P1 |
| **Role** | HR Head |

**Preconditions:** Pending approval requirement.

**Steps:**
1. Log in as HR Head
2. Open requirement detail (or use notification/badge)
3. Click Approve

**Expected:** Status **Live**. Approval recorded in timeline.

---

### TC-REQ-004 | Enable portal visibility

| Field | Value |
|-------|-------|
| **Scenario** | SC-REQ-002 |
| **Priority** | P1 |
| **Role** | Team Lead or HR Head |

**Preconditions:** LIVE requirement.

**Steps:**
1. Open requirement detail
2. Enable portal visibility / posting controls
3. Log in as Candidate (separate session)
4. Open `/portal/jobs`

**Expected:** `[QA]` job appears in candidate portal jobs list.

---

### TC-REQ-005 | Assign recruiter

| Field | Value |
|-------|-------|
| **Scenario** | SC-REQ-003 |
| **Priority** | P1 |
| **Role** | HR Head, Recruiter |

**Steps:**
1. As HR Head, open LIVE requirement → assign recruiter
2. Log in as assigned Recruiter
3. Open `/requirements`

**Expected:** Recruiter sees assigned requirement in their list.

---

### TC-REQ-006 | Reject requirement

| Field | Value |
|-------|-------|
| **Scenario** | SC-REQ-004 |
| **Priority** | P2 |
| **Role** | HR Head |

**Preconditions:** Pending approval requirement.

**Steps:**
1. Open requirement detail
2. Reject with reason

**Expected:** Requirement returns to editable/rejected state; HM can edit and resubmit.

---

### TC-REQ-007 | Put requirement on hold

| Field | Value |
|-------|-------|
| **Scenario** | SC-REQ-005 |
| **Priority** | P2 |
| **Role** | HR Head |

**Steps:**
1. Open LIVE requirement
2. Change status to **On Hold**

**Expected:** Status On Hold; posting paused per UI behavior.

---

### TC-REQ-008 | Close requirement

| Field | Value |
|-------|-------|
| **Scenario** | SC-REQ-005 |
| **Priority** | P2 |
| **Role** | HR Head |

**Steps:**
1. Open LIVE or On Hold requirement
2. Close requirement

**Expected:** Status **Closed**; no new applications accepted.

---

## Sourcing (TC-SRC)

### TC-SRC-001 | Add candidate manually

| Field | Value |
|-------|-------|
| **Scenario** | SC-SRC-001 |
| **Priority** | P1 |
| **Role** | Recruiter |

**Steps:**
1. Navigate to `/candidates/new`
2. Enter name: `[QA] Manual Candidate 01`
3. Enter email: `qa-manual-01@test.local`
4. Link to `[QA]` LIVE requirement
5. Save

**Expected:** Candidate created; appears in candidates list and pipeline.

---

### TC-SRC-002 | Upload candidate resume

| Field | Value |
|-------|-------|
| **Scenario** | SC-SRC-001 |
| **Priority** | P2 |
| **Role** | Recruiter |

**Preconditions:** Candidate from TC-SRC-001.

**Steps:**
1. Open candidate profile → Resume tab
2. Upload PDF resume
3. View resume

**Expected:** Resume uploaded and viewable/downloadable.

---

### TC-SRC-003 | Vendor submission

| Field | Value |
|-------|-------|
| **Scenario** | SC-SRC-002 |
| **Priority** | P1 |
| **Role** | Vendor, Recruiter |

**Steps:**
1. Log in as Vendor → `/vendor-portal/positions`
2. Open assigned position
3. Submit `[QA] Vendor Candidate 01` with resume
4. Log in as Recruiter → check pipeline/candidates

**Expected:** Vendor submission appears in staff candidate list linked to requirement.

---

### TC-SRC-004 | Candidate portal apply

| Field | Value |
|-------|-------|
| **Scenario** | SC-SRC-003 |
| **Priority** | P1 |
| **Role** | Candidate |

**Preconditions:** LIVE visible job on portal.

**Steps:**
1. Log in to candidate portal
2. Browse `/portal/jobs`
3. Open `[QA]` job → Apply

**Expected:** Application submitted; appears on `/portal/applied` and dashboard.

---

### TC-SRC-005 | Portal application on staff side

| Field | Value |
|-------|-------|
| **Scenario** | SC-SRC-003 |
| **Priority** | P1 |
| **Role** | Recruiter with careers tag |

**Preconditions:** TC-SRC-004 completed.

**Steps:**
1. Open `/features/careers` or candidate list
2. Locate portal-applied candidate

**Expected:** Portal application visible to staff with correct source.

---

### TC-SRC-006 | Employee referral

| Field | Value |
|-------|-------|
| **Scenario** | SC-SRC-004 |
| **Priority** | P2 |
| **Role** | Employee |

**Steps:**
1. Log in to `/referral-portal/jobs`
2. Open referrable role
3. Submit `[QA] Referral Candidate 01`
4. Check `/referral-portal/referrals`

**Expected:** Referral listed in My Referrals with status.

---

## Pipeline (TC-PIP)

### TC-PIP-001 | Drag stage on Kanban

| Field | Value |
|-------|-------|
| **Scenario** | SC-PIP-001 |
| **Priority** | P1 |
| **Role** | Recruiter |

**Preconditions:** Candidate in pipeline at SOURCED or APPLIED.

**Steps:**
1. Open `/pipeline` or `/pipeline/:requirementId`
2. Drag candidate card from current column to SCREENING
3. Refresh page

**Expected:** Candidate remains in SCREENING; activity log updated.

---

### TC-PIP-002 | Move through interview stage

| Field | Value |
|-------|-------|
| **Scenario** | SC-PIP-001 |
| **Priority** | P1 |
| **Role** | Recruiter |

**Steps:**
1. Move candidate SHORTLISTED → INTERVIEW → OFFER sequentially

**Expected:** Each transition succeeds; columns update correctly.

---

### TC-PIP-003 | Reject candidate

| Field | Value |
|-------|-------|
| **Scenario** | SC-PIP-002 |
| **Priority** | P1 |
| **Role** | Recruiter |

**Steps:**
1. Move candidate to REJECTED (or use reject action)

**Expected:** Status REJECTED; candidate removed from active funnel columns.

---

### TC-PIP-004 | HIRED lock — recruiter blocked

| Field | Value |
|-------|-------|
| **Scenario** | SC-PIP-003 |
| **Priority** | P1 |
| **Role** | Recruiter |

**Preconditions:** Candidate at HIRED stage.

**Steps:**
1. As Recruiter, attempt to drag candidate from HIRED to JOINED

**Expected:** Action blocked. Message: only HR leadership can change stage after hired.

---

### TC-PIP-005 | HIRED lock — HR allowed

| Field | Value |
|-------|-------|
| **Scenario** | SC-PIP-003 |
| **Priority** | P1 |
| **Role** | HR Head |

**Preconditions:** Candidate at HIRED stage.

**Steps:**
1. As HR Head, move candidate HIRED → JOINED

**Expected:** Transition succeeds.

---

## Interviews (TC-INT)

### TC-INT-001 | Schedule interview from profile

| Field | Value |
|-------|-------|
| **Scenario** | SC-INT-001 |
| **Priority** | P1 |
| **Role** | Recruiter |

**Preconditions:** Candidate at INTERVIEW stage.

**Steps:**
1. Open candidate profile
2. Click Schedule interview (or use `/interviews/new`)
3. Select requirement, date/time, assign Interviewer
4. Save

**Expected:** Interview created with Scheduled status.

---

### TC-INT-002 | Interview appears for interviewer

| Field | Value |
|-------|-------|
| **Scenario** | SC-INT-001 |
| **Priority** | P1 |
| **Role** | Interviewer |

**Preconditions:** TC-INT-001 completed with interviewer assigned.

**Steps:**
1. Log in as Interviewer
2. Open `/interviews`

**Expected:** Scheduled interview visible in list (mine filter).

---

### TC-INT-003 | Open feedback form

| Field | Value |
|-------|-------|
| **Scenario** | SC-INT-002 |
| **Priority** | P1 |
| **Role** | Interviewer |

**Steps:**
1. Open assigned interview
2. Navigate to `/interviews/:id/feedback`

**Expected:** Feedback form loads with skills/competency fields.

---

### TC-INT-004 | Submit feedback

| Field | Value |
|-------|-------|
| **Scenario** | SC-INT-002 |
| **Priority** | P1 |
| **Role** | Interviewer |

**Steps:**
1. Complete feedback form with ratings and hire recommendation
2. Submit

**Expected:** Feedback saved; interview appears under Decided filter; activity on candidate profile.

---

### TC-INT-005 | Interviewer sees only assigned

| Field | Value |
|-------|-------|
| **Scenario** | SC-INT-003 |
| **Priority** | P1 |
| **Role** | Interviewer |

**Preconditions:** Interviews exist assigned to other interviewers.

**Steps:**
1. Open `/interviews` as Interviewer
2. Compare count with HR Head view

**Expected:** Interviewer sees subset — only assigned interviews.

---

### TC-INT-006 | Interviewer candidate tabs limited

| Field | Value |
|-------|-------|
| **Scenario** | SC-INT-003 |
| **Priority** | P1 |
| **Role** | Interviewer |

**Steps:**
1. Open candidate profile from interview context

**Expected:** Only **Overview** and **Resume** tabs available.

---

## Offers (TC-OFR)

### TC-OFR-001 | Create offer draft

| Field | Value |
|-------|-------|
| **Scenario** | SC-OFR-001 |
| **Priority** | P1 |
| **Role** | Recruiter or HR Manager |

**Preconditions:** Candidate at OFFER pipeline stage.

**Steps:**
1. Navigate to `/offers/new`
2. Select candidate and requirement
3. Enter compensation details
4. Save as draft

**Expected:** Offer created in Draft status.

---

### TC-OFR-002 | Submit and HR approve

| Field | Value |
|-------|-------|
| **Scenario** | SC-OFR-001 |
| **Priority** | P1 |
| **Role** | Recruiter, HR Head |

**Steps:**
1. Submit offer for approval
2. Log in as HR Head → open offer → HR Approve

**Expected:** HR Approved status.

---

### TC-OFR-003 | Exec approve and send

| Field | Value |
|-------|-------|
| **Scenario** | SC-OFR-001 |
| **Priority** | P1 |
| **Role** | Admin, Recruiter |

**Steps:**
1. As Admin → Exec Approve on offer
2. As Recruiter/HR → Send offer to candidate

**Expected:** Status **Sent**; candidate can view in portal.

---

### TC-OFR-004 | Candidate accept offer

| Field | Value |
|-------|-------|
| **Scenario** | SC-OFR-002 |
| **Priority** | P1 |
| **Role** | Candidate |

**Steps:**
1. Log in to candidate portal
2. Open `/portal/offers/:id`
3. Accept offer

**Expected:** Offer status Accepted on staff side.

---

### TC-OFR-005 | Candidate decline offer

| Field | Value |
|-------|-------|
| **Scenario** | SC-OFR-003 |
| **Priority** | P2 |
| **Role** | Candidate |

**Steps:**
1. Open sent offer in portal
2. Decline with reason

**Expected:** Offer status Declined on staff side.

---

### TC-OFR-006 | HR sees compensation

| Field | Value |
|-------|-------|
| **Scenario** | SC-OFR-004 |
| **Priority** | P2 |
| **Role** | HR Head |

**Steps:**
1. Open offer detail as HR Head

**Expected:** Full compensation fields visible.

---

### TC-OFR-007 | Offer letter PDF

| Field | Value |
|-------|-------|
| **Scenario** | SC-OFR-004 |
| **Priority** | P2 |
| **Role** | HR Head, Candidate |

**Steps:**
1. View/download offer letter PDF from staff offer detail
2. View from candidate portal offer page

**Expected:** PDF generates and displays correctly.

---

### TC-OFR-008 | Recruiter offers page access

| Field | Value |
|-------|-------|
| **Scenario** | SC-OFR-004 |
| **Priority** | P2 |
| **Role** | Recruiter |

**Steps:**
1. Check sidebar for Offers
2. Navigate to `/offers` directly

**Expected:** Offers **not** in default recruiter sidebar (per default role pages).

---

## Admin (TC-ADM)

### TC-ADM-001 | Invite user

| Field | Value |
|-------|-------|
| **Scenario** | SC-ADM-001 |
| **Priority** | P2 |
| **Role** | Super Admin |

**Steps:**
1. Open `/admin/users`
2. Invite user: `qa-invite-01@test.local`, role RECRUITER
3. Complete invite flow

**Expected:** User appears in user list with ACTIVE status.

---

### TC-ADM-002 | Disable user

| Field | Value |
|-------|-------|
| **Scenario** | SC-ADM-001 |
| **Priority** | P2 |
| **Role** | Super Admin |

**Steps:**
1. Disable user from TC-ADM-001
2. Attempt login as that user

**Expected:** Login fails; account disabled message.

---

### TC-ADM-003 | Role access editor

| Field | Value |
|-------|-------|
| **Scenario** | SC-ADM-002 |
| **Priority** | P2 |
| **Role** | Super Admin, Recruiter |

**Steps:**
1. Super Admin → `/admin/role-access` → remove Vendors page for RECRUITER
2. Log in as Recruiter

**Expected:** Vendors not in sidebar. Restore after test.

---

### TC-ADM-004 | Add department

| Field | Value |
|-------|-------|
| **Scenario** | SC-ADM-003 |
| **Priority** | P3 |
| **Role** | Admin |

**Steps:**
1. `/admin/departments` → add `[QA] Test Dept`
2. Create requirement using new department

**Expected:** Department available in requirement form.

---

### TC-ADM-005 | Add skill

| Field | Value |
|-------|-------|
| **Scenario** | SC-ADM-003 |
| **Priority** | P3 |
| **Role** | Admin |

**Steps:**
1. `/admin/skills` → add `[QA] TestSkill`
2. Use in requirement skills field

**Expected:** Skill searchable and attachable to requirement.

---

## Candidate portal (TC-CNP)

### TC-CNP-001 | Signup and onboarding

| Field | Value |
|-------|-------|
| **Scenario** | SC-CNP-001 |
| **Priority** | P1 |
| **Role** | New candidate |

**Steps:**
1. `/portal/signup` — register `qa-new-01@test.local`
2. Complete onboarding profile fields
3. Submit profile

**Expected:** Redirect to `/portal/dashboard`; profile gate cleared.

---

### TC-CNP-002 | Profile gate blocks incomplete

| Field | Value |
|-------|-------|
| **Scenario** | SC-CNP-001 |
| **Priority** | P2 |
| **Role** | Candidate (incomplete profile) |

**Steps:**
1. Log in with incomplete profile candidate
2. Attempt `/portal/jobs`

**Expected:** Redirect to `/portal/onboarding` until complete.

---

### TC-CNP-003 | Browse and apply

| Field | Value |
|-------|-------|
| **Scenario** | SC-CNP-001 |
| **Priority** | P1 |
| **Role** | Candidate |

**Steps:**
1. `/portal/jobs` — list loads
2. Open job detail
3. Apply

**Expected:** Success confirmation; job on applied list.

---

### TC-CNP-004 | Application status tracking

| Field | Value |
|-------|-------|
| **Scenario** | SC-CNP-002 |
| **Priority** | P1 |
| **Role** | Candidate |

**Steps:**
1. Open `/portal/applied` or dashboard pipeline tracker
2. View application for `[QA]` job

**Expected:** Status reflects current pipeline stage (staff may need to move stage first).

---

### TC-CNP-005 | View offer in portal

| Field | Value |
|-------|-------|
| **Scenario** | SC-CNP-002 |
| **Priority** | P1 |
| **Role** | Candidate |

**Preconditions:** Sent offer exists.

**Steps:**
1. Open offer from dashboard or `/portal/offers/:id`
2. View offer details and letter

**Expected:** Offer details and actions (Accept/Decline) visible.

---

## Vendor portal (TC-VNP)

### TC-VNP-001 | Vendor dashboard

| Field | Value |
|-------|-------|
| **Scenario** | SC-VNP-001 |
| **Priority** | P1 |
| **Role** | Vendor |

**Steps:**
1. Log in → `/vendor-portal/dashboard`

**Expected:** Stats and recent submissions section load without error.

---

### TC-VNP-002 | Assigned positions list

| Field | Value |
|-------|-------|
| **Scenario** | SC-VNP-001 |
| **Priority** | P1 |
| **Role** | Vendor |

**Steps:**
1. Open `/vendor-portal/positions`

**Expected:** List shows only positions assigned to this vendor.

---

### TC-VNP-003 | Submit candidate form

| Field | Value |
|-------|-------|
| **Scenario** | SC-VNP-001 |
| **Priority** | P1 |
| **Role** | Vendor |

**Steps:**
1. Open position detail
2. Fill submit form: `[QA] Vendor Form Test`
3. Attach resume; submit

**Expected:** Success message; submission appears on dashboard/submissions.

---

## Referral portal (TC-RFP)

### TC-RFP-001 | Referral dashboard

| Field | Value |
|-------|-------|
| **Scenario** | SC-RFP-001 |
| **Priority** | P2 |
| **Role** | Employee |

**Steps:**
1. `/referral-portal/dashboard`

**Expected:** Referral code, stats, recent referrals display.

---

### TC-RFP-002 | Submit referral

| Field | Value |
|-------|-------|
| **Scenario** | SC-RFP-001 |
| **Priority** | P2 |
| **Role** | Employee |

**Steps:**
1. `/referral-portal/jobs` → open job
2. Submit referral with candidate details

**Expected:** Success; referral in My Referrals.

---

### TC-RFP-003 | Referral detail page

| Field | Value |
|-------|-------|
| **Scenario** | SC-RFP-001 |
| **Priority** | P2 |
| **Role** | Employee |

**Steps:**
1. `/referral-portal/referrals` → open referral detail

**Expected:** Status and submitted info displayed.

---

## Search and notifications (TC-SRH)

### TC-SRH-001 | Global search candidate

| Field | Value |
|-------|-------|
| **Scenario** | SC-SRH-001 |
| **Priority** | P2 |
| **Role** | HR Head |

**Steps:**
1. Use header search for known `[QA]` candidate name
2. Click result

**Expected:** Navigates to correct candidate profile.

---

### TC-SRH-002 | Search scoping for recruiter

| Field | Value |
|-------|-------|
| **Scenario** | SC-SRH-001 |
| **Priority** | P2 |
| **Role** | Recruiter |

**Steps:**
1. Search for candidate outside recruiter scope

**Expected:** No results or only scoped results (not org-wide unrelated data).

---

### TC-SRH-003 | Pending approval badge

| Field | Value |
|-------|-------|
| **Scenario** | SC-SRH-002 |
| **Priority** | P2 |
| **Role** | HR Head |

**Preconditions:** Pending requirement or offer exists.

**Steps:**
1. Log in as HR Head
2. Check header notification/badge
3. Click through to approval

**Expected:** Badge visible; link opens correct approval screen.

---

## RBAC negative (TC-RBAC)

### TC-RBAC-001 | Recruiter no offers access

| Field | Value |
|-------|-------|
| **Scenario** | SC-RBAC-001 |
| **Priority** | P1 |
| **Role** | Recruiter |

**Steps:**
1. Verify Offers absent from sidebar
2. Navigate directly to `/offers`

**Expected:** Redirect or access denied per route guard.

---

### TC-RBAC-002 | HM sees own requirements only

| Field | Value |
|-------|-------|
| **Scenario** | SC-RBAC-002 |
| **Priority** | P1 |
| **Role** | Hiring Manager |

**Steps:**
1. Open `/requirements` as HM
2. Compare with HR Head list count

**Expected:** HM sees subset — own/assigned requirements only.

---

### TC-RBAC-003 | HM cannot edit others' requirements

| Field | Value |
|-------|-------|
| **Scenario** | SC-RBAC-002 |
| **Priority** | P1 |
| **Role** | Hiring Manager |

**Steps:**
1. Attempt to open edit page for requirement not owned by HM

**Expected:** Edit blocked or not visible.

---

### TC-RBAC-004 | Interviewer no pipeline access

| Field | Value |
|-------|-------|
| **Scenario** | SC-RBAC-003 |
| **Priority** | P1 |
| **Role** | Interviewer |

**Steps:**
1. Verify Pipeline absent from sidebar
2. Navigate to `/pipeline`

**Expected:** Access denied or redirect.

---

### TC-RBAC-005 | Interviewer cannot schedule

| Field | Value |
|-------|-------|
| **Scenario** | SC-RBAC-003 |
| **Priority** | P1 |
| **Role** | Interviewer |

**Steps:**
1. Open candidate profile
2. Look for Schedule interview action

**Expected:** Schedule action not available.

---

### TC-RBAC-006 | Super Admin bypass

| Field | Value |
|-------|-------|
| **Scenario** | SC-RBAC-003 |
| **Priority** | P2 |
| **Role** | Super Admin |

**Steps:**
1. Verify all sidebar pages visible including User Management
2. Access `/admin/role-access`

**Expected:** Full access granted.

---

## Features (TC-FTR)

### TC-FTR-001 | Careers module

| Field | Value |
|-------|-------|
| **Scenario** | SC-FTR-001 |
| **Priority** | P2 |
| **Role** | Recruiter with `careers` tag |

**Steps:**
1. Open `/features/careers`

**Expected:** Portal-applied candidates listed.

---

### TC-FTR-002 | MIS dashboard

| Field | Value |
|-------|-------|
| **Scenario** | SC-FTR-002 |
| **Priority** | P3 |
| **Role** | HR Head with `mis` tag |

**Steps:**
1. Open `/features/mis`

**Expected:** Dashboard loads with recruitment KPI widgets.

---

## E2E golden path (TC-E2E)

### TC-E2E-001 | Full hire journey

| Field | Value |
|-------|-------|
| **Scenario** | SC-E2E-001 |
| **Priority** | P1 |
| **Roles** | HM, HR Head, Recruiter, Interviewer, Admin, Candidate |

**Preconditions:** All accounts active; catalogs populated.

**Steps:**

| # | Role | Action |
|---|------|--------|
| 1 | Hiring Manager | Create `[QA] E2E Engineer` requirement (Draft) |
| 2 | Hiring Manager | Submit for approval |
| 3 | HR Head | Approve → LIVE |
| 4 | HR Head | Assign recruiter; enable portal visibility |
| 5 | Recruiter | Add `[QA] E2E Candidate` linked to req |
| 6 | Recruiter | Pipeline: move to SHORTLISTED → INTERVIEW |
| 7 | Recruiter | Schedule interview; assign Interviewer |
| 8 | Interviewer | Submit positive feedback |
| 9 | Recruiter | Pipeline: move to OFFER |
| 10 | Recruiter | Create offer → submit |
| 11 | HR Head | HR approve offer |
| 12 | Admin | Exec approve offer |
| 13 | Recruiter | Send offer |
| 14 | Candidate | Accept offer in portal |
| 15 | Recruiter | Pipeline: OFFER → HIRED |
| 16 | HR Head | Pipeline: HIRED → JOINED |

**Expected:** Complete hire recorded; all statuses consistent across pipeline, offers, and candidate portal.

---

## Case count summary

| Prefix | Cases |
|--------|-------|
| TC-AUTH | 6 |
| TC-REQ | 8 |
| TC-SRC | 6 |
| TC-PIP | 5 |
| TC-INT | 6 |
| TC-OFR | 8 |
| TC-ADM | 5 |
| TC-CNP | 5 |
| TC-VNP | 3 |
| TC-RFP | 3 |
| TC-SRH | 3 |
| TC-RBAC | 6 |
| TC-FTR | 2 |
| TC-E2E | 1 |
| **Total** | **67** |

---

## Related documents

- [TEST_SCENARIOS.md](./TEST_SCENARIOS.md)
- [APPLICATION_FLOW.md](./APPLICATION_FLOW.md)
- [BUG_REPORT_TEMPLATE.md](./BUG_REPORT_TEMPLATE.md)
