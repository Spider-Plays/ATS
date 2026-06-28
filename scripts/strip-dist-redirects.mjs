import { existsSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const distDir = path.join(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  'dist'
)
const redirectsPath = path.join(distDir, '_redirects')
const assetsIgnorePath = path.join(distDir, '.assetsignore')

if (existsSync(redirectsPath)) {
  unlinkSync(redirectsPath)
  console.log('Removed dist/_redirects (not used on Cloudflare Pages).')
}

writeFileSync(assetsIgnorePath, '_redirects\n', 'utf8')
