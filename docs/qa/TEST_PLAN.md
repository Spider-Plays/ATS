# Test Plan

**Product:** Stitch ATS  
**Document version:** 1.0  
**Environment:** Production — https://stitch-ats.in  
**Test type:** User Acceptance Testing (UAT) — manual

---

## 1. Introduction

This document defines the test strategy, scope, schedule, and deliverables for extensive UAT of Stitch ATS on production. It is intended for QA testers, QA lead, and project stakeholders.

**Related documents:** [TEST_SCENARIOS.md](./TEST_SCENARIOS.md), [TEST_CASES.md](./TEST_CASES.md), [TESTER_SETUP.md](./TESTER_SETUP.md)

---

## 2. Scope

### In scope

| Area | Coverage |
|------|----------|
| Staff workspace | Dashboard, requirements, candidates, pipeline, interviews, offers, vendors |
| Admin hub | Users, catalogs, role access, interview panels |
| Candidate portal | Signup, onboarding, jobs, apply, offers |
| Vendor portal | Dashboard, positions, submissions |
| Referral portal | Dashboard, jobs, referrals, program |
| Feature modules | Careers, Employee Referral (ERP), MIS (with feature tags) |
| Authentication | Login, logout, password flows, idle timeout, session expiry |
| Authorization | 12 roles, page access, data scoping, negative tests |
| Cross-cutting | Global search, notifications, settings, theme toggle |

### Out of scope

| Area | Reason |
|------|--------|
| API-only / integration testing | UI-focused UAT; no Postman suite in this cycle |
| Load / performance testing | Separate performance test effort |
| M365 integration internals | Requires integration API key; smoke only if configured |
| Security penetration testing | Separate security review |
| Database / infrastructure | Managed by DevOps |

---

## 3. Test objectives

1. Verify all critical hiring workflows function correctly end-to-end on production
2. Confirm role-based access control (RBAC) — users see only permitted pages and data
3. Validate cross-portal flows (staff ↔ candidate ↔ vendor ↔ referral)
4. Ensure regression stability after releases using checklist passes
5. Document all defects with reproducible steps and severity

---

## 4. Test environment

| Item | Value |
|------|-------|
| Frontend URL | https://stitch-ats.in |
| API URL | https://stitch-ats.onrender.com (proxied via Cloudflare) |
| Browsers | Chrome, Edge, Firefox (latest 2 versions) |
| Devices | Desktop primary; tablet/mobile for portals |
| Test data | `[QA]` prefixed artifacts; dedicated test accounts |
| Dev quick login | **Not available** on production |

---

## 5. Test approach

1. **Smoke testing** — Day 1 using [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md)
2. **Scenario-based testing** — Execute scenarios in [TEST_SCENARIOS.md](./TEST_SCENARIOS.md) by priority (P1 first)
3. **Detailed case execution** — Follow steps in [TEST_CASES.md](./TEST_CASES.md); record pass/fail
4. **Exploratory testing** — Ad-hoc edge cases within scoped modules
5. **Role-based matrix** — Each scenario executed with correct role accounts
6. **Regression** — Re-run checklists after bug fixes and before sign-off

---

## 6. Test types

| Type | Description |
|------|-------------|
| **Functional** | Core features work per requirements |
| **UI/UX** | Layout, navigation, forms, error messages |
| **RBAC / Negative** | Unauthorized access blocked; data scoping enforced |
| **Cross-browser** | Key flows on Chrome, Edge, Firefox |
| **Responsive** | Portal pages on mobile/tablet viewports |
| **Regression** | Smoke checklists after each deploy |

---

## 7. Entry criteria

- [ ] All 12 role test accounts provisioned and credentials shared securely
- [ ] Super Admin confirms production is test-ready (no ongoing migrations)
- [ ] At least one LIVE requirement with portal visibility enabled
- [ ] Vendor assigned to at least one position
- [ ] Feature tags assigned to at least one staff account
- [ ] QA documentation reviewed by testers
- [ ] Bug reporting channel agreed (Jira / GitHub / email)

---

## 8. Exit criteria

- [ ] All **P1** scenarios passed
- [ ] All **P2** scenarios passed or deferred with documented waiver
- [ ] **Zero open Blocker** defects
- [ ] Major defects either fixed or accepted with stakeholder sign-off
- [ ] Regression checklist passed on final build
- [ ] Test summary report submitted to QA lead
- [ ] Stakeholder sign-off obtained

---

## 9. Test deliverables

