# AGENTS.md

## Stack

- **Database:** Neon Postgres (`DATABASE_URL` in `server/.env`)
- **API:** Express on Render (`server/render.yaml`, root directory `server`)
- **Frontend:** Vite/React on Cloudflare Pages (`npm run build:client` → `dist`; set `VITE_API_BASE_URL` to your Render API URL)
