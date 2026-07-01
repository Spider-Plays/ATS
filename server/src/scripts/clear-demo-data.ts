/**
 * Remove seeded demo / mock data from a non-production database.
 *
 * Deletes:
 *   - All hiring records (requirements, candidates, interviews, offers, business requirements, …)
 *   - Demo vendors (DEMO-STAFFING, DEV-VENDOR)
 *   - Users with @stitch-ats.in emails (dev registry, portal, candidate seeds)
 *
 * Keeps:
 *   - Real QA accounts (non @stitch-ats.in emails)
 *   - qa-admin@stitch-ats.in (override via KEEP_DEMO_CLEAR_EMAILS)
 *   - Role page access, catalogs, app settings
 *
 * Usage (PowerShell):
 *   $env:CONFIRM_DEMO_CLEAR="yes"
 *   npm run db:clear-demo --prefix server
 */
import '../config/loadEnv.js'
import { prisma } from '../lib/prisma.js'
import { env } from '../config/env.js'
import { databaseHostLabel } from '../config/loadEnv.js'
import { DEMO_VENDOR_CODE } from '../config/demoData.js'

const CONFIRM = process.env.CONFIRM_DEMO_CLEAR?.trim().toLowerCase()
const FORCE = process.argv.includes('--force')
const keepEmails = new Set(
  (process.env.KEEP_DEMO_CLEAR_EMAILS ?? 'qa-admin@stitch-ats.in')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
)

function looksProductionDatabase(): boolean {
  const host = process.env.DATABASE_URL ?? ''
  return (
    host.includes('weathered-math') ||
    process.env.RENDER === 'true' ||
    process.env.NODE_ENV === 'production'
  )
}

async function main() {
  if (env.isProduction && !FORCE) {
    console.error('Refusing to clear demo data in production. Pass --force to override.')
    process.exit(1)
  }

  if (looksProductionDatabase() && !FORCE) {
    console.error(
      'Refusing to clear demo data on a production database host.\n' +
        `Target: ${databaseHostLabel() ?? '(unknown)'}\n` +
        'Use server/.env.staging (QA branch) or pass --force if you truly intend to wipe this DB.'
    )
    process.exit(1)
  }

  if (CONFIRM !== 'yes') {
    console.error(
      'Refusing to run without confirmation.\n' +
        'Set CONFIRM_DEMO_CLEAR=yes to proceed.\n' +
        `Target DB: ${databaseHostLabel() ?? '(unknown)'}`
    )
    process.exit(1)
  }

  console.log(`Clearing demo data from ${databaseHostLabel() ?? '(unknown)'}...`)
  if (keepEmails.size > 0) {
    console.log(`Keeping: ${[...keepEmails].join(', ')}`)
  }

  const stitchUsers = await prisma.user.findMany({
    where: {
      email: { endsWith: '@stitch-ats.in' },
      NOT: { email: { in: [...keepEmails] } },
    },
    select: { id: true, email: true },
  })
  const stitchUserIds = stitchUsers.map((u) => u.id)

  await prisma.$transaction([
    prisma.activityLog.deleteMany(),
    prisma.feedback.deleteMany(),
    prisma.offer.deleteMany(),
    prisma.interview.deleteMany(),
    prisma.interviewPlanStage.deleteMany(),
    prisma.interviewPlan.deleteMany(),
    prisma.candidate.deleteMany(),
    prisma.vendorRequirement.deleteMany(),
    prisma.businessRequirement.deleteMany(),
    prisma.requirement.deleteMany(),
    prisma.loginHistory.deleteMany({
      where: stitchUserIds.length > 0 ? { userId: { in: stitchUserIds } } : undefined,
    }),
    prisma.vendor.deleteMany({
      where: { code: { in: [DEMO_VENDOR_CODE, 'DEV-VENDOR'] } },
    }),
    prisma.user.deleteMany({
      where: {
        email: { endsWith: '@stitch-ats.in' },
        NOT: { email: { in: [...keepEmails] } },
      },
    }),
  ])

  const [users, stitchUsersLeft, requirements, candidates, businessReqs, vendors] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { email: { endsWith: '@stitch-ats.in' } } }),
      prisma.requirement.count(),
      prisma.candidate.count(),
      prisma.businessRequirement.count(),
      prisma.vendor.count(),
    ])

  console.log('\nDemo data cleared.')
  console.log(`  Users remaining: ${users} (${stitchUsersLeft} @stitch-ats.in kept)`)
  console.log(`  Requirements: ${requirements}`)
  console.log(`  Candidates: ${candidates}`)
  console.log(`  Business requirements: ${businessReqs}`)
  console.log(`  Vendors: ${vendors}`)
  console.log(`  Removed ${stitchUsers.length} demo @stitch-ats.in user(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
