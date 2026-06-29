# AGENTS.md

## Stack

- **Database:** Neon Postgres (`DATABASE_URL` in `server/.env`)
- **API:** Express on Render (`server/render.yaml`, root directory `server`)
- **Frontend:** Vite/React on Cloudflare Workers. Production: worker **`ats`** → `stitch-ats.in` (branch **`main`**). QA: worker **`ats-qa`** → `qa.stitch-ats.in` (branch **`qa`**). Deploy: `npm run deploy:worker` / `npm run deploy:worker:qa`. Release workflow: [docs/qa/RELEASE_WORKFLOW.md](docs/qa/RELEASE_WORKFLOW.md).
