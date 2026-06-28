import { existsSync, unlinkSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const redirectsPath = path.join(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  'dist',
  '_redirects'
)

if (existsSync(redirectsPath)) {
  unlinkSync(redirectsPath)
  console.log('Removed dist/_redirects (not supported on Cloudflare Workers).')
}
