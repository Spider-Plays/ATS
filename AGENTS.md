# AGENTS.md

## Stack

- **Database:** Neon Postgres (`DATABASE_URL` in `server/.env`)
- **API:** Express on Render (`server/render.yaml`, root directory `server`)
- **Frontend:** Vite/React on Cloudflare Pages (`npm run build:client` → `dist`; `functions/api` proxies `/api` via `API_ORIGIN`). Production: `npm run deploy:pages` → `stitch-ats.in`. **QA staging:** `npm run deploy:pages:qa` or push branch `qa` → `qa.stitch-ats.in` (Preview `API_ORIGIN` → `stitch-ats-api-staging` on Render). See README § QA staging.
