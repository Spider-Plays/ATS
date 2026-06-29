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

## QA / Testing

Production UAT documentation for testers lives in [`docs/qa/`](docs/qa/). Start with [docs/qa/README.md](docs/qa/README.md) for the full index (mind map, application flows, test plan, scenarios, test cases, and regression checklists).
