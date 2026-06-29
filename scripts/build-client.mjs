import { execSync } from 'node:child_process'
import { rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')

// Leave VITE_API_BASE_URL unset — Cloudflare Pages function (functions/api) proxies /api to Render.
rmSync(distDir, { recursive: true, force: true })

const buildId =
  process.env.WORKERS_CI_COMMIT_SHA ||
  process.env.WORKERS_CI_BUILD_UUID ||
  process.env.RENDER_GIT_COMMIT ||
  process.env.GIT_COMMIT ||
  String(Date.now())

execSync('vite build', {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, VITE_APP_BUILD_ID: buildId },
})
// Workers: SPA fallback is in wrangler.toml; _redirects causes deploy error 100324.
execSync('node scripts/strip-dist-redirects.mjs', { cwd: root, stdio: 'inherit' })

// Bust Workers asset cache so each CI build uploads fresh bundles.
writeFileSync(path.join(distDir, 'build-id.txt'), `${buildId}\n`, 'utf8')
