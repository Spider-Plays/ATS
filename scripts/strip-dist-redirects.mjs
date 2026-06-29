import { existsSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const forPages = process.argv.includes('--pages')
const distDir = path.join(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  'dist'
)
const redirectsPath = path.join(distDir, '_redirects')
const assetsIgnorePath = path.join(distDir, '.assetsignore')

if (forPages) {
  if (existsSync(redirectsPath)) unlinkSync(redirectsPath)
  writeFileSync(redirectsPath, '/* /index.html 200\n', 'utf8')
  console.log('Wrote dist/_redirects (SPA fallback for Cloudflare Pages).')
} else {
  if (existsSync(redirectsPath)) {
    unlinkSync(redirectsPath)
    console.log('Removed dist/_redirects (Workers use wrangler.toml SPA + worker/index.js for /api).')
  }
  writeFileSync(assetsIgnorePath, '_redirects\n', 'utf8')
}
