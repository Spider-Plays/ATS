import { execSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')

// Leave VITE_API_BASE_URL unset — Cloudflare Pages function (functions/api) proxies /api to Render.
rmSync(distDir, { recursive: true, force: true })

execSync('vite build', { cwd: root, stdio: 'inherit' })
execSync('node scripts/strip-dist-redirects.mjs --pages', { cwd: root, stdio: 'inherit' })
