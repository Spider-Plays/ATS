/**
 * Wipe all application data and seed minimal QA test dataset.
 * Usage: npm run db:reset-qa [-- --force for production]
 */
import { prisma } from '../lib/prisma.js'
import { env } from '../config/env.js'
import { seedQaData } from './seed-qa-data.js'

const FORCE = process.argv.includes('--force')

async function clearAll() {
  console.log('Clearing all application data...')

  await prisma.$transaction([
    prisma.activityLog.deleteMany(),
    prisma.feedback.deleteMany(),
    prisma.offer.deleteMany(),
    prisma.interview.deleteMany(),
    prisma.interviewPlanStage.deleteMany(),
    prisma.interviewPlan.deleteMany(),
    prisma.candidate.deleteMany(),
    prisma.vendorRequirement.deleteMany(),
    prisma.loginHistory.deleteMany(),
    prisma.vendor.deleteMany(),
    prisma.skillCatalog.deleteMany(),
    prisma.departmentCatalog.deleteMany(),
    prisma.clientCatalog.deleteMany(),
    prisma.interviewPanelLevel.deleteMany(),
    prisma.requirement.deleteMany(),
    prisma.rolePageAccess.deleteMany(),
    prisma.user.deleteMany(),
  ])

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.requirement.count(),
    prisma.candidate.count(),
    prisma.vendor.count(),
  ])

  if (counts.some((n) => n > 0)) {
    throw new Error(`Clear incomplete: users=${counts[0]}, reqs=${counts[1]}, candidates=${counts[2]}, vendors=${counts[3]}`)
  }

  console.log('Database cleared.\n')
}

async function main() {
  if (env.isProduction && !FORCE) {
    console.error(
      'Refusing to reset database in production without --force.\n' +
        '  npm run db:reset-qa -- --force'
    )
    process.exit(1)
  }

  if (env.isProduction && FORCE) {
    console.warn('⚠️  Resetting PRODUCTION database with QA seed data.')
  }

  await clearAll()
  await seedQaData()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
