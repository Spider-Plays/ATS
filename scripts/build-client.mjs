import { execSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')

// Production default when Cloudflare Pages env is unset (direct API; avoids broken /api proxy on POST).
process.env.VITE_API_BASE_URL ??= 'https://stitch-ats.onrender.com'

// Cloudflare build cache can restore an old dist/ that still contains _redirects.
rmSync(distDir, { recursive: true, force: true })

execSync('vite build', { cwd: root, stdio: 'inherit' })
