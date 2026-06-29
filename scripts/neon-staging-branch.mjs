#!/usr/bin/env node
/**
 * Create a Neon database branch for QA staging (requires Neon CLI auth).
 *
 * Install auth once:
 *   npx neonctl auth
 *
 * Or set NEON_API_KEY (from Neon console → Account settings → API keys).
 *
 * Usage:
 *   npx neonctl branches create --name staging --parent main
 *   # Copy the new branch connection string, then:
 *   $env:STAGING_DATABASE_URL="postgresql://..."
 *   npm run db:setup-staging
 *
 * This script prints the exact commands for your project if NEON_PROJECT_ID is set.
 */
const projectId = process.env.NEON_PROJECT_ID?.trim()
const branchName = process.env.NEON_STAGING_BRANCH_NAME?.trim() || 'staging'
const parentBranch = process.env.NEON_PARENT_BRANCH?.trim() || 'main'

console.log('Neon QA staging branch setup\n')
console.log('Option A — Neon console (no CLI):')
console.log('  1. Open https://console.neon.tech')
console.log('  2. Project → Branches → Create branch')
console.log(`  3. Name: ${branchName}, parent: ${parentBranch}`)
console.log('  4. Copy pooled connection string → STAGING_DATABASE_URL')
console.log('  5. npm run db:setup-staging\n')

console.log('Option B — Neon CLI:')
if (projectId) {
  console.log(`  npx neonctl branches create --project-id ${projectId} --name ${branchName} --parent ${parentBranch}`)
  console.log(`  npx neonctl connection-string --project-id ${projectId} --branch ${branchName} --pooled`)
} else {
  console.log(`  npx neonctl branches create --name ${branchName} --parent ${parentBranch}`)
  console.log(`  npx neonctl connection-string --branch ${branchName} --pooled`)
}
console.log('\nThen seed the branch:')
console.log('  $env:STAGING_DATABASE_URL="postgresql://..."')
console.log('  $env:QA_ADMIN_PASSWORD="<secure>"')
console.log('  npm run db:setup-staging')
