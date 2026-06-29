# QA Staging Environment

**URL:** https://qa.stitch-ats.in  
**Purpose:** Isolated full-stack environment for QA testing (separate database and API from production).

---

## URLs

| Surface | Login URL |
|---------|-----------|
| Staff workspace | https://qa.stitch-ats.in/login |
| Admin hub | https://qa.stitch-ats.in/admin |
| Candidate portal | https://qa.stitch-ats.in/portal/login |
| Vendor portal | https://qa.stitch-ats.in/login (VENDOR role) |
| Referral portal | https://qa.stitch-ats.in/referral-portal/login |

**API health (direct):** https://stitch-ats-api-staging.onrender.com/api/health  
**API health (via frontend proxy):** https://qa.stitch-ats.in/api/health

---

## Test credentials

After `npm run db:setup-staging`, demo accounts are seeded automatically.

| Type | Details |
|------|---------|
| **Staff roles** | Emails in `server/src/config/devUsers.registry.json` (e.g. `recruiter@stitch-ats.in`) |
| **Staff password** | `password` (demo seed default) |
| **Bootstrap admin** | `qa-admin@stitch-ats.in` — password set via `QA_ADMIN_PASSWORD` during setup |
| **Candidate portal** | `aisha.mehta@stitch-ats.in`, `rohan.kapoor@stitch-ats.in`, etc. — password `password` |

Contact your QA lead if credentials were rotated.

---

## Differences from production

| Item | Staging | Production |
|------|---------|------------|
| Data | Safe to create/delete `[QA]` test data | Real data — use caution |
| Email | May be disabled or sandboxed — confirm with dev team | Live M365/Resend |
| Cold start | Staging API may sleep on free Render tier | Same possible on prod |
| Dev quick login | Not available (build is production mode) | Not available |

---

## Testing conventions

Same as [TESTER_SETUP.md](./TESTER_SETUP.md):

- Prefix test data with **`[QA]`**
- Use separate browser profiles per role
- File bugs with environment **QA staging** and URL `qa.stitch-ats.in`

---

## Health check before a session

1. Open https://qa.stitch-ats.in — login page loads
2. Run `npm run verify:qa-staging` (developers) or check https://qa.stitch-ats.in/api/health returns OK

---

## Related

- [TESTER_SETUP.md](./TESTER_SETUP.md) — browser support, bug workflow
- [README.md](../../README.md#qa-staging-full-stack) — infrastructure setup for devops
