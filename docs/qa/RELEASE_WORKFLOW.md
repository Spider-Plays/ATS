# QA → Production Release Workflow

Test new code on **https://qa.stitch-ats.in** first, then release to **https://stitch-ats.in**.

---

## Branch map

| Git branch | Frontend (Cloudflare) | API (Render) | Database (Neon) |
|------------|----------------------|--------------|-----------------|
| **`qa`** | Worker `ats-qa` → qa.stitch-ats.in | Staging service → ats-0dtj.onrender.com | `qa` branch |
| **`main`** | Worker `ats` → stitch-ats.in | Production service → stitch-ats.onrender.com | `production` branch |

---

## Develop and test (QA)

```bash
git checkout qa
git pull origin qa
# … edit, commit …
git push origin qa
```

Cloudflare **`ats-qa`** and Render **staging API** deploy automatically from **`qa`**.

- **Render (API):** auto-deploys on push to `qa` when the Render service is connected to GitHub.
- **Cloudflare (frontend):** use **GitHub Actions** (`.github/workflows/deploy-qa-worker.yml`) or **Workers Builds** in the dashboard — git push alone does not deploy the worker unless one of these is configured.

Verify frontend build matches your commit:

```bash
curl -s https://qa.stitch-ats.in/build-id.txt
git rev-parse HEAD   # should match (first 7+ chars)
```

Verify API build:

```bash
curl -s https://qa.stitch-ats.in/api/health
```

Verify: https://qa.stitch-ats.in

---

## Release to production

After QA sign-off:

```bash
git checkout main
git pull origin main
git merge qa
git push origin main
```

Cloudflare **`ats`** and Render **production API** deploy from **`main`** only.

Keep **`qa`** in sync after a release:

```bash
git checkout qa
git merge main
git push origin qa
```

---

## Cloudflare dashboard (one-time)

| Worker | Build branch | Non-production builds |
|--------|--------------|------------------------|
| **`ats`** | `main` | Off |
| **`ats-qa`** | `main` (default) | **On** — deploys `qa` branch only |

**Recommended:** GitHub Actions (see below). If using Workers Builds instead:

| Setting | Value |
|---------|--------|
| Root directory | `/` (repo root) |
| Build command | `npm ci && npm run deploy:worker:qa` |
| Wrangler config | `wrangler.qa.toml` (worker name `ats-qa`) |

Deploy command for **`ats-qa`**: `npm run deploy:worker:qa`

### GitHub Actions (recommended)

Add repository secrets (Settings → Secrets → Actions):

| Secret | How to get it |
|--------|----------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens → Create Token → **Edit Cloudflare Workers** template |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → Workers & Pages → right sidebar **Account ID** |

Workflow: `.github/workflows/deploy-qa-worker.yml` — runs on push to `qa` when frontend files change.

### Troubleshooting QA frontend not updating

1. Compare `https://qa.stitch-ats.in/build-id.txt` with `git rev-parse HEAD` on `qa`.
2. If API health `buildId` is newer than `build-id.txt`, only Render deployed — redeploy the worker.
3. Hard-refresh the browser (Ctrl+Shift+R). Assets are content-hashed; stale UI usually means the worker was not redeployed.
4. Manual deploy from your machine: `npx wrangler login` then `npm run deploy:worker:qa`.
5. Dashboard manual deploy must build from the **`qa` branch**, not `main`.

---

## Render dashboard (one-time)

| Service | Branch |
|---------|--------|
| Production API | **`main`** |
| Staging API (`ats-0dtj`) | **`qa`** |

---

## Manual deploy (optional)

```bash
npm run deploy:worker:qa   # QA frontend
npm run deploy:worker      # Production frontend
```

Verify: `npm run verify:qa-staging`
