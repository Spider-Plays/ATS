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

**API health (direct):** https://ats-0dtj.onrender.com/api/health  
**API health (via frontend proxy):** https://qa.stitch-ats.in/api/health

---

## Release workflow (developers)

New code lands on QA first, then production. Full guide: [RELEASE_WORKFLOW.md](./RELEASE_WORKFLOW.md)

| Step | Action |
|------|--------|
| Test | Push to **`qa`** branch → https://qa.stitch-ats.in updates |
| Release | Merge **`qa`** → **`main`** → https://stitch-ats.in updates |


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

## Email (Render staging API)

Copy the email secrets from **production** Render (`stitch-ats-api`) to **staging** (`stitch-ats-api-staging` / `ats-0dtj`):

| Variable | Notes |
|----------|--------|
| `M365_TENANT_ID`, `M365_CLIENT_ID`, `M365_CLIENT_SECRET`, `M365_SENDER_EMAIL` | Same Azure app as production |
| `M365_INTEGRATION_API_KEY` | Same or a separate key for QA |
| `RESEND_API_KEY` | Only if using Resend instead of M365 |

Non-secret vars are set in `server/render.yaml` (`APP_NAME`, `EMAIL_FROM`, calendar flags). After deploy, verify:

```bash
npm run verify:qa-staging
```

Or open https://ats-0dtj.onrender.com/api/health — expect `"email": "configured"`.

Test send (IT): `POST /api/integrations/m365/test-email` with header `X-Integration-Api-Key`.

Local QA: copy `server/.env.staging.example` → `server/.env.staging`, paste secrets, then `npm run dev:qa`.

---

## Differences from production

| Item | Staging | Production |
|------|---------|------------|
| Data | Safe to create/delete `[QA]` test data | Real data — use caution |
| Email | M365/Resend — same Azure app as prod; subjects prefixed `[QA]`; links use `qa.stitch-ats.in` | Live M365/Resend |
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

- [RELEASE_WORKFLOW.md](./RELEASE_WORKFLOW.md) — qa branch → main release process
- [TESTER_SETUP.md](./TESTER_SETUP.md) — browser support, bug workflow
- [README.md](../../README.md#qa-staging-full-stack) — infrastructure setup for devops
