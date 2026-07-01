# API Reference — QA Testing

**Total endpoints:** 161  
**Last updated:** June 2026  
**Source of truth:** `server/src/app.ts` and `server/src/routes/*`  
**OpenAPI / Swagger:** [`openapi.yaml`](./openapi.yaml) — import into [Swagger Editor](https://editor.swagger.io), Postman, or Bruno. Regenerate with `npm run openapi:generate`.

Use this document to exercise every HTTP API in Postman, Insomnia, Bruno, or `curl`. For UI workflows, see [TEST_CASES.md](./TEST_CASES.md).

---

## Base URLs

| Environment | Frontend (API proxy) | Direct API (Render) |
|-------------|----------------------|---------------------|
| **QA staging** | `https://qa.stitch-ats.in` | `https://ats-0dtj.onrender.com` |
| **Production** | `https://stitch-ats.in` | `https://stitch-ats.onrender.com` |

All business APIs live under `/api/...`. The frontend worker proxies `/api/*` to the Render backend — either base URL works for QA testing.

**Recommended for API-only testing:** use the QA frontend base so cookies/CORS match the app.

```
QA_API_BASE=https://qa.stitch-ats.in
```

---

## Authentication & keys

This app does **not** use a single global API key for staff/candidate/vendor APIs. Access is JWT-based after login.

### 1. JWT session token (primary — 157 endpoints)

| Item | Value |
|------|-------|
| **How to obtain** | `POST /api/auth/login` with email + password |
| **Header** | `Authorization: Bearer <token>` |
| **Lifetime** | ~7 days |
| **Response field** | `token` in JSON body |

**Login example (QA):**

```bash
curl -s -X POST "$QA_API_BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"recruiter@stitch-ats.in","password":"password"}'
```

Save `token` from the response and pass it on all authenticated requests:

```bash
curl -s "$QA_API_BASE/api/auth/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Microsoft 365 integration API key (4 endpoints)

| Item | Value |
|------|-------|
| **Env var (server)** | `M365_INTEGRATION_API_KEY` |
| **Header** | `X-Integration-Api-Key: <value>` |
| **Who has the value** | QA lead / DevOps (Render staging: `stitch-ats-api-staging`) |
| **Routes** | `/api/integrations/m365/*` only |

**Do not commit this key to git or bug reports.**

```bash
curl -s "$QA_API_BASE/api/integrations/m365/status" \
  -H "X-Integration-Api-Key: YOUR_M365_INTEGRATION_API_KEY"
```

### 3. Public endpoints (no auth)

| Endpoint | Notes |
|----------|-------|
| `GET /` | Service info |
| `GET /api/health` | Health check |
| `POST /api/auth/login` | Returns JWT |
| `POST /api/auth/register-candidate` | Returns JWT |
| `POST /api/auth/forgot-password` | Rate-limited |
| `POST /api/auth/reset-password` | Rate-limited |

---

## QA test accounts (staging)

After `npm run db:setup-staging`, demo users are seeded. **Password for demo accounts:** `password` (unless rotated).

| Role | Email (primary) | Login via |
|------|-----------------|-----------|
| SUPER_ADMIN | `superadmin@stitch-ats.in` | Staff login |
| ADMIN | `admin@stitch-ats.in` | Staff login |
| HR_HEAD | `hrhead@stitch-ats.in` | Staff login |
| HR_MANAGER | `hrmanager@stitch-ats.in` | Staff login |
| RECRUITER | `recruiter@stitch-ats.in` | Staff login |
| TEAM_LEAD | `teamlead@stitch-ats.in` | Staff login |
| HIRING_MANAGER | `hiringmanager@stitch-ats.in` | Staff login |
| INTERVIEWER | `interviewer@stitch-ats.in` | Staff login |
| VENDOR | `vendor@stitch-ats.in` | Staff login (lands vendor portal) |
| EMPLOYEE | `employee@stitch-ats.in` | Referral portal login |
| CANDIDATE | `candidate@stitch-ats.in` | Candidate portal login |

**Bootstrap admin (staging only):** `qa-admin@stitch-ats.in` — password set via `QA_ADMIN_PASSWORD` during setup.

**More seeded emails:** `server/src/config/devUsers.registry.json` (5 users per role).

**Production:** accounts must be provisioned by a Super Admin — see [TESTER_SETUP.md](./TESTER_SETUP.md). Do not use demo passwords on production.

---

## Role shorthand (used in tables below)

| Label | Roles |
|-------|-------|
| **Internal** | SUPER_ADMIN, ADMIN, HR_HEAD, HR_MANAGER, FINANCE_HEAD, RECRUITER, TEAM_LEAD, HIRING_MANAGER, INTERVIEWER |
| **Staff mutate** | SUPER_ADMIN, ADMIN, HR_HEAD, HR_MANAGER, RECRUITER, TEAM_LEAD |
| **Offer roles** | SUPER_ADMIN, ADMIN, HR_HEAD, HR_MANAGER, RECRUITER, TEAM_LEAD |
| **Offer HR approvers** | HR_HEAD, SUPER_ADMIN, ADMIN |
| **Offer exec approvers** | SUPER_ADMIN, ADMIN |
| **Interview schedulers** | SUPER_ADMIN, ADMIN, HR_HEAD, HR_MANAGER, RECRUITER, TEAM_LEAD, HIRING_MANAGER |
| **Interview plan editors** | SUPER_ADMIN, ADMIN, HR_HEAD, HR_MANAGER, TEAM_LEAD, RECRUITER |
| **Req approvers** | HR_HEAD, SUPER_ADMIN, ADMIN |
| **Posting control** | SUPER_ADMIN, ADMIN, HR_HEAD, HR_MANAGER, TEAM_LEAD, HIRING_MANAGER |
| **Hiring stage edit** | RECRUITER, HR_MANAGER, TEAM_LEAD |
| **Portal visibility** | SUPER_ADMIN, ADMIN, HR_HEAD, HR_MANAGER, TEAM_LEAD |
| **Vendor managers** | ADMIN, HR_HEAD, HR_MANAGER, RECRUITER, TEAM_LEAD |
| **Compensation editors** | FINANCE_HEAD, SUPER_ADMIN, ADMIN |
| **Letter template editors** | HR_HEAD, SUPER_ADMIN, ADMIN |
| **Referral portal** | Any role except CANDIDATE, VENDOR (includes EMPLOYEE + all internal staff) |

`SUPER_ADMIN` bypasses all role checks.

---

## Endpoint catalog

Replace `{base}` with your API base (e.g. `https://qa.stitch-ats.in`).  
Replace path params (`:id`, `:requirementId`, etc.) with real UUIDs from prior responses.

### Root & health (2) — no auth

| Method | URL | Auth |
|--------|-----|------|
| GET | `{base}/` | None |
| GET | `{base}/api/health` | None |

---

### Auth — `/api/auth` (6)

| Method | URL | Auth | Min role / notes |
|--------|-----|------|------------------|
| POST | `{base}/api/auth/register-candidate` | None | Creates CANDIDATE + returns JWT |
| POST | `{base}/api/auth/login` | None | Returns JWT |
| GET | `{base}/api/auth/me` | JWT | Any active user |
| POST | `{base}/api/auth/change-password` | JWT | Any active user |
| POST | `{base}/api/auth/forgot-password` | None | Rate-limited |
| POST | `{base}/api/auth/reset-password` | None | Rate-limited |

---

### Users — `/api/users` (12)

| Method | URL | Auth | Min role / notes |
|--------|-----|------|------------------|
| GET | `{base}/api/users` | JWT | ADMIN, HR_HEAD, HR_MANAGER, RECRUITER, TEAM_LEAD, HIRING_MANAGER, INTERVIEWER |
| POST | `{base}/api/users` | JWT | SUPER_ADMIN, ADMIN |
| PATCH | `{base}/api/users/me` | JWT | Self (any authenticated user) |
| GET | `{base}/api/users/:id/login-history` | JWT | SUPER_ADMIN |
| GET | `{base}/api/users/:id` | JWT | SUPER_ADMIN |
| PATCH | `{base}/api/users/:id` | JWT | SUPER_ADMIN |
| POST | `{base}/api/users/:id/send-password-reset-link` | JWT | SUPER_ADMIN |
| POST | `{base}/api/users/:id/reset-password` | JWT | SUPER_ADMIN |
| PATCH | `{base}/api/users/:id/tags` | JWT | SUPER_ADMIN |
| PATCH | `{base}/api/users/:id/role` | JWT | SUPER_ADMIN |
| PATCH | `{base}/api/users/:id/status` | JWT | SUPER_ADMIN |
| DELETE | `{base}/api/users/:id` | JWT | SUPER_ADMIN |

---

### Business requirements — `/api/business-requirements` (6)

Pre-hiring client discussions. Not visible in the hiring requirements list until **Open to hiring** creates a linked `Requirement` in `PENDING_APPROVAL`.

| Method | URL | Auth | Min role / notes |
|--------|-----|------|------------------|
| GET | `{base}/api/business-requirements` | JWT | ACCOUNT_MANAGER, HIRING_MANAGER, ADMIN, SUPER_ADMIN (scoped) |
| POST | `{base}/api/business-requirements` | JWT | Same mutate roles |
| GET | `{base}/api/business-requirements/:id` | JWT | Mutate roles + HR_HEAD, HR_MANAGER (read preview) |
| PATCH | `{base}/api/business-requirements/:id` | JWT | Mutate roles (ACTIVE only) |
| PATCH | `{base}/api/business-requirements/:id/stage` | JWT | Mutate roles; stage change notifies account manager, hiring manager, and Super Admin |
| POST | `{base}/api/business-requirements/:id/open-to-hiring` | JWT | Mutate roles; requires `CONFIRMED` stage |

**Stages (fixed):** Initial Discussion (10%) → Proposal Sent (25%) → Negotiation (50%) → SOW Signed (75%) → Confirmed (100%).

---

### Requirements — `/api/requirements` (21)

| Method | URL | Auth | Min role / notes |
|--------|-----|------|------------------|
| GET | `{base}/api/requirements` | JWT | Internal (scoped by role) |
| GET | `{base}/api/requirements/pending` | JWT | Internal |
| POST | `{base}/api/requirements/parse-job-description` | JWT | Staff mutate + HIRING_MANAGER; multipart or JSON |
| GET | `{base}/api/requirements/:id/matching-profiles` | JWT | Internal + requirement access |
| POST | `{base}/api/requirements/:id/link-candidate` | JWT | Staff mutate |
| GET | `{base}/api/requirements/:id/interview-plan` | JWT | Internal + requirement access |
| PUT | `{base}/api/requirements/:id/interview-plan` | JWT | Interview plan editors |
| GET | `{base}/api/requirements/:id/interview-plan/candidate/:candidateId/progress` | JWT | Internal + access |
| GET | `{base}/api/requirements/:id` | JWT | Internal + requirement access |
| POST | `{base}/api/requirements` | JWT | Staff mutate + HIRING_MANAGER |
| PATCH | `{base}/api/requirements/:id` | JWT | Staff mutate + HIRING_MANAGER |
| PATCH | `{base}/api/requirements/:id/status` | JWT | Posting control |
| PATCH | `{base}/api/requirements/:id/hiring-stage` | JWT | Hiring stage edit |
| POST | `{base}/api/requirements/:id/cancel` | JWT | Posting control |
| PATCH | `{base}/api/requirements/:id/visibility` | JWT | Portal visibility |
| PATCH | `{base}/api/requirements/:id/referral-visibility` | JWT | Portal visibility |
| POST | `{base}/api/requirements/:id/approve` | JWT | Req approvers |
| POST | `{base}/api/requirements/:id/reject` | JWT | Req approvers |
| POST | `{base}/api/requirements/:id/assign-recruiter` | JWT | Staff mutate |
| DELETE | `{base}/api/requirements/:id/assign-recruiter/:recruiterId` | JWT | Staff mutate |
| DELETE | `{base}/api/requirements/:id` | JWT | ADMIN |

---

### Candidates — `/api/candidates` (12)

| Method | URL | Auth | Min role / notes |
|--------|-----|------|------------------|
| GET | `{base}/api/candidates` | JWT | Internal (INTERVIEWER blocked) |
| GET | `{base}/api/candidates/by-requirement/:requirementId` | JWT | Internal + access |
| POST | `{base}/api/candidates/parse-resume` | JWT | Staff mutate; multipart |
| GET | `{base}/api/candidates/check-email` | JWT | Internal |
| GET | `{base}/api/candidates/:id/resume` | JWT | Internal + candidate access |
| POST | `{base}/api/candidates/:id/resume` | JWT | Staff mutate; multipart |
| DELETE | `{base}/api/candidates/:id/resume` | JWT | Internal + access |
| GET | `{base}/api/candidates/:id` | JWT | Internal + candidate access |
| POST | `{base}/api/candidates` | JWT | Staff mutate |
| PATCH | `{base}/api/candidates/:id` | JWT | Staff mutate |
| PATCH | `{base}/api/candidates/:id/status` | JWT | Staff mutate |
| DELETE | `{base}/api/candidates/:id` | JWT | ADMIN |

---

### Interviews — `/api/interviews` (8)

| Method | URL | Auth | Min role / notes |
|--------|-----|------|------------------|
| GET | `{base}/api/interviews` | JWT | Internal (scoped) |
| GET | `{base}/api/interviews/by-candidate/:candidateId` | JWT | Internal + access |
| GET | `{base}/api/interviews/:id/candidate-resume` | JWT | Internal + access |
| GET | `{base}/api/interviews/:id` | JWT | Internal + access |
| POST | `{base}/api/interviews` | JWT | Interview schedulers |
| PATCH | `{base}/api/interviews/:id` | JWT | Interview schedulers |
| PATCH | `{base}/api/interviews/:id/status` | JWT | Interview schedulers |
| DELETE | `{base}/api/interviews/:id` | JWT | ADMIN |

---

### Offers — `/api/offers` (22)

| Method | URL | Auth | Min role / notes |
|--------|-----|------|------------------|
| GET | `{base}/api/offers/pending` | JWT | Offer roles |
| POST | `{base}/api/offers/preview-compensation` | JWT | Offer roles |
| GET | `{base}/api/offers` | JWT | Offer roles |
| GET | `{base}/api/offers/by-candidate/:candidateId` | JWT | Offer roles + access |
| GET | `{base}/api/offers/:id/letter` | JWT | Offer roles + access |
| GET | `{base}/api/offers/:id/letter/pdf` | JWT | Offer roles + access |
| GET | `{base}/api/offers/:id` | JWT | Offer roles + access |
| POST | `{base}/api/offers` | JWT | Offer roles |
| PATCH | `{base}/api/offers/:id` | JWT | Offer roles |
| POST | `{base}/api/offers/:id/submit` | JWT | Offer roles |
| POST | `{base}/api/offers/:id/approve-hr` | JWT | Offer HR approvers |
| POST | `{base}/api/offers/:id/approve-exec` | JWT | Offer exec approvers |
| POST | `{base}/api/offers/:id/approve-stage` | JWT | Internal |
| POST | `{base}/api/offers/:id/reject` | JWT | HR/exec approvers + Internal |
| POST | `{base}/api/offers/:id/rollback-approval` | JWT | SUPER_ADMIN |
| POST | `{base}/api/offers/:id/send` | JWT | Offer roles |
| POST | `{base}/api/offers/:id/withdraw` | JWT | Offer roles |
| POST | `{base}/api/offers/:id/negotiate` | JWT | Offer roles |
| POST | `{base}/api/offers/:id/revise` | JWT | Offer roles |
| POST | `{base}/api/offers/:id/accept` | JWT | Offer roles |
| POST | `{base}/api/offers/:id/decline` | JWT | Offer roles |
| DELETE | `{base}/api/offers/:id` | JWT | ADMIN |

---

### Feedback — `/api/feedback` (6)

| Method | URL | Auth | Min role / notes |
|--------|-----|------|------------------|
| GET | `{base}/api/feedback/by-interview/:interviewId` | JWT | Internal + access |
| GET | `{base}/api/feedback/by-candidate/:candidateId` | JWT | Internal + access |
| GET | `{base}/api/feedback/:id/download` | JWT | Internal + access |
| GET | `{base}/api/feedback/:id` | JWT | Internal + access |
| POST | `{base}/api/feedback` | JWT | Internal (typically INTERVIEWER) |
| DELETE | `{base}/api/feedback/:id` | JWT | ADMIN |

---

### Activity logs — `/api/activity-logs` (3)

| Method | URL | Auth | Min role / notes |
|--------|-----|------|------------------|
| GET | `{base}/api/activity-logs` | JWT | Internal |
| GET | `{base}/api/activity-logs/entity/:entityId` | JWT | Internal |
| POST | `{base}/api/activity-logs` | JWT | Internal |

---

### Search — `/api/search` (1)

| Method | URL | Auth | Min role / notes |
|--------|-----|------|------------------|
| GET | `{base}/api/search` | JWT | Internal; query param `q` |

---

### Candidate portal — `/api/portal` (12)

| Method | URL | Auth | Min role / notes |
|--------|-----|------|------------------|
| PUT | `{base}/api/portal/profile` | JWT | CANDIDATE |
| POST | `{base}/api/portal/profile/resume` | JWT | CANDIDATE; multipart |
| GET | `{base}/api/portal/positions` | JWT | CANDIDATE |
| GET | `{base}/api/portal/positions/:id` | JWT | CANDIDATE |
| POST | `{base}/api/portal/positions/:id/apply` | JWT | CANDIDATE |
| GET | `{base}/api/portal/applications` | JWT | CANDIDATE |
| GET | `{base}/api/portal/applications/:requirementId` | JWT | CANDIDATE |
| GET | `{base}/api/portal/me` | JWT | CANDIDATE |
| GET | `{base}/api/portal/offers/:id` | JWT | CANDIDATE |
| GET | `{base}/api/portal/offers/:id/letter/pdf` | JWT | CANDIDATE |
| POST | `{base}/api/portal/offers/:id/accept` | JWT | CANDIDATE |
| POST | `{base}/api/portal/offers/:id/decline` | JWT | CANDIDATE |

---

### Vendors (staff) — `/api/vendors` (7)

| Method | URL | Auth | Min role / notes |
|--------|-----|------|------------------|
| GET | `{base}/api/vendors` | JWT | Vendor managers |
| GET | `{base}/api/vendors/:id` | JWT | Vendor managers |
| POST | `{base}/api/vendors` | JWT | Vendor managers |
| PATCH | `{base}/api/vendors/:id` | JWT | Vendor managers |
| POST | `{base}/api/vendors/:id/assignments` | JWT | Vendor managers |
| DELETE | `{base}/api/vendors/:id/assignments/:requirementId` | JWT | Vendor managers |
| POST | `{base}/api/vendors/:id/invite` | JWT | Vendor managers |

---

### Vendor portal — `/api/vendor-portal` (8)

| Method | URL | Auth | Min role / notes |
|--------|-----|------|------------------|
| GET | `{base}/api/vendor-portal/me` | JWT | VENDOR |
| GET | `{base}/api/vendor-portal/positions` | JWT | VENDOR |
| GET | `{base}/api/vendor-portal/positions/:id` | JWT | VENDOR |
| POST | `{base}/api/vendor-portal/parse-resume` | JWT | VENDOR; multipart |
| GET | `{base}/api/vendor-portal/check-email` | JWT | VENDOR |
| GET | `{base}/api/vendor-portal/submissions` | JWT | VENDOR |
| POST | `{base}/api/vendor-portal/positions/:id/submit` | JWT | VENDOR |
| POST | `{base}/api/vendor-portal/submissions/:candidateId/resume` | JWT | VENDOR; multipart |

---

### Referral portal — `/api/referral-portal` (10)

| Method | URL | Auth | Min role / notes |
|--------|-----|------|------------------|
| GET | `{base}/api/referral-portal/me` | JWT | Referral portal |
| GET | `{base}/api/referral-portal/positions` | JWT | Referral portal |
| GET | `{base}/api/referral-portal/positions/departments` | JWT | Referral portal |
| GET | `{base}/api/referral-portal/positions/:id` | JWT | Referral portal |
| GET | `{base}/api/referral-portal/referrals` | JWT | Referral portal |
| GET | `{base}/api/referral-portal/referrals/:id` | JWT | Referral portal |
| POST | `{base}/api/referral-portal/parse-resume` | JWT | Referral portal; multipart |
| GET | `{base}/api/referral-portal/check-email` | JWT | Referral portal |
| POST | `{base}/api/referral-portal/positions/:id/submit` | JWT | Referral portal |
| POST | `{base}/api/referral-portal/referrals/:candidateId/resume` | JWT | Referral portal; multipart |

---

### Skills — `/api/skills` (4)

| Method | URL | Auth | Min role / notes |
|--------|-----|------|------------------|
| GET | `{base}/api/skills` | JWT | Internal |
| POST | `{base}/api/skills` | JWT | ADMIN |
| DELETE | `{base}/api/skills/:id` | JWT | ADMIN |
| POST | `{base}/api/skills/seed-defaults` | JWT | ADMIN |

---

### Departments — `/api/departments` (4)

| Method | URL | Auth | Min role / notes |
|--------|-----|------|------------------|
| GET | `{base}/api/departments` | JWT | Internal |
| POST | `{base}/api/departments` | JWT | ADMIN |
| DELETE | `{base}/api/departments/:id` | JWT | ADMIN |
| POST | `{base}/api/departments/seed-defaults` | JWT | ADMIN |

---

### Clients — `/api/clients` (4)

| Method | URL | Auth | Min role / notes |
|--------|-----|------|------------------|
| GET | `{base}/api/clients` | JWT | Internal |
| POST | `{base}/api/clients` | JWT | ADMIN |
| DELETE | `{base}/api/clients/:id` | JWT | ADMIN |
| POST | `{base}/api/clients/seed-defaults` | JWT | ADMIN |

---

### Role access — `/api/role-access` (5)

| Method | URL | Auth | Min role / notes |
|--------|-----|------|------------------|
| GET | `{base}/api/role-access/definitions` | JWT | SUPER_ADMIN |
| GET | `{base}/api/role-access/me` | JWT | Any authenticated user |
| GET | `{base}/api/role-access` | JWT | SUPER_ADMIN |
| PUT | `{base}/api/role-access/:role` | JWT | SUPER_ADMIN |
| POST | `{base}/api/role-access/:role/reset` | JWT | SUPER_ADMIN |

---

### Interview panels — `/api/interview-panels` (3)

| Method | URL | Auth | Min role / notes |
|--------|-----|------|------------------|
| GET | `{base}/api/interview-panels` | JWT | Internal |
| POST | `{base}/api/interview-panels/seed` | JWT | ADMIN |
| PUT | `{base}/api/interview-panels/:id` | JWT | ADMIN |

---

### Offer settings — `/api/offer-settings` (7)

| Method | URL | Auth | Min role / notes |
|--------|-----|------|------------------|
| GET | `{base}/api/offer-settings/compensation` | JWT | Compensation/letter editors, HR_MANAGER, TEAM_LEAD |
| PUT | `{base}/api/offer-settings/compensation` | JWT | Compensation editors |
| POST | `{base}/api/offer-settings/compensation/preview` | JWT | Compensation editors |
| GET | `{base}/api/offer-settings/letter-template` | JWT | Letter template editors, HR_MANAGER |
| PUT | `{base}/api/offer-settings/letter-template` | JWT | Letter template editors |
| POST | `{base}/api/offer-settings/letter-template/preview` | JWT | Letter template editors |
| POST | `{base}/api/offer-settings/letter-template/reset` | JWT | Letter template editors |

---

### Microsoft 365 integration — `/api/integrations/m365` (4)

| Method | URL | Auth | Min role / notes |
|--------|-----|------|------------------|
| GET | `{base}/api/integrations/m365/setup-guide` | Integration key | IT / DevOps |
| GET | `{base}/api/integrations/m365/status` | Integration key | IT / DevOps |
| POST | `{base}/api/integrations/m365/test-connection` | Integration key | IT / DevOps |
| POST | `{base}/api/integrations/m365/test-email` | Integration key | IT / DevOps; body `{ "to": "you@example.com" }` |

---

## Suggested QA test order

1. `GET /api/health` — confirm environment is up
2. `POST /api/auth/login` — obtain JWT per role you need
3. `GET /api/auth/me` — confirm token and role
4. Exercise module APIs for your test case (requirements → candidates → interviews → offers)
5. Portal APIs with CANDIDATE / VENDOR / EMPLOYEE tokens
6. M365 integration APIs last (requires integration key from QA lead)

---

## Multipart upload endpoints

These expect `multipart/form-data` with a resume file field (max 5 MB, PDF/DOCX):

| URL |
|-----|
| `POST /api/candidates/parse-resume` |
| `POST /api/candidates/:id/resume` |
| `POST /api/requirements/parse-job-description` |
| `POST /api/portal/profile/resume` |
| `POST /api/vendor-portal/parse-resume` |
| `POST /api/vendor-portal/submissions/:candidateId/resume` |
| `POST /api/referral-portal/parse-resume` |
| `POST /api/referral-portal/referrals/:candidateId/resume` |

---

## Common HTTP status codes

| Code | Meaning |
|------|---------|
| 200 / 201 | Success |
| 400 | Validation error |
| 401 | Missing/invalid JWT or integration key |
| 403 | Forbidden (wrong role or no data access) |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate email) |
| 422 | Unprocessable (e.g. resume parse failed) |
| 429 | Rate limit (auth endpoints) |
| 503 | Database unavailable or integration not configured |

---

## Related documents

- [`openapi.yaml`](./openapi.yaml) — OpenAPI 3.0 / Swagger spec (167 operations, schemas, auth)
- [STAGING_ENVIRONMENT.md](./STAGING_ENVIRONMENT.md) — QA URLs, email setup, `M365_INTEGRATION_API_KEY`
- [TESTER_SETUP.md](./TESTER_SETUP.md) — production credentials, conventions
- [ROLES_AND_ACCESS.md](./ROLES_AND_ACCESS.md) — UI-level permissions
- [REGRESSION_CHECKLIST.md](./REGRESSION_CHECKLIST.md) — smoke tests after deploy
