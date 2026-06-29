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

Deploy command for **`ats-qa`**: `npm run deploy:worker:qa`

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