| Deliverable | Format |
|-------------|--------|
| Test scenarios | [TEST_SCENARIOS.md](./TEST_SCENARIOS.md) |
| Test cases | [TEST_CASES.md](./TEST_CASES.md) |
| Defect log | Bug tracker entries using [BUG_REPORT_TEMPLATE.md](./BUG_REPORT_TEMPLATE.md) |
| Test execution record | Spreadsheet or tracker (maintained by QA lead) |
| Test summary report | Written summary at end of cycle |

---

## 10. Roles and responsibilities

| Role | Responsibility |
|------|----------------|
| **Tester** | Execute scenarios/cases; log defects; report progress |
| **QA lead** | Coordinate schedule; triage defects; track coverage; sign-off recommendation |
| **Super Admin** | Provision accounts; assign feature tags; vendor/job setup; cleanup `[QA]` data |
| **Developer** | Fix defects; deploy patches |
| **Product owner** | Accept/reject deferred P2/P3 items; final sign-off |

---

## 11. Schedule / phases

| Phase | Days | Activities |
|-------|------|------------|
| **Phase 1 — Smoke** | Day 1 | Regression checklists for all portals; verify access |
| **Phase 2 — Core flows** | Days 2–5 | P1 scenarios: auth, requirements, sourcing, pipeline, interviews, offers |
| **Phase 3 — RBAC & portals** | Days 6–8 | P1/P2: negative tests, candidate/vendor/referral portals, admin, features |
| **Phase 4 — Regression & sign-off** | Days 9–10 | Full regression; retest fixed bugs; summary report |

*Adjust timeline based on team size. Parallel testers can compress Phases 2–3.*

---

## 12. Risks and assumptions

| Risk / assumption | Mitigation |
|-------------------|------------|
| Email flows may not work if Resend not configured | Confirm with Dev which flows are testable; skip with waiver |
| Idle logout during long tests | Keep session active; note in bug if unexpected |
| Production data sensitivity | Use `[QA]` prefix; no real PII |
| Render API cold start | Retry once before filing Blocker |
| Admin vs Super Admin user API mismatch | Document actual behavior; file Major if UI misleading |
| **Assumption:** Test accounts exist for all 12 roles | Super Admin provisions before Day 1 |

---

## 13. Defect management

### Severity definitions

| Severity | Definition | Example |
|----------|------------|---------|
| **Blocker** | Cannot continue testing; no workaround | Login broken for all users |
| **Major** | Key feature broken; workaround painful | Cannot approve requirement |
| **Minor** | Non-critical; edge case | Wrong sort order on list |
| **Cosmetic** | Visual only | Misaligned button padding |

### Defect lifecycle

1. Tester logs defect using [BUG_REPORT_TEMPLATE.md](./BUG_REPORT_TEMPLATE.md)
2. QA lead triages and assigns severity
3. Developer fixes → deploy
4. Tester retests → close or reopen

---

## 14. Traceability matrix (summary)

| Module | Scenario IDs | Case ID prefix | Priority |
|--------|--------------|----------------|----------|
| Auth & session | SC-AUTH-001 – 004 | TC-AUTH-* | P1 |
| Requirements | SC-REQ-001 – 005 | TC-REQ-* | P1 |
| Sourcing | SC-SRC-001 – 004 | TC-SRC-* | P1 |
| Pipeline | SC-PIP-001 – 003 | TC-PIP-* | P1 |
| Interviews | SC-INT-001 – 003 | TC-INT-* | P1 |
| Offers | SC-OFR-001 – 004 | TC-OFR-* | P1 |
| Admin | SC-ADM-001 – 003 | TC-ADM-* | P2 |
| Candidate portal | SC-CNP-001 – 002 | TC-CNP-* | P1 |
| Vendor portal | SC-VNP-001 | TC-VNP-* | P1 |
| Referral portal | SC-RFP-001 | TC-RFP-* | P2 |
| Search & notifications | SC-SRH-001 – 002 | TC-SRH-* | P2 |
| RBAC negative | SC-RBAC-001 – 003 | TC-RBAC-* | P1 |
| Features | SC-FTR-001 – 002 | TC-FTR-* | P2 |
| E2E golden path | SC-E2E-001 | TC-E2E-001 | P1 |

Full scenario and case details in linked documents.

---

## Related documents

- [TEST_SCENARIOS.md](./TEST_SCENARIOS.md)
- [TEST_CASES.md](./TEST_CASES.md)
- [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md)
