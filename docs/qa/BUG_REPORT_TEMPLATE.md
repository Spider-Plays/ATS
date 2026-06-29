# Bug Report Template

Copy this template when logging a defect during **Stitch ATS** UAT. Submit via your team's agreed channel (Jira, GitHub Issues, email, etc.).

---

## Bug report

### Summary

<!-- One line describing the issue -->

### Environment

- **URL:** Production — https://stitch-ats.in
- **Portal:** <!-- Staff / Admin / Candidate / Vendor / Referral -->
- **Page URL:** <!-- Full path, e.g. /pipeline/abc123 -->

### Role used

<!-- e.g. Recruiter — recruiter@stitch-ats.in -->

### Test case / scenario reference

<!-- e.g. TC-PIP-001, SC-PIP-001 — or "Exploratory" -->

### Steps to reproduce

1. 
2. 
3. 

### Expected result

<!-- What should happen -->

### Actual result

<!-- What actually happened -->

### Severity

<!-- Blocker / Major / Minor / Cosmetic -->

| Severity | When to use |
|----------|-------------|
| Blocker | Cannot test further; no workaround |
| Major | Key feature broken; painful workaround |
| Minor | Non-critical edge case |
| Cosmetic | Visual only |

### Browser and OS

- **Browser:** <!-- e.g. Chrome 125 -->
- **OS:** <!-- e.g. Windows 11 -->

### Screenshot / recording

<!-- Attach files or paste links -->

### Additional notes

<!-- Intermittent? Workaround? Related bugs? -->

---

## Example (filled)

### Summary

Pipeline drag-and-drop does not persist stage change for recruiter

### Environment

- **URL:** Production — https://stitch-ats.in
- **Portal:** Staff
- **Page URL:** /pipeline/req-abc123

### Role used

Recruiter — recruiter@stitch-ats.in

### Test case / scenario reference

TC-PIP-001

### Steps to reproduce

1. Log in as Recruiter
2. Open pipeline for `[QA] Test Engineer Role`
3. Drag candidate from APPLIED to SCREENING
4. Refresh page

### Expected result

Candidate remains in SCREENING column

### Actual result

Candidate reverts to APPLIED after refresh; no error message shown

### Severity

Major

### Browser and OS

- **Browser:** Chrome 125
- **OS:** Windows 11

### Screenshot / recording

screenshot-pipeline-drag.png attached

### Additional notes

Reproducible 3/3 attempts. Network tab shows 200 on PATCH but response body has old status.

---

## Related documents

- [TEST_PLAN.md](./TEST_PLAN.md) — severity definitions
- [TESTER_SETUP.md](./TESTER_SETUP.md) — bug reporting workflow
