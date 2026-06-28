import { execSync } from 'node:child_process'
import { existsSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')
const redirectsPath = path.join(distDir, '_redirects')
const assetsIgnorePath = path.join(distDir, '.assetsignore')

// Cloudflare build cache can restore an old dist/ that still contains _redirects.
rmSync(distDir, { recursive: true, force: true })

execSync('vite build', { cwd: root, stdio: 'inherit' })

if (existsSync(redirectsPath)) {
  unlinkSync(redirectsPath)
  console.log('Removed dist/_redirects (not used on Cloudflare Pages).')
}

writeFileSync(assetsIgnorePath, '_redirects\n', 'utf8')
