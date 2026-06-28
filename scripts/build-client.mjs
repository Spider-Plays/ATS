import { execSync } from 'node:child_process'
import { existsSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')
const redirectsPath = path.join(distDir, '_redirects')
const assetsIgnorePath = path.join(distDir, '.assetsignore')

// Defaults for production builds when CI env vars are missing (anon key must still come from CI).
process.env.VITE_API_BASE_URL ??=
  'https://stitch-ats-api-6dd11de4-0043-4523-80ec-1b8755a5d51c.fly.dev'
process.env.VITE_INSFORGE_URL ??= 'https://3ixy53ge.ap-southeast.insforge.app'

// Cloudflare build cache can restore an old dist/ that still contains _redirects.
rmSync(distDir, { recursive: true, force: true })

execSync('vite build', { cwd: root, stdio: 'inherit' })

if (existsSync(redirectsPath)) {
  unlinkSync(redirectsPath)
  console.log('Removed dist/_redirects (not supported on Cloudflare Workers).')
}

// Tell Wrangler to skip _redirects even if build cache restores it before deploy.
writeFileSync(assetsIgnorePath, '_redirects\n', 'utf8')
