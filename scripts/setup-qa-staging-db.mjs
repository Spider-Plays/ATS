#!/usr/bin/env node
/**
 * One-time QA staging database setup against a Neon branch.
 *
 * Prerequisites:
 *   1. Create a Neon branch (e.g. "staging") in the Neon console.
 *   2. Export STAGING_DATABASE_URL with the branch pooled connection string.
 *
 * Usage (PowerShell):
 *   $env:STAGING_DATABASE_URL="postgresql://..."
 *   npm run db:setup-staging
 *
 * Optional bootstrap admin (defaults shown):
 *   $env:QA_ADMIN_EMAIL="qa-admin@stitch-ats.in"
 *   $env:QA_ADMIN_PASSWORD="<secure-password>"
 *   $env:QA_ADMIN_NAME="QA Admin"
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const serverDir = path.join(root, 'server')

const stagingUrl = process.env.STAGING_DATABASE_URL?.trim()
if (!stagingUrl) {
  console.error(
    'Missing STAGING_DATABASE_URL.\n' +
      'Create a Neon staging branch, then run:\n' +
      '  $env:STAGING_DATABASE_URL="postgresql://..."\n' +
      '  npm run db:setup-staging'
  )
  process.exit(1)
}

const env = {
  ...process.env,
  DATABASE_URL: stagingUrl,
}

function run(label, args, extraEnv = {}) {
  console.log(`\n→ ${label}`)
  const result = spawnSync('npm', args, {
    cwd: serverDir,
    env: { ...env, ...extraEnv },
    stdio: 'inherit',
    shell: true,
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

console.log('QA staging database setup')
console.log('Target: Neon staging branch (STAGING_DATABASE_URL)')

run('Apply schema', ['run', 'db:push:schema'])

const adminEmail = process.env.QA_ADMIN_EMAIL?.trim() || 'qa-admin@stitch-ats.in'
const adminPassword = process.env.QA_ADMIN_PASSWORD?.trim()
const adminName = process.env.QA_ADMIN_NAME?.trim() || 'QA Admin'

if (adminPassword) {
  run('Bootstrap QA admin', ['run', 'db:bootstrap'], {
    ADMIN_EMAIL: adminEmail,
    ADMIN_PASSWORD: adminPassword,
    ADMIN_NAME: adminName,
    ADMIN_ROLE: 'SUPER_ADMIN',
  })
} else {
  console.log(
    '\nSkipping db:bootstrap (set QA_ADMIN_PASSWORD to create qa-admin@stitch-ats.in).'
  )
}

run('Seed demo dataset', ['run', 'db:seed-demo'])

console.log('\nDone. Demo staff passwords use DEV_PASSWORD from server seed (default: "password").')
console.log('See server/src/config/devUsers.registry.json for role emails.')
