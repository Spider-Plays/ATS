import { existsSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const distDir = path.join(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  'dist'
)
const redirectsPath = path.join(distDir, '_redirects')

if (existsSync(redirectsPath)) {
  unlinkSync(redirectsPath)
}

// SPA fallback for Cloudflare Pages; /api is proxied by functions/api instead.
writeFileSync(redirectsPath, '/* /index.html 200\n', 'utf8')
console.log('Wrote dist/_redirects (SPA fallback for Cloudflare Pages).')
