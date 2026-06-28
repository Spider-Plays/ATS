# AGENTS.md

## Stack

- **Database:** Neon Postgres (`DATABASE_URL` in `server/.env`)
- **API:** Express on Render (`server/render.yaml`, root directory `server`)
- **Frontend:** Vite/React on Cloudflare Pages (`npm run build:client` → `dist`; `functions/api` proxies `/api` via `API_ORIGIN` in `wrangler.toml`). Production: `npm run deploy:pages`. Dev/preview: `npm run deploy:pages:preview` or push a non-production branch.
