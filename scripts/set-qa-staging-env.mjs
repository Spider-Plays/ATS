#!/usr/bin/env node
/**
 * Write server/.env.staging from STAGING_DATABASE_URL (Neon qa branch pooled URL).
 *
 * Get the URL from:
 *   - Neon console → Branches → qa (or staging) → Connect → pooled
 *   - Render → stitch-ats-api-staging → Environment → DATABASE_URL
 *
 * Usage (PowerShell):
 *   $env:STAGING_DATABASE_URL="postgresql://..."
 *   npm run env:qa
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const stagingUrl = process.env.STAGING_DATABASE_URL?.trim()
if (!stagingUrl) {
  console.error(
    'Missing STAGING_DATABASE_URL.\n' +
      'Copy the Neon qa branch pooled connection string, then run:\n' +
      '  $env:STAGING_DATABASE_URL="postgresql://..."\n' +
      '  npm run env:qa'
  )
  process.exit(1)
}

if (!stagingUrl.startsWith('postgresql://')) {
  console.error('STAGING_DATABASE_URL must be a postgresql:// URL')
  process.exit(1)
}

const envExamplePath = path.join(root, 'server', '.env.example')
const stagingExamplePath = path.join(root, 'server', '.env.staging.example')
const stagingPath = path.join(root, 'server', '.env.staging')

const templatePath = fs.existsSync(stagingExamplePath)
  ? stagingExamplePath
  : fs.existsSync(envExamplePath)
    ? envExamplePath
    : null

let lines = templatePath ? fs.readFileSync(templatePath, 'utf8').split(/\r?\n/) : []
let replaced = false
lines = lines.map((line) => {
  if (/^DATABASE_URL=/.test(line)) {
    replaced = true
    return `DATABASE_URL="${stagingUrl}"`
  }
  return line
})
if (!replaced) lines.unshift(`DATABASE_URL="${stagingUrl}"`)

fs.writeFileSync(stagingPath, `${lines.join('\n').replace(/\n+$/, '')}\n`, 'utf8')

let host = stagingUrl
try {
  host = new URL(stagingUrl).hostname
} catch {
  /* keep full url hidden */
}

console.log(`Wrote server/.env.staging → ${host}`)
console.log('Start local QA: npm run dev:qa')
