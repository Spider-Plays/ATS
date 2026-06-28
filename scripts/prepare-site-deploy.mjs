import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const siteDir = path.join(root, 'site')
const apiUrl = 'https://stitch-ats-api-6dd11de4-0043-4523-80ec-1b8755a5d51c.fly.dev'

if (existsSync(siteDir)) rmSync(siteDir, { recursive: true, force: true })
mkdirSync(siteDir, { recursive: true })

cpSync(path.join(root, 'dist'), siteDir, { recursive: true })

const vercel = {
  installCommand: 'echo "static site"',
  buildCommand: 'echo "static site"',
  outputDirectory: '.',
  rewrites: [
    { source: '/api/(.*)', destination: `${apiUrl}/api/$1` },
    { source: '/(.*)', destination: '/index.html' },
  ],
}

import { writeFileSync } from 'node:fs'
writeFileSync(path.join(siteDir, 'vercel.json'), JSON.stringify(vercel, null, 2))

console.log('Prepared site/ for InsForge static deployment.')
