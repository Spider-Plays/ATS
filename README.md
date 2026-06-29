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

Isolated QA environment at **https://qa.stitch-ats.in** — separate Neon database, staging Render API, and Cloudflare Pages preview. Production (`stitch-ats.in`) is untouched.

| Component | Production | QA staging |
|-----------|------------|------------|
| Frontend | `stitch-ats.in` (branch `main`) | `qa.stitch-ats.in` (branch `qa`) |
| API | `stitch-ats-api` on Render | `stitch-ats-api-staging` on Render |
| Database | Neon `main` branch | Neon `staging` branch |
| Pages `API_ORIGIN` | Production env var → prod API | Preview env var → staging API |

### One-time infrastructure setup

**1. Neon — staging branch**

1. Neon console → your project → **Branches** → create branch `staging` from `main` (or empty).
2. Copy the **pooled** connection string for the branch.

```powershell
$env:STAGING_DATABASE_URL="postgresql://...@ep-xxx-pooler....neon.tech/neondb?sslmode=require"
$env:QA_ADMIN_PASSWORD="<secure-password>"
npm run db:setup-staging
```

Demo staff accounts use password `password` (see `server/src/config/devUsers.registry.json`). Bootstrap admin: `qa-admin@stitch-ats.in` when `QA_ADMIN_PASSWORD` is set.

**2. Render — staging API**

Blueprint in [`server/render.yaml`](server/render.yaml) defines `stitch-ats-api-staging`. In the Render dashboard:

- Apply blueprint or create the service manually (root dir `server`, same build/start as production).
- Set secrets: `DATABASE_URL` (staging Neon branch), `JWT_SECRET` (new value — not production).
- Confirm health: `https://stitch-ats-api-staging.onrender.com/api/health`

**3. Cloudflare Pages**

| Setting | Value |
|---------|-------|
| Production branch | `main` |
| Preview deployments | Enabled; auto-build branch `qa` |
| **Preview** env var `API_ORIGIN` | `https://stitch-ats-api-staging.onrender.com` |
| **Production** env var `API_ORIGIN` | `https://stitch-ats.onrender.com` |
| Custom domain (Preview) | `qa.stitch-ats.in` → your Pages project |

DNS: CNAME `qa` → `<project>.pages.dev` (Cloudflare shows the exact target when adding the custom domain).

Optional: [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/) on `qa.stitch-ats.in` to restrict the site to your team.

### QA deploy workflow

Push or merge to the `qa` branch — Cloudflare builds a preview deployment automatically.

Manual deploy:

```bash
npm run deploy:pages:qa
```

After infrastructure is live, verify:

```bash
npm run verify:qa-staging
```

Tester documentation: [docs/qa/STAGING_ENVIRONMENT.md](docs/qa/STAGING_ENVIRONMENT.md).


## QA / Testing

Production UAT documentation for testers lives in [`docs/qa/`](docs/qa/). Start with [docs/qa/README.md](docs/qa/README.md) for the full index (mind map, application flows, test plan, scenarios, test cases, and regression checklists).

**QA staging** (isolated environment): [docs/qa/STAGING_ENVIRONMENT.md](docs/qa/STAGING_ENVIRONMENT.md) — https://qa.stitch-ats.in
