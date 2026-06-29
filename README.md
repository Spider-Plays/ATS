# Stitch ATS

React frontend + Node.js API with Prisma (PostgreSQL in production).

## Architecture

| Layer | Tech |
|--------|------|
| **Client** | React 18, Vite, TanStack Query, Tailwind |
| **API** | Express, JWT auth, Zod validation |
| **Database** | Prisma ORM + PostgreSQL (Neon) |

## Quick start

```bash
npm install
cd server && npm install && cd ..

# IMPORTANT: server/.env DATABASE_URL must be your NEON URL (same as Render).
cp server/.env.example server/.env

npm run db:setup --prefix server
npm run db:verify --prefix server

npm run dev
```

Open http://localhost:3000.

## Production (Cloudflare Pages + Render + Neon)

### Render (API)

- Root directory: `server`
- Build: `npm install && npm run build`
- Start: `npm run start:deploy`
- Env: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN` (your Cloudflare/custom domain URLs)

### Cloudflare Pages (frontend)

- Build: `npm run build:client`
- Output: `dist`
- Leave `VITE_API_BASE_URL` empty — `functions/api` proxies `/api` to Render (see `API_ORIGIN` in `wrangler.toml`).

**Production** — deploy from your production branch (e.g. `main`):

```bash
npm run deploy:pages
```

**Dev / preview** — Cloudflare Pages uses **Preview** as the dev stage. Deploy from a non-production branch (e.g. `dev`):

```bash
npm run deploy:pages:preview
```

Or connect the repo in the Cloudflare dashboard: set **Production branch** to `main` and push to any other branch for automatic preview URLs (`*.pages.dev`).

Preview-specific API URL: edit `[env.preview.vars] API_ORIGIN` in `wrangler.toml`, or set `API_ORIGIN` under **Settings → Environment variables → Preview** in the dashboard.

## QA staging (full stack)

Isolated QA at **https://qa.stitch-ats.in** — separate Neon DB, staging Render API, and Cloudflare Worker **`ats-qa`**. Production **https://stitch-ats.in** uses worker **`ats`**.

| Component | Production | QA staging |
|-----------|------------|------------|
| Git branch | **`main`** | **`qa`** |
| Frontend | Worker `ats` → stitch-ats.in | Worker `ats-qa` → qa.stitch-ats.in |
| API | stitch-ats.onrender.com | ats-0dtj.onrender.com |
| Database | Neon `production` branch | Neon `qa` branch |
| Runtime var | `API_ORIGIN` → prod API | `API_ORIGIN` → staging API |

### Release workflow (test on QA, then production)

See **[docs/qa/RELEASE_WORKFLOW.md](docs/qa/RELEASE_WORKFLOW.md)** for the full guide.

```bash
# 1. Develop on qa branch → deploys qa.stitch-ats.in + staging API
git checkout qa
git push origin qa

# 2. After QA sign-off → deploy production
git checkout main
git merge qa
git push origin main
```

**Cloudflare:** worker `ats` builds **`main`** only; worker `ats-qa` builds **non-`main`** branches (`qa`).  
**Render:** production API → branch **`main`**; staging API → branch **`qa`**.

Manual deploy: `npm run deploy:worker:qa` (QA) or `npm run deploy:worker` (prod).  
Verify: `npm run verify:qa-staging`

Tester docs: [docs/qa/STAGING_ENVIRONMENT.md](docs/qa/STAGING_ENVIRONMENT.md)

### One-time infrastructure setup

**1. Neon** — create child branch `qa` from `production`, then:

```powershell
$env:STAGING_DATABASE_URL="postgresql://...@ep-xxx-pooler....neon.tech/neondb?sslmode=require"
$env:QA_ADMIN_PASSWORD="<secure-password>"
npm run db:setup-staging
```

**2. Render** — staging web service (root dir `server`), branch **`qa`**, env: staging `DATABASE_URL`, new `JWT_SECRET`, `CLIENT_ORIGIN=https://qa.stitch-ats.in,http://localhost:3000`, `APP_URL=https://qa.stitch-ats.in`.

**3. Cloudflare** — worker **`ats-qa`**, deploy `npm run deploy:worker:qa`, runtime `API_ORIGIN=https://ats-0dtj.onrender.com`, domain **`qa.stitch-ats.in`**. Production worker **`ats`** unchanged on **`main`**.


## QA / Testing

Production UAT documentation for testers lives in [`docs/qa/`](docs/qa/). Start with [docs/qa/README.md](docs/qa/README.md) for the full index (mind map, application flows, test plan, scenarios, test cases, and regression checklists).

**QA staging** (isolated environment): [docs/qa/STAGING_ENVIRONMENT.md](docs/qa/STAGING_ENVIRONMENT.md) — https://qa.stitch-ats.in
